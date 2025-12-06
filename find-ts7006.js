const { spawn } = require('child_process');

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
  const lines = output.split('\n').filter(l => l.includes('error TS7006'));

  const byFile = {};
  lines.forEach(l => {
    const m = l.match(/^([^(]+)\(/);
    if (m) {
      const file = m[1].trim();
      if (!byFile[file]) byFile[file] = [];
      byFile[file].push(l);
    }
  });

  console.log('Files with TS7006 errors:');
  Object.entries(byFile)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 20)
    .forEach(([file, errors]) => {
      console.log(`  ${file}: ${errors.length} errors`);
    });
});
