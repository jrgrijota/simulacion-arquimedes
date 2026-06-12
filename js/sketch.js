// Variables del sistema macroscópico
let blockMass = 50;
let blockVol = 100;
let liqDensity = 1.0;

// Variables de estado físico (Cinemática)
let blockY = 50;
let velocityY = 0;
const gravity = 9.8;
const motionScale = 0.45;
const drag = 0.92; // Resistencia del fluido

// Dimensiones de la escena
const tankX = 100, tankY = 150, tankW = 250, tankH = 300;
const liquidLevelY = 200;

// Elementos del DOM
let sliderMasa, sliderVol, sliderLiq, materialPresets, liquidPresets, playPauseBtn, resetBtn;
let simulationActive = true;

const defaultState = {
    mass: 50,
    vol: 100,
    liqDensity: 1.0,
    blockY: 50,
    velocityY: 0
};

function setup() {
    let canvas = createCanvas(900, 550);
    canvas.parent('canvas-container');

    // Vincular DOM
    sliderMasa = select('#slider-masa');
    sliderVol = select('#slider-volumen');
    sliderLiq = select('#slider-liq');
    materialPresets = select('#material-presets');
    liquidPresets = select('#liquid-presets');
    playPauseBtn = select('#play-pause-btn');
    resetBtn = select('#reset-btn');

    // Event Listeners para actualizar badges UI
    sliderMasa.input(() => {
        if (materialPresets.value() === 'manual') {
            select('#val-masa').html(`${sliderMasa.value()} kg`);
        }
    });

    sliderVol.input(() => {
        select('#val-volumen').html(`${sliderVol.value()} L`);
        if (materialPresets.value() !== 'manual') {
            actualizarMaterialPreset();
        }
    });

    sliderLiq.input(() => {
        select('#val-liq').html(`${sliderLiq.value()} kg/L`);
        if (liquidPresets.value() !== 'manual') {
            liquidPresets.value('manual');
        }
    });

    materialPresets.changed(() => {
        refreshMassSliderState();
        actualizarMaterialPreset();
    });

    liquidPresets.changed(() => {
        actualizarLiquidPreset();
    });

    refreshMassSliderState();
    actualizarMaterialPreset();
}

function draw() {
    background('#141414'); // Fondo oscuro (estilo de tus CSS)
    
    // 1. ACTUALIZAR VARIABLES
    blockMass = parseFloat(sliderMasa.value());
    blockVol = parseFloat(sliderVol.value());
    liqDensity = parseFloat(sliderLiq.value());
    
    let blockDensity = blockMass / blockVol;
    let blockSide = map(blockVol, 50, 150, 62, 120); // Mapeo visual del volumen
    let blockX = tankX + tankW / 2 - blockSide / 2;

    // 2. FÍSICA: PRINCIPIO DE ARQUÍMEDES
    let blockBottom = blockY + blockSide;
    let submergedHeight = constrain(blockBottom - liquidLevelY, 0, blockSide);
    let submergedRatio = blockSide > 0 ? submergedHeight / blockSide : 0;
    let submergedVolume = blockVol * submergedRatio;

    let weight = blockMass * gravity;
    let buoyancy = submergedVolume * liqDensity * gravity;
    let netForce = weight - buoyancy;
    let acceleration = netForce / max(blockMass, 0.1);

    velocityY += acceleration * motionScale;
    if (submergedHeight > 0) velocityY *= drag;
    blockY += velocityY;

    // Colisión con el fondo del tanque
    if (blockY + blockSide > tankY + tankH) {
        blockY = tankY + tankH - blockSide;
        velocityY = 0;
    }

    // Evitar que el bloque suba demasiado fuera del tanque
    if (blockY < tankY - blockSide * 0.2) {
        blockY = tankY - blockSide * 0.2;
        velocityY = 0;
    }

    // 3. ACTUALIZAR PANEL DE DATOS UI
    select('#metric-densidad').html(blockDensity.toFixed(2));
    select('#metric-empuje').html(buoyancy.toFixed(1));
    select('#metric-porcentaje').html((submergedRatio * 100).toFixed(0));
    select('#metric-vol-sumergido').html(submergedVolume.toFixed(1));

    let estadoUI = select('#metric-estado');
    const densityRatio = blockDensity / liqDensity;
    select('#metric-razon').html(densityRatio.toFixed(2));

    if (blockDensity > liqDensity) {
        estadoUI.html('Hundiéndose');
        estadoUI.style('color', '#ff4646');
        select('#metric-condicion').html('Densidad mayor');
    } else if (abs(blockDensity - liqDensity) < 0.05) {
        estadoUI.html('Equilibrio Neutro');
        estadoUI.style('color', '#ffd166');
        select('#metric-condicion').html('Densidades similares');
    } else if (submergedRatio > 0 && submergedRatio < 1 && abs(velocityY) < 0.12) {
        estadoUI.html('Equilibrio Flotante');
        estadoUI.style('color', '#00ffaa');
        select('#metric-condicion').html('Densidad menor');
    } else {
        estadoUI.html('Movimiento...');
        estadoUI.style('color', '#00c8ff');
        select('#metric-condicion').html('A determinar');
    }

    // 4. RENDERIZADO MACRO (IZQUIERDA)
    drawMacro(blockX, blockSide, submergedHeight);

    // 5. RENDERIZADO MICRO Y BÁSCULA (DERECHA)
    drawMicro(blockSide);
}

