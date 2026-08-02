"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const contentPath = path.join(__dirname, "..", "content", "content.js");
const contentSource = fs.readFileSync(contentPath, "utf8");

function functionSource(name, nextName) {
  const start = contentSource.indexOf(`function ${name}(`);
  const end = contentSource.indexOf(`function ${nextName}(`, start + 1);
  assert.notEqual(start, -1, `${name} must exist`);
  assert.notEqual(end, -1, `${nextName} must follow ${name}`);
  return contentSource.slice(start, end);
}

assert.doesNotMatch(contentSource, /querySelectorAll\(["']body \*["']\)/, "normal theming must not scan every body descendant");
assert.doesNotMatch(contentSource, /document\.body\.innerText/, "plan detection must not read the complete page text");
assert.doesNotMatch(contentSource, /body \*:not\(/, "font theming must not match every page descendant");
assert.match(contentSource, /style\.dataset\.gptskinsThemeId === theme\.id/, "theme CSS updates must be idempotent");
assert.match(
  contentSource,
  /style\.dataset\.gptskinsFontSignature === signature/,
  "font CSS updates must be idempotent across all four font roles"
);
assert.match(contentSource, /if \(codeFamilies\.length\)/, "GPT Default code slots must not inject a replacement code stack");
assert.match(contentSource, /new MutationObserver\(handlePageMutations\)/, "page changes must use the incremental mutation handler");

const mutationSource = functionSource("handlePageMutations", "syncPageMarker");
assert.match(mutationSource, /record\.addedNodes/);
assert.match(mutationSource, /collectRelevantSurfaceRoot/);
assert.match(mutationSource, /includeDescendants: false/, "mutation targets must not rescan an unchanged ancestor subtree");
assert.doesNotMatch(mutationSource, /clearTags|syncSurfaceTags|querySelectorAll/, "mutation collection must not perform a full retag pass");

const viewportSource = functionSource("scheduleViewportSync", "ensurePageMarkerEventListeners");
assert.match(viewportSource, /tagFloatingScrollButtons/);
assert.doesNotMatch(viewportSource, /syncPageMarker|syncSurfaceTags|tagCodePre/, "scroll and resize must not rescan message surfaces");

console.log("Checked GPTskins incremental theming contracts.");
