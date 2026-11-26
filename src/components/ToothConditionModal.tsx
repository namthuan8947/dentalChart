import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Search, Trash2, X } from 'lucide-react';
import {
  CATEGORY_LABELS,
  DECIDUOUS_TEETH,
  LEGEND_ITEMS,
  PERMANENT_TEETH,
  getToothLabel,
} from '../data/dentalConditions';
import {
  CariesPosition,
  DirectionOption,
  InterdentalGap,
  SingleConditionId,
  SpanAnnotation,
  TempMaterial,
  TiltDirection,
  ToothAnnotation,
  ToothMeta,
} from '../types/dental';
import { ToothSymbolSvg } from './ToothSymbolSvg';

interface ToothConditionModalProps {
  tooth: ToothMeta;
  currentAnnotation?: ToothAnnotation;
  existingGaps: InterdentalGap[];
  existingSpans: SpanAnnotation[];
  onConfirmSingle: (fdi: string, annotation: ToothAnnotation) => void;
  onSaveGap: (gap: InterdentalGap) => void;
  onDeleteGap: (id: string) => void;
  onSaveSpan: (span: SpanAnnotation, ponticFdis: string[]) => void;
  onDeleteSpan: (id: string) => void;
  onClose: () => void;
}

type ModalTab = 'single' | 'gap' | 'span';

