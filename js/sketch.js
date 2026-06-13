// ═══════════════════════════════════════════════════════════════════
//  SIMULACIÓN: PRINCIPIO DE ARQUÍMEDES
//  Física para Secundaria y Bachillerato
// ═══════════════════════════════════════════════════════════════════

// --- PARÁMETROS FÍSICOS ---
let blockMass  = 50;   // kg
let blockVol   = 100;  // litros
let liqDensity = 1.0;  // kg/L

// --- CINEMÁTICA ---
let blockY    = 80;
let velocityY = 0;
const G            = 9.8;   // m/s²
const MOTION_SCALE = 0.30;
const FLUID_DRAG   = 0.90;  // amortiguación del fluido

// --- LAYOUT DEL CANVAS ---
const CV_W = 900, CV_H = 560;

// Tanque (vista macro, panel izquierdo)
const TK = { x: 66, y: 90, w: 266, h: 370 };
const LIQ_Y = 182;  // nivel de la superficie del líquido (px)

// Escala de densidades (franja izquierda del tanque)
const SC = { x: 12, y: 90, w: 14, h: 370 };

// Diagrama de cuerpo libre (panel superior derecho)
const FBD = { x: 400, y: 10, w: 488, h: 258 };

// Gráfica histórica (panel inferior derecho)
const GRP = { x: 400, y: 280, w: 488, h: 268 };

// --- HISTORIAL PARA GRÁFICA ---
const MAX_HIST = 220;
let histW = [];  // Peso en N
let histE = [];  // Empuje en N

// --- ESTADO GLOBAL ---
let bubbles = [];
let simulationActive = true;

// --- DOM ---
let sliderMasa, sliderVol, sliderLiq;
let materialPresets, liquidPresets, playPauseBtn;

const defaultState = { mass: 50, vol: 100, liqDensity: 1.0, blockY: 80, velocityY: 0 };

// ─────────────────────────────────────────────────────────────────
function setup() {
    let canvas = createCanvas(CV_W, CV_H);
    canvas.parent('canvas-container');
    frameRate(60);
    textFont('monospace');

    sliderMasa      = select('#slider-masa');
    sliderVol       = select('#slider-volumen');
    sliderLiq       = select('#slider-liq');
    materialPresets = select('#material-presets');
    liquidPresets   = select('#liquid-presets');
    playPauseBtn    = select('#play-pause-btn');

    sliderMasa.input(() => {
        if (materialPresets.value() === 'manual')
            select('#val-masa').html(`${sliderMasa.value()} kg`);
    });
    sliderVol.input(() => {
        select('#val-volumen').html(`${sliderVol.value()} L`);
        if (materialPresets.value() !== 'manual') actualizarMaterialPreset();
    });
    sliderLiq.input(() => {
        select('#val-liq').html(`${parseFloat(sliderLiq.value()).toFixed(3)} kg/L`);
        liquidPresets.value('manual');
    });

    materialPresets.changed(() => { refreshMassSliderState(); actualizarMaterialPreset(); });
    liquidPresets.changed(() => { actualizarLiquidPreset(); });

    refreshMassSliderState();
}

// ─────────────────────────────────────────────────────────────────
function draw() {
    background('#141414');

    // 1. LEER CONTROLES
    blockMass  = parseFloat(sliderMasa.value());
    blockVol   = parseFloat(sliderVol.value());
    liqDensity = parseFloat(sliderLiq.value());

    // 2. GEOMETRÍA DEL BLOQUE
    let blockDens = blockMass / blockVol;
    let bSide     = map(blockVol, 50, 150, 58, 132);  // tamaño visual
    let bX        = TK.x + TK.w / 2 - bSide / 2;

    // 3. FÍSICA — PRINCIPIO DE ARQUÍMEDES
    let bBottom  = blockY + bSide;
    let subH     = constrain(bBottom - LIQ_Y, 0, bSide);   // px sumergidos
    let subRatio = bSide > 0 ? subH / bSide : 0;            // fracción 0–1
    let subVol   = blockVol * subRatio;                     // litros sumergidos

    let weight   = blockMass * G;               // N  (kg × m/s²)
    let buoyancy = subVol * liqDensity * G;     // N  (L × kg/L × m/s²)
    let netForce = weight - buoyancy;
    let accel    = netForce / max(blockMass, 0.1);

    velocityY += accel * MOTION_SCALE;
    velocityY = constrain(velocityY, -9, 9);
    if (subH > 0) velocityY *= FLUID_DRAG;
    blockY += velocityY;

    // Colisiones con las paredes del tanque
    if (blockY + bSide > TK.y + TK.h) {
        blockY = TK.y + TK.h - bSide;
        velocityY *= -0.10;
    }
    if (blockY < TK.y - bSide * 0.30) {
        blockY = TK.y - bSide * 0.30;
        velocityY = 0;
    }

    // 4. HISTORIAL
    histW.push(weight);
    histE.push(buoyancy);
    if (histW.length > MAX_HIST) { histW.shift(); histE.shift(); }

    // 5. ACTUALIZAR MÉTRICAS HTML
    updateUI(blockDens, buoyancy, weight, netForce, subRatio, subVol);

    // 6. RENDER DE PANELES
    drawMacroView(bX, bSide, subH, subVol, subRatio, buoyancy, weight, blockDens);
    drawFBDPanel(weight, buoyancy, netForce);
    drawGraphPanel();

    // Línea divisora vertical
    stroke('#252525');
    strokeWeight(1);
    line(FBD.x - 9, 8, FBD.x - 9, CV_H - 8);
}

