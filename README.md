<div align="center">

<img src="https://img.shields.io/badge/EleSpy-v1.0.0-6A0DAD?style=for-the-badge&logo=elementor&logoColor=white" alt="EleSpy" />

# 🔍 EleSpy

### Elementor Spy & Exporter

**Detect · Extract · Export · Import**

A powerful browser extension for reverse-engineering Elementor-powered WordPress sites —  
extract global styles, colors, typography, and export them as ready-to-import Elementor Kits.

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WXT Framework](https://img.shields.io/badge/WXT-0.17-7C3AED?style=flat-square)](https://wxt.dev/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![Firefox](https://img.shields.io/badge/Firefox-Supported-FF7139?style=flat-square&logo=firefox&logoColor=white)](https://www.mozilla.org/firefox/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](LICENSE)

</div>

---

## 📖 Overview

**EleSpy** is a browser extension built for WordPress developers and designers who work with [Elementor](https://elementor.com/). It lets you inspect any Elementor-powered site, extract its complete design system (colors, typography, CSS variables), and export everything as a standard Elementor Kit — ready to import into your own project in seconds.

> **Use case:** You're building a site inspired by an existing Elementor design. Instead of manually copying colors and fonts one by one, EleSpy extracts the full design token set and packages it into an importable Kit JSON.

---

## ✨ Features

| Category | Capability |
|---|---|
| 🌐 **Server Intelligence** | Detect server type, CDN provider, SSL/TLS status |
| 📦 **CMS Detection** | Identify WordPress version and installation details |
| ⚡ **Elementor Detection** | Detect Elementor version, Kit ID, and Pro license status |
| 🎨 **Style Extraction** | Extract global colors, typography scales, and all CSS variables |
| 📤 **Kit Export** | Generate a full Elementor Kit JSON file for direct import |
| 🖌️ **CSS Export** | Download extracted CSS variables as a standalone stylesheet |
| 📋 **Clipboard Support** | Copy Kit JSON or CSS directly to clipboard |
| 📚 **Import Guide** | Built-in step-by-step instructions for all import methods |

---

## 🚀 Installation

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- npm ≥ 9

### Chrome / Chromium

```bash
git clone https://github.com/Hordekiller/EleSpy.git
cd EleSpy
npm install
npm run build:chrome
```

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the generated `dist/` folder

### Firefox

```bash
npm run build:firefox
```

1. Open `about:debugging`
2. Click **This Firefox**
3. Click **Load Temporary Add-on**
4. Select `manifest.json` inside the `dist/` folder

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start dev server (Chrome, with HMR)
npm run dev

# Start dev server (Firefox)
npm run dev:firefox

# Production build
npm run build:chrome
npm run build:firefox
npm run build:all          # Both targets

# Package as .zip for store submission
npm run zip:chrome
npm run zip:firefox
npm run zip:all

# Code quality
npm run lint               # ESLint check
npm run lint:fix           # Auto-fix lint issues
npm run format             # Prettier format
npm run typecheck          # TypeScript type check
npm run test               # Vitest unit tests
```

---

## 📐 Project Structure

```
EleSpy/
├── src/
│   ├── background/        # Service worker / background script
│   ├── content/           # Content scripts injected into pages
│   ├── popup/             # Extension popup UI
│   ├── sidepanel/         # Side panel for detailed analysis
│   └── utils/             # Shared detection & extraction utilities
├── wxt.config.ts          # WXT framework configuration
├── tsconfig.json
└── package.json
```

---

## 🧭 Usage

1. **Navigate** to any WordPress site running Elementor
2. **Click** the EleSpy icon in your browser toolbar
3. **View** the detected server, CMS, and Elementor metadata in the popup
4. **Click "Extract Styles"** to analyze global colors, typography, and CSS variables
5. **Open the Side Panel** for full analysis details and export controls
6. **Export** as Kit JSON or CSS — or copy directly to clipboard

---

## 📤 Export & Import Options

### Exporting from EleSpy

| Format | Description |
|---|---|
| **Kit JSON** | Complete Elementor Kit — import directly via WordPress admin |
| **CSS Variables** | Raw CSS custom properties for manual integration |
| **Clipboard** | Copy either format instantly, no file download needed |

### Importing into Elementor

<details>
<summary><strong>Method 1 — Elementor Kit Import (Recommended)</strong></summary>

1. Download the **Kit JSON** from EleSpy
2. Go to **WordPress Admin → Elementor → Tools → Import/Export Kit**
3. Click **Import Kit**
4. Select the downloaded `.json` file
5. Choose which global settings to apply and click **Import**

</details>

<details>
<summary><strong>Method 2 — Elementor Custom CSS</strong></summary>

1. Copy the **CSS Variables** from EleSpy
2. Go to **WordPress Admin → Elementor → Settings → Custom CSS**
3. Paste the CSS variables
4. Save changes

</details>

<details>
<summary><strong>Method 3 — Theme Customizer</strong></summary>

1. Copy the **CSS Variables** from EleSpy
2. Go to **Appearance → Customize → Additional CSS**
3. Paste the variables
4. Click **Publish**

</details>

---

## 🔐 Permissions

| Permission | Reason |
|---|---|
| `activeTab` | Read the current page to detect Elementor and extract styles |
| `scripting` | Inject content scripts for DOM analysis |
| `storage` | Persist settings and cached extraction results |
| `clipboardWrite` | Copy Kit JSON or CSS to clipboard |
| `sidePanel` | Open the detailed analysis panel |

> EleSpy does **not** collect, transmit, or store any data externally. All processing happens locally in your browser.

---

## 🏗️ Tech Stack

| Tool | Role |
|---|---|
| [WXT](https://wxt.dev/) | Cross-browser extension framework (Manifest V3) |
| [TypeScript 5.4](https://www.typescriptlang.org/) | Type-safe development |
| [webext-bridge](https://github.com/nicolo-ribaudo/webext-bridge) | Messaging between extension contexts |
| [Vitest](https://vitest.dev/) | Unit testing |
| [ESLint + Prettier](https://eslint.org/) | Code quality & formatting |
| [Husky + lint-staged](https://typicode.github.io/husky/) | Pre-commit hooks |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

```bash
# Fork the repo, then:
git clone https://github.com/YOUR_USERNAME/EleSpy.git
cd EleSpy
npm install
npm run dev
```

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes and write tests if applicable
3. Run `npm run lint && npm run typecheck && npm run test`
4. Commit: `git commit -m "feat: description of your change"`
5. Push and open a **Pull Request**

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📋 Changelog

### v1.0.0 — Initial Release

- ✅ Server & CDN detection
- ✅ WordPress & Elementor CMS detection
- ✅ Elementor version, Kit ID, and Pro status detection
- ✅ Global colors, typography, and CSS variable extraction
- ✅ Elementor Kit JSON export
- ✅ CSS export and clipboard support
- ✅ Built-in import instructions

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

Made with ❤️ for the WordPress & Elementor community

[Report a Bug](https://github.com/Hordekiller/EleSpy/issues) · [Request a Feature](https://github.com/Hordekiller/EleSpy/issues) · [Discussions](https://github.com/Hordekiller/EleSpy/discussions)

</div>
