"use client";

import { useMemo, useState } from "react";

type TimeKey = "morning" | "noon" | "evening";
type Result = "깊은 성공" | "성공" | "실패";
type Theme = "light" | "dark";

type StatKey =
  | "추적"
  | "생존"
  | "대화"
  | "압박"
  | "관찰"
  | "신성"
  | "학식"
  | "금기"
  | "전투"
  | "봉인";

type ActionCard = {
  id: string;
  name: string;
  description: string;
  tags: Partial<Record<StatKey, number>>;
};

type RequirementOption = Partial<Record<StatKey, number>>;

type SlotOutcome = {
  clues?: string[];
  truth?: number;
  fear?: number;
  madness?: number;
  danger?: number;
  injury?: number;
  status?: string[];
  unlocks?: string[];
  text: string;
};

type InvestigationSlot = {
  id: string;
  name: string;
  kind: "initial" | "conditional";
  condition?: string;
  timeOnly?: TimeKey;
  requirements: RequirementOption[];
  deepSuccess?: SlotOutcome;
  success: SlotOutcome;
  failure: SlotOutcome;
};

type Scenario = {
  id: string;
  sample: string;
  title: string;
  summary: string;
  request: string;
  limitDays: number;
  initialDanger: number;
  themes: string[];
  finalOpenCondition: string;
  slots: InvestigationSlot[];
  clueTags: Record<string, string[]>;
  endings: string[];
};

type LogEntry = {
  id: number;
  day: number;
  time: string;
  text: string;
  result?: Result;
};

type GameState = {
  introAccepted: boolean;
  scenarioId: string | null;
  day: number;
  timeIndex: number;
  actionsLeft: number;
  truth: number;
  danger: number;
  fear: number;
  madness: number;
  injury: number;
  clues: string[];
  statusCards: string[];
  unlockedSlotIds: string[];
  selectedSlotId: string;
  selectedCardIds: string[];
  logs: LogEntry[];
};

const times: Array<{ key: TimeKey; label: string }> = [
  { key: "morning", label: "아침" },
  { key: "noon", label: "점심" },
  { key: "evening", label: "저녁" },
];

const actionCards: ActionCard[] = [
  {
    id: "track",
    name: "흔적 추적",
    description: "발자국, 냄새, 남겨진 물건으로 대상을 따라갑니다.",
    tags: { 추적: 2, 관찰: 1 },
  },
  {
    id: "survive",
    name: "위험 돌파",
    description: "험한 지형과 위협을 버티며 현장에 접근합니다.",
    tags: { 생존: 2, 전투: 1 },
  },
  {
    id: "talk",
    name: "차분한 탐문",
    description: "사람들의 경계를 낮추고 증언을 끌어냅니다.",
    tags: { 대화: 2, 관찰: 1 },
  },
  {
    id: "pressure",
    name: "압박 심문",
    description: "숨기는 자를 몰아붙여 빠르게 균열을 냅니다.",
    tags: { 압박: 2, 대화: 1 },
  },
  {
    id: "observe",
    name: "정밀 관찰",
    description: "현장의 모순과 사소한 변화를 놓치지 않습니다.",
    tags: { 관찰: 2, 학식: 1 },
  },
  {
    id: "rite",
    name: "성물과 기도",
    description: "신성한 절차로 괴이한 흔적을 분별합니다.",
    tags: { 신성: 2, 봉인: 1 },
  },
  {
    id: "archive",
    name: "기록 해석",
    description: "문서, 계약, 호적, 전승의 맥락을 읽습니다.",
    tags: { 학식: 2, 관찰: 1 },
  },
  {
    id: "taboo",
    name: "금기 접촉",
    description: "위험한 이름과 의식을 건드려 막힌 길을 엽니다.",
    tags: { 금기: 2, 신성: 1 },
  },
];

const statKeys: StatKey[] = [
  "추적",
  "생존",
  "대화",
  "압박",
  "관찰",
  "신성",
  "학식",
  "금기",
  "전투",
  "봉인",
];

