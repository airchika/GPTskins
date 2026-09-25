(function () {
  "use strict";

  const legacyFontStorageKey = "gptskins.font";
  const fontStorageKeys = {
    interface: "gpttoolkit.font.interface",
    text: "gpttoolkit.font.text",
    codePrimary: "gpttoolkit.font.code1",
    codeSecondary: "gpttoolkit.font.code2"
  };
  const defaultFontOption = {
    id: "default",
    name: "GPT Default",
    family: ""
  };
  const fontOptions = {
    interface: [
      defaultFontOption,
      {
        id: "sarasa-ui-sc",
        name: "Sarasa UI SC",
        family: '"Sarasa UI SC"'
      }
    ],
    text: [
      defaultFontOption,
      {
        id: "noto-sans-sc",
        name: "Noto Sans SC",
        family: '"Noto Sans SC"'
      },
      {
        id: "noto-serif-sc",
        name: "Noto Serif SC",
        family: '"Noto Serif SC"'
      },
      {
        id: "sarasa-gothic-sc",
        name: "Sarasa Gothic SC",
        family: '"Sarasa Gothic SC"'
      }
    ],
    code: [
      defaultFontOption,
      {
        id: "jetbrains-mono",
        name: "JetBrains Mono",
        family: '"JetBrains Mono"'
      },
      {
        id: "sarasa-mono-sc",
        name: "Sarasa Mono SC",
        family: '"Sarasa Mono SC"'
      },
      {
        id: "fira-code",
        name: "Fira Code",
        family: '"Fira Code"'
      },
      {
        id: "google-sans-code",
        name: "Google Sans Code",
        family: '"Google Sans Code"'
      }
    ]
  };
  const fontRoles = [
    { id: "interface", name: "Interface font", options: "interface" },
    { id: "text", name: "Body font", options: "text" },
    { id: "codePrimary", name: "Code font 1", options: "code" },
    { id: "codeSecondary", name: "Code font 2", options: "code" }
  ];

  function getFontRole(roleId) {
    return fontRoles.find((role) => role.id === roleId) || null;
  }

  function getFontOptions(roleId) {
    const role = getFontRole(roleId);
    return role ? fontOptions[role.options] : [defaultFontOption];
  }

  function getFontOption(roleId, optionId) {
    const options = getFontOptions(roleId);
    return options.find((option) => option.id === optionId) || options[0];
  }

  const oldFontStorageKeys = Object.fromEntries(
    Object.entries(fontStorageKeys).map(([role, key]) => [role, key.replace("gpttoolkit.", "gptskins.")])
  );
  const fontReadKeys = [...Object.values(fontStorageKeys), ...Object.values(oldFontStorageKeys), legacyFontStorageKey];

  function resolveFontSelections(settings = {}) {
    const has = (key) => Object.prototype.hasOwnProperty.call(settings, key);
    const hasRoleSettings = [...Object.values(fontStorageKeys), ...Object.values(oldFontStorageKeys)].some(has);
    const legacy = !hasRoleSettings && ["sarasa-mono-sc", "sarasa-mono-sc-text"].includes(settings[legacyFontStorageKey]);
    const preset = legacy ? {
      interface: "sarasa-ui-sc", text: "noto-sans-sc",
      codePrimary: "jetbrains-mono", codeSecondary: "sarasa-mono-sc"
    } : {};
    return Object.fromEntries(fontRoles.map(({ id }) => {
      const value = has(fontStorageKeys[id]) ? settings[fontStorageKeys[id]]
        : has(oldFontStorageKeys[id]) ? settings[oldFontStorageKeys[id]] : preset[id];
      return [id, getFontOption(id, value).id];
    }));
  }

  function getFontMigration(settings = {}) {
    const selections = resolveFontSelections(settings);
    return Object.fromEntries(fontRoles
      .filter(({ id }) => !Object.prototype.hasOwnProperty.call(settings, fontStorageKeys[id]))
      .map(({ id }) => [fontStorageKeys[id], selections[id]]));
  }

  function loadFontSettings(callback) {
    chrome.storage.sync.get(fontReadKeys, (settings) => {
      const error = chrome.runtime.lastError;
      if (error) { callback(resolveFontSelections(), error.message); return; }
      const selections = resolveFontSelections(settings);
      const migration = getFontMigration(settings);
      if (Object.keys(migration).length) {
        chrome.storage.sync.set(migration, () => {
          const saveError = chrome.runtime.lastError;
          callback(selections, saveError?.message);
        });
      } else { callback(selections); }
    });
  }

  function getFontSelectionSignature(selections = {}) {
    return fontRoles.map((role) => getFontOption(role.id, selections[role.id]).id).join("|");
  }

  function getCodeFontFamilies(selections = {}) {
    const families = [
      getFontOption("codePrimary", selections.codePrimary).family,
      getFontOption("codeSecondary", selections.codeSecondary).family
    ].filter(Boolean);
    return [...new Set(families)];
  }

  globalThis.GPTToolkitFonts = {
    legacyFontStorageKey, fontStorageKeys, oldFontStorageKeys, fontReadKeys,
    fontOptions, fontRoles, getFontRole, getFontOptions, getFontOption,
    resolveFontSelections, getFontMigration, loadFontSettings,
    getFontSelectionSignature, getCodeFontFamilies
  };
})();