// ═══════════════════════════════════════════════════════════════════
//  PANEL IZQUIERDO: VISTA MACRO
// ═══════════════════════════════════════════════════════════════════
function drawMacroView(bX, bSide, subH, subVol, subRatio, buoyancy, weight, blockDens) {
    // Etiqueta de panel
    push();
    noStroke(); fill('#666'); textSize(9); textAlign(LEFT, TOP);
    text('VISTA MACROSCÓPICA', TK.x, 12);
    pop();

    drawLiquid();
    drawBubbles(blockDens);
    drawTank();
    drawLiquidSurface();
    drawBlock(bX, bSide, subH, blockDens);
    drawDensityBar(blockDens);
    drawMacroAnnotations(bX, bSide, subH, subVol, subRatio, buoyancy, weight, blockDens);
}

function drawLiquid() {
    push();
    let lc = liquidColor(liqDensity);
    for (let i = 0; i < 42; i++) {
        let t  = i / 42;
        let y0 = lerp(LIQ_Y, TK.y + TK.h, t);
        let y1 = lerp(LIQ_Y, TK.y + TK.h, (i + 1) / 42);
        let r  = lerp(red(lc),   red(lc)   * 0.38, t);
        let g  = lerp(green(lc), green(lc) * 0.38, t);
        let b  = lerp(blue(lc),  blue(lc)  * 0.38, t);
        let a  = min(lerp(alpha(lc), alpha(lc) * 1.35, t), 255);
        fill(r, g, b, a);
        noStroke();
        rect(TK.x + 3, y0, TK.w - 6, y1 - y0 + 1);
    }
    pop();
}

function drawTank() {
    push();
    // Sombra interior
    stroke('#1a1a1a'); strokeWeight(7); noFill();
    rect(TK.x + 1, TK.y + 1, TK.w - 2, TK.h - 2, 0, 0, 8, 8);
    // Pared
    stroke('#585858'); strokeWeight(3); noFill();
    rect(TK.x, TK.y, TK.w, TK.h, 0, 0, 8, 8);
    // Reflejo superior
    stroke('#888'); strokeWeight(1.5);
    line(TK.x + 9, TK.y + 5, TK.x + TK.w - 9, TK.y + 5);
    // Marcas de profundidad (lado derecho del tanque)
    stroke('#333'); strokeWeight(1);
    let nMarks = 5;
    for (let i = 1; i <= nMarks; i++) {
        let my = LIQ_Y + (TK.y + TK.h - LIQ_Y) * (i / (nMarks + 1));
        line(TK.x + TK.w, my, TK.x + TK.w + 6, my);
        noStroke(); fill('#444'); textSize(7); textAlign(LEFT, CENTER);
        text((i * 100 / (nMarks + 1)).toFixed(0) + '%', TK.x + TK.w + 8, my);
        stroke('#333');
    }
    pop();
}

function drawLiquidSurface() {
    push();
    let t  = frameCount * 0.034;
    let lc = liquidColor(liqDensity);
    // Onda principal
    stroke(red(lc), green(lc), blue(lc), 220);
    strokeWeight(2.2); noFill();
    beginShape();
    for (let x = TK.x + 3; x <= TK.x + TK.w - 3; x += 3) {
        let y = LIQ_Y + sin(t + x * 0.042) * 2.8 + sin(t * 1.4 + x * 0.071) * 1.4;
        vertex(x, y);
    }
    endShape();
    // Reflejo
    stroke(red(lc), green(lc), blue(lc), 45);
    strokeWeight(3); noFill();
    beginShape();
    for (let x = TK.x + 3; x <= TK.x + TK.w - 3; x += 3) {
        let y = LIQ_Y + 7 + sin(t * 0.75 + x * 0.038) * 2.2;
        vertex(x, y);
    }
    endShape();
    pop();
}