const scenarios: Scenario[] = [
  {
    id: "deer-saint",
    sample: "시나리오 샘플 1",
    title: "사슴 머리 성자",
    summary:
      "산골 마을에서는 해마다 한 명씩 사람이 사라진다. 올해는 의뢰인의 딸이 숲의 성자에게 끌려갔다고 한다.",
    request:
      "의뢰인은 괴물을 죽여 달라고 말하지만, 조사할수록 실종자들이 죽은 것이 아닐지도 모른다는 정황이 드러난다.",
    limitDays: 6,
    initialDanger: 1,
    finalOpenCondition: "진실 진행도 5 이상",
    themes: ["신앙", "계약", "질병", "희생"],
    clueTags: {
      "갈라진 사슴 발자국": ["추적", "괴이"],
      "감춰진 제물 순서": ["인간범죄", "은폐"],
      "의뢰인의 거짓말": ["증언", "인간범죄"],
      "나은 병자의 검은 혈관": ["질병", "변이"],
      "사슴뿔이 새겨진 제단": ["의식", "신앙"],
      "피로 쓴 오래된 계약": ["계약", "금기"],
      "비어 있는 무덤": ["은폐", "죽음"],
      "죽지 않은 실종자": ["생존", "반전"],
      "노래하는 실종자들": ["숲", "변이"],
      "성자의 진짜 이름": ["이름", "괴이"],
    },
    endings: ["성자 토벌", "계약 파기", "제물 순서 폭로", "성자와 거래"],
    slots: [
      {
        id: "forest-gate",
        name: "숲 입구",
        kind: "initial",
        requirements: [{ 추적: 2 }, { 생존: 2 }],
        success: {
          clues: ["갈라진 사슴 발자국"],
          truth: 1,
          text: "두 발로 걷는 무언가가 사슴의 발을 흉내 내고 있었다.",
        },
        deepSuccess: {
          unlocks: ["white-woods"],
          text: "흰 나무 숲으로 이어지는 감춰진 길을 찾아냈다.",
        },
        failure: { fear: 1, text: "숲의 울음소리에 공포가 스며든다." },
      },
      {
        id: "client-house",
        name: "의뢰인의 집",
        kind: "initial",
        requirements: [{ 대화: 2 }, { 압박: 2 }],
        success: {
          clues: ["감춰진 제물 순서"],
          truth: 1,
          text: "제물의 순서는 조작되어 있었고, 딸의 이름은 원래 목록에 없었다.",
        },
        deepSuccess: {
          clues: ["의뢰인의 거짓말"],
          danger: 1,
          text: "의뢰인의 거짓말을 잡아냈지만 마을의 경계가 올라갔다.",
        },
        failure: { text: "의뢰인은 같은 말만 반복했고 시간이 흘렀다." },
      },
      {
        id: "sick-hut",
        name: "병든 자들의 오두막",
        kind: "initial",
        requirements: [{ 관찰: 2 }, { 신성: 1, 관찰: 1 }],
        success: {
          clues: ["나은 병자의 검은 혈관"],
          truth: 1,
          text: "병자들은 살아 있었지만 손목 아래로 검은 뿌리 같은 혈관이 번져 있었다.",
        },
        failure: { fear: 1, madness: 1, text: "치유된 몸의 내부에서 낯선 것이 꿈틀거렸다." },
      },
      {
        id: "shrine",
        name: "마을 사당",
        kind: "initial",
        requirements: [{ 신성: 2 }, { 학식: 2 }],
        success: {
          clues: ["사슴뿔이 새겨진 제단"],
          truth: 1,
          text: "제단에는 병을 거두는 대신 이름 하나를 받는다는 문구가 새겨져 있었다.",
        },
        deepSuccess: {
          clues: ["피로 쓴 오래된 계약"],
          madness: 1,
          text: "피로 쓴 계약을 읽어냈지만 정신이 흔들렸다.",
        },
        failure: { danger: 1, text: "사당을 건드린 일이 마을에 알려졌다." },
      },
      {
        id: "graveyard",
        name: "마을 묘지",
        kind: "initial",
        requirements: [{ 관찰: 2 }, { 신성: 2 }],
        success: {
          clues: ["비어 있는 무덤"],
          text: "실종자들은 애초에 묻힌 적이 없었다.",
        },
        deepSuccess: {
          clues: ["죽지 않은 실종자"],
          text: "무덤 속 흔적은 죽음이 아니라 은폐를 가리켰다.",
        },
        failure: { fear: 1, text: "이름 없는 무덤들이 밤새 당신을 따라오는 듯하다." },
      },
      {
        id: "white-woods",
        name: "흰 나무 숲",
        kind: "conditional",
        condition: "[갈라진 사슴 발자국] 보유 또는 숲 입구 깊은 성공",
        requirements: [{ 추적: 2, 생존: 1 }, { 신성: 2 }],
        success: {
          clues: ["노래하는 실종자들"],
          truth: 2,
          text: "실종자들은 살아 있었다. 다만 누구도 집으로 돌아가고 싶어 하지 않았다.",
        },
        failure: { injury: 1, fear: 1, text: "흰 나무의 뿌리가 발목을 파고들었다." },
      },
      {
        id: "saint-tracks",
        name: "성자의 발자국",
        kind: "conditional",
        condition: "광기 5 이상 또는 제단/혈관 단서 보유",
        requirements: [{ 금기: 1 }, { 신성: 2 }],
        success: {
          clues: ["성자의 진짜 이름"],
          text: "성자는 사슴이 아니었다. 발자국은 당신의 그림자 안에서 시작되고 있었다.",
        },
        deepSuccess: {
          madness: 2,
          text: "진짜 이름의 일부가 입안에서 살아 움직였다.",
        },
        failure: {
          madness: 1,
          status: ["사슴 울음이 들린다"],
          text: "멀리서 들린 울음이 이제 머릿속에서 울린다.",
        },
      },
    ],
  },
  {
    id: "red-gloves",
    sample: "시나리오 샘플 2",
    title: "붉은 장갑의 재단사",
    summary:
      "도시 외곽 마을에서 사람들이 사라지고, 방에는 항상 붉은 장갑 한 켤레가 남는다.",
    request:
      "마을은 괴이한 재단사를 두려워하지만, 실종자 가족들은 이상할 만큼 안도하고 있다.",
    limitDays: 5,
    initialDanger: 0,
    finalOpenCondition: "이름/인간범죄/괴이 단서 조합에 따라 해결 방식 개방",
    themes: ["가족", "신분 위조", "죄책감", "인간범죄와 괴이의 경계"],
    clueTags: {
      "붉은 장갑": ["상징", "괴이"],
      "두 사람의 발자국": ["추적", "모순"],
      "맞지 않는 치수": ["관찰", "위장"],
      "불에 탄 주문서": ["은폐", "증거"],
      "침묵하는 가족들": ["증언", "인간범죄"],
      "사라지길 바란 사람들": ["인간범죄", "동기"],
      "지워진 이름들": ["기록", "이름"],
      "잘린 실밥": ["추적", "괴이"],
      "사람처럼 꿰맨 인형": ["괴이", "대체"],
      "인형 안의 이름표": ["이름", "금기"],
      "살아 있는 옷감": ["괴이", "의식"],
    },
    endings: ["재단사 토벌", "이름 되돌리기", "마을의 공모 폭로", "대체 계약 체결"],
    slots: [
      {
        id: "missing-room",
        name: "실종자의 방",
        kind: "initial",
        requirements: [{ 관찰: 2 }, { 추적: 2 }],
        success: {
          clues: ["붉은 장갑"],
          truth: 1,
          text: "피는 없고 창문은 잠겨 있었다. 탁자 위엔 붉은 장갑만 남았다.",
        },
        deepSuccess: { clues: ["두 사람의 발자국"], text: "실종자는 혼자가 아니었다." },
        failure: { fear: 1, text: "닫힌 방 안에서 누군가의 숨소리를 들었다." },
      },
      {
        id: "tailor-shop",
        name: "재단사의 공방",
        kind: "initial",
        requirements: [{ 관찰: 2 }, { 대화: 2 }],
        success: {
          clues: ["맞지 않는 치수"],
          text: "한 사람의 옷에 두 사람의 몸이 섞여 있었다.",
        },
        deepSuccess: {
          clues: ["불에 탄 주문서"],
          danger: 1,
          text: "불에 탄 주문서를 발견했지만 공방의 시선이 날카로워졌다.",
        },
        failure: { text: "재단사는 모든 질문을 치수 이야기로 돌렸다." },
      },
      {
        id: "town-hall",
        name: "마을 회관",
        kind: "initial",
        requirements: [{ 대화: 2 }, { 압박: 2 }],
        success: {
          clues: ["침묵하는 가족들"],
          text: "가족들은 슬퍼하지 않았다. 그 사람은 원래 없던 사람이라고 말했다.",
        },
        deepSuccess: {
          clues: ["사라지길 바란 사람들"],
          text: "실종은 모두에게 비극이 아니었다.",
        },
        failure: { danger: 1, text: "회관의 문이 하나씩 닫혔다." },
      },
      {
        id: "registry",
        name: "오래된 호적 보관소",
        kind: "initial",
        requirements: [{ 학식: 2 }, { 관찰: 2 }],
        success: {
          clues: ["지워진 이름들"],
          text: "잉크가 마르지 않은 이름들이 호적에서 사라지고 있었다.",
        },
        failure: { status: ["먼지 속의 속삭임"], text: "먼지 속에서 지워진 이름들이 속삭였다." },
      },
      {
        id: "alley",
        name: "뒷골목",
        kind: "initial",
        requirements: [{ 추적: 2 }, { 생존: 2 }],
        success: {
          clues: ["잘린 실밥"],
          unlocks: ["doll-pile"],
          text: "붉은 실밥이 벽돌 사이를 기어가듯 움직이고 있었다.",
        },
        failure: { injury: 1, text: "골목의 실이 손목을 베고 사라졌다." },
      },
      {
        id: "doll-pile",
        name: "버려진 인형 더미",
        kind: "conditional",
        condition: "[잘린 실밥] 보유 또는 뒷골목 성공",
        requirements: [{ 관찰: 2 }, { 신성: 2 }],
        success: {
          clues: ["사람처럼 꿰맨 인형"],
          truth: 2,
          text: "인형은 사람을 닮은 것이 아니라, 사람을 대신하고 있었다.",
        },
        deepSuccess: {
          clues: ["인형 안의 이름표"],
          text: "인형 안쪽에서 누군가의 이름표를 꺼냈다.",
        },
        failure: { fear: 2, text: "인형들이 한꺼번에 고개를 돌렸다." },
      },
      {
        id: "night-sewing",
        name: "밤의 재단실",
        kind: "conditional",
        condition: "저녁 시간대 그리고 [붉은 장갑] + [맞지 않는 치수] 보유",
        timeOnly: "evening",
        requirements: [{ 생존: 2 }, { 압박: 2 }, { 신성: 2 }],
        success: {
          clues: ["살아 있는 옷감"],
          truth: 1,
          text: "바늘은 혼자 움직이고 있었다. 누군가 당신의 어깨 치수를 재고 있었다.",
        },
        failure: {
          injury: 1,
          status: ["실에 감긴 손목"],
          text: "실이 손목을 감고 맥박에 맞춰 조여왔다.",
        },
      },
    ],
  },
  {
    id: "harbor",
    sample: "시나리오 샘플 3",
    title: "등대 없는 항구",
    summary:
      "등대가 꺼진 뒤 배들이 실종되고, 밤마다 바다 밑에서 종소리가 울린다.",
    request:
      "마을은 바다 괴물을 의심하지만 진짜 문제는 오래전 침몰한 배에 있을지도 모른다.",
    limitDays: 7,
    initialDanger: 1,
    finalOpenCondition: "원혼/인간범죄/계약 단서 조합에 따라 해결 방식 개방",
    themes: ["바다", "죄책감", "침몰", "집단 은폐", "원혼"],
    clueTags: {
      "깨진 등대 렌즈": ["관찰", "파괴"],
      "아래에서 비치는 빛": ["괴이", "바다"],
      "말을 멈추는 어부들": ["증언", "은폐"],
      "침몰선의 이름": ["기록", "바다"],
      "젖지 않은 발자국": ["추적", "원혼"],
      "보험 계약서": ["인간범죄", "탐욕"],
      "버려진 구조 요청": ["죄", "은폐"],
      "녹슨 종": ["의식", "소리"],
      "물속의 행렬": ["원혼", "집단"],
      "닫힌 선실의 아이들": ["죄", "죽음"],
      "바다 밑 계약": ["계약", "금기"],
    },
    endings: ["바다 괴이 토벌", "원혼 진혼", "선주의 죄 폭로", "바다 밑 계약 파기"],
    slots: [
      {
        id: "lighthouse",
        name: "꺼진 등대",
        kind: "initial",
        requirements: [{ 관찰: 2 }, { 생존: 2 }],
        success: {
          clues: ["깨진 등대 렌즈"],
          truth: 1,
          text: "렌즈의 유리 조각은 안쪽으로 흩어져 있었다. 빛은 밖에서 들어온 것이다.",
        },
        deepSuccess: {
          clues: ["아래에서 비치는 빛"],
          fear: 1,
          text: "저녁 바다 아래에서 등대 같은 빛이 켜졌다.",
        },
        failure: { fear: 1, text: "꺼진 등대 안에서 물소리가 들렸다." },
      },
      {
        id: "tavern",
        name: "항구 술집",
        kind: "initial",
        requirements: [{ 대화: 2 }, { 압박: 2 }],
        success: {
          clues: ["말을 멈추는 어부들"],
          text: "침몰한 배의 이름이 나오자 모두 잔을 내려놓았다.",
        },
        deepSuccess: {
          clues: ["침몰선의 이름"],
          danger: 1,
          text: "침몰선의 이름을 알아냈지만 술집 전체가 조용해졌다.",
        },
        failure: { text: "어부들은 바다 괴물 욕만 되풀이했다." },
      },
      {
        id: "shell-beach",
        name: "조개껍질 해변",
        kind: "initial",
        requirements: [{ 추적: 2 }, { 관찰: 2 }],
        success: {
          clues: ["젖지 않은 발자국"],
          text: "모래는 젖어 있었지만 발자국만은 말라 있었다.",
        },
        deepSuccess: { unlocks: ["ebb-road"], text: "썰물 때만 드러나는 길을 발견했다." },
        failure: { fear: 1, text: "발자국이 당신의 뒤에서 하나 더 생겼다." },
      },
      {
        id: "owner-house",
        name: "선주의 저택",
        kind: "initial",
        requirements: [{ 대화: 2 }, { 압박: 2 }, { 학식: 2 }],
        success: {
          clues: ["보험 계약서"],
          text: "계약서의 날짜는 침몰 하루 전이었다.",
        },
        deepSuccess: {
          clues: ["버려진 구조 요청"],
          danger: 1,
          text: "구조 요청은 도착했지만 누군가 일부러 묵살했다.",
        },
        failure: { text: "선주는 다음날까지 잠적했다." },
      },
      {
        id: "old-pier",
        name: "오래된 선착장",
        kind: "initial",
        requirements: [{ 생존: 2 }, { 신성: 2 }],
        success: {
          clues: ["녹슨 종"],
          truth: 1,
          text: "파도는 움직이지 않았지만 밧줄들이 종소리에 맞춰 흔들렸다.",
        },
        failure: { fear: 2, injury: 1, text: "저녁 물살이 발목을 잡아끌었다." },
      },
      {
        id: "ebb-road",
        name: "썰물길",
        kind: "conditional",
        condition: "[젖지 않은 발자국] 보유 또는 해변 깊은 성공",
        requirements: [{ 생존: 2, 관찰: 1 }, { 신성: 2 }],
        success: {
          clues: ["물속의 행렬"],
          truth: 2,
          text: "사람들이 썰물길 위를 걸었다. 살아 있는 사람은 아니었지만 익사자도 아니었다.",
        },
        failure: { injury: 1, fear: 1, text: "돌아오는 물길이 너무 빨랐다." },
      },
      {
        id: "bell-room",
        name: "침몰선의 종실",
        kind: "conditional",
        condition: "[침몰선의 이름] + [녹슨 종] 보유 또는 광기 5 이상",
        requirements: [{ 신성: 2 }, { 생존: 2 }, { 금기: 1 }],
        success: {
          clues: ["닫힌 선실의 아이들"],
          truth: 1,
          text: "종실 문 안쪽에는 아이들의 키를 재듯 선이 하나씩 그어져 있었다.",
        },
        deepSuccess: {
          clues: ["바다 밑 계약"],
          madness: 2,
          text: "바다와 맺어진 계약이 종 안쪽에 새겨져 있었다.",
        },
        failure: { status: ["폐에 찬 바닷물"], text: "숨을 쉴 때마다 짠물이 올라왔다." },
      },
    ],
  },
];

