// Prints the generated HTML résumé to a text-based (selectable) PDF with Chromium.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, '../developer-portfolio/package.json'));
const { chromium } = require('@playwright/test');

const html = path.join(here, 'dist', 'Harshith-C-Shenoy-Resume.html');
const pdf = path.join(here, 'dist', 'Harshith-C-Shenoy-Resume.pdf');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(html).href);
await page.pdf({ path: pdf, format: 'A4', preferCSSPageSize: true, printBackground: false, tagged: true, outline: false });
await browser.close();
console.log('wrote', pdf);
