// === lib/knowledge.js - 知识库加载与匹配 ===

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let _articles = null;
let _styleProfile = null;

function loadArticles() {
  if (_articles) return _articles;
  const file = path.join(__dirname, "..", "data", "articles-meta.json");
  _articles = JSON.parse(fs.readFileSync(file, "utf8"));
  return _articles;
}

function loadStyleProfile() {
  if (_styleProfile) return _styleProfile;
  const file = path.join(__dirname, "..", "data", "style-profile.json");
  _styleProfile = JSON.parse(fs.readFileSync(file, "utf8"));
  return _styleProfile;
}

// 关键词匹配：根据用户输入找出最相关的 3-5 篇范文
export function matchArticles(query, topK = 3) {
  const articles = loadArticles();
  const q = query.toLowerCase();

  // 提取查询关键词（中文 2-4 字 + 英文小写）
  const tokens = [];
  // 中文：连续 2-4 个汉字
  const cnMatches = query.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
  tokens.push(...cnMatches);
  // 英文：连续 3+ 个字母
  const enMatches = query.match(/[a-zA-Z]{3,}/g) || [];
  tokens.push(...enMatches.map((s) => s.toLowerCase()));

  // 给每篇文章打分
  const scored = articles.map((a) => {
    let score = 0;
    const searchable = [
      a.title,
      a.summary || "",
      (a.tags || []).join(" "),
      a.facts || "",
      a.style || "",
    ]
      .join(" ")
      .toLowerCase();

    for (const t of tokens) {
      if (searchable.includes(t.toLowerCase())) {
        // 标题命中权重高
        if (a.title.toLowerCase().includes(t.toLowerCase())) score += 5;
        // 标签命中权重次之
        if ((a.tags || []).some((tag) => tag.includes(t))) score += 3;
        // 摘要 / 事实命中
        else score += 1;
      }
    }

    return { ...a, score };
  });

  // 按分数排序，取 topK；如果全部 0，返回最新的 3 篇作为兜底
  const sorted = scored.sort((a, b) => b.score - a.score);
  const top = sorted.slice(0, topK);

  if (top.every((a) => a.score === 0)) {
    return sorted.slice(0, topK);
  }
  return top.filter((a) => a.score > 0).concat(sorted.slice(0, topK - 1)).slice(0, topK);
}

export function getStyleProfile() {
  return loadStyleProfile();
}

export function getAllArticles() {
  return loadArticles();
}