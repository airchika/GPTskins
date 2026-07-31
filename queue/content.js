(function () {
  "use strict";

  const queueApi = globalThis.GPTskinsQueue;
  if (!queueApi) {
    return;
  }

  const rootId = "gptskins-queue-root";
  const idleDelay = 1200;
  let enabled = false;
  let currentConversationKey = null;
  let currentStateStorageKey = null;
  let state = { paused: false, items: [] };
  let root = null;
  let pageObserver = null;
  let routeTimer = 0;
  let runnerTimer = 0;
  let recoveryTimer = 0;
  let runnerActive = false;
  let lastRoute = location.href;

  function storageGet(area, keys) {
    return new Promise((resolve) => {
      chrome.storage[area].get(keys, (result) => resolve(result || {}));
    });
  }

  function storageSet(area, values) {
    return new Promise((resolve) => {
      chrome.storage[area].set(values, () => resolve(!chrome.runtime.lastError));
    });
  }

  function isVisible(element) {
    if (!element || element.hidden) {
      return false;
    }
    const styles = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return styles.display !== "none" && styles.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }

  function getComposer() {
    const editor = document.querySelector(
      '#prompt-textarea, [data-testid="composer"] [contenteditable="true"], form[data-type="unified-composer"] [contenteditable="true"]'
    );
    const form = editor && editor.closest("form");
    return editor && form ? { editor, form } : null;
  }

  function findStopButton() {
    const selectors = [
      '[data-testid="stop-button"]',
      '[data-testid="stop-streaming-button"]',
      'button[aria-label="Stop streaming"]',
      'button[aria-label="Stop generating"]',
      'button[aria-label="停止流式传输"]',
      'button[aria-label="停止生成"]'
    ];
    return Array.from(document.querySelectorAll(selectors.join(","))).find(isVisible) || null;
  }

  function findSendButton(form) {
    const selectors = [
      '[data-testid="send-button"]',
      '[data-testid="composer-submit-button"]',
      'button[aria-label="Send prompt"]',
      'button[aria-label="Send message"]',
      'button[aria-label="发送提示"]',
      'button[aria-label="发送消息"]'
    ];
    const directMatch = Array.from(form.querySelectorAll(selectors.join(","))).find(isVisible);
    if (directMatch) {
      return directMatch;
    }

    return (
      Array.from(form.querySelectorAll("button")).find((button) => {
        if (!isVisible(button)) {
          return false;
        }
        const label = (button.getAttribute("aria-label") || "").toLowerCase();
        const testId = (button.dataset.testid || "").toLowerCase();
        const looksLikeSend = label.includes("send") || label.includes("发送") || testId.includes("send");
        const looksLikeVoice = label.includes("voice") || label.includes("speech") || label.includes("语音");
        return looksLikeSend && !looksLikeVoice;
      }) || null
    );
  }

  function pageNeedsUserAttention() {
    return Boolean(
      document.querySelector(
        'iframe[src*="captcha" i], iframe[src*="challenge" i], [data-testid*="captcha" i], [id*="captcha" i]'
      )
    );
  }

  function setStatus(message, tone = "muted") {
    if (!root) {
      return;
    }
    const status = root.querySelector("[data-gptskins-queue-status]");
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function updateToggleLabel() {
    if (!root) {
      return;
    }
    const count = state.items.length;
    const label = root.querySelector("[data-gptskins-queue-toggle-label]");
    label.textContent = count ? `Queue ${count}` : "Queue";
  }

  function renderItems() {
    if (!root) {
      return;
    }

    const list = root.querySelector("[data-gptskins-queue-list]");
    list.replaceChildren();
    if (!state.items.length) {
      const empty = document.createElement("p");
      empty.className = "gptskins-queue-empty";
      empty.textContent = "No queued messages.";
      list.appendChild(empty);
    } else {
      state.items.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "gptskins-queue-item";
        row.dataset.status = item.status;

        const number = document.createElement("span");
        number.className = "gptskins-queue-number";
        number.textContent = String(index + 1);

        const copy = document.createElement("div");
        copy.className = "gptskins-queue-copy";
        const text = document.createElement("span");
        text.className = "gptskins-queue-text";
        text.textContent = item.text;
        copy.appendChild(text);
        if (item.status !== "pending") {
          const itemStatus = document.createElement("span");
          itemStatus.className = "gptskins-queue-item-status";
          itemStatus.textContent = item.status === "review" ? "Needs review" : "Submitting";
          copy.appendChild(itemStatus);
        }

        const actions = document.createElement("div");
        actions.className = "gptskins-queue-item-actions";
        if (item.status === "review") {
          const retry = document.createElement("button");
          retry.type = "button";
          retry.dataset.queueAction = "retry";
          retry.dataset.queueItemId = item.id;
          retry.textContent = "Retry";
          actions.appendChild(retry);
        }
        const remove = document.createElement("button");
        remove.type = "button";
        remove.dataset.queueAction = "remove";
        remove.dataset.queueItemId = item.id;
        remove.setAttribute("aria-label", "Remove queued message");
        remove.textContent = "×";
        actions.appendChild(remove);

        row.append(number, copy, actions);
        list.appendChild(row);
      });
    }

    const pauseButton = root.querySelector("[data-gptskins-queue-pause]");
    pauseButton.textContent = state.paused ? "Resume" : "Pause";
    pauseButton.setAttribute("aria-pressed", String(state.paused));
    root.querySelector("[data-gptskins-queue-clear]").disabled = state.items.length === 0;
    updateToggleLabel();
  }

  async function saveState() {
    if (!currentStateStorageKey) {
      return false;
    }
    return storageSet("local", { [currentStateStorageKey]: queueApi.normalizeState(state) });
  }

  async function loadConversationState({ recover = false } = {}) {
    if (!currentStateStorageKey) {
      state = { paused: false, items: [] };
      renderItems();
      return;
    }

    const result = await storageGet("local", currentStateStorageKey);
    const storedState = queueApi.normalizeState(result[currentStateStorageKey]);
    state = recover ? queueApi.recoverState(storedState) : storedState;
    const recoveredSubmission =
      recover &&
      storedState.items.some(
        (item) => item.status === "submitting" && state.items.find((candidate) => candidate.id === item.id)?.status === "review"
      );
    renderItems();
    if (recoveredSubmission) {
      await saveState();
      setStatus("A previous submission needs review before retrying.", "warning");
    } else if (recover && state.items.some((item) => item.status === "review")) {
      setStatus("A queued message needs review before retrying.", "warning");
    }
  }

  function scheduleRunner(delay = idleDelay) {
    clearTimeout(runnerTimer);
    if (!enabled || !currentConversationKey || state.paused || !state.items.length) {
      return;
    }
    runnerTimer = window.setTimeout(runQueue, delay);
  }

  function createItem(text) {
    return {
      id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      text,
      status: "pending",
      createdAt: Date.now(),
      statusAt: 0
    };
  }

  async function addPrompt() {
    if (!root || !currentConversationKey) {
      setStatus("Send the first message before using the queue.", "warning");
      return;
    }

    const input = root.querySelector("[data-gptskins-queue-input]");
    const text = queueApi.normalizePrompt(input.value);
    if (!text) {
      setStatus("Enter a message first.", "warning");
      return;
    }
    if (state.items.length >= queueApi.maxItems) {
      setStatus(`The queue is limited to ${queueApi.maxItems} messages.`, "warning");
      return;
    }

    state.items.push(createItem(text));
    input.value = "";
    await saveState();
    renderItems();
    setStatus(state.paused ? "Message added. Resume when ready." : "Message added to the queue.");
    scheduleRunner();
  }

  function waitFor(check, timeout = 5000, interval = 80) {
    return new Promise((resolve) => {
      const startedAt = Date.now();
      const probe = () => {
        const value = check();
        if (value) {
          resolve(value);
          return;
        }
        if (Date.now() - startedAt >= timeout) {
          resolve(null);
          return;
        }
        window.setTimeout(probe, interval);
      };
      probe();
    });
  }

  function replaceComposerText(editor, text) {
    if (editor.textContent.trim()) {
      return false;
    }

    editor.focus();
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    editor.replaceChildren(paragraph);
    editor.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        composed: true,
        inputType: "insertText",
        data: text
      })
    );
    return true;
  }

  async function markForReview(itemId, message) {
    const item = state.items.find((candidate) => candidate.id === itemId);
    if (item) {
      item.status = "review";
      item.statusAt = Date.now();
    }
    state.paused = true;
    await saveState();
    renderItems();
    setStatus(message, "warning");
  }

  async function submitNextMessage(item) {
    const composer = getComposer();
    if (!composer) {
      setStatus("Waiting for the ChatGPT composer.");
      return false;
    }
    if (composer.editor.textContent.trim()) {
      setStatus("Waiting for the current draft to be sent or cleared.");
      return false;
    }

    item.status = "submitting";
    item.statusAt = Date.now();
    await saveState();
    renderItems();

    if (!replaceComposerText(composer.editor, item.text)) {
      await markForReview(item.id, "The composer changed before submission. Review the queued message.");
      return false;
    }

    const sendButton = await waitFor(() => {
      const button = findSendButton(composer.form);
      return button && !button.disabled ? button : null;
    }, 2500);
    const itemIsStillQueued = state.items.some((candidate) => candidate.id === item.id);
    if (!itemIsStillQueued) {
      setStatus("Submission canceled. The unsent text remains in the ChatGPT composer.", "warning");
      return false;
    }
    if (
      !sendButton ||
      !sendButton.isConnected ||
      sendButton.disabled ||
      !enabled ||
      state.paused ||
      findStopButton() ||
      currentConversationKey !== queueApi.getConversationKey(location.href)
    ) {
      await markForReview(item.id, "ChatGPT was not ready to send. Review the message in the composer.");
      return false;
    }

    const previousUserMessageCount = document.querySelectorAll('[data-message-author-role="user"]').length;
    sendButton.click();
    const accepted = await waitFor(
      () =>
        findStopButton() ||
        document.querySelectorAll('[data-message-author-role="user"]').length > previousUserMessageCount,
      5000
    );
    if (!accepted) {
      await markForReview(item.id, "ChatGPT did not confirm the submission. Retry only after checking the page.");
      return false;
    }

    state.items = state.items.filter((candidate) => candidate.id !== item.id);
    await saveState();
    renderItems();
    setStatus(state.items.length ? "Sent. Waiting for ChatGPT before the next message." : "Queue complete.", "success");
    return true;
  }

  async function runQueue() {
    if (runnerActive || !enabled || !currentConversationKey || state.paused || !state.items.length) {
      return;
    }
    if (pageNeedsUserAttention()) {
      state.paused = true;
      await saveState();
      renderItems();
      setStatus("Queue paused because the page needs your attention.", "warning");
      return;
    }
    if (findStopButton()) {
      setStatus("Waiting for ChatGPT to finish.");
      return;
    }

    runnerActive = true;
    const lockName = `gptskins-queue-${currentConversationKey}`;
    const execute = async () => {
      await loadConversationState();
      if (state.paused || !state.items.length || state.items[0].status !== "pending" || findStopButton()) {
        return;
      }
      await submitNextMessage(state.items[0]);
    };

    try {
      if (navigator.locks && typeof navigator.locks.request === "function") {
        await navigator.locks.request(lockName, { ifAvailable: true }, async (lock) => {
          if (lock) {
            await execute();
          }
        });
      } else {
        await execute();
      }
    } finally {
      runnerActive = false;
      scheduleRunner();
    }
  }

  async function changeItem(action, itemId) {
    const item = state.items.find((candidate) => candidate.id === itemId);
    if (!item) {
      return;
    }
    if (action === "remove") {
      state.items = state.items.filter((candidate) => candidate.id !== itemId);
    } else if (action === "retry") {
      item.status = "pending";
      item.statusAt = 0;
      state.paused = false;
    }
    await saveState();
    renderItems();
    scheduleRunner();
  }

  function buildUi() {
    const container = document.createElement("section");
    container.id = rootId;
    container.setAttribute("data-gptskins-queue-root", "true");
    container.innerHTML = `
      <button type="button" class="gptskins-queue-toggle" data-gptskins-queue-toggle aria-expanded="false">
        <span data-gptskins-queue-toggle-label>Queue</span>
      </button>
      <div class="gptskins-queue-panel" data-gptskins-queue-panel hidden>
        <header class="gptskins-queue-header">
          <div>
            <strong>Message queue</strong>
            <span>Runs one message after each response.</span>
          </div>
          <button type="button" data-gptskins-queue-close aria-label="Close message queue">×</button>
        </header>
        <div class="gptskins-queue-list" data-gptskins-queue-list></div>
        <label class="gptskins-queue-input-label">
          <span>Next message</span>
          <textarea data-gptskins-queue-input rows="3" maxlength="${queueApi.maxPromptLength}" placeholder="Write a follow-up to send later"></textarea>
        </label>
        <button type="button" class="gptskins-queue-add" data-gptskins-queue-add>Add to queue</button>
        <div class="gptskins-queue-controls">
          <button type="button" data-gptskins-queue-pause aria-pressed="false">Pause</button>
          <button type="button" data-gptskins-queue-clear>Clear</button>
        </div>
        <p class="gptskins-queue-status" data-gptskins-queue-status data-tone="muted" role="status" aria-live="polite"></p>
      </div>
    `;

    const toggle = container.querySelector("[data-gptskins-queue-toggle]");
    const panel = container.querySelector("[data-gptskins-queue-panel]");
    const close = container.querySelector("[data-gptskins-queue-close]");
    toggle.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      toggle.setAttribute("aria-expanded", String(!panel.hidden));
    });
    close.addEventListener("click", () => {
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    });
    container.querySelector("[data-gptskins-queue-add]").addEventListener("click", addPrompt);
    container.querySelector("[data-gptskins-queue-input]").addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        addPrompt();
      }
    });
    container.querySelector("[data-gptskins-queue-pause]").addEventListener("click", async () => {
      state.paused = !state.paused;
      await saveState();
      renderItems();
      setStatus(state.paused ? "Queue paused." : "Queue resumed.");
      scheduleRunner();
    });
    container.querySelector("[data-gptskins-queue-clear]").addEventListener("click", async () => {
      state.items = [];
      await saveState();
      renderItems();
      setStatus("Queue cleared.");
    });
    container.querySelector("[data-gptskins-queue-list]").addEventListener("click", (event) => {
      const button = event.target.closest("button[data-queue-action]");
      if (button) {
        changeItem(button.dataset.queueAction, button.dataset.queueItemId);
      }
    });

    return container;
  }

  async function syncConversation({ recover = false } = {}) {
    const nextConversationKey = queueApi.getConversationKey(location.href);
    if (nextConversationKey === currentConversationKey && !recover) {
      return;
    }

    currentConversationKey = nextConversationKey;
    currentStateStorageKey = queueApi.getStateStorageKey(currentConversationKey);
    await loadConversationState({ recover });
    clearTimeout(recoveryTimer);
    const submittingItem = state.items.find((item) => item.status === "submitting");
    if (submittingItem) {
      const wait = Math.max(0, queueApi.submissionReviewDelay - (Date.now() - submittingItem.statusAt) + 50);
      recoveryTimer = window.setTimeout(() => syncConversation({ recover: true }), wait);
    }
    if (!currentConversationKey) {
      setStatus("Send the first message before using the queue.");
    } else if (!state.items.length) {
      setStatus("Queue is ready for this conversation.");
    }
    scheduleRunner();
  }

  async function mount() {
    if (root || !document.body) {
      return;
    }
    root = buildUi();
    document.body.appendChild(root);
    renderItems();
    await syncConversation({ recover: true });

    pageObserver = new MutationObserver(() => scheduleRunner());
    pageObserver.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-label", "data-testid", "disabled"]
    });
    routeTimer = window.setInterval(() => {
      if (location.href !== lastRoute) {
        lastRoute = location.href;
        syncConversation({ recover: true });
      }
    }, 1000);
    scheduleRunner();
  }

  function unmount() {
    clearTimeout(runnerTimer);
    clearTimeout(recoveryTimer);
    clearInterval(routeTimer);
    if (pageObserver) {
      pageObserver.disconnect();
      pageObserver = null;
    }
    if (root) {
      root.remove();
      root = null;
    }
    runnerActive = false;
  }

  async function setEnabled(value) {
    enabled = Boolean(value);
    if (enabled) {
      if (document.body) {
        await mount();
      } else {
        window.addEventListener("DOMContentLoaded", mount, { once: true });
      }
    } else {
      unmount();
    }
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync" && changes[queueApi.enabledStorageKey]) {
      setEnabled(changes[queueApi.enabledStorageKey].newValue);
    }
    if (areaName === "local" && currentStateStorageKey && changes[currentStateStorageKey] && !runnerActive) {
      syncConversation({ recover: true });
    }
  });

  storageGet("sync", queueApi.enabledStorageKey).then((result) => {
    setEnabled(result[queueApi.enabledStorageKey] === true);
  });
})();
