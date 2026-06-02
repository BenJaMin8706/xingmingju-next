export type Skill = {
  id: string;
  title: string;
  teacher: string;
  category: string[];
  desc: string;
  image: string;
  imageMode?: string;
  rating: string;
  users: string;
  discount: string;
  price: string;
  oldPrice: string;
  tag: string;
  fields: string[];
};

export type ChatPromptCategory = {
  id: string;
  label: string;
  prompt: string;
  keywords: string[];
};

export type ReportResult = {
  title: string;
  completeness: "高" | "中";
  confidence: number;
  overview: string;
  items: string[];
};

import { callAI } from "./ai";

export const skills: Skill[] = [
  {
    id: "reunion-tarot",
    title: "复合塔罗：TA会主动回来吗？",
    teacher: "红线AI塔罗师",
    category: ["love", "tarot"],
    desc: "从三张牌看对方真实状态、复联窗口和你该不该主动。",
    image: "https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_06_Lovers.jpg",
    imageMode: "contain-image",
    rating: "4.9",
    users: "10万+",
    discount: "18%",
    price: "19.9",
    oldPrice: "24.0",
    tag: "情感热门",
    fields: ["你的出生日期", "对方信息", "分开多久", "最近一次互动", "你最想确认的事"],
  },
  {
    id: "daily-oracle",
    title: "今日免费一问：现在该注意什么？",
    teacher: "星命局日签",
    category: ["daily", "tarot"],
    desc: "一张牌 + 今日星象，给你一个轻量但明确的行动提醒。",
    image: "https://images.unsplash.com/photo-1604079628040-94301bb21b91?auto=format&fit=crop&w=500&q=82",
    rating: "4.8",
    users: "50万+",
    discount: "FREE",
    price: "0",
    oldPrice: "6.9",
    tag: "免费",
    fields: ["今天最重要的事", "当前情绪", "想问的具体问题"],
  },
  {
    id: "bazi-wealth",
    title: "八字财运：未来30天进财窗口",
    teacher: "玄策命理实验室",
    category: ["wealth", "bazi"],
    desc: "结合五行、十神和现实现金流，判断近期收入机会与风险。",
    image: "https://images.unsplash.com/photo-1606189934846-a527add8a77b?auto=format&fit=crop&w=500&q=82",
    rating: "4.7",
    users: "8万+",
    discount: "12%",
    price: "22.9",
    oldPrice: "26.0",
    tag: "财运",
    fields: ["出生年月日时", "出生地", "职业阶段", "当前收入压力", "正在考虑的行动"],
  },
  {
    id: "ziwei-love-map",
    title: "紫微恋爱命盘：正缘出现在哪里？",
    teacher: "北斗AI命盘师",
    category: ["love", "compatibility"],
    desc: "用命宫、夫妻宫与迁移宫，推演关系机会、地点和相处模式。",
    image: "https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?auto=format&fit=crop&w=500&q=82",
    rating: "4.9",
    users: "6万+",
    discount: "15%",
    price: "29.9",
    oldPrice: "35.0",
    tag: "深度报告",
    fields: ["出生年月日时", "出生地", "当前感情状态", "理想对象", "过去半年关系变化"],
  },
  {
    id: "career-choice",
    title: "事业选择：跳槽还是留下？",
    teacher: "天机AI决策局",
    category: ["career", "bazi"],
    desc: "把命局节奏、卦象和现实约束合并成一张选择判断表。",
    image: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=500&q=82",
    rating: "4.8",
    users: "5万+",
    discount: "9%",
    price: "18.8",
    oldPrice: "20.6",
    tag: "事业",
    fields: ["出生信息", "当前岗位", "备选机会", "最担心的风险", "决定期限"],
  },
  {
    id: "western-chart",
    title: "西占本命盘：你的人格底层设定",
    teacher: "星盘算法局",
    category: ["daily", "compatibility"],
    desc: "太阳、月亮、上升与宫位合参，生成长期个人档案。",
    image: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?auto=format&fit=crop&w=500&q=82",
    rating: "4.8",
    users: "12万+",
    discount: "20%",
    price: "16.9",
    oldPrice: "21.0",
    tag: "建档必看",
    fields: ["出生年月日", "精确出生时间", "出生城市", "想重点了解的领域"],
  },
  {
    id: "marriage-match",
    title: "婚恋合盘：这段关系适合走长期吗？",
    teacher: "合参关系所",
    category: ["love", "compatibility"],
    desc: "对比双方资料，输出吸引点、冲突点、长期稳定度。",
    image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=500&q=82",
    rating: "4.6",
    users: "3万+",
    discount: "10%",
    price: "24.9",
    oldPrice: "27.6",
    tag: "合盘",
    fields: ["双方出生信息", "关系阶段", "相处时长", "最大矛盾", "是否考虑婚姻"],
  },
  {
    id: "monthly-fortune",
    title: "月运报告：本月三件关键事",
    teacher: "星历AI编辑部",
    category: ["daily", "career", "wealth"],
    desc: "把月相、行运、五行流月和黄历节奏合成月度提醒。",
    image: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=500&q=82",
    rating: "4.9",
    users: "20万+",
    discount: "25%",
    price: "12.9",
    oldPrice: "17.2",
    tag: "月运",
    fields: ["出生信息", "本月目标", "感情状态", "工作状态", "财务压力"],
  },
];

