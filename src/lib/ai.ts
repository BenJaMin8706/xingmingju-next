// AI API 封装，兼容 OpenAI 格式，支持 BestMax/DeepSeek/通义千问

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const BASE_URL = process.env.AI_API_BASE_URL || "https://api.bestmax.cc";
const API_KEY = process.env.AI_API_KEY;
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
