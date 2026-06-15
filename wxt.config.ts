import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "EleSpy - Elementor Spy & Exporter",
    version: "1.0.0",
    description:
      "Detect WordPress/Elementor, extract styles, export/import Elementor kits",
    permissions: ["activeTab", "scripting", "storage", "clipboardWrite"],
    host_permissions: ["<all_urls>"],
    action: {
      default_title: "EleSpy",
    },
    background: {
      type: "module",
    },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: [":content_script"],
        run_at: "document_idle",
      },
    ],
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
  modules: ["@wxt-dev/module-react"],
});
