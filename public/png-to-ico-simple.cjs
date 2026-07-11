const fs = require('fs');
const path = require('path');

function pngToIco(pngPath, outPath) {
  const buf = fs.readFileSync(pngPath);
  // PNG signature
  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  if (!buf.slice(0,8).equals(sig)) throw new Error('Not a PNG');
  // IHDR chunk begins at offset 8: length(4) 'IHDR'(4) data(13)
  const ihdrOffset = 8 + 4; // skip length
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
  // ICONDIR
  out.writeUInt16LE(0, 0); // reserved
  out.writeUInt16LE(1, 2); // type (1 = icon)
  out.writeUInt16LE(1, 4); // count
  // ICONDIRENTRY (16 bytes)
  out.writeUInt8(widthByte, 6); // width
  out.writeUInt8(heightByte, 7); // height
  out.writeUInt8(0, 8); // color count
  out.writeUInt8(0, 9); // reserved
  out.writeUInt16LE(1, 10); // planes
  out.writeUInt16LE(32, 12); // bit count
  out.writeUInt32LE(pngSize, 14); // bytes in resource
  out.writeUInt32LE(imageOffset, 18); // image offset

  const finalBuf = Buffer.concat([out, buf]);
  fs.writeFileSync(outPath, finalBuf);
}

try {
  const publicDir = path.resolve(__dirname);
  const src = path.join(publicDir, 'favicon-32x32.png');
  const src2 = path.join(publicDir, 'icon.png');
  let input = src;
  if (!fs.existsSync(input)) {
    if (fs.existsSync(src2)) input = src2;
    else throw new Error('No input PNG found');
  }
  const out = path.join(publicDir, 'favicon.ico');
  pngToIco(input, out);
  const stat = fs.statSync(out);
  console.log('Wrote', out, stat.size, 'bytes');
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