function drawBubbles(blockDens) {
    if (blockDens > liqDensity && frameCount % 16 === 0 && random() > 0.30) {
        bubbles.push({
            x: TK.x + random(22, TK.w - 22),
            y: TK.y + TK.h - 12,
            r: random(1.8, 5),
            vy: random(-0.55, -1.5),
            phase: random(TWO_PI)
        });
    }
    if (bubbles.length > 45) bubbles.splice(0, 12);
    push();
    noStroke();
    for (let i = bubbles.length - 1; i >= 0; i--) {
        let b = bubbles[i];
        b.y += b.vy;
        b.x += sin(frameCount * 0.058 + b.phase) * 0.55;
        let a = map(b.y, LIQ_Y, TK.y + TK.h, 15, 170);
        fill(255, 255, 255, max(0, a));
        ellipse(b.x, b.y, b.r * 2, b.r * 2.7);
        if (b.y < LIQ_Y) bubbles.splice(i, 1);
    }
    pop();
}

function drawBlock(bX, bSide, subH, blockDens) {
    push();
    let emergedH = bSide - subH;

    // Sombra proyectada sobre el líquido
    if (subH > 2) {
        noStroke(); fill(0, 0, 0, 55);
        rect(bX + 7, blockY + emergedH + 5, bSide, subH, 0, 0, 3, 3);
    }

    // Parte emergida — material sólido
    if (emergedH > 1) {
        stroke('#00c8ff'); strokeWeight(2);
        fill(26, 38, 50);
        rect(bX, blockY, bSide, emergedH, 4, 4, 0, 0);
        // Textura de rayado diagonal
        stroke(0, 200, 255, 18); strokeWeight(1);
        let step = 12;
        for (let k = 0; k < bSide + emergedH; k += step) {
            let x1 = bX + max(0, k - emergedH),  y1 = blockY + min(k, emergedH);
            let x2 = bX + min(bSide, k),           y2 = blockY + max(0, k - bSide);
            line(x1, y1, x2, y2);
        }
    }

    // Parte sumergida — impregnada del líquido
    if (subH > 1) {
        stroke('#00c8ff'); strokeWeight(2);
        let lc = liquidColor(liqDensity);
        fill(red(lc) * 0.45, green(lc) * 0.45, blue(lc) * 0.45, 155);
        rect(bX, blockY + emergedH, bSide, subH, 0, 0, 4, 4);
    }

    // Línea de flotación (waterline)
    if (subH > 2 && emergedH > 2) {
        stroke('#00ffff'); strokeWeight(2);
        line(bX - 5, blockY + emergedH, bX + bSide + 5, blockY + emergedH);
    }

    // Masa dentro del bloque (si es suficientemente grande)
    if (bSide > 76) {
        noStroke(); fill(255, 255, 255, 50); textSize(9.5); textAlign(CENTER, CENTER);
        text(`${blockMass.toFixed(0)} kg`, bX + bSide / 2, blockY + bSide / 2);
    }

    // Etiqueta de densidad sobre el bloque
    noStroke();
    let dCol = blockDens > liqDensity * 1.03 ? color(255, 90, 90) :
               blockDens < liqDensity * 0.97 ? color(0, 215, 120) :
               color(255, 205, 50);
    fill(dCol);
    textSize(10); textAlign(CENTER, BOTTOM);
    text(`ρ = ${blockDens.toFixed(2)} kg/L`, bX + bSide / 2, blockY - 7);

    pop();
}

