(function () {
  "use strict";

  const toolsApi = globalThis.GPTskinsTools;
  const scrollGuardToggle = document.querySelector("[data-gptskins-scroll-guard-enabled]");
  const latexCopyToggle = document.querySelector("[data-gptskins-latex-copy-enabled]");
  const toolsTab = document.querySelector('[data-style-mode="tools"]');
  const status = document.getElementById("status");
  if (!toolsApi || !scrollGuardToggle || !latexCopyToggle) {
    return;
  }

  const toolSettings = [
    {
      toggle: scrollGuardToggle,
      storageKey: toolsApi.scrollGuardEnabledStorageKey,
      enabledText: "Reading-position protection enabled.",
      disabledText: "Reading-position protection disabled."
    },
    {
      toggle: latexCopyToggle,
      storageKey: toolsApi.latexCopyEnabledStorageKey,
      enabledText: "LaTeX quick copy enabled.",
      disabledText: "LaTeX quick copy disabled."
    }
  ];

  chrome.storage.sync.get(
    {
      [toolsApi.scrollGuardEnabledStorageKey]: toolsApi.defaultScrollGuardEnabled,
      [toolsApi.latexCopyEnabledStorageKey]: toolsApi.defaultLatexCopyEnabled
    },
    (result) => {
      toolSettings.forEach(({ toggle, storageKey }) => {
        toggle.checked = result[storageKey] !== false;
      });
    }
  );

  toolsTab?.addEventListener("click", () => {
    status.textContent = "Reading-position protection and LaTeX quick copy are enabled by default.";
  });

  toolSettings.forEach(({ toggle, storageKey, enabledText, disabledText }) => {
    toggle.addEventListener("change", () => {
      const enabled = toggle.checked;
      chrome.storage.sync.set({ [storageKey]: enabled }, () => {
        if (chrome.runtime.lastError) {
          toggle.checked = !enabled;
          status.textContent = "Couldn't save the tool setting. Try again.";
          return;
        }
        status.textContent = enabled ? enabledText : disabledText;
      });
    });
  });
})();
