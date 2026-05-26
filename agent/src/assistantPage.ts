export function getAssistantPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Tenant Q&A Assistant</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f8fa;
      --panel: #ffffff;
      --text: #172033;
      --muted: #647085;
      --line: #d9dee8;
      --accent: #1f6feb;
      --accent-dark: #174ea6;
      --warning: #8a5a00;
      --warning-bg: #fff5d6;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .assistant {
      display: grid;
      grid-template-rows: auto 1fr auto;
      min-height: 100vh;
      background: var(--panel);
    }

    header {
      border-bottom: 1px solid var(--line);
      padding: 16px;
    }

    h1 {
      margin: 0;
      font-size: 18px;
      line-height: 1.2;
      font-weight: 700;
    }

    .subtitle {
      margin-top: 4px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.4;
    }

    .messages {
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
      padding: 16px;
      background: var(--bg);
    }

    .message {
      max-width: 86%;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 14px;
      line-height: 1.45;
      white-space: pre-wrap;
    }

    .message.user {
      align-self: flex-end;
      background: var(--accent);
      border-color: var(--accent);
      color: #ffffff;
    }

    .message.assistant {
      align-self: flex-start;
      background: #ffffff;
    }

    .message.warning {
      background: var(--warning-bg);
      border-color: #efd27a;
      color: var(--warning);
    }

    .quick {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 0 16px 12px;
      background: var(--bg);
    }

    .quick button {
      border: 1px solid var(--line);
      border-radius: 999px;
      background: #ffffff;
      color: var(--text);
      cursor: pointer;
      font: inherit;
      font-size: 13px;
      padding: 7px 10px;
    }

    form {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      border-top: 1px solid var(--line);
      padding: 12px;
      background: #ffffff;
    }

    textarea {
      min-height: 44px;
      max-height: 120px;
      resize: vertical;
      border: 1px solid var(--line);
      border-radius: 8px;
      color: var(--text);
      font: inherit;
      line-height: 1.4;
      padding: 10px 12px;
    }

    button[type="submit"] {
      width: 84px;
      border: 0;
      border-radius: 8px;
      background: var(--accent);
      color: #ffffff;
      cursor: pointer;
      font: inherit;
      font-weight: 700;
    }

    button[type="submit"]:hover {
      background: var(--accent-dark);
    }

    button:disabled,
    textarea:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }
  </style>
</head>
<body>
  <main class="assistant">
    <header>
      <h1>Catalina West 36 Place</h1>
      <div class="subtitle">Tenant Q&A Assistant</div>
    </header>

    <section id="messages" class="messages" aria-live="polite">
      <div class="message assistant">Hi. Ask a rental question and I will answer from the approved property Q&A.</div>
    </section>

    <section class="quick" aria-label="Common questions">
      <button type="button" data-question="Are pets allowed?">Pets</button>
      <button type="button" data-question="Is parking available?">Parking</button>
      <button type="button" data-question="Which utilities are included?">Utilities</button>
      <button type="button" data-question="How do I report maintenance?">Maintenance</button>
    </section>

    <form id="chat-form">
      <textarea id="message" name="message" placeholder="Ask a question" autocomplete="off" required></textarea>
      <button id="send" type="submit">Send</button>
    </form>
  </main>

  <script>
    const form = document.getElementById("chat-form");
    const input = document.getElementById("message");
    const send = document.getElementById("send");
    const messages = document.getElementById("messages");
    const quickButtons = document.querySelectorAll("[data-question]");

    function addMessage(text, role, warning) {
      const item = document.createElement("div");
      item.className = "message " + role + (warning ? " warning" : "");
      item.textContent = text;
      messages.appendChild(item);
      messages.scrollTop = messages.scrollHeight;
    }

    async function ask(question) {
      const text = question.trim();
      if (!text) {
        return;
      }

      addMessage(text, "user", false);
      input.value = "";
      input.disabled = true;
      send.disabled = true;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text })
        });

        const data = await response.json();
        addMessage(data.answer || "Please contact property management.", "assistant", Boolean(data.escalationRecommended));
      } catch (_error) {
        addMessage("The assistant is unavailable right now. Please contact property management.", "assistant", true);
      } finally {
        input.disabled = false;
        send.disabled = false;
        input.focus();
      }
    }

    form.addEventListener("submit", function(event) {
      event.preventDefault();
      ask(input.value);
    });

    quickButtons.forEach(function(button) {
      button.addEventListener("click", function() {
        ask(button.dataset.question || "");
      });
    });
  </script>
</body>
</html>`;
}

