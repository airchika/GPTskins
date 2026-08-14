(function () {
  "use strict";

  const scrollGuardEnabledStorageKey = "gptskins.scrollGuard.enabled";
  const latexCopyEnabledStorageKey = "gptskins.latexCopy.enabled";
  const latexTexEnabledStorageKey = "gptskins.latexCopy.tex.enabled";
  const defaultScrollGuardEnabled = true;
  const defaultLatexCopyEnabled = true;
  const defaultLatexTexEnabled = true;
  const scrollBottomGapThreshold = 150;
  const scrollGuardDuration = 2000;
  const latexFormats = Object.freeze({
    tex: "tex",
    inline: "inline",
    display: "display"
  });

  function stripMathDelimiters(value) {
    let source = typeof value === "string" ? value.trim() : "";
    const delimiterPairs = [
      ["$$", "$$"],
      ["\\[", "\\]"],
      ["\\(", "\\)"],
      ["$", "$"]
    ];

    for (const [opening, closing] of delimiterPairs) {
      if (source.startsWith(opening) && source.endsWith(closing) && source.length > opening.length + closing.length) {
        source = source.slice(opening.length, -closing.length).trim();
        break;
      }
    }
    return source;
  }

  function formatLatex(value, format = latexFormats.tex) {
    const source = stripMathDelimiters(value);
    if (!source) {
      return "";
    }
    if (format === latexFormats.inline) {
      return `$${source}$`;
    }
    if (format === latexFormats.display) {
      return `$$${source}$$`;
    }
    return source;
  }

  function resolveLatexSource(...sources) {
    for (const source of sources) {
      const resolved = stripMathDelimiters(source);
      if (resolved) {
        return resolved;
      }
    }
    return "";
  }

  function dedupeNestedFormulaCandidates(candidates, getParent, isFormula) {
    return Array.from(candidates || []).filter((candidate) => {
      for (let parent = getParent(candidate); parent; parent = getParent(parent)) {
        if (isFormula(parent)) {
          return false;
        }
      }
      return true;
    });
  }

  function getBottomGap(metrics) {
    if (!metrics) {
      return 0;
    }
    const scrollHeight = Number(metrics.scrollHeight) || 0;
    const clientHeight = Number(metrics.clientHeight) || 0;
    const scrollTop = Number(metrics.scrollTop) || 0;
    return Math.max(0, scrollHeight - clientHeight - scrollTop);
  }

  function shouldPreserveSubmitPosition(metrics, enabled = true) {
    return Boolean(enabled && getBottomGap(metrics) > scrollBottomGapThreshold);
  }

  globalThis.GPTskinsTools = {
    scrollGuardEnabledStorageKey,
    latexCopyEnabledStorageKey,
    latexTexEnabledStorageKey,
    defaultScrollGuardEnabled,
    defaultLatexCopyEnabled,
    defaultLatexTexEnabled,
    scrollBottomGapThreshold,
    scrollGuardDuration,
    latexFormats,
    stripMathDelimiters,
    formatLatex,
    resolveLatexSource,
    dedupeNestedFormulaCandidates,
    getBottomGap,
    shouldPreserveSubmitPosition
  };
})();
