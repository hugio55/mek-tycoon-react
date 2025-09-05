import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 Swarm System Check');
console.log('=' .repeat(50));

// Check API Key
if (process.env.ANTHROPIC_API_KEY) {
    console.log('✅ API Key: Set');
} else {
    console.log('❌ API Key: Not set');
    console.log('   Run: set ANTHROPIC_API_KEY=your-key-here');
}

// Check Node version
console.log(`✅ Node Version: ${process.version}`);

// Check dependencies
try {
    await import('@anthropic-ai/sdk');
    console.log('✅ Anthropic SDK: Installed');
} catch {
    console.log('❌ Anthropic SDK: Not found');
}

try {
    await import('express');
    console.log('✅ Express: Installed');
} catch {
    console.log('❌ Express: Not found');
}

try {
    await import('socket.io');
    console.log('✅ Socket.io: Installed');
} catch {
    console.log('❌ Socket.io: Not found');
}

// Check files
const files = [
    'mek-swarm.js',
    'dashboard/index.html',
    'start-swarm.bat',
    'package.json'
];

console.log('\n📁 File Check:');
for (const file of files) {
    const exists = await import('fs').then(fs => 
        fs.promises.access(path.join(__dirname, file))
            .then(() => true)
            .catch(() => false)
    );
    console.log(`${exists ? '✅' : '❌'} ${file}`);
}

console.log('\n' + '=' .repeat(50));
console.log('Ready to run: node mek-swarm.js "your task"');
console.log('Or use: start-swarm.bat');