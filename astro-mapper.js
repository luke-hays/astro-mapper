import { chromium } from '@playwright/test';
import { argv } from 'node:process'
import fs from 'fs';
import path from 'path';

const args = argv.slice(2)

if (args <= 2) {
  console.error('Incorrect number of arguments provided.\nFormat should be "node main.js <url>"')
  process.exit(1)
}

const URL = args[0]
const LOCAL_MAPS_DIR = './maps'

const browser = await chromium.launch();
const page = await browser.newPage();

const sourceMapRequests = [];

// Response listener will parse each response and check for a sourceMappingURL that matches to a .map file
// This source map will be fetched and processed later
page.on('response', async (response) => {
  const url = response.url();

  if (!url.endsWith('.js')) return;

  const body = await response.text();
  const sourceMapUrl = body.match(/sourceMappingURL=([^'"]+\.map)/)?.[1];

  if (sourceMapUrl) {
    console.log(`Response with source map URL in chunk: ${url}`);
    console.log(`Fetching source map: ${sourceMapUrl} ...`);

    sourceMapRequests.push(
      new Promise((resolve) => {
        resolve(page.request.fetch(url + '.map'))
      })
    );
  }

  console.log('--------------------------------');
});

await page.goto(URL);

// Add a small delay to ensure we capture all responses
await page.waitForLoadState('networkidle');
const sourceMapResults = await Promise.allSettled(sourceMapRequests);

// Create a directory for maps if it does not already exist
fs.mkdir(LOCAL_MAPS_DIR, {recursive: true}, e => {
  if (e) {
    console.error(e);
    process.exit(1);
  }
})

// Go through each response to fetch the map file
sourceMapResults.forEach(async result => {
  const response = result.value;
  const body = await response.text();

  const fileName = response.url().split('/').pop()
  fs.writeFile(`${path.resolve(LOCAL_MAPS_DIR, fileName)}`, body, err => {
    if (err) {
      console.error(err)
    }
  })

  const encodedSourceMap = body.match(/sourceMappingURL=data:application\/json;.*;base64,([^"]+)/)?.[1];
  if (encodedSourceMap) {
    const decodedSourceMap = Buffer.from(encodedSourceMap, 'base64').toString('utf-8');
    fs.writeFile(`${path.resolve(LOCAL_MAPS_DIR, fileName+'.decoded.map')}`, decodedSourceMap, err => {
      if (err) {
        console.error(err)
      }
    })
  }
}) 

await browser.close()