const defaultState: GameState = {
  introAccepted: false,
  scenarioId: null,
  day: 1,
  timeIndex: 0,
  actionsLeft: 3,
  truth: 0,
  danger: 0,
  fear: 0,
  madness: 0,
  injury: 0,
  clues: [],
  statusCards: [],
  unlockedSlotIds: [],
  selectedSlotId: "",
  selectedCardIds: [],
  logs: [],
};

function addUnique(current: string[], incoming: string[] = []) {
  return Array.from(new Set([...current, ...incoming]));
}

function sumTags(selectedCards: ActionCard[]) {
  return selectedCards.reduce<Record<StatKey, number>>(
    (total, card) => {
      statKeys.forEach((tag) => {
        total[tag] += card.tags[tag] ?? 0;
      });
      return total;
    },
    {
      추적: 0,
      생존: 0,
      대화: 0,
      압박: 0,
      관찰: 0,
      신성: 0,
      학식: 0,
      금기: 0,
      전투: 0,
      봉인: 0,
    },
  );
}

function optionMatched(total: Record<StatKey, number>, option: RequirementOption) {
  return Object.entries(option).every(([tag, value]) => total[tag as StatKey] >= value);
}

function requirementScore(total: Record<StatKey, number>, option: RequirementOption) {
  return Object.entries(option).reduce(
    (score, [tag, value]) => score + Math.min(total[tag as StatKey], value),
    0,
  );
}

