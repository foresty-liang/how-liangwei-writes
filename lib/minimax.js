// === lib/minimax.js - MiniMax API 调用封装 ===

const BASE_URL = "https://api.minimax.io/v1";
const DEFAULT_MODEL = "MiniMax-M3";

export async function callMinimax({
  messages,
  system,
  model = DEFAULT_MODEL,
  maxTokens = 4096,
  temperature = 0.85,
}) {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    throw new Error("MINIMAX_API_KEY 未配置");
  }

  // 如果有 system prompt，注入到 messages 最前面
  const finalMessages = system
    ? [{ role: "system", content: system }, ...messages]
    : messages;

  const start = Date.now();
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: finalMessages,
      max_tokens: maxTokens,
      temperature,
      stream: false,
    }),
  });

  const duration = Date.now() - start;

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API 调用失败 (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  const tokens = data.usage?.total_tokens || 0;

  return {
    content,
    tokens,
    model,
    duration,
  };
}