function drawDensityBar(blockDens) {
    push();
    let minD = 0.20, maxD = 14.0;

    // Gradiente de colores
    for (let i = 0; i < SC.h; i++) {
        let t = i / SC.h;
        let d = lerp(minD, maxD, t);
        stroke(liquidColor(d)); strokeWeight(1);
        line(SC.x, SC.y + i, SC.x + SC.w, SC.y + i);
    }
    noFill(); stroke('#555'); strokeWeight(1);
    rect(SC.x, SC.y, SC.w, SC.h);

    // Marcador del fluido (triángulo derecha, blanco)
    let liqMY = map(constrain(liqDensity, minD, maxD), minD, maxD, SC.y, SC.y + SC.h);
    stroke('#ffffff'); strokeWeight(1.5); fill('#ffffff');
    triangle(SC.x + SC.w + 2, liqMY,
             SC.x + SC.w + 9, liqMY - 5,
             SC.x + SC.w + 9, liqMY + 5);

    // Marcador del bloque (triángulo también derecha, debajo del de fluido)
    let blkMY = map(constrain(blockDens, minD, maxD), minD, maxD, SC.y, SC.y + SC.h);
    let mCol  = blockDens > liqDensity ? color(255, 100, 100) : color(80, 220, 140);
    stroke(mCol); strokeWeight(1.5); fill(mCol);
    triangle(SC.x + SC.w + 2, blkMY,
             SC.x + SC.w + 9, blkMY - 5,
             SC.x + SC.w + 9, blkMY + 5);

    // Etiquetas (evitamos solapamiento con offset dinámico)
    let nearEq = abs(liqMY - blkMY) < 13;
    let liqLY  = nearEq ? liqMY - 7 : liqMY;
    let blkLY  = nearEq ? blkMY + 7 : blkMY;

    noStroke(); fill('#ffffffcc'); textSize(7); textAlign(LEFT, CENTER);
    text(liqDensity.toFixed(2), SC.x + SC.w + 12, liqLY);
    fill(mCol);
    text(blockDens.toFixed(2), SC.x + SC.w + 12, blkLY);

    // Título de la escala
    push();
    noStroke(); fill('#555'); textSize(8);
    translate(SC.x + SC.w / 2, SC.y - 10);
    textAlign(CENTER, BOTTOM);
    text('ρ', 0, 0);
    pop();
    noStroke(); fill('#555'); textSize(7);
    textAlign(CENTER, TOP);
    text(maxD.toFixed(0), SC.x + SC.w / 2, SC.y + SC.h + 3);
    textAlign(CENTER, BOTTOM);
    text(minD.toFixed(1), SC.x + SC.w / 2, SC.y - 2);

    pop();
}

function drawMacroAnnotations(bX, bSide, subH, subVol, subRatio, buoyancy, weight, blockDens) {
    push();
    let emergedH = bSide - subH;

    // Indicador de % sumergido (lateral izquierdo del tanque)
    if (subRatio > 0.02 && subRatio < 0.99) {
        let midSub = blockY + emergedH + subH / 2;
        drawingContext.setLineDash([3, 4]);
        stroke('#00c8ff44'); strokeWeight(1);
        line(TK.x - 5, blockY + emergedH, TK.x - 5, blockY + bSide);
        drawingContext.setLineDash([]);
        noStroke(); fill('#00c8ff99'); textSize(9); textAlign(RIGHT, CENTER);
        text(`${(subRatio * 100).toFixed(0)}%`, TK.x - 8, midSub);
    }

    // Línea punteada de la superficie del líquido
    drawingContext.setLineDash([4, 5]);
    stroke('#ffffff28'); strokeWeight(0.9);
    line(SC.x + SC.w + 12, LIQ_Y, TK.x - 6, LIQ_Y);
    drawingContext.setLineDash([]);

    // Fórmulas dinámicas bajo el tanque (ASCII para máxima compatibilidad)
    noStroke(); fill('#777'); textSize(8.5); textAlign(LEFT, TOP);
    text(`P = m·g = ${blockMass.toFixed(1)} × 9.8 = ${weight.toFixed(0)} N`, TK.x, TK.y + TK.h + 12);
    fill('#00bcd4cc');
    text(`E = V_sub·rho·g = ${subVol.toFixed(1)} × ${liqDensity.toFixed(2)} × 9.8 = ${buoyancy.toFixed(0)} N`, TK.x, TK.y + TK.h + 27);

    // Nombre del líquido si hay preset seleccionado
    let lname = getLiquidName();
    if (lname) {
        fill('#607888'); textSize(8); textAlign(LEFT, TOP);
        text(`Fluido: ${lname}`, TK.x, TK.y + TK.h + 43);
    }

    pop();
}

