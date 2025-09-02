// Matter.js modules
const Engine = Matter.Engine,
      Render = Matter.Render,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Events = Matter.Events;

// Game configuration
const config = {
    width: 360,
    height: 640,
    pegRows: 28, // 20% more rows
    pegRadius: 2.4, // 20% smaller
    ballRadius: 4,
    zoneCount: 10,
    gravity: 0.8
};

// Game state
let engine, render, isDropping = false;
const pegs = [];
const litPegs = new Map(); // Changed to Map to store opacity values
const balls = [];

// Initialize the game
function init() {
    const canvas = document.getElementById('canvas');
    canvas.width = config.width;
    canvas.height = config.height;
    
    // Create Matter.js engine
    engine = Engine.create();
    engine.world.gravity.y = config.gravity;
    
    // Create renderer
    render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: config.width,
            height: config.height,
            wireframes: false,
            background: 'transparent'
        }
    });
    
    // Create game elements
    createWalls();
    createPegs();
    createZones();
    createBucketImages();
    
    // Set up collision events
    Events.on(engine, 'collisionStart', handleCollision);
    
    // Custom render to show lit pegs
    Events.on(render, 'afterRender', customRender);
    
    // Run the engine
    Engine.run(engine);
    Render.run(render);
    
    // Set up buttons
    document.getElementById('dropButton').addEventListener('click', () => dropBall(1));
    document.getElementById('drop50Button').addEventListener('click', () => dropBall(10)); // Changed to 10 for testing
    
    // Start fade animation loop
    setInterval(updateLitPegs, 50);
}

// Create boundary walls and guardrails
function createWalls() {
    const wallThickness = 20;
    
    // Position guardrails right at pyramid edges
    const topWidth = 50; // Width at top of pyramid
    const bottomWidth = config.width - 40; // Width at bottom
    const pyramidHeight = config.height - 180;
    const pyramidAngle = Math.atan((bottomWidth - topWidth) / 2 / pyramidHeight);
    
    // Left guardrail positioned at pyramid edge
    const leftGuardrail = Bodies.rectangle(
        config.width/2 - bottomWidth/2 + 10, // Position at left edge of pyramid
        config.height/2 - 40, 
        4, 
        pyramidHeight + 20, 
        { 
            isStatic: true, 
            angle: pyramidAngle,
            render: { fillStyle: '#ffc107' } 
        }
    );
    
    // Right guardrail positioned at pyramid edge
    const rightGuardrail = Bodies.rectangle(
        config.width/2 + bottomWidth/2 - 10, // Position at right edge of pyramid
        config.height/2 - 40, 
        4, 
        pyramidHeight + 20, 
        { 
            isStatic: true, 
            angle: -pyramidAngle,
            render: { fillStyle: '#ffc107' } 
        }
    );
    
    // Outer walls (invisible)
    const leftWall = Bodies.rectangle(
        -wallThickness/2, 
        config.height/2, 
        wallThickness, 
        config.height, 
        { isStatic: true, render: { fillStyle: 'transparent' } }
    );
    
    const rightWall = Bodies.rectangle(
        config.width + wallThickness/2, 
        config.height/2, 
        wallThickness, 
        config.height, 
        { isStatic: true, render: { fillStyle: 'transparent' } }
    );
    
    World.add(engine.world, [leftWall, rightWall, leftGuardrail, rightGuardrail]);
}

// Create the peg board with proper Plinko offset pattern
function createPegs() {
    const startY = 60;
    const endY = config.height - 120;
    const rowSpacing = (endY - startY) / config.pegRows;
    const horizontalSpacing = 25; // Consistent spacing for proper pattern
    
    for (let row = 0; row < config.pegRows; row++) {
        const y = startY + row * rowSpacing;
        
        // Calculate pegs to fill width, adding one per row for pyramid
        const maxPegsInRow = Math.floor(config.width / horizontalSpacing);
        const pegsInThisRow = Math.min(row + 2, maxPegsInRow - 2);
        
        // CRITICAL: Alternating offset pattern like real Plinko
        // Even rows: normal position
        // Odd rows: offset by half spacing
        const isOffsetRow = row % 2 === 1;
        const offset = isOffsetRow ? horizontalSpacing / 2 : 0;
        
        // Center the row
        const totalWidth = (pegsInThisRow - 1) * horizontalSpacing;
        const startX = (config.width - totalWidth) / 2 + offset;
        
        for (let col = 0; col < pegsInThisRow; col++) {
            const x = startX + col * horizontalSpacing;
            
            // Only skip if truly outside canvas
            if (x < 5 || x > config.width - 5) continue;
            
            const peg = Bodies.circle(x, y, config.pegRadius, {
                isStatic: true,
                restitution: 0.5,
                render: {
                    fillStyle: '#333333',
                    strokeStyle: '#ffc107',
                    lineWidth: 1
                },
                label: `peg_${row}_${col}`
            });
            
            pegs.push(peg);
            World.add(engine.world, peg);
        }
    }
}

