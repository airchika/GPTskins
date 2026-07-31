# GPTskins

GPTskins is a completely free, open source, and dependency-free Manifest V3 browser extension that adds 34 custom themes and simple font switching to ChatGPT.

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

- Popup settings for themes, fonts, and the optional message queue.
- Adds 34 custom themes while preserving ChatGPT's Default look.
- Built-in themes: Default, OG, Absolutely, Ayu, Ayu Light, Catppuccin, Catppuccin Latte, Codex, Dracula, Everforest, Forest, Everforest Light, Gruvbox, Gruvbox Light, GitHub Dark, Linear, Lobster, Material, Matrix, Monokai, Night Owl, Nord, One, Oscurange, Raycast, Rose Pine, Rose, Rose Pine Dawn, Sentry, Solarized, Solar, Temple, Tokyo Night, Tokyo Day, and Xcode Dark.
- Built-in fonts: Default, Verdana, Georgia, Mono, Sarasa SC (Sarasa UI interface, Noto Sans messages, JetBrains Mono code), and Sarasa Mono SC (Sarasa UI interface, Sarasa Mono messages, JetBrains Mono code).
- Separate dark and light theme selections saved with `chrome.storage.sync`.
- Automatic system color-scheme switching plus theme and font loading on `chatgpt.com` and `chat.openai.com`.
- Optional message queue that submits user-written follow-ups serially through the visible ChatGPT composer.
- No backend, login, external API, or build step.

## Available Themes

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
- Xcode Dark

## Available Fonts

- Default
- Verdana
- Georgia
- Mono
- Sarasa SC (Sarasa UI interface, Noto Sans messages, JetBrains Mono code)
- Sarasa Mono SC (Sarasa UI interface, Sarasa Mono messages, JetBrains Mono code)

## Message Queue

The message queue is an independent module and is disabled by default. Enable it from the **Queue** tab in the extension popup. While ChatGPT is responding, type the next message in the official composer and press **Enter** to queue it. **Shift+Enter** still inserts a line break.

- Stores up to 10 pending prompts in `chrome.storage.local` on the current device.
- Shows Codex-style queued message cards directly above the official composer, with Edit and Remove actions.
- Sends only one prompt after the current response finishes.
- Never calls ChatGPT private APIs or reads assistant response text.
- Leaves normal idle-state Enter behavior entirely to ChatGPT.
- Keeps later drafts behind existing queued messages so they cannot jump the queue.
- Pauses on interrupted or unconfirmed submissions so you can review them before retrying.
- Does not bypass errors, usage limits, CAPTCHA, or other page checks.

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
6. Open ChatGPT, click the GPTskins toolbar icon, and choose a theme, font, or optional queue setting.

## Project Layout

- `manifest.json` defines the Manifest V3 extension.
- `shared/themes.js` contains the built-in theme and font definitions.
- `content/content.js` applies the selected theme and font on ChatGPT pages.
- `queue/` contains the optional message queue as a separate content-script module.
- `popup/` contains the extension popup UI.
- `icons/` contains generated extension icons.