// ═══════════════════════════════════════════════════════════════════
//  PANEL SUPERIOR DERECHO: DIAGRAMA DE CUERPO LIBRE
// ═══════════════════════════════════════════════════════════════════
function drawFBDPanel(weight, buoyancy, netForce) {
    push();
    // Fondo del panel
    stroke('#22303c'); strokeWeight(1); fill('#141c24');
    rect(FBD.x, FBD.y, FBD.w, FBD.h, 8);

    // Título
    noStroke(); fill('#666'); textSize(9); textAlign(LEFT, TOP);
    text('DIAGRAMA DE CUERPO LIBRE', FBD.x + 12, FBD.y + 12);

    // Bloque central del diagrama
    let cx = FBD.x + FBD.w * 0.38;
    let cy = FBD.y + FBD.h * 0.46;   // ligeramente arriba del centro para dejar espacio a las flechas
    let bW = 72, bH = 54;

    stroke('#00c8ff55'); strokeWeight(2); fill('#182432');
    rect(cx - bW/2, cy - bH/2, bW, bH, 6);
    noStroke(); fill('#99ccee'); textSize(9); textAlign(CENTER, CENTER);
    text('m = ' + blockMass.toFixed(1) + ' kg', cx, cy - 9);
    text('V = ' + blockVol.toFixed(0) + ' L',  cx, cy + 7);

    // Escala de flechas proporcional
    let maxF  = max(weight, buoyancy, 1);
    let maxPx = 76;

    // Empuje ↑ (cyan)
    if (buoyancy > 0.5) {
        let px = (buoyancy / maxF) * maxPx;
        drawFBDArrow(cx, cy - bH/2, 0, -px, color(0, 200, 255),
                     'E = ' + buoyancy.toFixed(1) + ' N', true);
    }

    // Peso ↓ (rojo)
    let ppx = (weight / maxF) * maxPx;
    drawFBDArrow(cx, cy + bH/2, 0, ppx, color(255, 90, 90),
                 'P = ' + weight.toFixed(1) + ' N', false);

    // Fuerza neta (lateral, solo si es significativa)
    let fnAbs = abs(netForce);
    if (fnAbs > 3) {
        let fnPx  = (fnAbs / maxF) * maxPx * 0.68;
        let fnDir = netForce > 0 ? 1 : -1;
        let fnCol = netForce > 0 ? color(255, 195, 40) : color(80, 255, 155);
        let sx    = cx + bW / 2 + 32;
        drawFBDArrow(sx, cy, 0, fnDir * fnPx, fnCol,
                     'Fn=' + netForce.toFixed(0) + 'N', netForce < 0);
        noStroke(); fill(fnCol); textSize(8); textAlign(LEFT, CENTER);
        text('Fuerza', sx + 8, cy - fnDir * 12);
        text('neta',   sx + 8, cy - fnDir * 2);
    }

    // Ecuación de equilibrio (centrada bajo el bloque)
    let eqText = `P ${netForce > 3 ? '>' : netForce < -3 ? '<' : '≈'} E`;
    let eqCol  = netForce > 3 ? color(255, 90, 90) :
                 netForce < -3 ? color(0, 210, 120) : color(255, 205, 50);
    noStroke(); fill(eqCol); textSize(15); textAlign(CENTER, BOTTOM);
    text(eqText, cx, FBD.y + FBD.h - 26);
    let estado = computeEstado();
    fill(estado.col); textSize(9.5); textAlign(CENTER, BOTTOM);
    text(estado.label, cx, FBD.y + FBD.h - 10);

    // Franja de cálculo numérico (panel derecho del FBD)
    drawFBDCalculation(weight, buoyancy, netForce);

    pop();
}

function drawFBDCalculation(weight, buoyancy, netForce) {
    let px = FBD.x + FBD.w * 0.60;
    let py = FBD.y + 26;
    let pw = FBD.w * 0.38;
    let ph = FBD.h - 36;

    // Fondo semitransparente
    noStroke(); fill(8, 16, 26, 210);
    rect(px, py, pw, ph, 6);

    // Título
    fill('#4a6070'); textSize(8); textAlign(LEFT, TOP);
    text('CÁLCULO', px + 10, py + 8);

    let tx = px + 10;
    let ty = py + 22;
    let ls = 13;

    // V_sub a partir del empuje: V_sub = E / (rho × g)
    let vSub = liqDensity > 0 ? buoyancy / (liqDensity * G) : 0;

    // ── Peso ──
    fill(255, 100, 100); textSize(8.5); textAlign(LEFT, TOP);
    text('Peso:', tx, ty); ty += ls;
    fill('#aaa');
    text(`P = m·g`, tx + 4, ty); ty += ls;
    text(`  = ${blockMass.toFixed(1)}×9.8`, tx + 4, ty); ty += ls;
    fill(255, 160, 160);
    text(`  = ${weight.toFixed(1)} N`, tx + 4, ty); ty += ls + 2;

    stroke('#203040'); strokeWeight(0.8);
    line(px + 8, ty, px + pw - 8, ty);
    ty += 6;

    // ── Empuje ──
    noStroke(); fill(0, 200, 255); textSize(8.5); textAlign(LEFT, TOP);
    text('Empuje:', tx, ty); ty += ls;
    fill('#aaa');
    text(`E = Vs·ρ·g`, tx + 4, ty); ty += ls;
    text(`  = ${vSub.toFixed(1)}×${liqDensity.toFixed(2)}×9.8`, tx + 4, ty); ty += ls;
    fill(120, 220, 255);
    text(`  = ${buoyancy.toFixed(1)} N`, tx + 4, ty); ty += ls + 2;

    stroke('#203040'); strokeWeight(0.8);
    line(px + 8, ty, px + pw - 8, ty);
    ty += 6;

    // ── Fuerza neta ──
    let fnCol = netForce > 3  ? color(255, 195, 40) :
                netForce < -3 ? color(80, 255, 155)  : color(180, 180, 180);
    noStroke(); fill(fnCol); textSize(8.5); textAlign(LEFT, TOP);
    text('Fuerza neta:', tx, ty); ty += ls;
    fill('#aaa');
    text(`Fn = P - E`, tx + 4, ty); ty += ls;
    let fnDir = netForce > 3 ? ' ↓' : netForce < -3 ? ' ↑' : ' ⇌';
    fill(fnCol);
    text(`  = ${netForce.toFixed(1)} N${fnDir}`, tx + 4, ty);
}

