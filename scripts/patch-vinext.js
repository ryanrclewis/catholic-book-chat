import fs from 'node:fs';
import path from 'node:path';

const targetFile = path.resolve('node_modules/vinext/dist/entries/pages-server-entry.js');

if (!fs.existsSync(targetFile)) {
  console.error(`Target file not found: ${targetFile}`);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf-8');

const targetStr = `function collectAssetTags(manifest, moduleIds, scriptNonce) {
  // Fall back to embedded manifest (set by vinext:cloudflare-build for Workers)
  const m = (manifest && Object.keys(manifest).length > 0)
    ? manifest
    : (typeof globalThis !== "undefined" && globalThis.__VINEXT_SSR_MANIFEST__) || null;
  const tags = [];
  const seen = new Set();
  const nonceAttr = __createNonceAttribute(scriptNonce);`;

const patchStr = `function collectAssetTags(manifest, moduleIds, scriptNonce) {
  // Fall back to embedded manifest (set by vinext:cloudflare-build for Workers)
  const m = (manifest && Object.keys(manifest).length > 0)
    ? manifest
    : (typeof globalThis !== "undefined" && globalThis.__VINEXT_SSR_MANIFEST__) || null;

  // Always include _app in moduleIds to collect global CSS and layout scripts
  if (m) {
    if (!moduleIds) moduleIds = [];
    for (var key in m) {
      if (key.endsWith("_app.jsx") || key.endsWith("_app.tsx") || key.endsWith("_app.js") || key === "pages/_app") {
        if (moduleIds.indexOf(key) === -1) {
          moduleIds.push(key);
        }
      }
    }
  }

  // Find the entry script index-[hash].js from the manifest if not set
  if (m && typeof globalThis !== "undefined" && !globalThis.__VINEXT_CLIENT_ENTRY__) {
    for (var key in m) {
      var vals = m[key];
      if (vals) {
        for (var vi = 0; vi < vals.length; vi++) {
          var file = vals[vi];
          var basename = file.split("/").pop() || "";
          if (basename.startsWith("index-") && basename.endsWith(".js")) {
            globalThis.__VINEXT_CLIENT_ENTRY__ = file;
            break;
          }
        }
      }
      if (globalThis.__VINEXT_CLIENT_ENTRY__) break;
    }
  }

  const tags = [];
  const seen = new Set();
  const nonceAttr = __createNonceAttribute(scriptNonce);`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, patchStr);
  fs.writeFileSync(targetFile, content, 'utf-8');
  console.log(`Successfully patched vinext at: ${targetFile}`);
} else {
  console.log(`Target string not found in ${targetFile} (already patched?)`);
}
