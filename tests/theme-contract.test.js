"use strict";

const assert = require("node:assert/strict");

require("../shared/themes.js");

const {
  storageKey,
  themeStorageKeys,
  themes,
  fonts,
  getThemeForMode,
  resolveThemeSelections
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
assert.equal(new Set(fonts.map((font) => font.id)).size, fonts.length, "font ids must be unique");
assert.notEqual(themeStorageKeys.dark, themeStorageKeys.light, "dark and light themes need separate storage keys");

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

const sarasaSc = fonts.find((font) => font.id === "sarasa-mono-sc");
assert.ok(sarasaSc, "Sarasa SC font preset must exist");
assert.match(sarasaSc.stack, /Sarasa UI SC/, "Sarasa preset must use Sarasa UI SC for interface text");
assert.match(sarasaSc.textStack, /Noto Sans SC/, "Sarasa preset must use Noto Sans SC for message text");
assert.match(sarasaSc.codeStack, /JetBrains Mono/, "Sarasa preset must use JetBrains Mono for code");

const sarasaMonoSc = fonts.find((font) => font.id === "sarasa-mono-sc-text");
assert.ok(sarasaMonoSc, "Sarasa Mono SC font preset must exist");
assert.match(sarasaMonoSc.stack, /Sarasa UI SC/, "Sarasa Mono preset must use Sarasa UI SC for interface text");
assert.match(sarasaMonoSc.textStack, /Sarasa Mono SC/, "Sarasa Mono preset must use Sarasa Mono SC for message text");
assert.match(sarasaMonoSc.codeStack, /JetBrains Mono/, "Sarasa Mono preset must use JetBrains Mono for code");

console.log(`Checked ${themes.length - 1} GPTskins theme palettes.`);
