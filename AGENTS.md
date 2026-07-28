# Codex Agent Notes

## Project
- GPTskins is a dependency-free Manifest V3 extension for theming ChatGPT.
- Use `GPTskins`, `GPTSKINS`, and `gptskins` for APIs, message types, storage keys, attributes, and CSS variables.
- Keep README screenshots in `docs/screenshots/` and display them as small HTML thumbnails.
- Keep changes surgical. Prefer one targeted selector or tag over broad CSS guesses.
- No build step. Validate content script syntax with `node --check content/content.js`.

## ChatGPT Theming Gotchas
- When screenshots and headless Chrome disagree, use the visible Chrome window with remote debugging and inspect computed styles from the live DOM.
- ChatGPT markup changes often. Prefer stable hooks like `data-testid`, `role`, `aria-*`, and our `data-gptskins-*` tags over brittle Tailwind class chains.
- After content script edits, reload the unpacked extension and refresh ChatGPT before judging visuals.

## Known Surfaces
- Default is a pass-through theme. Its popup swatches should stay simple black/white, but do not make Default inject CSS unless Dylan explicitly asks.
- The top-right conversation action bar is `#conversation-header-actions`; its `translucent-surface` background can stay black when the page-header wrappers change, so theme that stable id directly instead of relying on a direct-child selector.
- Custom font rules may separate global UI, `[data-message-author-role]` text, and code stacks; they must exclude `.katex`, MathML `math`, and `[role="math"]` trees so LaTeX keeps its native math fonts, while code stacks belong on `pre`, `code`, `kbd`, `samp`, GPTskins code bodies, and CodeMirror surfaces.
- Code blocks are nested inside `pre`; the visible frame may be a parent wrapper. Use `syncSurfaceTags()` and the `data-gptskins-code-frame`, `data-gptskins-code-block`, `data-gptskins-code-header`, and `data-gptskins-code-body` attributes instead of piling on more generic code selectors.
- Never let headings/paragraphs/hr become `data-gptskins-code-header`. Theme switches can leave stale tags, so `syncSurfaceTags()` must strip that attribute from `h1`-`h6`, `p`, and `hr`.
- Code body/draft snippets need horizontal scrolling. Do not leave every code wrapper on `overflow: hidden`; ensure `data-gptskins-code-body` keeps `overflow-x: auto`.
- Newer ChatGPT code blocks may put the whole rounded code card as the first child inside `pre`. In that case the outer `pre` is only a transparent frame; tag the inner rounded card/header/body instead or the theme paints a square rectangle behind it.
- Code block headers can have a sticky wrapper plus an inner `bg-token-bg-elevated-secondary` flex row. Round the inner painted row too; otherwise the word `Python` sits on a square strip.
- If an early header patch does not work, check later broad token rules like `pre [class*="bg-token-bg-elevated-secondary"]`; later rules must carry the same radius/overflow or they win the cascade.
- The desired shape is the whole code card, not just the header/body. For `pre.overflow-visible.px-0` blocks, round the inner `border-token-border-light ... rounded` / `overflow-clip ... rounded` card itself.
- If the rounded card is nested below a wrapper inside `pre`, make the outer `pre.overflow-visible.px-0:has(...)` transparent; otherwise it paints a square rectangle behind the rounded card.
- For normal code snippets, only the real `pre` should get `data-gptskins-code-body`. Parent wrappers should use `data-gptskins-code-body-shell` so they clip/clear backgrounds without drawing a second rectangular border around the rounded snippet.
- Some draft/code examples are CodeMirror, not plain `pre`. The scroll owner is `.cm-scroller`; use forced horizontal `scroll`, not `auto`, when the visible scrollbar affordance matters. Never tag `.cm-editor` internals as GPTskins code blocks. The shell can be `.pe-11.pt-3` inside an `overflow-clip` elevated surface.
- CodeMirror email/message snippets should not draw their own inner rounded border. Keep `.cm-editor`, `.cm-scroller`, and `.cm-content` transparent, borderless, radiusless, and outline-free; the outer shell owns the shape.
- If CodeMirror still shows an inner line, hide the `.pe-11.pt-3 .cm-editor[class*="cm-"]` `border-color` and `outline-color`; do not change snippet layout.
- Markdown tables need explicit primary text, opaque header/cell descendants, and a stronger border mix. Light themes can leave table headers, copy icons, and row dividers on near-white ChatGPT token colors.
- Recharts axes and grid lines are SVG attributes/classes, not normal text tokens. Set `.recharts-text`/axis tick `fill` plus grid/axis `stroke` for light theme contrast.
- When adding dark themes in `shared/themes.js`, also add their ids to `darkThemeIds` in `content/content.js` so browser-native controls and scrollbars use dark color-scheme.
- Writing/edit blocks use `data-testid="writing-block-container"`, `data-testid="writing-block-header-surface"`, `.writing-block-editor`, `.ProseMirror`, and `[contenteditable="true"]`.
- The global `[contenteditable="true"]` composer rule can accidentally recolor writing/edit blocks. Put writing-block overrides later and make the outer and inner surfaces the same color.
- The writing-block Edit button uses `data-testid="writing-block-header-magic-edit-button"` and can keep a dark token background in light themes. Set its background, text, border, icon, and hover colors explicitly.
- Composer suggestions can render outside normal popovers. Cover ARIA/listbox plus `suggest`/`autocomplete` class and test-id hooks so they do not stay hardcoded black.
- If composer suggestions still stay black, they may have no stable class/role. Use `data-gptskins-suggestion-layer` from a computed-style scan near the composer instead of broad page-wide black overrides.
- Current suggestion list markup can be `form.group/composer ... .top-full > div.bg-surface-primary > ul.divide-token-border-light > li`; style `.top-full .bg-surface-primary` directly because the black background lives on that parent.
- Composer icons can look too thick for the same reason as sidebar icons: broad SVG stroke rules affect plus, mic, and send icons. Scope lighter `stroke-width` and fill preservation to composer buttons, but do not force send/composer-submit backgrounds to `--gptskins-accent`; that is the theme palette accent, not the user's native ChatGPT account accent. Exclude submit/send/voice controls from generic transparent composer button and broad main button hover rules so ChatGPT's native accent circle shows through.
- The upgrade-plan black bar can be `.thread-bottom-container::after`, not a real div. Keep thread-bottom pseudo-elements transparent for all themed pages; use `data-gptskins-plan-layer` only as a fallback and do not exclude `[role="dialog"]` because the plan page itself is dialog-like.
- The upgrade-plan black bar can also be the plan modal panel itself, with classes like `bg-token-bg-primary ... bg-token-bg-elevated-secondary!`. On `html[data-gptskins-plan-page="true"]`, override the relevant token variables and targeted token background classes to `var(--gptskins-surface)`, not the outer background; light themes like Solar otherwise show the old black strip as a theme-colored band.
- Plan-page detection cannot rely only on a one-time body text scan. Content scripts may run at `document_start` before `document.body` exists, so start observation from `document.documentElement`, attach the body observer when available, and use heading/action signals such as `Switch to Plus`, `Upgrade to Pro`, `ChatGPT Enterprise`, or subscription links.
- When scanning plan layers for black paint, inspect `::before` and `::after` computed styles as well as the element background and shadow; the visible strip may be pseudo-element paint.
- Plan-page pricing controls need their own tags. The generic dialog/main button rules can erase the Personal/Business and 5x/20x segmented-control tracks plus the disabled `Upgrade to Pro` pill, so tag them with `data-gptskins-plan-toggle`, `data-gptskins-plan-toggle-option`, and `data-gptskins-plan-cta` instead of broadening all dialog button styles.
- Settings and voice UI live under `[role="dialog"]` or `[aria-modal="true"]`; switches and carousel dots need explicit contrast checks in light and dark themes.
- Sidebar `Pinned`/`Recents` headers should not get hover pills. Keep section-header controls and `data-trailing-button` / `__menu-item-trailing-btn` icon actions transparent; include `[class*="sidebar"]` because the live sidebar may not be a `nav`/`aside`.
- Keep the sidebar trailing-button transparent rule after the generic `main :is(button, a, [role="button"]):hover` rule, otherwise the later main hover rule repaints the square.
- If `data-trailing-button` computes transparent but the hover square remains, clear the direct flex wrapper `:has(> [data-trailing-button])` and trailing-button pseudo-elements too.
- Sidebar icons can look too thick if a broad SVG rule adds `stroke: currentColor` to fill-based glyphs. Keep sidebar fill icons `stroke: none` and only tune `stroke-width` on SVGs/elements that already declare a stroke.
- The bottom account row is `data-testid="accounts-profile-button"` and should keep hover/focus highlight, but not `[data-state="open"]` or it can stay highlighted after the menu closes.
- ChatGPT's live Recents/Pinned header class is `sidebar-expando-section-header` with the "o"; `sidebar-expand-section-header` does not match it.
- Do not use broad `[class*="sidebar"]` in rules that paint backgrounds. ChatGPT uses classes like `group/sidebar-expando-section-header`, and broad paint selectors create the fake hover square.
- Settings sidebar rows are dialog buttons/tabs. Keep default dialog buttons transparent and style only hover/active states, otherwise OG makes every sidebar row look selected and bubbly.
- Account/profile menus use `[role="menu"]` but not always `[role="menuitem"]`; hover styles must include menu-local `button`, `a`, and `[role="button"]` without touching sidebar section headers.
- Account/profile menu rows can also be direct Radix items like `role="menuitem" data-radix-collection-item data-testid="settings-menu-item"` without a useful `[role="menu"]` ancestor; style those directly.
- Account dropdowns are Radix portals (`data-radix-menu-content` / `data-radix-popper-content-wrapper`). Use portal-scoped `.__menu-item` / `[data-radix-collection-item]` hover rules for profile menu rows, not broad sidebar selectors.
- Radix submenu squared corners usually mean the outer `data-radix-popper-content-wrapper` is painted. Keep that wrapper transparent and put background, border, radius, shadow, and overflow on `data-radix-menu-content` / the inner `[role="menu"]`.
- If the bottom account row stays highlighted after closing the menu, reset `data-testid="accounts-profile-button"` when it is not `:hover` or `:focus-visible`; do not use `[data-state="open"]` as a paint trigger.
- If account/profile menu hover appears broken, compare computed menu background against the hover token. OG uses `#303030` for both composer/menu surfaces, so reuse of `surfaceStrong` can make hover invisible.

## Verification
- For visual fixes, verify computed styles on the exact live element, not just screenshots.
- Button color probes may need a short wait because ChatGPT uses transition classes; immediate computed styles can show the old color.
- Minimum checks before committing: `node --check content/content.js` and `git -c safe.directory=C:/Users/Dylan/Documents/extension diff --check`.
- Commit finished work; do not push unless Dylan asks.