function drawFBDArrow(x, y, dx, dy, col, label, labelUp) {
    let len = sqrt(dx*dx + dy*dy);
    if (len < 4) return;
    push();
    let hs = 9;
    stroke(col); strokeWeight(2.8); fill(col);
    line(x, y, x + dx, y + dy);
    let a = atan2(dy, dx);
    push();
    translate(x + dx, y + dy); rotate(a);
    triangle(0, 0, -hs, -hs/2.4, -hs, hs/2.4);
    pop();
    noStroke(); fill(col); textSize(10);
    if (labelUp) { textAlign(CENTER, BOTTOM); text(label, x + dx, y + dy - 7); }
    else         { textAlign(CENTER, TOP);    text(label, x + dx, y + dy + 7); }
    pop();
}

// ═══════════════════════════════════════════════════════════════════
//  PANEL INFERIOR DERECHO: GRÁFICA HISTÓRICA
// ═══════════════════════════════════════════════════════════════════
function drawGraphPanel() {
    push();
    // Fondo del panel
    stroke('#1c2830'); strokeWeight(1); fill('#101820');
    rect(GRP.x, GRP.y, GRP.w, GRP.h, 8);

    // Título
    noStroke(); fill('#666'); textSize(9); textAlign(LEFT, TOP);
    text('EVOLUCIÓN TEMPORAL — PESO vs EMPUJE (N)', GRP.x + 12, GRP.y + 12);

    let mg = { l: 46, r: 14, t: 30, b: 28 };
    let gx = GRP.x + mg.l, gy = GRP.y + mg.t;
    let gw = GRP.w - mg.l - mg.r, gh = GRP.h - mg.t - mg.b;

    // Ejes
    stroke('#2c3c48'); strokeWeight(1.2);
    line(gx, gy, gx, gy + gh);
    line(gx, gy + gh, gx + gw, gy + gh);

    if (histW.length < 2) { pop(); return; }

    // Rango Y automático
    let allV = [...histW, ...histE];
    let maxV = max(max(allV) * 1.18, 12);

    // Cuadrícula horizontal
    let nGrid = 4;
    for (let i = 0; i <= nGrid; i++) {
        let v  = (maxV / nGrid) * i;
        let py = map(v, 0, maxV, gy + gh, gy);
        stroke(i === 0 ? '#384858' : '#202c38'); strokeWeight(0.6);
        line(gx, py, gx + gw, py);
        noStroke(); fill('#4a5c68'); textSize(8); textAlign(RIGHT, CENTER);
        text(v.toFixed(0), gx - 5, py);
    }

    // Etiqueta eje Y
    push();
    noStroke(); fill('#4a5c68'); textSize(8);
    translate(GRP.x + 10, gy + gh / 2); rotate(-HALF_PI);
    textAlign(CENTER, CENTER); text('Fuerza (N)', 0, 0);
    pop();

    // Etiqueta eje X
    noStroke(); fill('#4a5c68'); textSize(8); textAlign(CENTER, TOP);
    text('tiempo →', gx + gw / 2, gy + gh + 6);

    // Área bajo la curva del Empuje (relleno translúcido)
    noStroke(); fill(0, 200, 255, 22);
    beginShape();
    vertex(gx, gy + gh);
    for (let i = 0; i < histE.length; i++) {
        let px = map(i, 0, MAX_HIST - 1, gx, gx + gw);
        let py = map(histE[i], 0, maxV, gy + gh, gy);
        vertex(px, py);
    }
    vertex(map(histE.length - 1, 0, MAX_HIST - 1, gx, gx + gw), gy + gh);
    endShape(CLOSE);

    // Área bajo la curva del Peso (relleno translúcido)
    noStroke(); fill(255, 90, 90, 18);
    beginShape();
    vertex(gx, gy + gh);
    for (let i = 0; i < histW.length; i++) {
        let px = map(i, 0, MAX_HIST - 1, gx, gx + gw);
        let py = map(histW[i], 0, maxV, gy + gh, gy);
        vertex(px, py);
    }
    vertex(map(histW.length - 1, 0, MAX_HIST - 1, gx, gx + gw), gy + gh);
    endShape(CLOSE);

    // Curva del Peso (rojo)
    stroke(255, 90, 90, 215); strokeWeight(2); noFill();
    beginShape();
    for (let i = 0; i < histW.length; i++) {
        vertex(map(i, 0, MAX_HIST - 1, gx, gx + gw),
               map(histW[i], 0, maxV, gy + gh, gy));
    }
    endShape();

    // Curva del Empuje (cyan)
    stroke(0, 200, 255, 215); strokeWeight(2); noFill();
    beginShape();
    for (let i = 0; i < histE.length; i++) {
        vertex(map(i, 0, MAX_HIST - 1, gx, gx + gw),
               map(histE[i], 0, maxV, gy + gh, gy));
    }
    endShape();

    // Punto actual (marcador en el extremo derecho)
    let lastIdx = histW.length - 1;
    let curX = map(lastIdx, 0, MAX_HIST - 1, gx, gx + gw);
    let curYW = map(histW[lastIdx], 0, maxV, gy + gh, gy);
    let curYE = map(histE[lastIdx], 0, maxV, gy + gh, gy);
    noStroke(); fill(255, 90, 90); ellipse(curX, curYW, 6, 6);
    fill(0, 200, 255); ellipse(curX, curYE, 6, 6);

    // Línea vertical presente
    stroke('#ffffff18'); strokeWeight(1);
    line(curX, gy, curX, gy + gh);

    // Línea de equilibrio horizontal (E = P)
    if (histW.length > 0) {
        let eqVal = histW[histW.length - 1];  // el peso actual (constante)
        let eqPy  = map(eqVal, 0, maxV, gy + gh, gy);
        drawingContext.setLineDash([5, 6]);
        stroke(255, 255, 255, 32);
        strokeWeight(1.2);
        line(gx, eqPy, gx + gw, eqPy);
        drawingContext.setLineDash([]);
        noStroke(); fill(255, 255, 255, 40); textSize(7.5); textAlign(LEFT, BOTTOM);
        text('E = P', gx + 4, eqPy - 2);
    }

    // Leyenda
    noStroke();
    fill(255, 90, 90); rect(gx + gw - 112, gy + 5, 12, 4, 1);
    fill('#ccc'); textSize(8.5); textAlign(LEFT, CENTER);
    text('Peso (P)', gx + gw - 97, gy + 7);
    fill(0, 200, 255); rect(gx + gw - 112, gy + 18, 12, 4, 1);
    fill('#ccc'); text('Empuje (E)', gx + gw - 97, gy + 20);

    pop();
}

