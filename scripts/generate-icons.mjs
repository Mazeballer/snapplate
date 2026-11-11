// Generates the PWA icon set from one SVG. Run: node scripts/generate-icons.mjs
import { mkdir, rm } from "node:fs/promises";
import sharp from "sharp";

const BG = "#0c1210";
const GREEN = "#16a34a";

const BODY =
  "M256 204C236 182 196 180 174 208C148 242 156 304 184 340C202 364 226 370 242 362Q256 356 270 362C286 370 310 364 328 340C356 304 364 242 338 208C316 180 276 182 256 204Z";
const LEAF = "M268 176C268 150 290 130 322 128C322 158 300 178 268 176Z";

// Minimalist: one flat green apple with a leaf on a dark square. `scale` is the size of the
// artwork; maskable icons use a smaller one to stay inside the safe zone.
const svg = (scale) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BG}"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -258)" fill="${GREEN}">
    <path d="${BODY}"/>
    <path d="${LEAF}"/>
  </g>
</svg>`;

const render = (scale, size, file) =>
  sharp(Buffer.from(svg(scale))).resize(size, size).png().toFile(file);

await rm("public/icons", { recursive: true, force: true });
await mkdir("public/icons", { recursive: true });
await Promise.all([
  render(1.45, 192, "public/icons/icon-192.png"),
  render(1.45, 512, "public/icons/icon-512.png"),
  render(1.15, 512, "public/icons/icon-maskable-512.png"),
  render(1.45, 180, "app/apple-icon.png"),
  render(1.45, 512, "app/icon.png"),
]);
console.log("icons written");
