// === 梁巍的写法 - 前端逻辑 ===

const STORAGE_KEY = "liangwei-sessions";

let sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let currentSessionId = null;

function saveSessions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function createSession() {
  const s = {
    id: uid(),
    title: "新对话",
    messages: [],
    createdAt: Date.now(),
  };
  sessions.unshift(s);
  currentSessionId = s.id;
  saveSessions();
  renderHistory();
  renderMessages();
}

function deleteSession(id) {
  if (!confirm("删除这个对话？")) return;
  sessions = sessions.filter((s) => s.id !== id);
  if (currentSessionId === id) currentSessionId = null;
  saveSessions();
  renderHistory();
  if (currentSessionId) {
    renderMessages();
  } else {
    showEmpty();
  }
}

function getCurrentSession() {
  return sessions.find((s) => s.id === currentSessionId);
}

function showEmpty() {
  const messages = document.getElementById("messages");
  messages.innerHTML = `
    <div class="empty-state">
      <h2>开始一次写作</h2>
      <p>输入一个主题，AI 帮你写出梁巍风格的中国产业报道。</p>
      <div class="examples">
        <p class="examples-title">试试这样问：</p>
        <button class="example-btn">写一篇奇瑞出海稿</button>
        <button class="example-btn">写一篇讯飞抢滩香港稿</button>
        <button class="example-btn">写一篇徽商 90 后群像综述</button>
        <button class="example-btn">帮我润色这段文字</button>
      </div>
    </div>
  `;
  bindExamples();
}

function bindExamples() {
  document.querySelectorAll(".example-btn").forEach((btn) => {
    btn.onclick = () => {
      document.getElementById("input").value = btn.textContent;
      document.getElementById("input").focus();
    };
  });
}

function renderHistory() {
  const list = document.getElementById("history-list");
  list.innerHTML = sessions
    .map(
      (s) => `
    <div class="history-item ${s.id === currentSessionId ? "active" : ""}" data-id="${s.id}">
      <span class="title">${escapeHtml(s.title)}</span>
      <span class="del" data-del="${s.id}">×</span>
    </div>
  `
    )
    .join("");

  document.querySelectorAll(".history-item").forEach((item) => {
    item.onclick = (e) => {
      if (e.target.dataset.del) return;
      currentSessionId = item.dataset.id;
      renderHistory();
      renderMessages();
    };
  });
  document.querySelectorAll(".del").forEach((del) => {
    del.onclick = (e) => {
      e.stopPropagation();
      deleteSession(del.dataset.del);
    };
  });
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMessages() {
  const session = getCurrentSession();
  const messages = document.getElementById("messages");
  if (!session || session.messages.length === 0) {
    showEmpty();
    return;
  }

  messages.innerHTML = session.messages
    .map(
      (m) => `
    <div class="msg ${m.role}">
      <div class="msg-avatar">${m.role === "user" ? "你" : "梁"}</div>
      <div>
        <div class="msg-body">${escapeHtml(m.content)}</div>
        ${
          m.meta
            ? `<div class="msg-meta">
            <span>${m.meta.model || ""}</span>
            <span>${m.meta.tokens || 0} tokens</span>
            <span>${(m.meta.duration / 1000).toFixed(1)}s</span>
          </div>`
            : ""
        }
      </div>
    </div>
  `
    )
    .join("");

  // 更新 title
  if (session.messages.length > 0 && session.title === "新对话") {
    session.title = session.messages[0].content.slice(0, 24);
    saveSessions();
    renderHistory();
  }

  // 滚动到底部
  messages.scrollTop = messages.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById("input");
  const text = input.value.trim();
  if (!text) return;

  if (!currentSessionId) createSession();
  const session = getCurrentSession();

  session.messages.push({ role: "user", content: text });
  saveSessions();
  renderMessages();
  input.value = "";

  const btn = document.getElementById("send");
  btn.disabled = true;
  btn.textContent = "生成中...";

  // 添加加载占位
  const messages = document.getElementById("messages");
  const loadingId = "loading-" + Date.now();
  messages.insertAdjacentHTML(
    "beforeend",
    `
    <div class="msg assistant" id="${loadingId}">
      <div class="msg-avatar">梁</div>
      <div>
        <div class="msg-body">
          <span class="loading"></span>
          <span class="loading"></span>
          <span class="loading"></span>
        </div>
      </div>
    </div>
  `
  );
  messages.scrollTop = messages.scrollHeight;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: session.messages }),
    });

    const data = await res.json();
    document.getElementById(loadingId)?.remove();

    if (!res.ok) {
      session.messages.push({
        role: "assistant",
        content: data.error || "出错了，请重试。",
      });
    } else {
      session.messages.push({
        role: "assistant",
        content: data.content,
        meta: data.meta,
      });
    }
    saveSessions();
    renderMessages();
  } catch (e) {
    document.getElementById(loadingId)?.remove();
    session.messages.push({
      role: "assistant",
      content: "网络错误：" + e.message,
    });
    saveSessions();
    renderMessages();
  } finally {
    btn.disabled = false;
    btn.textContent = "发送";
  }
}

// === 初始化 ===
document.getElementById("new-chat").onclick = () => createSession();
document.getElementById("send").onclick = sendMessage;
document.getElementById("input").onkeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
};

bindExamples();
renderHistory();