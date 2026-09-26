// === scripts/build-knowledge.js ===
// 把 samples/INDEX.md 转成 data/articles-meta.json

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 知识库根目录（智能兼容多种相对位置）
function findKnowledgeBase() {
  const candidates = [
    path.join(__dirname, "..", "..", "..", ".minimax", "agents", "my-news-writer", "samples"),
    path.join("C:", "Users", "Lw181", ".minimax", "agents", "my-news-writer", "samples"),
    "C:/Users/Lw181/.minimax/agents/my-news-writer/samples",
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "INDEX.md"))) return c;
  }
  throw new Error("找不到 samples/INDEX.md，请手动指定路径");
}

const ROOT = findKnowledgeBase();
const INDEX_FILE = path.join(ROOT, "INDEX.md");

const content = fs.readFileSync(INDEX_FILE, "utf8");

// 按 "### YYYY-MM-DD 标题" 切分
const articleChunks = content.split(/(?=^### \d{4}-\d{2}-\d{2} )/m);

const articles = [];

for (const chunk of articleChunks) {
  if (!chunk.startsWith("### ")) continue;

  const titleMatch = chunk.match(/^### (\d{4}-\d{2}-\d{2}) (.+?)$/m);
  if (!titleMatch) continue;
  const date = titleMatch[1];
  const title = titleMatch[2].trim();

  // 跳过示例模板
  if (title.includes("示例模板")) continue;

  // 提取字段
  const extract = (key) => {
    const re = new RegExp(`-\\s*\\*\\*${key}\\*\\*[:：]([^\\n]+)`, "i");
    const m = chunk.match(re);
    return m ? m[1].trim().replace(/^`+|`+$/g, "").trim() : null;
  };

  const summary =
    chunk.match(/-\s*\*\*摘要\*\*[:：]([^\n]+)/)?.[1]?.trim() || "";

  // 提取标签（去掉 # 号和反引号）
  const tagsRaw = extract("标签") || "";
  const tags = tagsRaw
    .replace(/`/g, "")
    .split(/\s+/)
    .filter((t) => t.startsWith("#"))
    .map((t) => t.replace(/^#/, "").trim())
    .filter((t) => t.length > 0)
    .slice(0, 15);

  // 提取核心事实（前 5 条）
  const factsSection =
    chunk.match(/\*\*核心事实\*\*[:：]([\s\S]*?)(?=\n-\s*\*\*[^*]+\*\*[:：]|\n### |\n## )/)?.[1] || "";
  const factsArr = (factsSection.match(/^\s*-\s+(.+)$/gm) || [])
    .slice(0, 5)
    .map((s) => s.replace(/^\s*-\s+/, "").trim());
  const facts = factsArr.join("；");

  // 提取文风特点 - 最简单可靠的方法：定位 **文风特点** 后取到 chunk 末尾
  const styleIdx = chunk.indexOf("**文风特点**");
  let styleRaw = "";
  if (styleIdx !== -1) {
    // 跳过 **文风特点** + 可能的括号注释 + 冒号
    let start = styleIdx + "**文风特点**".length;
    // 跳过空白
    while (start < chunk.length && /\s/.test(chunk[start])) start++;
    // 跳过可能的括号注释（与前 X 篇差异显著）
    if (chunk[start] === "\uff08" || chunk[start] === "(") {
      // 找匹配的右括号
      let depth = 0;
      let i = start;
      while (i < chunk.length) {
        if (chunk[i] === "\uff08" || chunk[i] === "(") depth++;
        else if (chunk[i] === "\uff09" || chunk[i] === ")") {
          depth--;
          if (depth === 0) {
            start = i + 1;
            break;
          }
        }
        i++;
      }
    }
    // 跳过冒号
    while (start < chunk.length && /[\s\uff1a:]/.test(chunk[start])) start++;
    // 跳过后续空白
    while (start < chunk.length && /\s/.test(chunk[start])) start++;
    // 取到 chunk 末尾
    styleRaw = chunk.slice(start).trim();
  }
  if (title.includes("对话朱西产")) {
    console.log(`[debug 对话朱西产] styleIdx=${styleIdx} styleRaw.length=${styleRaw.length} 前 100=${JSON.stringify(styleRaw.slice(0, 100))}`);
  }
  const style = styleRaw
    .replace(/^\s*-\s+/, "") // 去掉开头的 "- "
    .replace(/\n+/g, " ")  // 多个换行变空格
    .replace(/\s+/g, " ")  // 多空格变单空格
    .trim()
    .slice(0, 250);
  if (styleRaw && !style) {
    console.error(`[debug] style 解析为空: ${title}`);
    console.error(`  styleRaw (前 100): ${JSON.stringify(styleRaw.slice(0, 100))}`);
  }

  const category = extract("分类") || "";
  const series = extract("所属系列") || extract("所属事件") || "";
  const path_ = extract("路径") || "";

  articles.push({
    id: `${date}-${title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "-").slice(0, 30)}`,
    date,
    title,
    path: path_,
    summary,
    tags,
    facts,
    style,
    category,
    series,
  });
}

const outFile = path.join(__dirname, "..", "data", "articles-meta.json");
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(articles, null, 2), "utf8");

console.log(`✅ 解析完成：${articles.length} 篇文章`);
console.log(`   输出：${outFile}`);

// 输出预览
console.log("\n前 3 篇：");
articles.slice(0, 3).forEach((a) => {
  console.log(`- ${a.date} 《${a.title}》`);
  console.log(`  标签：${a.tags.slice(0, 5).join(", ")}`);
});