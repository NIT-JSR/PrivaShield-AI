import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, readFileSync, writeFileSync, readdirSync } from 'fs';

// Plugin to copy manifest and fix popup.html
const copyAndFixFiles = () => ({
  name: 'copy-and-fix-files',
  closeBundle() {
    // Copy manifest.json to dist
    copyFileSync('manifest.json', 'dist/manifest.json');
    console.log('✓ Copied manifest.json to dist/');
    
    // Find the generated JS and CSS files
    const assetsDir = 'dist/assets';
    const files = readdirSync(assetsDir);
    const jsFile = files.find(f => f.startsWith('popup-') && f.endsWith('.js'));
    const cssFile = files.find(f => f.startsWith('popup-') && f.endsWith('.css'));
    
    // Create proper popup.html with correct script references
    const popupHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PrivaShield</title>
  ${cssFile ? `<link rel="stylesheet" href="assets/${cssFile}">` : ''}
</head>
<body>
  <div id="root"></div>
  ${jsFile ? `<script type="module" src="assets/${jsFile}"></script>` : ''}
</body>
</html>`;
    
    writeFileSync('dist/popup.html', popupHtml);
    console.log('✓ Fixed popup.html with correct script references');
  }
});

export default defineConfig({
  plugins: [react(), copyAndFixFiles()],
  root: '.',
  publicDir: 'public',
  server: {
    port: 5173,
    open: '/popup.html',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'public/popup.html'),
        background: resolve(__dirname, 'src/background/background.js'),
        contentScript: resolve(__dirname, 'src/content/contentScript.js'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'src/background/background.js';
          }
          if (chunkInfo.name === 'contentScript') {
            return 'src/content/contentScript.js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
