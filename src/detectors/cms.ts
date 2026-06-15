import type { TechItem } from "./types";

export function detectCMS(html: string): TechItem[] {
  const results: TechItem[] = [];

  const cmsPatterns = [
    {
      name: "WordPress",
      patterns: [
        /wp-content/i,
        /wp-includes/i,
        /wordpress/i,
        /<meta name="generator" content="WordPress/i,
        /wp-json/i,
        /wp-embed\.min\.js/i,
        /elementor/i,
        /woocommerce/i,
        /wp-admin/i,
        /wp-login\.php/i,
      ],
      version: /wordpress\s+([\d.]+)/i,
      confidence: 100,
    },
    {
      name: "Joomla",
      patterns: [
        /joomla/i,
        /<meta name="generator" content="Joomla/i,
        /media\/jui/i,
        /components\/com_/i,
        /modules\/mod_/i,
        /templates\/[a-z]+\//i,
      ],
      version: /joomla!\s+([\d.]+)/i,
      confidence: 100,
    },
    {
      name: "Drupal",
      patterns: [
        /drupal/i,
        /<meta name="generator" content="Drupal/i,
        /sites\/default\/files/i,
        /drupal\.js/i,
        /Drupal\.settings/i,
        /\/core\/misc\/drupal\.js/i,
      ],
      version: /drupal\s+([\d.]+)/i,
      confidence: 100,
    },
    {
      name: "Shopify",
      patterns: [
        /shopify/i,
        /cdn\.shopify\.com/i,
        /shopify\.com/i,
        /Shopify\.theme/i,
        /shopify-section/i,
      ],
      confidence: 100,
    },
    {
      name: "Magento",
      patterns: [
        /magento/i,
        /magentocommerce\.com/i,
        /mage\/cookies\.js/i,
        /requirejs\/main\.js/i,
        /skin\/frontend/i,
      ],
      confidence: 100,
    },
    {
      name: "Wix",
      patterns: [/wix\.com/i, /wixstatic\.com/i, /wix\.com\/_api/i],
      confidence: 100,
    },
    {
      name: "Squarespace",
      patterns: [
        /squarespace\.com/i,
        /sqsp\.com/i,
        /squarespace\.io/i,
      ],
      confidence: 100,
    },
    {
      name: "TYPO3",
      patterns: [
        /typo3/i,
        /typo3conf/i,
        /typo3temp/i,
        /typo3cms/i,
      ],
      confidence: 100,
    },
    {
      name: "PrestaShop",
      patterns: [
        /prestashop/i,
        /presta/i,
        /\/themes\/[a-z]+\//i,
      ],
      confidence: 100,
    },
    {
      name: "OpenCart",
      patterns: [
        /opencart/i,
        /catalog\/view\/theme/i,
        /route=common/i,
      ],
      confidence: 100,
    },
    {
      name: "Blogger",
      patterns: [
        /blogger\.com/i,
        /blogspot\./i,
        /blogger\.js/i,
      ],
      confidence: 100,
    },
    {
      name: "Ghost",
      patterns: [
        /ghost/i,
        /ghost-url/i,
        /ghost-footer/i,
      ],
      confidence: 100,
    },
    {
      name: "Hugo",
      patterns: [
        /hugo/i,
        /powered by hugo/i,
      ],
      confidence: 90,
    },
    {
      name: "Jekyll",
      patterns: [
        /jekyll/i,
        /jekyll\.js/i,
      ],
      confidence: 90,
    },
    {
      name: "Gatsby",
      patterns: [
        /gatsby/i,
        /gatsbyjs/i,
      ],
      confidence: 90,
    },
    {
      name: "Contentful",
      patterns: [/contentful/i, /ctfl\.io/i],
      confidence: 90,
    },
    {
      name: "Strapi",
      patterns: [/strapi/i, /strapi\.io/i],
      confidence: 90,
    },
  ];

  for (const cms of cmsPatterns) {
    for (const pattern of cms.patterns) {
      if (pattern.test(html)) {
        let version: string | undefined;
        if (cms.version) {
          const versionMatch = html.match(cms.version);
          if (versionMatch) version = versionMatch[1];
        }
        results.push({
          name: cms.name,
          version,
          confidence: cms.confidence,
        });
        break;
      }
    }
  }

  return results;
}

