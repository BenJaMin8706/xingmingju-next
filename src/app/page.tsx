"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type Skill = {
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

type ReportResult = {
  title: string;
  completeness: string;
  confidence: number;
  overview: string;
  items: string[];
};

type SavedReport = {
  id: string;
  createdAt: string;
  skillId: string;
  result: ReportResult;
};

const skills: Skill[] = [
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
    discount: "17%",
    price: "20",
    oldPrice: "24",
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
    oldPrice: "7",
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
    price: "23",
    oldPrice: "26",
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
    discount: "14%",
    price: "30",
    oldPrice: "35",
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
    discount: "10%",
    price: "19",
    oldPrice: "21",
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
    discount: "19%",
    price: "17",
    oldPrice: "21",
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
    discount: "11%",
    price: "25",
    oldPrice: "28",
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
    discount: "24%",
    price: "13",
    oldPrice: "17",
    tag: "月运",
    fields: ["出生信息", "本月目标", "感情状态", "工作状态", "财务压力"],
  },
  {
    id: "baby-naming",
    title: "宝宝起名：八字五行 + 寓意音韵",
    teacher: "赐名阁AI",
    category: ["naming", "bazi"],
    desc: "根据父母姓氏、宝宝生辰八字和五行喜用神，生成大名小名各 3 个备选。",
    image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=500&q=82",
    rating: "4.9",
    users: "3万+",
    discount: "13%",
    price: "35",
    oldPrice: "40",
    tag: "起名",
    fields: ["父母姓氏", "宝宝性别", "宝宝出生日期", "宝宝出生时间", "出生地", "偏好风格"],
  },
  {
    id: "plate-fortune",
    title: "车牌号吉凶：数字五行 + 81数理",
    teacher: "行车命理局",
    category: ["number", "wealth"],
    desc: "分析车牌数字五行组合、81数理吉凶和车主命局适配度。",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=500&q=82",
    rating: "4.7",
    users: "5万+",
    discount: "17%",
    price: "15",
    oldPrice: "18",
    tag: "测号",
    fields: ["完整车牌号", "车主出生日期", "车主出生时间", "车主出生地", "主要用车场景"],
  },
  {
    id: "phone-fortune",
    title: "手机号吉凶：八星磁场 + 数字能量",
    teacher: "号码能量局",
    category: ["number", "daily"],
    desc: "分析手机号末尾数字的八星磁场、五行属性及对财运、感情、健康的影响。",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=500&q=82",
    rating: "4.8",
    users: "8万+",
    discount: "17%",
    price: "15",
    oldPrice: "18",
    tag: "测号",
    fields: ["手机号码", "机主出生日期", "机主性别", "机主职业", "最关心的问题"],
  },
];

const categories = [
  ["all", "全部"],
  ["love", "情感"],
  ["tarot", "塔罗"],
  ["bazi", "八字"],
  ["wealth", "财运"],
  ["career", "事业"],
  ["daily", "每日"],
  ["compatibility", "合盘"],
  ["naming", "起名"],
  ["number", "测号"],
];

const categoryLabelMap = new Map<string, string>(categories.map(([value, label]) => [value, label]));

const navItems = ["技能", "聊天", "免费", "评价"] as const;
type NavLabel = (typeof navItems)[number];

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

const chatPromptCategories = [
  { id: "relationship-stage", label: "关系阶段", prompt: "我们现在处在暧昧、断联或分手后的哪个阶段？我想判断下一步该主动还是观察。", keywords: ["暧昧", "断联", "分手", "复合", "阶段", "主动", "观察"] },
  { id: "timeline", label: "时间线", prompt: "我们最近一次互动是什么时候？中间发生了哪些关键节点？我想梳理这段关系的时间线。", keywords: ["多久", "什么时候", "最近", "时间", "昨天", "上周", "节点", "联系"] },
  { id: "person-info", label: "对方信息", prompt: "我想补充对方的性格、生日或近期表现，请帮我判断 TA 现在的真实状态。", keywords: ["对方", "TA", "他", "她", "生日", "性格", "表现", "状态"] },
  { id: "core-question", label: "核心问题", prompt: "我最想确认的是：这段关系还有机会吗？我现在最应该做什么？", keywords: ["机会", "怎么办", "该不该", "应该", "核心", "结果", "还会"] },
  { id: "wealth", label: "财运收入", prompt: "我想看看近期财运、收入或副业机会，最需要注意哪些风险和窗口？", keywords: ["财", "钱", "收入", "副业", "现金", "投资", "涨薪"] },
  { id: "career", label: "事业选择", prompt: "我正在纠结工作、跳槽或 offer 选择，想判断哪个方向更适合。", keywords: ["工作", "事业", "跳槽", "offer", "老板", "岗位", "职业"] },
  { id: "match", label: "合盘长期", prompt: "我想看这段关系是否适合长期发展，双方吸引点和冲突点在哪里？", keywords: ["合盘", "婚姻", "结婚", "长期", "伴侣", "稳定"] },
  { id: "daily", label: "今日提醒", prompt: "我想先做一次今日提醒，看看现在最该注意什么。", keywords: ["今天", "现在", "日签", "提醒", "免费", "注意"] },
  { id: "naming", label: "宝宝起名", prompt: "我想根据八字给宝宝起一个好名字，大名小名各要几个备选。", keywords: ["起名", "取名", "宝宝", "孩子", "改名", "名字"] },
  { id: "plate", label: "车牌测吉凶", prompt: "我想看看我的车牌号码吉凶，分析数字五行组合和81数理。", keywords: ["车牌", "车号", "牌照", "车牌号"] },
  { id: "phone", label: "手机号测吉凶", prompt: "我想测一下手机号码的吉凶，分析数字磁场和能量。", keywords: ["手机号", "电话", "号码", "手机"] },
] as const;

