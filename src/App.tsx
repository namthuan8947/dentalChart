import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Download,
  FileText,
  Palette,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { DentalChartSvg } from './components/DentalChartSvg';
import { ExportModal } from './components/ExportModal';
import { LegendModal } from './components/LegendModal';
import { ModalTab, ToothConditionModal } from './components/ToothConditionModal';
import { DECIDUOUS_TEETH, PERMANENT_TEETH } from './data/dentalConditions';
import {
  DentitionType,
  InterdentalGap,
  JawType,
  SpanAnnotation,
  ToothAnnotation,
  ToothMeta,
} from './types/dental';
import {
  DEFAULT_EXPORT_OPTIONS,
  copyPngBlobToClipboard,
  renderSvgToPngBlob,
} from './utils/exportPng';

const STORAGE_KEY = 'dental-chart-state-v1';

interface SavedChartState {
  showPermanent?: boolean;
  showDeciduous?: boolean;
  annotations?: Record<string, ToothAnnotation>;
  gaps?: InterdentalGap[];
  spans?: SpanAnnotation[];
  generalNote?: string;
  toothColor?: string;
  annotationColor?: string;
  uiZoom?: number;
}

function loadSavedState(): SavedChartState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function App() {
  const [initialState] = useState<SavedChartState>(() => loadSavedState());

  const [showPermanent, setShowPermanent] = useState(
    initialState.showPermanent ?? true
  );
  const [showDeciduous, setShowDeciduous] = useState(
    initialState.showDeciduous ?? false
  );

  const [annotations, setAnnotations] = useState<
    Record<string, ToothAnnotation>
  >(initialState.annotations ?? {});
  const [gaps, setGaps] = useState<InterdentalGap[]>(initialState.gaps ?? []);
  const [spans, setSpans] = useState<SpanAnnotation[]>(
    initialState.spans ?? []
  );
  const [generalNote, setGeneralNote] = useState(
    initialState.generalNote ?? ''
  );

  const [modalState, setModalState] = useState<{
    tooth: ToothMeta;
    initialTab?: ModalTab;
    gapNeighborFdi?: string;
  } | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [showColorEditor, setShowColorEditor] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toothColor, setToothColor] = useState(
    initialState.toothColor ?? '#111827'
  );
  const [annotationColor, setAnnotationColor] = useState(
    initialState.annotationColor ?? '#1D4ED8'
  );
  const [copiedQuick, setCopiedQuick] = useState(false);
  const [uiZoom, setUiZoom] = useState<number>(initialState.uiZoom ?? 1);

  useEffect(() => {
    document.documentElement.style.zoom = uiZoom === 1 ? '' : String(uiZoom);
    return () => {
      document.documentElement.style.zoom = '';
    };
  }, [uiZoom]);

  useEffect(() => {
    try {
      const payload: SavedChartState = {
        showPermanent,
        showDeciduous,
        annotations,
        gaps,
        spans,
        generalNote,
        toothColor,
        annotationColor,
        uiZoom,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota or private-mode errors
    }
  }, [
    showPermanent,
    showDeciduous,
    annotations,
    gaps,
    spans,
    generalNote,
    toothColor,
    annotationColor,
    uiZoom,
  ]);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleTogglePermanent = (checked: boolean) => {
    if (!checked && !showDeciduous) return;
    setShowPermanent(checked);
  };

  const handleToggleDeciduous = (checked: boolean) => {
    if (!checked && !showPermanent) return;
    setShowDeciduous(checked);
  };

  const handleConfirmSingle = (fdi: string, annotation: ToothAnnotation) => {
    setAnnotations((prev) => {
      const next = { ...prev };
      const ids = annotation.conditionIds ?? (annotation.conditionId ? [annotation.conditionId] : ['normal']);
      if (ids.length === 0 || (ids.length === 1 && ids[0] === 'normal')) {
        delete next[fdi];
      } else {
        next[fdi] = annotation;
      }
      return next;
    });
  };

  const handleSaveGap = (gap: InterdentalGap) => {
    setGaps((prev) => {
      const filtered = prev.filter((g) => g.id !== gap.id);
      return [...filtered, gap];
    });
  };

  const handleDeleteGap = (id: string) => {
    setGaps((prev) => prev.filter((g) => g.id !== id));
  };

  const handleSaveSpan = (span: SpanAnnotation, ponticFdis: string[]) => {
    setSpans((prev) => {
      const filtered = prev.filter((s) => s.id !== span.id);
      return [...filtered, span];
    });
    // For bridges (#26-#28), automatically mark pontic teeth as 'missing' (X)
    if (span.type === 'bridge' && ponticFdis.length > 0) {
      setAnnotations((prev) => {
        const next = { ...prev };
        for (const fdi of ponticFdis) {
          next[fdi] = { conditionId: 'missing' };
        }
        return next;
      });
    }
  };

  const handleDeleteSpan = (id: string) => {
    setSpans((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSelectGapDirect = (
    _dentition: DentitionType,
    _jaw: JawType,
    leftTooth: ToothMeta,
    rightTooth: ToothMeta
  ) => {
    setModalState({
      tooth: leftTooth,
      initialTab: 'gap',
      gapNeighborFdi: rightTooth.fdi,
    });
  };

  const handleReset = () => {
    setAnnotations({});
    setGaps([]);
    setSpans([]);
    setGeneralNote('');
    setModalState(null);
    setShowResetConfirm(false);
  };

  const handleQuickCopyPng = async () => {
    if (!svgRef.current) return;
    try {
      const blob = await renderSvgToPngBlob(
        svgRef.current,
        DEFAULT_EXPORT_OPTIONS
      );
      await copyPngBlobToClipboard(blob);
      setCopiedQuick(true);
      setTimeout(() => setCopiedQuick(false), 2000);
    } catch {
      // Fallback: open export modal where user can see any clipboard message
      setShowExportModal(true);
    }
  };

  const annotatedCount =
    Object.keys(annotations).length +
    gaps.length +
    spans.length +
    (generalNote.trim() ? 1 : 0);

  const hasVisibleTooth = (fdi: string) => {
    if (showPermanent && PERMANENT_TEETH.some((t) => t.fdi === fdi)) return true;
    if (showDeciduous && DECIDUOUS_TEETH.some((t) => t.fdi === fdi)) return true;
    return false;
  };

  const activeSelectedFdi =
    modalState?.tooth && hasVisibleTooth(modalState.tooth.fdi)
      ? modalState.tooth.fdi
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9] text-slate-900">
      {/* Compact Top Toolbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-3 py-2.5 sm:px-6 sm:py-3 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
          {/* Row 1 on mobile: Title + Primary Actions */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                Sơ đồ răng
              </h1>
              {annotatedCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200">
                  {annotatedCount}
                </span>
              )}
            </div>

            {/* Mobile-only compact action buttons */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <button
                type="button"
                onClick={() => setShowLegend(true)}
                className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800 active:bg-slate-100"
              >
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span>Chú giải</span>
              </button>
              <button
                type="button"
                onClick={handleQuickCopyPng}
                className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800 active:bg-slate-100"
                title="Copy ảnh sơ đồ răng"
              >
                {copiedQuick ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-600" />
                )}
                <span>{copiedQuick ? 'Đã copy' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="inline-flex min-h-[40px] items-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-xs active:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>

            {/* Desktop Dentition Toggles */}
            <div
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1"
              role="group"
              aria-label="Chọn loại sơ đồ răng"
            >
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  showPermanent
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <input
                  type="checkbox"
                  checked={showPermanent}
                  onChange={(e) => handleTogglePermanent(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Răng người lớn</span>
              </label>

              <label
                className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  showDeciduous
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <input
                  type="checkbox"
                  checked={showDeciduous}
                  onChange={(e) => handleToggleDeciduous(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Răng trẻ em</span>
              </label>
            </div>
          </div>

          {/* Row 2 on mobile: Dentition Toggles + Note + Reset */}
          <div className="flex items-center justify-between gap-2 sm:hidden">
            <div
              className="flex flex-1 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
              role="group"
              aria-label="Chọn loại sơ đồ răng"
            >
              <label
                className={`flex flex-1 min-h-[36px] cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition ${
                  showPermanent
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={showPermanent}
                  onChange={(e) => handleTogglePermanent(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
                />
                <span>Người lớn</span>
              </label>

              <label
                className={`flex flex-1 min-h-[36px] cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition ${
                  showDeciduous
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={showDeciduous}
                  onChange={(e) => handleToggleDeciduous(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
                />
                <span>Trẻ em</span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => setShowColorEditor((v) => !v)}
              className={`inline-flex min-h-[38px] items-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition ${
                showColorEditor
                  ? 'border-blue-300 bg-blue-50 text-blue-800'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
              title="Đổi màu răng và màu ghi chú"
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Màu</span>
            </button>

            <button
              type="button"
              onClick={() => setShowNoteEditor((v) => !v)}
              className={`inline-flex min-h-[38px] items-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition ${
                showNoteEditor || generalNote.trim()
                  ? 'border-blue-300 bg-blue-50 text-blue-800'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Ghi chú</span>
            </button>

            <div
              className="inline-flex min-h-[38px] items-center rounded-lg border border-slate-300 bg-white px-0.5"
              role="group"
              aria-label="Thu phóng giao diện"
            >
              <button
                type="button"
                onClick={() =>
                  setUiZoom((z) => Math.max(0.7, Number((z - 0.1).toFixed(2))))
                }
                disabled={uiZoom <= 0.7}
                className="flex h-8 w-7 items-center justify-center rounded text-slate-700 disabled:opacity-40"
                title="Thu nhỏ giao diện"
                aria-label="Thu nhỏ giao diện"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setUiZoom(1)}
                className="px-1 text-[11px] font-semibold tabular-nums text-slate-700"
                title="Đưa về 100%"
              >
                {Math.round(uiZoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() =>
                  setUiZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))
                }
                disabled={uiZoom >= 1.5}
                className="flex h-8 w-7 items-center justify-center rounded text-slate-700 disabled:opacity-40"
                title="Phóng to giao diện"
                aria-label="Phóng to giao diện"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            {annotatedCount > 0 && (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 text-xs font-semibold text-rose-700 shadow-xs transition active:bg-rose-100"
                title="Đặt lại toàn bộ sơ đồ"
                aria-label="Đặt lại"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <div
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white p-0.5"
              role="group"
              aria-label="Thu phóng giao diện"
            >
              <button
                type="button"
                onClick={() =>
                  setUiZoom((z) => Math.max(0.7, Number((z - 0.1).toFixed(2))))
                }
                disabled={uiZoom <= 0.7}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
                title="Thu nhỏ giao diện"
                aria-label="Thu nhỏ giao diện"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setUiZoom(1)}
                className="min-w-[48px] px-1.5 py-1 text-center text-xs font-semibold tabular-nums text-slate-700 transition hover:text-blue-700"
                title="Đưa giao diện về 100%"
              >
                {Math.round(uiZoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() =>
                  setUiZoom((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))
                }
                disabled={uiZoom >= 1.5}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
                title="Phóng to giao diện"
                aria-label="Phóng to giao diện"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowColorEditor((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                showColorEditor
                  ? 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="Đổi màu số răng và màu ghi chú"
            >
              <Palette className="h-4 w-4" />
              <span>Màu sắc</span>
            </button>

            <button
              type="button"
              onClick={() => setShowNoteEditor((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                showNoteEditor || generalNote.trim()
                  ? 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Ghi chú</span>
            </button>

            {annotatedCount > 0 && (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 shadow-xs transition hover:bg-rose-100"
                title="Xóa tất cả ký hiệu đã ghi"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Đặt lại</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowLegend(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span>Chú giải</span>
            </button>

            <button
              type="button"
              onClick={handleQuickCopyPng}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              title="Copy ảnh sơ đồ răng không nền vào clipboard"
            >
              {copiedQuick ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">Đã copy!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-600" />
                  <span>Copy ảnh</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Optional Color Settings Drawer */}
        {showColorEditor && (
          <div className="border-t border-slate-200 bg-slate-50/80">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Màu răng:
                </span>
                <div className="flex items-center gap-1.5">
                  {['#111827', '#334155', '#1E293B', '#7C2D12'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setToothColor(c)}
                      className={`h-5 w-5 rounded-full border-2 transition ${
                        toothColor.toLowerCase() === c.toLowerCase()
                          ? 'scale-110 border-blue-600 ring-2 ring-blue-200'
                          : 'border-white shadow-xs'
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`Màu răng ${c}`}
                    />
                  ))}
                  <input
                    type="color"
                    value={toothColor}
                    onChange={(e) => setToothColor(e.target.value)}
                    className="h-6 w-7 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
                    aria-label="Chọn màu răng tùy chỉnh"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Màu ghi chú:
                </span>
                <div className="flex items-center gap-1.5">
                  {['#1D4ED8', '#DC2626', '#059669', '#7C3AED', '#111827'].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAnnotationColor(c)}
                        className={`h-5 w-5 rounded-full border-2 transition ${
                          annotationColor.toLowerCase() === c.toLowerCase()
                            ? 'scale-110 border-blue-600 ring-2 ring-blue-200'
                            : 'border-white shadow-xs'
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Màu ghi chú ${c}`}
                      />
                    )
                  )}
                  <input
                    type="color"
                    value={annotationColor}
                    onChange={(e) => setAnnotationColor(e.target.value)}
                    className="h-6 w-7 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
                    aria-label="Chọn màu ghi chú tùy chỉnh"
                  />
                </div>
              </div>

              {(toothColor !== '#111827' || annotationColor !== '#1D4ED8') && (
                <button
                  type="button"
                  onClick={() => {
                    setToothColor('#111827');
                    setAnnotationColor('#1D4ED8');
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900"
                >
                  Mặc định
                </button>
              )}
            </div>
          </div>
        )}

        {/* Optional General Note Drawer (#38) */}
        {showNoteEditor && (
          <div className="border-t border-slate-200 bg-slate-50/80">
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
              <label
                htmlFor="general-note-input"
                className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Ghi chú chung:
              </label>
              <input
                id="general-note-input"
                type="text"
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
                placeholder="VD: Nhiễm fluoride toàn hàm, tụt nướu vùng răng cửa dưới..."
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {generalNote && (
                <button
                  type="button"
                  onClick={() => setGeneralNote('')}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Stage: Focus on the Dental Chart */}
      <main className="flex-1 flex flex-col items-center justify-center px-3 py-4 sm:px-6 sm:py-6">
        <div className="w-full max-w-[1000px] rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-8 shadow-sm">
          <div className="w-full overflow-x-auto sm:overflow-visible">
            <DentalChartSvg
              svgRef={svgRef}
              showPermanent={showPermanent}
              showDeciduous={showDeciduous}
              annotations={annotations}
              gaps={gaps}
              spans={spans}
              generalNote={generalNote}
              selectedFdi={activeSelectedFdi}
              onSelectTooth={(tooth) =>
                setModalState({ tooth, initialTab: 'single' })
              }
              onSelectGap={handleSelectGapDirect}
              toothColor={toothColor}
              annotationColor={annotationColor}
              className="block mx-auto w-full max-w-[960px] h-auto select-none"
            />
          </div>
        </div>

        {/* Subtle interaction hint */}
        <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center text-xs text-slate-500">
          <span>Nhấn vào từng răng để chọn tình trạng và xác nhận</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">
            Nhấn vào khoảng giữa 2 răng để ghi khe hở (mm)
          </span>
          <span className="hidden sm:inline">·</span>
          <span>Export hỗ trợ PNG không nền hoặc có nền & bo viền</span>
        </div>
      </main>

      {/* Tooth Condition Selection Modal */}
      {modalState && (
        <ToothConditionModal
          tooth={modalState.tooth}
          initialTab={modalState.initialTab}
          initialGapNeighborFdi={modalState.gapNeighborFdi}
          currentAnnotation={annotations[modalState.tooth.fdi]}
          existingGaps={gaps}
          existingSpans={spans}
          onConfirmSingle={handleConfirmSingle}
          onSaveGap={handleSaveGap}
          onDeleteGap={handleDeleteGap}
          onSaveSpan={handleSaveSpan}
          onDeleteSpan={handleDeleteSpan}
          onClose={() => setModalState(null)}
          toothColor={toothColor}
          annotationColor={annotationColor}
        />
      )}

      {/* Legend Modal (Chú giải) */}
      {showLegend && <LegendModal onClose={() => setShowLegend(false)} />}

      {/* Export Preview & Settings Modal */}
      {showExportModal && (
        <ExportModal
          svgRef={svgRef}
          toothColor={toothColor}
          annotationColor={annotationColor}
          onChangeToothColor={setToothColor}
          onChangeAnnotationColor={setAnnotationColor}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Xác nhận đặt lại sơ đồ răng?
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Toàn bộ tình trạng răng, khe hở, cầu răng, chen chúc và ghi chú chung hiện tại sẽ bị xóa. Hành động này không thể hoàn tác.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="min-h-[40px] rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-rose-700"
              >
                Xác nhận đặt lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
