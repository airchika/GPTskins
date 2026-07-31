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
  let statusTimer = 0;
  let runnerActive = false;
  let panelExpanded = false;
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

  function ensureUiAttached() {
    if (!root) {
      return null;
    }
    const composer = getComposer();
    const host = composer && composer.form.parentElement;
    if (host && root.parentElement !== host) {
      host.insertBefore(root, composer.form);
    }
    return composer;
  }

  function updateRootVisibility() {
    if (!root) {
      return;
    }
    const status = root.querySelector("[data-gptskins-queue-status]");
    const shouldHide = state.items.length === 0 && !status.textContent;
    if (shouldHide) {
      panelExpanded = false;
    }
    root.hidden = shouldHide;
    updatePanelState();
  }

  function updatePanelState() {
    if (!root) {
      return;
    }
    const toggle = root.querySelector("[data-gptskins-queue-toggle]");
    const badge = root.querySelector("[data-gptskins-queue-count]");
    const panel = root.querySelector("[data-gptskins-queue-panel]");
    const count = state.items.length;
    const needsAttention = state.paused || state.items.some((item) => item.status === "review");
    badge.textContent = String(count);
    badge.hidden = count === 0;
    toggle.dataset.attention = String(needsAttention);
    toggle.setAttribute("aria-expanded", String(panelExpanded));
    toggle.setAttribute(
      "aria-label",
      panelExpanded ? "Collapse queued messages" : `Show ${count} queued message${count === 1 ? "" : "s"}`
    );
    panel.hidden = !panelExpanded;
  }

  function setStatus(message, tone = "muted", timeout = 5000) {
    if (!root) {
      return;
    }
    ensureUiAttached();
    const status = root.querySelector("[data-gptskins-queue-status]");
    clearTimeout(statusTimer);
    status.textContent = message;
    status.dataset.tone = tone;
    if (message) {
      panelExpanded = true;
    }
    updateRootVisibility();
    if (message && timeout > 0) {
      statusTimer = window.setTimeout(() => {
        if (status.textContent === message) {
          status.textContent = "";
          updateRootVisibility();
        }
      }, timeout);
    }
  }

  function renderItems() {
    if (!root) {
      return;
    }
    ensureUiAttached();
    const list = root.querySelector("[data-gptskins-queue-list]");
    list.replaceChildren();

    state.items.forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "gptskins-queue-card";
      card.dataset.status = item.status;
      card.setAttribute("role", "listitem");

      const text = document.createElement("div");
      text.className = "gptskins-queue-text";
      text.textContent = item.text;

      const meta = document.createElement("div");
      meta.className = "gptskins-queue-meta";
      const label = document.createElement("span");
      label.className = "gptskins-queue-label";
      if (item.status === "review") {
        label.textContent = "Needs review";
      } else if (item.status === "submitting") {
        label.textContent = "Sending";
      } else {
        label.textContent = state.paused ? "Queued · paused" : `Queued ${index + 1} of ${state.items.length}`;
      }

      const actions = document.createElement("span");
      actions.className = "gptskins-queue-actions";
      if (item.status === "review") {
        actions.appendChild(createActionButton("retry", item.id, "Retry"));
      }
      if (item.status !== "submitting") {
        actions.appendChild(createActionButton("edit", item.id, "Edit"));
        actions.appendChild(createActionButton("remove", item.id, "Remove"));
      }

      meta.append(label, actions);
      card.append(text, meta);
      list.appendChild(card);
    });

    const pausedRow = root.querySelector("[data-gptskins-queue-paused]");
    pausedRow.hidden = !state.paused || state.items.some((item) => item.status === "review");
    updateRootVisibility();
  }

  function createActionButton(action, itemId, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.queueAction = action;
    button.dataset.queueItemId = itemId;
    button.textContent = label;
    return button;
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
      setStatus("A previous submission needs review before retrying.", "warning", 0);
    } else if (recover && state.items.some((item) => item.status === "review")) {
      setStatus("A queued message needs review before retrying.", "warning", 0);
    } else if (recover) {
      setStatus("");
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

  function readComposerText(editor) {
    return (editor.innerText || editor.textContent || "").replace(/\u00a0/g, " ").trim();
  }

  function dispatchComposerInput(editor, inputType, data) {
    editor.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        composed: true,
        inputType,
        data
      })
    );
  }

  function clearComposerText(editor) {
    editor.focus();
    editor.replaceChildren();
    dispatchComposerInput(editor, "deleteContentBackward", null);
    return readComposerText(editor) === "";
  }

  function replaceComposerText(editor, text) {
    if (readComposerText(editor)) {
      return false;
    }

    const fragment = document.createDocumentFragment();
    text.split("\n").forEach((line) => {
      const paragraph = document.createElement("p");
      if (line) {
        paragraph.textContent = line;
      } else {
        paragraph.appendChild(document.createElement("br"));
      }
      fragment.appendChild(paragraph);
    });
    editor.focus();
    editor.replaceChildren(fragment);
    dispatchComposerInput(editor, "insertText", text);
    return true;
  }

  async function queueComposerDraft(editor) {
    if (!currentConversationKey) {
      setStatus("Send the first message before using the queue.", "warning");
      return;
    }

    const rawText = readComposerText(editor);
    if (!rawText) {
      return;
    }
    if (rawText.length > queueApi.maxPromptLength) {
      setStatus(`Queued messages are limited to ${queueApi.maxPromptLength} characters.`, "warning");
      return;
    }
    if (state.items.length >= queueApi.maxItems) {
      setStatus(`The queue is limited to ${queueApi.maxItems} messages.`, "warning");
      return;
    }

    const item = createItem(rawText);
    state.items.push(item);
    if (!(await saveState())) {
      state.items = state.items.filter((candidate) => candidate.id !== item.id);
      setStatus("Couldn't save the queued message. Your draft was kept.", "warning");
      return;
    }
    if (readComposerText(editor) !== rawText || !clearComposerText(editor)) {
      state.items = state.items.filter((candidate) => candidate.id !== item.id);
      await saveState();
      renderItems();
      setStatus("The composer changed, so the message was not queued.", "warning");
      return;
    }

    renderItems();
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

  async function markForReview(itemId, message) {
    const item = state.items.find((candidate) => candidate.id === itemId);
    if (item) {
      item.status = "review";
      item.statusAt = Date.now();
    }
    state.paused = true;
    await saveState();
    renderItems();
    setStatus(message, "warning", 0);
  }

  async function submitNextMessage(item) {
    const composer = getComposer();
    if (!composer) {
      setStatus("Waiting for the ChatGPT composer.");
      return false;
    }
    if (readComposerText(composer.editor)) {
      setStatus("Press Enter to add the current draft behind the queue.");
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
    if (!state.items.length) {
      setStatus("Queue complete.", "success");
    }
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
      setStatus("Queue paused because the page needs your attention.", "warning", 0);
      return;
    }
    if (findStopButton()) {
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
    const index = state.items.findIndex((candidate) => candidate.id === itemId);
    if (index < 0) {
      return;
    }
    const item = state.items[index];

    if (action === "edit") {
      const composer = getComposer();
      if (!composer || readComposerText(composer.editor)) {
        setStatus("Clear the current draft before editing a queued message.", "warning");
        return;
      }
      state.items.splice(index, 1);
      if (!(await saveState()) || !replaceComposerText(composer.editor, item.text)) {
        state.items.splice(index, 0, item);
        await saveState();
        renderItems();
        setStatus("Couldn't move that message back into the composer.", "warning");
        return;
      }
      if (!state.items.some((candidate) => candidate.status === "review")) {
        state.paused = false;
        await saveState();
      }
    } else if (action === "remove") {
      state.items.splice(index, 1);
      if (!state.items.some((candidate) => candidate.status === "review")) {
        state.paused = false;
      }
      await saveState();
    } else if (action === "retry") {
      item.status = "pending";
      item.statusAt = 0;
      state.paused = false;
      await saveState();
    }

    if (!state.items.some((candidate) => candidate.status === "review")) {
      setStatus("");
    }
    renderItems();
    scheduleRunner();
  }

  function onComposerKeydown(event) {
    if (event.key === "Escape" && panelExpanded) {
      panelExpanded = false;
      updatePanelState();
      return;
    }

    const composer = getComposer();
    const targetIsComposer = Boolean(
      composer && (event.target === composer.editor || composer.editor.contains(event.target))
    );
    if (
      !queueApi.shouldQueueComposerSubmit({
        enabled,
        targetIsComposer,
        key: event.key,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        isComposing: event.isComposing,
        keyCode: event.keyCode,
        isGenerating: Boolean(findStopButton()),
        runnerActive,
        itemCount: state.items.length
      })
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    queueComposerDraft(composer.editor);
  }

  function buildUi() {
    const container = document.createElement("section");
    container.id = rootId;
    container.hidden = true;
    container.setAttribute("data-gptskins-queue-root", "true");
    container.setAttribute("aria-label", "Queued messages");
    container.innerHTML = `
      <div class="gptskins-queue-panel" data-gptskins-queue-panel hidden>
        <div class="gptskins-queue-list" data-gptskins-queue-list role="list"></div>
        <div class="gptskins-queue-paused" data-gptskins-queue-paused hidden>
          <span>Queue paused</span>
          <button type="button" data-gptskins-queue-resume>Resume</button>
        </div>
        <p class="gptskins-queue-status" data-gptskins-queue-status data-tone="muted" role="status" aria-live="polite"></p>
      </div>
      <button type="button" class="gptskins-queue-toggle" data-gptskins-queue-toggle aria-expanded="false">
        <span class="gptskins-queue-toggle-icon" aria-hidden="true">≡</span>
        <span class="gptskins-queue-count" data-gptskins-queue-count hidden>0</span>
      </button>
    `;
    container.addEventListener("click", (event) => {
      const actionButton = event.target.closest("button[data-queue-action]");
      if (actionButton) {
        changeItem(actionButton.dataset.queueAction, actionButton.dataset.queueItemId);
      }
    });
    container.querySelector("[data-gptskins-queue-toggle]").addEventListener("click", () => {
      panelExpanded = !panelExpanded;
      updatePanelState();
    });
    container.querySelector("[data-gptskins-queue-resume]").addEventListener("click", async () => {
      state.paused = false;
      await saveState();
      setStatus("");
      renderItems();
      scheduleRunner();
    });
    return container;
  }

  function onDocumentClick(event) {
    if (panelExpanded && root && !root.contains(event.target)) {
      panelExpanded = false;
      updatePanelState();
    }
  }

  async function syncConversation({ recover = false } = {}) {
    const nextConversationKey = queueApi.getConversationKey(location.href);
    if (nextConversationKey === currentConversationKey && !recover) {
      ensureUiAttached();
      return;
    }

    const conversationChanged = nextConversationKey !== currentConversationKey;
    currentConversationKey = nextConversationKey;
    currentStateStorageKey = queueApi.getStateStorageKey(currentConversationKey);
    if (conversationChanged) {
      panelExpanded = false;
      setStatus("");
    }
    await loadConversationState({ recover });
    clearTimeout(recoveryTimer);
    const submittingItem = state.items.find((item) => item.status === "submitting");
    if (submittingItem) {
      const wait = Math.max(0, queueApi.submissionReviewDelay - (Date.now() - submittingItem.statusAt) + 50);
      recoveryTimer = window.setTimeout(() => syncConversation({ recover: true }), wait);
    }
    scheduleRunner();
  }

  async function mount() {
    if (root || !document.body) {
      return;
    }
    root = buildUi();
    document.body.appendChild(root);
    ensureUiAttached();
    document.addEventListener("keydown", onComposerKeydown, true);
    document.addEventListener("click", onDocumentClick, true);
    await syncConversation({ recover: true });

    pageObserver = new MutationObserver(() => {
      ensureUiAttached();
      scheduleRunner();
    });
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
    clearTimeout(statusTimer);
    clearInterval(routeTimer);
    document.removeEventListener("keydown", onComposerKeydown, true);
    document.removeEventListener("click", onDocumentClick, true);
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
