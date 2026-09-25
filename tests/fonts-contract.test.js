"use strict";
const assert = require("node:assert/strict");
require("../shared/fonts.js");
const { fontRoles, fontStorageKeys, legacyFontStorageKey, getFontOptions, getFontOption,
  resolveFontSelections, getFontSelectionSignature, getCodeFontFamilies, getFontMigration } = globalThis.GPTToolkitFonts;

assert.deepEqual(
  fontRoles.map((role) => role.id),
  ["interface", "text", "codePrimary", "codeSecondary"],
  "font settings must expose four ordered roles"
);
assert.deepEqual(
  getFontOptions("interface").map((font) => font.id),
  ["default", "sarasa-ui-sc"],
  "interface fonts must stay intentionally narrow"
);
assert.deepEqual(
  getFontOptions("text").map((font) => font.id),
  ["default", "noto-sans-sc", "noto-serif-sc", "sarasa-gothic-sc"],
  "body fonts must match the curated CJK list"
);
assert.deepEqual(
  getFontOptions("codePrimary").map((font) => font.id),
  ["default", "jetbrains-mono", "sarasa-mono-sc", "fira-code", "google-sans-code"],
  "the first code slot must expose the curated code list"
);
assert.deepEqual(getFontOptions("codeSecondary"), getFontOptions("codePrimary"), "both code slots must share one option list");
assert.equal(getFontOption("text", "verdana").id, "default", "removed legacy font options must fall back to GPT Default");

const defaultFonts = resolveFontSelections();
assert.deepEqual(
  defaultFonts,
  { interface: "default", text: "default", codePrimary: "default", codeSecondary: "default" },
  "all font roles must default to ChatGPT's native fonts"
);
assert.equal(getFontSelectionSignature(defaultFonts), "default|default|default|default");
assert.deepEqual(getCodeFontFamilies(defaultFonts), [], "default code slots must not insert a custom family");
assert.deepEqual(
  getCodeFontFamilies({ codePrimary: "google-sans-code", codeSecondary: "sarasa-mono-sc" }),
  ['"Google Sans Code"', '"Sarasa Mono SC"'],
  "code families must preserve slot order"
);
assert.deepEqual(
  getCodeFontFamilies({ codePrimary: "fira-code", codeSecondary: "fira-code" }),
  ['"Fira Code"'],
  "duplicate code selections must be inserted once"
);
assert.deepEqual(
  resolveFontSelections({ [legacyFontStorageKey]: "sarasa-mono-sc" }),
  {
    interface: "sarasa-ui-sc",
    text: "noto-sans-sc",
    codePrimary: "jetbrains-mono",
    codeSecondary: "sarasa-mono-sc"
  },
  "the old Sarasa combination must migrate into four independent roles"
);
assert.deepEqual(
  resolveFontSelections({ [fontStorageKeys.text]: "noto-serif-sc", [legacyFontStorageKey]: "sarasa-mono-sc" }),
  { interface: "default", text: "noto-serif-sc", codePrimary: "default", codeSecondary: "default" },
  "new font settings must take precedence over the legacy combined preset"
);

const mixed = {
  "gptskins.font.interface": "sarasa-ui-sc",
  "gptskins.font.text": "noto-serif-sc",
  "gptskins.font.code1": "fira-code",
  "gpttoolkit.font.text": "default",
  "gptskins.theme.dark": "dracula"
};
assert.deepEqual(resolveFontSelections(mixed), {
  interface: "sarasa-ui-sc", text: "default", codePrimary: "fira-code", codeSecondary: "default"
});
assert.deepEqual(getFontMigration(mixed), {
  "gpttoolkit.font.interface": "sarasa-ui-sc",
  "gpttoolkit.font.code1": "fira-code",
  "gpttoolkit.font.code2": "default"
});
assert.deepEqual(getFontMigration({ ...mixed, ...getFontMigration(mixed) }), {});
assert.equal(resolveFontSelections({"gpttoolkit.font.text": "invalid", "gptskins.font.text": "noto-serif-sc"}).text, "default");
assert.deepEqual(resolveFontSelections({"gptskins.theme": "dracula"}), defaultFonts);
console.log("Checked font options, ordering, defaults and migration.");
