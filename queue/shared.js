(function () {
  "use strict";

  const enabledStorageKey = "gptskins.queue.enabled";
  const stateStoragePrefix = "gptskins.queue.state.v1";
  const maxItems = 10;
  const maxPromptLength = 8000;
  const submissionReviewDelay = 15000;
  const validStatuses = new Set(["pending", "submitting", "review"]);

  function normalizePrompt(value) {
    return typeof value === "string" ? value.trim().slice(0, maxPromptLength) : "";
  }

  function getConversationKey(value) {
    let url;
    try {
      url = new URL(value, "https://chatgpt.com/");
    } catch {
      return null;
    }

    if (url.hostname !== "chatgpt.com" && url.hostname !== "chat.openai.com") {
      return null;
    }

    const match = url.pathname.match(/\/c\/([a-z0-9-]+)/i);
    return match ? match[1] : null;
  }

  function getStateStorageKey(conversationKey) {
    return conversationKey ? `${stateStoragePrefix}.${conversationKey}` : null;
  }

  function normalizeItem(item) {
    const text = normalizePrompt(item && item.text);
    if (!item || typeof item.id !== "string" || !item.id || !text) {
      return null;
    }

    return {
      id: item.id,
      text,
      status: validStatuses.has(item.status) ? item.status : "pending",
      createdAt: Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
      statusAt: Number.isFinite(item.statusAt) ? item.statusAt : 0
    };
  }

  function normalizeState(value) {
    const seen = new Set();
    const items = [];
    const sourceItems = value && Array.isArray(value.items) ? value.items : [];
    for (const sourceItem of sourceItems) {
      const item = normalizeItem(sourceItem);
      if (!item || seen.has(item.id)) {
        continue;
      }

      seen.add(item.id);
      items.push(item);
      if (items.length >= maxItems) {
        break;
      }
    }

    return {
      paused: Boolean(value && value.paused),
      items
    };
  }

  function recoverState(value, now = Date.now()) {
    const state = normalizeState(value);
    let interrupted = false;
    state.items = state.items.map((item) => {
      if (item.status !== "submitting" || now - item.statusAt < submissionReviewDelay) {
        return item;
      }

      interrupted = true;
      return { ...item, status: "review" };
    });
    if (interrupted) {
      state.paused = true;
    }
    return state;
  }

  globalThis.GPTskinsQueue = {
    enabledStorageKey,
    stateStoragePrefix,
    maxItems,
    maxPromptLength,
    submissionReviewDelay,
    normalizePrompt,
    getConversationKey,
    getStateStorageKey,
    normalizeState,
    recoverState
  };
})();
