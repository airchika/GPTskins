(function () {
  "use strict";
  const fontApi = globalThis.GPTToolkitFonts;
  const root = document.documentElement;
  let selectedFonts = fontApi.resolveFontSelections();
  let appliedFontVariables = new Set();
  let routeTimer = 0;
  let lastRoute = location.href;
  const routeChangeEventName = "gpttoolkit:routechange";

  function setManagedVariables(currentNames, values) {
    const nextNames = new Set(Object.keys(values));
    currentNames.forEach((name) => {
      if (!nextNames.has(name)) {
        root.style.removeProperty(name);
      }
    });
    Object.entries(values).forEach(([name, value]) => {
      if (root.style.getPropertyValue(name).trim() !== value) {
        root.style.setProperty(name, value);
      }
    });
    return nextNames;
  }

  function normalizeFontSelections(selections = {}) {
    return Object.fromEntries(
      fontApi.fontRoles.map((role) => [role.id, fontApi.getFontOption(role.id, selections[role.id]).id])
    );
  }

  function applyFontVariables(selections) {
    const interfaceFont = fontApi.getFontOption("interface", selections.interface);
    const textFont = fontApi.getFontOption("text", selections.text);
    const codeFamilies = fontApi.getCodeFontFamilies(selections);
    const variables = {};

    if (interfaceFont.family) {
      variables["--gpttoolkit-interface-font-family"] =
        interfaceFont.family + ', "Microsoft YaHei UI", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif';
    }
    if (textFont.family) {
      const textFallback =
        textFont.id === "noto-serif-sc"
          ? '"Songti SC", SimSun, serif'
          : '"Microsoft YaHei UI", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif';
      variables["--gpttoolkit-text-font-family"] = textFont.family + ", " + textFallback;
    }
    if (codeFamilies.length) {
      variables["--gpttoolkit-code-font-family"] = [
        ...codeFamilies,
        "ui-monospace",
        "SFMono-Regular",
        "Menlo",
        "Monaco",
        "Consolas",
        '"Liberation Mono"',
        "monospace"
      ].join(", ");
    }

    appliedFontVariables = setManagedVariables(appliedFontVariables, variables);
    root.toggleAttribute("data-gpttoolkit-font-interface", Boolean(interfaceFont.family));
    root.toggleAttribute("data-gpttoolkit-font-text", Boolean(textFont.family));
    root.toggleAttribute("data-gpttoolkit-font-code", codeFamilies.length > 0);
  }

  function clearFontVariables() {
    appliedFontVariables.forEach((name) => root.style.removeProperty(name));
    appliedFontVariables.clear();
    root.removeAttribute("data-gpttoolkit-font-interface");
    root.removeAttribute("data-gpttoolkit-font-text");
    root.removeAttribute("data-gpttoolkit-font-code");
    root.removeAttribute("data-gpttoolkit-font-signature");
  }

  function applyFonts(selections) {
    selectedFonts = normalizeFontSelections(selections);
    const allDefault = Object.values(selectedFonts).every((fontId) => fontId === "default");
    if (allDefault) {
      if (root.hasAttribute("data-gpttoolkit-font")) {
        root.removeAttribute("data-gpttoolkit-font");
        clearFontVariables();
      }
      return;
    }

    const signature = fontApi.getFontSelectionSignature(selectedFonts);
    if (root.hasAttribute("data-gpttoolkit-font") && root.getAttribute("data-gpttoolkit-font-signature") === signature) {
      return;
    }

    applyFontVariables(selectedFonts);
    root.setAttribute("data-gpttoolkit-font", "true");
    root.setAttribute("data-gpttoolkit-font-signature", signature);
  }

  function startRouteObserver() {
    const notifyRouteChange = (nextRoute = location.href) => {
      const previousRoute = lastRoute;
      lastRoute = nextRoute;
      clearTimeout(routeTimer);
      routeTimer = setTimeout(() => applyFonts(selectedFonts), 80);
      if (lastRoute !== previousRoute) {
        window.dispatchEvent(new Event(routeChangeEventName));
      }
    };
    const notifyCurrentRouteChange = () => notifyRouteChange();
    ["pushState", "replaceState"].forEach((method) => {
      const original = history[method];
      if (typeof original !== "function") {
        return;
      }

      history[method] = function (...args) {
        const result = original.apply(this, args);
        notifyCurrentRouteChange();
        return result;
      };
    });

    window.addEventListener("popstate", notifyCurrentRouteChange);
    window.addEventListener("hashchange", notifyCurrentRouteChange);
    window.addEventListener("pageshow", notifyCurrentRouteChange);
    window.navigation?.addEventListener("navigate", (event) => {
      notifyRouteChange(event.destination?.url || location.href);
    });
    window.setInterval(() => {
      if (location.href === lastRoute) {
        return;
      }
      notifyCurrentRouteChange();
    }, 500);
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "GPTTOOLKIT_APPLY_FONTS") {
      applyFonts(message.fonts);
      sendResponse({ applied: true });
    }
  });
  let initialUpdates = {};
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") return;
    let changed = false;
    fontApi.fontRoles.forEach(({ id }) => {
      const change = changes[fontApi.fontStorageKeys[id]];
      if (change) {
        selectedFonts[id] = fontApi.getFontOption(id, change.newValue).id;
        if (initialUpdates) initialUpdates[id] = selectedFonts[id];
        changed = true;
      }
    });
    if (changed) applyFonts(selectedFonts);
  });
  startRouteObserver();
  fontApi.loadFontSettings((fonts) => {
    applyFonts({ ...fonts, ...initialUpdates });
    initialUpdates = null;
  });
})();
