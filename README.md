# GPTskins

GPTskins is a completely free, open source, and dependency-free Manifest V3 browser extension that adds 35 custom themes, independent font controls, and lightweight local tools to ChatGPT.

Switch ChatGPT into popular editor-inspired themes like Catppuccin Latte, GitHub Dark, Tokyo Day, and Xcode Dark, or choose a different local font style.

## Preview

<table>
  <tr>
    <td><strong>OG</strong><br><img src="docs/screenshots/og-theme.png" width="1000" alt="GPTskins OG ChatGPT theme preview"></td>
    <td><strong>Midnight</strong><br><img src="docs/screenshots/midnight-theme.png" width="1000" alt="GPTskins Midnight theme preview"></td>
  </tr>
  <tr>
    <td><strong>One Dark</strong><br><img src="docs/screenshots/one-dark-theme.png" width="1000" alt="GPTskins One Dark theme preview"></td>
    <td><strong>Dracula</strong><br><img src="docs/screenshots/dracula-theme.png" width="1000" alt="GPTskins Dracula theme preview"></td>
  </tr>
</table>

## Features

- Popup settings for themes, fonts, and two independent tools.
- Adds 35 custom themes while preserving ChatGPT's Default look.
- Built-in themes: Default, Xcode Dark, Codex Absolutely, OG, Absolutely, Ayu, Ayu Light, Catppuccin, Catppuccin Latte, Codex, Dracula, Everforest, Forest, Everforest Light, Gruvbox, Gruvbox Light, GitHub Dark, Linear, Lobster, Material, Matrix, Monokai, Night Owl, Nord, One, Oscurange, Raycast, Rose Pine, Rose, Rose Pine Dawn, Sentry, Solarized, Solar, Temple, Tokyo Night, and Tokyo Day.
- Four independent font controls for the interface, body text, and two ordered code-font slots. Every control can preserve ChatGPT's Default font.
- Separate dark and light theme selections saved with `chrome.storage.sync`.
- Automatic system color-scheme switching plus theme and font loading on `chatgpt.com` and `chat.openai.com`.
- Reading-position protection that preserves an older visible turn only when a submission would otherwise jump more than 150px to the bottom.
- LaTeX quick copy with TeX, `$…$`, and `$$…$$` choices plus formula-aware mixed-selection copying.
- No backend, login, external API, or build step.

## Available Themes

- Xcode Dark
- Codex Absolutely
- OG
- Absolutely
- Ayu
- Ayu Light
- Catppuccin
- Catppuccin Latte
- Codex
- Dracula
- Everforest
- Forest
- Everforest Light
- Gruvbox
- Gruvbox Light
- GitHub Dark
- Linear
- Lobster
- Material
- Matrix
- Monokai
- Night Owl
- Nord
- One
- Oscurange
- Raycast
- Rose Pine
- Rose
- Rose Pine Dawn
- Sentry
- Solarized
- Solar
- Temple
- Tokyo Night
- Tokyo Day

## Available Fonts

- **Interface:** GPT Default or Sarasa UI SC.
- **Body:** GPT Default, Noto Sans SC, Noto Serif SC, or Sarasa Gothic SC.
- **Code font 1 and 2:** GPT Default, JetBrains Mono, Sarasa Mono SC, Fira Code, or Google Sans Code.

GPTskins uses installed local fonts and does not download or bundle font files. The two code choices form one ordered font stack, followed by the native system monospace fallbacks.

## Reading Position and LaTeX Copy

Both tools are enabled by default and can be switched independently from the **Tools** tab.

- **Keep reading position** activates only when a real composer form submission happens while the thread is more than 150px from the bottom. It keeps the currently visible turn anchored for at most two seconds, but cancels immediately when you use the wheel, touch scrolling, paging keys, the scrollbar, or ChatGPT's scroll-to-bottom control. Sending at the bottom remains fully native.
- **LaTeX quick copy** shows one small reusable toolbar that follows the active light or dark theme when you click a formula in an assistant response without an active text selection. Choose raw `tex`, inline `$…$`, or display `$$…$$` without changing ChatGPT's formula DOM. Inline copies collapse source line breaks and adjacent whitespace to one space so the result stays on one Markdown line. The raw `tex` choice can be hidden independently; `$…$` and `$$…$$` always remain available.
- The **去框 $** and **去框 $$** options copy inline and display formulas after removing complete outer `\boxed{…}` wrappers, including nested wrappers. Both trim whitespace inside the dollar delimiters and remove trailing commas and periods. Inline copies flatten line breaks; display copies preserve internal line breaks. The original copy options retain boxes; incomplete or partial-formula boxes are preserved.
- Copying a mixed selection containing assistant formulas writes both plain text and HTML, replacing inline and display formulas with the corresponding delimiters while preserving the rest of the selection. Ordinary text selections and ChatGPT's own whole-response copy button remain native.
- Formula source metadata is read locally from `data-math-source`, legacy `data-math`, or the KaTeX `application/x-tex` annotation. GPTskins does not read the clipboard, call a network service, import fonts, or patch global scrolling methods.

If GPT Voyager is installed, disable its **Formula Copy** and **Prevent Auto Scroll** features to avoid duplicate event handling.

## Load in Chrome or Edge

1. Clone or download the extension to a folder on your computer.

   ```
   git clone https://github.com/dboyza/GPTskins.git
   ```

   You can also use GitHub's **Code** > **Download ZIP** option and unzip it anywhere you like.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select the folder you cloned or unzipped.
6. Open ChatGPT, click the GPTskins toolbar icon, and choose a theme, font, or tool setting.

## Project Layout

- `manifest.json` defines the Manifest V3 extension.
- `shared/themes.js` contains the built-in theme and font definitions.
- `content/content.css` contains the static theme and font rules, while `content/content.js` applies variables and incremental surface tags.
- `tools/` contains reading-position protection, LaTeX copy, and the shared Tools popup controls.
- `popup/` contains the extension popup UI.
- `icons/` contains generated extension icons.
