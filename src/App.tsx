import { useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Download,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { DentalChartSvg } from './components/DentalChartSvg';
import { ExportModal } from './components/ExportModal';
import { LegendModal } from './components/LegendModal';
import { ToothConditionModal } from './components/ToothConditionModal';
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

export function App() {
  const [showPermanent, setShowPermanent] = useState(true);
  const [showDeciduous, setShowDeciduous] = useState(false);

  const [annotations, setAnnotations] = useState<
    Record<string, ToothAnnotation>
  >({});
  const [gaps, setGaps] = useState<InterdentalGap[]>([]);
  const [spans, setSpans] = useState<SpanAnnotation[]>([]);
  const [generalNote, setGeneralNote] = useState('');

  const [selectedTooth, setSelectedTooth] = useState<ToothMeta | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [copiedQuick, setCopiedQuick] = useState(false);

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
    dentition: DentitionType,
    jaw: JawType,
    leftTooth: ToothMeta,
    rightTooth: ToothMeta
  ) => {
    const existing = gaps.find(
      (g) => g.leftToothFdi === leftTooth.fdi && g.rightToothFdi === rightTooth.fdi
    );
    const input = window.prompt(
      `Nhập khoảng cách khe hở (mm) giữa răng ${leftTooth.display} và ${rightTooth.display} (để trống để xóa):`,
      existing?.distanceMm ?? '2'
    );
    if (input === null) return;
    const trimmed = input.trim();
    const id = `gap-${leftTooth.fdi}-${rightTooth.fdi}`;
    if (!trimmed) {
      handleDeleteGap(id);
    } else {
      handleSaveGap({
        id,
        dentition,
        jaw,
        leftToothFdi: leftTooth.fdi,
        rightToothFdi: rightTooth.fdi,
        distanceMm: trimmed,
      });
    }
  };

  const handleReset = () => {
    setAnnotations({});
    setGaps([]);
    setSpans([]);
    setGeneralNote('');
    setSelectedTooth(null);
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
    Object.keys(annotations).length + gaps.length + spans.length;

  const hasVisibleTooth = (fdi: string) => {
    if (showPermanent && PERMANENT_TEETH.some((t) => t.fdi === fdi)) return true;
    if (showDeciduous && DECIDUOUS_TEETH.some((t) => t.fdi === fdi)) return true;
    return false;
  };

  const activeSelectedFdi =
    selectedTooth && hasVisibleTooth(selectedTooth.fdi)
      ? selectedTooth.fdi
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9] text-slate-900">
      {/* Compact Top Toolbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Title & Dentition Toggles */}
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Sơ đồ răng
            </h1>

            <div
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1"
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

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
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
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                title="Xóa tất cả ký hiệu đã ghi"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Đặt lại</span>
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

        {/* Optional General Note Drawer (#38) */}
        {showNoteEditor && (
          <div className="border-t border-slate-200 bg-slate-50/80">
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
              <label
                htmlFor="general-note-input"
                className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Ghi chú chung (#38):
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
      <main className="flex-1 flex flex-col items-center justify-center px-3 py-6 sm:px-6">
        <div className="w-full max-w-[1000px] rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-8 shadow-sm">
          <div className="flex justify-center">
            <DentalChartSvg
              svgRef={svgRef}
              showPermanent={showPermanent}
              showDeciduous={showDeciduous}
              annotations={annotations}
              gaps={gaps}
              spans={spans}
              generalNote={generalNote}
              selectedFdi={activeSelectedFdi}
              onSelectTooth={(tooth) => setSelectedTooth(tooth)}
              onSelectGap={handleSelectGapDirect}
            />
          </div>
        </div>

        {/* Subtle interaction hint */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-slate-500">
          <span>Nhấn vào từng răng để chọn tình trạng và xác nhận</span>
          <span className="hidden sm:inline">·</span>
          <span>Nhấn vào khoảng giữa 2 răng để ghi khe hở (mm)</span>
          <span className="hidden sm:inline">·</span>
          <span>Export xuất ảnh PNG không nền (nền trong suốt)</span>
        </div>
      </main>

      {/* Tooth Condition Selection Modal */}
      {selectedTooth && (
        <ToothConditionModal
          tooth={selectedTooth}
          currentAnnotation={annotations[selectedTooth.fdi]}
          existingGaps={gaps}
          existingSpans={spans}
          onConfirmSingle={handleConfirmSingle}
          onSaveGap={handleSaveGap}
          onDeleteGap={handleDeleteGap}
          onSaveSpan={handleSaveSpan}
          onDeleteSpan={handleDeleteSpan}
          onClose={() => setSelectedTooth(null)}
        />
      )}

      {/* Legend Modal (Chú giải) */}
      {showLegend && <LegendModal onClose={() => setShowLegend(false)} />}

      {/* Export Preview & Settings Modal */}
      {showExportModal && (
        <ExportModal
          svgRef={svgRef}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}

export default App;