// ═══════════════════════════════════════════════════════════════════
//  FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════════
function getLiquidName() {
    if (!liquidPresets) return '';
    const names = {
        gasolina: 'Gasolina', alcohol: 'Etanol (alcohol)',
        aceite: 'Aceite vegetal', aguadulce: 'Agua dulce',
        aguamar: 'Agua de mar', glicerina: 'Glicerina', mercurio: 'Mercurio'
    };
    return names[liquidPresets.value()] || '';
}

function liquidColor(d) {
    if (d < 0.78)  return color(180, 140, 60, 160);   // gasolina / alcohol (ambarino)
    if (d < 0.95)  return color(120, 80, 20, 165);    // aceite (marrón cálido)
    if (d < 1.03)  return color(12, 118, 218, 165);   // agua dulce (azul puro)
    if (d < 1.10)  return color(8, 95, 200, 172);     // agua de mar (azul profundo)
    if (d < 1.35)  return color(40, 70, 170, 185);    // glicerina / salmuera (azul oscuro)
    if (d < 5.0)   return color(65, 45, 145, 195);    // líquidos densos (violeta)
    return         color(150, 108, 30, 215);          // mercurio y similares (dorado)
}

function computeEstado() {
    let bd = blockMass / blockVol;
    let r  = bd / liqDensity;
    if (r > 1.03) return { label: '↓  HUNDIÉNDOSE   (ρ_bl > ρ_liq)', col: color(255, 80, 80) };
    if (r < 0.97) return { label: '↑  FLOTANDO   (ρ_bl < ρ_liq)',    col: color(0, 210, 120) };
    return         { label: '⇌  EQUILIBRIO NEUTRO   (ρ_bl ≈ ρ_liq)', col: color(255, 202, 50) };
}