export function detectPageBuilder(html: string): TechItem[] {
  const results: TechItem[] = [];

  const builderPatterns = [
    {
      name: "Elementor",
      patterns: [
        /elementor/i,
        /elementor-page/i,
        /data-elementor-type/i,
        /elementor-widget/i,
        /elementor-section/i,
        /elementor-kit/i,
        /elementor-frontend/i,
      ],
      version: /elementor\/([\d.]+)/i,
      confidence: 100,
    },
    {
      name: "Elementor Pro",
      patterns: [
        /elementor-pro/i,
        /elementor-widget-theme/i,
        /elementor-widget-posts/i,
        /elementor-widget-loop/i,
      ],
      confidence: 100,
    },
    {
      name: "WPBakery",
      patterns: [
        /wpbakery/i,
        /vc_row/i,
        /vc_column/i,
        /wpb-js-composer/i,
        /js_composer/i,
      ],
      confidence: 100,
    },
    {
      name: "Divi",
      patterns: [
        /divi/i,
        /et_pb_/i,
        /divi-page-builder/i,
        /et-core/i,
      ],
      confidence: 100,
    },
    {
      name: "Beaver Builder",
      patterns: [
        /beaver/i,
        /fl-builder/i,
        /fl-builder-content/i,
      ],
      confidence: 100,
    },
    {
      name: "Visual Composer",
      patterns: [
        /visual-composer/i,
        /vcUSTOM/i,
      ],
      confidence: 100,
    },
    {
      name: "Brizy",
      patterns: [/brizy/i, /brizy-editor/i],
      confidence: 100,
    },
    {
      name: "Oxygen",
      patterns: [/oxygen/i, /oxygen-page-builder/i],
      confidence: 100,
    },
    {
      name: "GenerateBlocks",
      patterns: [/generateblocks/i, /gb-container/i],
      confidence: 90,
    },
    {
      name: "Kadence Blocks",
      patterns: [/kadence/i, /kt-]/i],
      confidence: 90,
    },
  ];

  for (const builder of builderPatterns) {
    for (const pattern of builder.patterns) {
      if (pattern.test(html)) {
        let version: string | undefined;
        if (builder.version) {
          const versionMatch = html.match(builder.version);
          if (versionMatch) version = versionMatch[1];
        }
        results.push({
          name: builder.name,
          version,
          confidence: builder.confidence,
        });
        break;
      }
    }
  }

  return results;
}

export function detectTheme(html: string): TechItem[] {
  const results: TechItem[] = [];

  const themePatterns = [
    {
      name: "Astra",
      patterns: [/astra/i, /wp-content\/themes\/astra/i],
      confidence: 100,
    },
    {
      name: "GeneratePress",
      patterns: [/generatepress/i, /wp-content\/themes\/generatepress/i],
      confidence: 100,
    },
    {
      name: "OceanWP",
      patterns: [/oceanwp/i, /wp-content\/themes\/oceanwp/i],
      confidence: 100,
    },
    {
      name: "Flavor",
      patterns: [/flavor/i, /wp-content\/themes\/flavor/i],
      confidence: 100,
    },
    {
      name: "flavor developer",
      patterns: [/flavor developer/i],
      confidence: 100,
    },
    {
      name: "flavor developer",
      patterns: [/flavor developer/i],
      confidence: 100,
    },
    {
      name: "flavor developer",
      patterns: [/flavor developer/i],
      confidence: 100,
    },
    {
      name: "flavor developer",
      patterns: [/flavor developer/i],
      confidence: 100,
    },
    {
      name: "flavor developer",
      patterns: [/flavor developer/i],
      confidence: 100,
    },
  ];

  const themeMatch = html.match(/wp-content\/themes\/([a-z0-9-]+)/i);
  if (themeMatch) {
    results.push({
      name: themeMatch[1].replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      confidence: 90,
    });
  }

  for (const theme of themePatterns) {
    for (const pattern of theme.patterns) {
      if (pattern.test(html)) {
        results.push({
          name: theme.name,
          confidence: theme.confidence,
        });
        break;
      }
    }
  }

  return results;
}
