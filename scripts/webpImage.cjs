const webp = require('webp-converter');
const { glob } = require('glob');

let images = [];

(async () => {
  images = await glob('src/assets/img/blog/*.png');

  images.forEach(image => {
    const outDir = image.replace(/\.\w+/i, '.webp');
    const result = webp.cwebp(image, outDir, '-q 100', (logging = '-v'));
    result.then(() => {
      console.log({ image, outDir });
    });
  });
})();
