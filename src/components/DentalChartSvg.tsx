import React from 'react';
import {
  DECIDUOUS_TEETH,
  PERMANENT_TEETH,
} from '../data/dentalConditions';
import {
  DentitionType,
  InterdentalGap,
  JawType,
  SpanAnnotation,
  ToothAnnotation,
  ToothMeta,
} from '../types/dental';
import { ToothSymbolSvg } from './ToothSymbolSvg';

interface DentalChartSvgProps {
  showPermanent: boolean;
  showDeciduous: boolean;
  annotations: Record<string, ToothAnnotation>;
  gaps: InterdentalGap[];
  spans: SpanAnnotation[];
  generalNote: string;
  selectedFdi: string | null;
  onSelectTooth: (tooth: ToothMeta) => void;
  onSelectGap?: (
    dentition: DentitionType,
    jaw: JawType,
    leftTooth: ToothMeta,
    rightTooth: ToothMeta
  ) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

const CENTER_X = 450;
const COL_STEP = 46;
const MID_OFFSET = 26;
const BLUE = '#1D4ED8';

export function getToothX(dentition: DentitionType, indexInRow: number): number {
  const half = dentition === 'permanent' ? 8 : 5;
  if (indexInRow < half) {
    return CENTER_X - MID_OFFSET - (half - 1 - indexInRow) * COL_STEP;
  }
  return CENTER_X + MID_OFFSET + (indexInRow - half) * COL_STEP;
}

export const DentalChartSvg: React.FC<DentalChartSvgProps> = ({
  showPermanent,
  showDeciduous,
  annotations,
  gaps,
  spans,
  generalNote,
  selectedFdi,
  onSelectTooth,
  onSelectGap,
  svgRef,
}) => {
  // Compute vertical layout dynamically
  let currentY = 26;

  const permStartY = currentY;
  const permUpperY = permStartY + 54;
  const permDividerY = permUpperY + 34;
  const permLowerY = permDividerY + 36;
  if (showPermanent) {
    currentY = permLowerY + 62;
  }

  const decStartY = showPermanent ? currentY + 12 : currentY;
  const decUpperY = decStartY + 54;
  const decDividerY = decUpperY + 34;
  const decLowerY = decDividerY + 36;
  if (showDeciduous) {
    currentY = decLowerY + 62;
  }

  const trimmedNote = generalNote.trim();
  const noteLines = trimmedNote ? trimmedNote.split('\n').slice(0, 4) : [];
  const noteStartY = currentY + 8;
  if (noteLines.length > 0) {
    currentY = noteStartY + noteLines.length * 20 + 16;
  }

  const totalHeight = Math.max(currentY + 12, 220);

  // Center for Phải / Trái badges
  const topBound = showPermanent ? permUpperY : decUpperY;
  const bottomBound = showDeciduous ? decLowerY : permLowerY;
  const badgeCenterY = (topBound + bottomBound) / 2;

  const renderTeethRow = (
    teeth: ToothMeta[],
    dentition: DentitionType,
    jaw: JawType,
    y: number
  ) => {
    const rowTeeth = teeth
      .filter((t) => t.jaw === jaw)
      .sort((a, b) => a.indexInRow - b.indexInRow);

    return (
      <g>
        {rowTeeth.map((tooth) => {
          const x = getToothX(dentition, tooth.indexInRow);
          const isSelected = selectedFdi === tooth.fdi;
          const annotation = annotations[tooth.fdi];

          return (
            <g
              key={tooth.fdi}
              onClick={() => onSelectTooth(tooth)}
              style={{ cursor: 'pointer' }}
              className="tooth-group"
            >
              {/* Interactive hit target & selection highlight (excluded on PNG export) */}
              <rect
                data-export-exclude="true"
                x={x - 21}
                y={y - 33}
                width={42}
                height={66}
                rx={7}
                fill={isSelected ? 'rgba(37, 99, 235, 0.10)' : 'transparent'}
                stroke={isSelected ? '#2563EB' : 'transparent'}
                strokeWidth={1.5}
                className="tooth-hit-rect"
              />
              <ToothSymbolSvg
                display={tooth.display}
                jaw={jaw}
                side={tooth.side}
                annotation={annotation}
                x={x}
                y={y}
              />
            </g>
          );
        })}

        {/* Interdental gap click targets (subtle, excluded on PNG export) */}
        {onSelectGap &&
          rowTeeth.slice(0, -1).map((leftTooth, idx) => {
            const rightTooth = rowTeeth[idx + 1];
            const x1 = getToothX(dentition, leftTooth.indexInRow);
            const x2 = getToothX(dentition, rightTooth.indexInRow);
            const midX = (x1 + x2) / 2;
            const half = dentition === 'permanent' ? 8 : 5;
            if (leftTooth.indexInRow === half - 1) return null; // skip midline cross
            return (
              <rect
                key={`gap-hit-${leftTooth.fdi}-${rightTooth.fdi}`}
                data-export-exclude="true"
                x={midX - 5}
                y={y - 16}
                width={10}
                height={32}
                rx={3}
                fill="transparent"
                className="gap-hit-rect"
                style={{ cursor: 'col-resize' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectGap(dentition, jaw, leftTooth, rightTooth);
                }}
              >
                <title>{`Khe hở giữa răng ${leftTooth.display} và ${rightTooth.display}`}</title>
              </rect>
            );
          })}
      </g>
    );
  };

  const renderGaps = (dentition: DentitionType, jaw: JawType, y: number) => {
    const teeth = dentition === 'permanent' ? PERMANENT_TEETH : DECIDUOUS_TEETH;
    return gaps
      .filter((g) => g.dentition === dentition && g.jaw === jaw)
      .map((gap) => {
        const left = teeth.find((t) => t.fdi === gap.leftToothFdi);
        const right = teeth.find((t) => t.fdi === gap.rightToothFdi);
        if (!left || !right) return null;
        const x1 = getToothX(dentition, left.indexInRow);
        const x2 = getToothX(dentition, right.indexInRow);
        const midX = (x1 + x2) / 2;
        return (
          <g key={gap.id} transform={`translate(${midX}, ${y})`}>
            <line x1={-9} y1={-13} x2={-9} y2={13} stroke={BLUE} strokeWidth={1.4} />
            <line x1={9} y1={-13} x2={9} y2={13} stroke={BLUE} strokeWidth={1.4} />
            <text
              x={0}
              y={-1}
              textAnchor="middle"
              fill={BLUE}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="8.5"
              fontWeight="600"
            >
              {gap.distanceMm}
            </text>
            <text
              x={0}
              y={9}
              textAnchor="middle"
              fill={BLUE}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="8"
              fontWeight="600"
            >
              mm
            </text>
          </g>
        );
      });
  };

  const renderSpans = (dentition: DentitionType, jaw: JawType, y: number) => {
    const isUpper = jaw === 'upper';
    return spans
      .filter((s) => s.dentition === dentition && s.jaw === jaw)
      .map((span) => {
        const startX = getToothX(dentition, span.startIndex);
        const endX = getToothX(dentition, span.endIndex);
        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        const midX = (minX + maxX) / 2;

        if (span.type === 'bridge') {
          const barY = isUpper ? y - 22 : y + 22;
          const tickTipY = isUpper ? y - 15 : y + 15;
          const pontics = new Set(span.ponticIndices || []);
          const indices: number[] = [];
          for (
            let i = Math.min(span.startIndex, span.endIndex);
            i <= Math.max(span.startIndex, span.endIndex);
            i++
          ) {
            indices.push(i);
          }

          return (
            <g key={span.id} stroke={BLUE} strokeWidth={1.8} fill="none" strokeLinecap="round">
              <line x1={minX} y1={barY} x2={maxX} y2={barY} />
              {indices.map((idx) => {
                if (pontics.has(idx)) return null;
                const tx = getToothX(dentition, idx);
                return <line key={idx} x1={tx} y1={barY} x2={tx} y2={tickTipY} />;
              })}
            </g>
          );
        }

        // Crowding (#36)
        const barY = isUpper ? y - 22 : y + 22;
        const tickTipY = isUpper ? y - 15 : y + 15;
        const textY = isUpper ? y - 28 : y + 34;

        return (
          <g key={span.id}>
            <g stroke={BLUE} strokeWidth={1.5} fill="none" strokeLinecap="round">
              <line x1={minX - 6} y1={barY} x2={maxX + 6} y2={barY} />
              <line x1={minX - 6} y1={barY} x2={minX - 6} y2={tickTipY} />
              <line x1={maxX + 6} y1={barY} x2={maxX + 6} y2={tickTipY} />
            </g>
            <text
              x={midX}
              y={textY}
              textAnchor="middle"
              fill={BLUE}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="10"
              fontWeight="600"
            >
              chen chúc
            </text>
          </g>
        );
      });
  };

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 900 ${totalHeight}`}
      className="w-full h-auto max-w-[960px] select-none"
      role="img"
      aria-label="Sơ đồ răng nha khoa"
    >
      {/* Phải / Trái anatomical labels */}
      {(showPermanent || showDeciduous) && (
        <g data-side-label="true">
          <g transform={`translate(18, ${badgeCenterY - 14})`}>
            <rect
              x={0}
              y={0}
              width={44}
              height={28}
              rx={2}
              fill="none"
              stroke="#111827"
              strokeWidth={1.4}
            />
            <text
              x={22}
              y={19}
              textAnchor="middle"
              fill="#111827"
              fontFamily="'Times New Roman', Georgia, serif"
              fontSize="14"
              fontWeight="700"
            >
              Phải
            </text>
          </g>

          <g transform={`translate(838, ${badgeCenterY - 14})`}>
            <rect
              x={0}
              y={0}
              width={44}
              height={28}
              rx={2}
              fill="none"
              stroke="#111827"
              strokeWidth={1.4}
            />
            <text
              x={22}
              y={19}
              textAnchor="middle"
              fill="#111827"
              fontFamily="'Times New Roman', Georgia, serif"
              fontSize="14"
              fontWeight="700"
            >
              Trái
            </text>
          </g>
        </g>
      )}

      {/* Permanent Dentition (Răng vĩnh viễn) */}
      {showPermanent && (
        <g>
          <text
            data-dentition-title="true"
            x={CENTER_X}
            y={permStartY + 8}
            textAnchor="middle"
            fill="#111827"
            fontFamily="'Times New Roman', Georgia, serif"
            fontSize="15"
            fontWeight="700"
          >
            Răng vĩnh viễn
          </text>

          {/* Crosshair grid */}
          <line
            x1={76}
            y1={permDividerY}
            x2={824}
            y2={permDividerY}
            stroke="#374151"
            strokeWidth={1.1}
          />
          <line
            x1={CENTER_X}
            y1={permUpperY - 26}
            x2={CENTER_X}
            y2={permLowerY + 26}
            stroke="#374151"
            strokeWidth={1.1}
          />

          {renderTeethRow(PERMANENT_TEETH, 'permanent', 'upper', permUpperY)}
          {renderTeethRow(PERMANENT_TEETH, 'permanent', 'lower', permLowerY)}
          {renderGaps('permanent', 'upper', permUpperY)}
          {renderGaps('permanent', 'lower', permLowerY)}
          {renderSpans('permanent', 'upper', permUpperY)}
          {renderSpans('permanent', 'lower', permLowerY)}
        </g>
      )}

      {/* Deciduous Dentition (Răng sữa) */}
      {showDeciduous && (
        <g>
          <text
            data-dentition-title="true"
            x={CENTER_X}
            y={decStartY + 8}
            textAnchor="middle"
            fill="#111827"
            fontFamily="'Times New Roman', Georgia, serif"
            fontSize="15"
            fontWeight="700"
          >
            Răng sữa
          </text>

          {/* Crosshair grid */}
          <line
            x1={212}
            y1={decDividerY}
            x2={688}
            y2={decDividerY}
            stroke="#374151"
            strokeWidth={1.1}
          />
          <line
            x1={CENTER_X}
            y1={decUpperY - 26}
            x2={CENTER_X}
            y2={decLowerY + 26}
            stroke="#374151"
            strokeWidth={1.1}
          />

          {renderTeethRow(DECIDUOUS_TEETH, 'deciduous', 'upper', decUpperY)}
          {renderTeethRow(DECIDUOUS_TEETH, 'deciduous', 'lower', decLowerY)}
          {renderGaps('deciduous', 'upper', decUpperY)}
          {renderGaps('deciduous', 'lower', decLowerY)}
          {renderSpans('deciduous', 'upper', decUpperY)}
          {renderSpans('deciduous', 'lower', decLowerY)}
        </g>
      )}

      {/* General Notes (#38) */}
      {noteLines.length > 0 && (
        <g transform={`translate(76, ${noteStartY})`}>
          {noteLines.map((line, i) => (
            <text
              key={i}
              x={0}
              y={i * 20}
              fill="#1E3A8A"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="12.5"
              fontWeight={i === 0 ? '600' : '400'}
            >
              {i === 0 ? `Ghi chú: ${line}` : line}
            </text>
          ))}
        </g>
      )}
    </svg>
  );
};
