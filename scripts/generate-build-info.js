const fs = require('fs');
const path = require('path');

function getKSTTime() {
    const now = new Date();
    // 1. Calculate UTC time
    // 2. Add 9 hours for KST
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kstGap = 9 * 60 * 60 * 1000;
    const kstTime = new Date(utc + kstGap);

    const year = kstTime.getFullYear();
    const month = String(kstTime.getMonth() + 1).padStart(2, '0');
    const day = String(kstTime.getDate()).padStart(2, '0');
    const hour = String(kstTime.getHours()).padStart(2, '0');
    const minute = String(kstTime.getMinutes()).padStart(2, '0');

    return `${year}.${month}.${day} ${hour}:${minute}`;
}

const buildDate = getKSTTime();
const content = `export const BUILD_DATE = "${buildDate}";\n`;

// Resolve path to src/lib/buildInfo.ts
const outputPath = path.join(__dirname, '../src/lib/buildInfo.ts');

// Ensure directory exists (src/lib likely exists, but good to be safe)
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outputPath, content);
console.log(`[Build Info] Generated build date: ${buildDate}`);
