(function () {
  "use strict";

  const themeApi = globalThis.GPTskinsThemes;
  const root = document.documentElement;
  const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  const codeSurfaceTags = [
    "data-gptskins-code-frame",
    "data-gptskins-code-block",
    "data-gptskins-code-header",
    "data-gptskins-code-body",
    "data-gptskins-code-body-shell",
    "data-gptskins-code-scrollable"
  ];
  const dynamicSurfaceTags = [
    "data-gptskins-sidebar-action",
    "data-gptskins-plan-toggle",
    "data-gptskins-plan-toggle-option",
    "data-gptskins-plan-active",
    "data-gptskins-plan-cta",
    "data-gptskins-plan-disabled"
  ];
  const themeBypassExactPaths = new Set([
    "/overview",
    "/atlas",
    "/parent-resources",
    "/college-students",
    "/contact-sales",
    "/merchants",
    "/pricing",
    "/download"
  ]);
  const themeBypassPrefixPaths = ["/features", "/use-cases", "/codex", "/business", "/plans"];
  let selectedThemeIds = { dark: "default", light: "default" };
  let selectedFonts = {
    interface: "default",
    text: "default",
    codePrimary: "default",
    codeSecondary: "default"
  };
  let routeThemeTimer = 0;
  let routeThemeObserverStarted = false;
  let lastThemeRoute = location.href;
  let themeSwitchTimer = 0;
  const routeChangeEventName = "gptskins:routechange";

  function normalizePath(pathname) {
    return pathname.replace(/\/+$/, "") || "/";
  }

  function shouldBypassThemeForUrl(url = location.href) {
    let parsedUrl;
    try {
      parsedUrl = new URL(url, location.origin);
    } catch {
      return false;
    }

    if (parsedUrl.hostname !== "chatgpt.com") {
      return false;
    }

    const path = normalizePath(parsedUrl.pathname);
    return themeBypassExactPaths.has(path) || themeBypassPrefixPaths.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  }

  function removeTheme() {
    clearTimeout(themeSwitchTimer);
    stopPageMarkerObserver();
    root.removeAttribute("data-gptskins-switching");
    root.removeAttribute("data-gptskins-theme");
    root.removeAttribute("data-gptskins-plan-page");
    root.removeAttribute("data-gptskins-finance-page");
    clearThemeVariables();
    clearSurfaceTags();
  }

  function removeFont() {
    root.removeAttribute("data-gptskins-font");
    clearFontVariables();
  }

  let appliedThemeVariables = new Set();
  let appliedFontVariables = new Set();

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

  function applyThemeVariables(theme) {
    const variables = {};
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (value) {
        variables["--gptskins-" + key] = value;
      }
    });
    appliedThemeVariables = setManagedVariables(appliedThemeVariables, variables);
    root.setAttribute("data-gptskins-color-scheme", themeApi.darkThemeIds.has(theme.id) ? "dark" : "light");
  }

  function clearThemeVariables() {
    appliedThemeVariables.forEach((name) => root.style.removeProperty(name));
    appliedThemeVariables.clear();
    root.removeAttribute("data-gptskins-color-scheme");
  }

  function normalizeFontSelections(selections = {}) {
    return Object.fromEntries(
      themeApi.fontRoles.map((role) => [role.id, themeApi.getFontOption(role.id, selections[role.id]).id])
    );
  }

  function applyFontVariables(selections) {
    const interfaceFont = themeApi.getFontOption("interface", selections.interface);
    const textFont = themeApi.getFontOption("text", selections.text);
    const codeFamilies = themeApi.getCodeFontFamilies(selections);
    const variables = {};

    if (interfaceFont.family) {
      variables["--gptskins-interface-font-family"] =
        interfaceFont.family + ', "Microsoft YaHei UI", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif';
    }
    if (textFont.family) {
      const textFallback =
        textFont.id === "noto-serif-sc"
          ? '"Songti SC", SimSun, serif'
          : '"Microsoft YaHei UI", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif';
      variables["--gptskins-text-font-family"] = textFont.family + ", " + textFallback;
    }
    if (codeFamilies.length) {
      variables["--gptskins-code-font-family"] = [
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
    root.toggleAttribute("data-gptskins-font-interface", Boolean(interfaceFont.family));
    root.toggleAttribute("data-gptskins-font-text", Boolean(textFont.family));
    root.toggleAttribute("data-gptskins-font-code", codeFamilies.length > 0);
  }

  function clearFontVariables() {
    appliedFontVariables.forEach((name) => root.style.removeProperty(name));
    appliedFontVariables.clear();
    root.removeAttribute("data-gptskins-font-interface");
    root.removeAttribute("data-gptskins-font-text");
    root.removeAttribute("data-gptskins-font-code");
    root.removeAttribute("data-gptskins-font-signature");
  }

  function markThemeSwitching() {
    clearTimeout(themeSwitchTimer);
    root.setAttribute("data-gptskins-switching", "true");
    themeSwitchTimer = setTimeout(() => {
      root.removeAttribute("data-gptskins-switching");
    }, 180);
  }

  function captureScrollPositions() {
    const seen = new Set();
    const snapshots = [];
    const add = (item) => {
      if (!item || seen.has(item) || item.scrollHeight <= item.clientHeight + 1 || item.scrollTop <= 0) {
        return;
      }

      seen.add(item);
      snapshots.push({
        item,
        top: item.scrollTop,
        bottom: item.scrollHeight - item.clientHeight - item.scrollTop
      });
    };

    add(document.scrollingElement);
    add(document.documentElement);
    add(document.body);
    document.querySelectorAll("main, [role='main'], [class*='overflow-y-auto'], [class*='overflow-auto'], [class*='scroll']").forEach(add);

    return () => {
      snapshots.forEach(({ item, top, bottom }) => {
        const maxTop = item.scrollHeight - item.clientHeight;
        item.scrollTop = bottom <= 2 ? maxTop : Math.min(top, maxTop);
      });
    };
  }

  function restoreScrollPosition(restore) {
    restore();
    requestAnimationFrame(() => {
      restore();
      requestAnimationFrame(restore);
    });
  }

  function getSystemThemeMode() {
    return systemThemeMedia.matches ? "dark" : "light";
  }

  function applySelectedTheme(options) {
    applyTheme(selectedThemeIds[getSystemThemeMode()], options);
  }

  function setThemeSelection(mode, themeId) {
    if (mode !== "dark" && mode !== "light") {
      return;
    }

    selectedThemeIds[mode] = themeApi.getThemeForMode(themeId, mode).id;
    applySelectedTheme();
  }

  function applyTheme(themeId, { forceSurfaceSync = false } = {}) {
    const theme = themeApi.getTheme(themeId || "default");
    const bypassed = shouldBypassThemeForUrl();
    if (bypassed || theme.id === "default") {
      if (root.hasAttribute("data-gptskins-theme")) {
        const restoreScroll = captureScrollPositions();
        removeTheme();
        restoreScrollPosition(restoreScroll);
      }
      return;
    }

    const alreadyApplied = root.getAttribute("data-gptskins-theme") === theme.id;
    if (alreadyApplied) {
      startPageMarkerObserver();
      if (forceSurfaceSync) {
        schedulePageMarker({ full: true, checkPlan: true });
      }
      return;
    }

    const needsFullSurfaceSync = forceSurfaceSync || !root.hasAttribute("data-gptskins-theme");
    const restoreScroll = captureScrollPositions();
    applyThemeVariables(theme);
    markThemeSwitching();
    root.setAttribute("data-gptskins-theme", theme.id);
    startPageMarkerObserver();
    syncPageMarker({ full: needsFullSurfaceSync, checkPlan: true });
    restoreScrollPosition(restoreScroll);
  }

  function applyFonts(selections) {
    selectedFonts = normalizeFontSelections(selections);
    const allDefault = Object.values(selectedFonts).every((fontId) => fontId === "default");
    if (shouldBypassThemeForUrl() || allDefault) {
      if (root.hasAttribute("data-gptskins-font")) {
        removeFont();
      }
      return;
    }

    const signature = themeApi.getFontSelectionSignature(selectedFonts);
    if (root.hasAttribute("data-gptskins-font") && root.getAttribute("data-gptskins-font-signature") === signature) {
      return;
    }

    applyFontVariables(selectedFonts);
    root.setAttribute("data-gptskins-font", "true");
    root.setAttribute("data-gptskins-font-signature", signature);
  }

  function scheduleRouteThemeSync() {
    clearTimeout(routeThemeTimer);
    routeThemeTimer = setTimeout(() => {
      applySelectedTheme({ forceSurfaceSync: true });
      applyFonts(selectedFonts);
    }, 80);
  }

  function startRouteThemeObserver() {
    if (routeThemeObserverStarted) {
      return;
    }
    routeThemeObserverStarted = true;

    const notifyRouteChange = (nextRoute = location.href) => {
      const previousRoute = lastThemeRoute;
      lastThemeRoute = nextRoute;
      scheduleRouteThemeSync();
      if (lastThemeRoute !== previousRoute) {
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
      if (location.href === lastThemeRoute) {
        return;
      }
      notifyCurrentRouteChange();
    }, 500);
  }

  const surfaceMutationSelector = [
    "pre",
    ".cm-editor",
    ".cm-scroller",
    "[data-testid*='code']",
    "[class*='group/code']",
    "nav",
    "aside",
    "[data-testid='history-panel']",
    "[data-testid='left-sidebar']"
  ].join(", ");
  const planControlTags = [
    "data-gptskins-plan-toggle",
    "data-gptskins-plan-toggle-option",
    "data-gptskins-plan-active",
    "data-gptskins-plan-cta",
    "data-gptskins-plan-disabled"
  ];
  const pendingSurfaceRoots = new Set();
  const pendingDeferredCodeRoots = new Set();
  const pendingOverflowBodies = new Set();
  let pageMarkerTimer = 0;
  let pageMarkerObserver = null;
  let bodyReadyObserver = null;
  let planControlEventListenersAdded = false;
  let pendingFullSurfaceSync = false;
  let pendingPlanCheck = false;
  let pendingDeferredCodeFullScan = false;
  let overflowFrame = 0;
  let deferredCodeSurfaceTimer = 0;

  function queryWithin(scope, selector) {
    if (!scope || typeof scope.querySelectorAll !== "function") {
      return [];
    }

    const matches = scope instanceof Element && scope.matches(selector) ? [scope] : [];
    matches.push(...scope.querySelectorAll(selector));
    return matches;
  }

  function normalizedText(item) {
    return (item.textContent || "").replace(/\s+/g, " ").trim();
  }

  function hasPlanSignals(scope = document) {
    const headings = queryWithin(scope, "h1, h2, h3, h4");
    const hasPlanHeading = headings.some((item) => normalizedText(item).includes("Choose your plan"));
    if (!hasPlanHeading) {
      return false;
    }

    const actions = queryWithin(scope, "button, a, [role='button'], [role='radio']");
    const hasPlanAction = actions.some((item) =>
      /(?:Switch to Plus|Upgrade to Pro|ChatGPT Enterprise|Manage my subscription)/.test(normalizedText(item))
    );
    const hasPlanToggle = Boolean(
      document.querySelector('[aria-label*="Personal" i], [aria-label*="Business" i], [aria-label*="plan" i] [role="radio"]')
    );
    return hasPlanAction || hasPlanToggle;
  }

  function isPlanPage() {
    return location.hash === "#pricing" || hasPlanSignals(document);
  }

  function isFinancePage() {
    return location.hostname === "chatgpt.com" && normalizePath(location.pathname) === "/finances";
  }

  function clearTags(names) {
    document.querySelectorAll(names.map((name) => `[${name}]`).join(", ")).forEach((item) => {
      names.forEach((name) => item.removeAttribute(name));
    });
  }

  function clearTagsWithin(scope, names) {
    if (!scope) {
      return;
    }

    const selector = names.map((name) => `[${name}]`).join(", ");
    queryWithin(scope, selector).forEach((item) => {
      names.forEach((name) => item.removeAttribute(name));
    });
  }

  function clearSurfaceTags() {
    clearTags([...codeSurfaceTags, ...dynamicSurfaceTags]);
  }

  function setTag(item, name, value = "true") {
    if (item && item.getAttribute(name) !== value) {
      item.setAttribute(name, value);
    }
  }

  function scheduleOverflowChecks() {
    if (overflowFrame) {
      return;
    }

    overflowFrame = requestAnimationFrame(() => {
      overflowFrame = 0;
      const results = [];
      pendingOverflowBodies.forEach((item) => {
        if (!item.isConnected) {
          return;
        }
        const scrollTargets = [item, ...item.querySelectorAll(".cm-scroller, .cm-content, pre, code")];
        results.push([item, scrollTargets.some((target) => target.scrollWidth > target.clientWidth + 2)]);
      });
      pendingOverflowBodies.clear();
      results.forEach(([item, hasHorizontalOverflow]) => {
        if (hasHorizontalOverflow) {
          setTag(item, "data-gptskins-code-scrollable");
        } else {
          item.removeAttribute("data-gptskins-code-scrollable");
        }
      });
    });
  }

  function tagCodeBody(item) {
    if (!item) {
      return;
    }

    setTag(item, "data-gptskins-code-body");
    pendingOverflowBodies.add(item);
    scheduleOverflowChecks();
  }

  function tagSidebarActions(scope = document) {
    const sidebarActions = queryWithin(
      scope,
      "nav a, nav button, aside a, aside button, [data-testid='history-panel'] a, [data-testid='history-panel'] button, [data-testid='left-sidebar'] a, [data-testid='left-sidebar'] button"
    );

    sidebarActions.forEach((item) => {
      const text = normalizedText(item);
      const lowerText = text.toLowerCase();
      const href = item.getAttribute("href") || "";
      const isLibrary = item.matches("a") && (lowerText.startsWith("library") || /\/library(?:[/?#]|$)/.test(href));
      const isSearchChats = item.matches("button") && lowerText.startsWith("search chats");

      if (isLibrary) {
        setTag(item, "data-gptskins-sidebar-action", "library");
      } else if (isSearchChats) {
        setTag(item, "data-gptskins-sidebar-action", "search");
      }
    });
  }

  function tagPlanControls() {
    const planControlSelector = "button, [role='button'], [role='tab'], [role='radio']";
    const interactiveItems = Array.from(document.querySelectorAll(planControlSelector));
    const toggleSets = [
      { labels: ["5x", "20x"], fallbackActive: (text) => (/\$\s*200\b/.test(text) ? "20x" : "") },
      {
        labels: ["Personal", "Business"],
        fallbackActive: (_text, planCard) =>
          Array.from(planCard.querySelectorAll("h1, h2, h3, h4")).some((heading) => normalizedText(heading) === "Business") ? "Business" : "Personal"
      }
    ];
    const toggleOptions = interactiveItems.filter((item) =>
      item.matches("[role='radio']") || toggleSets.some((set) => set.labels.some((label) => normalizedText(item).toLowerCase() === label.toLowerCase()))
    );
    const toggleGroups = new Set();

    toggleOptions.forEach((item) => {
      item.setAttribute("data-gptskins-plan-toggle-option", "true");

      const selected =
        item.matches('[aria-pressed="true"], [aria-selected="true"], [aria-checked="true"], [data-state="active"], [data-state="checked"], [data-selected="true"], [data-active="true"]') ||
        /\b(active|selected|checked)\b/i.test(typeof item.className === "string" ? item.className : "");

      if (selected) {
        item.setAttribute("data-gptskins-plan-active", "true");
      }

      const radioGroup = item.matches("[role='radio']") ? item.closest("[role='radiogroup'], [role='group']") : null;
      if (radioGroup && radioGroup.querySelectorAll("[role='radio']").length > 1) {
        toggleGroups.add(radioGroup);
        return;
      }

      for (let node = item.parentElement, depth = 0; node && depth < 4; node = node.parentElement, depth += 1) {
        const optionLabels = Array.from(node.querySelectorAll(planControlSelector)).map((button) => normalizedText(button));
        const lowerOptionLabels = optionLabels.map((label) => label.toLowerCase());
        if (toggleSets.some((set) => set.labels.every((label) => lowerOptionLabels.includes(label.toLowerCase())))) {
          toggleGroups.add(node);
          break;
        }
      }
    });

    toggleGroups.forEach((group) => {
      group.setAttribute("data-gptskins-plan-toggle", "true");
      const options = Array.from(group.querySelectorAll("[data-gptskins-plan-toggle-option]"));
      const hasSelectedOption = options.some((item) => item.hasAttribute("data-gptskins-plan-active"));
      if (!hasSelectedOption) {
        const optionLabels = options.map((item) => normalizedText(item));
        const lowerOptionLabels = optionLabels.map((label) => label.toLowerCase());
        const toggleSet = toggleSets.find((set) => set.labels.every((label) => lowerOptionLabels.includes(label.toLowerCase())));
        let planCard = document.body;
        for (let node = group.parentElement, depth = 0; node && depth < 8; node = node.parentElement, depth += 1) {
          const nodeText = normalizedText(node);
          const lowerNodeText = nodeText.toLowerCase();
          if (toggleSet && toggleSet.labels.every((label) => lowerNodeText.includes(label.toLowerCase())) && (/\$\s*\d/.test(nodeText) || lowerNodeText.includes("choose your plan"))) {
            planCard = node;
            break;
          }
        }
        const planText = normalizedText(planCard);
        const activeLabel = toggleSet ? toggleSet.fallbackActive(planText, planCard) : "";
        options.forEach((item) => {
          if (activeLabel && normalizedText(item) === activeLabel) {
            item.setAttribute("data-gptskins-plan-active", "true");
          }
        });
      }
    });

    interactiveItems.forEach((item) => {
      const text = normalizedText(item);
      const rect = item.getBoundingClientRect();
      const isWideAction = !item.hasAttribute("data-gptskins-plan-toggle-option") && rect.width >= 160 && rect.height >= 32;
      if ((!/^(Upgrade to|Switch to|Get|Continue|Start)/i.test(text) && !isWideAction) || /^(5x|20x)$/i.test(text)) {
        return;
      }

      item.setAttribute("data-gptskins-plan-cta", "true");

      const className = typeof item.className === "string" ? item.className : "";
      const disabled =
        item.matches(":disabled, [disabled], [aria-disabled='true'], [data-disabled='true']") ||
        /\b(disabled|cursor-not-allowed|opacity-\d+)\b/i.test(className);

      if (disabled) {
        item.setAttribute("data-gptskins-plan-disabled", "true");
      }
    });
  }

  function clearCodeTagsForPre(pre) {
    let cleanupScope = pre.closest("[data-gptskins-code-block], [data-gptskins-code-frame]") || pre;
    if (cleanupScope.parentElement?.hasAttribute("data-gptskins-code-frame")) {
      cleanupScope = cleanupScope.parentElement;
    }
    clearTagsWithin(cleanupScope, codeSurfaceTags);
  }

  function tagCodePre(pre) {
    if (!pre.isConnected || pre.closest(".cm-editor, .cm-scroller")) {
      return;
    }

    clearCodeTagsForPre(pre);
    const embeddedBlock = pre.firstElementChild;
    const embeddedClass = embeddedBlock ? embeddedBlock.getAttribute("class") || "" : "";
    const preClass = pre.getAttribute("class") || "";
    const nestedRoundedBlock =
      /(?:^|\s)(overflow-visible!?|px-0!?)(?:\s|$)/.test(preClass) &&
      pre.querySelector("[class*='border-token-border-light'][class*='rounded'], [class*='overflow-clip'][class*='rounded']");
    if (nestedRoundedBlock) {
      const paintedBlock =
        nestedRoundedBlock.firstElementChild && /(bg-token-bg-elevated-secondary|overflow-clip|rounded)/.test(nestedRoundedBlock.firstElementChild.getAttribute("class") || "")
          ? nestedRoundedBlock.firstElementChild
          : nestedRoundedBlock;
      const children = Array.from(paintedBlock.children);
      const header = children.find((child) => /(^|\s)(select-none|sticky)(\s|$)/.test(child.getAttribute("class") || ""));
      const body = children.find(
        (child) =>
          child !== header &&
          (child.querySelector("pre, code, .cm-editor, .cm-scroller") || /(^|\s)(relative|overflow|pe-11|pt-3)(\s|$)/.test(child.getAttribute("class") || ""))
      );

      setTag(pre, "data-gptskins-code-frame");
      setTag(nestedRoundedBlock, "data-gptskins-code-block");
      if (header && !header.matches("h1, h2, h3, h4, h5, h6, p, hr")) {
        setTag(header, "data-gptskins-code-header");
      }
      tagCodeBody(body);
      return;
    }

    if (embeddedBlock && /(contain-inline-size|group\/code|rounded)/.test(embeddedClass)) {
      setTag(pre, "data-gptskins-code-frame");
      setTag(embeddedBlock, "data-gptskins-code-block");

      const header = embeddedBlock.firstElementChild;
      if (header && !header.matches("h1, h2, h3, h4, h5, h6, p, hr")) {
        setTag(header, "data-gptskins-code-header");
      }

      const body = Array.from(embeddedBlock.children).find((child) => /(^|\s)(relative|overflow)/.test(child.getAttribute("class") || ""));
      tagCodeBody(body);
      return;
    }

    const isMessageMarkdownContainer = (item) => item && item.matches(".markdown, [class*='markdown-new-styling']");
    let block =
      pre.closest("[data-testid*='code'], [class*='group/code'], [class*='not-prose'], [class*='overflow-hidden'], [class*='contain-inline-size']") ||
      (isMessageMarkdownContainer(pre.parentElement) ? null : pre.parentElement);

    for (let candidate = pre.parentElement; candidate && !candidate.matches("[data-message-author-role]"); candidate = candidate.parentElement) {
      const first = candidate.firstElementChild;
      if (!isMessageMarkdownContainer(candidate) && first && !first.contains(pre) && (first.querySelector("button, svg") || first.textContent.trim().length < 120)) {
        block = candidate;
        break;
      }
    }

    if (!block || block.matches("[data-message-author-role]")) {
      return;
    }

    setTag(block, "data-gptskins-code-block");
    const frame = block.parentElement;
    const frameClass = frame ? frame.getAttribute("class") || "" : "";
    if (frame && !frame.matches("[data-message-author-role]") && /(bg-|border|rounded|ring|shadow|overflow)/.test(frameClass)) {
      setTag(frame, "data-gptskins-code-frame");
    }

    tagCodeBody(pre);
    if (pre.parentElement && pre.parentElement !== block) {
      setTag(pre.parentElement, "data-gptskins-code-body-shell");
    }

    const header = pre.previousElementSibling || block.firstElementChild;
    if (header && header !== pre && !header.contains(pre) && !header.matches("h1, h2, h3, h4, h5, h6, p, hr")) {
      setTag(header, "data-gptskins-code-header");
    }
  }

  function getCodeCandidates(scope) {
    const candidates = new Set(queryWithin(scope, "[data-message-author-role] pre"));
    if (scope instanceof Element) {
      const closestPre = scope.closest("[data-message-author-role] pre");
      if (closestPre) {
        candidates.add(closestPre);
      }
    }

    Array.from(candidates).forEach((pre) => {
      const codeMirrorRoot = pre.closest(".cm-editor, .cm-scroller");
      const outerPre = codeMirrorRoot?.closest("[data-message-author-role] pre");
      if (outerPre && outerPre !== pre) {
        candidates.add(outerPre);
      }
    });
    return candidates;
  }

  function codeSurfaceNeedsReconcile(pre) {
    if (!pre.isConnected || pre.closest(".cm-editor, .cm-scroller") || !pre.querySelector(".cm-editor, .cm-scroller")) {
      return false;
    }

    return (
      !pre.hasAttribute("data-gptskins-code-frame") ||
      !pre.querySelector("[data-gptskins-code-block]") ||
      !pre.querySelector("[data-gptskins-code-header]") ||
      !pre.querySelector("[data-gptskins-code-body]")
    );
  }

  function reconcileDeferredCodeSurfaces() {
    deferredCodeSurfaceTimer = 0;
    const scopes = pendingDeferredCodeFullScan ? [document] : Array.from(pendingDeferredCodeRoots);
    pendingDeferredCodeRoots.clear();
    pendingDeferredCodeFullScan = false;
    if (!root.hasAttribute("data-gptskins-theme")) {
      return;
    }

    const candidates = new Set();
    scopes.forEach((scope) => getCodeCandidates(scope).forEach((pre) => candidates.add(pre)));
    candidates.forEach((pre) => {
      if (codeSurfaceNeedsReconcile(pre)) {
        tagCodePre(pre);
      }
    });
  }

  function addPendingDeferredCodeRoot(scope) {
    if (scope === document) {
      pendingDeferredCodeFullScan = true;
      pendingDeferredCodeRoots.clear();
      return;
    }
    if (!(scope instanceof Element) || !scope.isConnected || pendingDeferredCodeFullScan) {
      return;
    }
    for (const existing of pendingDeferredCodeRoots) {
      if (existing.contains(scope)) {
        return;
      }
      if (scope.contains(existing)) {
        pendingDeferredCodeRoots.delete(existing);
      }
    }
    pendingDeferredCodeRoots.add(scope);
  }

  function scheduleDeferredCodeSurfaceReconcile(scopes = [document]) {
    scopes.forEach(addPendingDeferredCodeRoot);
    clearTimeout(deferredCodeSurfaceTimer);
    deferredCodeSurfaceTimer = setTimeout(reconcileDeferredCodeSurfaces, 600);
  }

  function nodeMatchesOrContains(scope, selector) {
    return Boolean(scope && (scope.matches?.(selector) || scope.querySelector?.(selector)));
  }

  function syncSurfaceRoot(scope) {
    if (!scope?.isConnected) {
      return;
    }

    queryWithin(scope, ":is(h1, h2, h3, h4, h5, h6, p, hr)[data-gptskins-code-header]").forEach((item) => {
      item.removeAttribute("data-gptskins-code-header");
    });
    if (nodeMatchesOrContains(scope, "pre, .cm-editor, .cm-scroller, [data-testid*='code'], [class*='group/code']")) {
      getCodeCandidates(scope).forEach(tagCodePre);
    }
    if (nodeMatchesOrContains(scope, "nav, aside, [data-testid='history-panel'], [data-testid='left-sidebar']")) {
      tagSidebarActions(scope);
    }
  }

  function syncSurfaceTags(planPage, { full = false, roots = [], syncPlan = false } = {}) {
    if (!root.hasAttribute("data-gptskins-theme")) {
      return;
    }

    if (full) {
      document.querySelectorAll(":is(h1, h2, h3, h4, h5, h6, p, hr)[data-gptskins-code-header]").forEach((item) => {
        item.removeAttribute("data-gptskins-code-header");
      });
      clearTags([...codeSurfaceTags, ...dynamicSurfaceTags]);
      tagSidebarActions(document);
      getCodeCandidates(document).forEach(tagCodePre);
    } else {
      roots.forEach(syncSurfaceRoot);
    }

    if (syncPlan) {
      clearTags(planControlTags);
      if (planPage) {
        tagPlanControls();
      }
    }
  }

  function addPendingSurfaceRoot(node) {
    const item = node instanceof Element ? node : node?.parentElement;
    if (!item?.isConnected) {
      return;
    }

    for (const existing of pendingSurfaceRoots) {
      if (existing.contains(item)) {
        return;
      }
      if (item.contains(existing)) {
        pendingSurfaceRoots.delete(existing);
      }
    }
    pendingSurfaceRoots.add(item);
  }

  function collectRelevantSurfaceRoot(node) {
    const item = node instanceof Element ? node : node?.parentElement;
    if (!item?.isConnected) {
      return;
    }

    const closest = item.closest(surfaceMutationSelector);
    if (closest) {
      addPendingSurfaceRoot(closest);
    }
    if (item.matches(surfaceMutationSelector) || item.querySelector(surfaceMutationSelector)) {
      addPendingSurfaceRoot(item);
    }
  }

  function containsPlanMarker(node) {
    if (!(node instanceof Element)) {
      return false;
    }
    const candidates = queryWithin(node, "h1, h2, h3, h4, button, a, [role='button'], [role='radio']");
    return candidates.some((candidate) =>
      /(?:Choose your plan|Switch to Plus|Upgrade to Pro|ChatGPT Enterprise|Manage my subscription|^5x$|^20x$)/.test(normalizedText(candidate))
    );
  }

  function handlePageMutations(records) {
    let checkPlan = location.hash === "#pricing";
    const deferredCodeRoots = [];
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) {
          return;
        }
        collectRelevantSurfaceRoot(node);
        if (
          nodeMatchesOrContains(node, "pre, .cm-editor, .cm-scroller, [data-testid*='code'], [class*='group/code']") ||
          node.closest("pre, .cm-editor, .cm-scroller, [data-testid*='code'], [class*='group/code']")
        ) {
          deferredCodeRoots.push(node);
        }
        checkPlan ||= !node.closest("[data-message-author-role]") && containsPlanMarker(node);
      });
      record.removedNodes.forEach((node) => {
        checkPlan ||= node instanceof Element && !node.closest("[data-message-author-role]") && containsPlanMarker(node);
      });
    });

    if (pendingSurfaceRoots.size || checkPlan) {
      schedulePageMarker({ checkPlan });
    }
    if (deferredCodeRoots.length) {
      scheduleDeferredCodeSurfaceReconcile(deferredCodeRoots);
    }
  }

  function syncPageMarker({ full = false, checkPlan = false, roots = [] } = {}) {
    if (!root.hasAttribute("data-gptskins-theme")) {
      return;
    }

    const wasPlanPage = root.hasAttribute("data-gptskins-plan-page");
    const planPage = full || checkPlan || wasPlanPage ? isPlanPage() : false;
    if (planPage) {
      setTag(root, "data-gptskins-plan-page");
    } else {
      root.removeAttribute("data-gptskins-plan-page");
    }
    if (isFinancePage()) {
      setTag(root, "data-gptskins-finance-page");
    } else {
      root.removeAttribute("data-gptskins-finance-page");
    }

    syncSurfaceTags(planPage, {
      full,
      roots,
      syncPlan: full || checkPlan || wasPlanPage !== planPage
    });
    if (full) {
      scheduleDeferredCodeSurfaceReconcile();
    }
  }

  function schedulePageMarker({ full = false, checkPlan = false, roots = [] } = {}) {
    pendingFullSurfaceSync ||= full;
    pendingPlanCheck ||= checkPlan;
    roots.forEach(addPendingSurfaceRoot);
    clearTimeout(pageMarkerTimer);
    pageMarkerTimer = setTimeout(() => {
      pageMarkerTimer = 0;
      const scheduledRoots = Array.from(pendingSurfaceRoots);
      const scheduledFull = pendingFullSurfaceSync;
      const scheduledPlanCheck = pendingPlanCheck;
      pendingSurfaceRoots.clear();
      pendingFullSurfaceSync = false;
      pendingPlanCheck = false;
      syncPageMarker({ full: scheduledFull, checkPlan: scheduledPlanCheck, roots: scheduledRoots });
    }, full ? 0 : 60);
  }

  function schedulePlanControlSync(event) {
    if (!root.hasAttribute("data-gptskins-plan-page") || !(event.target instanceof Element)) {
      return;
    }
    if (event.target.closest("button, [role='button'], [role='tab'], [role='radio']")) {
      schedulePageMarker({ checkPlan: true });
    }
  }

  function ensurePlanControlEventListeners() {
    if (planControlEventListenersAdded) {
      return;
    }
    planControlEventListenersAdded = true;
    document.addEventListener("click", schedulePlanControlSync, true);
    document.addEventListener("change", schedulePlanControlSync, true);
  }

  function startPageMarkerObserver() {
    ensurePlanControlEventListeners();
    if (pageMarkerObserver) {
      return;
    }

    if (document.body) {
      const waitedForBody = Boolean(bodyReadyObserver);
      pageMarkerObserver = new MutationObserver(handlePageMutations);
      pageMarkerObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
      if (bodyReadyObserver) {
        bodyReadyObserver.disconnect();
        bodyReadyObserver = null;
      }
      if (waitedForBody) {
        schedulePageMarker({ full: true, checkPlan: true });
      }
      return;
    }

    if (!bodyReadyObserver && document.documentElement) {
      bodyReadyObserver = new MutationObserver(startPageMarkerObserver);
      bodyReadyObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  function stopPageMarkerObserver() {
    clearTimeout(pageMarkerTimer);
    pageMarkerTimer = 0;
    clearTimeout(deferredCodeSurfaceTimer);
    deferredCodeSurfaceTimer = 0;
    pendingSurfaceRoots.clear();
    pendingDeferredCodeRoots.clear();
    pendingOverflowBodies.clear();
    pendingFullSurfaceSync = false;
    pendingPlanCheck = false;
    pendingDeferredCodeFullScan = false;
    if (overflowFrame) {
      cancelAnimationFrame(overflowFrame);
      overflowFrame = 0;
    }
    if (pageMarkerObserver) {
      pageMarkerObserver.disconnect();
      pageMarkerObserver = null;
    }
    if (bodyReadyObserver) {
      bodyReadyObserver.disconnect();
      bodyReadyObserver = null;
    }
    if (planControlEventListenersAdded) {
      document.removeEventListener("click", schedulePlanControlSync, true);
      document.removeEventListener("change", schedulePlanControlSync, true);
      planControlEventListenersAdded = false;
    }
  }

  function loadStoredSettings() {
    const fontStorageKeys = Object.values(themeApi.fontStorageKeys);
    chrome.storage.sync.get(
      [
        themeApi.storageKey,
        themeApi.themeStorageKeys.dark,
        themeApi.themeStorageKeys.light,
        themeApi.legacyFontStorageKey,
        ...fontStorageKeys
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

        applySelectedTheme({ forceSurfaceSync: true });
        applyFonts(selectedFonts);
      }
    );
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === "GPTSKINS_APPLY_THEME") {
      if (message.themeMode) {
        setThemeSelection(message.themeMode, message.themeId);
      } else {
        const theme = themeApi.getTheme(message.themeId);
        const mode = theme.dark ? "dark" : "light";
        setThemeSelection(mode, theme.id);
      }
    }
    if (message && message.type === "GPTSKINS_APPLY_FONTS") {
      applyFonts(message.fonts);
    }
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync") {
      let themeChanged = false;
      for (const mode of ["dark", "light"]) {
        const storageKey = themeApi.themeStorageKeys[mode];
        if (changes[storageKey]) {
          selectedThemeIds[mode] = themeApi.getThemeForMode(changes[storageKey].newValue, mode).id;
          themeChanged = true;
        }
      }
      if (themeChanged) {
        applySelectedTheme();
      }
      let fontChanged = false;
      themeApi.fontRoles.forEach((role) => {
        const storageKey = themeApi.fontStorageKeys[role.id];
        if (changes[storageKey]) {
          selectedFonts[role.id] = themeApi.getFontOption(role.id, changes[storageKey].newValue).id;
          fontChanged = true;
        }
      });
      if (fontChanged) {
        applyFonts(selectedFonts);
      }
    }
  });

  if (typeof systemThemeMedia.addEventListener === "function") {
    systemThemeMedia.addEventListener("change", applySelectedTheme);
  } else {
    systemThemeMedia.addListener(applySelectedTheme);
  }

  startRouteThemeObserver();

  loadStoredSettings();
})();