function actualizarMaterialPreset() {
    if (!materialPresets || materialPresets.value() === 'manual') return;
    const densities = {
        madera: 0.60,
        plastico: 0.90,
        aluminio: 2.70,
        hierro: 7.80
    };
    const materialDensity = densities[materialPresets.value()] || 1.0;
    const currentVolume = parseFloat(sliderVol.value());
    blockMass = round(materialDensity * currentVolume * 10) / 10;

    sliderMasa.value(blockMass);
    select('#val-masa').html(`${blockMass.toFixed(1)} kg`);
}

function actualizarLiquidPreset() {
    if (!liquidPresets || liquidPresets.value() === 'manual') return;
    const liquidDensities = {
        agua: 1.00,
        aceite: 0.92,
        alcohol: 0.79,
        mercurio: 13.56
    };
    const selectedDensity = liquidDensities[liquidPresets.value()] || 1.0;
    liqDensity = selectedDensity;
    sliderLiq.value(selectedDensity);
    select('#val-liq').html(`${selectedDensity.toFixed(2)} kg/L`);
}

function refreshMassSliderState() {
    if (!sliderMasa || !materialPresets) return;
    if (materialPresets.value() === 'manual') {
        sliderMasa.removeAttribute('disabled');
        sliderMasa.elt.style.opacity = '1';
    } else {
        sliderMasa.attribute('disabled', '');
        sliderMasa.elt.style.opacity = '0.5';
    }
}

function toggleSimulation() {
    if (!playPauseBtn) return;
    if (simulationActive) {
        noLoop();
        simulationActive = false;
        playPauseBtn.html('▶ Reanudar');
        playPauseBtn.addClass('estado-pausado');
    } else {
        loop();
        simulationActive = true;
        playPauseBtn.html('⏸ Pausar');
        playPauseBtn.removeClass('estado-pausado');
    }
}

function resetSimulation() {
    blockMass = defaultState.mass;
    blockVol = defaultState.vol;
    liqDensity = defaultState.liqDensity;
    blockY = defaultState.blockY;
    velocityY = defaultState.velocityY;

    sliderMasa.value(blockMass);
    sliderVol.value(blockVol);
    sliderLiq.value(liqDensity);

    select('#val-masa').html(`${blockMass} kg`);
    select('#val-volumen').html(`${blockVol} L`);
    select('#val-liq').html(`${liqDensity.toFixed(2)} kg/L`);

    materialPresets.value('manual');
    liquidPresets.value('manual');
    refreshMassSliderState();

    if (!simulationActive) {
        loop();
        simulationActive = true;
        if (playPauseBtn) {
            playPauseBtn.html('⏸ Pausar');
            playPauseBtn.removeClass('estado-pausado');
        }
    }
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