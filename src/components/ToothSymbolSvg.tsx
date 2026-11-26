import React from 'react';
import {
  CariesPosition,
  JawType,
  SideType,
  SingleConditionId,
  ToothAnnotation,
} from '../types/dental';

interface ToothSymbolSvgProps {
  display: string;
  jaw: JawType;
  side?: SideType;
  annotation?: ToothAnnotation;
  x?: number;
  y?: number;
  inkColor?: string;
  numberColor?: string;
}

const BLUE = '#1D4ED8';
const BLACK = '#111827';

export function getLabelsForCondition(
  cond: SingleConditionId,
  annotation?: ToothAnnotation
): string | null {
  switch (cond) {
    case 'deviated':
      return `lệch ${annotation?.deviationDirection || 'G'}`;
    case 'rotated':
      return 'xoay';
    case 'erupting':
      return 'đang mọc';
    case 'unerupted':
      return 'chưa mọc';
    case 'extruded':
      return 'trồi';
    case 'mobile':
      return 'LL';
    case 'filling_co_ok':
    case 'filling_co_redo':
      return 'Co';
    case 'filling_gic_ok':
    case 'filling_gic_redo':
      return 'GIC';
    case 'filling_a_ok':
    case 'filling_a_redo':
      return 'A';
    case 'temp_filling':
      return annotation?.tempMaterial || 'Cav, Eu';
    case 'cervical_wear':
      return 'MC';
    case 'crown':
      return 'mão';
    case 'core':
      return 'cùi R';
    case 'enamel_hypoplasia':
      return 'TSM';
    case 'fractured':
      return 'vỡ';
    case 'worn':
      return 'mòn';
    case 'fistula':
      return 'lỗ dò';
    case 'malformed':
      return 'dị dạng';
    case 'gingival_recession':
      return 'tụt nướu';
    default:
      return null;
  }
}

export const ToothSymbolSvg: React.FC<ToothSymbolSvgProps> = ({
  display,
  jaw,
  side = 'right',
  annotation,
  x = 0,
  y = 0,
  inkColor = BLUE,
  numberColor = BLACK,
}) => {
  const activeConds: SingleConditionId[] =
    annotation?.conditionIds && annotation.conditionIds.length > 0
      ? annotation.conditionIds
      : annotation?.conditionId
      ? [annotation.conditionId]
      : ['normal'];

  const has = (id: SingleConditionId) => activeConds.includes(id);

  const isUpper = jaw === 'upper';
  const arrowY = isUpper ? -22 : 21;

  const hasCircle =
    has('root_restore') ||
    has('caries_restore') ||
    has('filling_co_redo') ||
    has('filling_gic_redo') ||
    has('filling_a_redo') ||
    has('temp_filling');

  const hasRoot = has('root') || has('root_extract') || has('root_restore');
  const hasSlash = has('extract') || has('root_extract');
  const isMissing = has('missing');
  const hideNumber = isMissing;
  const hasCaries = has('caries_no_restore') || has('caries_restore');
  const hasTilt = has('tilt');

  const labels: string[] = [];
  for (const cond of activeConds) {
    const lbl = getLabelsForCondition(cond, annotation);
    if (lbl && !labels.includes(lbl)) {
      labels.push(lbl);
    }
  }

  const getCariesCoords = (pos: CariesPosition) => {
    switch (pos) {
      case 'N':
        return { cx: 0, cy: isUpper ? -11 : 11 };
      case 'T':
        return { cx: 0, cy: isUpper ? 11 : -11 };
      case 'G':
        return { cx: side === 'right' ? 9 : -9, cy: 0 };
      case 'X':
        return { cx: side === 'right' ? -9 : 9, cy: 0 };
      case 'occlusal':
      default:
        return { cx: 0, cy: 0 };
    }
  };

  const activeCariesPositions: CariesPosition[] =
    annotation?.cariesPositions && annotation.cariesPositions.length > 0
      ? annotation.cariesPositions
      : [annotation?.cariesPosition ?? 'occlusal'];

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Tooth number */}
      {!hideNumber && (
        <text
          x={hasRoot ? 2 : 0}
          y={6}
          textAnchor="middle"
          fill={numberColor}
          fontFamily="'Times New Roman', Georgia, serif"
          fontSize="19"
          fontWeight="500"
        >
          {display}
        </text>
      )}

      {/* Missing X */}
      {isMissing && (
        <g stroke={inkColor} strokeWidth="2.3" strokeLinecap="round">
          <line x1="-7" y1="-8" x2="7" y2="8" />
          <line x1="7" y1="-8" x2="-7" y2="8" />
        </g>
      )}

      {/* Root radical sign √ */}
      {hasRoot && (
        <path
          d="M -13 2 L -9 9 L -4 -12 L 10 -12"
          fill="none"
          stroke={inkColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Circle around tooth */}
      {hasCircle && (
        <circle
          cx={0}
          cy={0}
          r={14.5}
          fill="none"
          stroke={inkColor}
          strokeWidth="1.5"
        />
      )}

      {/* Extraction diagonal slash / */}
      {hasSlash && (
        <line
          x1="9"
          y1="-12"
          x2="-9"
          y2="12"
          stroke={inkColor}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}

      {/* Caries black dot(s) */}
      {hasCaries &&
        activeCariesPositions.map((pos) => {
          const { cx, cy } = getCariesCoords(pos);
          return (
            <circle
              key={pos}
              cx={cx}
              cy={cy}
              r={3}
              fill={numberColor}
              stroke="#ffffff"
              strokeOpacity="0.65"
              strokeWidth="0.7"
            />
          );
        })}

      {/* Tilt arrow */}
      {hasTilt && (
        <g stroke={inkColor} strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {annotation?.tiltDirection === 'left' ? (
            <>
              <line x1="12" y1={arrowY} x2="-12" y2={arrowY} />
              <polyline points="-7,-3.5 -12,0 -7,3.5" transform={`translate(0, ${arrowY})`} />
            </>
          ) : (
            <>
              <line x1="-12" y1={arrowY} x2="12" y2={arrowY} />
              <polyline points="7,-3.5 12,0 7,3.5" transform={`translate(0, ${arrowY})`} />
            </>
          )}
        </g>
      )}

      {/* Text label(s) (above for upper jaw, below for lower jaw) */}
      {labels.map((lbl, idx) => {
        const baseOffset = hasTilt ? 33 : 23;
        const step = 11;
        const ly = isUpper
          ? -(baseOffset + idx * step)
          : baseOffset + idx * step;
        return (
          <text
            key={lbl}
            x={0}
            y={ly}
            textAnchor="middle"
            fill={inkColor}
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
            fontSize="9.5"
            fontWeight="600"
          >
            {lbl}
          </text>
        );
      })}
    </g>
  );
};
