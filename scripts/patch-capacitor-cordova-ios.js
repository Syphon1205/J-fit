const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '..', 'node_modules', '@capacitor', 'ios', 'CapacitorCordova', 'CapacitorCordova', 'Classes', 'Public', 'CDVWebViewProcessPoolFactory.h'),
  path.join(__dirname, '..', 'node_modules', '@capacitor', 'ios', 'CapacitorCordova', 'CapacitorCordova', 'Classes', 'Public', 'CDVWebViewProcessPoolFactory.m'),
];

let changed = false;

for (const filePath of files) {
  if (!fs.existsSync(filePath)) continue;
  let source = fs.readFileSync(filePath, 'utf8');
  if (source.includes('#pragma clang diagnostic ignored "-Wdeprecated-declarations"')) continue;

  source = source.replace(
    '#import <WebKit/WebKit.h>',
    `#import <WebKit/WebKit.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"`
  );

  if (filePath.endsWith('.h')) {
    source = source.replace('@end\n', '@end\n\n#pragma clang diagnostic pop\n');
  } else {
    source = source.replace('@end\n', '@end\n\n#pragma clang diagnostic pop\n');
  }

  fs.writeFileSync(filePath, source);
  changed = true;
}

console.log(changed ? '[patch-capacitor-cordova-ios] Applied WKProcessPool warning patch.' : '[patch-capacitor-cordova-ios] WKProcessPool warning patch already applied.');
