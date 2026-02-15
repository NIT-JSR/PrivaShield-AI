# PrivaShield Chrome Extension

PrivaShield is an AI-powered Chrome extension that analyzes website privacy policies and helps users understand what data is being collected and how it's being used.

## Features

- 🔍 **Automatic Policy Detection**: Detects privacy policy pages automatically
- 📊 **AI-Powered Analysis**: Uses LegalBERT to analyze and summarize privacy policies
- ⚠️ **Risk Assessment**: Identifies hidden and risky clauses in privacy policies
- 🔐 **Permission Breakdown**: Explains what permissions websites request and why
- 💬 **Interactive Chat**: Ask questions about privacy policies using AI chatbot
- 🎨 **Modern UI**: Clean, intuitive interface built with React and Tailwind CSS

## Project Structure

```
priva-shield-extension/
├── public/
│   ├── icons/              # Extension icons
│   └── popup.html          # Popup entry point
├── src/
│   ├── popup/              # React components for popup UI
│   ├── background/         # Background service worker
│   ├── content/            # Content scripts
│   ├── services/           # API and messaging services
│   ├── store/              # Chrome storage helpers
│   ├── utils/              # Constants and utilities
│   └── styles/             # Global styles
├── manifest.json           # Chrome extension configuration
└── package.json
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Development

Run the development server:
```bash
npm run dev
```

## Backend Setup

This extension requires a backend API for privacy policy analysis. Update the `API_BASE_URL` in `src/services/api.js` to point to your backend server.

Expected API endpoints:
- `POST /api/analyze` - Analyze privacy policy
- `POST /api/chat` - Chat with policy assistant

## Technologies Used

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Chrome Extension API** - Browser integration
- **LegalBERT** - AI model for legal text analysis (backend)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
