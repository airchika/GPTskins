"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

require("../queue/shared.js");

const queueApi = globalThis.GPTskinsQueue;
assert.ok(queueApi, "queue API must be exposed");
assert.equal(queueApi.getConversationKey("https://chatgpt.com/c/example-id"), "example-id");
assert.equal(queueApi.getConversationKey("https://chatgpt.com/g/gpt-id/c/conversation-id"), "conversation-id");
assert.equal(queueApi.getConversationKey("https://example.com/c/example-id"), null);
assert.equal(queueApi.getConversationKey("https://chatgpt.com/"), null);
assert.equal(queueApi.normalizePrompt("  hello  "), "hello");
assert.equal(queueApi.normalizePrompt("x".repeat(queueApi.maxPromptLength + 10)).length, queueApi.maxPromptLength);

const now = Date.now();
const baseState = {
  paused: false,
  items: [
    { id: "one", text: "First", status: "pending", createdAt: now, statusAt: 0 },
    { id: "one", text: "Duplicate", status: "pending", createdAt: now, statusAt: 0 },
    { id: "two", text: "Second", status: "submitting", createdAt: now, statusAt: now - 20000 }
  ]
};
const normalized = queueApi.normalizeState(baseState);
assert.equal(normalized.items.length, 2, "duplicate queue ids must be discarded");
assert.equal(normalized.items[1].status, "submitting");

const recovered = queueApi.recoverState(baseState, now);
assert.equal(recovered.paused, true, "stale interrupted submissions must pause the queue");
assert.equal(recovered.items[1].status, "review", "stale interrupted submissions must require review");

const freshSubmission = queueApi.recoverState(
  { paused: false, items: [{ id: "fresh", text: "Fresh", status: "submitting", createdAt: now, statusAt: now }] },
  now
);
assert.equal(freshSubmission.paused, false, "fresh submissions must not be treated as interrupted");
assert.equal(freshSubmission.items[0].status, "submitting");

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "manifest.json"), "utf8"));
const queueContentScript = manifest.content_scripts.find((entry) => entry.js && entry.js.includes("queue/content.js"));
assert.ok(queueContentScript, "queue must be registered as a separate content-script module");
assert.deepEqual(queueContentScript.js, ["queue/shared.js", "queue/content.js"]);

const queueSource = fs.readFileSync(path.join(__dirname, "..", "queue", "content.js"), "utf8");
assert.doesNotMatch(queueSource, /\bfetch\s*\(|XMLHttpRequest|WebSocket/, "queue must not call network APIs");
assert.doesNotMatch(
  queueSource,
  /data-message-author-role=["']assistant["']/,
  "queue must not inspect assistant response text"
);

console.log("Checked GPTskins queue contracts.");
