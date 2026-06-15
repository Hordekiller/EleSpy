import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  manifest: {
    name: "EleSpy - Elementor Spy & Exporter",
    version: "1.0.0",
    description:
      "Detect WordPress/Elementor, extract styles, export/import Elementor kits",
    permissions: ["activeTab", "scripting", "storage", "clipboardWrite", "sidePanel"],
    host_permissions: ["<all_urls>"],
    action: {
      default_title: "EleSpy",
    },
    side_panel: {
      default_path: "panel.html",
    },
    background: {
      type: "module",
    },
    web_accessible_resources: [
      {
        resources: ["assets/*"],
        matches: ["<all_urls>"],
      },
    ],
  },
  runner: {
    binaries: {
      firefox: "/usr/bin/firefox",
    },
  },
});