function updateUI(blockDens, buoyancy, weight, netForce, subRatio, subVol) {
    select('#metric-densidad').html(blockDens.toFixed(2));
    select('#metric-empuje').html(buoyancy.toFixed(1));
    select('#metric-peso').html(weight.toFixed(1));
    select('#metric-porcentaje').html((subRatio * 100).toFixed(0));
    select('#metric-vol-sumergido').html(subVol.toFixed(1));
    select('#metric-razon').html((blockDens / liqDensity).toFixed(3));
    select('#metric-fneta').html(netForce.toFixed(1));

    let estado = computeEstado();
    let col    = `rgb(${red(estado.col)},${green(estado.col)},${blue(estado.col)})`;
    let bd     = blockMass / blockVol;
    let r      = bd / liqDensity;

    let estadoEl = select('#metric-estado');
    let condEl   = select('#metric-condicion');

    if (r > 1.03) {
        estadoEl.html('Hundiéndose'); estadoEl.style('color', '#ff5050');
        condEl.html('ρ<sub>bl</sub> &gt; ρ<sub>liq</sub>'); condEl.style('color', '#ff5050');
    } else if (r < 0.97) {
        estadoEl.html('Flotando'); estadoEl.style('color', '#00d080');
        condEl.html('ρ<sub>bl</sub> &lt; ρ<sub>liq</sub>'); condEl.style('color', '#00d080');
    } else {
        estadoEl.html('Equilibrio Neutro'); estadoEl.style('color', '#ffc832');
        condEl.html('ρ<sub>bl</sub> ≈ ρ<sub>liq</sub>'); condEl.style('color', '#ffc832');
    }
}

// ═══════════════════════════════════════════════════════════════════
//  PRESETS Y CONTROLES
// ═══════════════════════════════════════════════════════════════════
function actualizarMaterialPreset() {
    if (!materialPresets || materialPresets.value() === 'manual') return;
    const densidades = {
        corcho:   0.24,
        madera:   0.60,
        hielo:    0.917,
        plastico: 0.95,
        cera:     0.95,
        aluminio: 2.70,
        hierro:   7.87,
        plomo:    11.34,
        oro:      19.30
    };
    const d   = densidades[materialPresets.value()] || 1.0;
    const vol = parseFloat(sliderVol.value());
    blockMass = constrain(round(d * vol * 10) / 10, 10, 200);
    sliderMasa.value(blockMass);
    select('#val-masa').html(`${blockMass.toFixed(1)} kg`);
}

function actualizarLiquidPreset() {
    if (!liquidPresets || liquidPresets.value() === 'manual') return;
    const densidades = {
        gasolina:  0.74,
        alcohol:   0.789,
        aceite:    0.92,
        aguadulce: 1.00,
        aguamar:   1.025,
        glicerina: 1.261,
        mercurio:  13.534
    };
    const d = densidades[liquidPresets.value()] || 1.0;
    liqDensity = d;
    sliderLiq.value(d);
    select('#val-liq').html(`${d.toFixed(3)} kg/L`);
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
        noLoop(); simulationActive = false;
        playPauseBtn.html('&#9654; Reanudar');
        playPauseBtn.addClass('estado-pausado');
    } else {
        loop(); simulationActive = true;
        playPauseBtn.html('&#9646;&#9646; Pausar');
        playPauseBtn.removeClass('estado-pausado');
    }
}

function resetSimulation() {
    blockMass  = defaultState.mass;
    blockVol   = defaultState.vol;
    liqDensity = defaultState.liqDensity;
    blockY     = defaultState.blockY;
    velocityY  = defaultState.velocityY;
    histW = []; histE = []; bubbles = [];

    sliderMasa.value(blockMass);
    sliderVol.value(blockVol);
    sliderLiq.value(liqDensity);
    select('#val-masa').html(`${blockMass} kg`);
    select('#val-volumen').html(`${blockVol} L`);
    select('#val-liq').html(`${liqDensity.toFixed(3)} kg/L`);
    materialPresets.value('manual');
    liquidPresets.value('manual');
    refreshMassSliderState();

    if (!simulationActive) {
        loop(); simulationActive = true;
        if (playPauseBtn) {
            playPauseBtn.html('&#9646;&#9646; Pausar');
            playPauseBtn.removeClass('estado-pausado');
        }
    }
}