export const categories = [
  ["all", "全部"],
  ["love", "情感"],
  ["tarot", "塔罗"],
  ["bazi", "八字"],
  ["wealth", "财运"],
  ["career", "事业"],
  ["daily", "每日"],
  ["compatibility", "合盘"],
] as const;

export const categoryLabelMap = new Map<string, string>(categories.map(([value, label]) => [value, label]));

export const chatPromptCategories: ChatPromptCategory[] = [
  { id: "relationship-stage", label: "关系阶段", prompt: "我们现在处在暧昧、断联或分手后的哪个阶段？我想判断下一步该主动还是观察。", keywords: ["暧昧", "断联", "分手", "复合", "阶段", "主动", "观察"] },
  { id: "timeline", label: "时间线", prompt: "我们最近一次互动是什么时候？中间发生了哪些关键节点？我想梳理这段关系的时间线。", keywords: ["多久", "什么时候", "最近", "时间", "昨天", "上周", "节点", "联系"] },
  { id: "person-info", label: "对方信息", prompt: "我想补充对方的性格、生日或近期表现，请帮我判断 TA 现在的真实状态。", keywords: ["对方", "TA", "他", "她", "生日", "性格", "表现", "状态"] },
  { id: "core-question", label: "核心问题", prompt: "我最想确认的是：这段关系还有机会吗？我现在最应该做什么？", keywords: ["机会", "怎么办", "该不该", "应该", "核心", "结果", "还会"] },
  { id: "wealth", label: "财运收入", prompt: "我想看看近期财运、收入或副业机会，最需要注意哪些风险和窗口？", keywords: ["财", "钱", "收入", "副业", "现金", "投资", "涨薪"] },
  { id: "career", label: "事业选择", prompt: "我正在纠结工作、跳槽或 offer 选择，想判断哪个方向更适合。", keywords: ["工作", "事业", "跳槽", "offer", "老板", "岗位", "职业"] },
  { id: "match", label: "合盘长期", prompt: "我想看这段关系是否适合长期发展，双方吸引点和冲突点在哪里？", keywords: ["合盘", "婚姻", "结婚", "长期", "伴侣", "稳定"] },
  { id: "daily", label: "今日提醒", prompt: "我想先做一次今日提醒，看看现在最该注意什么。", keywords: ["今天", "现在", "日签", "提醒", "免费", "注意"] },
];

export function getLocalDateKey() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function createEmptyQuestionStats() {
  return Object.fromEntries(chatPromptCategories.map((category) => [category.id, 0])) as Record<string, number>;
}

const categoryPriority: Record<string, number> = {
  wealth: 6,
  career: 7,
  match: 5,
  daily: 5,
  "core-question": 4,
  "relationship-stage": 3,
  "person-info": 3,
  timeline: 1,
};

export function findQuestionCategory(question: string) {
  const text = question.trim().toLowerCase();
  const scoredCategories = chatPromptCategories.map((category) => ({
    category,
    score: category.keywords.filter((keyword) => text.includes(keyword.toLowerCase())).length,
  }));
  const bestMatch = scoredCategories.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return (categoryPriority[right.category.id] || 0) - (categoryPriority[left.category.id] || 0);
  })[0];
  return bestMatch.score > 0 ? bestMatch.category : chatPromptCategories[3];
}