// Create landing zones with buckets
function createZones() {
    const zoneWidth = config.width / config.zoneCount;
    const bucketHeight = 50;
    const y = config.height - 50;
    
    // Create bucket dividers with better collision
    for (let i = 0; i <= config.zoneCount; i++) {
        const x = zoneWidth * i;
        
        // Vertical divider - thicker for better collision
        const divider = Bodies.rectangle(x, y, 5, bucketHeight, {
            isStatic: true,
            restitution: 0.1,
            friction: 0.5,
            render: {
                fillStyle: '#ffc107'
            }
        });
        
        World.add(engine.world, divider);
    }
    
    // Create bucket floors with better collision detection
    for (let i = 0; i < config.zoneCount; i++) {
        const x = zoneWidth * i + zoneWidth / 2;
        
        // Thicker floor to prevent glitching
        const floor = Bodies.rectangle(x, y + bucketHeight/2 - 3, zoneWidth - 6, 6, {
            isStatic: true,
            restitution: 0.1,
            friction: 0.8,
            render: {
                fillStyle: '#ffc107'
            }
        });
        
        World.add(engine.world, floor);
    }
    
    // Add bottom barrier to catch any balls that might glitch through
    const bottomBarrier = Bodies.rectangle(
        config.width/2, 
        config.height - 5, 
        config.width, 
        10, 
        { 
            isStatic: true, 
            render: { fillStyle: '#ffc107' } 
        }
    );
    
    World.add(engine.world, bottomBarrier);
}

// Create bucket images positioned inside the buckets
function createBucketImages() {
    const container = document.getElementById('bucketImages');
    const multipliers = [100, 50, 10, 5, 2, 2, 5, 10, 50, 100]; // Prize multipliers
    const colors = ['#ff0000', '#ff4500', '#ffa500', '#ffff00', '#90ee90', '#90ee90', '#ffff00', '#ffa500', '#ff4500', '#ff0000'];
    
    container.innerHTML = ''; // Clear any existing content
    
    for (let i = 0; i < config.zoneCount; i++) {
        const div = document.createElement('div');
        div.className = 'bucket-image';
        div.style.background = `radial-gradient(circle, ${colors[i]}, #1a1a1a)`;
        div.textContent = multipliers[i] + 'x';
        container.appendChild(div);
    }
}

// Drop ball(s) from the center
function dropBall(count = 1) {
    if (isDropping) return;
    
    isDropping = true;
    document.getElementById('dropButton').disabled = true;
    document.getElementById('drop50Button').disabled = true;
    
    let ballsDropped = 0;
    const dropInterval = count > 1 ? 50 : 0; // 50ms between balls for rapid fire
    
    const dropNextBall = () => {
        if (ballsDropped >= count) {
            // Re-enable buttons after last ball drops
            setTimeout(() => {
                isDropping = false;
                document.getElementById('dropButton').disabled = false;
                document.getElementById('drop50Button').disabled = false;
            }, 1000);
            return;
        }
        
        // No randomness for multi-drop - all balls drop from exact center
        const randomOffset = count > 1 ? 0 : (Math.random() - 0.5) * 0.5;
        
        const ball = Bodies.circle(config.width / 2 + randomOffset, 30, config.ballRadius, {
            restitution: 0.4,
            friction: 0.3,
            density: 0.0015, // Slightly heavier to prevent glitching
            render: {
                fillStyle: '#ffc107',
                strokeStyle: '#000000',
                lineWidth: 1
            },
            label: 'ball'
        });
        
        balls.push(ball);
        World.add(engine.world, ball);
        
        // Keep balls visible longer - remove after 15 seconds
        setTimeout(() => {
            if (balls.includes(ball)) {
                World.remove(engine.world, ball);
                balls.splice(balls.indexOf(ball), 1);
            }
        }, 15000);
        
        ballsDropped++;
        
        if (count > 1) {
            setTimeout(dropNextBall, dropInterval);
        }
    };
    
    dropNextBall();
}

// Update lit pegs fade animation
function updateLitPegs() {
    for (let [pegId, opacity] of litPegs.entries()) {
        const newOpacity = opacity - 0.08; // Fade out much faster
        if (newOpacity <= 0) {
            litPegs.delete(pegId);
        } else {
            litPegs.set(pegId, newOpacity);
        }
    }
}

// Handle collisions
function handleCollision(event) {
    const pairs = event.pairs;
    
    for (let pair of pairs) {
        const { bodyA, bodyB } = pair;
        
        // Check if ball hit a peg
        if ((bodyA.label === 'ball' && bodyB.label.startsWith('peg_')) ||
            (bodyB.label === 'ball' && bodyA.label.startsWith('peg_'))) {
            
            const peg = bodyA.label.startsWith('peg_') ? bodyA : bodyB;
            litPegs.set(peg.id, 1.0); // Set full opacity when hit
        }
    }
}

// Custom render for lit pegs with fade
function customRender() {
    const context = render.canvas.getContext('2d');
    
    // Draw glowing effect for lit pegs with fade (white, subtle)
    litPegs.forEach((opacity, pegId) => {
        const peg = pegs.find(p => p.id === pegId);
        if (peg) {
            const x = peg.position.x;
            const y = peg.position.y;
            
            // White glow effect with fading (subtle)
            context.save();
            context.globalAlpha = opacity * 0.6; // Make it less bright
            context.shadowBlur = 10 * opacity;
            context.shadowColor = '#ffffff';
            context.fillStyle = '#ffffff';
            context.beginPath();
            context.arc(x, y, config.pegRadius + 1, 0, Math.PI * 2);
            context.fill();
            
            // Inner circle (dimmer)
            context.shadowBlur = 0;
            context.fillStyle = '#e0e0e0';
            context.beginPath();
            context.arc(x, y, config.pegRadius, 0, Math.PI * 2);
            context.fill();
            context.restore();
        }
    });
}

// Start the game when page loads
window.addEventListener('load', init);