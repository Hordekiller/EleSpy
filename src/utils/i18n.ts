export type Lang = "fa" | "en";

const translations: Record<Lang, Record<string, string>> = {
  fa: {
    // Header
    "app.name": "EleSpy",
    "btn.refresh": "بروزرسانی",
    "btn.settings": "تنظیمات",

    // Tabs
    "tab.technologies": "تکنولوژی‌ها",
    "tab.elementor": "المنتور",
    "tab.export": "خروجی",
    "tab.import": "ورود",

    // Tech categories
    "cat.server": "سرور",
    "cat.cdn": "CDN",
    "cat.cms": "سیستم مدیریت محتوا",
    "cat.page-builder": "صفحه‌ساز",
    "cat.theme": "قالب",
    "cat.language": "زبان برنامه‌نویسی",
    "cat.js-framework": "فریمورک جاوااسکریپت",
    "cat.ui-library": "کتابخانه UI / CSS",
    "cat.library": "کتابخانه جاوااسکریپت",
    "cat.analytics": "آنالیتیکس",
    "cat.marketing": "مارکتینگ",
    "cat.fonts": "فونت‌ها و آیکون‌ها",
    "cat.hosting": "هاستینگ",
    "cat.not-detected": "تشخیص داده نشد",

    // Elementor
    "el.status": "وضعیت المنتور",
    "el.detected": "تشخیص",
    "el.pro": "پرو",
    "el.kit-id": "شناسه Kit",
    "el.global-colors": "رنگ‌های سراسری",
    "el.global-typography": "تایپوگرافی سراسری",
    "el.css-variables": "متغیرهای CSS",
    "el.copy-vars": "کپی همه متغیرها",

    // Export
    "export.full-export": "خروجی کامل",
    "export.full-export-desc": "استخراج تمام تنظیمات طراحی المنتور",
    "export.extract-all": "استخراج همه",
    "export.options": "گزینه‌های خروجی",
    "export.all-options": "همه گزینه‌ها",
    "export.colors": "رنگ‌های سراسری",
    "export.typography": "تایپوگرافی سراسری",
    "export.css-variables": "متغیرهای CSS",
    "export.widgets": "ویجت‌ها",
    "export.templates": "قالب صفحه",
    "export.custom-css": "CSS سفارشی",
    "export.copy": "کپی",
    "export.download": "دانلود",
    "export.template-json": "دانلود Template JSON",
    "export.kit-json": "دانلود Kit JSON",
    "export.css": "دانلود CSS",
    "export.copy-full": "کپی همه",
    "export.preview": "پیش‌نمایش",

    // Import
    "import.instructions": "راهنمای ورود",
    "import.quick-actions": "اقدامات سریع",
    "import.copy-kit": "کپی Kit برای ورود",
    "import.copy-instructions": "کپی راهنما",

    // Settings
    "settings.title": "تنظیمات",
    "settings.language": "زبان",
    "settings.theme": "ظاهر",
    "settings.dark-mode": "حالت تاریک",
    "settings.light-mode": "حالت روشن",
    "settings.auto-copy": "کپی خودکار",
    "settings.about": "درباره",
    "settings.version": "نسخه",
    "settings.author": "سازنده",

    // Notifications
    "notify.copied": "کپی شد!",
    "notify.downloaded": "دانلود شد!",
    "notify.extracted": "استخراج کامل شد!",
    "notify.error": "خطا",
    "notify.no-tab": "تب فعالی یافت نشد",
    "notify.detected": "بخش‌ها شناسایی شدند!",
    "notify.no-sections": "بخشی یافت نشد",

    // Export
    "export.live-selection": "انتخاب زنده بخش‌ها",
    "export.live-selection-desc": "انتخاب هدر، فوتر یا بخش خاص برای خروجی",
    "export.detect-sections": "شناسایی بخش‌ها",
    "export.no-sections": "بخش المنتوری یافت نشد",

    // General
    "general.yes": "بله",
    "general.no": "خیر",
    "general.none": "هیچ",
    "general.unknown": "نامشخص",
    "general.loading": "در حال بارگذاری...",
    "general.scanning": "در حال اسکن تکنولوژی‌ها...",
    "general.try-refresh": "صفحه را بروزرسانی کنید",
    "general.cors-restricted": "محدودیت CORS",
    "general.no-css-variables": "متغیر CSS یافت نشد",
    "general.no-colors": "رنگی یافت نشد",
    "general.no-typography": "تایپوگرافی یافت نشد",
  },
  en: {
    // Header
    "app.name": "EleSpy",
    "btn.refresh": "Refresh",
    "btn.settings": "Settings",

    // Tabs
    "tab.technologies": "Technologies",
    "tab.elementor": "Elementor",
    "tab.export": "Export",
    "tab.import": "Import",

    // Tech categories
    "cat.server": "Server",
    "cat.cdn": "CDN",
    "cat.cms": "CMS",
    "cat.page-builder": "Page Builder",
    "cat.theme": "Theme",
    "cat.language": "Programming Language",
    "cat.js-framework": "JavaScript Framework",
    "cat.ui-library": "UI Framework / CSS",
    "cat.library": "JavaScript Library",
    "cat.analytics": "Analytics",
    "cat.marketing": "Marketing",
    "cat.fonts": "Fonts & Icons",
    "cat.hosting": "Hosting",
    "cat.not-detected": "Not detected",

    // Elementor
    "el.status": "Elementor Status",
    "el.detected": "Detected",
    "el.pro": "Pro",
    "el.kit-id": "Kit ID",
    "el.global-colors": "Global Colors",
    "el.global-typography": "Global Typography",
    "el.css-variables": "CSS Variables",
    "el.copy-vars": "Copy All Variables",

    // Export
    "export.full-export": "Full Export",
    "export.full-export-desc": "Extract all Elementor design settings",
    "export.extract-all": "Extract All",
    "export.options": "Export Options",
    "export.all-options": "All Options",
    "export.colors": "Global Colors",
    "export.typography": "Global Typography",
    "export.css-variables": "CSS Variables",
    "export.widgets": "Widgets",
    "export.templates": "Page Template",
    "export.custom-css": "Custom CSS",
    "export.copy": "Copy",
    "export.download": "Download",
    "export.template-json": "Download Template JSON",
    "export.kit-json": "Download Kit JSON",
    "export.css": "Download CSS",
    "export.copy-full": "Copy All",
    "export.preview": "Export Preview",

    // Import
    "import.instructions": "Import Instructions",
    "import.quick-actions": "Quick Actions",
    "import.copy-kit": "Copy Kit for Import",
    "import.copy-instructions": "Copy Instructions",

    // Settings
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.theme": "Appearance",
    "settings.dark-mode": "Dark Mode",
    "settings.light-mode": "Light Mode",
    "settings.auto-copy": "Auto Copy",
    "settings.about": "About",
    "settings.version": "Version",
    "settings.author": "Author",

    // Notifications
    "notify.copied": "Copied!",
    "notify.downloaded": "Downloaded!",
    "notify.extracted": "Extraction complete!",
    "notify.error": "Error",
    "notify.no-tab": "No active tab found",
    "notify.detected": "Sections detected!",
    "notify.no-sections": "No sections found",

    // Export
    "export.live-selection": "Live Section Selection",
    "export.live-selection-desc": "Select header, footer or specific section for export",
    "export.detect-sections": "Detect Sections",
    "export.no-sections": "No Elementor sections found",

    // General
    "general.yes": "Yes",
    "general.no": "No",
    "general.none": "None",
    "general.unknown": "Unknown",
    "general.loading": "Loading...",
    "general.scanning": "Scanning technologies...",
    "general.try-refresh": "Try refreshing the page",
    "general.cors-restricted": "CORS restricted",
    "general.no-css-variables": "No CSS variables found",
    "general.no-colors": "No colors found",
    "general.no-typography": "No typography found",
  },
};

let currentLang: Lang = "fa";

export function setLang(lang: string) {
  currentLang = lang === "en" ? "en" : "fa";
  document.documentElement.dir = currentLang === "fa" ? "rtl" : "ltr";
  document.documentElement.lang = currentLang;
}

export function getLang(): Lang {
  return currentLang;
}

export function t(key: string): string {
  const langData = translations[currentLang];
  if (!langData) return key;
  return langData[key] || translations["fa"]?.[key] || key;
}

export function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key);
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) {
      (el as HTMLInputElement).placeholder = t(key);
    }
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (key) {
      el.setAttribute("title", t(key));
    }
  });
}
