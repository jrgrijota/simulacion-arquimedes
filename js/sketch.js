// Variables del sistema macroscópico
let blockMass = 50;
let blockVol = 100;
let liqDensity = 1.0;

// Variables de estado físico (Cinemática)
let blockY = 50;
let velocityY = 0;
let gravity = 0.3;
let drag = 0.92; // Resistencia del fluido

// Dimensiones de la escena
const tankX = 100, tankY = 150, tankW = 250, tankH = 300;
const liquidLevelY = 200;

// Elementos del DOM
let sliderMasa, sliderVol, sliderLiq;

function setup() {
    let canvas = createCanvas(900, 550);
    canvas.parent('canvas-container');

    // Vincular DOM
    sliderMasa = select('#slider-masa');
    sliderVol = select('#slider-volumen');
    sliderLiq = select('#slider-liq');

    // Event Listeners para actualizar badges UI
    sliderMasa.input(() => select('#val-masa').html(`${sliderMasa.value()} kg`));
    sliderVol.input(() => select('#val-volumen').html(`${sliderVol.value()} L`));
    sliderLiq.input(() => select('#val-liq').html(`${sliderLiq.value()} kg/L`));
}

function draw() {
    background('#141414'); // Fondo oscuro (estilo de tus CSS)
    
    // 1. ACTUALIZAR VARIABLES
    blockMass = parseFloat(sliderMasa.value());
    blockVol = parseFloat(sliderVol.value());
    liqDensity = parseFloat(sliderLiq.value());
    
    let blockDensity = blockMass / blockVol;
    let blockSide = map(blockVol, 50, 150, 60, 120); // Mapeo visual del volumen
    let blockX = tankX + tankW / 2 - blockSide / 2;

    // 2. FÍSICA: PRINCIPIO DE ARQUÍMEDES
    let blockBottom = blockY + blockSide;
    let submergedHeight = constrain(blockBottom - liquidLevelY, 0, blockSide);
    
    // Proporción sumergida para calcular volumen real bajo el agua
    let submergedRatio = submergedHeight / blockSide; 
    let submergedVolume = blockVol * submergedRatio;
    
    let weight = blockMass * gravity;
    let buoyancy = submergedVolume * liqDensity * gravity;
    
    let netForce = weight - buoyancy;
    
    velocityY += netForce * 0.1; // dt
    // Aplicar resistencia solo si está tocando el agua
    if (submergedHeight > 0) velocityY *= drag; 
    
    blockY += velocityY;

    // Colisión con el fondo del tanque
    if (blockY + blockSide > tankY + tankH) {
        blockY = tankY + tankH - blockSide;
        velocityY = 0;
    }

    // 3. ACTUALIZAR PANEL DE DATOS UI
    select('#metric-densidad').html(blockDensity.toFixed(2));
    select('#metric-empuje').html(buoyancy.toFixed(1));
    
    let estadoUI = select('#metric-estado');
    if (blockDensity > liqDensity) {
        estadoUI.html('Hundiéndose');
        estadoUI.style('color', '#ff4646');
    } else if (submergedRatio > 0 && submergedRatio < 1 && abs(velocityY) < 0.1) {
        estadoUI.html('Equilibrio Flotante');
        estadoUI.style('color', '#00ffaa');
    } else {
        estadoUI.html('Movimiento...');
        estadoUI.style('color', '#00c8ff');
    }

    // 4. RENDERIZADO MACRO (IZQUIERDA)
    drawMacro(blockX, blockSide, submergedHeight);

    // 5. RENDERIZADO MICRO Y BÁSCULA (DERECHA)
    drawMicro(blockSide);
}

function drawMacro(bx, bSide, subHeight) {
    push();
    // Dibujar Tanque
    stroke('#444');
    strokeWeight(4);
    noFill();
    rect(tankX, tankY, tankW, tankH, 0, 0, 10, 10);
    
    // Dibujar Líquido
    noStroke();
    // Cambiar color del líquido según su densidad (Mapeo de tonos azules a ámbar)
    let liqColor = lerpColor(color(0, 150, 255, 150), color(255, 180, 0, 150), map(liqDensity, 0.5, 2.0, 0, 1));
    fill(liqColor);
    rect(tankX + 2, liquidLevelY, tankW - 4, tankY + tankH - liquidLevelY, 0, 0, 8, 8);

    // Dibujar Bloque Macro
    stroke('#00c8ff');
    strokeWeight(2);
    fill(30, 30, 30, 200);
    rect(bx, blockY, bSide, bSide, 4);
    
    // Marcar la parte sumergida visualmente
    if (subHeight > 0) {
        fill(0, 200, 255, 80);
        noStroke();
        rect(bx, blockY + (bSide - subHeight), bSide, subHeight, 0, 0, 4, 4);
    }
    pop();
}

function drawMicro(bSide) {
    push();
    let microCenterX = 650;
    let microBaseY = 400;

    // Dibujar Báscula de Laboratorio
    fill('#222');
    stroke('#333');
    strokeWeight(2);
    rect(microCenterX - 120, microBaseY, 240, 40, 10); // Base principal
    fill('#111');
    rect(microCenterX - 90, microBaseY - 10, 180, 10, 2); // Plato
    
    // Display Digital de la báscula
    fill('#0a0a0a');
    rect(microCenterX - 40, microBaseY + 8, 80, 24, 4);
    fill('#00ffaa');
    noStroke();
    textAlign(CENTER, CENTER);
    textFont('monospace');
    textSize(16);
    text(`${blockMass.toFixed(1)} kg`, microCenterX, microBaseY + 21);

    // Dibujar Bloque Micro sobre el plato
    // Se escala visualmente para enfatizar el volumen seleccionado
    let microScale = map(blockVol, 50, 150, 100, 200); 
    let microX = microCenterX - microScale / 2;
    let microY = microBaseY - 10 - microScale;
    
    stroke('#00c8ff');
    strokeWeight(2);
    fill('#1a1a1a');
    rect(microX, microY, microScale, microScale, 8);

    // ALGORITMO DE EMPAQUETAMIENTO (LOS ÁTOMOS)
    // El número de átomos es directamente proporcional a la masa
    let numAtoms = floor(blockMass * 1.5); 
    
    // Calcular filas y columnas óptimas para un cuadrado
    let cols = ceil(sqrt(numAtoms));
    let rows = ceil(numAtoms / cols);
    
    let atomRadius = 6;
    let spacingX = microScale / (cols + 1);
    let spacingY = microScale / (rows + 1);

    fill('#ff4646');
    noStroke();
    let count = 0;
    
    for (let j = 1; j <= rows; j++) {
        for (let i = 1; i <= cols; i++) {
            if (count >= numAtoms) break;
            
            let x = microX + i * spacingX;
            let y = microY + j * spacingY;
            
            // Ligera vibración para dar vida (estado sólido)
            x += random(-0.5, 0.5);
            y += random(-0.5, 0.5);
            
            circle(x, y, atomRadius * 2);
            count++;
        }
    }
    pop();
}