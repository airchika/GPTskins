"use strict";

const assert = require("node:assert/strict");

require("../shared/themes.js");

const { themes, fonts } = globalThis.GPTskinsThemes;

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

for (const theme of themes.filter((item) => item.id !== "default")) {
  assert.match(theme.colors.accent, /^#[0-9a-f]{6}$/i, `${theme.id} needs a hex accent`);
  assert.match(theme.colors.accentText, /^#[0-9a-f]{6}$/i, `${theme.id} needs a hex accent label`);
  assert.ok(contrast(theme.colors.accent, theme.colors.accentText) >= 4.5, `${theme.id} accent label contrast is below 4.5:1`);
}

const sarasaSc = fonts.find((font) => font.id === "sarasa-mono-sc");
assert.ok(sarasaSc, "Sarasa SC font preset must exist");
assert.match(sarasaSc.stack, /Sarasa UI SC/, "Sarasa preset must use Sarasa UI SC for interface text");
assert.match(sarasaSc.textStack, /Sarasa Mono SC/, "Sarasa preset must use Sarasa Mono SC for message text");
assert.match(sarasaSc.codeStack, /JetBrains Mono/, "Sarasa preset must use JetBrains Mono for code");

console.log(`Checked ${themes.length - 1} GPTskins theme palettes.`);
