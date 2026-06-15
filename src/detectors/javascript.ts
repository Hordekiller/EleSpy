import type { TechItem } from "./types";

export function detectJSFrameworks(html: string): TechItem[] {
  const results: TechItem[] = [];

  const patterns = [
    {
      name: "jQuery",
      patterns: [
        /jquery[\/-]([\d.]+)/i,
        /jquery\.min\.js/i,
        /jquery-\d/i,
        /jQuery\.fn/i,
      ],
      confidence: 100,
    },
    {
      name: "React",
      patterns: [
        /react[\/-]([\d.]+)/i,
        /react\.production\.min\.js/i,
        /react-dom/i,
        /__NEXT_DATA__/i,
        /data-reactroot/i,
        /_reactRootContainer/i,
      ],
      confidence: 100,
    },
    {
      name: "Vue.js",
      patterns: [
        /vue[\/-]([\d.]+)/i,
        /vue\.min\.js/i,
        /vue\.js/i,
        /data-v-[a-f0-9]+/i,
        /__vue__/i,
        /Vue\.component/i,
        /vue-router/i,
        /vuex/i,
        /vue\.config/i,
      ],
      confidence: 100,
    },
    {
      name: "Angular",
      patterns: [
        /angular[\/-]([\d.]+)/i,
        /angular\.min\.js/i,
        /ng-version/i,
        /ng-app/i,
        /ng-controller/i,
        /angular\.js/i,
        /@angular\/core/i,
      ],
      confidence: 100,
    },
    {
      name: "Next.js",
      patterns: [
        /next[\/-]([\d.]+)/i,
        /__next/i,
        /_next\/static/i,
        /next\.config/i,
        /next\/image/i,
      ],
      confidence: 100,
    },
    {
      name: "Nuxt.js",
      patterns: [
        /nuxt[\/-]([\d.]+)/i,
        /__nuxt/i,
        /_nuxt\//i,
        /nuxt\.config/i,
      ],
      confidence: 100,
    },
    {
      name: "Svelte",
      patterns: [
        /svelte[\/-]([\d.]+)/i,
        /svelte\.js/i,
        /svelte-[a-z]+/i,
      ],
      confidence: 100,
    },
    {
      name: "Solid.js",
      patterns: [/solid[\/-]([\d.]+)/i, /solid-js/i],
      confidence: 100,
    },
    {
      name: "Alpine.js",
      patterns: [
        /alpine[\/-]([\d.]+)/i,
        /alpinejs/i,
        /x-data/i,
        /x-show/i,
        /x-bind/i,
      ],
      confidence: 100,
    },
    {
      name: "Stimulus",
      patterns: [/stimulus/i, /data-controller/i],
      confidence: 90,
    },
    {
      name: "Backbone.js",
      patterns: [/backbone[\/-]([\d.]+)/i, /Backbone\.Model/i],
      confidence: 100,
    },
    {
      name: "Ember.js",
      patterns: [/ember[\/-]([\d.]+)/i, /ember\.js/i, /Ember\./i],
      confidence: 100,
    },
  ];

  for (const pattern of patterns) {
    for (const regex of pattern.patterns) {
      if (regex.test(html)) {
        let version: string | undefined;
        if (regex.source.includes("(\\d")) {
          const versionMatch = html.match(regex);
          if (versionMatch) version = versionMatch[1];
        }
        results.push({
          name: pattern.name,
          version,
          confidence: pattern.confidence,
        });
        break;
      }
    }
  }

  return results;
}