function requirementTotal(option: RequirementOption) {
  return Object.values(option).reduce((score, value) => score + value, 0);
}

function bestRequirement(slot: InvestigationSlot, total: Record<StatKey, number>) {
  return slot.requirements
    .map((option) => ({
      option,
      matched: optionMatched(total, option),
      score: requirementScore(total, option),
      required: requirementTotal(option),
    }))
    .sort((a, b) => Number(b.matched) - Number(a.matched) || b.score - a.score)[0];
}

function judge(total: Record<StatKey, number>, slot: InvestigationSlot): Result {
  const best = bestRequirement(slot, total);
  if (!best?.matched) {
    return "실패";
  }

  const totalPower = statKeys.reduce((sum, tag) => sum + total[tag], 0);
  if (slot.deepSuccess && totalPower - best.required >= 2) {
    return "깊은 성공";
  }

  return "성공";
}

function formatRequirement(option: RequirementOption) {
  return Object.entries(option)
    .map(([tag, value]) => `${tag} ${value}`)
    .join(" + ");
}

function isSlotUnlocked(slot: InvestigationSlot, scenario: Scenario, state: GameState) {
  if (slot.kind === "initial") {
    return true;
  }

  if (state.unlockedSlotIds.includes(slot.id)) {
    return true;
  }

  if (slot.id === "white-woods") {
    return state.clues.includes("갈라진 사슴 발자국");
  }
  if (slot.id === "saint-tracks") {
    return (
      state.madness >= 5 ||
      (state.clues.includes("사슴뿔이 새겨진 제단") && state.clues.includes("나은 병자의 검은 혈관"))
    );
  }
  if (slot.id === "doll-pile") {
    return state.clues.includes("잘린 실밥");
  }
  if (slot.id === "night-sewing") {
    return state.clues.includes("붉은 장갑") && state.clues.includes("맞지 않는 치수");
  }
  if (slot.id === "ebb-road") {
    return state.clues.includes("젖지 않은 발자국");
  }
  if (slot.id === "bell-room") {
    return (
      state.madness >= 5 ||
      (state.clues.includes("침몰선의 이름") && state.clues.includes("녹슨 종"))
    );
  }

  return scenario.slots.some((candidate) => state.unlockedSlotIds.includes(candidate.id));
}

