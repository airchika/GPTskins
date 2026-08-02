"use strict";

const assert = require("node:assert/strict");

require("../shared/themes.js");

const {
  storageKey,
  themeStorageKeys,
  legacyFontStorageKey,
  fontStorageKeys,
  themes,
  fontOptions,
  fontRoles,
  getThemeForMode,
  resolveThemeSelections,
  getFontOptions,
  getFontOption,
  resolveFontSelections,
  getFontSelectionSignature,
  getCodeFontFamilies
} = globalThis.GPTskinsThemes;

function luminance(hex) {
  const channels = [1, 3, 5]
    .map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

assert.equal(new Set(themes.map((theme) => theme.id)).size, themes.length, "theme ids must be unique");
assert.notEqual(themeStorageKeys.dark, themeStorageKeys.light, "dark and light themes need separate storage keys");
assert.equal(new Set(Object.values(fontStorageKeys)).size, fontRoles.length, "font roles need separate storage keys");
Object.entries(fontOptions).forEach(([group, options]) => {
  assert.equal(new Set(options.map((font) => font.id)).size, options.length, `${group} font ids must be unique`);
});

for (const theme of themes.filter((item) => item.id !== "default")) {
  assert.match(theme.colors.accent, /^#[0-9a-f]{6}$/i, `${theme.id} needs a hex accent`);
  assert.match(theme.colors.accentText, /^#[0-9a-f]{6}$/i, `${theme.id} needs a hex accent label`);
  assert.ok(contrast(theme.colors.accent, theme.colors.accentText) >= 4.5, `${theme.id} accent label contrast is below 4.5:1`);
}

const defaultTheme = themes.find((theme) => theme.id === "default");
const darkTheme = themes.find((theme) => theme.dark);
const lightTheme = themes.find((theme) => theme.id !== "default" && !theme.dark);
assert.ok(defaultTheme, "native Default theme must exist");
assert.equal(getThemeForMode("default", "dark"), defaultTheme, "Default must be available in dark mode");
assert.equal(getThemeForMode("default", "light"), defaultTheme, "Default must be available in light mode");
assert.equal(getThemeForMode(darkTheme.id, "light"), defaultTheme, "dark themes must not enter the light slot");
assert.equal(getThemeForMode(lightTheme.id, "dark"), defaultTheme, "light themes must not enter the dark slot");
assert.deepEqual(
  resolveThemeSelections({ [storageKey]: darkTheme.id }),
  { dark: darkTheme.id, light: "default" },
  "legacy dark selection must migrate without changing the light selection"
);
assert.deepEqual(
  resolveThemeSelections({ [storageKey]: lightTheme.id }),
  { dark: "default", light: lightTheme.id },
  "legacy light selection must migrate without changing the dark selection"
);

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

console.log(`Checked ${themes.length - 1} GPTskins theme palettes.`);
