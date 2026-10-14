const fs = require('fs');
const [,, mode, file, base64Data] = process.argv;
const buffer = Buffer.from(base64Data, 'base64');
if (mode === 'init') {
  fs.writeFileSync(file, buffer);
} else {
  fs.appendFileSync(file, buffer);
}
console.log('Processed', buffer.length, 'bytes for', file);
