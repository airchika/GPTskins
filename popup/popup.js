(function () {
  "use strict";

  const themeApi = globalThis.GPTskinsThemes;
  const list = document.getElementById("theme-list");
  const fontList = document.getElementById("font-panel");
  const themePanel = document.getElementById("theme-panel");
  const toolsPanel = document.getElementById("tools-panel");
  const status = document.getElementById("status");
  const styleButtons = Array.from(document.querySelectorAll("[data-style-mode]"));
  const filterButtons = Array.from(document.querySelectorAll("[data-theme-mode]"));
  const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  let selectedThemeIds = { dark: "default", light: "default" };
  let selectedFonts = themeApi.resolveFontSelections();
  let styleMode = "theme";
  let themeMode = systemThemeMedia.matches ? "dark" : "light";

  function getSystemThemeMode() {
    return systemThemeMedia.matches ? "dark" : "light";
  }

  function renderThemeButton(theme) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-button";
    button.dataset.themeId = theme.id;
    button.setAttribute("aria-pressed", String(theme.id === selectedThemeIds[themeMode]));

    const swatches = document.createElement("span");
    swatches.className = "swatches";
    swatches.setAttribute("aria-hidden", "true");

    theme.swatches.forEach((color) => {
      const swatch = document.createElement("span");
      swatch.className = "swatch";
      swatch.style.backgroundColor = color;
      swatches.appendChild(swatch);
    });

    const copy = document.createElement("span");
    copy.className = "theme-copy";

    const name = document.createElement("span");
    name.className = "theme-name";
    name.textContent = theme.name;

    const description = document.createElement("span");
    description.className = "theme-description";
    description.textContent = theme.description;

    copy.append(name, description);
    button.append(swatches, copy);
    button.addEventListener("click", () => selectTheme(theme.id));

    return button;
  }

  function renderFontControl(role) {
    const setting = document.createElement("label");
    setting.className = "font-setting";

    const name = document.createElement("span");
    name.className = "font-setting-label";
    name.textContent = role.name;

    const select = document.createElement("select");
    select.className = "font-select";
    select.dataset.fontRole = role.id;
    select.setAttribute("aria-label", role.name);
    themeApi.getFontOptions(role.id).forEach((font) => {
      const option = document.createElement("option");
      option.value = font.id;
      option.textContent = font.name;
      option.selected = font.id === selectedFonts[role.id];
      select.appendChild(option);
    });
    select.addEventListener("change", () => selectFont(role.id, select.value));

    setting.append(name, select);
    return setting;
  }

  function updatePressedStates() {
    document.querySelectorAll(".theme-button").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.themeId === selectedThemeIds[themeMode]));
    });
    document.querySelectorAll(".font-select").forEach((select) => {
      select.value = selectedFonts[select.dataset.fontRole] || "default";
    });
    styleButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.styleMode === styleMode));
    });
    filterButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.themeMode === themeMode));
    });
  }

  function sendToActiveTab(message, appliedText, savedText) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id || !tab.url || !/^https:\/\/(chatgpt\.com|chat\.openai\.com)\//.test(tab.url)) {
        status.textContent = savedText;
        return;
      }

      chrome.tabs.sendMessage(tab.id, message, () => {
        if (chrome.runtime.lastError) {
          status.textContent = "Saved. Refresh ChatGPT if it was already open.";
          return;
        }

        status.textContent = appliedText;
      });
    });
  }

  function selectTheme(themeId) {
    const selectedMode = themeMode;
    const selectedThemeId = themeApi.getThemeForMode(themeId, selectedMode).id;
    selectedThemeIds[selectedMode] = selectedThemeId;
    updatePressedStates();

    chrome.storage.sync.set({ [themeApi.themeStorageKeys[selectedMode]]: selectedThemeId }, () => {
      const saveFailed = Boolean(chrome.runtime.lastError);
      const modeName = selectedMode === "dark" ? "Dark" : "Light";
      const activeMode = getSystemThemeMode();
      const isActiveMode = selectedMode === activeMode;
      sendToActiveTab(
        { type: "GPTSKINS_APPLY_THEME", themeMode: selectedMode, themeId: selectedThemeId },
        saveFailed
          ? `${modeName} theme ${isActiveMode ? "applied" : "selected"}, but couldn't save it.`
          : isActiveMode
            ? `${modeName} theme applied.`
            : `${modeName} theme saved. ${activeMode === "dark" ? "Dark" : "Light"} mode is active.`,
        saveFailed ? "Couldn't save theme. Try again." : `${modeName} theme saved.`
      );
    });
  }

  function selectFont(roleId, fontId) {
    const role = themeApi.getFontRole(roleId);
    if (!role) {
      return;
    }
    selectedFonts[roleId] = themeApi.getFontOption(roleId, fontId).id;
    updatePressedStates();

    chrome.storage.sync.set({ [themeApi.fontStorageKeys[roleId]]: selectedFonts[roleId] }, () => {
      const saveFailed = Boolean(chrome.runtime.lastError);
      sendToActiveTab(
        { type: "GPTSKINS_APPLY_FONTS", fonts: { ...selectedFonts } },
        saveFailed ? `${role.name} applied, but couldn't save it.` : `${role.name} applied.`,
        saveFailed ? `Couldn't save ${role.name.toLowerCase()}. Try again.` : "Fonts saved. Open ChatGPT to see them."
      );
    });
  }

  function isVisibleTheme(theme) {
    return theme.id === "default" || themeMode === (theme.dark ? "dark" : "light");
  }

  function renderThemes() {
    list.replaceChildren(...themeApi.themes.filter(isVisibleTheme).map(renderThemeButton));
    updatePressedStates();
  }

  function renderFonts() {
    fontList.replaceChildren(...themeApi.fontRoles.map(renderFontControl));
    updatePressedStates();
  }

  function showPanel(mode) {
    styleMode = mode;
    themePanel.hidden = styleMode !== "theme";
    fontList.hidden = styleMode !== "font";
    toolsPanel.hidden = styleMode !== "tools";
    if (styleMode === "theme") {
      status.textContent = "Dark and light themes follow your system setting.";
    } else if (styleMode === "font") {
      status.textContent = "Choose fonts independently for the interface, body, and code.";
    } else {
      status.textContent = "Enable only the tools you want.";
    }
    updatePressedStates();
  }

  styleButtons.forEach((button) => {
    button.addEventListener("click", () => showPanel(button.dataset.styleMode));
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      themeMode = button.dataset.themeMode;
      renderThemes();
    });
  });

  chrome.storage.sync.get(
    [
      themeApi.storageKey,
      themeApi.themeStorageKeys.dark,
      themeApi.themeStorageKeys.light,
      themeApi.legacyFontStorageKey,
      ...Object.values(themeApi.fontStorageKeys)
    ],
    (result) => {
      selectedThemeIds = themeApi.resolveThemeSelections(result);
      selectedFonts = themeApi.resolveFontSelections(result);
      const migratedSettings = {};
      for (const mode of ["dark", "light"]) {
        const storageKey = themeApi.themeStorageKeys[mode];
        if (result[storageKey] !== selectedThemeIds[mode]) {
          migratedSettings[storageKey] = selectedThemeIds[mode];
        }
      }
      themeApi.fontRoles.forEach((role) => {
        const storageKey = themeApi.fontStorageKeys[role.id];
        if (result[storageKey] !== selectedFonts[role.id]) {
          migratedSettings[storageKey] = selectedFonts[role.id];
        }
      });
      if (Object.keys(migratedSettings).length) {
        chrome.storage.sync.set(migratedSettings);
      }
      themeMode = getSystemThemeMode();
      renderThemes();
      renderFonts();
      showPanel("theme");
    }
  );
})();
