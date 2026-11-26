export type DentitionType = 'permanent' | 'deciduous';
export type JawType = 'upper' | 'lower';
export type SideType = 'right' | 'left';

export type DirectionOption = 'N' | 'T' | 'G' | 'X';
export type TiltDirection = 'left' | 'right';
export type CariesPosition = 'occlusal' | 'N' | 'T' | 'G' | 'X';
export type TempMaterial = 'Cav' | 'Eu' | 'Cav, Eu';

export type SingleConditionId =
  | 'normal'
  | 'missing'
  | 'root'
  | 'tilt'
  | 'deviated'
  | 'rotated'
  | 'erupting'
  | 'unerupted'
  | 'extruded'
  | 'mobile'
  | 'root_extract'
  | 'root_restore'
  | 'extract'
  | 'caries_no_restore'
  | 'caries_restore'
  | 'filling_co_ok'
  | 'filling_gic_ok'
  | 'filling_a_ok'
  | 'filling_co_redo'
  | 'filling_gic_redo'
  | 'filling_a_redo'
  | 'temp_filling'
  | 'cervical_wear'
  | 'crown'
  | 'core'
  | 'enamel_hypoplasia'
  | 'fractured'
  | 'worn'
  | 'fistula'
  | 'malformed'
  | 'gingival_recession';

export interface ToothAnnotation {
  conditionId: SingleConditionId;
  tiltDirection?: TiltDirection;
  deviationDirection?: DirectionOption;
  cariesPosition?: CariesPosition;
  cariesPositions?: CariesPosition[];
  tempMaterial?: TempMaterial;
}

export interface ToothMeta {
  fdi: string; // e.g. '16', '55'
  display: string; // e.g. '6', 'E'
  dentition: DentitionType;
  jaw: JawType;
  side: SideType;
  indexInRow: number; // 0..15 for permanent, 0..9 for deciduous (left to right on screen)
}

export interface InterdentalGap {
  id: string;
  dentition: DentitionType;
  jaw: JawType;
  leftToothFdi: string;
  rightToothFdi: string;
  distanceMm: string;
}

export interface SpanAnnotation {
  id: string;
  type: 'bridge' | 'crowding';
  dentition: DentitionType;
  jaw: JawType;
  startIndex: number;
  endIndex: number;
  ponticIndices?: number[]; // For bridges: indices within [startIndex..endIndex] that are pontics (marked X)
  label?: string;
}

export interface LegendItem {
  stt: number;
  name: string;
  notationDescription: string;
  note: string;
  category:
    | 'general'
    | 'root_extract'
    | 'caries_filling'
    | 'prosthetics'
    | 'anomalies_perio'
    | 'multi_note';
  conditionId?: SingleConditionId;
  kind: 'single' | 'gap' | 'bridge' | 'crowding' | 'note';
}
