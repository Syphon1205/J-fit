const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@capacitor',
  'local-notifications',
  'ios',
  'Sources',
  'LocalNotificationsPlugin',
  'LocalNotificationsHandler.swift'
);

if (!fs.existsSync(filePath)) {
  console.warn('[patch-capacitor-local-notifications-ios] Local notifications Swift file not found; skipping.');
  process.exit(0);
}

let source = fs.readFileSync(filePath, 'utf8');
let changed = false;

const deprecatedPresentation = `.alert
        ]`;
const modernPresentation = `.banner,
            .list
        ]`;

if (source.includes(deprecatedPresentation)) {
  source = source.replace(deprecatedPresentation, modernPresentation);
  changed = true;
}

if (changed) {
  fs.writeFileSync(filePath, source);
  console.log('[patch-capacitor-local-notifications-ios] Applied iOS notification warning patches.');
} else {
  console.log('[patch-capacitor-local-notifications-ios] iOS notification warning patches already applied.');
}
