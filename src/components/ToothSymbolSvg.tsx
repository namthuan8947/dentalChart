import React from 'react';
import { CariesPosition, JawType, SideType, ToothAnnotation } from '../types/dental';

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

export function getAnnotationLabel(annotation?: ToothAnnotation): string | null {
  if (!annotation) return null;
  switch (annotation.conditionId) {
    case 'deviated':
      return `lệch ${annotation.deviationDirection || 'G'}`;
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
      return annotation.tempMaterial || 'Cav, Eu';
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
  const cond = annotation?.conditionId ?? 'normal';
  const isUpper = jaw === 'upper';
  const labelY = isUpper ? -23 : 24;
  const arrowY = isUpper ? -22 : 21;

  const hasCircle =
    cond === 'root_restore' ||
    cond === 'caries_restore' ||
    cond === 'filling_co_redo' ||
    cond === 'filling_gic_redo' ||
    cond === 'filling_a_redo' ||
    cond === 'temp_filling';

  const hasRoot = cond === 'root' || cond === 'root_extract' || cond === 'root_restore';
  const hasSlash = cond === 'extract' || cond === 'root_extract';
  const isMissing = cond === 'missing';
  const hideNumber = isMissing || cond === 'root_extract';
  const hasCaries = cond === 'caries_no_restore' || cond === 'caries_restore';
  const labelText = getAnnotationLabel(annotation);

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
          d={
            cond === 'root_extract'
              ? 'M -12 1 L -8 8 L -3 -11 L 9 -11'
              : 'M -13 2 L -9 9 L -4 -12 L 10 -12'
          }
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
      {cond === 'tilt' && (
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

      {/* Text label (above for upper jaw, below for lower jaw) */}
      {labelText && (
        <text
          x={0}
          y={labelY}
          textAnchor="middle"
          fill={inkColor}
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          fontSize="10"
          fontWeight="600"
        >
          {labelText}
        </text>
      )}
    </g>
  );
};
