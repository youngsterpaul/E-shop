const Jimp = require('jimp');
const ico = require('png-to-ico');
const fs = require('fs');

(async () => {
  try {
    const input = 'icon.png';
    const square = 'icon_square.png';
    const out = 'favicon.ico';

    const img = await Jimp.read(input);
    const size = Math.max(img.bitmap.width, img.bitmap.height);
    const canvas = new Jimp(size, size, 0x00000000);
    const x = Math.floor((size - img.bitmap.width) / 2);
    const y = Math.floor((size - img.bitmap.height) / 2);
    canvas.composite(img, x, y);
    await canvas.resize(512, 512, Jimp.RESIZE_BICUBIC);
    await canvas.writeAsync(square);

    const buf = await ico([square]);
    fs.writeFileSync(out, buf);
    console.log('favicon generated:', out);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