export function detectUILibraries(html: string): TechItem[] {
  const results: TechItem[] = [];

  const patterns = [
    {
      name: "Bootstrap",
      patterns: [
        /bootstrap[\/-]([\d.]+)/i,
        /bootstrap\.min\.css/i,
        /bootstrap\.min\.js/i,
        /bootstrap-grid/i,
        /data-bs-toggle/i,
      ],
      confidence: 100,
    },
    {
      name: "Tailwind CSS",
      patterns: [
        /tailwindcss/i,
        /tailwind\.min\.css/i,
        /tw-/i,
        /data-tailwind/i,
      ],
      confidence: 100,
    },
    {
      name: "Material UI",
      patterns: [/material-ui/i, /mui\.com/i, /@mui\/material/i],
      confidence: 90,
    },
    {
      name: "Chakra UI",
      patterns: [/chakra-ui/i, /chakra\.com/i],
      confidence: 90,
    },
    {
      name: "Ant Design",
      patterns: [/ant-design/i, /antd/i, /antd\.min\.css/i],
      confidence: 90,
    },
    {
      name: "Bulma",
      patterns: [/bulma[\/-]([\d.]+)/i, /bulma\.min\.css/i],
      confidence: 100,
    },
    {
      name: "Foundation",
      patterns: [/foundation[\/-]([\d.]+)/i, /foundation\.min\.css/i],
      confidence: 100,
    },
    {
      name: "Materialize",
      patterns: [/materialize[\/-]([\d.]+)/i, /materialize\.min\.css/i],
      confidence: 100,
    },
    {
      name: "UIkit",
      patterns: [/uikit[\/-]([\d.]+)/i, /uikit\.min\.css/i],
      confidence: 100,
    },
    {
      name: "Semantic UI",
      patterns: [/semantic-ui/i, /semantic\.min\.css/i],
      confidence: 100,
    },
    {
      name: "Animate.css",
      patterns: [/animate[\/-]([\d.]+)/i, /animate\.min\.css/i],
      confidence: 100,
    },
    {
      name: "AOS",
      patterns: [/aos[\/-]([\d.]+)/i, /aos\.js/i, /data-aos/i],
      confidence: 100,
    },
    {
      name: "Wow.js",
      patterns: [/wow[\/-]([\d.]+)/i, /wow\.js/i],
      confidence: 100,
    },
    {
      name: "Swiper",
      patterns: [/swiper[\/-]([\d.]+)/i, /swiper\.min\.css/i],
      confidence: 100,
    },
    {
      name: "Slick",
      patterns: [/slick[\/-]([\d.]+)/i, /slick\.css/i, /slick-slider/i],
      confidence: 100,
    },
    {
      name: "Owl Carousel",
      patterns: [/owl[\/-]([\d.]+)/i, /owl\.carousel/i],
      confidence: 100,
    },
    {
      name: "Glightbox",
      patterns: [/glightbox[\/-]([\d.]+)/i, /glightbox\.js/i],
      confidence: 100,
    },
    {
      name: "Fancybox",
      patterns: [/fancybox[\/-]([\d.]+)/i, /fancybox\.js/i],
      confidence: 100,
    },
    {
      name: "Lightbox",
      patterns: [/lightbox[\/-]([\d.]+)/i, /lightbox\.js/i],
      confidence: 100,
    },
  ];

  for (const pattern of patterns) {
    for (const regex of pattern.patterns) {
      if (regex.test(html)) {
        let version: string | undefined;
        if (regex.source.includes("(\\d")) {
          const versionMatch = html.match(regex);
          if (versionMatch) version = versionMatch[1];
        }
        results.push({
          name: pattern.name,
          version,
          confidence: pattern.confidence,
        });
        break;
      }
    }
  }

  return results;
}

