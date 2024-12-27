# Astro Mapper

Astro Mapper is a tool for obtaining exposed sourcemaps in Astro codebases that are vulnerable as described in [CVE-2024-56159](https://www.cve.org/CVERecord?id=CVE-2024-56159).

This tool is for educational purposes only.

## Usage

The only real dependencies in this project are on Node and Playwright.

Run the following commands

```
npm i
node astro-mapper.js <URL>
```

A collection of map files will be created locally in a `map` directory in this project. These files can then be analyzed with a visualizer to view server side code.

Sometimes the map files have base64 encoded url string within them. This tool will also decode those and write them to .decoded.map files as well. In my experience, these files are where I've found the server side code to reside.