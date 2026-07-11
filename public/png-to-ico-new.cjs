const fs = require('fs');
const path = require('path');

function pngToIco(pngPath, outPath) {
  const buf = fs.readFileSync(pngPath);
  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  if (!buf.slice(0,8).equals(sig)) throw new Error('Not a PNG');
  const ihdrOffset = 8 + 4;
  const ihdrType = buf.slice(ihdrOffset, ihdrOffset+4).toString('ascii');
  if (ihdrType !== 'IHDR') throw new Error('Invalid PNG (no IHDR)');
  const ihdrData = buf.slice(ihdrOffset+4, ihdrOffset+4+13);
  const width = ihdrData.readUInt32BE(0);
  const height = ihdrData.readUInt32BE(4);

  const widthByte = width >= 256 ? 0 : width;
  const heightByte = height >= 256 ? 0 : height;

  const pngSize = buf.length;
  const iconDirSize = 6;
  const entrySize = 16;
  const imageOffset = iconDirSize + entrySize;

  const out = Buffer.alloc(imageOffset);
  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2);
  out.writeUInt16LE(1, 4);
  out.writeUInt8(widthByte, 6);
  out.writeUInt8(heightByte, 7);
  out.writeUInt8(0, 8);
  out.writeUInt8(0, 9);
  out.writeUInt16LE(1, 10);
  out.writeUInt16LE(32, 12);
  out.writeUInt32LE(pngSize, 14);
  out.writeUInt32LE(imageOffset, 18);

  const finalBuf = Buffer.concat([out, buf]);
  fs.writeFileSync(outPath, finalBuf);
}

try {
  const publicDir = path.resolve(__dirname);
  const inputCandidates = ['favicon-32x32.png','icon.png','smartkenya-logo.png'];
  let input = null;
  for (const c of inputCandidates) {
    const p = path.join(publicDir, c);
    if (fs.existsSync(p)) { input = p; break; }
  }
  if (!input) throw new Error('No input PNG found');
  const out = path.join(publicDir, 'favicon_new.ico');
  pngToIco(input, out);
  const stat = fs.statSync(out);
  console.log('Wrote', out, stat.size, 'bytes');
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
