# Quick Start Guide - PrivaShield Extension

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- Chrome browser
- Backend API (for full functionality)

### Installation
```bash
cd d:\projects\PrivaShield\priva-shield-extension
npm install  # ✅ Already completed
```

### Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Load in Chrome
1. Navigate to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist` folder

## 📝 TODO Before First Run

1. **Create Icons** (Required)
   - Add `icon-16.png`, `icon-48.png`, `icon-128.png` to `public/icons/`
   - See `public/icons/README.md` for design guidelines

2. **Configure Backend API** (Required for functionality)
   - Edit `src/services/api.js`
   - Update `API_BASE_URL` to your backend server

3. **Build the Extension**
   - Run `npm run build`

## 🎯 Key Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build |

## 📂 Important Files

- `manifest.json` - Extension configuration
- `src/popup/Popup.jsx` - Main UI component
- `src/services/api.js` - Backend integration
- `src/background/background.js` - Background worker
- `src/content/contentScript.js` - Page content extraction

## 🔧 Customization

### Change Extension Name
Edit `manifest.json`:
```json
"name": "Your Extension Name"
```

### Update Colors
Edit `tailwind.config.cjs` for theme colors

### Modify API Endpoints
Edit `src/services/api.js`

## 🐛 Troubleshooting

**Extension won't load:**
- Ensure `npm run build` completed successfully
- Check Chrome console for errors

**API calls failing:**
- Verify `API_BASE_URL` is correct
- Check CORS settings on backend
- Ensure backend is running

**Icons not showing:**
- Create PNG files in `public/icons/`
- Rebuild extension after adding icons

## 📚 Resources

- [Project README](file:///d:/projects/PrivaShield/priva-shield-extension/README.md)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [React Docs](https://react.dev/)
