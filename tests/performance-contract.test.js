"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const contentPath = path.join(__dirname, "..", "content", "content.js");
const cssPath = path.join(__dirname, "..", "content", "content.css");
const contentSource = fs.readFileSync(contentPath, "utf8");
const cssSource = fs.readFileSync(cssPath, "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "manifest.json"), "utf8"));

function functionSource(name, nextName) {
  const start = contentSource.indexOf(`function ${name}(`);
  const end = contentSource.indexOf(`function ${nextName}(`, start + 1);
  assert.notEqual(start, -1, `${name} must exist`);
  assert.notEqual(end, -1, `${nextName} must follow ${name}`);
  return contentSource.slice(start, end);
}

assert.doesNotMatch(contentSource, /querySelectorAll\(["']body \*["']\)/, "normal theming must not scan every body descendant");
assert.doesNotMatch(contentSource, /document\.body\.innerText/, "plan detection must not read the complete page text");
assert.doesNotMatch(contentSource, /createElement\(["']style["']\)|style\.textContent/, "theme scripts must not rebuild the static stylesheet");
assert.match(contentSource, /root\.style\.getPropertyValue\(name\)\.trim\(\) !== value/, "theme variables must update idempotently");
assert.match(contentSource, /data-gptskins-font-signature/, "font variables must remain idempotent across all four roles");
assert.match(contentSource, /if \(codeFamilies\.length\)/, "GPT Default code slots must not inject a replacement code stack");
assert.match(contentSource, /new MutationObserver\(handlePageMutations\)/, "page changes must use the incremental mutation handler");
assert.equal(manifest.version, "1.3.0");
assert.deepEqual(manifest.content_scripts[0].css, ["content/content.css"], "static theme CSS must load before the theme script");
assert.doesNotMatch(JSON.stringify(manifest), /queue\//, "the removed queue must not load on ChatGPT pages");
assert.equal(fs.existsSync(path.join(__dirname, "..", "queue", "content.js")), false, "the removed queue runtime must not remain");
assert.equal(fs.existsSync(path.join(__dirname, "..", "queue", "shared.js")), false, "the removed queue API must not remain");

assert.match(cssSource, /html\[data-gptskins-theme\]/, "theme rules must stay behind the theme marker");
assert.match(cssSource, /html\[data-gptskins-font-text\]/, "font rules must stay behind role markers");
assert.doesNotMatch(cssSource, /html\[data-gptskins-switching\](?!\[)/, "transition suppression must also stay behind the theme marker");
assert.doesNotMatch(cssSource, /\$\{/, "the static stylesheet must not contain JavaScript interpolation");
assert.doesNotMatch(cssSource, /\.markdown \*/, "body-font styling must inherit instead of matching every Markdown descendant");
assert.doesNotMatch(cssSource, /thread-bottom-container[^\n]*:has\(/, "composer paint must not invalidate through :has");
assert.doesNotMatch(cssSource, /\.markdown[^\n]*:has\(> (?:div > )?pre\)|:has\(:is\(pre, code\)\)/, "code cards must use GPTskins data tags");
assert.match(cssSource, /\[data-gptskins-code-header\]/, "language headers must retain their dedicated theme rule");
assert.doesNotMatch(cssSource, /data-gptskins-(?:scroll-button|suggestion-layer|plan-layer)/, "retired heuristic tags must not remain in CSS");

const codeCleanupSource = functionSource("clearCodeTagsForPre", "tagCodePre");
assert.match(codeCleanupSource, /\|\| pre;/, "untagged code cleanup must stay within the current pre");
assert.doesNotMatch(
  codeCleanupSource,
  /\|\| pre\.parentElement/,
  "tagging one code card must not clear sibling cards in the same markdown response"
);

const mutationSource = functionSource("handlePageMutations", "syncPageMarker");
assert.match(mutationSource, /record\.addedNodes/);
assert.match(mutationSource, /collectRelevantSurfaceRoot/);
assert.match(mutationSource, /!\(node instanceof Element\)/, "streaming text nodes must be skipped");
assert.match(mutationSource, /!node\.closest\("\[data-message-author-role\]"\)/, "plan detection must skip normal streaming messages");
assert.doesNotMatch(mutationSource, /record\.target|record\.type|attributes/, "the body observer must not process broad attribute changes");
assert.doesNotMatch(mutationSource, /clearTags|syncSurfaceTags|querySelectorAll/, "mutation collection must not perform a full retag pass");

const codeCandidateSource = functionSource("getCodeCandidates", "codeSurfaceNeedsReconcile");
assert.match(codeCandidateSource, /pre\.closest\("\.cm-editor, \.cm-scroller"\)/, "CodeMirror changes must identify their local editor");
assert.match(
  codeCandidateSource,
  /codeMirrorRoot\?\.closest\("\[data-message-author-role\] pre"\)/,
  "CodeMirror changes must promote the containing outer code card"
);
assert.doesNotMatch(
  codeCandidateSource,
  /document\.querySelectorAll|queryWithin\(document/,
  "CodeMirror promotion must not rescan every historical code block"
);

const deferredCodeSource = functionSource("reconcileDeferredCodeSurfaces", "scheduleDeferredCodeSurfaceReconcile");
assert.match(deferredCodeSource, /codeSurfaceNeedsReconcile/, "deferred code reconciliation must skip complete cards");
assert.match(deferredCodeSource, /pendingDeferredCodeRoots/, "deferred reconciliation must use the newly changed code roots");
assert.doesNotMatch(deferredCodeSource, /getCodeCandidates\(document\)/, "incremental reconciliation must not rescan historical code cards");
assert.doesNotMatch(deferredCodeSource, /body \*|clearTags|syncSurfaceTags/, "deferred code reconciliation must not perform a broad retag pass");
assert.match(
  mutationSource,
  /scheduleDeferredCodeSurfaceReconcile\(deferredCodeRoots\)/,
  "code mutations must pass only their added roots to the delayed reconciliation"
);
assert.match(
  contentSource,
  /applySelectedTheme\(\{ forceSurfaceSync: true \}\);/,
  "content-script initialization must reconcile existing surfaces"
);
assert.doesNotMatch(contentSource, /tagFloatingScrollButtons|tagSuggestionLayers|tagPlanLayers|scheduleViewportSync/);
assert.doesNotMatch(contentSource, /pageMarkerObserver\.observe\([\s\S]*?attributes:\s*true/, "the body observer must stay child-list only");
assert.doesNotMatch(contentSource, /querySelectorAll\(["']\*["']\)|getComputedStyle\([^\n]*::(?:before|after)/, "plan theming must not scan every descendant or pseudo-element");

console.log("Checked GPTskins incremental theming contracts.");
