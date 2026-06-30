const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist', 'index.html');
const bundleDir = path.join(__dirname, '..', 'dist', '_expo', 'static', 'js', 'web');

if (!fs.existsSync(distPath)) {
  console.error('dist/index.html not found. Run expo export first.');
  process.exit(1);
}

let html = fs.readFileSync(distPath, 'utf8');

// Enable safe-area insets for iOS WebView.
html = html.replace(
  /<meta name="viewport" content="([^"]+)"\s*\/>/,
  (match, content) => {
    if (content.includes('viewport-fit=cover')) return match;
    return `<meta name="viewport" content="${content}, viewport-fit=cover" />`;
  }
);

// Make every relative asset and route resolve against the exported folder.
if (!html.includes('<base href="./">')) {
  html = html.replace('</head>', '  <base href="./" />\n  </head>');
}

// Ensure relative asset paths for Capacitor.
html = html.replace(/href="\//g, 'href="./');
html = html.replace(/src="\//g, 'src="./');

// Inject a visible HTML fallback in case JS fails.
const fallbackMarkup = `
    <div id="boot-fallback" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0D0D0D;color:#fff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <div style="text-align:center;max-width:320px;padding:24px;">
        <div style="width:72px;height:72px;border-radius:36px;background:#10211d;border:1px solid #00E5C7;display:flex;align-items:center;justify-content:center;margin:0 auto 16px auto;">
          <span style="font-size:32px;font-weight:800;color:#00E5C7;">J</span>
        </div>
        <div style="font-size:22px;font-weight:700;">Cunningham Fitness</div>
        <div data-boot-message style="margin-top:8px;font-size:14px;color:#9CA3AF;">Loading app…</div>
      </div>
    </div>
    <div id="boot-error" style="position:fixed;left:16px;right:16px;bottom:24px;max-height:40%;overflow:auto;background:rgba(10,10,10,0.9);border:1px solid #3b3b3b;border-radius:12px;color:#fff;font-family:ui-monospace,Menlo,Monaco,Consolas,monospace;font-size:12px;padding:12px;display:none;z-index:9999;"></div>
    <script>
      window.__J_FIT_BOOT_TIMEOUT__ = setTimeout(function(){
        var el = document.getElementById('boot-fallback');
        if (el) {
          var subtitle = el.querySelector('[data-boot-message]');
          if (subtitle) subtitle.textContent = 'App did not load. Check web bundle paths.';
        }
      }, 4000);

      (function(){
        function showError(message){
          var err = document.getElementById('boot-error');
          if (!err) return;
          err.style.display = 'block';
          err.textContent = message;
        }
        window.addEventListener('error', function(e){
          showError('JS Error: ' + (e.message || 'Unknown error'));
        });
        window.addEventListener('unhandledrejection', function(e){
          var reason = e.reason && e.reason.message ? e.reason.message : String(e.reason || 'Unknown rejection');
          showError('Unhandled promise rejection: ' + reason);
        });
        var readyInterval = setInterval(function(){
          if (window.__APP_READY__) {
            var fallback = document.getElementById('boot-fallback');
            if (fallback) fallback.remove();
            clearInterval(readyInterval);
          }
        }, 250);
      })();
    </script>
`;

if (html.includes('id="boot-fallback"')) {
  html = html.replace(
    /<div style="margin-top:8px;font-size:14px;color:#9CA3AF;">Loading app…<\/div>/,
    '<div data-boot-message style="margin-top:8px;font-size:14px;color:#9CA3AF;">Loading app…</div>'
  );
  html = html.replace(
    /el\.querySelector\('div div:nth-child\(3\)'\)\.textContent = 'App did not load\. Check web bundle paths\.';/,
    "var subtitle = el.querySelector('[data-boot-message]');\n        if (subtitle) subtitle.textContent = 'App did not load. Check web bundle paths.';"
  );
  html = html.replace(
    /el\.querySelector\('div div:nth-child\(3\)'\)\.textContent='Bundle failed to load\. Check asset paths\.';/,
    "var subtitle = el.querySelector('[data-boot-message]');if(subtitle){subtitle.textContent='Bundle failed to load. Check asset paths.';}"
  );
}

if (!html.includes('boot-fallback')) {
  html = html.replace('<div id="root"></div>', '<div id="root"></div>' + fallbackMarkup);
}

// Add onload/onerror handlers to the main bundle script tag.
// Keep Expo's normal classic script format. Metro web bundles are not ESM modules,
// and iOS WebView can fail silently when this is rewritten to type="module".
html = html.replace(
  /<script src="(\.\/\_expo\/static\/js\/web\/[^\"]+)" defer><\/script>/,
  '<script src="$1" defer onerror="(function(){var el=document.getElementById(\'boot-fallback\');if(el){var subtitle=el.querySelector(\'[data-boot-message]\');if(subtitle){subtitle.textContent=\'Bundle failed to load. Check asset paths.\';}}})()"></script>'
);

fs.writeFileSync(distPath, html);
// Patch absolute asset URLs and Vite env guards in every emitted JS bundle.
if (fs.existsSync(bundleDir)) {
  const bundleFiles = fs.readdirSync(bundleDir).filter((file) => file.endsWith('.js'));
  for (const bundleFile of bundleFiles) {
    const bundlePath = path.join(bundleDir, bundleFile);
    let bundle = fs.readFileSync(bundlePath, 'utf8');
    // Some web dependencies ship Vite-style import.meta.env guards. Metro emits
    // a classic script for Expo web export, and iOS WebView throws a syntax
    // error when import.meta appears outside a module. Replace those guards with
    // production constants so the bundle remains classic-script compatible.
    bundle = bundle.replace(/import\.meta\.env\?import\.meta\.env\.MODE:void 0/g, '"production"');
    bundle = bundle.replace(/import\.meta\.env\.MODE/g, '"production"');
    bundle = bundle.replace(/import\.meta\.env/g, '({MODE:"production"})');
    bundle = bundle.replace(/"\/assets\//g, '"./assets/');
    bundle = bundle.replace(/"\/_expo\/static\/js\/web\//g, '"./_expo/static/js/web/');
    bundle = bundle.replace(/'\/_expo\/static\/js\/web\//g, "'./_expo/static/js/web/");
    bundle = bundle.replace(/`\/_expo\/static\/js\/web\//g, "`./_expo/static/js/web/");
    bundle = bundle.replace(/:"\/_expo\/static\/js\/web\//g, ':"./_expo/static/js/web/');
    bundle = bundle.replace(/"\/videos\//g, '"./videos/');
    bundle = bundle.replace(/"\/media\//g, '"./media/');
    bundle = bundle.replace(/'\/media\//g, "'./media/");
    fs.writeFileSync(bundlePath, bundle);
  }
}

console.log('Patched dist/index.html and bundle assets for Capacitor.');
