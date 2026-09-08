import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const require = createRequire(process.env.DTC_NODE_MODULES ? process.env.DTC_NODE_MODULES + '/package.json' : import.meta.url);
const sharp = require('sharp');
const sourceRoot = process.argv[2] || fileURLToPath(new URL('../../DustToCosmos/Resources/Textures/earth/', import.meta.url));
const output = fileURLToPath(new URL('../assets/earth/', import.meta.url));
await mkdir(output, { recursive: true });
const channels = [['day', 'albedo_8k.jpg'], ['clouds', 'clouds_8k.jpg'], ['night', 'nightlights_8k.jpg'], ['ocean', 'specular_8k.tif'], ['normal', 'normal_8k.tif']];
const manifest = { credit: 'Solar System Scope / INOVE, based on NASA data', source: 'https://www.solarsystemscope.com/textures/', license: 'CC BY 4.0', licenseURL: 'https://creativecommons.org/licenses/by/4.0/', modifications: 'Resized and encoded as WebP. Used with authored illustrative lighting, cloud shading, atmosphere and accelerated rotation. Not current cloud observations or a native app rendering capture.', textures: [] };
for (const [channel, file] of channels) {
  const input = await readFile(sourceRoot + '/' + file);
  for (const width of channel === 'day' || channel === 'clouds' ? [2048, 4096] : [2048]) {
    const name = `${channel}-${width}.webp`;
    const info = await sharp(input).resize({ width }).webp({ quality: channel === 'normal' || channel === 'ocean' ? 95 : 90, effort: 6 }).toFile(output + name);
    manifest.textures.push({ channel, file: name, sourceFile: file, sourceSHA256: createHash('sha256').update(input).digest('hex'), width: info.width, height: info.height, bytes: info.size });
    console.log(`${name}: ${Math.round(info.size / 1024)} KB`);
  }
}
await writeFile(output + 'credits.json', JSON.stringify(manifest, null, 2) + '\n');
