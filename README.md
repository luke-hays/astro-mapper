# Astro Mapper

Astro Mapper is a tool for obtaining sourcemaps exposed server side code from vulnerable websites built on the Astro framework. This vulnerablity is described in [CVE-2024-56159](https://www.cve.org/CVERecord?id=CVE-2024-56159).

This tool is for educational purposes only.

## Usage

This tool uses Node and Playwright.

Run the following commands

```bash
npm i
node astro-mapper.js <URL>
```

A `map` directory , as well as a collection of map files, will be created in this project to store sourcemaps. These files can then be separately analyzed with a visualizer.

Sometimes the sourcemaps contain base64-encoded sourcemap URLs within them. This tool will decode those and write them to the `map` directory with `.decoded.map` appended to them. These files are where I've found the server-side code to reside.