const exec = require('child_process').exec;
const path = require('path');

const requirements = path.join(__dirname, './src/lib/python/requirements.txt');


exec('yarn install', (err, out) => {
  if (err) throw new Error(err);
  console.log(out);
}).on('close', () => {
  console.log(`pip install -r "${requirements}"`);
  exec(`pip install -r "${requirements}"`, (err, out) => {
    if (err) throw new Error(err);
    console.log(out);
  }).on('close', () => {
    console.log("\x1b[41m%s\x1b[37m%s\x1b[5m", 'IMPORTANT:', "\x1b[0m");
    console.log('\x1b[33m%s\x1b[0m', 'set python path in src/lib/python/venv/pyenv.cfg', "\x1b[0m");
  });
});