function createEmptyQuestionStats() {
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

function findQuestionCategory(question: string) {
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

function getVisibleQuestionChips(question: string, stats: Record<string, number>) {
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

const navTargets: Record<NavLabel, string> = {
  技能: "featured",
  聊天: "chat-section",
  免费: "free-section",
  评价: "review-section",
};

function SkillCard({ skill, onOpen }: { skill: Skill; onOpen: (skill: Skill) => void }) {
  const discount = skill.discount === "FREE" ? "免费" : `${skill.discount} OFF`;

  return (
    <button className="skill-card" type="button" onClick={() => onOpen(skill)}>
      <Image className={`skill-image ${skill.imageMode || ""}`} src={skill.image} alt={skill.title} width={500} height={340} unoptimized referrerPolicy="no-referrer" />
      <span className="skill-meta">
        <span className="skill-chip">{skill.tag}</span>
        <h3>{skill.title}</h3>
        <span className="teacher">by {skill.teacher}</span>
        <span className="rating"><strong>{skill.rating}</strong> · 用户 {skill.users}</span>
        <span className="desc">{skill.desc}</span>
        <span className="price-row"><strong>{skill.price} 星币</strong>{skill.price !== "0" && <del>{skill.oldPrice} 星币</del>}<span className="discount">{discount}</span></span>
      </span>
    </button>
  );
}

function buildMockResult(form: HTMLFormElement, skill: Skill) {
  const data = new FormData(form);
  const nickname = data.get("nickname") || "你";
  const hasTime = Boolean(data.get("birthTime"));
  const confidence = hasTime ? 88 : 78;

  return {
    title: `${nickname}的《${skill.title}》`,
    completeness: hasTime ? "高" : "中",
    confidence,
    overview: "已根据你提供的资料整理出当前最值得关注的趋势和下一步行动重点。",
    items: [
      "塔罗层：当前牌面显示问题有推进空间，但需要观察对方或现实环境的连续行动。",
      hasTime ? "命盘层：出生时间完整，可纳入宫位判断。" : "命盘层：缺少出生时间，紫微与宫位判断降权。",
      "现实层：你提供的背景会作为主判断依据，AI不会只凭玄学符号下结论。",
      "行动建议：未来7天适合小步验证，不适合一次性投入过多情绪或资金。",
    ],
  };
}

export default function Home() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [activeNav, setActiveNav] = useState<NavLabel>("技能");
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [chatQuestion, setChatQuestion] = useState("");
  const [dailyQuestionStats, setDailyQuestionStats] = useState<Record<string, number>>(createEmptyQuestionStats);
  const [chatSuggestion, setChatSuggestion] = useState<Skill | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [packageOpen, setPackageOpen] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof buildMockResult> | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authBirthDate, setAuthBirthDate] = useState("");
  const [authBirthTime, setAuthBirthTime] = useState("");
  const [authBirthPlace, setAuthBirthPlace] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [registerCaptchaToken, setRegisterCaptchaToken] = useState("");
  const [registerCaptchaKey, setRegisterCaptchaKey] = useState(0);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [credits, setCredits] = useState(0);
  const [buyOpen, setBuyOpen] = useState(false);
  const [buyBusy, setBuyBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredSkills = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return skills.filter((skill) => {
      const categoryMatch = activeCategory === "all" || skill.category.includes(activeCategory);
      const categoryLabels = skill.category.map((category) => categoryLabelMap.get(category) || category).join(" ");
      const text = [skill.title, skill.teacher, skill.desc, skill.tag, categoryLabels].join(" ").toLowerCase();
      return categoryMatch && (!normalizedQuery || text.includes(normalizedQuery));
    });
  }, [activeCategory, query]);

  const hasSkillFilters = activeCategory !== "all" || Boolean(query.trim());
  const newSkills = useMemo(() => filteredSkills.filter((skill) => skill.id !== "daily-oracle").slice().reverse().slice(0, 4), [filteredSkills]);

  const visibleQuestionChips = useMemo(() => getVisibleQuestionChips(chatQuestion, dailyQuestionStats), [chatQuestion, dailyQuestionStats]);
  const displayedChatSuggestion = chatQuestion.trim() ? recommendSkill(chatQuestion) : chatSuggestion;

  useEffect(() => {
    fetch("/api/questions/trending")
      .then((response) => response.json())
      .then((data: { counts?: Record<string, number> }) => {
        if (data.counts) setDailyQuestionStats({ ...createEmptyQuestionStats(), ...data.counts });
      })
      .catch(() => setDailyQuestionStats(createEmptyQuestionStats()));

    // Handle Stripe return
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    const authStatus = params.get("auth");
    if (paymentStatus === "success") {
      // Credits are added server-side by the verified Stripe webhook — never trust
      // the client to add them. The session effect refreshes the server balance.
      queueMicrotask(() => setToast("🎉 支付成功！星币将在到账后自动更新"));
      window.history.replaceState({}, "", "/");
    } else if (paymentStatus === "cancelled") {
      window.history.replaceState({}, "", "/");
    } else if (authStatus === "verified") {
      queueMicrotask(() => setToast("邮箱验证已完成，现在可以直接登录了"));
      window.history.replaceState({}, "", "/");
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    if (!session?.access_token) {
      queueMicrotask(() => {
        if (!cancelled) {
          setSavedReports([]);
          setCredits(0);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (!cancelled) setReportsLoading(true);
    });
    fetch("/api/reports", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("failed");
        return response.json();
      })
      .then((data: { reports?: SavedReport[] }) => setSavedReports(data.reports || []))
      .catch(() => setSavedReports([]))
      .finally(() => setReportsLoading(false));

    fetch("/api/user/credits", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((d: { credits?: number; welcomeGranted?: boolean }) => {
        setCredits(d.credits || 0);
        // New user: claim one-time welcome bonus (amount decided & guarded server-side)
        if (!d.welcomeGranted) {
          fetch("/api/user/credits", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          })
            .then((r2) => r2.json())
            .then((d2: { credits?: number; added?: number }) => {
              setCredits(d2.credits || 0);
              if (d2.added && d2.added > 0) {
                setToast(`🎁 首次登录赠送 ${d2.added} 星币体验金`);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

  function resetFilters() {
    setQuery("");
    setActiveCategory("all");
  }

  function resetRegisterCaptcha() {
    setRegisterCaptchaToken("");
    setRegisterCaptchaKey((value) => value + 1);
  }

  function resetAuthFeedback() {
    setAuthError("");
    setAuthMessage("");
    setPendingVerificationEmail("");
  }

  function scrollToSection(id: string) {
    window.setTimeout(() => {
      const target = document.getElementById(id);
      if (!target) return;
      const headerOffset = 92;
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: "auto" });
    }, 0);
  }

  function handleNavClick(label: NavLabel) {
    setActiveNav(label);

    if (label === "技能") {
      resetFilters();
    }

    scrollToSection(navTargets[label]);
  }

  function recommendSkill(question: string) {
    const text = question.trim().toLowerCase();
    if (/财|钱|收入|副业|现金|投资/.test(text)) return skills.find((skill) => skill.id === "bazi-wealth") || skills[0];
    if (/工作|事业|跳槽|offer|老板|岗位|职业/.test(text)) return skills.find((skill) => skill.id === "career-choice") || skills[0];
    if (/合盘|婚姻|结婚|长期|伴侣/.test(text)) return skills.find((skill) => skill.id === "marriage-match") || skills[0];
    if (/免费|今天|现在|日签|提醒/.test(text)) return skills.find((skill) => skill.id === "daily-oracle") || skills[0];
    if (/正缘|对象|桃花/.test(text)) return skills.find((skill) => skill.id === "ziwei-love-map") || skills[0];
    if (/起名|取名|名字|宝宝|孩子|小孩|改名/.test(text)) return skills.find((skill) => skill.id === "baby-naming") || skills[0];
    if (/车牌|车号|牌照/.test(text)) return skills.find((skill) => skill.id === "plate-fortune") || skills[0];
    if (/手机号|电话号码|号码/.test(text)) return skills.find((skill) => skill.id === "phone-fortune") || skills[0];
    return skills.find((skill) => skill.id === "reunion-tarot") || skills[0];
  }

  async function submitChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = chatQuestion || "我想先做一次免费体验";
    await recordQuestionCategory(question);
    setChatSuggestion(recommendSkill(question));
  }

  async function recordQuestionCategory(question: string) {
    const matchedCategory = findQuestionCategory(question);
    const fallbackStats = { ...createEmptyQuestionStats(), ...dailyQuestionStats, [matchedCategory.id]: (dailyQuestionStats[matchedCategory.id] || 0) + 1 };

    try {
      const response = await fetch("/api/chat/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, record: true }),
      });
      const data = (await response.json()) as { stats?: Record<string, number>; skill?: Skill };
      setDailyQuestionStats({ ...createEmptyQuestionStats(), ...(data.stats || fallbackStats) });
      if (data.skill) setChatSuggestion(data.skill);
    } catch {
      setDailyQuestionStats(fallbackStats);
    }
  }

  async function openSkill(skill: Skill) {
    setSelectedSkill(skill);
    setResult(null);
  }

  // Pre-fill form data from user profile
  const userProfile = useMemo(() => {
    if (!user) return null;
    const meta = (user.user_metadata || {}) as Record<string, unknown>;
    return {
      username: (meta.username as string) || "",
      birthDate: (meta.birthDate as string) || "",
      birthTime: (meta.birthTime as string) || "",
      birthPlace: (meta.birthPlace as string) || "",
    };
  }, [user]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setAuthError("登录服务未配置。");
      return;
    }
    setAuthBusy(true);
    setAuthError("");
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword,
    });

    if (error) {
      setAuthError(error.message === "Invalid login credentials"
        ? "邮箱或密码错误，请重试"
        : error.message);
    } else {
      setAuthOpen(false);
      setAuthPassword("");
      setPendingVerificationEmail("");
      setToast("👋 登录成功");
    }
    setAuthBusy(false);
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!turnstileSiteKey) {
      setAuthError("注册验证码未配置，暂时无法开放注册。");
      return;
    }
    if (authPassword.length < 6) {
      setAuthError("密码至少需要6位");
      return;
    }
    if (!registerCaptchaToken) {
      setAuthError("请先完成人机验证");
      return;
    }
    setAuthBusy(true);
    setAuthError("");
    setAuthMessage("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword,
          username: authUsername.trim(),
          birthDate: authBirthDate,
          birthTime: authBirthTime,
          birthPlace: authBirthPlace.trim(),
          captchaToken: registerCaptchaToken,
        }),
      });
      const data = await response.json() as { error?: string; message?: string };

      if (!response.ok) {
        setAuthError(data.error || "注册失败，请稍后重试");
        resetRegisterCaptcha();
      } else {
        setPendingVerificationEmail(authEmail.trim());
        setAuthMessage(data.message || `注册成功！验证邮件已发送到 ${authEmail.trim()}，完成验证后会自动返回首页。`);
        setAuthPassword("");
        resetRegisterCaptcha();
      }
    } catch {
      setAuthError("网络错误，请稍后重试");
      resetRegisterCaptcha();
    }
    setAuthBusy(false);
  }

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut({ scope: "local" });
    setAuthOpen(false);
    resetAuthFeedback();
    setAuthPassword("");
  }

  async function handleBuyCredits(packageId: string) {
    setBuyBusy(true);
    try {
      if (!session?.access_token) {
        alert("请先登录");
        setBuyBusy(false);
        return;
      }

      const resp = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ packageId }),
      });
      const data = await resp.json();
      if (data.demo) {
        // Payment is not configured on the server. We must NOT grant spendable
        // credits from the client — that would let anyone top up for free.
        alert("支付功能尚未开通，请稍后再试或联系客服");
      } else if (data.url) {
        window.location.assign(data.url);
      } else {
        alert("支付暂不可用，请稍后再试");
      }
    } catch {
      alert("网络错误");
    }
    setBuyBusy(false);
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSkill) return;
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ skillId: selectedSkill.id, payload }),
      });

      if (response.status === 402) {
        const errData = await response.json() as { needed?: number; message?: string };
        alert(errData.message || "星币不足，请先充值");
        setBuyOpen(true);
        return;
      }

      const data = (await response.json()) as { result?: ReturnType<typeof buildMockResult> };
      setResult(data.result || buildMockResult(form, selectedSkill));

      // Refresh credits after report generation
      if (session?.access_token) {
        fetch("/api/user/credits", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
          .then((r) => r.json())
          .then((d: { credits?: number }) => setCredits(d.credits || 0))
          .catch(() => {});

        const refresh = await fetch("/api/reports", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (refresh.ok) {
          const refreshData = (await refresh.json()) as { reports?: SavedReport[] };
          setSavedReports(refreshData.reports || []);
        }
      }
    } catch {
      setResult(buildMockResult(form, selectedSkill));
    }
  }

  return (
    <>
      {toast && (
        <div className="toast-bar" role="status" aria-live="polite">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="关闭">×</button>
        </div>
      )}
      <header className="app-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="星命局首页">
            <Image src="/logo.svg" alt="星命局 · AI运势技能商店" className="brand-logo" width={500} height={140} priority />
          </a>
          <label className="search-box"><span className="search-label">搜索<span className="search-divider" aria-hidden="true">|</span></span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="复合、财运、塔罗、八字" /></label>
          <nav className="main-tabs" aria-label="主导航">
            {navItems.map((label) => <button className={activeNav === label ? "active" : ""} key={label} type="button" onClick={() => handleNavClick(label)} aria-current={activeNav === label ? "page" : undefined}>{label}</button>)}
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <span className="user-badge">{userProfile?.username || user.email?.split("@")[0] || "用户"}</span>
                <button className="ghost-btn" type="button" onClick={() => scrollToSection("account-section")}>我的报告</button>
                <button className="secondary-btn" type="button" onClick={handleLogout}>退出</button>
              </>
            ) : (
              <button className="secondary-btn" type="button" onClick={() => { setAuthOpen(true); setAuthTab("login"); resetAuthFeedback(); resetRegisterCaptcha(); }}>登录 / 注册</button>
            )}
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero-store">
          <div className="hero-content">
            <p className="eyebrow">AI metaphysics marketplace</p>
            <h1>像点外卖一样，选择你今天需要的运势技能。</h1>
            <p>星命局把塔罗、八字、西占、紫微、周易包装成一个个可购买的 AI 报告。先选主题，再补资料，最后生成结构化解读。</p>
            <div className="hero-actions"><a className="primary-btn" href="#featured">看热门技能</a><button className="secondary-btn" type="button" onClick={() => setPackageOpen(true)}>查看套餐</button></div>
          </div>
          <div className="hero-banner" aria-label="限时活动"><span className="promo-badge">本月限时</span><h2>新用户首单 50% OFF</h2><p>每日运势免费抽取，深度报告从 13 星币起。</p><div className="promo-details"><div><strong>0 星币</strong><span>每日轻量提示</span></div><div><strong>3步</strong><span>问诊后生成报告</span></div></div><ul className="promo-list"><li>首单可用于塔罗、八字、合盘等深度报告</li><li>先由 AI 推荐技能，再进入资料采集</li></ul><button type="button" onClick={() => handleNavClick("聊天")}>立即体验</button></div>
        </section>

        <section className="store-grid" id="featured">
          <div className="content-feed">
            <section className="skill-section">
              <div className="section-head"><div><p className="eyebrow">Trending</p><h2>现在热门的技能</h2></div><button className="link-btn" type="button" onClick={resetFilters}>{hasSkillFilters ? "清除筛选" : `全部 ${skills.length} 项`}</button></div>
              <section className="category-strip" aria-label="全部分类">
                {categories.map(([value, label]) => <button className={`category ${activeCategory === value ? "active" : ""}`} key={value} type="button" onClick={() => setActiveCategory(value)}>{label}</button>)}
              </section>
              <div className="skill-list">{filteredSkills.length ? filteredSkills.map((skill) => <SkillCard key={skill.id} skill={skill} onOpen={openSkill} />) : <p className="section-note">没有找到相关技能。</p>}</div>
            </section>

            <section className="chat-section" id="chat-section">
              <div className="chat-copy">
                <p className="eyebrow">AI chat</p>
                <h2>先聊清楚，再进入测算</h2>
                <p>这里不是直接给结论，而是先像问诊一样收集背景：你问什么、发生了什么、时间线如何、最想确认哪一点。聊完后再推荐最合适的技能。</p>
                <div className="chat-actions"><button className="purchase-btn" type="button" onClick={() => setChatQuestion("我想知道 TA 还会不会主动找我")}>套用示例问题</button><button className="secondary-btn" type="button" onClick={() => handleNavClick("技能")}>查看技能</button></div>
              </div>
              <form className="chat-preview" aria-label="聊天示例" onSubmit={submitChat}>
                <div className="chat-bubble user">我想知道 TA 还会不会主动找我。</div>
                <div className="chat-bubble ai">我会先确认几个关键点：你们分开多久、最近一次互动、是否有明确冲突、你最想验证主动还是复合。</div>
                <div className="question-list" aria-label="快捷补充问题">{visibleQuestionChips.map((category) => <button key={category.id} type="button" title={`今日提问 ${dailyQuestionStats[category.id] || 0} 次`} onClick={() => setChatQuestion(category.prompt)}>{category.label}</button>)}</div>
                <label className="chat-input">你的问题<textarea value={chatQuestion} onChange={(event) => setChatQuestion(event.target.value)} placeholder="例如：我们分开两周了，我想知道是否该主动联系。" /></label>
                <button className="purchase-btn" type="submit">让 AI 推荐技能</button>
                {displayedChatSuggestion && <div className="suggestion-card"><span>推荐技能</span><strong>{displayedChatSuggestion.title}</strong><p>{displayedChatSuggestion.desc}</p><button type="button" onClick={() => openSkill(displayedChatSuggestion)}>进入测算</button></div>}
              </form>
            </section>

            <section className="skill-section">
              <div className="section-head"><div><p className="eyebrow">New</p><h2>新上线推荐</h2></div><span className="section-note">每日更新</span></div>
              <div className="skill-list compact-list">{newSkills.length ? newSkills.map((skill) => <SkillCard key={`new-${skill.id}`} skill={skill} onOpen={openSkill} />) : <p className="section-note">暂无新的同类技能。</p>}</div>
            </section>

            <section className="skill-section">
              <div className="section-head"><div><p className="eyebrow">Package</p><h2>组合套餐</h2></div><button className="link-btn" type="button" onClick={() => setPackageOpen(true)}>套餐说明</button></div>
              <div className="package-row">
                <article className="package-card"><span>5个技能</span><h3>恋爱复盘完全包</h3><p>暧昧、复合、对方想法、合盘、未来30天。</p><strong>60 星币</strong><button type="button" onClick={() => setPackageOpen(true)}>查看详情</button></article>
                <article className="package-card"><span>4个技能</span><h3>事业财运启动包</h3><p>跳槽、涨薪、副业、现金流窗口。</p><strong>50 星币</strong><button type="button" onClick={() => setPackageOpen(true)}>查看详情</button></article>
                <article className="package-card"><span>7个技能</span><h3>年度命局总览包</h3><p>八字、紫微、星盘、月运与关键选择。</p><strong>88 星币</strong><button type="button" onClick={() => setPackageOpen(true)}>查看详情</button></article>
              </div>
            </section>

            <section className="free-zone" id="free-section">
              <div className="free-offer">
                <p className="eyebrow">Free trial</p>
                <h2>免费体验入口</h2>
                <p>新用户可以先体验一次轻量提示，理解星命局的提问、分析和升级路径，再决定是否购买深度报告。</p>
                <button className="purchase-btn" type="button" onClick={() => openSkill(skills[1])}>抽取今日提示</button>
              </div>
              <div className="free-steps">
                <article><span>01</span><strong>输入当前问题</strong><p>一句话说明你今天最在意的事。</p></article>
                <article><span>02</span><strong>生成轻量结果</strong><p>控制在短报告范围内，快速给出提醒。</p></article>
                <article><span>03</span><strong>升级深度报告</strong><p>需要更细时再进入塔罗、八字或合盘技能。</p></article>
              </div>
            </section>

            <section className="skill-section" id="review-section">
              <div className="section-head"><div><p className="eyebrow">Reviews</p><h2>用户评价</h2></div><span className="section-note">实时精选</span></div>
              <div className="review-list">
                <article><strong>“报告没有只说好听话”</strong><p>它会把牌面、出生信息和现实互动分开讲，最后给出的行动步骤比较清楚。</p><span>复合塔罗用户 · 5分钟前</span></article>
                <article><strong>“像先问诊再给方案”</strong><p>不是直接甩结论，会先追问背景，适合把纠结的问题整理成可执行选择。</p><span>事业选择用户 · 18分钟前</span></article>
                <article><strong>“免费一问适合每天看”</strong><p>轻量提醒足够快，想看细节时再买报告，路径比较自然。</p><span>今日免费一问用户 · 32分钟前</span></article>
              </div>
            </section>
          </div>

          <aside className="right-rail">
            <div className="account-card" id="account-section">
              <div className="section-head compact-head">
                <div>
                  <p className="eyebrow">Account</p>
                  <h2>我的报告</h2>
                </div>
              </div>
              {user ? (
                <>
                  <div className="profile-info">
                    <p className="section-note">
                      {userProfile?.username ? <><strong>{userProfile.username}</strong> · </> : null}
                      {user.email}
                    </p>
                    {(userProfile?.birthDate) ? (
                      <p className="section-note" style={{ fontSize: "0.84rem" }}>
                        📅 {userProfile.birthDate}{userProfile.birthTime ? ` · ${userProfile.birthTime}` : ""}{userProfile.birthPlace ? ` · ${userProfile.birthPlace}` : ""}
                      </p>
                    ) : null}
                  </div>
                  {reportsLoading ? (
                    <p className="section-note">正在加载历史报告...</p>
                  ) : savedReports.length ? (
                    <div className="account-list">
                      {savedReports.map((report) => (
                        <article key={report.id}>
                          <strong>{report.result?.title || report.skillId}</strong>
                          <p>{report.result?.overview || "已生成报告，可继续查看详情。"}</p>
                          <span>{new Date(report.createdAt).toLocaleString("zh-CN", { hour12: false })}</span>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="section-note">你还没有绑定到账号的历史报告，登录后新生成的报告会自动归档。</p>
                  )}
                </>
              ) : (
                <p className="section-note" style={{ lineHeight: 1.65 }}>登录后可保存你的历史报告、跨设备查看，并持续积累个人运势档案。</p>
              )}
            </div>
            <div className="wallet-card"><div><span>我的星币</span><strong>{credits}</strong></div><button type="button" onClick={() => setBuyOpen(true)}>充值</button></div>
            <div className="rank-card"><h2>今日榜单</h2><ol>{skills.slice(0, 5).map((skill) => <li key={`rank-${skill.id}`}><button type="button" onClick={() => openSkill(skill)}><strong>{skill.title}</strong><span>{skill.rating} · {skill.users}</span></button></li>)}</ol></div>
            <div className="free-card"><span>GUIDE</span><h2>新手测算流程</h2><p>先说明问题背景，再由 AI 推荐塔罗、八字、合盘或月运技能。</p><button type="button" onClick={() => scrollToSection("chat-section")}>查看流程</button></div>
          </aside>
        </section>

        <footer className="site-footer">
          <div>
            <strong>星命局</strong>
            <p>AI 运势技能商店 · 塔罗、八字、西占、紫微与周易合参</p>
          </div>
          <div className="footer-links"><span>用户协议</span><span>隐私保护</span><span>报告说明</span><span>商务合作</span></div>
        </footer>
      </main>

      {selectedSkill && (
        <div className="modal-backdrop" role="presentation">
          <section className="skill-dialog" role="dialog" aria-modal="true" aria-labelledby="skillTitle">
            <div className="dialog-shell">
              <button className="close-btn" type="button" onClick={() => setSelectedSkill(null)} aria-label="关闭">×</button>
              <div className="skill-detail">
                <div className="detail-hero">
                  <Image className={selectedSkill.imageMode || ""} src={selectedSkill.image} alt={selectedSkill.title} width={800} height={560} unoptimized referrerPolicy="no-referrer" />
                  <div className="detail-copy"><span className="skill-chip">{selectedSkill.tag}</span><h2 id="skillTitle">{selectedSkill.title}</h2><p>{selectedSkill.desc}</p><div className="detail-stats"><span>评分 {selectedSkill.rating}</span><span>用户 {selectedSkill.users}</span><span>{selectedSkill.teacher}</span></div><div className="purchase-panel"><div><strong>{selectedSkill.price} 星币</strong> {selectedSkill.price !== "0" && <><del>{selectedSkill.oldPrice} 星币</del></>}<p>购买前先补齐资料，AI会按报告模板生成结果。</p></div><a className="purchase-btn" href="#order-form">开始测算</a></div></div>
                </div>
                <form className="intake-form" id="order-form" onSubmit={submitOrder}>
                  <h3>报告资料采集</h3>
                  <div className="intake-grid">
                    <label>昵称<input name="nickname" defaultValue={userProfile?.username || ""} placeholder="可选，例如：阿星" /></label>
                    <label>出生日期<input name="birthDate" type="date" defaultValue={userProfile?.birthDate || ""} required /></label>
                    <label>出生时间<input name="birthTime" type="time" defaultValue={userProfile?.birthTime || ""} required /></label>
                    <label>出生地<input name="birthPlace" defaultValue={userProfile?.birthPlace || ""} placeholder="例如：杭州" required /></label>
                    {selectedSkill.fields.map((field, index) => <label key={field}>{field}<input name={`field${index}`} placeholder={`可选，${field}`} /></label>)}
                  </div>
                  <label>补充背景<textarea name="context" placeholder="可选，把最近发生的事、你最担心的问题写清楚" /></label>
                  <button className="purchase-btn" type="submit">生成 AI 报告</button>
                </form>
                {result && <div className="result-box show"><h3>{result.title}</h3><p><strong>资料完整度：</strong>{result.completeness} · <strong>合参置信度：</strong>{result.confidence}%</p><p>{result.overview}</p><ul>{result.items.map((item) => <li key={item}>{item}</li>)}</ul></div>}
              </div>
            </div>
          </section>
        </div>
      )}

      {packageOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="skill-dialog" role="dialog" aria-modal="true" aria-labelledby="packageTitle">
            <div className="dialog-shell small-dialog">
              <button className="close-btn" type="button" onClick={() => setPackageOpen(false)} aria-label="关闭">×</button>
              <p className="eyebrow">Membership</p><h2 id="packageTitle">星命局商业化结构</h2>
              <div className="plan-list"><article><span>单次报告</span><strong>13 - 30 星币</strong><p>适合冲动型、主题型消费。</p></article><article><span>技能包</span><strong>50 星币起</strong><p>按情感、事业、年度运势打包售卖。</p></article><article><span>会员</span><strong>39 星币/月</strong><p>每日免费问、折扣券、月运报告。</p></article></div>
            </div>
          </section>
        </div>
      )}

      {buyOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="skill-dialog" role="dialog" aria-modal="true" aria-labelledby="buyTitle">
            <div className="dialog-shell small-dialog">
              <button className="close-btn" type="button" onClick={() => setBuyOpen(false)} aria-label="关闭">×</button>
              <p className="eyebrow">Credits</p>
              <h2 id="buyTitle">购买星币</h2>
              <p className="section-note" style={{ marginBottom: 12 }}>当前余额：<strong>{credits}</strong> 星币</p>
              <div className="plan-list">
                {[
                  { id: "100", name: "100 星币", price: "¥10", desc: "适合试用" },
                  { id: "500", name: "500 星币", price: "¥45", desc: "9折 · 适合深度体验" },
                  { id: "1200", name: "1200 星币", price: "¥99", desc: "82折 · 最划算" },
                ].map((pkg) => (
                  <article key={pkg.id}>
                    <span>{pkg.name}</span>
                    <strong>{pkg.price}</strong>
                    <p>{pkg.desc}</p>
                    <button
                      className="purchase-btn"
                      style={{ width: "100%", marginTop: 8 }}
                      type="button"
                      disabled={buyBusy}
                      onClick={() => handleBuyCredits(pkg.id)}
                    >
                      {buyBusy ? "处理中..." : "购买"}
                    </button>
                  </article>
                ))}
              </div>
              <p className="section-note" style={{ fontSize: 12, marginTop: 8 }}>
                Stripe 安全支付 · 购买后自动到账 · 测试模式
              </p>
            </div>
          </section>
        </div>
      )}

      {authOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => { setAuthOpen(false); resetAuthFeedback(); resetRegisterCaptcha(); }}>
          <section className="skill-dialog" role="dialog" aria-modal="true" aria-labelledby="authTitle" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-shell auth-dialog">
              <button className="close-btn" type="button" onClick={() => { setAuthOpen(false); resetAuthFeedback(); resetRegisterCaptcha(); }} aria-label="关闭">×</button>

              {/* Tab switcher */}
              <div className="auth-tabs">
                <button className={authTab === "login" ? "active" : ""} type="button" onClick={() => { setAuthTab("login"); resetAuthFeedback(); resetRegisterCaptcha(); }}>
                  登录
                </button>
                <button className={authTab === "register" ? "active" : ""} type="button" onClick={() => { setAuthTab("register"); resetAuthFeedback(); resetRegisterCaptcha(); }}>
                  注册
                </button>
              </div>

              {authTab === "login" ? (
                <>
                  <h2 id="authTitle">欢迎回来</h2>
                  <p className="section-note">使用邮箱和密码登录你的星命局账号</p>
                  <form className="auth-form" onSubmit={handleLogin}>
                    <label>邮箱<input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@example.com" required /></label>
                    <label>密码<input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="输入密码" required /></label>
                    <button className="purchase-btn" type="submit" disabled={authBusy}>{authBusy ? "登录中..." : "登录"}</button>
                  </form>
                </>
              ) : (
                <>
                  <h2 id="authTitle">创建账号</h2>
                  <p className="section-note">注册后你的报告和星币会绑定到账号，后续登录即可查看</p>
                  <form className="auth-form" onSubmit={handleRegister}>
                    <label>邮箱<input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@example.com" required /></label>
                    <label>密码<input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="至少6位密码" required minLength={6} /></label>
                    <label>昵称<input type="text" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} placeholder="给自己起个名字，如：阿星" /></label>
                    <div className="auth-row">
                      <label>出生日期<input type="date" value={authBirthDate} onChange={(e) => setAuthBirthDate(e.target.value)} /></label>
                      <label>出生时间<input type="time" value={authBirthTime} onChange={(e) => setAuthBirthTime(e.target.value)} /></label>
                    </div>
                    <label>出生地<input type="text" value={authBirthPlace} onChange={(e) => setAuthBirthPlace(e.target.value)} placeholder="例如：杭州" /></label>
                    {turnstileSiteKey ? (
                      <TurnstileWidget
                        key={registerCaptchaKey}
                        siteKey={turnstileSiteKey}
                        onToken={setRegisterCaptchaToken}
                        onError={() => setAuthError("人机验证加载失败，请稍后重试")}
                      />
                    ) : (
                      <p className="helper-text error-text auth-notice">注册验证码尚未配置，当前不能开放注册。</p>
                    )}
                    {pendingVerificationEmail ? <p className="helper-text success-text auth-notice">验证邮件将发送到 {pendingVerificationEmail}，验证完成后会自动返回首页。</p> : null}
                    <p className="helper-text" style={{ fontSize: 12, marginBottom: 4 }}>这些信息会在你购买技能时自动填入，省去重复填写</p>
                    <button className="purchase-btn" type="submit" disabled={authBusy || !turnstileSiteKey}>{authBusy ? "注册中..." : "注册"}</button>
                  </form>
                </>
              )}

              {authMessage ? <p className="helper-text success-text">{authMessage}</p> : null}
              {authError ? <p className="helper-text error-text">{authError}</p> : null}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
