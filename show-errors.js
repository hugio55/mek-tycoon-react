const { spawn } = require('child_process');

const targetFile = process.argv[2] || 'convex/mekLeveling.ts';

const tsc = spawn('npx', ['tsc', '--noEmit'], {
  cwd: 'C:\\Users\\Ben Meyers\\Documents\\Mek Tycoon\\TYCOON REACT 8-27\\mek-tycoon-react-staging',
  shell: true
});

let output = '';

tsc.stdout.on('data', (data) => {
  output += data.toString();
});

tsc.stderr.on('data', (data) => {
  output += data.toString();
});

tsc.on('close', (code) => {
  const lines = output.split('\n')
    .filter(l => l.includes('error TS7006') && l.includes(targetFile.replace(/\\/g, '/')));

  console.log(`TS7006 errors in ${targetFile}:`);
  lines.forEach(l => console.log(l));
});
