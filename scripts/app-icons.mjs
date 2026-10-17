// Die App-Symbole, gerendert aus `public/logo.svg` mit sharp. Von Hand nach einer Änderung am
// Logo ausführen und die PNGs committen: `npm run icons`. Größen und Ränder nach dem
// ohmtools-Design (DESIGN.md, „App icon, favicon, link preview“):
//
// - `apple-touch-icon.png` (180): iOS nimmt das Symbol für den Home-Bildschirm nur von diesem
//   Link, nie aus dem Manifest. iOS rundet die Ecken selbst und malt Transparenz schwarz,
//   deshalb randlos: der Squircle wird ein Quadrat, der Rand entfällt.
// - `icon-192.png`, `icon-512.png`: die PNGs des Manifests neben dem SVG, für Android-Browser
//   ohne SVG-Symbole. Das Logo wie gezeichnet, mit transparenten Ecken.
// - `icon-maskable-512.png`: Android schneidet App-Symbole auf seine eigene Form zu; ohne
//   maskable verkleinert es das Symbol auf eine weiße Platte. Randlos wie das für iOS; das
//   Glyph liegt im Kreis mit 40 % Radius, es wird also nichts abgeschnitten.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const logo = fs.readFileSync(path.join(root, 'public/logo.svg'), 'utf8')

const fullBleed = logo
  .replace(/ rx="112" ry="112"/, '')
  .replace(/\s*<rect[^>]*stroke-opacity="0\.12"[^>]*\/>/, '')
if (fullBleed === logo || /rx="112"|stroke-opacity="0\.12"/.test(fullBleed)) {
  throw new Error('app-icons: public/logo.svg hat eine andere Form, Ersetzungen anpassen')
}

const icons = [
  { file: 'apple-touch-icon.png', size: 180, svg: fullBleed },
  { file: 'icon-192.png', size: 192, svg: logo },
  { file: 'icon-512.png', size: 512, svg: logo },
  { file: 'icon-maskable-512.png', size: 512, svg: fullBleed },
]

for (const { file, size, svg } of icons) {
  await sharp(Buffer.from(svg), { density: (72 * size) / 512 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, 'public', file))
  console.log(`public/${file}`)
}
