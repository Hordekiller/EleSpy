# EleSpy

Elementor Spy & Exporter - A browser extension for detecting WordPress/Elementor sites, extracting styles, and exporting/importing Elementor kits.

## Features

- **Server Detection**: Identify server type, CDN, SSL status
- **CMS Detection**: Detect WordPress and Elementor installations
- **Elementor Detection**: Identify Elementor version, Kit ID, Pro status
- **Style Extraction**: Extract global colors, typography, CSS variables
- **Kit Export**: Generate Elementor Kit JSON for import
- **CSS Export**: Download extracted CSS styles
- **Import Instructions**: Step-by-step guide for Elementor import

## Installation

### Chrome
1. Clone this repository
2. Run `npm install`
3. Run `npm run build:chrome`
4. Open `chrome://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `dist` folder

### Firefox
1. Clone this repository
2. Run `npm install`
3. Run `npm run build:firefox`
4. Open `about:debugging`
5. Click "This Firefox"
6. Click "Load Temporary Add-on" and select `manifest.json` from `dist` folder

## Development

```bash
# Install dependencies
npm install

# Start development (Chrome)
npm run dev

# Start development (Firefox)
npm run dev:firefox

# Build for production
npm run build:chrome
npm run build:firefox

# Package extension
npm run zip:chrome
npm run zip:firefox

# Lint code
npm run lint

# Check TypeScript
npm run typecheck

# Run tests
npm run test
```

## Usage

1. Install the extension
2. Navigate to a WordPress site with Elementor
3. Click the EleSpy icon in your browser toolbar
4. View server and CMS detection results
5. Click "Extract Styles" to analyze Elementor styles
6. Use the Side Panel for detailed analysis and export options

## Export Options

- **Kit JSON**: Download Elementor Kit format for direct import
- **CSS**: Download extracted CSS variables and styles
- **Copy to Clipboard**: Copy JSON or CSS for manual import

## Import to Elementor

### Method 1: Kit Import (Recommended)
1. Download Kit JSON from EleSpy
2. Go to WordPress Admin > Elementor > Tools > Import/Export Kit
3. Click "Import Kit"
4. Select the downloaded JSON file
5. Choose what to import and click "Import"

### Method 2: Custom CSS
1. Copy CSS variables from EleSpy
2. Go to WordPress Admin > Elementor > Settings > Custom CSS
3. Paste the CSS variables
4. Save changes

### Method 3: Theme Customizer
1. Copy CSS variables from EleSpy
2. Go to Appearance > Customize > Additional CSS
3. Paste the CSS variables
4. Publish

## Permissions

- `activeTab`: Access current tab
- `scripting`: Inject content scripts
- `storage`: Save settings and data
- `clipboardWrite`: Copy to clipboard
- `sidePanel`: Open side panel

## Tech Stack

- WXT Framework (Manifest V3)
- TypeScript
- Chrome/Firefox Extension APIs
- WebExtension Standard

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

- Create an issue on GitHub
- Check the documentation
- Review the code comments

## Changelog

### 1.0.0
- Initial release
- Server detection
- CMS detection
- Elementor detection
- Style extraction
- Kit export
- CSS export
- Import instructions
