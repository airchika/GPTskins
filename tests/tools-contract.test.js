"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

require("../tools/shared.js");

const toolsApi = globalThis.GPTskinsTools;
assert.ok(toolsApi, "tools API must be exposed");
assert.equal(toolsApi.scrollGuardEnabledStorageKey, "gptskins.scrollGuard.enabled");
assert.equal(toolsApi.latexCopyEnabledStorageKey, "gptskins.latexCopy.enabled");
assert.equal(toolsApi.defaultScrollGuardEnabled, true);
assert.equal(toolsApi.defaultLatexCopyEnabled, true);

assert.equal(toolsApi.formatLatex("  x^2 + y^2  ", toolsApi.latexFormats.tex), "x^2 + y^2");
assert.equal(toolsApi.formatLatex("$x$", toolsApi.latexFormats.inline), "$x$");
assert.equal(toolsApi.formatLatex("\\[x + y\\]", toolsApi.latexFormats.display), "$$x + y$$");
assert.equal(toolsApi.resolveLatexSource("x_data", "x_annotation"), "x_data", "data-math must win");
assert.equal(toolsApi.resolveLatexSource("", "x_annotation"), "x_annotation", "TeX annotation must be the fallback");
assert.equal(toolsApi.resolveLatexSource("", ""), "", "formulas without source metadata must stay native");

const outer = { id: "outer", parent: null, formula: true };
const inner = { id: "inner", parent: outer, formula: true };
const sibling = { id: "sibling", parent: null, formula: true };
assert.deepEqual(
  toolsApi.dedupeNestedFormulaCandidates(
    [outer, inner, sibling],
    (item) => item.parent,
    (item) => item.formula
  ).map((item) => item.id),
  ["outer", "sibling"],
  "nested KaTeX and MathML candidates must be replaced only once"
);

assert.equal(toolsApi.getBottomGap({ scrollHeight: 1000, clientHeight: 500, scrollTop: 350 }), 150);
assert.equal(
  toolsApi.shouldPreserveSubmitPosition({ scrollHeight: 1000, clientHeight: 500, scrollTop: 350 }),
  false,
  "the 150px boundary must keep ChatGPT's normal behavior"
);
assert.equal(toolsApi.shouldPreserveSubmitPosition({ scrollHeight: 1000, clientHeight: 500, scrollTop: 349 }), true);
assert.equal(toolsApi.shouldPreserveSubmitPosition({ scrollHeight: 1000, clientHeight: 500, scrollTop: 0 }, false), false);

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "manifest.json"), "utf8"));
const toolsContentScript = manifest.content_scripts.find((entry) => entry.js && entry.js.includes("tools/content.js"));
assert.ok(toolsContentScript, "tools must be registered as a separate content-script module");
assert.deepEqual(toolsContentScript.js, ["tools/shared.js", "tools/content.js"]);
assert.deepEqual(toolsContentScript.css, ["tools/content.css"]);
assert.doesNotMatch(JSON.stringify(manifest.permissions), /clipboard|scripting/i, "tools must not add clipboard or scripting permissions");
assert.equal(toolsContentScript.world, undefined, "tools must stay in the normal isolated content-script world");

const contentSource = fs.readFileSync(path.join(__dirname, "..", "tools", "content.js"), "utf8");
assert.match(contentSource, /document\.addEventListener\("submit", onComposerSubmit, true\)/);
assert.match(contentSource, /range\.cloneContents\(\)/, "mixed copy must inspect only the selected range clone");
assert.match(contentSource, /setData\("text\/plain"/);
assert.match(contentSource, /setData\("text\/html"/);
assert.match(contentSource, /isNativeResponseCopyControl/, "ChatGPT's response copy control must stay native");
assert.match(contentSource, /data-message-author-role=\\?"assistant\\?"/);
assert.match(contentSource, /annotation\[encoding=\\?"application\/x-tex\\?"\]/);
assert.doesNotMatch(contentSource, /(?:Window|Element|HTMLElement)\.prototype/, "tools must not patch browser prototypes");
assert.doesNotMatch(contentSource, /scrollIntoView\s*=|scrollTo\s*=|scrollBy\s*=/, "scroll protection must not replace global scrolling APIs");
assert.doesNotMatch(contentSource, /clipboard\.read|readText\s*\(/, "tools must never read the clipboard");
assert.doesNotMatch(contentSource, /\bfetch\s*\(|XMLHttpRequest|WebSocket/, "tools must not call network APIs");

const popupSource = fs.readFileSync(path.join(__dirname, "..", "popup", "popup.html"), "utf8");
assert.match(popupSource, /data-style-mode="tools"/);
assert.match(popupSource, /data-gptskins-queue-enabled/);
assert.match(popupSource, /data-gptskins-scroll-guard-enabled/);
assert.match(popupSource, /data-gptskins-latex-copy-enabled/);
assert.match(popupSource, /Formula Copy and Prevent Auto Scroll/);

console.log("Checked GPTskins tools contracts.");
