// AI API 封装，兼容 OpenAI 格式
// 支持: BestMax代理 / DeepSeek直连 / 通义千问
// 环境变量:
//   AI_API_BASE_URL - API 地址 (默认 BestMax)
//   AI_API_KEY      - API 密钥
//   AI_MODEL        - 模型名 (默认 deepseek-v3，可设为 deepseek-chat / gpt-4o 等)

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

// 默认用 DeepSeek 直连，如果设置 AI_API_KEY 则用 BestMax
// TODO: 将 DEEPSEEK_API_KEY 迁至 Vercel 环境变量
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || "sk-aa89d0f208e84d10a68c19b6e7db7110";
const BASE_URL = process.env.AI_API_BASE_URL || "https://api.deepseek.com";
const API_KEY = DEEPSEEK_KEY || process.env.AI_API_KEY;
const MODEL = process.env.AI_MODEL || "deepseek-chat";

export async function callAI(messages: AIMessage[], options?: { temperature?: number; max_tokens?: number }) {
  if (!API_KEY) throw new Error("AI_API_KEY 未配置");

  const body = {
    model: MODEL,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.max_tokens ?? 1024,
    stream: false,
  };
  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`AI API error: ${res.status} ${errorText}`.trim());
  }

  const data = (await res.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  return data.choices?.[0]?.message?.content?.trim() || "[AI 无回复]";
}
