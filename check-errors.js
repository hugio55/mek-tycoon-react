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
  const lines = output.split('\n').filter(l => l.includes('error TS'));
  console.log('Total errors:', lines.length);

  const byType = {};
  lines.forEach(l => {
    const m = l.match(/error (TS\d+)/);
    if (m) {
      byType[m[1]] = (byType[m[1]] || 0) + 1;
    }
  });

  console.log('Breakdown:');
  Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
});