export function detectLibraries(html: string): TechItem[] {
  const results: TechItem[] = [];

  const patterns = [
    {
      name: "Lodash",
      patterns: [/lodash[\/-]([\d.]+)/i, /lodash\.min\.js/i, /_\./],
      confidence: 100,
    },
    {
      name: "Moment.js",
      patterns: [/moment[\/-]([\d.]+)/i, /moment\.min\.js/i, /moment\.js/i],
      confidence: 100,
    },
    {
      name: "Day.js",
      patterns: [/dayjs[\/-]([\d.]+)/i, /day\.js/i],
      confidence: 100,
    },
    {
      name: "Axios",
      patterns: [/axios[\/-]([\d.]+)/i, /axios\.min\.js/i, /axios\.js/i],
      confidence: 100,
    },
    {
      name: "GSAP",
      patterns: [/gsap[\/-]([\d.]+)/i, /gsap\.min\.js/i, /TweenMax/i, /TweenLite/i],
      confidence: 100,
    },
    {
      name: "Three.js",
      patterns: [/three[\/-]([\d.]+)/i, /three\.min\.js/i, /three\.js/i],
      confidence: 100,
    },
    {
      name: "D3.js",
      patterns: [/d3[\/-]([\d.]+)/i, /d3\.min\.js/i, /d3\.js/i],
      confidence: 100,
    },
    {
      name: "Chart.js",
      patterns: [/chart[\/-]([\d.]+)/i, /chart\.min\.js/i, /chart\.js/i],
      confidence: 100,
    },
    {
      name: "Lottie",
      patterns: [/lottie[\/-]([\d.]+)/i, /lottie\.min\.js/i, /lottie\.js/i],
      confidence: 100,
    },
    {
      name: "Typed.js",
      patterns: [/typed[\/-]([\d.]+)/i, /typed\.min\.js/i, /typed\.js/i],
      confidence: 100,
    },
    {
      name: "Waypoints",
      patterns: [/waypoints[\/-]([\d.]+)/i, /waypoints\.min\.js/i],
      confidence: 100,
    },
    {
      name: "Isotope",
      patterns: [/isotope[\/-]([\d.]+)/i, /isotope\.min\.js/i],
      confidence: 100,
    },
    {
      name: "Masonry",
      patterns: [/masonry[\/-]([\d.]+)/i, /masonry\.min\.js/i],
      confidence: 100,
    },
    {
      name: "Images Loaded",
      patterns: [/imagesloaded[\/-]([\d.]+)/i, /imagesloaded\.min\.js/i],
      confidence: 100,
    },
    {
      name: "ScrollReveal",
      patterns: [/scrollreveal[\/-]([\d.]+)/i, /scrollreveal\.min\.js/i],
      confidence: 100,
    },
    {
      name: "Parallax.js",
      patterns: [/parallax[\/-]([\d.]+)/i, /parallax\.min\.js/i],
      confidence: 100,
    },
    {
      name: "Jarallax",
      patterns: [/jarallax[\/-]([\d.]+)/i, /jarallax\.min\.js/i],
      confidence: 100,
    },
    {
      name: "Lenis",
      patterns: [/lenis[\/-]([\d.]+)/i, /lenis\.min\.js/i],
      confidence: 100,
    },
    {
      name: "Locomotive Scroll",
      patterns: [/locomotive[\/-]([\d.]+)/i, /locomotive-scroll/i],
      confidence: 100,
    },
    {
      name: "Barba.js",
      patterns: [/barba[\/-]([\d.]+)/i, /barba\.min\.js/i],
      confidence: 100,
    },
    {
      name: "Rellax",
      patterns: [/rellax[\/-]([\d.]+)/i, /rellax\.min\.js/i],
      confidence: 100,
    },
    {
      name: "AOS",
      patterns: [/aos[\/-]([\d.]+)/i, /aos\.js/i],
      confidence: 100,
    },
    {
      name: "Wow.js",
      patterns: [/wow[\/-]([\d.]+)/i, /wow\.js/i],
      confidence: 100,
    },
    {
      name: "Typed.js",
      patterns: [/typed[\/-]([\d.]+)/i, /typed\.js/i],
      confidence: 100,
    },
    {
      name: "CountUp.js",
      patterns: [/countup[\/-]([\d.]+)/i, /countup\.js/i],
      confidence: 100,
    },
    {
      name: "Waypoints",
      patterns: [/waypoints[\/-]([\d.]+)/i, /waypoints\.js/i],
      confidence: 100,
    },
    {
      name: "Stickyfill",
      patterns: [/stickyfill[\/-]([\d.]+)/i, /stickyfill\.js/i],
      confidence: 100,
    },
    {
      name: "Tippy.js",
      patterns: [/tippy[\/-]([\d.]+)/i, /tippy\.js/i],
      confidence: 100,
    },
    {
      name: "Popper.js",
      patterns: [/popper[\/-]([\d.]+)/i, /popper\.js/i],
      confidence: 100,
    },
    {
      name: "Tooltip.js",
      patterns: [/tooltip[\/-]([\d.]+)/i, /tooltip\.js/i],
      confidence: 100,
    },
    {
      name: "Fuse.js",
      patterns: [/fuse[\/-]([\d.]+)/i, /fuse\.js/i],
      confidence: 100,
    },
    {
      name: "Mark.js",
      patterns: [/mark[\/-]([\d.]+)/i, /mark\.js/i],
      confidence: 100,
    },
    {
      name: "List.js",
      patterns: [/list[\/-]([\d.]+)/i, /list\.js/i],
      confidence: 100,
    },
    {
      name: "Select2",
      patterns: [/select2[\/-]([\d.]+)/i, /select2\.js/i],
      confidence: 100,
    },
    {
      name: "Choices.js",
      patterns: [/choices[\/-]([\d.]+)/i, /choices\.js/i],
      confidence: 100,
    },
    {
      name: "Flatpickr",
      patterns: [/flatpickr[\/-]([\d.]+)/i, /flatpickr\.js/i],
      confidence: 100,
    },
    {
      name: "Pikaday",
      patterns: [/pikaday[\/-]([\d.]+)/i, /pikaday\.js/i],
      confidence: 100,
    },
    {
      name: "NoUiSlider",
      patterns: [/nouislider[\/-]([\d.]+)/i, /nouislider\.js/i],
      confidence: 100,
    },
    {
      name: "RangeSlider",
      patterns: [/rangeslider[\/-]([\d.]+)/i, /rangeslider\.js/i],
      confidence: 100,
    },
    {
      name: "Sortable",
      patterns: [/sortable[\/-]([\d.]+)/i, /sortable\.js/i],
      confidence: 100,
    },
    {
      name: "Draggable",
      patterns: [/draggable[\/-]([\d.]+)/i, /draggable\.js/i],
      confidence: 100,
    },
    {
      name: "Dropzone",
      patterns: [/dropzone[\/-]([\d.]+)/i, /dropzone\.js/i],
      confidence: 100,
    },
    {
      name: "Cropper.js",
      patterns: [/cropper[\/-]([\d.]+)/i, /cropper\.js/i],
      confidence: 100,
    },
    {
      name: "Quill",
      patterns: [/quill[\/-]([\d.]+)/i, /quill\.js/i],
      confidence: 100,
    },
    {
      name: "TinyMCE",
      patterns: [/tinymce[\/-]([\d.]+)/i, /tinymce\.js/i],
      confidence: 100,
    },
    {
      name: "CKEditor",
      patterns: [/ckeditor[\/-]([\d.]+)/i, /ckeditor\.js/i],
      confidence: 100,
    },
    {
      name: "CodeMirror",
      patterns: [/codemirror[\/-]([\d.]+)/i, /codemirror\.js/i],
      confidence: 100,
    },
    {
      name: "Prism.js",
      patterns: [/prism[\/-]([\d.]+)/i, /prism\.js/i],
      confidence: 100,
    },
    {
      name: "Highlight.js",
      patterns: [/highlight[\/-]([\d.]+)/i, /highlight\.js/i],
      confidence: 100,
    },
    {
      name: "MathJax",
      patterns: [/mathjax[\/-]([\d.]+)/i, /mathjax\.js/i],
      confidence: 100,
    },
    {
      name: "KaTeX",
      patterns: [/katex[\/-]([\d.]+)/i, /katex\.js/i],
      confidence: 100,
    },
  ];

  for (const pattern of patterns) {
    for (const regex of pattern.patterns) {
      if (regex.test(html)) {
        let version: string | undefined;
        if (regex.source.includes("(\\d")) {
          const versionMatch = html.match(regex);
          if (versionMatch) version = versionMatch[1];
        }
        results.push({
          name: pattern.name,
          version,
          confidence: pattern.confidence,
        });
        break;
      }
    }
  }

  return results;
}
