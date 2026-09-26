# 梁巍的写法

> 100 篇真实元新闻记者梁巍稿件 · 1682 行文风手册 · AI 写作助手

把"梁巍"这位安徽商报元新闻记者的写作风格，沉淀成一个 AI 写作助手。
朋友小圈子（6-7 人）内测用。

## 包含什么

```
liangwei-write/
├── api/
│   └── chat.js              # Vercel Serverless Function
├── lib/
│   ├── minimax.js           # MiniMax API 调用封装
│   ├── prompt.js            # Prompt 拼装（梁巍风格系统提示词）
│   └── knowledge.js         # 知识库加载与匹配
├── public/
│   ├── index.html           # 聊天界面
│   ├── style.css            # 样式
│   └── app.js               # 前端逻辑（含 localStorage 历史）
├── data/
│   └── articles-meta.json   # 100 篇范文元数据
├── scripts/
│   └── build-knowledge.js   # 知识库 JSON 生成脚本
├── package.json
├── vercel.json
└── README.md
```

## 部署步骤

### 1. 注册 Vercel（如果还没有）

打开 https://vercel.com 注册账号（GitHub / Google 账号都可登录）。

### 2. 把代码推到 GitHub

```bash
# 在项目目录下
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/你的用户名/liangwei-write.git
git push -u origin main
```

### 3. 在 Vercel 导入项目

1. 打开 https://vercel.com/new
2. 选择 "Import Git Repository"
3. 选你的 `liangwei-write` 仓库
4. 点 "Import"

### 4. 配置环境变量

在 Vercel 项目页面：
1. 左侧 "Settings" → 顶部 "Environment Variables"
2. 添加：

| Name | Value |
|---|---|
| `MINIMAX_API_KEY` | `sk-cp-你的完整key` |

3. 选 "Production" / "Preview" / "Development" 全勾
4. 保存

### 5. 部署

1. 回到 "Deployments" 页
2. 点击 "Deploy"（或等 Git push 自动触发）
3. 完成后 Vercel 会给一个网址，类似 `liangwei-write.vercel.app`

### 6. 修改项目名为 `howliangwei`

1. Vercel 项目页 → "Settings" → "General"
2. 修改 "Project Name" 为 `howliangwei`
3. 网址变为 `howliangwei.vercel.app`

## 本地开发

```bash
# 安装 Vercel CLI
npm install -g vercel

# 在项目目录下
vercel dev

# 浏览器打开 http://localhost:3000
```

## 使用方式

1. 打开 `https://howliangwei.vercel.app`
2. 输入一个主题，比如：
   - "写一篇奇瑞出海稿"
   - "写一篇讯飞抢滩香港稿"
   - "写一篇徽商 90 后群像综述"
3. AI 会按梁巍风格生成一篇稿件

## 更新知识库

如果你的 `samples/` 知识库有更新：

```bash
node scripts/build-knowledge.js
git add .
git commit -m "更新知识库"
git push
```

Vercel 会自动重新部署。

## 安全注意事项

- ⚠️ **不要把 `MINIMAX_API_KEY` 提交到 Git 仓库**
- 已经设置 `.gitignore` 排除 `.env`
- 部署时一定要通过 Vercel 的 Environment Variables 配置 key
- 朋友圈转发网址时，不要转发 key

## 成本估算

| 项目 | 费用 |
|---|---|
| Vercel 免费版 | 0 元 |
| 自定义域名（可选） | ~60 元/年 |
| MiniMax Token Plan（Plus 档） | ~1190 元/年（含 6 亿 token/月） |
| 朋友小圈子月度消耗 | ~5-20 元/月 |

## 调试

如果遇到问题：

1. **Vercel 部署失败**：查看 "Deployments" 页的 build 日志
2. **API 调用失败**：查看 Vercel "Functions" 页的 runtime 日志
3. **找不到 key**：检查 Vercel Environment Variables 配置

## 已知限制

- 单次回答 6000 token（约 4500 字），长稿件需要分段生成
- 1M 长上下文窗口支持，但发送的范文摘要会占用 token
- 暂不支持图片上传
- 暂不支持导出 Word / PDF（可手动复制 Markdown）

## 联系

有问题找梁巍本人 :)