export const ToothConditionModal: React.FC<ToothConditionModalProps> = ({
  tooth,
  currentAnnotation,
  existingGaps,
  existingSpans,
  onConfirmSingle,
  onSaveGap,
  onDeleteGap,
  onSaveSpan,
  onDeleteSpan,
  onClose,
}) => {
  const [tab, setTab] = useState<ModalTab>('single');
  const [search, setSearch] = useState('');

  // Single-tooth multi-select state
  const [selectedConditions, setSelectedConditions] = useState<
    SingleConditionId[]
  >(() => {
    if (
      currentAnnotation?.conditionIds &&
      currentAnnotation.conditionIds.length > 0
    ) {
      return currentAnnotation.conditionIds;
    }
    if (currentAnnotation?.conditionId) {
      return [currentAnnotation.conditionId];
    }
    return ['normal'];
  });

  const [expandedSubOption, setExpandedSubOption] =
    useState<SingleConditionId | null>(null);

  const hasSubOptions = (id: SingleConditionId) =>
    id === 'tilt' ||
    id === 'deviated' ||
    id === 'caries_no_restore' ||
    id === 'caries_restore' ||
    id === 'temp_filling';

  const toggleCondition = (id: SingleConditionId) => {
    if (id === 'normal') {
      setSelectedConditions(['normal']);
      setExpandedSubOption(null);
      return;
    }
    const isCurrentlySelected = selectedConditions.includes(id);
    setSelectedConditions((prev) => {
      const withoutNormal = prev.filter((c) => c !== 'normal');
      const exists = withoutNormal.includes(id);
      const next = exists
        ? withoutNormal.filter((c) => c !== id)
        : [...withoutNormal, id];
      return next.length > 0 ? next : ['normal'];
    });
    if (!isCurrentlySelected && hasSubOptions(id)) {
      setExpandedSubOption(id);
    } else if (isCurrentlySelected && expandedSubOption === id) {
      setExpandedSubOption(null);
    }
  };

  const getSubOptionButtonLabel = (id: SingleConditionId): string => {
    switch (id) {
      case 'tilt':
        return `Hướng: ${tiltDirection === 'left' ? '←' : '→'}`;
      case 'deviated':
        return `Vị trí: lệch ${deviationDirection}`;
      case 'caries_no_restore':
      case 'caries_restore': {
        const short = cariesPositions
          .map((p) => (p === 'occlusal' ? 'Nhai' : p))
          .join(', ');
        return `Vị trí: ${short}`;
      }
      case 'temp_filling':
        return `Vật liệu: ${tempMaterial}`;
      default:
        return 'Tùy chọn';
    }
  };
  const [tiltDirection, setTiltDirection] = useState<TiltDirection>(
    currentAnnotation?.tiltDirection ?? 'right'
  );
  const [deviationDirection, setDeviationDirection] = useState<DirectionOption>(
    currentAnnotation?.deviationDirection ?? 'G'
  );
  const [cariesPositions, setCariesPositions] = useState<CariesPosition[]>(
    currentAnnotation?.cariesPositions && currentAnnotation.cariesPositions.length > 0
      ? currentAnnotation.cariesPositions
      : [currentAnnotation?.cariesPosition ?? 'occlusal']
  );
  const [tempMaterial, setTempMaterial] = useState<TempMaterial>(
    currentAnnotation?.tempMaterial ?? 'Cav, Eu'
  );

  // Row teeth for gap / span
  const rowTeeth = useMemo(() => {
    const list =
      tooth.dentition === 'permanent' ? PERMANENT_TEETH : DECIDUOUS_TEETH;
    return list
      .filter((t) => t.jaw === tooth.jaw)
      .sort((a, b) => a.indexInRow - b.indexInRow);
  }, [tooth]);

  // Gap state (#11)
  const rightNeighbor = rowTeeth.find(
    (t) => t.indexInRow === tooth.indexInRow + 1
  );
  const leftNeighbor = rowTeeth.find(
    (t) => t.indexInRow === tooth.indexInRow - 1
  );
  const defaultNeighbor = rightNeighbor || leftNeighbor;
  const [gapNeighborFdi, setGapNeighborFdi] = useState<string>(
    defaultNeighbor?.fdi ?? ''
  );
  const [gapMm, setGapMm] = useState<string>('2');

  // Span state (#25-28 Bridge / #36 Crowding)
  const [spanType, setSpanType] = useState<'bridge' | 'crowding'>('bridge');
  const [spanEndFdi, setSpanEndFdi] = useState<string>(
    rightNeighbor?.fdi ?? leftNeighbor?.fdi ?? tooth.fdi
  );
  const [ponticFdis, setPonticFdis] = useState<string[]>([]);

  const singleConditions = useMemo(
    () => LEGEND_ITEMS.filter((item) => item.kind === 'single' && item.conditionId),
    []
  );

  const filteredConditions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return singleConditions;
    return singleConditions.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.note.toLowerCase().includes(q) ||
        String(c.stt) === q
    );
  }, [search, singleConditions]);

  const groupedConditions = useMemo(() => {
    const groups: Record<string, typeof filteredConditions> = {};
    for (const item of filteredConditions) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filteredConditions]);

  const toggleCariesPosition = (pos: CariesPosition) => {
    setCariesPositions((prev) => {
      if (prev.includes(pos)) {
        return prev.length > 1 ? prev.filter((p) => p !== pos) : prev;
      }
      return [...prev, pos];
    });
  };

  const previewAnnotation: ToothAnnotation = {
    conditionId: selectedConditions[0] ?? 'normal',
    conditionIds: selectedConditions,
    tiltDirection,
    deviationDirection,
    cariesPosition: cariesPositions[0],
    cariesPositions,
    tempMaterial,
  };

  const spanRangeTeeth = useMemo(() => {
    const endTooth = rowTeeth.find((t) => t.fdi === spanEndFdi) ?? tooth;
    const minIdx = Math.min(tooth.indexInRow, endTooth.indexInRow);
    const maxIdx = Math.max(tooth.indexInRow, endTooth.indexInRow);
    return rowTeeth.filter(
      (t) => t.indexInRow >= minIdx && t.indexInRow <= maxIdx
    );
  }, [rowTeeth, spanEndFdi, tooth]);

  const relatedGaps = existingGaps.filter(
    (g) => g.leftToothFdi === tooth.fdi || g.rightToothFdi === tooth.fdi
  );

  const relatedSpans = existingSpans.filter(
    (s) =>
      s.dentition === tooth.dentition &&
      s.jaw === tooth.jaw &&
      tooth.indexInRow >= s.startIndex &&
      tooth.indexInRow <= s.endIndex
  );

  const handleConfirm = () => {
    if (tab === 'single') {
      onConfirmSingle(tooth.fdi, previewAnnotation);
      onClose();
      return;
    }

    if (tab === 'gap') {
      const neighbor = rowTeeth.find((t) => t.fdi === gapNeighborFdi);
      if (!neighbor) return;
      const left = tooth.indexInRow < neighbor.indexInRow ? tooth : neighbor;
      const right = tooth.indexInRow < neighbor.indexInRow ? neighbor : tooth;
      onSaveGap({
        id: `gap-${left.fdi}-${right.fdi}`,
        dentition: tooth.dentition,
        jaw: tooth.jaw,
        leftToothFdi: left.fdi,
        rightToothFdi: right.fdi,
        distanceMm: gapMm.trim() || '2',
      });
      onClose();
      return;
    }

    if (tab === 'span') {
      const endTooth = rowTeeth.find((t) => t.fdi === spanEndFdi) ?? tooth;
      const startIndex = Math.min(tooth.indexInRow, endTooth.indexInRow);
      const endIndex = Math.max(tooth.indexInRow, endTooth.indexInRow);
      if (startIndex === endIndex) return;

      const ponticIndices =
        spanType === 'bridge'
          ? spanRangeTeeth
              .filter((t) => ponticFdis.includes(t.fdi))
              .map((t) => t.indexInRow)
          : [];

      onSaveSpan(
        {
          id: `span-${spanType}-${tooth.dentition}-${tooth.jaw}-${startIndex}-${endIndex}`,
          type: spanType,
          dentition: tooth.dentition,
          jaw: tooth.jaw,
          startIndex,
          endIndex,
          ponticIndices,
        },
        spanType === 'bridge' ? ponticFdis : []
      );
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/45 p-0 sm:p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex h-[92dvh] sm:h-auto sm:max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl sm:rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0 pr-2">
            <h2 className="text-base font-semibold text-slate-900">
              Chọn tình trạng răng
            </h2>
            <p className="mt-0.5 truncate text-xs sm:text-sm text-slate-600">
              {getToothLabel(tooth)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex shrink-0 overflow-x-auto border-b border-slate-200 bg-slate-50/70 px-4 sm:px-5 pt-1 gap-2">
          <button
            type="button"
            onClick={() => setTab('single')}
            className={`whitespace-nowrap border-b-2 px-2.5 py-2 text-xs sm:text-sm font-medium transition ${
              tab === 'single'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Tình trạng răng đơn
          </button>
          <button
            type="button"
            onClick={() => setTab('gap')}
            className={`whitespace-nowrap border-b-2 px-2.5 py-2 text-xs sm:text-sm font-medium transition ${
              tab === 'gap'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Khe hở (#11)
          </button>
          <button
            type="button"
            onClick={() => setTab('span')}
            className={`whitespace-nowrap border-b-2 px-2.5 py-2 text-xs sm:text-sm font-medium transition ${
              tab === 'span'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Cầu răng (#25–28) & Chen chúc (#36)
          </button>
        </div>

        {/* Body */}
        {tab === 'single' ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Pinned Top Section: Live Preview & Search */}
            <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-2.5 sm:px-5 sm:py-3 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.08)]">
              <div className="flex flex-row items-center gap-2.5 sm:gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2 sm:p-2.5">
                <div className="flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-0.5 sm:px-4 sm:py-1 shrink-0">
                  <svg
                    width="64"
                    height="56"
                    viewBox="-40 -34 80 68"
                    className="sm:w-[80px] sm:h-[68px]"
                  >
                    <ToothSymbolSvg
                      display={tooth.display}
                      jaw={tooth.jaw}
                      side={tooth.side}
                      annotation={previewAnnotation}
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tìm tình trạng hoặc STT..."
                      className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <p className="hidden sm:block text-xs text-slate-500">
                    {tooth.jaw === 'upper'
                      ? 'Hàm trên: ký hiệu và chữ sẽ tự động đặt bên trên số răng.'
                      : 'Hàm dưới: ký hiệu và chữ sẽ tự động đặt bên dưới số răng.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Condition List with Inline Sub-options */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {Object.entries(groupedConditions).map(([category, items]) => (
                <div key={category}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {
                      CATEGORY_LABELS[
                        category as keyof typeof CATEGORY_LABELS
                      ]
                    }
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {items.map((item) => {
                      const condId = item.conditionId!;
                      const active = selectedConditions.includes(condId);
                      const supportsSub = hasSubOptions(condId);
                      const isExpanded = active && expandedSubOption === condId;

                      return (
                        <div
                          key={item.stt}
                          className={`rounded-lg border transition ${
                            isExpanded ? 'sm:col-span-2' : ''
                          } ${
                            active
                              ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 px-3 py-2">
                            <button
                              type="button"
                              onClick={() => toggleCondition(condId)}
                              className="flex flex-1 items-center gap-2.5 text-left text-sm"
                            >
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                                  active
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {active && <Check className="h-3 w-3 stroke-[3]" />}
                              </span>
                              <div>
                                <span className="mr-1.5 text-xs font-semibold text-slate-400">
                                  #{item.stt}
                                </span>
                                <span className="font-medium">{item.name}</span>
                              </div>
                            </button>

                            {active && supportsSub && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedSubOption((prev) =>
                                    prev === condId ? null : condId
                                  );
                                }}
                                className={`inline-flex min-h-[32px] shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                                  isExpanded
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-blue-300 bg-white text-blue-700 hover:bg-blue-50'
                                }`}
                              >
                                <span>{getSubOptionButtonLabel(condId)}</span>
                                {isExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* Inline Sub-option Panel */}
                          {isExpanded && (
                            <div className="border-t border-blue-200 bg-white/90 px-3 py-2.5 rounded-b-lg">
                              {condId === 'tilt' && (
                                <div>
                                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-blue-900">
                                    Chọn hướng di / nghiêng
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setTiltDirection('left')}
                                      className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                                        tiltDirection === 'left'
                                          ? 'border-blue-600 bg-blue-600 text-white'
                                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      ← Sang trái sơ đồ
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTiltDirection('right')}
                                      className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                                        tiltDirection === 'right'
                                          ? 'border-blue-600 bg-blue-600 text-white'
                                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      Sang phải sơ đồ →
                                    </button>
                                  </div>
                                </div>
                              )}

                              {condId === 'deviated' && (
                                <div>
                                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-blue-900">
                                    Hướng lệch (N: Ngoài, T: Trong, G: Gần, X: Xa)
                                  </p>
                                  <div className="grid grid-cols-4 gap-2">
                                    {(['N', 'T', 'G', 'X'] as DirectionOption[]).map(
                                      (dir) => (
                                        <button
                                          key={dir}
                                          type="button"
                                          onClick={() =>
                                            setDeviationDirection(dir)
                                          }
                                          className={`rounded-lg border py-1.5 text-sm font-semibold transition ${
                                            deviationDirection === dir
                                              ? 'border-blue-600 bg-blue-600 text-white'
                                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                          }`}
                                        >
                                          lệch {dir}
                                        </button>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                              {(condId === 'caries_no_restore' ||
                                condId === 'caries_restore') && (
                                <div>
                                  <div className="mb-1.5 flex items-center justify-between">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-900">
                                      Vị trí sâu răng (có thể chọn nhiều mặt)
                                    </p>
                                    <span className="text-[11px] text-blue-700">
                                      {tooth.jaw === 'upper'
                                        ? 'Hàm trên'
                                        : 'Hàm dưới'}{' '}
                                      ·{' '}
                                      {tooth.side === 'right'
                                        ? 'Bên phải'
                                        : 'Bên trái'}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                    {(
                                      [
                                        { id: 'G', label: 'Gần (G)' },
                                        { id: 'X', label: 'Xa (X)' },
                                        { id: 'occlusal', label: 'Nhai / Cắn' },
                                        { id: 'T', label: 'Trong (T)' },
                                        { id: 'N', label: 'Ngoài (N)' },
                                      ] as {
                                        id: CariesPosition;
                                        label: string;
                                      }[]
                                    ).map((pos) => {
                                      const isPosActive =
                                        cariesPositions.includes(pos.id);
                                      return (
                                        <button
                                          key={pos.id}
                                          type="button"
                                          onClick={() =>
                                            toggleCariesPosition(pos.id)
                                          }
                                          className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                                            isPosActive
                                              ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                          }`}
                                        >
                                          {pos.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {condId === 'temp_filling' && (
                                <div>
                                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-blue-900">
                                    Vật liệu trám tạm
                                  </p>
                                  <div className="grid grid-cols-3 gap-2">
                                    {(
                                      ['Cav', 'Eu', 'Cav, Eu'] as TempMaterial[]
                                    ).map((mat) => (
                                      <button
                                        key={mat}
                                        type="button"
                                        onClick={() => setTempMaterial(mat)}
                                        className={`rounded-lg border py-1.5 text-sm font-medium transition ${
                                          tempMaterial === mat
                                            ? 'border-blue-600 bg-blue-600 text-white'
                                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                      >
                                        {mat}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {tab === 'gap' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <p className="text-sm font-medium text-slate-800">
                  Thêm khe hở giữa răng {tooth.display} (FDI {tooth.fdi}) và răng kế cận:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Răng kế cận
                    </label>
                    <select
                      value={gapNeighborFdi}
                      onChange={(e) => setGapNeighborFdi(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                    >
                      {leftNeighbor && (
                        <option value={leftNeighbor.fdi}>
                          Răng {leftNeighbor.display} (FDI {leftNeighbor.fdi}) — bên trái
                        </option>
                      )}
                      {rightNeighbor && (
                        <option value={rightNeighbor.fdi}>
                          Răng {rightNeighbor.display} (FDI {rightNeighbor.fdi}) — bên phải
                        </option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Khoảng cách đoạn hở (mm)
                    </label>
                    <input
                      type="text"
                      value={gapMm}
                      onChange={(e) => setGapMm(e.target.value)}
                      placeholder="VD: 2"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {relatedGaps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Khe hở hiện có liên quan đến răng này
                  </h4>
                  {relatedGaps.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <span>
                        Giữa FDI {g.leftToothFdi} và {g.rightToothFdi}:{' '}
                        <strong className="text-blue-700">{g.distanceMm} mm</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteGap(g.id)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'span' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSpanType('bridge')}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      spanType === 'bridge'
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Cầu răng (#25–#28)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpanType('crowding')}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      spanType === 'crowding'
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Răng chen chúc (#36)
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Từ răng {tooth.display} (FDI {tooth.fdi}) đến răng:
                  </label>
                  <select
                    value={spanEndFdi}
                    onChange={(e) => {
                      setSpanEndFdi(e.target.value);
                      setPonticFdis([]);
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    {rowTeeth
                      .filter((t) => t.fdi !== tooth.fdi)
                      .map((t) => (
                        <option key={t.fdi} value={t.fdi}>
                          Răng {t.display} (FDI {t.fdi}) — {t.side === 'right' ? 'Phải' : 'Trái'}
                        </option>
                      ))}
                  </select>
                </div>

                {spanType === 'bridge' && spanRangeTeeth.length >= 2 && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Chọn răng nhịp cầu / răng mất (sẽ gạch X, không nối trụ):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {spanRangeTeeth.map((t) => {
                        const isPontic = ponticFdis.includes(t.fdi);
                        return (
                          <button
                            key={t.fdi}
                            type="button"
                            onClick={() =>
                              setPonticFdis((prev) =>
                                isPontic
                                  ? prev.filter((id) => id !== t.fdi)
                                  : [...prev, t.fdi]
                              )
                            }
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                              isPontic
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {t.display} ({t.fdi}) {isPontic ? '· X (Nhịp)' : '· Trụ'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {relatedSpans.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Cầu răng / Chen chúc hiện có tại vùng này
                  </h4>
                  {relatedSpans.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <span>
                        {s.type === 'bridge' ? 'Cầu răng' : 'Răng chen chúc'} (
                        {s.jaw === 'upper' ? 'Hàm trên' : 'Hàm dưới'})
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteSpan(s.id)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
          {tab === 'single' ? (
            <button
              type="button"
              onClick={() => {
                onConfirmSingle(tooth.fdi, { conditionId: 'normal' });
                onClose();
              }}
              className="min-h-[40px] rounded-lg px-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Đặt về bình thường
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Check className="h-4 w-4" />
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
