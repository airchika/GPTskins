(function () {
  "use strict";
  const fontApi = globalThis.GPTToolkitFonts;
  const fontList = document.getElementById("font-panel");
  const toolsPanel = document.getElementById("tools-panel");
  const status = document.getElementById("status");
  const styleButtons = Array.from(document.querySelectorAll("[data-style-mode]"));
  let selectedFonts = fontApi.resolveFontSelections();
  let styleMode = "font";

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
    fontApi.getFontOptions(role.id).forEach((font) => {
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
    document.querySelectorAll(".font-select").forEach((select) => {
      select.value = selectedFonts[select.dataset.fontRole] || "default";
    });
    styleButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.styleMode === styleMode));
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

  function selectFont(roleId, fontId) {
    const role = fontApi.getFontRole(roleId);
    if (!role) {
      return;
    }
    const previousFont = selectedFonts[roleId];
    selectedFonts[roleId] = fontApi.getFontOption(roleId, fontId).id;
    updatePressedStates();

    chrome.storage.sync.set({ [fontApi.fontStorageKeys[roleId]]: selectedFonts[roleId] }, () => {
      if (chrome.runtime.lastError) {
        selectedFonts[roleId] = previousFont;
        updatePressedStates();
        status.textContent = `Couldn't save ${role.name.toLowerCase()}. Try again.`;
        return;
      }
      sendToActiveTab(
        { type: "GPTTOOLKIT_APPLY_FONTS", fonts: { ...selectedFonts } },
        `${role.name} applied.`,
        "Fonts saved. Open ChatGPT to see them."
      );
    });
  }

  function renderFonts() {
    fontList.replaceChildren(...fontApi.fontRoles.map(renderFontControl));
    updatePressedStates();
  }

  function showPanel(mode) {
    styleMode = mode === "tools" ? "tools" : "font";
    fontList.hidden = styleMode !== "font";
    toolsPanel.hidden = styleMode !== "tools";
    status.textContent = styleMode === "font"
      ? "Uses installed local fonts. Missing fonts fall back to system fonts."
      : "Enable only the tools you want.";
    updatePressedStates();
  }
  styleButtons.forEach((button) => {
    button.addEventListener("click", () => showPanel(button.dataset.styleMode));
  });
  showPanel("font");
  fontApi.loadFontSettings((fonts, error) => {
    selectedFonts = fonts;
    renderFonts();
    if (error) status.textContent = "Couldn't load or migrate font settings. Refresh and try again.";
  });
})();
