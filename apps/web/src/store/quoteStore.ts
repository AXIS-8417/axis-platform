import { create } from 'zustand';

export type PanelType = 'RPP' | 'EGI' | '스틸';
export type FloorType = '파이프박기' | '콘크리트' | '모름';
export type Region = '서울' | '경기북부' | '경기남부' | '경기서해안' | '인천' | '강원내륙' | '강원해안' | '충청' | '충남서해' | '전라' | '경상' | '부산' | '제주';
export type GateType = '없음' | '양개_비계' | '양개_각관' | '홀딩도어';

interface DoorFields {
  gateType: GateType;
  doorGrade: '고재' | '신재';
  doorWidth: number;
  doorHeight: number;       // 양개_비계만 2 or 3 선택, 나머지 고정
  doorMesh: boolean;        // 홀딩도어 수직포망
  doorSide: '좌측' | '우측'; // 홀딩도어 쪽문 방향
}

interface SelectionFields {
  selectedCellKey: string | null;
  selectedAsset: string | null;
  bbMonths: number;
  disclosureLevel: 'L1' | 'L2' | 'L3';
}

interface QuoteFields {
  address: string;
  region: Region | null;
  length: number;
  panelType: PanelType | null;
  height: number;
  floorType: FloorType | null;
  dustH: number;
}

interface QuoteState extends QuoteFields, DoorFields, SelectionFields {
  currentStep: number;
  estimateId: string | null;
  setField: <K extends keyof (QuoteFields & DoorFields & SelectionFields)>(
    key: K,
    value: (QuoteFields & DoorFields & SelectionFields)[K]
  ) => void;
  setStep: (step: number) => void;
  setEstimateId: (id: string) => void;
  reset: () => void;
}

const initialState: QuoteFields & DoorFields & SelectionFields & { currentStep: number; estimateId: string | null } = {
  address: '',
  region: null,
  length: 0,
  panelType: null,
  height: 0,
  floorType: null,
  dustH: 0,
  gateType: '없음',
  doorGrade: '신재',
  doorWidth: 3,
  doorHeight: 2,
  doorMesh: false,
  doorSide: '좌측',
  selectedCellKey: null,
  selectedAsset: null,
  bbMonths: 6,
  disclosureLevel: 'L2',
  currentStep: 1,
  estimateId: null,
};

export const useQuoteStore = create<QuoteState>((set) => ({
  ...initialState,
  setField: (key, value) => set({ [key]: value }),
  setStep: (step) => set({ currentStep: step }),
  setEstimateId: (id) => set({ estimateId: id }),
  reset: () => set(initialState),
}));
