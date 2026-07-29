(function () {
  "use strict";

  function colors({
    background,
    surface,
    surfaceStrong,
    sidebar,
    sidebarText,
    sidebarMuted,
    sidebarHover,
    text,
    mutedText,
    border,
    accent,
    accentText,
    userBubble,
    assistantBubble,
    composer,
    shadow
  }) {
    return {
      background,
      surface,
      surfaceStrong: surfaceStrong || surface,
      sidebar: sidebar || surface,
      sidebarText: sidebarText || text,
      sidebarMuted: sidebarMuted || mutedText,
      sidebarHover: sidebarHover || surfaceStrong || surface,
      text,
      mutedText,
      border,
      accent,
      accentText,
      userBubble: userBubble || surfaceStrong || surface,
      assistantBubble: assistantBubble || surface,
      composer: composer || surfaceStrong || surface,
      shadow: shadow || "rgba(0, 0, 0, 0.32)"
    };
  }

  const themes = [
    {
      id: "default",
      name: "Default",
      description: "Native look.",
      swatches: ["#000000", "#ffffff"],
      colors: {}
    },
    {
      id: "og",
      name: "OG",
      description: "Classic charcoal.",
      dark: true,
      swatches: ["#212121", "#171717", "#303030"],
      colors: colors({
        background: "#212121",
        surface: "#212121",
        surfaceStrong: "#303030",
        sidebar: "#171717",
        text: "#f7f7f7",
        mutedText: "#b4b4b4",
        border: "#444444",
        accent: "#8ab4f8",
        accentText: "#101521",
        userBubble: "#303030"
      })
    },
    {
      id: "absolutely",
      name: "Absolutely",
      description: "Warm charcoal.",
      dark: true,
      swatches: ["#15130f", "#3a342c", "#d6b889"],
      colors: colors({
        background: "#15130f",
        surface: "#1d1a16",
        surfaceStrong: "#302a23",
        sidebar: "#11100d",
        text: "#f4eadb",
        mutedText: "#b9aa94",
        border: "#4b4034",
        accent: "#d6b889",
        accentText: "#17110a",
        userBubble: "#3a342c"
      })
    },
    {
      id: "ayu",
      name: "Ayu",
      description: "Golden dark.",
      dark: true,
      swatches: ["#0f1419", "#1f2430", "#ffb454"],
      colors: colors({
        background: "#0f1419",
        surface: "#14191f",
        surfaceStrong: "#1f2430",
        sidebar: "#0b1016",
        text: "#e6e1cf",
        mutedText: "#acb6bf",
        border: "#2d3640",
        accent: "#ffb454",
        accentText: "#1d1304",
        userBubble: "#243340"
      })
    },
    {
      id: "ayu-light",
      name: "Ayu Light",
      description: "Golden light.",
      swatches: ["#fafafa", "#f3f4f5", "#ffaa33"],
      colors: colors({
        background: "#fafafa",
        surface: "#ffffff",
        surfaceStrong: "#f3f4f5",
        sidebar: "#f4f5f6",
        sidebarText: "#5c6773",
        sidebarMuted: "#8a9199",
        sidebarHover: "#e9ecef",
        text: "#5c6773",
        mutedText: "#7d8790",
        border: "#d9dde1",
        accent: "#ffaa33",
        accentText: "#241400",
        userBubble: "#fff0d6",
        assistantBubble: "#ffffff",
        composer: "#f7f8f9",
        shadow: "rgba(92, 103, 115, 0.16)"
      })
    },
    {
      id: "catppuccin",
      name: "Catppuccin",
      description: "Pastel mocha.",
      dark: true,
      swatches: ["#1e1e2e", "#313244", "#cba6f7"],
      colors: colors({
        background: "#1e1e2e",
        surface: "#1e1e2e",
        surfaceStrong: "#313244",
        sidebar: "#181825",
        text: "#cdd6f4",
        mutedText: "#bac2de",
        border: "#45475a",
        accent: "#cba6f7",
        accentText: "#1e132d",
        userBubble: "#45475a"
      })
    },
    {
      id: "catppuccin-latte",
      name: "Catppuccin Latte",
      description: "Pastel light.",
      swatches: ["#eff1f5", "#e6e9ef", "#8839ef"],
      colors: colors({
        background: "#eff1f5",
        surface: "#ffffff",
        surfaceStrong: "#e6e9ef",
        sidebar: "#e6e9ef",
        sidebarText: "#4c4f69",
        sidebarMuted: "#7c7f93",
        sidebarHover: "#dce0e8",
        text: "#4c4f69",
        mutedText: "#6c6f85",
        border: "#ccd0da",
        accent: "#8839ef",
        accentText: "#ffffff",
        userBubble: "#e4d8fb",
        assistantBubble: "#ffffff",
        composer: "#f7f8fb",
        shadow: "rgba(76, 79, 105, 0.16)"
      })
    },
    {
      id: "codex",
      name: "Codex",
      description: "Blue graphite.",
      dark: true,
      swatches: ["#101014", "#1f2430", "#8ab4ff"],
      colors: colors({
        background: "#101014",
        surface: "#15171c",
        surfaceStrong: "#20242d",
        sidebar: "#0c0d11",
        text: "#f2f4f8",
        mutedText: "#a9b0bf",
        border: "#333947",
        accent: "#8ab4ff",
        accentText: "#071326",
        userBubble: "#263246"
      })
    },
    {
      id: "dracula",
      name: "Dracula",
      description: "Purple dark.",
      dark: true,
      swatches: ["#282a36", "#44475a", "#bd93f9"],
      colors: colors({
        background: "#282a36",
        surface: "#282a36",
        surfaceStrong: "#343746",
        sidebar: "#1f212b",
        text: "#f8f8f2",
        mutedText: "#c7cbe3",
        border: "#4f5268",
        accent: "#bd93f9",
        accentText: "#1b102a",
        userBubble: "#4b3675"
      })
    },
    {
      id: "everforest",
      name: "Everforest",
      description: "Muted green.",
      dark: true,
      swatches: ["#2b3339", "#323c41", "#a7c080"],
      colors: colors({
        background: "#2b3339",
        surface: "#2f383e",
        surfaceStrong: "#3a464c",
        sidebar: "#252d33",
        text: "#d3c6aa",
        mutedText: "#a7b09a",
        border: "#4f5b58",
        accent: "#a7c080",
        accentText: "#17210f",
        userBubble: "#3d4f3d"
      })
    },
    {
      id: "forest",
      name: "Forest",
      description: "Soft green.",
      swatches: ["#10251d", "#f4f0df", "#3f8f63"],
      colors: colors({
        background: "#f4f0df",
        surface: "#fffaf0",
        surfaceStrong: "#e7dfc6",
        sidebar: "#10251d",
        sidebarText: "#f7fff7",
        sidebarMuted: "#b8cbbf",
        sidebarHover: "#1a3529",
        text: "#18231d",
        mutedText: "#58685e",
        border: "#c9c0a6",
        accent: "#3f8f63",
        accentText: "#050805",
        userBubble: "#dcebd9",
        assistantBubble: "#fffaf0",
        composer: "#fffdf6",
        shadow: "rgba(31, 43, 34, 0.18)"
      })
    },
    {
      id: "everforest-light",
      name: "Everforest Light",
      description: "Calm green light.",
      swatches: ["#fdf6e3", "#efebd4", "#8da101"],
      colors: colors({
        background: "#fdf6e3",
        surface: "#fff9e8",
        surfaceStrong: "#efebd4",
        sidebar: "#ede6cf",
        sidebarText: "#5c6a72",
        sidebarMuted: "#829181",
        sidebarHover: "#e0dcc7",
        text: "#5c6a72",
        mutedText: "#708073",
        border: "#d3c6aa",
        accent: "#8da101",
        accentText: "#202500",
        userBubble: "#e7edc1",
        assistantBubble: "#fff9e8",
        composer: "#f8f1dc",
        shadow: "rgba(92, 106, 114, 0.16)"
      })
    },
    {
      id: "gruvbox",
      name: "Gruvbox",
      description: "Retro warm.",
      dark: true,
      swatches: ["#282828", "#3c3836", "#fabd2f"],
      colors: colors({
        background: "#282828",
        surface: "#282828",
        surfaceStrong: "#3c3836",
        sidebar: "#1d2021",
        text: "#fbf1c7",
        mutedText: "#d5c4a1",
        border: "#665c54",
        accent: "#fabd2f",
        accentText: "#1d2021",
        userBubble: "#504945"
      })
    },
    {
      id: "gruvbox-light",
      name: "Gruvbox Light",
      description: "Retro warm light.",
      swatches: ["#fbf1c7", "#ebdbb2", "#b57614"],
      colors: colors({
        background: "#fbf1c7",
        surface: "#fff7d6",
        surfaceStrong: "#ebdbb2",
        sidebar: "#ebdbb2",
        sidebarText: "#3c3836",
        sidebarMuted: "#7c6f64",
        sidebarHover: "#d5c4a1",
        text: "#3c3836",
        mutedText: "#665c54",
        border: "#d5c4a1",
        accent: "#b57614",
        accentText: "#1d1304",
        userBubble: "#ead8a1",
        assistantBubble: "#fff7d6",
        composer: "#f4e6b7",
        shadow: "rgba(60, 56, 54, 0.16)"
      })
    },
    {
      id: "github-dark",
      name: "GitHub Dark",
      description: "GitHub dark.",
      dark: true,
      swatches: ["#0d1117", "#161b22", "#2f81f7"],
      colors: colors({
        background: "#0d1117",
        surface: "#0d1117",
        surfaceStrong: "#161b22",
        sidebar: "#010409",
        text: "#c9d1d9",
        mutedText: "#8b949e",
        border: "#30363d",
        accent: "#2f81f7",
        accentText: "#0d1117",
        userBubble: "#1f2d3d",
        composer: "#161b22"
      })
    },
    {
      id: "linear",
      name: "Linear",
      description: "Focused violet.",
      dark: true,
      swatches: ["#08090c", "#181a20", "#5e6ad2"],
      colors: colors({
        background: "#08090c",
        surface: "#101116",
        surfaceStrong: "#181a20",
        sidebar: "#090a0d",
        text: "#f7f8f8",
        mutedText: "#a2a7b4",
        border: "#2c2f38",
        accent: "#5e6ad2",
        accentText: "#ffffff",
        userBubble: "#262b55"
      })
    },
    {
      id: "lobster",
      name: "Lobster",
      description: "Deep red.",
      dark: true,
      swatches: ["#15080b", "#36151b", "#ff5f57"],
      colors: colors({
        background: "#15080b",
        surface: "#1f0d12",
        surfaceStrong: "#36151b",
        sidebar: "#100608",
        text: "#ffecef",
        mutedText: "#d3a3ab",
        border: "#5c2b33",
        accent: "#ff5f57",
        accentText: "#260507",
        userBubble: "#4a1f26"
      })
    },
    {
      id: "material",
      name: "Material",
      description: "Cyan slate.",
      dark: true,
      swatches: ["#263238", "#37474f", "#80cbc4"],
      colors: colors({
        background: "#263238",
        surface: "#263238",
        surfaceStrong: "#37474f",
        sidebar: "#1f2a30",
        text: "#eeffff",
        mutedText: "#b0bec5",
        border: "#546e7a",
        accent: "#80cbc4",
        accentText: "#062421",
        userBubble: "#2f4b50"
      })
    },
    {
      id: "matrix",
      name: "Matrix",
      description: "Terminal green.",
      dark: true,
      swatches: ["#020403", "#07140b", "#00ff41"],
      colors: colors({
        background: "#020403",
        surface: "#050a06",
        surfaceStrong: "#07140b",
        sidebar: "#010201",
        text: "#d4ffd9",
        mutedText: "#78b987",
        border: "#1d5c2c",
        accent: "#00ff41",
        accentText: "#001a06",
        userBubble: "#0d3215",
        shadow: "rgba(0, 255, 65, 0.16)"
      })
    },
    {
      id: "monokai",
      name: "Monokai",
      description: "Neon classic.",
      dark: true,
      swatches: ["#272822", "#3e3d32", "#a6e22e"],
      colors: colors({
        background: "#272822",
        surface: "#2d2e27",
        surfaceStrong: "#3e3d32",
        sidebar: "#20211c",
        text: "#f8f8f2",
        mutedText: "#cfcfc2",
        border: "#555449",
        accent: "#a6e22e",
        accentText: "#111706",
        userBubble: "#3f4d24"
      })
    },
    {
      id: "night-owl",
      name: "Night Owl",
      description: "Blue night.",
      dark: true,
      swatches: ["#011627", "#0b2942", "#82aaff"],
      colors: colors({
        background: "#011627",
        surface: "#071d30",
        surfaceStrong: "#0b2942",
        sidebar: "#00111f",
        text: "#d6deeb",
        mutedText: "#a8b6c8",
        border: "#1d3b53",
        accent: "#82aaff",
        accentText: "#001326",
        userBubble: "#153956"
      })
    },
    {
      id: "nord",
      name: "Nord",
      description: "Arctic blue.",
      dark: true,
      swatches: ["#2e3440", "#3b4252", "#88c0d0"],
      colors: colors({
        background: "#2e3440",
        surface: "#2e3440",
        surfaceStrong: "#3b4252",
        sidebar: "#242933",
        text: "#eceff4",
        mutedText: "#c2cad8",
        border: "#4c566a",
        accent: "#88c0d0",
        accentText: "#142027",
        userBubble: "#3f5669"
      })
    },
    {
      id: "one",
      name: "One",
      description: "Atom dark.",
      dark: true,
      swatches: ["#282c34", "#21252b", "#61afef"],
      colors: colors({
        background: "#282c34",
        surface: "#282c34",
        surfaceStrong: "#21252b",
        sidebar: "#21252b",
        text: "#abb2bf",
        mutedText: "#8b93a1",
        border: "#3b4048",
        accent: "#61afef",
        accentText: "#0b1118",
        userBubble: "#2c313a"
      })
    },
    {
      id: "oscurange",
      name: "Oscurange",
      description: "Burnt orange.",
      dark: true,
      swatches: ["#120a04", "#2a1608", "#ff9d00"],
      colors: colors({
        background: "#120a04",
        surface: "#1d1007",
        surfaceStrong: "#2a1608",
        sidebar: "#0d0703",
        text: "#fff0dc",
        mutedText: "#d7ad7b",
        border: "#563015",
        accent: "#ff9d00",
        accentText: "#201000",
        userBubble: "#3d220d"
      })
    },
    {
      id: "raycast",
      name: "Raycast",
      description: "Red command.",
      dark: true,
      swatches: ["#1f1113", "#33191d", "#ff6363"],
      colors: colors({
        background: "#1f1113",
        surface: "#261518",
        surfaceStrong: "#33191d",
        sidebar: "#170c0e",
        text: "#fff1f1",
        mutedText: "#d8a9a9",
        border: "#593034",
        accent: "#ff6363",
        accentText: "#240606",
        userBubble: "#462126"
      })
    },
    {
      id: "rose-pine",
      name: "Rose Pine",
      description: "Soft dusk.",
      dark: true,
      swatches: ["#191724", "#26233a", "#ebbcba"],
      colors: colors({
        background: "#191724",
        surface: "#1f1d2e",
        surfaceStrong: "#26233a",
        sidebar: "#15131e",
        text: "#e0def4",
        mutedText: "#908caa",
        border: "#403d52",
        accent: "#ebbcba",
        accentText: "#21151b",
        userBubble: "#3a3048"
      })
    },
    {
      id: "rose",
      name: "Rose",
      description: "Rose plum.",
      swatches: ["#fff1f5", "#8a2c58", "#f47ca5"],
      colors: colors({
        background: "#fff1f5",
        surface: "#fffafd",
        surfaceStrong: "#f8d5e2",
        sidebar: "#301525",
        sidebarText: "#fff2f7",
        sidebarMuted: "#d3aabb",
        sidebarHover: "#462035",
        text: "#2b1420",
        mutedText: "#725568",
        border: "#e9b7ca",
        accent: "#c94679",
        accentText: "#ffffff",
        userBubble: "#f8d5e2",
        assistantBubble: "#fffafd",
        composer: "#fff8fb",
        shadow: "rgba(94, 25, 58, 0.18)"
      })
    },
    {
      id: "rose-pine-dawn",
      name: "Rose Pine Dawn",
      description: "Soft dawn.",
      swatches: ["#faf4ed", "#fffaf3", "#b4637a"],
      colors: colors({
        background: "#faf4ed",
        surface: "#fffaf3",
        surfaceStrong: "#f2e9e1",
        sidebar: "#f2e9e1",
        sidebarText: "#575279",
        sidebarMuted: "#797593",
        sidebarHover: "#e8dfd8",
        text: "#575279",
        mutedText: "#797593",
        border: "#dfdad9",
        accent: "#b4637a",
        accentText: "#090509",
        userBubble: "#f4dce4",
        assistantBubble: "#fffaf3",
        composer: "#f7efe8",
        shadow: "rgba(87, 82, 121, 0.16)"
      })
    },
    {
      id: "sentry",
      name: "Sentry",
      description: "Purple signal.",
      dark: true,
      swatches: ["#1f1830", "#302348", "#7553ff"],
      colors: colors({
        background: "#1f1830",
        surface: "#241b36",
        surfaceStrong: "#302348",
        sidebar: "#171224",
        text: "#f5f0ff",
        mutedText: "#b9abd3",
        border: "#4a3a63",
        accent: "#7553ff",
        accentText: "#ffffff",
        userBubble: "#3a2b62"
      })
    },
    {
      id: "solarized",
      name: "Solarized",
      description: "Low-contrast teal.",
      dark: true,
      swatches: ["#002b36", "#073642", "#b58900"],
      colors: colors({
        background: "#002b36",
        surface: "#073642",
        surfaceStrong: "#0c4653",
        sidebar: "#00212a",
        text: "#eee8d5",
        mutedText: "#93a1a1",
        border: "#25545f",
        accent: "#b58900",
        accentText: "#161100",
        userBubble: "#164b4f"
      })
    },
    {
      id: "solar",
      name: "Solar",
      description: "Warm light.",
      swatches: ["#fff6df", "#f2c14e", "#243447"],
      colors: colors({
        background: "#fff6df",
        surface: "#fffdf7",
        surfaceStrong: "#f7e3aa",
        sidebar: "#243447",
        sidebarText: "#fff8e8",
        sidebarMuted: "#d4c7a7",
        sidebarHover: "#314258",
        text: "#271f14",
        mutedText: "#6f604c",
        border: "#e0c783",
        accent: "#d89519",
        accentText: "#1d1405",
        userBubble: "#f8e7b6",
        assistantBubble: "#fffdf7",
        composer: "#fffaf0",
        shadow: "rgba(96, 70, 15, 0.2)"
      })
    },
    {
      id: "temple",
      name: "Temple",
      description: "High contrast green.",
      dark: true,
      swatches: ["#020202", "#151515", "#a3ff12"],
      colors: colors({
        background: "#020202",
        surface: "#090909",
        surfaceStrong: "#151515",
        sidebar: "#000000",
        text: "#f5ffe8",
        mutedText: "#b4c998",
        border: "#3b4d21",
        accent: "#a3ff12",
        accentText: "#081000",
        userBubble: "#1c3310",
        shadow: "rgba(163, 255, 18, 0.18)"
      })
    },
    {
      id: "tokyo-night",
      name: "Tokyo Night",
      description: "Neon night.",
      dark: true,
      swatches: ["#1a1b26", "#24283b", "#7aa2f7"],
      colors: colors({
        background: "#1a1b26",
        surface: "#1a1b26",
        surfaceStrong: "#24283b",
        sidebar: "#16161e",
        text: "#c0caf5",
        mutedText: "#a9b1d6",
        border: "#3b4261",
        accent: "#7aa2f7",
        accentText: "#101521",
        userBubble: "#283457"
      })
    },
    {
      id: "tokyo-night-day",
      name: "Tokyo Day",
      description: "Bright Tokyo.",
      swatches: ["#e1e2e7", "#d5d6db", "#2e7de9"],
      colors: colors({
        background: "#e1e2e7",
        surface: "#f2f3f7",
        surfaceStrong: "#d5d6db",
        sidebar: "#dfe0e5",
        sidebarText: "#3760bf",
        sidebarMuted: "#6172b0",
        sidebarHover: "#cfd1d8",
        text: "#3760bf",
        mutedText: "#6172b0",
        border: "#c4c8d4",
        accent: "#2e7de9",
        accentText: "#050914",
        userBubble: "#d5e4ff",
        assistantBubble: "#f2f3f7",
        composer: "#eaebf0",
        shadow: "rgba(55, 96, 191, 0.14)"
      })
    },
    {
      id: "xcode-dark",
      name: "Xcode Dark",
      description: "Mac editor dark.",
      dark: true,
      swatches: ["#1f1f24", "#2d2d34", "#4da3ff"],
      colors: colors({
        background: "#1f1f24",
        surface: "#24242a",
        surfaceStrong: "#2d2d34",
        sidebar: "#19191e",
        text: "#f5f5f7",
        mutedText: "#aaaab3",
        border: "#42424a",
        accent: "#4da3ff",
        accentText: "#061426",
        userBubble: "#26364c",
        composer: "#2a2a31"
      })
    }
  ];

  const themeAliases = {
    contrast: "temple",
    midnight: "night-owl",
    "one-dark": "one"
  };
  const darkThemeIds = new Set(themes.filter((theme) => theme.dark).map((theme) => theme.id));
  const fonts = [
    {
      id: "default",
      name: "Default",
      description: "Native ChatGPT font.",
      stack: ""
    },
    {
      id: "verdana",
      name: "Verdana",
      description: "Wide and readable.",
      stack: 'Verdana, Geneva, ui-sans-serif, system-ui, sans-serif'
    },
    {
      id: "georgia",
      name: "Georgia",
      description: "Polished serif text.",
      stack: 'Georgia, Cambria, "Times New Roman", Times, serif'
    },
    {
      id: "mono",
      name: "Mono",
      description: "Terminal-style text.",
      stack: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace'
    },
    {
      id: "sarasa-mono-sc",
      name: "Sarasa SC",
      description: "Sarasa UI, Noto text, JetBrains code.",
      stack: '"Sarasa UI SC", "Microsoft YaHei UI", "Microsoft YaHei", ui-sans-serif, sans-serif',
      textStack: '"Noto Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", ui-sans-serif, sans-serif',
      codeStack: '"JetBrains Mono", "Cascadia Mono", Consolas, "Liberation Mono", Menlo, monospace'
    }
  ];

  function getTheme(id) {
    const themeId = themeAliases[id] || id;
    return themes.find((theme) => theme.id === themeId) || themes[0];
  }

  function getFont(id) {
    return fonts.find((font) => font.id === id) || fonts[0];
  }

  globalThis.GPTskinsThemes = {
    storageKey: "gptskins.theme",
    fontStorageKey: "gptskins.font",
    themes,
    fonts,
    darkThemeIds,
    getTheme,
    getFont
  };
})();
