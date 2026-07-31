(function () {
  "use strict";

  const themeApi = globalThis.GPTskinsThemes;
  const themeStyleId = "gptskins-style";
  const fontStyleId = "gptskins-font-style";
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
    "data-gptskins-suggestion-layer",
    "data-gptskins-sidebar-action",
    "data-gptskins-scroll-button",
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
  let selectedFontId = "default";
  let routeThemeTimer = 0;
  let routeThemeObserverStarted = false;
  let lastThemeRoute = location.href;
  let themeSwitchTimer = 0;

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

  function cssVariables(theme) {
    return Object.entries(theme.colors)
      .filter((entry) => entry[1])
      .map(([key, value]) => `--gptskins-${key}: ${value};`)
      .join("\n");
  }

  function removeTheme() {
    clearTimeout(themeSwitchTimer);
    stopPageMarkerObserver();
    root.removeAttribute("data-gptskins-switching");
    root.removeAttribute("data-gptskins-theme");
    root.removeAttribute("data-gptskins-plan-page");
    root.removeAttribute("data-gptskins-finance-page");
    clearSurfaceTags();
    const existingStyle = document.getElementById(themeStyleId);
    if (existingStyle) {
      existingStyle.remove();
    }
  }

  function removeFont() {
    root.removeAttribute("data-gptskins-font");
    const existingStyle = document.getElementById(fontStyleId);
    if (existingStyle) {
      existingStyle.remove();
    }
  }

  function ensureThemeStyle(theme) {
    let style = document.getElementById(themeStyleId);
    if (!style) {
      style = document.createElement("style");
      style.id = themeStyleId;
      document.documentElement.appendChild(style);
    }

    style.textContent = `
html[data-gptskins-theme] {
${cssVariables(theme)}
  --main-surface-primary: var(--gptskins-background) !important;
  --main-surface-secondary: var(--gptskins-surface) !important;
  --main-surface-tertiary: var(--gptskins-surfaceStrong) !important;
  --surface-primary: var(--gptskins-surface) !important;
  --surface-secondary: var(--gptskins-surfaceStrong) !important;
  --surface-tertiary: var(--gptskins-surfaceStrong) !important;
  --bg-primary: var(--gptskins-surface) !important;
  --bg-secondary: var(--gptskins-surfaceStrong) !important;
  --bg-tertiary: var(--gptskins-surfaceStrong) !important;
  --sidebar-surface-primary: var(--gptskins-sidebar) !important;
  --sidebar-surface-secondary: var(--gptskins-sidebarHover) !important;
  --sidebar-surface-tertiary: var(--gptskins-sidebarHover) !important;
  --message-surface: var(--gptskins-assistantBubble) !important;
  --surface-hover: var(--gptskins-surfaceStrong) !important;
  --composer-surface: var(--gptskins-composer) !important;
  --composer-surface-primary: var(--gptskins-composer) !important;
  --composer-surface-secondary: var(--gptskins-surfaceStrong) !important;
  --gptskins-menuHover: color-mix(in srgb, var(--gptskins-text) 12%, var(--gptskins-composer)) !important;
  --code-block-bg: var(--gptskins-surfaceStrong) !important;
  --code-block-header: var(--code-block-bg) !important;
  --code-block-border: var(--gptskins-border) !important;
  --code-block-radius: 24px;
  --text-primary: var(--gptskins-text) !important;
  --text-secondary: var(--gptskins-mutedText) !important;
  --text-tertiary: var(--gptskins-mutedText) !important;
  --border-light: var(--gptskins-border) !important;
  --border-medium: var(--gptskins-border) !important;
  --border-heavy: var(--gptskins-border) !important;
  --sharp-edge-bottom-shadow: none !important;
  color-scheme: ${themeApi.darkThemeIds.has(theme.id) ? "dark" : "light"};
}

html[data-gptskins-theme]::selection,
html[data-gptskins-theme] *::selection {
  background-color: var(--theme-user-selection-bg, var(--gptskins-accent)) !important;
}

html[data-gptskins-switching],
html[data-gptskins-switching] *,
html[data-gptskins-switching] *::before,
html[data-gptskins-switching] *::after {
  transition: none !important;
  transition-delay: 0s !important;
  transition-duration: 0s !important;
  animation: none !important;
}

html[data-gptskins-theme],
html[data-gptskins-theme] body,
html[data-gptskins-theme] #root,
html[data-gptskins-theme] main,
html[data-gptskins-theme] [role="main"] {
  background: var(--gptskins-background) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [class*="bg-token-main-surface-primary"],
html[data-gptskins-theme] [class*="bg-token-main-surface-secondary"],
html[data-gptskins-theme] [class*="bg-token-main-surface-tertiary"],
html[data-gptskins-theme] [class*="bg-token-message-surface"] {
  background-color: var(--gptskins-surface) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [class*="shadow-[0_0_8px_8px_var(--main-surface-primary)]"] {
  --main-surface-primary: var(--gptskins-background) !important;
}

html[data-gptskins-theme] [data-testid="stage-thread-flyout"] {
  --main-surface-primary: var(--gptskins-surface) !important;
  --main-surface-secondary: var(--gptskins-surface) !important;
  --main-surface-tertiary: var(--gptskins-surfaceStrong) !important;
  --surface-primary: var(--gptskins-surface) !important;
  --surface-secondary: var(--gptskins-surfaceStrong) !important;
  --surface-tertiary: var(--gptskins-surfaceStrong) !important;
  --bg-primary: var(--gptskins-surface) !important;
  --bg-secondary: var(--gptskins-surfaceStrong) !important;
  --bg-tertiary: var(--gptskins-surfaceStrong) !important;
  background: var(--gptskins-surface) !important;
  background-color: var(--gptskins-surface) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [data-testid="stage-thread-flyout"] :is([class*="bg-surface-primary"], [class*="bg-token-main-surface-primary"], [class*="bg-token-bg-primary"], [class*="bg-[var(--main-surface-primary)]"]) {
  background: var(--gptskins-surface) !important;
  background-color: var(--gptskins-surface) !important;
  background-image: none !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] header[class*="bg-token-main-surface-primary"],
html[data-gptskins-theme] header[class*="dark:bg-token-bg-secondary-surface"] {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
}

html[data-gptskins-theme] #page-header [class*="pointer-events-none"] > .translucent-surface {
  --main-surface-primary: var(--gptskins-background) !important;
}

html[data-gptskins-theme] #conversation-header-actions {
  background: var(--gptskins-background) !important;
  background-color: var(--gptskins-background) !important;
  background-image: none !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [class*="thread-bottom-container"]:has(:is(form[class*="composer"], [data-testid="composer"], [class*="group/composer"], [class*="composer"])) {
  background: linear-gradient(
    to bottom,
    transparent 0,
    var(--gptskins-background) 34%,
    var(--gptskins-background) 100%
  ) !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] [class*="thread-bottom-container"]:has(:is(form[class*="composer"], [data-testid="composer"], [class*="group/composer"], [class*="composer"]))::before,
html[data-gptskins-theme] [class*="thread-bottom-container"]:has(:is(form[class*="composer"], [data-testid="composer"], [class*="group/composer"], [class*="composer"]))::after {
  background: transparent !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] [class*="thread-bottom-container"]::before,
html[data-gptskins-theme] [class*="thread-bottom-container"]::after {
  background: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}

html[data-gptskins-theme][data-gptskins-plan-page="true"] [class*="thread-bottom-container"] {
  background: var(--gptskins-surface) !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

html[data-gptskins-theme][data-gptskins-plan-page="true"] [class*="thread-bottom-container"]::before,
html[data-gptskins-theme][data-gptskins-plan-page="true"] [class*="thread-bottom-container"]::after {
  background: transparent !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

html[data-gptskins-theme][data-gptskins-plan-page="true"] {
  --bg-primary: var(--gptskins-surface) !important;
  --bg-elevated-secondary: var(--gptskins-surface) !important;
}

html[data-gptskins-theme][data-gptskins-plan-page="true"] :is([class*="bg-token-bg-primary"], [class*="bg-token-bg-elevated-secondary!"]) {
  background: var(--gptskins-surface) !important;
  background-color: var(--gptskins-surface) !important;
  background-image: none !important;
}

html[data-gptskins-theme] [class*="thread-bottom-container"]:has(:is(form[class*="composer"], [data-testid="composer"], [class*="group/composer"], [class*="composer"])) [class*="bg-black"],
html[data-gptskins-theme] [class*="thread-bottom-container"]:has(:is(form[class*="composer"], [data-testid="composer"], [class*="group/composer"], [class*="composer"])) [class*="from-black"],
html[data-gptskins-theme] [class*="thread-bottom-container"]:has(:is(form[class*="composer"], [data-testid="composer"], [class*="group/composer"], [class*="composer"])) [class*="to-black"],
html[data-gptskins-theme] [class*="thread-bottom-container"]:has(:is(form[class*="composer"], [data-testid="composer"], [class*="group/composer"], [class*="composer"])) [class*="dark:bg-black"],
html[data-gptskins-theme] [class*="thread-bottom-container"]:has(:is(form[class*="composer"], [data-testid="composer"], [class*="group/composer"], [class*="composer"])) [class*="dark:from-black"],
html[data-gptskins-theme] [class*="thread-bottom-container"]:has(:is(form[class*="composer"], [data-testid="composer"], [class*="group/composer"], [class*="composer"])) [class*="dark:to-black"] {
  background: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] nav,
html[data-gptskins-theme] aside,
html[data-gptskins-theme] [class*="bg-token-sidebar"],
html[data-gptskins-theme] [id*="sidebar"],
html[data-gptskins-theme] [data-testid="history-panel"],
html[data-gptskins-theme] [data-testid="left-sidebar"] {
  --text-primary: var(--gptskins-sidebarText) !important;
  --text-secondary: var(--gptskins-sidebarMuted) !important;
  --text-tertiary: var(--gptskins-sidebarMuted) !important;
  --surface-hover: var(--gptskins-sidebarHover) !important;
  background-color: var(--gptskins-sidebar) !important;
  color: var(--gptskins-sidebarText) !important;
}

html[data-gptskins-theme] nav :is(a, button, [role="button"], span, p, div, h1, h2, h3, h4, h5, h6),
html[data-gptskins-theme] aside :is(a, button, [role="button"], span, p, div, h1, h2, h3, h4, h5, h6),
html[data-gptskins-theme] [data-testid="history-panel"] :is(a, button, [role="button"], span, p, div, h1, h2, h3, h4, h5, h6),
html[data-gptskins-theme] [data-testid="left-sidebar"] :is(a, button, [role="button"], span, p, div, h1, h2, h3, h4, h5, h6) {
  color: inherit !important;
  opacity: 1 !important;
}

html[data-gptskins-theme] nav .text-token-text-secondary,
html[data-gptskins-theme] nav [class*="text-token-text-secondary"],
html[data-gptskins-theme] nav [class*="text-token-text-tertiary"],
html[data-gptskins-theme] aside .text-token-text-secondary,
html[data-gptskins-theme] aside [class*="text-token-text-secondary"],
html[data-gptskins-theme] aside [class*="text-token-text-tertiary"],
html[data-gptskins-theme] [data-testid="history-panel"] [class*="text-token-text-secondary"],
html[data-gptskins-theme] [data-testid="history-panel"] [class*="text-token-text-tertiary"],
html[data-gptskins-theme] [data-testid="left-sidebar"] [class*="text-token-text-secondary"],
html[data-gptskins-theme] [data-testid="left-sidebar"] [class*="text-token-text-tertiary"] {
  color: var(--gptskins-sidebarMuted) !important;
  opacity: 1 !important;
}

html[data-gptskins-theme] nav :is(a, button, [role="button"]):hover,
html[data-gptskins-theme] aside :is(a, button, [role="button"]):hover,
html[data-gptskins-theme] [data-testid="history-panel"] :is(a, button, [role="button"]):hover,
html[data-gptskins-theme] [data-testid="left-sidebar"] :is(a, button, [role="button"]):hover {
  background-color: var(--gptskins-sidebarHover) !important;
  color: var(--gptskins-sidebarText) !important;
}

html[data-gptskins-theme] [data-message-author-role="user"] {
  background: transparent !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [data-message-author-role="assistant"] {
  background: transparent !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [data-message-author-role] :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, strong, em),
html[data-gptskins-theme] [data-message-author-role] .markdown,
html[data-gptskins-theme] [data-message-author-role] [class*="text-token-text-primary"],
html[data-gptskins-theme] main [class*="text-token-text-primary"] {
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [data-message-author-role] :is(h1, h2, h3, h4, h5, h6) {
  scroll-margin-top: calc(var(--header-height, 52px) + 12px) !important;
}

html[data-gptskins-theme] [data-message-author-role] [class*="text-token-text-secondary"],
html[data-gptskins-theme] main [class*="text-token-text-secondary"],
html[data-gptskins-theme] main [class*="text-token-text-tertiary"] {
  color: var(--gptskins-mutedText) !important;
}

html[data-gptskins-theme] [data-message-author-role] table,
html[data-gptskins-theme] [data-message-author-role] :is(thead, tbody, tr, th, td) {
  border-color: color-mix(in srgb, var(--gptskins-border) 65%, var(--gptskins-text) 35%) !important;
  color: var(--gptskins-text) !important;
  opacity: 1 !important;
}

html[data-gptskins-theme] [data-message-author-role] table :is(th, td, span, div, p, strong) {
  color: var(--gptskins-text) !important;
  opacity: 1 !important;
}

html[data-gptskins-theme] [data-message-author-role] :is(div, section):has(table) :is(button, svg) {
  color: var(--gptskins-mutedText) !important;
  opacity: 1 !important;
  stroke: currentColor !important;
}

html[data-gptskins-theme] [data-message-author-role] .recharts-wrapper :is(.recharts-text, .recharts-label, .recharts-cartesian-axis-tick-value, text) {
  color: var(--gptskins-mutedText) !important;
  fill: var(--gptskins-mutedText) !important;
  opacity: 1 !important;
}

html[data-gptskins-theme] [data-message-author-role] .recharts-wrapper :is(.recharts-cartesian-grid line, .recharts-cartesian-axis-line, .recharts-cartesian-axis-tick-line) {
  opacity: 1 !important;
  stroke: color-mix(in srgb, var(--gptskins-border) 60%, var(--gptskins-text) 40%) !important;
}

html[data-gptskins-theme] textarea,
html[data-gptskins-theme] input,
html[data-gptskins-theme] [contenteditable="true"],
html[data-gptskins-theme] [data-testid="composer"] {
  background-color: var(--gptskins-composer) !important;
  color: var(--gptskins-text) !important;
  border-color: var(--gptskins-border) !important;
}

html[data-gptskins-theme] form[class*="composer"],
html[data-gptskins-theme] [class*="group/composer"] {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] form[class*="composer"] > [class*="bg-(--composer-surface-primary)"],
html[data-gptskins-theme] [class*="bg-(--composer-surface-primary)"],
html[data-gptskins-theme] [data-testid="composer"] {
  background-color: var(--gptskins-composer) !important;
  border: 1px solid var(--gptskins-border) !important;
  box-shadow: 0 10px 28px var(--gptskins-shadow) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] :is(form[class*="composer"], [class*="group/composer"], [data-testid="composer"]) :is(textarea, input, [contenteditable="true"], [class*="ProseMirror"]) {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] button[class*="composer"]:not([class*="composer-submit"]):not([data-testid*="send" i]):not([aria-label*="send" i]):not([aria-label*="submit" i]):not([aria-label*="voice" i]),
html[data-gptskins-theme] [class*="composer-btn"]:not([class*="composer-submit"]):not([data-testid*="send" i]):not([aria-label*="send" i]):not([aria-label*="submit" i]):not([aria-label*="voice" i]) {
  background-color: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] textarea::placeholder,
html[data-gptskins-theme] input::placeholder {
  color: var(--gptskins-mutedText) !important;
}

html[data-gptskins-theme] main :is(button, a, [role="button"]):not(.btn-primary):not([class*="composer-submit"]):not([data-testid*="send" i]):not([aria-label*="send" i]):not([aria-label*="submit" i]):not([aria-label*="voice" i]) {
  color: inherit !important;
}

html[data-gptskins-theme] main button[class*="btn-secondary"][class*="bg-token-bg-primary"][class*="backdrop-blur"][class*="rounded-full"],
html[data-gptskins-theme] main button[class*="shadow-short"][class*="backdrop-blur"][class*="rounded-full"],
html[data-gptskins-theme] :is(button, [role="button"]):is([aria-label*="scroll" i], [data-testid*="scroll" i])[class*="rounded-full"],
html[data-gptskins-theme] [data-gptskins-scroll-button] {
  background: color-mix(in srgb, var(--gptskins-surfaceStrong) 65%, transparent) !important;
  background-color: color-mix(in srgb, var(--gptskins-surfaceStrong) 65%, transparent) !important;
  background-image: none !important;
  border: 1px solid color-mix(in srgb, var(--gptskins-border) 72%, transparent) !important;
  box-shadow: 0 6px 18px color-mix(in srgb, var(--gptskins-shadow) 72%, transparent) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] :is(button, [role="button"]):is([aria-label*="scroll" i], [data-testid*="scroll" i])[class*="rounded-full"]::before,
html[data-gptskins-theme] :is(button, [role="button"]):is([aria-label*="scroll" i], [data-testid*="scroll" i])[class*="rounded-full"]::after,
html[data-gptskins-theme] :is(button, [role="button"]):is([aria-label*="scroll" i], [data-testid*="scroll" i])[class*="rounded-full"] > :is(div, span),
html[data-gptskins-theme] [data-gptskins-scroll-button]::before,
html[data-gptskins-theme] [data-gptskins-scroll-button]::after,
html[data-gptskins-theme] [data-gptskins-scroll-button] > :is(div, span) {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] [data-testid="artifacts-surface-top-controls"] {
  background: var(--gptskins-surface) !important;
  background-color: var(--gptskins-surface) !important;
  background-image: none !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] main:has(input[placeholder*="Search apps" i]) > :is(div, header)[class*="h-header-height"][class*="bg-surface-primary"] {
  background: var(--gptskins-background) !important;
  background-color: var(--gptskins-background) !important;
  background-image: none !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] main:has(input[aria-label="Search GPTs"], input[placeholder*="Search GPTs" i]) :is(div, section)[class*="bg-token-bg-primary"][class*="dark:bg-token-bg-secondary-surface"][class*="sticky"] {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
}

html[data-gptskins-theme] main:has(input[aria-label="Search GPTs"], input[placeholder*="Search GPTs" i]) input:is(#search, [aria-label="Search GPTs"], [placeholder*="Search GPTs" i]) {
  --main-surface-primary: var(--gptskins-surfaceStrong) !important;
  background: var(--gptskins-surfaceStrong) !important;
  background-color: var(--gptskins-surfaceStrong) !important;
  background-image: none !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [data-testid="mattress-onboarding-widget-cell"] button {
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [data-testid="mattress-onboarding-widget-cell"] button::before {
  background: var(--gptskins-surfaceStrong) !important;
  background-color: var(--gptskins-surfaceStrong) !important;
  background-image: none !important;
  border-color: var(--gptskins-border) !important;
}

html[data-gptskins-theme] [data-testid="mattress-onboarding-widget-cell"] button::after {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
}

html[data-gptskins-theme] :is(
  [data-testid="artifacts-surface-library-search-controls"] button[aria-haspopup="menu"],
  main :is(div, section):has(> :is(h1, h2)):has(input[placeholder*="Search projects" i], [aria-label*="Search projects" i]) > :is(div, form) button:not([aria-label]),
  [data-testid="create-gpt-discovery-button"],
  main:has(.pulse-card-body) button.btn
) {
  background: var(--gptskins-surfaceStrong) !important;
  background-color: var(--gptskins-surfaceStrong) !important;
  background-image: none !important;
  border-color: var(--gptskins-border) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] :is(
  [data-testid="artifacts-surface-library-search-controls"] button[aria-haspopup="menu"],
  main :is(div, section):has(> :is(h1, h2)):has(input[placeholder*="Search projects" i], [aria-label*="Search projects" i]) > :is(div, form) button:not([aria-label]),
  [data-testid="create-gpt-discovery-button"],
  main:has(.pulse-card-body) button.btn
):is(:hover, :focus-visible, [data-state="open"]) {
  background: var(--gptskins-surfaceStrong) !important;
  background-color: var(--gptskins-surfaceStrong) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] :is(
  [data-testid="artifacts-surface-library-search-controls"] button[aria-haspopup="menu"],
  main :is(div, section):has(> :is(h1, h2)):has(input[placeholder*="Search projects" i], [aria-label*="Search projects" i]) > :is(div, form) button:not([aria-label]),
  [data-testid="create-gpt-discovery-button"],
  main:has(.pulse-card-body) button.btn
) :is(span, div, svg) {
  color: inherit !important;
}

html[data-gptskins-theme] main .artifacts-surface-library-selectable-row:is(:hover, :focus-within, [data-state="open"]) {
  background: color-mix(in srgb, var(--gptskins-text) 7%, var(--gptskins-surface)) !important;
  background-color: color-mix(in srgb, var(--gptskins-text) 7%, var(--gptskins-surface)) !important;
  background-image: none !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] main .artifacts-surface-library-selectable-row::before {
  background: color-mix(in srgb, var(--gptskins-text) 7%, var(--gptskins-surface)) !important;
  background-color: color-mix(in srgb, var(--gptskins-text) 7%, var(--gptskins-surface)) !important;
  background-image: none !important;
}

html[data-gptskins-theme][data-gptskins-finance-page="true"] main {
  --main-surface-primary: var(--gptskins-background) !important;
  --main-surface-secondary: var(--gptskins-surface) !important;
  --main-surface-tertiary: var(--gptskins-surfaceStrong) !important;
  --text-primary: var(--gptskins-text) !important;
  --text-secondary: var(--gptskins-mutedText) !important;
  --text-tertiary: var(--gptskins-mutedText) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme][data-gptskins-finance-page="true"] main :is(h2, p, a):is([class*="text-[#000000]"], [class*="text-[#5d5d5d]"]) {
  color: var(--gptskins-text) !important;
  opacity: 1 !important;
}

html[data-gptskins-theme][data-gptskins-finance-page="true"] main :is(p, a):is([class*="text-[#5d5d5d]"]) {
  color: var(--gptskins-mutedText) !important;
}

html[data-gptskins-theme][data-gptskins-finance-page="true"] main button.btn {
  background: var(--gptskins-surfaceStrong) !important;
  background-color: var(--gptskins-surfaceStrong) !important;
  background-image: none !important;
  border: 1px solid var(--gptskins-border) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme][data-gptskins-finance-page="true"] main button.btn :is(div, span, svg) {
  color: inherit !important;
}

html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) :is([class*="sidebar-section-header"], button[aria-expanded], button[aria-controls], [role="button"][aria-expanded]):not([data-testid="accounts-profile-button"]):not([data-gptskins-sidebar-action]),
html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) :is(div, section):has(:is([class*="sidebar-section-header"], button[aria-expanded], button[aria-controls])) :is(button, [role="button"]):not([data-testid="accounts-profile-button"]):not([data-gptskins-sidebar-action]),
html[data-gptskins-theme] [class*="group-hover/sidebar-section-header"],
html[data-gptskins-theme] [class*="group-hover/sidebar-expand-section-header"],
html[data-gptskins-theme] [class*="group-hover/sidebar-expando-section-header"],
html[data-gptskins-theme] [class*="group/sidebar-expando-section-header"],
html[data-gptskins-theme] [data-trailing-button],
html[data-gptskins-theme] [class*="menu-item-trailing-btn"],
html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) :is(div, span):has(> [data-trailing-button]),
html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) [class*="group-hover/sidebar-section-header"],
html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) [class*="group-hover/sidebar-expando-section-header"],
html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) :is(a, button, [role="button"], div, span):has(> svg:only-child) {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] [data-trailing-button]::before,
html[data-gptskins-theme] [data-trailing-button]::after,
html[data-gptskins-theme] [class*="menu-item-trailing-btn"]::before,
html[data-gptskins-theme] [class*="menu-item-trailing-btn"]::after {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) :is([class*="sidebar-section-header"], [class*="sidebar-expando-section-header"], [class*="group/sidebar-expando-section-header"]) {
  font-weight: 700 !important;
}

html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) :is([class*="group-hover/sidebar-section-header"], [class*="group-hover/sidebar-expand-section-header"], [class*="group-hover/sidebar-expando-section-header"]) {
  opacity: 0 !important;
  pointer-events: none !important;
}

html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) :is([class*="group/sidebar-section-header"], [class*="group/sidebar-expand-section-header"], [class*="group/sidebar-expando-section-header"]):is(:hover, :focus-within) :is([class*="group-hover/sidebar-section-header"], [class*="group-hover/sidebar-expand-section-header"], [class*="group-hover/sidebar-expando-section-header"]),
html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) :is([class*="group-hover/sidebar-section-header"], [class*="group-hover/sidebar-expand-section-header"], [class*="group-hover/sidebar-expando-section-header"]):is(:hover, :focus-visible, [data-state="open"]) {
  opacity: 1 !important;
  pointer-events: auto !important;
}

html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) :is([class*="sidebar-section-header"], button[aria-expanded], button[aria-controls], [role="button"][aria-expanded]):not([data-testid="accounts-profile-button"]):not([data-gptskins-sidebar-action]):hover,
html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) :is(div, section):has(:is([class*="sidebar-section-header"], button[aria-expanded], button[aria-controls])) :is(button, [role="button"]):not([data-testid="accounts-profile-button"]):not([data-gptskins-sidebar-action]):hover,
html[data-gptskins-theme] [class*="group-hover/sidebar-section-header"]:hover,
html[data-gptskins-theme] [class*="group-hover/sidebar-expand-section-header"]:hover,
html[data-gptskins-theme] [class*="group-hover/sidebar-expando-section-header"]:hover,
html[data-gptskins-theme] [class*="group/sidebar-expando-section-header"]:hover,
html[data-gptskins-theme] [data-trailing-button]:hover,
html[data-gptskins-theme] [class*="menu-item-trailing-btn"]:hover,
html[data-gptskins-theme] [data-trailing-button][data-state="open"],
html[data-gptskins-theme] [class*="menu-item-trailing-btn"][data-state="open"],
html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) :is(div, span):has(> [data-trailing-button]):hover,
html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) [class*="group-hover/sidebar-section-header"]:hover,
html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) [class*="group-hover/sidebar-expando-section-header"]:hover,
html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) :is(a, button, [role="button"], div, span):has(> svg:only-child):hover {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) [data-gptskins-sidebar-action] {
  border-radius: 10px !important;
}

html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) [data-gptskins-sidebar-action="library"]:is(:hover, :focus-visible, [data-active]) {
  z-index: 21 !important;
}

html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) [data-gptskins-sidebar-action]:focus-visible {
  background-color: var(--gptskins-sidebarHover) !important;
  color: var(--gptskins-sidebarText) !important;
}

html[data-gptskins-theme] [data-gptskins-sidebar-action]:is(:hover, :focus-visible) :is(div, span) {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  color: inherit !important;
}

html[data-gptskins-theme] [data-testid="accounts-profile-button"]:is(:hover, :focus-visible) {
  background: var(--gptskins-sidebarHover) !important;
  background-color: var(--gptskins-sidebarHover) !important;
  color: var(--gptskins-sidebarText) !important;
}

html[data-gptskins-theme] [data-testid="accounts-profile-button"] [data-trailing-button]:is(:hover, :focus-visible) > div {
  background: var(--gptskins-sidebarHover) !important;
  background-color: var(--gptskins-sidebarHover) !important;
}

html[data-gptskins-theme] [data-testid="accounts-profile-button"]:not(:hover):not(:focus-visible) {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] [class*="border-token"],
html[data-gptskins-theme] [class*="divide-token"] > :not([hidden]) ~ :not([hidden]),
html[data-gptskins-theme] textarea,
html[data-gptskins-theme] input,
html[data-gptskins-theme] [contenteditable="true"],
html[data-gptskins-theme] [data-testid="composer"] {
  border-color: var(--gptskins-border) !important;
}

html[data-gptskins-theme] svg {
  color: inherit !important;
}

html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) svg[stroke]:not([stroke="none"]),
html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) svg [stroke]:not([stroke="none"]) {
  stroke: currentColor !important;
  stroke-width: 1.75 !important;
}

html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) svg[fill]:not([fill="none"]),
html[data-gptskins-theme] :is(nav, aside, [class*="sidebar"], [data-testid="history-panel"], [data-testid="left-sidebar"]) svg [fill]:not([fill="none"]) {
  fill: currentColor !important;
  stroke: none !important;
}

html[data-gptskins-theme] :is(form[class*="composer"], [class*="group/composer"], [data-testid="composer"]) :is(button, [role="button"]) svg[stroke]:not([stroke="none"]),
html[data-gptskins-theme] :is(form[class*="composer"], [class*="group/composer"], [data-testid="composer"]) :is(button, [role="button"]) svg [stroke]:not([stroke="none"]) {
  stroke: currentColor !important;
  stroke-width: 1.75 !important;
}

html[data-gptskins-theme] :is(form[class*="composer"], [class*="group/composer"], [data-testid="composer"]) :is(button, [role="button"]) svg[fill]:not([fill="none"]),
html[data-gptskins-theme] :is(form[class*="composer"], [class*="group/composer"], [data-testid="composer"]) :is(button, [role="button"]) svg [fill]:not([fill="none"]) {
  fill: currentColor !important;
  stroke: none !important;
}

html[data-gptskins-theme] [role="dialog"],
html[data-gptskins-theme] [aria-modal="true"],
html[data-gptskins-theme] [class*="modal"],
html[data-gptskins-theme] [class*="popover"],
html[data-gptskins-theme] [data-radix-popper-content-wrapper] {
  --main-surface-primary: var(--gptskins-surface) !important;
  --main-surface-secondary: var(--gptskins-surfaceStrong) !important;
  --main-surface-tertiary: var(--gptskins-composer) !important;
  --text-primary: var(--gptskins-text) !important;
  --text-secondary: var(--gptskins-mutedText) !important;
  --text-tertiary: var(--gptskins-mutedText) !important;
  --surface-hover: var(--gptskins-surfaceStrong) !important;
  --border-light: var(--gptskins-border) !important;
  --border-medium: var(--gptskins-border) !important;
  --border-heavy: var(--gptskins-border) !important;
  background-color: var(--gptskins-surface) !important;
  border-color: var(--gptskins-border) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [data-radix-popper-content-wrapper] {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] :is([data-radix-menu-content], [data-radix-popper-content-wrapper] [role="menu"]) {
  background: var(--gptskins-composer) !important;
  background-color: var(--gptskins-composer) !important;
  background-image: none !important;
  border: 1px solid var(--gptskins-border) !important;
  border-radius: 18px !important;
  box-shadow: 0 18px 48px var(--gptskins-shadow) !important;
  color: var(--gptskins-text) !important;
  overflow: hidden !important;
}

html[data-gptskins-theme] [role="dialog"],
html[data-gptskins-theme] [aria-modal="true"] {
  border: 1px solid var(--gptskins-border) !important;
  box-shadow: 0 18px 48px var(--gptskins-shadow) !important;
}

html[data-gptskins-theme] [role="dialog"] :is(h1, h2, h3, h4, h5, h6, p, span, div, label, small),
html[data-gptskins-theme] [aria-modal="true"] :is(h1, h2, h3, h4, h5, h6, p, span, div, label, small),
html[data-gptskins-theme] [role="dialog"] [class*="text-token-text-primary"],
html[data-gptskins-theme] [aria-modal="true"] [class*="text-token-text-primary"] {
  color: var(--gptskins-text) !important;
  opacity: 1 !important;
}

html[data-gptskins-theme] [role="dialog"] [class*="text-token-text-secondary"],
html[data-gptskins-theme] [role="dialog"] [class*="text-token-text-tertiary"],
html[data-gptskins-theme] [aria-modal="true"] [class*="text-token-text-secondary"],
html[data-gptskins-theme] [aria-modal="true"] [class*="text-token-text-tertiary"],
html[data-gptskins-theme] [role="dialog"] small,
html[data-gptskins-theme] [aria-modal="true"] small {
  color: var(--gptskins-mutedText) !important;
  opacity: 1 !important;
}

html[data-gptskins-theme] [role="dialog"] [class*="bg-token"],
html[data-gptskins-theme] [aria-modal="true"] [class*="bg-token"] {
  background-color: var(--gptskins-surface) !important;
}

html[data-gptskins-theme] [role="dialog"] :is(hr, [class*="border-token"], [class*="divide-token"] > :not([hidden]) ~ :not([hidden])),
html[data-gptskins-theme] [aria-modal="true"] :is(hr, [class*="border-token"], [class*="divide-token"] > :not([hidden]) ~ :not([hidden])) {
  border-color: var(--gptskins-border) !important;
}

html[data-gptskins-theme] [role="dialog"] :is(button, [role="button"], [role="tab"]),
html[data-gptskins-theme] [aria-modal="true"] :is(button, [role="button"], [role="tab"]) {
  background-color: transparent !important;
  border-color: transparent !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [role="dialog"] select,
html[data-gptskins-theme] [aria-modal="true"] select,
html[data-gptskins-theme] [role="menu"],
html[data-gptskins-theme] [role="listbox"] {
  background-color: var(--gptskins-composer) !important;
  border-color: var(--gptskins-border) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] :is([role="listbox"], [class*="suggest" i], [data-testid*="suggest" i], [class*="autocomplete" i], [data-testid*="autocomplete" i]) {
  background-color: var(--gptskins-composer) !important;
  border-color: var(--gptskins-border) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] :is([role="listbox"], [class*="suggest" i], [data-testid*="suggest" i], [class*="autocomplete" i], [data-testid*="autocomplete" i]) :is(div, span, p, button, [role="option"]) {
  background-color: transparent !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] :is([role="listbox"], [class*="suggest" i], [data-testid*="suggest" i], [class*="autocomplete" i], [data-testid*="autocomplete" i]) :is(hr, [class*="border"], [class*="divide"] > :not([hidden]) ~ :not([hidden])) {
  border-color: var(--gptskins-border) !important;
}

html[data-gptskins-theme] [data-gptskins-suggestion-layer] {
  background: var(--gptskins-composer) !important;
  background-image: none !important;
  border: 1px solid var(--gptskins-border) !important;
  color: var(--gptskins-text) !important;
  box-shadow: 0 12px 30px var(--gptskins-shadow) !important;
}

html[data-gptskins-theme] [data-gptskins-suggestion-layer] :is(div, span, p, button) {
  background-color: transparent !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [data-gptskins-suggestion-layer] :is(hr, [class*="border"], [class*="divide"] > :not([hidden]) ~ :not([hidden])) {
  border-color: var(--gptskins-border) !important;
}

html[data-gptskins-theme] :is(form[class*="composer"], [class*="group/composer"]) :is([class*="top-full"], [class*="bg-surface-primary"]:has(> ul[class*="divide-token-border"]), ul[class*="divide-token-border"]) {
  background: var(--gptskins-composer) !important;
  background-image: none !important;
  border-color: var(--gptskins-border) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] .top-full .bg-surface-primary,
html[data-gptskins-theme] .top-full .bg-surface-primary > ul {
  background: var(--gptskins-composer) !important;
  background-color: var(--gptskins-composer) !important;
  background-image: none !important;
  border-color: var(--gptskins-border) !important;
  border-radius: 12px !important;
  color: var(--gptskins-text) !important;
  overflow: hidden !important;
}

html[data-gptskins-theme] .top-full .bg-surface-primary :is(li, button, span) {
  background-color: transparent !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] .top-full .bg-surface-primary li:hover button {
  background-color: var(--gptskins-surfaceStrong) !important;
}

html[data-gptskins-theme] :is(form[class*="composer"], [class*="group/composer"]) ul[class*="divide-token-border"] > li {
  background: transparent !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [role="tooltip"] [class*="bg-token-bg-tooltip"],
html[data-gptskins-theme] [class*="bg-token-bg-tooltip"] {
  background: var(--gptskins-surfaceStrong) !important;
  background-color: var(--gptskins-surfaceStrong) !important;
  background-image: none !important;
  border: 1px solid var(--gptskins-border) !important;
  box-shadow: 0 10px 28px var(--gptskins-shadow) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] :is([role="tooltip"] [class*="bg-token-bg-tooltip"], [class*="bg-token-bg-tooltip"]) :is(div, span, p, svg) {
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [role="dialog"] :is(button, [role="button"], [role="tab"]):hover,
html[data-gptskins-theme] [aria-modal="true"] :is(button, [role="button"], [role="tab"]):hover,
html[data-gptskins-theme] [role="dialog"] :is([aria-selected="true"], [data-state="active"], [data-state="checked"]),
html[data-gptskins-theme] [aria-modal="true"] :is([aria-selected="true"], [data-state="active"], [data-state="checked"]),
html[data-gptskins-theme] [role="menu"] [role="menuitem"]:hover,
html[data-gptskins-theme] [role="listbox"] [role="option"]:hover,
html[data-gptskins-theme] [role="menu"] :is(button, a, [role="button"]):hover,
html[data-gptskins-theme] [role="menu"] :is(button, a, [role="button"])[data-state="open"],
html[data-gptskins-theme] [role="menu"] :is(button, a, [role="button"])[aria-expanded="true"],
html[data-gptskins-theme] [role="menu"] :is(button, a, [role="button"])[aria-selected="true"],
html[data-gptskins-theme] [aria-modal="true"] [role="menu"] :is(button, a, [role="button"]):hover,
html[data-gptskins-theme] :is([role="menuitem"].__menu-item, [role="menuitem"][data-radix-collection-item], [data-testid$="-menu-item"]):is(:hover, :focus-visible, [data-highlighted], [data-state="open"]),
html[data-gptskins-theme] :is([class*="suggest" i], [data-testid*="suggest" i], [class*="autocomplete" i], [data-testid*="autocomplete" i]) :is(div, button, [role="option"]):hover {
  background-color: var(--gptskins-surfaceStrong) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] :is([role="dialog"], [aria-modal="true"]) :is(button, [role="button"]):is(.btn-danger, [data-testid*="delete" i], [aria-label*="delete" i]) {
  background: #ff002a !important;
  background-color: #ff002a !important;
  border-color: transparent !important;
  box-shadow: none !important;
  color: #ffffff !important;
  outline: 0 !important;
}

html[data-gptskins-theme] :is([role="dialog"], [aria-modal="true"]) :is(button, [role="button"]):is(.btn-danger, [data-testid*="delete" i], [aria-label*="delete" i]) :is(div, span, svg) {
  color: inherit !important;
}

html[data-gptskins-theme] [data-radix-menu-content] .__menu-item:is(:hover, :focus, :focus-visible, [data-highlighted]),
html[data-gptskins-theme] [data-radix-menu-content] [data-radix-collection-item]:is(:hover, :focus, :focus-visible, [data-highlighted]),
html[data-gptskins-theme] [data-radix-popper-content-wrapper] [role="menu"] .__menu-item:is(:hover, :focus, :focus-visible, [data-highlighted]),
html[data-gptskins-theme] [data-radix-popper-content-wrapper] [role="menu"] [data-radix-collection-item]:is(:hover, :focus, :focus-visible, [data-highlighted]) {
  background: var(--gptskins-menuHover) !important;
  background-color: var(--gptskins-menuHover) !important;
  background-image: none !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [role="dialog"] :is([aria-pressed="true"], [data-selected="true"]),
html[data-gptskins-theme] [aria-modal="true"] :is([aria-pressed="true"], [data-selected="true"]) {
  background-color: var(--gptskins-surfaceStrong) !important;
  border: 1px solid var(--gptskins-border) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme][data-gptskins-plan-page="true"] [role="group"]:has([data-gptskins-plan-toggle]) {
  background: color-mix(in srgb, var(--gptskins-mutedText) 16%, var(--gptskins-surface)) !important;
  background-color: color-mix(in srgb, var(--gptskins-mutedText) 16%, var(--gptskins-surface)) !important;
  background-image: none !important;
  border: 1px solid color-mix(in srgb, var(--gptskins-border) 36%, transparent) !important;
  border-radius: 999px !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--gptskins-text) 4%, transparent) !important;
  color: var(--gptskins-mutedText) !important;
}

html[data-gptskins-theme][data-gptskins-plan-page="true"] [data-gptskins-plan-toggle] {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
  color: var(--gptskins-mutedText) !important;
}

html[data-gptskins-theme][data-gptskins-plan-page="true"] :is([role="group"], div):has(> :is(div, section) > [data-gptskins-plan-toggle]) > :is(div, section):first-child [class*="bg-token-bg-primary"][class*="absolute"][class*="inset-0"] {
  background: color-mix(in srgb, var(--gptskins-text) 5%, var(--gptskins-surface)) !important;
  background-color: color-mix(in srgb, var(--gptskins-text) 5%, var(--gptskins-surface)) !important;
  background-image: none !important;
  box-shadow: 0 2px 8px var(--gptskins-shadow) !important;
}

html[data-gptskins-theme][data-gptskins-plan-page="true"] [data-gptskins-plan-toggle-option] {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
  color: var(--gptskins-mutedText) !important;
  opacity: 1 !important;
}

html[data-gptskins-theme][data-gptskins-plan-page="true"] [data-gptskins-plan-toggle-option]:hover {
  background: transparent !important;
  background-color: transparent !important;
  color: var(--gptskins-mutedText) !important;
}

html[data-gptskins-theme][data-gptskins-plan-page="true"] [data-gptskins-plan-toggle-option]:is([aria-pressed="true"], [aria-selected="true"], [aria-checked="true"], [data-state="active"], [data-state="checked"], [data-selected="true"], [data-active="true"]),
html[data-gptskins-theme][data-gptskins-plan-page="true"] [data-gptskins-plan-toggle-option][data-gptskins-plan-active="true"] {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme][data-gptskins-plan-page="true"] [data-gptskins-plan-toggle-option] :is(span, div) {
  color: inherit !important;
  opacity: 1 !important;
}

html[data-gptskins-theme][data-gptskins-plan-page="true"] [data-gptskins-plan-cta] {
  background: var(--gptskins-accent) !important;
  background-color: var(--gptskins-accent) !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
  color: var(--gptskins-accentText) !important;
  opacity: 1 !important;
}

html[data-gptskins-theme][data-gptskins-plan-page="true"] [data-gptskins-plan-cta]:is(:disabled, [disabled], [aria-disabled="true"], [data-disabled="true"]),
html[data-gptskins-theme][data-gptskins-plan-page="true"] [data-gptskins-plan-cta][data-gptskins-plan-disabled="true"] {
  background: color-mix(in srgb, var(--gptskins-mutedText) 46%, var(--gptskins-surface)) !important;
  background-color: color-mix(in srgb, var(--gptskins-mutedText) 46%, var(--gptskins-surface)) !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
  color: color-mix(in srgb, var(--gptskins-text) 42%, var(--gptskins-surface)) !important;
  cursor: not-allowed !important;
  opacity: 1 !important;
}

html[data-gptskins-theme][data-gptskins-plan-page="true"] [data-gptskins-plan-cta] :is(span, div) {
  color: inherit !important;
  opacity: 1 !important;
}

html[data-gptskins-theme] [role="dialog"] [role="switch"],
html[data-gptskins-theme] [aria-modal="true"] [role="switch"] {
  background-color: var(--gptskins-composer) !important;
  border: 1px solid var(--gptskins-border) !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] [role="switch"][aria-checked="true"],
html[data-gptskins-theme] button[role="switch"][aria-checked="true"] {
  background-color: color-mix(in srgb, var(--gptskins-accent) 28%, var(--gptskins-composer)) !important;
  border-color: var(--gptskins-accent) !important;
}

html[data-gptskins-theme] [role="dialog"] [role="switch"] :is(span, div),
html[data-gptskins-theme] [aria-modal="true"] [role="switch"] :is(span, div),
html[data-gptskins-theme] [role="dialog"] [role="switch"]::before,
html[data-gptskins-theme] [role="dialog"] [role="switch"]::after,
html[data-gptskins-theme] [aria-modal="true"] [role="switch"]::before,
html[data-gptskins-theme] [aria-modal="true"] [role="switch"]::after {
  background-color: var(--gptskins-surface) !important;
  border-color: var(--gptskins-border) !important;
}

html[data-gptskins-theme] [role="dialog"] :is(button, span)[class*="dot"],
html[data-gptskins-theme] [role="dialog"] :is(button, span)[aria-label*="slide" i],
html[data-gptskins-theme] [role="dialog"] :is(button, span)[aria-label*="page" i],
html[data-gptskins-theme] [aria-modal="true"] :is(button, span)[class*="dot"],
html[data-gptskins-theme] [aria-modal="true"] :is(button, span)[aria-label*="slide" i],
html[data-gptskins-theme] [aria-modal="true"] :is(button, span)[aria-label*="page" i] {
  background-color: var(--gptskins-mutedText) !important;
  border-color: transparent !important;
  color: transparent !important;
  opacity: 0.45 !important;
}

html[data-gptskins-theme] [role="dialog"] :is(button, span)[class*="dot"][aria-current="true"],
html[data-gptskins-theme] [role="dialog"] :is(button, span)[aria-label*="slide" i][aria-current="true"],
html[data-gptskins-theme] [role="dialog"] :is(button, span)[aria-label*="page" i][aria-current="true"],
html[data-gptskins-theme] [aria-modal="true"] :is(button, span)[class*="dot"][aria-current="true"],
html[data-gptskins-theme] [aria-modal="true"] :is(button, span)[aria-label*="slide" i][aria-current="true"],
html[data-gptskins-theme] [aria-modal="true"] :is(button, span)[aria-label*="page" i][aria-current="true"] {
  background-color: var(--gptskins-accent) !important;
  opacity: 1 !important;
}

html[data-gptskins-theme] :is([role="dialog"], [aria-modal="true"]) :is(span, div, button)[class~="rounded-full"]:is([class~="h-1"][class~="w-1"], [class~="h-1.5"][class~="w-1.5"], [class~="h-2"][class~="w-2"], [class~="size-1"], [class~="size-1.5"], [class~="size-2"]) {
  background-color: var(--gptskins-mutedText) !important;
  border-color: transparent !important;
  opacity: 0.45 !important;
}

html[data-gptskins-theme] :is([role="dialog"], [aria-modal="true"]) :is(span, div, button)[class~="rounded-full"]:is([class~="h-1"][class~="w-1"], [class~="h-1.5"][class~="w-1.5"], [class~="h-2"][class~="w-2"], [class~="size-1"], [class~="size-1.5"], [class~="size-2"]):is([class~="bg-token-text-primary"], [class~="bg-white"], [data-active="true"], [data-state="active"]) {
  background-color: var(--gptskins-accent) !important;
  opacity: 1 !important;
}

html[data-gptskins-theme] .text-token-text-secondary,
html[data-gptskins-theme] [class*="text-token-text-secondary"],
html[data-gptskins-theme] [class*="text-token-text-tertiary"],
html[data-gptskins-theme] small {
  color: var(--gptskins-mutedText) !important;
}

html[data-gptskins-theme] pre:not(.cm-content) {
  background-color: var(--code-block-bg) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] code {
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] :not(pre) > code {
  background-color: var(--gptskins-surfaceStrong) !important;
  border: 1px solid var(--gptskins-border) !important;
  border-radius: 6px !important;
  padding: 0.1em calc(0.3rem - 1px) !important;
}

html[data-gptskins-theme] [data-message-author-role] pre:not(.cm-content),
html[data-gptskins-theme] [data-message-author-role] .markdown pre:not(.cm-content) {
  background-color: var(--code-block-bg) !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow: auto !important;
}

html[data-gptskins-theme] [data-message-author-role] .markdown :is(div, section):has(> pre):not(.cm-scroller):not(:has(.cm-editor)):not(:has(> p)),
html[data-gptskins-theme] [data-message-author-role] .markdown :is(div, section):has(> div > pre):not(:has(.cm-editor)):not(:has(> p)),
html[data-gptskins-theme] [data-message-author-role] :is([class*="overflow-hidden"], [class*="contain-inline-size"], [data-testid*="code"], [class*="code-block"]):has(:is(pre, code)):not(:has(.cm-editor)) {
  background-color: var(--code-block-bg) !important;
  border: 1px solid var(--code-block-border) !important;
  border-radius: var(--code-block-radius) !important;
  box-shadow: none !important;
  overflow: hidden !important;
}

html[data-gptskins-theme] [data-message-author-role] .markdown :is(div, section):has(> pre):not(.cm-scroller):not(:has(.cm-editor)):not(:has(> p)) > :not(pre):first-child,
html[data-gptskins-theme] [data-message-author-role] .markdown :is(div, section):has(> div > pre):not(:has(.cm-editor)):not(:has(> p)) > :not(:has(pre)):first-child,
html[data-gptskins-theme] [data-message-author-role] :is([class*="overflow-hidden"], [class*="contain-inline-size"], [data-testid*="code"], [class*="code-block"]):has(:is(pre, code)):not(:has(.cm-editor)) > :not(:is(pre, code)):first-child,
html[data-gptskins-theme] [data-message-author-role] :is([class*="bg-black"], [class*="bg-gray-950"], [class*="bg-token-sidebar"], [class*="bg-token-main"]):has(+ :is(pre, code)) {
  background-color: var(--code-block-header) !important;
  border-color: var(--code-block-border) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [data-message-author-role] :is([class*="overflow-hidden"], [class*="contain-inline-size"], [data-testid*="code"], [class*="code-block"]):has(:is(pre, code)):not(:has(.cm-editor)) :is([class*="bg-black"], [class*="bg-gray-950"], [class*="dark:bg-black"], [class*="dark:bg-gray-950"]) {
  background-color: var(--code-block-header) !important;
  background-image: none !important;
}

html[data-gptskins-theme] [data-message-author-role] :is([class*="overflow-hidden"], [class*="contain-inline-size"], [data-testid*="code"], [class*="code-block"]):has(:is(pre, code)):not(:has(.cm-editor)) :is([class*="border-token"], [class*="border-["], [class*="ring-"]) {
  border-color: transparent !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] [data-message-author-role] :is([class*="overflow-hidden"], [class*="contain-inline-size"], [data-testid*="code"], [class*="code-block"]):has(:is(pre, code)):not(:has(.cm-editor)) pre,
html[data-gptskins-theme] [data-message-author-role] .markdown :is(div, section):has(> pre):not(.cm-scroller):not(:has(.cm-editor)):not(:has(> p)) pre,
html[data-gptskins-theme] [data-message-author-role] .markdown :is(div, section):has(> div > pre):not(:has(.cm-editor)):not(:has(> p)) pre {
  background-color: var(--code-block-bg) !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  margin: 0 !important;
}

html[data-gptskins-theme] [data-message-author-role] pre,
html[data-gptskins-theme] [data-message-author-role] code {
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [data-message-author-role] pre code,
html[data-gptskins-theme] [data-message-author-role] pre span,
html[data-gptskins-theme] [data-message-author-role] code span {
  background: transparent !important;
}

html[data-gptskins-theme] [data-message-author-role] :is([data-testid*="artifact"], [data-testid*="canvas"], [class*="artifact"], [class*="canvas"]) {
  background-color: var(--gptskins-surface) !important;
  border: 1px solid var(--gptskins-border) !important;
  border-radius: 18px !important;
  box-shadow: 0 10px 28px var(--gptskins-shadow) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [data-message-author-role] :is([data-testid*="artifact"], [data-testid*="canvas"], [class*="artifact"], [class*="canvas"]) * {
  color: var(--gptskins-text) !important;
  border-color: var(--gptskins-border) !important;
}

html[data-gptskins-theme] [data-message-author-role] :is([data-testid*="artifact"], [data-testid*="canvas"], [class*="artifact"], [class*="canvas"]) :is(article, section, [class*="document"], [class*="preview"]) {
  background-color: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] [data-message-author-role] :is([data-testid*="artifact"], [data-testid*="canvas"], [class*="artifact"], [class*="canvas"]) :is(article, section, [class*="document"], [class*="preview"], [class*="editor"], [class*="ProseMirror"], [contenteditable="true"]) :is(div, article, section, main):is([class*="bg-"], [style*="background"]),
html[data-gptskins-theme] [data-message-author-role] :is([data-testid*="artifact"], [data-testid*="canvas"], [class*="artifact"], [class*="canvas"]) :is(article, section, [class*="document"], [class*="preview"], [class*="editor"], [class*="ProseMirror"], [contenteditable="true"]):is([class*="bg-"], [style*="background"]) {
  background-color: transparent !important;
  background-image: none !important;
}

html[data-gptskins-theme] main :is([class*="sticky"], [class*="fixed"])[class*="bottom-0"]:not(:has(:is(form[class*="composer"], [data-testid="composer"], [class*="group/composer"], [class*="composer"]))),
html[data-gptskins-theme][data-gptskins-plan-page="true"] main :is([class*="bg-black"], [class*="from-black"], [class*="to-black"], [class*="dark:bg-black"], [class*="dark:from-black"], [class*="dark:to-black"], [style*="background: black"], [style*="background-color: black"], [style*="background-color: rgb(0, 0, 0)"]):not([data-gptskins-plan-toggle]):not([data-gptskins-plan-toggle-option]):not([data-gptskins-plan-cta]) {
  background: transparent !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] [data-message-author-role] :is([class*="not-prose"], [class*="group/code"], [class*="overflow-hidden"], [class*="contain-inline-size"], [data-testid*="code"], [class*="code-block"], [class*="bg-token-main-surface-secondary"], [class*="bg-token-main-surface-tertiary"]):has(:is(pre, code)):not(:has(.cm-editor)),
html[data-gptskins-theme] [data-message-author-role] .markdown :is(div, section):has(> :is(div, header) + pre):not(:has(.cm-editor)):not(:has(> p)),
html[data-gptskins-theme] [data-message-author-role] .markdown :is(div, section):has(> :is(div, header) + div code):not(:has(.cm-editor)):not(:has(> p)) {
  background-color: var(--code-block-bg) !important;
  background-image: none !important;
  border: 1px solid var(--code-block-border) !important;
  border-radius: var(--code-block-radius) !important;
  box-shadow: none !important;
  overflow: hidden !important;
}

html[data-gptskins-theme] [data-message-author-role] :is([class*="not-prose"], [class*="group/code"], [class*="overflow-hidden"], [class*="contain-inline-size"], [data-testid*="code"], [class*="code-block"], [class*="bg-token-main-surface-secondary"], [class*="bg-token-main-surface-tertiary"]):has(:is(pre, code)):not(:has(.cm-editor)) > :is(div, header):first-child,
html[data-gptskins-theme] [data-message-author-role] .markdown :is(div, section):has(> :is(div, header) + pre):not(:has(.cm-editor)):not(:has(> p)) > :is(div, header):first-child,
html[data-gptskins-theme] [data-message-author-role] .markdown :is(div, section):has(> :is(div, header) + div code):not(:has(.cm-editor)):not(:has(> p)) > :is(div, header):first-child,
html[data-gptskins-theme] [data-message-author-role] :is([class*="not-prose"], [class*="group/code"], [class*="overflow-hidden"], [class*="contain-inline-size"], [data-testid*="code"], [class*="code-block"]):has(:is(pre, code)):not(:has(.cm-editor)) :is([class*="bg-black"], [class*="bg-gray-950"], [class*="bg-token-main"], [class*="bg-token-sidebar"], [class*="dark:bg-black"], [class*="dark:bg-gray-950"], [style*="background"]) {
  background-color: var(--code-block-header) !important;
  background-image: none !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [data-message-author-role] :is([class*="not-prose"], [class*="group/code"], [class*="overflow-hidden"], [class*="contain-inline-size"], [data-testid*="code"], [class*="code-block"]):has(:is(pre, code)):not(:has(.cm-editor)) :is(pre, code, [class*="overflow-y-auto"], [class*="p-4"]) {
  background-color: var(--code-block-bg) !important;
  border-color: transparent !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] [data-message-author-role] :is(div, section):is([class*="rounded"], [class*="border"], [class*="bg-"], [style*="border-radius"], [style*="background"]):has(:is([aria-label*="edit" i], [data-testid*="edit" i], button[class*="edit" i])):has(:is(article, [class*="document"], [class*="preview"], [class*="ProseMirror"], [contenteditable="true"], h1, h2, h3)) {
  background-color: var(--gptskins-surface) !important;
  background-image: none !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [data-message-author-role] :is(div, section):is([class*="rounded"], [class*="border"], [class*="bg-"], [style*="border-radius"], [style*="background"]):has(:is([aria-label*="edit" i], [data-testid*="edit" i], button[class*="edit" i])):has(:is(article, [class*="document"], [class*="preview"], [class*="ProseMirror"], [contenteditable="true"], h1, h2, h3)) :is(article, section, main, div):is([class*="bg-"], [style*="background"]) {
  background-color: transparent !important;
  background-image: none !important;
}

html[data-gptskins-theme] [data-testid="writing-block-container"] {
  background-color: var(--gptskins-surface) !important;
  background-image: none !important;
  border: 1px solid color-mix(in srgb, var(--gptskins-border) 72%, var(--gptskins-text) 28%) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [data-testid="writing-block-container"] :is([data-testid="writing-block-header-surface"], [class*="writing-block-editor"], [class*="ProseMirror"], [contenteditable="true"]) {
  background-color: var(--gptskins-surface) !important;
  background-image: none !important;
}

html[data-gptskins-theme] [role="dialog"][aria-label="Writing block editor"] [class*="writing-block-editor"],
html[data-gptskins-theme] [role="dialog"][aria-label="Writing block editor"] [class*="writing-block-editor"] :is([class*="ProseMirror"], [contenteditable="true"]) {
  background: var(--gptskins-surface) !important;
  background-color: var(--gptskins-surface) !important;
  background-image: none !important;
}

html[data-gptskins-theme] [data-testid="writing-block-container"] [data-testid="writing-block-header-magic-edit-button"],
html[data-gptskins-theme] [data-testid="writing-block-container"] button[aria-label="Edit"] {
  background: var(--gptskins-surfaceStrong) !important;
  border: 1px solid color-mix(in srgb, var(--gptskins-border) 70%, var(--gptskins-text) 30%) !important;
  box-shadow: none !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [data-testid="writing-block-container"] [data-testid="writing-block-header-magic-edit-button"] :is(svg, span),
html[data-gptskins-theme] [data-testid="writing-block-container"] button[aria-label="Edit"] :is(svg, span) {
  color: inherit !important;
  opacity: 1 !important;
  stroke: currentColor !important;
}

html[data-gptskins-theme] [data-testid="writing-block-container"] [data-testid="writing-block-header-magic-edit-button"]:hover,
html[data-gptskins-theme] [data-testid="writing-block-container"] button[aria-label="Edit"]:hover {
  background: color-mix(in srgb, var(--gptskins-surfaceStrong) 82%, var(--gptskins-accent) 18%) !important;
}

html[data-gptskins-theme] [data-gptskins-code-block] {
  background: var(--code-block-bg) !important;
  border: 1px solid var(--code-block-border) !important;
  border-radius: var(--code-block-radius) !important;
  box-shadow: none !important;
  clip-path: none !important;
  outline: 0 !important;
  overflow: clip !important;
}

html[data-gptskins-theme] [data-gptskins-code-frame] {
  background: transparent !important;
  border: 0 !important;
  border-radius: var(--code-block-radius) !important;
  box-shadow: none !important;
  clip-path: none !important;
  outline: 0 !important;
  overflow: visible !important;
  padding: 0 !important;
}

html[data-gptskins-theme] [data-message-author-role] pre[data-gptskins-code-frame] {
  background: transparent !important;
  border: 0 !important;
  border-radius: var(--code-block-radius) !important;
  box-shadow: none !important;
  outline: 0 !important;
  overflow: visible !important;
  padding: 0 !important;
}

html[data-gptskins-theme] [data-message-author-role] :is([data-gptskins-code-frame], [data-gptskins-code-block], [data-gptskins-code-body], [data-gptskins-code-body-shell]):has([role="dialog"][aria-label*="code" i]) {
  clip-path: none !important;
  overflow: visible !important;
}

html[data-gptskins-theme] [data-gptskins-code-frame]::before,
html[data-gptskins-theme] [data-gptskins-code-frame]::after {
  background: transparent !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] [data-gptskins-code-block] :is([class*="border"], [class*="ring"], [class*="shadow"]) {
  border-color: transparent !important;
  box-shadow: none !important;
  outline: 0 !important;
}

html[data-gptskins-theme] [data-gptskins-code-header] {
  background: var(--code-block-bg) !important;
  background-image: none !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  color: var(--gptskins-text) !important;
  z-index: 1 !important;
}

html[data-gptskins-theme] [data-gptskins-code-header] > [class*="bg-token-bg-elevated-secondary"],
html[data-gptskins-theme] [data-gptskins-code-header] > [class*="code-block-surface"],
html[data-gptskins-theme] [data-message-author-role] pre [class*="select-none"][class*="sticky"] > [class*="bg-token-bg-elevated-secondary"] {
  background: transparent !important;
  background-image: none !important;
  border-radius: 0 !important;
  overflow: hidden !important;
}

html[data-gptskins-theme] [data-gptskins-code-header] :is(button, [role="button"]) svg,
html[data-gptskins-theme] [data-gptskins-code-header] :is(button, [role="button"]) svg * {
  color: var(--gptskins-mutedText) !important;
}

html[data-gptskins-theme] [data-gptskins-code-header] :is(button, [role="button"]) svg[stroke]:not([stroke="none"]),
html[data-gptskins-theme] [data-gptskins-code-header] :is(button, [role="button"]) svg [stroke]:not([stroke="none"]) {
  stroke: currentColor !important;
  stroke-width: 1.75 !important;
}

html[data-gptskins-theme] [data-gptskins-code-header] :is(button, [role="button"]) svg[fill]:not([fill="none"]),
html[data-gptskins-theme] [data-gptskins-code-header] :is(button, [role="button"]) svg [fill]:not([fill="none"]) {
  fill: currentColor !important;
  stroke: none !important;
}

html[data-gptskins-theme] [data-gptskins-code-header] :is(button, [role="button"])[aria-label*="run" i] {
  background: transparent !important;
  border: 1px solid var(--code-block-border) !important;
  border-radius: 999px !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] [data-gptskins-code-body] {
  background: transparent !important;
  background-image: none !important;
  border: 0 !important;
  border-top: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  clip-path: none !important;
  margin: 0 !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
}

html[data-gptskins-theme] [data-gptskins-code-body-shell] {
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 0 var(--code-block-radius) var(--code-block-radius) !important;
  box-shadow: none !important;
  clip-path: inset(0 round 0 0 var(--code-block-radius) var(--code-block-radius)) !important;
  outline: 0 !important;
  overflow: hidden !important;
}

html[data-gptskins-theme] [data-gptskins-code-body] :is(pre, code),
html[data-gptskins-theme] [data-gptskins-code-body] code {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  white-space: pre !important;
}

html[data-gptskins-theme] [data-message-author-role] .cm-scroller {
  overflow-x: auto !important;
  scrollbar-color: var(--gptskins-mutedText) color-mix(in srgb, var(--code-block-bg) 78%, var(--gptskins-border)) !important;
  scrollbar-width: auto !important;
}

html[data-gptskins-theme] [data-message-author-role] [data-gptskins-code-body]:not([data-gptskins-code-scrollable]),
html[data-gptskins-theme] [data-message-author-role] [data-gptskins-code-body]:not([data-gptskins-code-scrollable]) :is(.cm-scroller, .cm-content) {
  scrollbar-width: none !important;
}

html[data-gptskins-theme] [data-message-author-role] [data-gptskins-code-body]:not([data-gptskins-code-scrollable]) :is(.cm-editor, .cm-scroller, .cm-content) {
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
  outline: 0 !important;
}

html[data-gptskins-theme] [data-message-author-role] [data-gptskins-code-body]:not([data-gptskins-code-scrollable]) {
  overflow-x: hidden !important;
}

html[data-gptskins-theme] [data-message-author-role] .cm-editor,
html[data-gptskins-theme] [data-message-author-role] .cm-scroller,
html[data-gptskins-theme] [data-message-author-role] .cm-content {
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  color: var(--gptskins-text) !important;
  outline: 0 !important;
}

html[data-gptskins-theme] [data-message-author-role] [data-gptskins-code-block] [class*="sticky"][class*="bg-token-border-light"],
html[data-gptskins-theme] [data-message-author-role] pre[class*="overflow-visible"][class*="px-0"] [class*="sticky"][class*="bg-token-border-light"] {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] [data-message-author-role] :is(.pe-11.pt-3, [class*="overflow-clip"], [class*="bg-token-bg-elevated-secondary"]):has(.cm-editor) {
  background-color: var(--code-block-bg) !important;
  background-image: none !important;
  border-color: var(--code-block-border) !important;
  border-radius: var(--code-block-radius) !important;
  box-shadow: none !important;
  overflow: clip !important;
}

html[data-gptskins-theme] [data-message-author-role] [class*="overflow-clip"]:has(.cm-editor) > :first-child {
  background: var(--code-block-bg) !important;
  background-image: none !important;
}

html[data-gptskins-theme] [data-message-author-role] .pe-11.pt-3 .cm-editor[class*="cm-"] {
  border-color: transparent !important;
  outline-color: transparent !important;
}

html[data-gptskins-theme] [data-message-author-role] [data-gptskins-code-scrollable] .cm-scroller::-webkit-scrollbar:horizontal {
  display: block !important;
  height: 12px !important;
}

html[data-gptskins-theme] [data-message-author-role] [data-gptskins-code-scrollable] .cm-scroller::-webkit-scrollbar-track:horizontal {
  background: color-mix(in srgb, var(--code-block-bg) 78%, var(--gptskins-border)) !important;
  border-radius: 999px !important;
}

html[data-gptskins-theme] [data-message-author-role] [data-gptskins-code-scrollable] .cm-scroller::-webkit-scrollbar-thumb:horizontal {
  background: var(--gptskins-mutedText) !important;
  border-radius: 999px !important;
}

html[data-gptskins-theme] [data-message-author-role] [data-gptskins-code-body]:not([data-gptskins-code-scrollable])::-webkit-scrollbar:horizontal,
html[data-gptskins-theme] [data-message-author-role] [data-gptskins-code-body]:not([data-gptskins-code-scrollable]) :is(.cm-scroller, .cm-content)::-webkit-scrollbar:horizontal {
  display: none !important;
  height: 0 !important;
}

html[data-gptskins-theme] [data-gptskins-plan-layer],
html[data-gptskins-theme] [data-gptskins-plan-layer]::before,
html[data-gptskins-theme] [data-gptskins-plan-layer]::after {
  background: var(--gptskins-surface) !important;
  background-color: var(--gptskins-surface) !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

html[data-gptskins-theme] [data-message-author-role] pre [class*="border-token-border-light"]:not([data-gptskins-code-block]) {
  border: 0 !important;
  box-shadow: none !important;
  outline: 0 !important;
}

html[data-gptskins-theme] [data-message-author-role] pre [class*="bg-token-bg-elevated-secondary"] {
  background: var(--code-block-bg) !important;
  background-image: none !important;
}

html[data-gptskins-theme] [data-message-author-role] pre [class*="sticky"] > [class*="bg-token-bg-elevated-secondary"],
html[data-gptskins-theme] [data-message-author-role] pre [class*="select-none"] [class*="bg-token-bg-elevated-secondary"] {
  background: var(--code-block-header) !important;
  background-image: none !important;
  border-radius: var(--code-block-radius) var(--code-block-radius) 0 0 !important;
  overflow: hidden !important;
}

html[data-gptskins-theme] [data-message-author-role] pre[class*="overflow-visible"][class*="px-0"] [class*="select-none"][class*="sticky"] {
  background: var(--code-block-header) !important;
  background-image: none !important;
  border-radius: var(--code-block-radius) var(--code-block-radius) 0 0 !important;
  overflow: hidden !important;
}

html[data-gptskins-theme] [data-message-author-role] pre[class*="overflow-visible"][class*="px-0"] [class*="border-token-border-light"][class*="rounded"],
html[data-gptskins-theme] [data-message-author-role] pre[class*="overflow-visible"][class*="px-0"] [class*="overflow-clip"][class*="rounded"] {
  background: var(--code-block-bg) !important;
  background-image: none !important;
  border-color: var(--code-block-border) !important;
  border-radius: var(--code-block-radius) !important;
  box-shadow: none !important;
  overflow: clip !important;
}

html[data-gptskins-theme] [data-message-author-role] pre[class*="overflow-visible"][class*="px-0"]:has([class*="border-token-border-light"][class*="rounded"]),
html[data-gptskins-theme] [data-message-author-role] pre[class*="overflow-visible"][class*="px-0"]:has([class*="overflow-clip"][class*="rounded"]) {
  background: transparent !important;
  background-image: none !important;
  border: 0 !important;
  box-shadow: none !important;
  overflow: visible !important;
}

html[data-gptskins-theme] [data-message-author-role] [data-gptskins-code-block] [data-gptskins-code-body] :is(.cm-editor, .cm-scroller, .cm-content) {
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  outline: 0 !important;
}

html[data-gptskins-theme] [data-message-author-role] [data-testid="writing-block-container"][data-testid="writing-block-container"] :is([data-testid="writing-block-header-sticky-container"], [data-testid="writing-block-header-surface"]),
html[data-gptskins-theme] [data-message-author-role] [data-testid="writing-block-container"][data-testid="writing-block-container"] [class*="writing-block-editor"][class*="markdown"],
html[data-gptskins-theme] [data-message-author-role] [data-testid="writing-block-container"][data-testid="writing-block-container"] [class*="ProseMirror"][class*="markdown"],
html[data-gptskins-theme] [data-message-author-role] [data-testid="writing-block-container"][data-testid="writing-block-container"] [contenteditable="true"][class*="ProseMirror"] {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [data-testid="writing-block-container"] {
  --gptskins-writing-block-surface: color-mix(in srgb, var(--gptskins-surfaceStrong) 55%, var(--gptskins-surface)) !important;
  --oai-wb-surface-primary: var(--gptskins-writing-block-surface) !important;
  --oai-wb-surface-secondary: var(--gptskins-writing-block-surface) !important;
  --oai-wb-text-primary: var(--gptskins-text) !important;
  --oai-wb-divider: color-mix(in srgb, var(--gptskins-border) 55%, transparent) !important;
  background: var(--gptskins-writing-block-surface) !important;
  background-color: var(--gptskins-writing-block-surface) !important;
  background-image: none !important;
  border-color: color-mix(in srgb, var(--gptskins-border) 55%, transparent) !important;
  color: var(--gptskins-text) !important;
}

html[data-gptskins-theme] [data-testid="writing-block-container"][data-testid="writing-block-container"] :is([data-testid="writing-block-header-sticky-container"], [data-testid="writing-block-header-surface"], [class*="writing-block-editor"], [class*="ProseMirror"], [contenteditable="true"], textarea, [class*="bg-token-bg-primary"], [class*="dark:bg-"]) {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border-color: color-mix(in srgb, var(--gptskins-border) 55%, transparent) !important;
  color: var(--gptskins-text) !important;
}

html.dark[data-gptskins-theme] main button.btn-primary {
  --text-primary: var(--interactive-label-primary-default, #0d0d0d) !important;
  color: var(--interactive-label-primary-default, #0d0d0d) !important;
}

html.dark[data-gptskins-theme] main button.btn-primary :is(div, span, svg) {
  color: inherit !important;
}
`;
  }

  function ensureFontStyle(font) {
    let style = document.getElementById(fontStyleId);
    if (!style) {
      style = document.createElement("style");
      style.id = fontStyleId;
      document.documentElement.appendChild(style);
    }

    style.textContent = `
html[data-gptskins-font] {
  --gptskins-font-family: ${font.stack};
  --gptskins-text-font-family: ${font.textStack || font.stack};
  --gptskins-code-font-family: ${font.codeStack || font.stack};
}

html[data-gptskins-font] body,
html[data-gptskins-font] body *:not(:is(.katex, .katex *, math, math *, [role="math"], [role="math"] *)) {
  font-family: var(--gptskins-font-family) !important;
}

html[data-gptskins-font] body [data-message-author-role],
html[data-gptskins-font] body [data-message-author-role] *:not(:is(
  .katex,
  .katex *,
  math,
  math *,
  [role="math"],
  [role="math"] *,
  pre,
  pre *,
  code,
  code *,
  kbd,
  kbd *,
  samp,
  samp *,
  [data-gptskins-code-body],
  [data-gptskins-code-body] *,
  .cm-editor,
  .cm-editor *,
  .cm-scroller,
  .cm-scroller *,
  .cm-content,
  .cm-content *
)) {
  font-family: var(--gptskins-text-font-family) !important;
}

html[data-gptskins-font] body :is(pre, code, kbd, samp, [data-gptskins-code-body], .cm-editor, .cm-scroller, .cm-content),
html[data-gptskins-font] body :is(pre, code, kbd, samp, [data-gptskins-code-body], .cm-editor, .cm-scroller, .cm-content) * {
  font-family: var(--gptskins-code-font-family) !important;
}
`;
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

  function applySelectedTheme() {
    applyTheme(selectedThemeIds[getSystemThemeMode()]);
  }

  function setThemeSelection(mode, themeId) {
    if (mode !== "dark" && mode !== "light") {
      return;
    }

    selectedThemeIds[mode] = themeApi.getThemeForMode(themeId, mode).id;
    applySelectedTheme();
  }

  function applyTheme(themeId) {
    const theme = themeApi.getTheme(themeId || "default");
    const restoreScroll = captureScrollPositions();
    if (shouldBypassThemeForUrl()) {
      removeTheme();
      restoreScrollPosition(restoreScroll);
      return;
    }

    if (theme.id === "default") {
      removeTheme();
      restoreScrollPosition(restoreScroll);
      return;
    }

    ensureThemeStyle(theme);
    markThemeSwitching();
    const planPage = isPlanPage();
    syncSurfaceTags(planPage, true);
    if (planPage) {
      root.setAttribute("data-gptskins-plan-page", "true");
    } else {
      root.removeAttribute("data-gptskins-plan-page");
    }
    root.setAttribute("data-gptskins-theme", theme.id);
    startPageMarkerObserver();
    schedulePageMarker();
    restoreScrollPosition(restoreScroll);
  }

  function applyFont(fontId) {
    const font = themeApi.getFont(fontId || "default");
    selectedFontId = font.id;
    if (shouldBypassThemeForUrl() || font.id === "default") {
      removeFont();
      return;
    }

    ensureFontStyle(font);
    root.setAttribute("data-gptskins-font", font.id);
  }

  function scheduleRouteThemeSync() {
    clearTimeout(routeThemeTimer);
    routeThemeTimer = setTimeout(() => {
      applySelectedTheme();
      applyFont(selectedFontId);
    }, 80);
  }

  function startRouteThemeObserver() {
    if (routeThemeObserverStarted) {
      return;
    }
    routeThemeObserverStarted = true;

    const notifyRouteChange = () => {
      lastThemeRoute = location.href;
      scheduleRouteThemeSync();
    };
    ["pushState", "replaceState"].forEach((method) => {
      const original = history[method];
      if (typeof original !== "function") {
        return;
      }

      history[method] = function (...args) {
        const result = original.apply(this, args);
        notifyRouteChange();
        return result;
      };
    });

    window.addEventListener("popstate", notifyRouteChange);
    window.addEventListener("hashchange", notifyRouteChange);
    window.addEventListener("pageshow", notifyRouteChange);
    window.setInterval(() => {
      if (location.href === lastThemeRoute) {
        return;
      }
      notifyRouteChange();
    }, 500);
  }

  let pageMarkerTimer = 0;
  let pageMarkerObserver = null;
  let bodyReadyObserver = null;
  let pageMarkerEventListenersAdded = false;

  function isPlanPage() {
    if (location.hash === "#pricing") {
      return true;
    }

    const pageText = document.body ? document.body.innerText : "";
    const hasPlanHeading = pageText.includes("Choose your plan");
    const hasPlanAction =
      pageText.includes("Switch to Plus") ||
      pageText.includes("Upgrade to Pro") ||
      pageText.includes("ChatGPT Enterprise") ||
      pageText.includes("Manage my subscription");
    const hasPlanToggle = Boolean(
      document.querySelector('[aria-label*="Personal" i], [aria-label*="Business" i], [aria-label*="plan" i] [role="radio"]')
    );

    return hasPlanHeading && (hasPlanAction || hasPlanToggle);
  }

  function isFinancePage() {
    return location.hostname === "chatgpt.com" && normalizePath(location.pathname) === "/finances";
  }

  function syncPageMarker() {
    const planPage = isPlanPage();
    if (root.hasAttribute("data-gptskins-theme") && planPage) {
      root.setAttribute("data-gptskins-plan-page", "true");
    } else {
      root.removeAttribute("data-gptskins-plan-page");
    }

    if (root.hasAttribute("data-gptskins-theme") && isFinancePage()) {
      root.setAttribute("data-gptskins-finance-page", "true");
    } else {
      root.removeAttribute("data-gptskins-finance-page");
    }

    syncSurfaceTags(planPage);
  }

  function schedulePageMarker() {
    clearTimeout(pageMarkerTimer);
    pageMarkerTimer = setTimeout(syncPageMarker, 0);
  }

  function ensurePageMarkerEventListeners() {
    if (pageMarkerEventListenersAdded) {
      return;
    }

    pageMarkerEventListenersAdded = true;
    document.addEventListener("scroll", schedulePageMarker, { passive: true });
    window.addEventListener("resize", schedulePageMarker, { passive: true });
  }

  function startPageMarkerObserver() {
    ensurePageMarkerEventListeners();

    if (pageMarkerObserver) {
      return;
    }

    if (document.body) {
      pageMarkerObserver = new MutationObserver(schedulePageMarker);
      pageMarkerObserver.observe(document.body, { childList: true, subtree: true });
      if (bodyReadyObserver) {
        bodyReadyObserver.disconnect();
        bodyReadyObserver = null;
      }
      schedulePageMarker();
      return;
    }

    if (!bodyReadyObserver && document.documentElement) {
      bodyReadyObserver = new MutationObserver(startPageMarkerObserver);
      bodyReadyObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  function stopPageMarkerObserver() {
    clearTimeout(pageMarkerTimer);
    if (pageMarkerObserver) {
      pageMarkerObserver.disconnect();
      pageMarkerObserver = null;
    }
    if (bodyReadyObserver) {
      bodyReadyObserver.disconnect();
      bodyReadyObserver = null;
    }
    if (pageMarkerEventListenersAdded) {
      document.removeEventListener("scroll", schedulePageMarker);
      window.removeEventListener("resize", schedulePageMarker);
      pageMarkerEventListenersAdded = false;
    }
  }

  function normalizedText(item) {
    return (item.textContent || "").replace(/\s+/g, " ").trim();
  }

  function clearTags(names) {
    document.querySelectorAll(names.map((name) => `[${name}]`).join(", ")).forEach((item) => {
      names.forEach((name) => item.removeAttribute(name));
    });
  }

  function clearSurfaceTags() {
    clearTags([...codeSurfaceTags, "data-gptskins-plan-layer", ...dynamicSurfaceTags]);
  }

  function tagCodeBody(item) {
    if (!item) {
      return;
    }

    item.setAttribute("data-gptskins-code-body", "true");
    const scrollTargets = [item, ...item.querySelectorAll(".cm-scroller, .cm-content, pre, code")];
    const hasHorizontalOverflow = scrollTargets.some((target) => target.scrollWidth > target.clientWidth + 2);
    if (hasHorizontalOverflow) {
      item.setAttribute("data-gptskins-code-scrollable", "true");
    } else {
      item.removeAttribute("data-gptskins-code-scrollable");
    }
  }

  function tagSidebarActions() {
    const sidebarActions = document.querySelectorAll(
      "nav a, nav button, aside a, aside button, [data-testid='history-panel'] a, [data-testid='history-panel'] button, [data-testid='left-sidebar'] a, [data-testid='left-sidebar'] button"
    );

    sidebarActions.forEach((item) => {
      const text = normalizedText(item);
      const lowerText = text.toLowerCase();
      const href = item.getAttribute("href") || "";
      const isLibrary = item.matches("a") && (lowerText.startsWith("library") || /\/library(?:[/?#]|$)/.test(href));
      const isSearchChats = item.matches("button") && lowerText.startsWith("search chats");

      if (isLibrary) {
        item.setAttribute("data-gptskins-sidebar-action", "library");
      } else if (isSearchChats) {
        item.setAttribute("data-gptskins-sidebar-action", "search");
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

  function tagFloatingScrollButtons(composerRect) {
    if (!composerRect) {
      return;
    }

    document.querySelectorAll("button, [role='button'], :is(div, span)[class*='cursor-pointer']").forEach((item) => {
      if (item.closest("[data-testid='composer'], form[class*='composer'], [class*='group/composer']")) {
        return;
      }
      if (item.closest("[data-sidebar-item], nav, aside, [data-testid='history-panel'], [data-testid='left-sidebar']")) {
        return;
      }

      const rect = item.getBoundingClientRect();
      const width = Math.max(rect.width, item.clientWidth, item.offsetWidth);
      const height = Math.max(rect.height, item.clientHeight, item.offsetHeight);
      const className = typeof item.className === "string" ? item.className : "";
      const label = `${item.getAttribute("aria-label") || ""} ${item.getAttribute("data-testid") || ""} ${item.getAttribute("title") || ""} ${normalizedText(item)}`.toLowerCase();
      const isCompact = width >= 24 && width <= 54 && height >= 24 && height <= 54;
      const hasIcon = Boolean(item.querySelector("svg"));
      const isViewportCenter = rect.left >= window.innerWidth * 0.25 && rect.right <= window.innerWidth * 0.75;
      const hasScrollSignal = /(scroll|bottom|down)/.test(label) || /(scroll-root|thread-scroll|bottom-\[|start-1\/2|translate-x-1\/2)/.test(className);
      const isFloatingRoundIcon = hasIcon && /rounded-full/.test(className) && /(absolute|fixed|sticky|bottom|start-1\/2|translate-x-1\/2)/.test(className);
      const isAboveComposer =
        (rect.left >= composerRect.left || isViewportCenter) &&
        (rect.right <= composerRect.right || isViewportCenter) &&
        rect.bottom <= composerRect.top + 24 &&
        rect.bottom >= composerRect.top - 180;

      if (isCompact && hasIcon && (hasScrollSignal || (isAboveComposer && isFloatingRoundIcon))) {
        item.setAttribute("data-gptskins-scroll-button", "true");
      }
    });
  }

  function syncSurfaceTags(isPlanPage, force = false) {
    if (!force && !root.hasAttribute("data-gptskins-theme")) {
      clearSurfaceTags();
      return;
    }

    document.querySelectorAll(":is(h1, h2, h3, h4, h5, h6, p, hr)[data-gptskins-code-header]").forEach((item) => {
      item.removeAttribute("data-gptskins-code-header");
    });
    clearTags([...codeSurfaceTags, ...dynamicSurfaceTags]);
    tagSidebarActions();
    const composer = document.querySelector("[data-testid='composer'], form[class*='composer'], [class*='group/composer']");
    const composerRect = composer ? composer.getBoundingClientRect() : null;
    tagFloatingScrollButtons(composerRect);
    if (composerRect) {
      document.querySelectorAll("body *").forEach((item) => {
        if (item.closest("[data-message-author-role], pre, code")) {
          return;
        }

        const rect = item.getBoundingClientRect();
        if (rect.width < composerRect.width * 0.65 || rect.height < 45) {
          return;
        }

        const nearComposer = rect.top >= composerRect.top - 8 && rect.top <= composerRect.bottom + 16;
        const hasBlackBackground = getComputedStyle(item).backgroundColor === "rgb(0, 0, 0)";
        if (nearComposer && hasBlackBackground) {
          item.setAttribute("data-gptskins-suggestion-layer", "true");
        }
      });
    }

    document.querySelectorAll("[data-message-author-role] pre").forEach((pre) => {
      if (pre.closest(".cm-editor, .cm-scroller")) {
        return;
      }

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
        const body = children.find((child) => child !== header && (child.querySelector("pre, code, .cm-editor, .cm-scroller") || /(^|\s)(relative|overflow|pe-11|pt-3)(\s|$)/.test(child.getAttribute("class") || "")));

        pre.setAttribute("data-gptskins-code-frame", "true");
        nestedRoundedBlock.setAttribute("data-gptskins-code-block", "true");
        if (header && !header.matches("h1, h2, h3, h4, h5, h6, p, hr")) {
          header.setAttribute("data-gptskins-code-header", "true");
        }
        tagCodeBody(body);
        return;
      }

      if (embeddedBlock && /(contain-inline-size|group\/code|rounded)/.test(embeddedClass)) {
        pre.setAttribute("data-gptskins-code-frame", "true");
        embeddedBlock.setAttribute("data-gptskins-code-block", "true");

        const header = embeddedBlock.firstElementChild;
        if (header && !header.matches("h1, h2, h3, h4, h5, h6, p, hr")) {
          header.setAttribute("data-gptskins-code-header", "true");
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

      block.setAttribute("data-gptskins-code-block", "true");

      const frame = block.parentElement;
      const frameClass = frame ? frame.getAttribute("class") || "" : "";
      if (frame && !frame.matches("[data-message-author-role]") && /(bg-|border|rounded|ring|shadow|overflow)/.test(frameClass)) {
        frame.setAttribute("data-gptskins-code-frame", "true");
      }

      tagCodeBody(pre);

      if (pre.parentElement && pre.parentElement !== block) {
        pre.parentElement.setAttribute("data-gptskins-code-body-shell", "true");
      }

      const header = pre.previousElementSibling || block.firstElementChild;
      if (header && header !== pre && !header.contains(pre) && !header.matches("h1, h2, h3, h4, h5, h6, p, hr")) {
        header.setAttribute("data-gptskins-code-header", "true");
      }
    });

    document.querySelectorAll("[data-gptskins-plan-layer]").forEach((item) => item.removeAttribute("data-gptskins-plan-layer"));
    if (!isPlanPage) {
      return;
    }

    tagPlanControls();

    document.querySelectorAll("body *").forEach((item) => {
      const styles = getComputedStyle(item);
      const beforeStyles = getComputedStyle(item, "::before");
      const afterStyles = getComputedStyle(item, "::after");
      const rect = item.getBoundingClientRect();
      const hasBlackPaint = (style) =>
        style.backgroundColor === "rgb(0, 0, 0)" ||
        style.backgroundImage.includes("gradient") ||
        style.boxShadow.includes("rgb(0, 0, 0)");
      const hasVisiblePseudo = (style) => style.content !== "none" && style.display !== "none";
      const isBlackLayer =
        (hasBlackPaint(styles) ||
          (hasVisiblePseudo(beforeStyles) && hasBlackPaint(beforeStyles)) ||
          (hasVisiblePseudo(afterStyles) && hasBlackPaint(afterStyles))) &&
        rect.width > window.innerWidth * 0.5 &&
        rect.height > 20 &&
        rect.top > window.innerHeight * 0.45;

      if (isBlackLayer && !item.closest("button, a")) {
        item.setAttribute("data-gptskins-plan-layer", "true");
      }
    });
  }

  function loadStoredSettings() {
    chrome.storage.sync.get(
      [themeApi.storageKey, themeApi.themeStorageKeys.dark, themeApi.themeStorageKeys.light, themeApi.fontStorageKey],
      (result) => {
        selectedThemeIds = themeApi.resolveThemeSelections(result);
        selectedFontId = themeApi.getFont(result[themeApi.fontStorageKey] || "default").id;

        const migratedSettings = {};
        for (const mode of ["dark", "light"]) {
          const storageKey = themeApi.themeStorageKeys[mode];
          if (result[storageKey] !== selectedThemeIds[mode]) {
            migratedSettings[storageKey] = selectedThemeIds[mode];
          }
        }
        if (Object.keys(migratedSettings).length) {
          chrome.storage.sync.set(migratedSettings);
        }

        applySelectedTheme();
        applyFont(selectedFontId);
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
    if (message && message.type === "GPTSKINS_APPLY_FONT") {
      applyFont(message.fontId);
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
    }
    if (areaName === "sync" && changes[themeApi.fontStorageKey]) {
      applyFont(changes[themeApi.fontStorageKey].newValue);
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
