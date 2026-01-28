export type TimeSlot = 'dawn' | 'morning' | 'noon' | 'snack' | 'evening' | 'night';

export interface Medicine {
    id: string;
    name: string;
    dose: string;
    slot: TimeSlot;
    // 화요일 규칙: 화요일이면 저녁으로 이동
    tuesdayEvening?: boolean;
    // 사이클 약물 (D3, MTX 등)
    cycleType?: 'D3' | 'MTX';
    cycleStart?: string; // YYYY-MM-DD
    cyclePeriod?: number; // D3: 3일
    targetDay?: number; // MTX: 1 (월요일)
}

export interface TimeSlotInfo {
    id: TimeSlot;
    label: string;
    icon: string;
    notes: string[];
}

export const TIME_SLOTS: TimeSlotInfo[] = [
    {
        id: 'dawn',
        label: '기상 직후',
        icon: 'dawn',
        notes: ['칼슘제와 4시간 이상 간격 필수', '1시간 금식'],
    },
    {
        id: 'morning',
        label: '아침 식사',
        icon: 'morning',
        notes: ['소화효소: 식사 시작 직후', '화요일 아침 복용 X (저녁으로!)'],
    },
    {
        id: 'noon',
        label: '점심 식사',
        icon: 'sun',
        notes: ['골다공증 예방 최강 조합', '비타민 D3는 3일에 1번만'],
    },
    {
        id: 'snack',
        label: '오후 간식',
        icon: 'cookie',
        notes: ['흡수율 극대화 (빈속 복용)'],
    },
    {
        id: 'evening',
        label: '저녁 식사',
        icon: 'moon',
        notes: ['오메가-3 하루 총 2,500mg 완성'],
    },
    {
        id: 'night',
        label: '식후 30분',
        icon: 'wait',
        notes: ['천연 신경안정제 (숙면 유도)', '씬지록신과 8시간 이상 간격'],
    },
];

// 기본 약 데이터 (화요일 규칙 적용 전)
export const BASE_MEDICINES: Medicine[] = [
    // 기상 직후
    { id: 'med1', name: '씬지록신', dose: '(갑상선 약) + 물 많이', slot: 'dawn' },

    // 아침 식사
    { id: 'med2', name: '소화효소', dose: '1알 (베이직)', slot: 'morning' },
    { id: 'med3', name: '류마티스 처방약', dose: '(소론도, 옥시, 조피린, 라피졸)', slot: 'morning' },
    { id: 'med4', name: '종근당 활성엽산', dose: '1알 (0.8mg)', slot: 'morning', tuesdayEvening: true },
    { id: 'med5', name: '브라질너트', dose: '2알', slot: 'morning' },

    // 점심 식사
    { id: 'med6', name: '소화효소', dose: '1알 (베이직)', slot: 'noon' },
    { id: 'med7', name: '구연산 칼슘', dose: '1알 (250mg)', slot: 'noon' },
    { id: 'med8', name: '마그네슘', dose: '1알 (100 mg)', slot: 'noon' },
    { id: 'med9', name: '오메가-3', dose: '1알 (1250mg)', slot: 'noon' },
    { id: 'med11', name: '비타민 K2', dose: '1알', slot: 'noon' },
    {
        id: 'med10',
        name: '비타민 D3',
        dose: '(4000 IU)',
        slot: 'noon',
        cycleType: 'D3',
        cycleStart: '2026-01-28',
        cyclePeriod: 3,
    },

    // 오후 간식
    { id: 'med12', name: '구연산 칼슘', dose: '1알 (250mg)', slot: 'snack' },
    { id: 'med13', name: '마그네슘', dose: '1알 (100 mg)', slot: 'snack' },

    // 저녁 식사
    { id: 'med14', name: '소화효소', dose: '1알 (베이직)', slot: 'evening' },
    { id: 'med15', name: '류마티스 처방약', dose: '(저녁분)', slot: 'evening' },
    { id: 'med16', name: '오메가-3', dose: '1알 (1250mg)', slot: 'evening' },
    {
        id: 'med_mtx',
        name: 'MTX (6알)',
        dose: '',
        slot: 'evening',
        cycleType: 'MTX',
        targetDay: 1, // 월요일
    },

    // 식사 30분 뒤
    { id: 'med17', name: '구연산 칼슘', dose: '1알 (250mg)', slot: 'night' },
    { id: 'med18', name: '마그네슘', dose: '1알 (100 mg)', slot: 'night' },
];
