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
        notes: ['칼슘제와 4시간 간격 필수(흡수 방해 차단)', '1시간 금식'],
    },
    {
        id: 'morning',
        label: '아침 식사',
        icon: 'morning',
        notes: ['[식단 시너지] 샐러드에 올리브유 듬뿍 + 계란으로 지용성(오메가3, D3, K2)흡수율 폭발!', '**엽산은 화요일 아침 복용 X (저녁으로!)**', '**비타민 D3는 3일에 1번만**'],
    },
    {
        id: 'noon',
        label: '점심 식사',
        icon: 'sun',
        notes: ['소화효소: 식사 시작 직후', '[위장 방어] 가장 든든한 식사 시에 독한 약을 먹어 속쓰림과 메스꺼움을 완벽 차단'],
    },
    {
        id: 'snack',
        label: '오후 간식',
        icon: 'cookie',
        notes: ['흡수율 극대화(빈속에 복용 가능)', '칼슘은 한 번에 500mg 이상 흡수 못하므로 나누어 먹는 것이 정답'],
    },
    {
        id: 'evening',
        label: '저녁 식사',
        icon: 'moon',
        notes: ['오메가-3 하루 총 2,500mg 완성', '수면 중 관절 염증(조조강직) 방어'],
    },
    {
        id: 'night',
        label: '식후 30분',
        icon: 'wait',
        notes: ['천연 신경안정제 (숙면 유도)'],
    },
];

// 기본 약 데이터 (화요일 규칙 적용 전)
export const BASE_MEDICINES: Medicine[] = [
    // 기상 직후
    { id: 'med1', name: '씬지록신', dose: '(갑상선 약) + 물 200ml 이상', slot: 'dawn' },

    // 아침 식사
    { id: 'med4', name: '종근당 활성엽산', dose: '1알 (0.8mg)', slot: 'morning', tuesdayEvening: true },
    { id: 'med_omega3_morning', name: '더리얼 오메가-3', dose: '1알 (1250mg)', slot: 'morning' },
    { id: 'med11', name: '비타민 K2', dose: '1알 (100mcg)', slot: 'morning' },
    {
        id: 'med10',
        name: '비타민 D3',
        dose: '(4000 IU)',
        slot: 'morning',
        cycleType: 'D3',
        cycleStart: '2026-01-28',
        cyclePeriod: 3,
    },
    { id: 'med5', name: '브라질너트', dose: '2알', slot: 'morning' },

    // 점심 식사
    { id: 'med6', name: '소화효소', dose: '1알 (베이직)', slot: 'noon' },
    { id: 'med3', name: '류마티스 처방약', dose: '(옥시1, 조피린2, 라베프졸1)', slot: 'noon' },
    { id: 'med7', name: '구연산 칼슘', dose: '1알 (250mg)', slot: 'noon' },
    { id: 'med8', name: '마그네슘', dose: '1알 (100mg)', slot: 'noon' },

    // 오후 간식
    { id: 'med12', name: '구연산 칼슘', dose: '1알 (250mg)', slot: 'snack' },
    { id: 'med13', name: '마그네슘', dose: '1알 (100mg)', slot: 'snack' },

    // 저녁 식사
    { id: 'med14', name: '소화효소', dose: '1알 (베이직)', slot: 'evening' },
    { id: 'med15', name: '류마티스 처방약', dose: '(저녁분)', slot: 'evening' },
    { id: 'med16', name: '더리얼 오메가-3', dose: '1알 (1250mg)', slot: 'evening' },
    {
        id: 'med_mtx',
        name: 'MTX (6알)',
        dose: '',
        slot: 'evening',
        cycleType: 'MTX',
        targetDay: 1, // 월요일
    },

    // 식후 30분
    { id: 'med17', name: '구연산 칼슘', dose: '1알 (250mg)', slot: 'night' },
    { id: 'med18', name: '마그네슘', dose: '1알 (100mg)', slot: 'night' },
];
