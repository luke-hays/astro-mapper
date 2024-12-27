import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://treecommerce.dev';
const PATH = '/products/the-mystery-liquid';
const LOCAL_MAPS_DIR = './maps';
const __dirname = path.resolve();

const browser = await chromium.launch();
const page = await browser.newPage();

const sourceMapRequests = [];

// Set up response listener
page.on('response', async (response) => {
  const url = response.url();

  if (!url.endsWith('.js')) return;

  const body = await response.text();
  const sourceMapUrl = body.match(/sourceMappingURL=([^'"]+\.map)/)?.[1];

  if (sourceMapUrl) {
    console.log(`Response with source map URL: ${url}`);
    console.log(`Source map URL: ${sourceMapUrl}`);

    sourceMapRequests.push(
      new Promise((resolve) => {
        resolve(page.request.fetch(url + '.map'))
      })
    );
  }

  console.log('--------------------------------');
});

// Go to the page we are interested in attempt to view src maps on
await page.goto(`${BASE_URL}${PATH}`);
// Add a small delay to ensure we capture all responses
await page.waitForLoadState('networkidle');
// Wait for all requests for source map files to finish
const results = await Promise.allSettled(sourceMapRequests);

// Create a directory for maps if it does not already exist
fs.mkdir(path.resolve(__dirname, LOCAL_MAPS_DIR), {recursive: true}, e => {
  if (e) {
    console.error(e);
    return;
  }
})

// Go through each response to fetch the map file
results.forEach(async result => {
  const response = result.value;
  const body = await response.text();

  const fileName = response.url().split('/').pop()
  fs.writeFile(`${__dirname}\\maps\\${fileName}`, body, err => {
    if (err) {
      console.error(err)
    }
  })

  const encodedSourceMap = body.match(/sourceMappingURL=data:application\/json;.*;base64,([^"]+)/)?.[1];
  if (encodedSourceMap) {
    const decodedSourceMap = Buffer.from(encodedSourceMap, 'base64').toString('utf-8');
    fs.writeFile(`${__dirname}\\maps\\${fileName}.out.map`, decodedSourceMap, err => {
      if (err) {
        console.error(err)
      }
    })
  }
}) 

await browser.close()
