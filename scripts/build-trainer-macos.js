const fs = require('fs');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

const root = path.join(__dirname, '..');
const projectDir = path.join(root, 'desktop', 'macos', 'CunninghamTrainer');
const outputDir = path.join(root, 'desktop', 'macos', 'build');
const cacheDir = path.join(outputDir, '.cache');
const clangModuleCacheDir = path.join(cacheDir, 'clang-module-cache');
const appName = 'Cunningham Trainer';
const appBundle = path.join(outputDir, `${appName}.app`);
const contentsDir = path.join(appBundle, 'Contents');
const macosDir = path.join(contentsDir, 'MacOS');
const resourcesDir = path.join(contentsDir, 'Resources');
const executableName = 'CunninghamTrainer';
const builtExecutable = path.join(projectDir, '.build', 'release', executableName);
const iconSource = path.join(root, 'assets', 'icon.png');
const iconsetDir = path.join(outputDir, 'CunninghamTrainer.iconset');
const icnsPath = path.join(resourcesDir, 'AppIcon.icns');
const shouldOpen = process.argv.includes('--open');

function run(command, args, options = {}) {
  execFileSync(command, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      CLANG_MODULE_CACHE_PATH: clangModuleCacheDir,
      SWIFTPM_CACHE_PATH: path.join(cacheDir, 'swiftpm'),
    },
    ...options,
  });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, contents) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents);
}

function copyFile(source, target) {
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
}

function createIcon() {
  if (!fs.existsSync(iconSource)) return false;

  fs.rmSync(iconsetDir, { recursive: true, force: true });
  ensureDir(iconsetDir);

  const sizes = [
    [16, 'icon_16x16.png'],
    [32, 'icon_16x16@2x.png'],
    [32, 'icon_32x32.png'],
    [64, 'icon_32x32@2x.png'],
    [128, 'icon_128x128.png'],
    [256, 'icon_128x128@2x.png'],
    [256, 'icon_256x256.png'],
    [512, 'icon_256x256@2x.png'],
    [512, 'icon_512x512.png'],
    [1024, 'icon_512x512@2x.png'],
  ];

  try {
    for (const [size, name] of sizes) {
      run('sips', ['-z', String(size), String(size), iconSource, '--out', path.join(iconsetDir, name)], { stdio: 'ignore' });
    }
    run('iconutil', ['-c', 'icns', iconsetDir, '-o', icnsPath], { stdio: 'ignore' });
    fs.rmSync(iconsetDir, { recursive: true, force: true });
    return fs.existsSync(icnsPath);
  } catch {
    fs.rmSync(iconsetDir, { recursive: true, force: true });
    return false;
  }
}

if (!fs.existsSync(path.join(projectDir, 'Package.swift'))) {
  console.error('[desktop:build] CunninghamTrainer Package.swift was not found.');
  process.exit(1);
}

ensureDir(clangModuleCacheDir);
run('swift', ['build', '-c', 'release'], { cwd: projectDir });

if (!fs.existsSync(builtExecutable)) {
  console.error(`[desktop:build] Expected executable missing: ${builtExecutable}`);
  process.exit(1);
}

fs.rmSync(appBundle, { recursive: true, force: true });
ensureDir(macosDir);
ensureDir(resourcesDir);

copyFile(builtExecutable, path.join(macosDir, executableName));
fs.chmodSync(path.join(macosDir, executableName), 0o755);

const hasIcon = createIcon();

writeFile(path.join(contentsDir, 'Info.plist'), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleDisplayName</key>
  <string>${appName}</string>
  <key>CFBundleExecutable</key>
  <string>${executableName}</string>
  <key>CFBundleIdentifier</key>
  <string>com.cunninghamfitness.trainer</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>${appName}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  ${hasIcon ? '<key>CFBundleIconFile</key>\n  <string>AppIcon</string>' : ''}
  <key>LSApplicationCategoryType</key>
  <string>public.app-category.healthcare-fitness</string>
  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>NSLocalNetworkUsageDescription</key>
  <string>Cunningham Trainer uses the local network to find and sync nearby Cunningham Fitness clients.</string>
</dict>
</plist>
`);

writeFile(path.join(contentsDir, 'PkgInfo'), 'APPL????');

console.log(`[desktop:build] Built ${appBundle}`);

if (shouldOpen) {
  const child = spawn('open', [appBundle], { detached: true, stdio: 'ignore' });
  child.unref();
}