function outcomeText(outcome: SlotOutcome) {
  const parts = [];
  if (outcome.clues?.length) parts.push(`단서 ${outcome.clues.map((clue) => `[${clue}]`).join(", ")}`);
  if (outcome.truth) parts.push(`진실 +${outcome.truth}`);
  if (outcome.danger) parts.push(`위험 +${outcome.danger}`);
  if (outcome.fear) parts.push(`공포 +${outcome.fear}`);
  if (outcome.madness) parts.push(`광기 +${outcome.madness}`);
  if (outcome.injury) parts.push(`부상 +${outcome.injury}`);
  if (outcome.status?.length) parts.push(`상태 ${outcome.status.map((status) => `[${status}]`).join(", ")}`);
  if (outcome.unlocks?.length) parts.push("새 조사 슬롯 개방");

  return parts.length ? `${outcome.text} / ${parts.join(", ")}` : outcome.text;
}

export default function Home() {
  const [theme, setTheme] = useState<Theme>("light");
  const [game, setGame] = useState<GameState>(defaultState);

  const scenario = scenarios.find((item) => item.id === game.scenarioId) ?? scenarios[0];
  const currentTime = times[game.timeIndex];
  const availableSlots = scenario.slots.filter(
    (slot) => isSlotUnlocked(slot, scenario, game) && (!slot.timeOnly || slot.timeOnly === currentTime.key),
  );
  const selectedSlot =
    availableSlots.find((slot) => slot.id === game.selectedSlotId) ?? availableSlots[0];
  const selectedCards = actionCards.filter((card) => game.selectedCardIds.includes(card.id));
  const totals = useMemo(() => sumTags(selectedCards), [selectedCards]);
  const expectedResult = selectedCards.length > 0 && selectedSlot ? judge(totals, selectedSlot) : null;
  const nextThemeLabel = theme === "light" ? "다크 모드" : "라이트 모드";

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  const startScenario = (selectedScenario: Scenario) => {
    const firstSlot = selectedScenario.slots[0];
    setGame({
      ...defaultState,
      introAccepted: true,
      scenarioId: selectedScenario.id,
      danger: selectedScenario.initialDanger,
      selectedSlotId: firstSlot.id,
      logs: [
        {
          id: 1,
          day: 1,
          time: "의뢰",
          text: `[${selectedScenario.title}] 의뢰를 수락했습니다.`,
        },
      ],
    });
  };

  const selectSlot = (slotId: string) => {
    setGame((current) => ({ ...current, selectedSlotId: slotId, selectedCardIds: [] }));
  };

  const toggleCard = (cardId: string) => {
    setGame((current) => {
      if (current.selectedCardIds.includes(cardId)) {
        return {
          ...current,
          selectedCardIds: current.selectedCardIds.filter((id) => id !== cardId),
        };
      }

      if (current.selectedCardIds.length >= 3) {
        return current;
      }

      return { ...current, selectedCardIds: [...current.selectedCardIds, cardId] };
    });
  };

  const advanceTime = (state: GameState, activeScenario: Scenario): GameState => {
    const nextTimeIndex = state.timeIndex + 1;

    if (nextTimeIndex < times.length) {
      const nextTimeSlots = activeScenario.slots.filter(
        (slot) =>
          isSlotUnlocked(slot, activeScenario, state) &&
          (!slot.timeOnly || slot.timeOnly === times[nextTimeIndex].key),
      );
      return {
        ...state,
        timeIndex: nextTimeIndex,
        selectedSlotId: nextTimeSlots[0]?.id ?? state.selectedSlotId,
        selectedCardIds: [],
      };
    }

    const nextDay = state.day + 1;
    const limitReached = nextDay > activeScenario.limitDays;
    const nextLogs = [
      {
        id: state.logs.length + 1,
        day: state.day,
        time: "정산",
        text: limitReached
          ? `제한일 ${activeScenario.limitDays}일이 지났습니다. 최종 해결을 서둘러야 합니다.`
          : `${state.day}일차 종료. 진실 ${state.truth}, 위험 ${state.danger}, 공포 ${state.fear}, 광기 ${state.madness}.`,
      },
      ...state.logs,
    ];

    return {
      ...state,
      day: nextDay,
      timeIndex: 0,
      actionsLeft: 3,
      selectedSlotId: activeScenario.slots[0].id,
      selectedCardIds: [],
      logs: nextLogs,
    };
  };

  const submitInvestigation = () => {
    if (!selectedSlot || selectedCards.length === 0 || game.actionsLeft <= 0) {
      return;
    }

    const result = judge(totals, selectedSlot);
    const baseOutcome = result === "실패" ? selectedSlot.failure : selectedSlot.success;
    const deepOutcome = result === "깊은 성공" ? selectedSlot.deepSuccess : undefined;
    const outcomes = [baseOutcome, deepOutcome].filter(Boolean) as SlotOutcome[];

    setGame((current) => {
      const nextActions = current.actionsLeft - 1;
      const merged = outcomes.reduce(
        (next, outcome) => ({
          ...next,
          truth: next.truth + (outcome.truth ?? 0),
          danger: next.danger + (outcome.danger ?? 0),
          fear: next.fear + (outcome.fear ?? 0),
          madness: next.madness + (outcome.madness ?? 0),
          injury: next.injury + (outcome.injury ?? 0),
          clues: addUnique(next.clues, outcome.clues),
          statusCards: addUnique(next.statusCards, outcome.status),
          unlockedSlotIds: addUnique(next.unlockedSlotIds, outcome.unlocks),
        }),
        { ...current, actionsLeft: nextActions },
      );

      const logText = outcomes.map(outcomeText).join(" ");
      const nextState = {
        ...merged,
        logs: [
          {
            id: current.logs.length + 1,
            day: current.day,
            time: currentTime.label,
            text: `${selectedSlot.name}: ${result}. ${logText}`,
            result,
          },
          ...current.logs,
        ],
      };

      return nextActions <= 0 ? advanceTime(nextState, scenario) : advanceTime(nextState, scenario);
    });
  };

  const resetGame = () => {
    setGame(defaultState);
  };

  const finalReady = game.truth >= 5 || game.clues.length >= 7;

  if (!game.introAccepted) {
    return (
      <main className="intro-shell" data-theme={theme}>
        <button className="theme-toggle intro-theme-toggle" onClick={toggleTheme} type="button">
          {nextThemeLabel}
        </button>
        <section className="intro-scene scenario-intro" aria-label="시나리오 선택">
          <div className="intro-copy">
            <p className="eyebrow">Case Select</p>
            <h1>의뢰 선택</h1>
            <p className="intro-lead">
              `시나리오.txt`의 샘플 의뢰를 선택해 조사를 시작합니다. 각 사건은 서로 다른 단서,
              조건부 조사 슬롯, 최종 해결 방향을 가집니다.
            </p>
          </div>
          <div className="scenario-list">
            {scenarios.map((item) => (
              <button className="scenario-card" key={item.id} onClick={() => startScenario(item)} type="button">
                <span>{item.sample}</span>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
                <small>제한일 {item.limitDays}일 · {item.themes.join(" / ")}</small>
              </button>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="game-shell" data-theme={theme}>
      <section className="board">
        <aside className="panel status-panel" aria-label="진행 상태">
          <button className="theme-toggle" onClick={toggleTheme} type="button">
            {nextThemeLabel}
          </button>
          <div className="status-grid">
            <div>
              <span>사건</span>
              <strong>{scenario.title}</strong>
            </div>
            <div>
              <span>일차</span>
              <strong>{game.day}/{scenario.limitDays}</strong>
            </div>
            <div>
              <span>시간대</span>
              <strong>{currentTime.label}</strong>
            </div>
            <div>
              <span>행동력</span>
              <strong>{game.actionsLeft}/3</strong>
            </div>
            <div>
              <span>진실</span>
              <strong>{game.truth}</strong>
            </div>
            <div>
              <span>위험 / 공포</span>
              <strong>{game.danger} / {game.fear}</strong>
            </div>
            <div>
              <span>광기 / 부상</span>
              <strong>{game.madness} / {game.injury}</strong>
            </div>
          </div>
        </aside>

        <div className="center-panel">
          <div className="panel slots-panel">
            <div className="panel-heading">
              <h2>조사 슬롯</h2>
              <p>{scenario.finalOpenCondition} · {finalReady ? "최종 해결 검토 가능" : "조사를 계속하세요"}</p>
            </div>
            <div className="slot-list">
              {availableSlots.map((slot) => (
                <button
                  className={`slot-card ${selectedSlot?.id === slot.id ? "selected" : ""}`}
                  key={slot.id}
                  onClick={() => selectSlot(slot.id)}
                  type="button"
                >
                  <span className="risk">{slot.kind === "initial" ? "초기" : "조건부"}</span>
                  <strong>{slot.name}</strong>
                  <small>{slot.condition ?? "처음부터 조사 가능"}</small>
                  <div className="requirement-row">
                    {slot.requirements.map((option, index) => (
                      <span key={`${slot.id}-${index}`}>{formatRequirement(option)}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <section className="panel log-panel">
            <div className="panel-heading">
              <h2>진행 기록</h2>
              <p>{scenario.request}</p>
            </div>
            <div className="log-list">
              {game.logs.map((log) => (
                <article className="log-entry" key={log.id}>
                  <span>
                    Day {log.day} · {log.time}
                  </span>
                  <p>{log.text}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="panel cards-panel">
          <div className="panel-heading">
            <h2>행동 카드</h2>
            <p>최대 3장을 골라 슬롯의 요구 태그를 만족시킵니다.</p>
          </div>
          <div className="card-grid">
            {actionCards.map((card) => {
              const selected = game.selectedCardIds.includes(card.id);
              return (
                <button
                  className={`action-card ${selected ? "selected" : ""}`}
                  key={card.id}
                  onClick={() => toggleCard(card.id)}
                  type="button"
                >
                  <span className="card-cost">행동</span>
                  <strong>{card.name}</strong>
                  <p>{card.description}</p>
                  <div className="tag-row">
                    {statKeys.map((tag) =>
                      card.tags[tag] ? (
                        <span key={tag}>
                          {tag} +{card.tags[tag]}
                        </span>
                      ) : null,
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="panel result-panel">
          <div className="panel-heading">
            <h2>판정</h2>
            <p>{selectedSlot ? selectedSlot.name : "조사 슬롯을 선택하세요"}</p>
          </div>

          {selectedSlot ? (
            <>
              <div className="comparison">
                {selectedSlot.requirements.map((option, index) => (
                  <div className="meter" key={`${selectedSlot.id}-meter-${index}`}>
                    <div>
                      <span>{formatRequirement(option)}</span>
                      <strong>{optionMatched(totals, option) ? "충족" : "부족"}</strong>
                    </div>
                    <progress
                      max={Math.max(requirementTotal(option), 1)}
                      value={Math.min(requirementScore(totals, option), requirementTotal(option))}
                    />
                  </div>
                ))}
              </div>

              <div className={`result-box ${expectedResult ? "active" : ""}`}>
                <span>예상 결과</span>
                <strong>{expectedResult ?? "카드를 선택하세요"}</strong>
                <p>
                  깊은 성공은 요구치 충족 후 선택 카드의 총 태그 수치가 요구치보다 2 이상 높을 때
                  발생합니다.
                </p>
              </div>
            </>
          ) : null}

          <div className="clue-box">
            <span>보유 단서</span>
            <p>{game.clues.length ? game.clues.map((clue) => `[${clue}]`).join(" ") : "아직 없음"}</p>
          </div>

          <button
            className="submit-button"
            disabled={!selectedSlot || selectedCards.length === 0 || game.actionsLeft <= 0}
            onClick={submitInvestigation}
            type="button"
          >
            조사 제출
          </button>
          <button className="ghost-button" onClick={resetGame} type="button">
            의뢰 다시 선택
          </button>
        </aside>
      </section>
    </main>
  );
}
