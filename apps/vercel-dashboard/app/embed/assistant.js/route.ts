import { NextResponse } from "next/server";

export const dynamic = "force-static";

const script = String.raw`
(() => {
  const scriptEl = document.currentScript;
  const baseUrl = scriptEl ? new URL(scriptEl.src).origin : "";
  const mount = document.getElementById("tenant-qa-assistant");

  if (!mount || mount.dataset.tenantQaMounted === "true") {
    return;
  }

  mount.dataset.tenantQaMounted = "true";
  mount.innerHTML = "";

  const style = document.createElement("style");
  style.textContent = [
    ".tenant-qa-shell{width:100%;max-width:560px;border:1px solid #d9deea;border-radius:8px;background:#fff;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;box-shadow:0 18px 50px rgba(23,32,51,.12);overflow:hidden}",
    ".tenant-qa-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid #d9deea;background:#f6f8fb}",
    ".tenant-qa-title{margin:0;font-size:15px;font-weight:700}",
    ".tenant-qa-status{font-size:12px;color:#64748b}",
    ".tenant-qa-messages{height:260px;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px}",
    ".tenant-qa-message{max-width:88%;border-radius:8px;padding:10px 12px;font-size:14px;line-height:1.45}",
    ".tenant-qa-message.user{align-self:flex-end;background:#256f8f;color:#fff}",
    ".tenant-qa-message.bot{align-self:flex-start;background:#eef2f7;color:#172033}",
    ".tenant-qa-form{display:grid;grid-template-columns:1fr auto;gap:8px;padding:12px;border-top:1px solid #d9deea}",
    ".tenant-qa-input{min-width:0;border:1px solid #d9deea;border-radius:6px;padding:10px 11px;font:inherit;font-size:14px;outline:none}",
    ".tenant-qa-input:focus{border-color:#256f8f;box-shadow:0 0 0 3px rgba(37,111,143,.15)}",
    ".tenant-qa-button{border:0;border-radius:6px;background:#256f8f;color:white;padding:0 14px;font:inherit;font-size:14px;font-weight:700;cursor:pointer}",
    ".tenant-qa-button:disabled{opacity:.58;cursor:not-allowed}",
    "@media (max-width:520px){.tenant-qa-shell{max-width:none}.tenant-qa-messages{height:300px}.tenant-qa-form{grid-template-columns:1fr}.tenant-qa-button{height:40px}}"
  ].join("");
  document.head.appendChild(style);

  const shell = document.createElement("section");
  shell.className = "tenant-qa-shell";
  shell.innerHTML = [
    '<div class="tenant-qa-head">',
    '<h2 class="tenant-qa-title">Tenant Q&A Assistant</h2>',
    '<span class="tenant-qa-status">Property answers only</span>',
    '</div>',
    '<div class="tenant-qa-messages" aria-live="polite"></div>',
    '<form class="tenant-qa-form">',
    '<input class="tenant-qa-input" name="message" placeholder="Ask about rent, parking, tours..." autocomplete="off" />',
    '<button class="tenant-qa-button" type="submit">Ask</button>',
    '</form>'
  ].join("");
  mount.appendChild(shell);

  const messages = shell.querySelector(".tenant-qa-messages");
  const form = shell.querySelector(".tenant-qa-form");
  const input = shell.querySelector(".tenant-qa-input");
  const button = shell.querySelector(".tenant-qa-button");

  function addMessage(text, type) {
    const bubble = document.createElement("div");
    bubble.className = "tenant-qa-message " + type;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  addMessage("Hi, ask me a rental question and I will answer from the approved property Q&A.", "bot");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = input.value.trim();

    if (!message) {
      return;
    }

    input.value = "";
    input.focus();
    addMessage(message, "user");
    button.disabled = true;
    button.textContent = "Asking";

    try {
      const response = await fetch(baseUrl + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const payload = await response.json();
      addMessage(payload.answer || "Please contact property management for the most accurate current information.", "bot");
    } catch {
      addMessage("I could not reach the assistant. Please contact property management directly.", "bot");
    } finally {
      button.disabled = false;
      button.textContent = "Ask";
    }
  });
})();
`;

export function GET() {
  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    }
  });
}
