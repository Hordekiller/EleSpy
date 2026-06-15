import type { TechItem } from "./types";

export function detectAnalytics(html: string): TechItem[] {
  const results: TechItem[] = [];

  const patterns = [
    {
      name: "Google Analytics",
      patterns: [
        /google-analytics\.com/i,
        /googletagmanager\.com/i,
        /gtag\(/i,
        /ga\(/i,
        /analytics\.js/i,
        /UA-\d+/i,
        /G-[A-Z0-9]+/i,
        /GTM-[A-Z0-9]+/i,
      ],
      confidence: 100,
    },
    {
      name: "Google Tag Manager",
      patterns: [
        /googletagmanager\.com/i,
        /gtm\.js/i,
        /GTM-[A-Z0-9]+/i,
      ],
      confidence: 100,
    },
    {
      name: "Facebook Pixel",
      patterns: [
        /facebook\.net\/en_US\/fbevents/i,
        /fbq\(/i,
        /facebook\.net\/tr/i,
        /fbevents\.js/i,
      ],
      confidence: 100,
    },
    {
      name: "Hotjar",
      patterns: [
        /hotjar\.com/i,
        /hotjar\.js/i,
        /_hjSettings/i,
      ],
      confidence: 100,
    },
    {
      name: "Mixpanel",
      patterns: [/mixpanel\.com/i, /mixpanel\.js/i, /mixpanel\.init/i],
      confidence: 100,
    },
    {
      name: "Amplitude",
      patterns: [/amplitude\.com/i, /amplitude\.js/i, /amplitude\.getInstance/i],
      confidence: 100,
    },
    {
      name: "Segment",
      patterns: [
        /segment\.com\/analytics/i,
        /analytics\.min\.js/i,
        /analytics\.load/i,
      ],
      confidence: 90,
    },
    {
      name: "Heap",
      patterns: [/heap-[\d]+\.js/i, /heap\.com/i, /heap\.load/i],
      confidence: 100,
    },
    {
      name: "Mixpanel",
      patterns: [/mixpanel\.com/i, /mixpanel\.js/i],
      confidence: 100,
    },
    {
      name: "Plausible",
      patterns: [/plausible\.io/i, /plausible\.js/i],
      confidence: 100,
    },
    {
      name: "Fathom",
      patterns: [/fathom\.js/i, /fathom\.analytics/i],
      confidence: 100,
    },
    {
      name: "Matomo",
      patterns: [/matomo\.js/i, /piwik\.js/i, /matomo\.php/i],
      confidence: 100,
    },
    {
      name: "Yandex Metrica",
      patterns: [
        /mc\.yandex\.ru/i,
        /yandex\.ru\/metrika/i,
        /ym\(\d+/i,
      ],
      confidence: 100,
    },
    {
      name: "Baidu Analytics",
      patterns: [/hm\.baidu\.com/i, /hm\.js/i],
      confidence: 100,
    },
    {
      name: "Microsoft Clarity",
      patterns: [/clarity\.ms/i, /clarity\.js/i],
      confidence: 100,
    },
    {
      name: "Lucky Orange",
      patterns: [/luckyorange\.com/i, /luckyorange\.js/i],
      confidence: 100,
    },
    {
      name: "Crazy Egg",
      patterns: [/crazyegg\.com/i, /crazyegg\.js/i],
      confidence: 100,
    },
    {
      name: "Mouseflow",
      patterns: [/mouseflow\.com/i, /mouseflow\.js/i],
      confidence: 100,
    },
    {
      name: "FullStory",
      patterns: [/fullstory\.com/i, /fullstory\.js/i, /fs\.js/i],
      confidence: 100,
    },
    {
      name: "Inspectlet",
      patterns: [/inspectlet\.com/i, /inspectlet\.js/i],
      confidence: 100,
    },
    {
      name: "VWO",
      patterns: [/vwo\.com/i, /vwo\.js/i],
      confidence: 100,
    },
    {
      name: "Optimizely",
      patterns: [/optimizely\.com/i, /optimizely\.js/i],
      confidence: 100,
    },
  ];

  for (const pattern of patterns) {
    for (const regex of pattern.patterns) {
      if (regex.test(html)) {
        results.push({
          name: pattern.name,
          confidence: pattern.confidence,
        });
        break;
      }
    }
  }

  return results;
}

export function detectMarketing(html: string): TechItem[] {
  const results: TechItem[] = [];

  const patterns = [
    {
      name: "Google Ads",
      patterns: [
        /googlesyndication\.com/i,
        /googleadservices\.com/i,
        /adsense/i,
        /googletag/i,
      ],
      confidence: 100,
    },
    {
      name: "Google AdSense",
      patterns: [
        /adsense/i,
        /googlesyndication\.com/i,
        /ad-client/i,
        /ca-pub-/i,
      ],
      confidence: 100,
    },
    {
      name: "Facebook Ads",
      patterns: [
        /facebook\.net\/en_US\/fbevents/i,
        /fbq\(/i,
        /facebook\.net\/tr/i,
      ],
      confidence: 100,
    },
    {
      name: "Twitter Ads",
      patterns: [/twitter\.com\/i\/adsct/i, /analytics\.twitter\.com/i],
      confidence: 100,
    },
    {
      name: "LinkedIn Ads",
      patterns: [/linkedin\.com\/px/i, /snap\.licdn\.com/i],
      confidence: 100,
    },
    {
      name: "Pinterest Ads",
      patterns: [/pintrk\.com/i, /ct\.pinterest\.com/i],
      confidence: 100,
    },
    {
      name: "TikTok Ads",
      patterns: [/analytics\.tiktok\.com/i, /tiktok\.com\/i2i/i],
      confidence: 100,
    },
    {
      name: "Microsoft Ads",
      patterns: [
        /bat\.bing\.com/i,
        /clarity\.ms/i,
      ],
      confidence: 100,
    },
    {
      name: "Criteo",
      patterns: [/criteo\.com/i, /criteo\.net/i],
      confidence: 100,
    },
    {
      name: "AdRoll",
      patterns: [/adroll\.com/i, /adroll\.js/i],
      confidence: 100,
    },
    {
      name: "Retargeter",
      patterns: [/retargeter\.com/i],
      confidence: 100,
    },
  ];

  for (const pattern of patterns) {
    for (const regex of pattern.patterns) {
      if (regex.test(html)) {
        results.push({
          name: pattern.name,
          confidence: pattern.confidence,
        });
        break;
      }
    }
  }

  return results;
}

export function detectFonts(html: string): TechItem[] {
  const results: TechItem[] = [];

  const patterns = [
    {
      name: "Google Fonts",
      patterns: [
        /fonts\.googleapis\.com/i,
        /fonts\.gstatic\.com/i,
        /google-fonts/i,
      ],
      confidence: 100,
    },
    {
      name: "Adobe Fonts",
      patterns: [
        /use\.typekit\.net/i,
        /typekit\.net/i,
        /adobe-fonts/i,
      ],
      confidence: 100,
    },
    {
      name: "Font Awesome",
      patterns: [
        /fontawesome\.com/i,
        /font-awesome/i,
        /fa-[a-z]+/i,
      ],
      confidence: 100,
    },
    {
      name: "Flaticon",
      patterns: [/flaticon\.com/i, /flaticon\.js/i],
      confidence: 100,
    },
    {
      name: "Icons8",
      patterns: [/icons8\.com/i, /icons8\.js/i],
      confidence: 100,
    },
    {
      name: "Icomoon",
      patterns: [/icomoon\.io/i, /icomoon\.js/i],
      confidence: 100,
    },
    {
      name: "Phosphor Icons",
      patterns: [/phosphoricons\.com/i, /phosphor\.js/i],
      confidence: 100,
    },
    {
      name: "Lucide",
      patterns: [/lucide\.dev/i, /lucide\.js/i],
      confidence: 100,
    },
    {
      name: "Heroicons",
      patterns: [/heroicons\.com/i, /heroicons\.js/i],
      confidence: 100,
    },
  ];

  for (const pattern of patterns) {
    for (const regex of pattern.patterns) {
      if (regex.test(html)) {
        results.push({
          name: pattern.name,
          confidence: pattern.confidence,
        });
        break;
      }
    }
  }

  return results;
}