export function getVisibleQuestionChips(question: string, stats: Record<string, number>) {
  const matchedCategory = question.trim() ? findQuestionCategory(question) : null;
  return [...chatPromptCategories]
    .sort((left, right) => {
      const leftMatched = matchedCategory?.id === left.id ? 1 : 0;
      const rightMatched = matchedCategory?.id === right.id ? 1 : 0;
      if (leftMatched !== rightMatched) return rightMatched - leftMatched;
      const countDiff = (stats[right.id] || 0) - (stats[left.id] || 0);
      if (countDiff !== 0) return countDiff;
      return chatPromptCategories.findIndex((category) => category.id === left.id) - chatPromptCategories.findIndex((category) => category.id === right.id);
    })
    .slice(0, 4);
}

export function recommendSkill(question: string) {
  const text = question.trim().toLowerCase();
  if (/财|钱|收入|副业|现金|投资/.test(text)) return skills.find((skill) => skill.id === "bazi-wealth") || skills[0];
  if (/工作|事业|跳槽|offer|老板|岗位|职业/.test(text)) return skills.find((skill) => skill.id === "career-choice") || skills[0];
  if (/合盘|婚姻|结婚|长期|伴侣/.test(text)) return skills.find((skill) => skill.id === "marriage-match") || skills[0];
  if (/免费|今天|现在|日签|提醒/.test(text)) return skills.find((skill) => skill.id === "daily-oracle") || skills[0];
  if (/正缘|对象|桃花/.test(text)) return skills.find((skill) => skill.id === "ziwei-love-map") || skills[0];
  return skills.find((skill) => skill.id === "reunion-tarot") || skills[0];
}

function buildFallbackReportResult(input: { nickname?: string; birthTime?: string | null }, skill: Skill): ReportResult {
  const nickname = input.nickname || "你";
  const hasTime = Boolean(input.birthTime);

  return {
    title: `${nickname}的《${skill.title}》`,
    completeness: hasTime ? "高" : "中",
    confidence: hasTime ? 88 : 78,
    overview: "已根据你填写的资料生成一份可执行的行动建议，重点结论以当前阶段最适合采取的小步动作展开。",
    items: [
      "当前问题有推进空间，但更适合先观察具体反馈，再决定是否继续投入。",
      hasTime ? "出生时间完整，命盘和时间节奏判断更稳定。" : "缺少出生时间，部分命盘细节会降权处理。",
      "现实背景会作为主要判断依据，玄学信号只用于辅助识别趋势和节奏。",
      "未来 7 天建议先做一次低成本验证，再决定是否升级行动。",
    ],
  };
}

function normalizeAIItems(content: string) {
  const cleaned = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*\d.、\s]+/, "").trim())
    .filter(Boolean);

  if (cleaned.length >= 3) {
    return cleaned.slice(0, 5);
  }

  return content
    .split(/[。！？\n]/)
    .map((line) => line.trim())
    .filter((line) => line.length > 6)
    .slice(0, 5);
}

export async function buildReportResult(input: { nickname?: string; birthTime?: string | null; [key: string]: unknown }, skill: Skill): Promise<ReportResult> {
  const fallback = buildFallbackReportResult(input, skill);
  const nickname = input.nickname || "你";
  const userInfo = Object.entries(input)
    .filter(([k, v]) => typeof v === "string" && v.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join("，");
  const prompt = `你是一位专业的玄学顾问，请围绕《${skill.title}》输出一份结构化中文建议。用户资料：${userInfo || "无"}。输出要求：\n1. 先用一句话总结当前状态。\n2. 再给出 3 到 5 条具体建议，每条单独一行。\n3. 不要使用 markdown 标题。\n4. 语言明确、克制、可执行，不要空泛安慰。`;

  try {
    const aiContent = await callAI(
      [
        { role: "system", content: "你是专业的玄学顾问，善于结合现实背景给出温和但明确的建议。" },
        { role: "user", content: prompt },
      ],
      { temperature: 0.7, max_tokens: 900 },
    );

    const items = normalizeAIItems(aiContent);
    if (!items.length) {
      return fallback;
    }

    return {
      title: `${nickname}的《${skill.title}》`,
      completeness: fallback.completeness,
      confidence: fallback.confidence,
      overview: items[0],
      items,
    };
  } catch (error) {
    console.error("[report] buildReportResult fallback", error);
    return fallback;
  }
}
