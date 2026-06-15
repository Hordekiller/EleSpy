# EleSpy - Development Rules

## Project Overview
Elementor Spy & Exporter - Browser Extension (Manifest V3, Cross-browser: Chrome + Firefox)
Detect WordPress/Elementor, extract styles, export/import Elementor kits

## Code Style

### TypeScript
- Strict mode enabled (`"strict": true`)
- No `any` - use proper types from `src/types/`
- Use interfaces for object shapes
- Prefer `type` for unions/intersections
- Export types from `types/` directory

### Naming Conventions
- `PascalCase` for components, interfaces, types
- `camelCase` for functions, variables, methods
- `UPPER_SNAKE_CASE` for constants
- `kebab-case` for file names (except components)
- Prefix interfaces with `I` (optional)

### Functions
- Prefer functional style over classes
- Use `const` for function expressions
- Keep functions small and focused
- Avoid side effects in pure functions
- Use async/await over Promises

### Components
- Single responsibility principle
- Composable pattern (Vue/React)
- Props interface at top of file
- No inline styles (use CSS modules/tailwind)

## File Structure
```
src/
├── entrypoints/          # Extension entry points
│   ├── popup/           # Popup UI
│   ├── panel/           # Side Panel UI
│   ├── content.ts       # Content script
│   └── background.ts    # Service worker
├── types/               # TypeScript types
├── utils/               # Utility functions
├── components/          # Shared components
├── composables/         # Vue composables
└── assets/              # Static assets
```

## Git Workflow

### Branch Naming
- `feat/*` - New features
- `fix/*` - Bug fixes
- `chore/*` - Maintenance
- `refactor/*` - Code refactoring
- `docs/*` - Documentation
- `test/*` - Tests

### Commit Messages (Conventional Commits)
```
feat: add elementor kit export
fix: resolve detection issue
chore: update dependencies
refactor: extract style utilities
docs: update README
test: add unit tests for detector
```

### PR Requirements
- Descriptive title
- Link to issue (if applicable)
- Screenshots/recordings for UI changes
- Test coverage maintained
- No breaking changes without discussion

## Testing

### Unit Tests
- Framework: Vitest
- Location: `tests/` directory
- Naming: `*.test.ts` or `*.spec.ts`
- Aim for >80% coverage

### E2E Tests
- Framework: Playwright (optional)
- Test extension loading
- Test panel interactions
- Test content script injection

## Linting & Formatting

### ESLint
- TypeScript ESLint plugin
- Vue plugin (if using Vue)
- Airbnb style guide base

### Prettier
- Single quotes
- Semicolons
- 2 spaces indentation
- Trailing commas

## Elementor Specific Rules

### Style Extraction
- Extract `--e-global-*` CSS variables
- Handle both Elementor Free & Pro
- Support dynamic tags and conditions
- Preserve original values (no rounding)

### Kit Export Format
- Follow Elementor Kit JSON schema
- Include version number
- Include title and metadata
- Validate before export

### Import Compatibility
- Test with Elementor 3.x+
- Support both Kit and Custom CSS import
- Provide clear instructions
- Handle edge cases (missing data)

## Performance

### Content Script
- Minimize DOM queries
- Cache results when possible
- Use MutationObserver for dynamic content
- Avoid unnecessary re-renders

### Background Script
- Keep lightweight
- Use message passing efficiently
- Clean up event listeners

## Security

- Never expose secrets in code
- Validate all external data
- Use CSP when possible
- Sanitize user inputs
- Don't execute eval()

## Documentation

- Comment complex logic
- Update README for new features
- Document API changes
- Include usage examples

## Release Process

### Version Bumping
- Semantic versioning (MAJOR.MINOR.PATCH)
- Update `package.json`
- Update `manifest.config.ts`
- Create git tag

### Store Submission
- Chrome Web Store: Manifest V3 compliant
- Firefox Add-ons: WebExtension standard
- Test on both browsers before release
- Include screenshots and description

## Common Patterns

### Message Passing (Content <-> Background)
```typescript
// Content Script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "detect") {
    sendResponse({ isElementor: true });
  }
});

// Popup/Panel
chrome.tabs.sendMessage(tabId, { type: "detect" }, (response) => {
  console.log(response);
});
```

### Storage API
```typescript
// Save
await chrome.storage.local.set({ key: value });

// Load
const data = await chrome.storage.local.get("key");
```

### Clipboard API
```typescript
await navigator.clipboard.writeText(text);
```

## Quick Commands
```bash
npm run dev          # Start Chrome dev
npm run dev:firefox  # Start Firefox dev
npm run build        # Build for production
npm run zip          # Package extension
npm run lint         # Check code style
npm run typecheck    # Check TypeScript
npm run test         # Run tests
```

## Notes
- Always test on real Elementor sites
- Check both free and pro versions
- Verify CSS variable extraction accuracy
- Test kit import/export flow end-to-end
