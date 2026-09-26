// === api/chat.js - Vercel Serverless Function ===

import { callMinimax } from "../lib/minimax.js";
import { LIANGWEI_SYSTEM_PROMPT, buildUserPrompt } from "../lib/prompt.js";
import { matchArticles } from "../lib/knowledge.js";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "仅支持 POST" });
  }

  try {
    const { messages = [] } = req.body || {};
    if (messages.length === 0) {
      return res.status(400).json({ error: "消息为空" });
    }

    // 取用户最新一条消息作为主题
    const userMessage = messages[messages.length - 1].content;

    // 知识库匹配
    const matched = matchArticles(userMessage, 3);

    // 拼装 prompt
    const systemPrompt = LIANGWEI_SYSTEM_PROMPT;
    const userPrompt = buildUserPrompt(userMessage, matched);

    // 构造发给 LLM 的消息
    const llmMessages = [
      { role: "user", content: userPrompt },
    ];

    // 调用 MiniMax
    const result = await callMinimax({
      messages: llmMessages,
      system: systemPrompt,
      maxTokens: 6000,
      temperature: 0.85,
    });

    return res.status(200).json({
      content: result.content,
      meta: {
        model: result.model,
        tokens: result.tokens,
        duration: result.duration,
        matched: matched.map((m) => m.title),
      },
    });
  } catch (e) {
    console.error("[chat] error:", e);
    return res.status(500).json({ error: e.message || "服务器错误" });
  }
}