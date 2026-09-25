# Codex Agent Notes

## Project
- GPT Toolkit is a dependency-free Manifest V3 extension for local ChatGPT fonts and tools.
- Use `GPTToolkit`, `GPTTOOLKIT`, and `gpttoolkit` for APIs, messages, storage keys, attributes, and CSS variables. `gptskins.*` is only a legacy migration source.
- No theme engine or page paint/layout overrides. ChatGPT owns its appearance.
- Keep changes surgical and prefer stable `data-testid`, `role`, `aria-*` hooks over Tailwind class chains.
- No build step. Do not add runtime dependencies.

## Fonts and tools
- Preserve four independent font controls and ordered, deduplicated code-font slots.
- Default removes that role's overrides. Do not load or bundle fonts.
- Keep KaTeX, MathML and `[role="math"]` trees out of font overrides. Keep code separate from body fonts.
- Check plain `pre`/`code`, nested code cards and CodeMirror (`.cm-scroller`, `.cm-content`, `.cm-line`). Do not alter their layout or scrolling.
- New storage keys win over legacy values, including explicit Default and false. Do not delete legacy settings or read old theme settings.
- Keep one shared route polling fallback and immediate navigation signals. Tools consume `gpttoolkit:routechange` to clean transient state.
- Feature listeners must be registered/removed symmetrically when tools are enabled/disabled.
- Tool floating UI follows ChatGPT's native light/dark state without recoloring the page.

## Verification
- Run `node --check` for changed scripts, `node --test tests/*.test.js`, and `git diff --check` before committing.
- Synthetic browser fixtures are not live ChatGPT acceptance.
- After content-script edits, reload the unpacked extension and refresh ChatGPT before checking visuals. Inspect computed styles on the exact live element, not just screenshots.
- Keep README screenshots, if added, in `docs/screenshots/` as small HTML thumbnails.
- Commit finished work; do not push unless asked.
