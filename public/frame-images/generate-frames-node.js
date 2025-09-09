const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generateFrames() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // HTML content with frames
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            margin: 0;
            padding: 40px;
            background: transparent;
        }
        
        .frame {
            width: 400px;
            height: 400px;
            position: relative;
            box-sizing: border-box;
            margin-bottom: 40px;
        }
        
        /* Frame 1: Classic Gold Industrial */
        .frame1 {
            border: 20px solid transparent;
            background: 
                linear-gradient(transparent, transparent) padding-box,
                linear-gradient(135deg, #fab617, #d4a017, #fab617, #ffcc00) border-box;
            box-shadow: 
                inset 0 0 30px rgba(250, 182, 23, 0.3),
                0 0 40px rgba(250, 182, 23, 0.4);
        }
        
        /* Frame 2: Hazard Stripes */
        .frame2 {
            border: 25px solid transparent;
            background: 
                linear-gradient(transparent, transparent) padding-box,
                repeating-linear-gradient(
                    45deg,
                    #000,
                    #000 10px,
                    #fab617 10px,
                    #fab617 20px
                ) border-box;
            box-shadow: 0 0 30px rgba(250, 182, 23, 0.5);
        }
        
        /* Frame 3: Hex Tech */
        .frame3 {
            border: 18px solid #1a1a1a;
            outline: 3px solid #fab617;
            outline-offset: -10px;
            clip-path: polygon(
                30px 0%, 100% 0%, 100% calc(100% - 30px),
                calc(100% - 30px) 100%, 0% 100%, 0% 30px
            );
        }
        
        /* Frame 4: Circuit Board */
        .frame4 {
            border: 22px solid transparent;
            background: 
                linear-gradient(transparent, transparent) padding-box,
                repeating-linear-gradient(
                    0deg,
                    #0a0a0a,
                    #0a0a0a 2px,
                    #00ff88 2px,
                    #00ff88 3px,
                    #0a0a0a 3px,
                    #0a0a0a 8px
                ) border-box;
            box-shadow: 
                inset 0 0 20px rgba(0, 255, 136, 0.3),
                0 0 30px rgba(0, 255, 136, 0.2);
        }
        
        /* Frame 5: Riveted Steel */
        .frame5 {
            border: 28px solid transparent;
            background: 
                linear-gradient(transparent, transparent) padding-box,
                linear-gradient(180deg, #4a4a4a, #6a6a6a, #3a3a3a) border-box;
            box-shadow: 
                inset 2px 2px 5px rgba(0,0,0,0.8),
                inset -2px -2px 5px rgba(255,255,255,0.1);
            position: relative;
        }
        .frame5::after {
            content: '';
            position: absolute;
            top: -28px;
            left: -28px;
            right: -28px;
            bottom: -28px;
            background: repeating-radial-gradient(
                circle at 10px 10px,
                #888 0,
                #888 3px,
                transparent 3px,
                transparent 40px
            );
            pointer-events: none;
        }
        
        /* Frame 6: Energy Shield */
        .frame6 {
            border: 20px solid transparent;
            background: 
                linear-gradient(transparent, transparent) padding-box,
                conic-gradient(from 180deg at 50% 50%, 
                    #00ffff 0deg, 
                    #0088ff 90deg, 
                    #00ffff 180deg, 
                    #0088ff 270deg, 
                    #00ffff 360deg
                ) border-box;
            box-shadow: 
                0 0 40px rgba(0, 200, 255, 0.6),
                inset 0 0 30px rgba(0, 200, 255, 0.3);
        }
        
        /* Frame 7: Corrupted Data */
        .frame7 {
            border: 24px solid #ff0040;
            box-shadow: 
                0 0 30px rgba(255, 0, 64, 0.5),
                inset 0 0 20px rgba(255, 0, 64, 0.3);
        }
        
        /* Frame 8: Diamond Plate */
        .frame8 {
            border: 26px solid transparent;
            background: 
                linear-gradient(transparent, transparent) padding-box,
                repeating-linear-gradient(
                    45deg,
                    #3a3a3a 0,
                    #3a3a3a 10px,
                    #5a5a5a 10px,
                    #5a5a5a 11px,
                    #3a3a3a 11px,
                    #3a3a3a 21px,
                    #5a5a5a 21px,
                    #5a5a5a 22px
                ) border-box;
            box-shadow: 
                inset 2px 2px 10px rgba(0,0,0,0.5),
                inset -2px -2px 10px rgba(255,255,255,0.1);
        }
        
        /* Frame 9: Plasma Core */
        .frame9 {
            border: 22px solid transparent;
            background: 
                linear-gradient(transparent, transparent) padding-box,
                radial-gradient(
                    circle at center,
                    #ff00ff,
                    #8800ff,
                    #ff00ff,
                    #ff00aa
                ) border-box;
            box-shadow: 
                0 0 50px rgba(255, 0, 255, 0.5),
                inset 0 0 30px rgba(255, 0, 255, 0.3);
        }
        
        /* Frame 10: Legendary Prism */
        .frame10 {
            border: 25px solid transparent;
            background: 
                linear-gradient(transparent, transparent) padding-box,
                linear-gradient(
                    45deg,
                    #ff0000,
                    #ff7f00,
                    #ffff00,
                    #00ff00,
                    #0000ff,
                    #4b0082,
                    #9400d3,
                    #ff0000
                ) border-box;
            box-shadow: 
                0 0 60px rgba(255, 255, 255, 0.5),
                inset 0 0 40px rgba(255, 255, 255, 0.3);
        }
    </style>
</head>
<body>
    <div class="frame frame1" id="frame1"></div>
    <div class="frame frame2" id="frame2"></div>
    <div class="frame frame3" id="frame3"></div>
    <div class="frame frame4" id="frame4"></div>
    <div class="frame frame5" id="frame5"></div>
    <div class="frame frame6" id="frame6"></div>
    <div class="frame frame7" id="frame7"></div>
    <div class="frame frame8" id="frame8"></div>
    <div class="frame frame9" id="frame9"></div>
    <div class="frame frame10" id="frame10"></div>
</body>
</html>`;

    await page.setContent(htmlContent);
    
    const frames = [
        { selector: '.frame1', name: 'frame-gold-industrial.png' },
        { selector: '.frame2', name: 'frame-hazard-stripes.png' },
        { selector: '.frame3', name: 'frame-hex-tech.png' },
        { selector: '.frame4', name: 'frame-circuit-board.png' },
        { selector: '.frame5', name: 'frame-riveted-steel.png' },
        { selector: '.frame6', name: 'frame-energy-shield.png' },
        { selector: '.frame7', name: 'frame-corrupted-data.png' },
        { selector: '.frame8', name: 'frame-diamond-plate.png' },
        { selector: '.frame9', name: 'frame-plasma-core.png' },
        { selector: '.frame10', name: 'frame-legendary-prism.png' }
    ];
    
    for (const frame of frames) {
        const element = await page.$(frame.selector);
        if (element) {
            await element.screenshot({
                path: path.join(__dirname, frame.name),
                omitBackground: true
            });
            console.log(`Generated: ${frame.name}`);
        }
    }
    
    await browser.close();
    console.log('All frames generated successfully!');
}

// Check if puppeteer is installed
try {
    require.resolve('puppeteer');
    generateFrames().catch(console.error);
} catch(e) {
    console.log('Puppeteer not installed. Installing...');
    const { exec } = require('child_process');
    exec('npm install puppeteer', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error installing puppeteer: ${error}`);
            return;
        }
        console.log('Puppeteer installed successfully. Generating frames...');
        generateFrames().catch(console.error);
    });
}