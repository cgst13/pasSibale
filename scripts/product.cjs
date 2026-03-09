const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

let rawdata = fs.readFileSync('package.json');
let version = `v${JSON.parse(rawdata).version}`;
let name = JSON.parse(rawdata).name;

const excludedFilesAndFolders = [
  '.git',
  'dist',
  'node_modules',
  'build',
  'product.js',
  'postinstall.js',
  'scripts',
  '.env'
];
const sourceDir = './'; // Current directory

const output = fs.createWriteStream(`${name}-${version}.zip`);
const archive = archiver('zip', {
  zlib: { level: 9 } // Set compression level
});

output.on('close', function () {
  console.log('Product created:', archive.pointer() + ' total bytes');
});

archive.on('warning', function (err) {
  if (err.code === 'ENOENT') {
    // Ignore unsupported file types
  } else {
    throw err;
  }
});

archive.on('error', function (err) {
  throw err;
});

archive.pipe(output);

function addFilesToArchive(directory) {
  const items = fs.readdirSync(directory);

  items.forEach(item => {
    const itemPath = path.join(directory, item);
    const stats = fs.statSync(itemPath);

    if (!excludedFilesAndFolders.includes(item)) {
      if (stats.isDirectory()) {
        archive.directory(itemPath, item);
      } else if (item === '.env.product') {
        archive.file(itemPath, { name: '.env' });
      } else {
        archive.file(itemPath);
      }
    }
  });
}

addFilesToArchive(sourceDir);

archive.finalize();
