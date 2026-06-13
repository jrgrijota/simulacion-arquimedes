// ═══════════════════════════════════════════════════════════════════
//  SIMULACIÓN: PRINCIPIO DE ARQUÍMEDES
//  Física para Secundaria y Bachillerato
// ═══════════════════════════════════════════════════════════════════

// --- PARÁMETROS FÍSICOS ---
let blockMass  = 50;   // kg
let blockVol   = 100;  // litros
let liqDensity = 1.0;  // kg/L

// --- CINEMÁTICA ---
let blockY    = 90;
let velocityY = 0;
const G            = 9.8;   // m/s²
const MOTION_SCALE = 0.30;
const FLUID_DRAG   = 0.90;  // amortiguación del líquido

// --- RANGOS DE LOS DESLIZADORES ---
const MASA_MIN = 10,  MASA_MAX = 200;
const VOL_MIN  = 50,  VOL_MAX  = 150;
const LIQ_MIN  = 0.5, LIQ_MAX  = 13.6;
// Densidad del bloque alcanzable con los deslizadores: ρ = m / V
const DENS_MIN = MASA_MIN / VOL_MAX;   // menor masa y mayor volumen  ≈ 0.07 kg/L
const DENS_MAX = MASA_MAX / VOL_MIN;   // mayor masa y menor volumen  = 4.00 kg/L

// --- MODOS ---
let currentMode = 'custom';   // 'custom' (deslizadores) | 'materials' (materiales reales)
const MATERIALS_VOL = 100;    // volumen fijo en modo materiales reales

const MATERIAL_DENS = {
    corcho: 0.24, madera: 0.60, hielo: 0.917, plastico: 0.95,
    aluminio: 2.70, hierro: 7.87, plomo: 11.34, oro: 19.30
};
const LIQUID_DENS = {
    gasolina: 0.74, alcohol: 0.789, aceite: 0.92,
    aguadulce: 1.00, aguamar: 1.025, glicerina: 1.261, mercurio: 13.534
};

// --- LAYOUT DEL CANVAS ---
const CV_W = 1050, CV_H = 700;

// Escala de densidades (franja izquierda del tanque)
const SC = { x: 22, y: 120, w: 16, h: 470 };

// Tanque (vista macro, panel izquierdo) — mutable: cambia con showFBD
let TK = { x: 78, y: 120, w: 300, h: 470 };
const LIQ_Y = TK.y + 110;  // nivel de la superficie del líquido (px)

// Diagrama de cuerpo libre (panel derecho, a pantalla completa)
const FBD = { x: 452, y: 30, w: CV_W - 452 - 24, h: CV_H - 60 };

// --- ESTADO GLOBAL ---
let showFBD = false;  // si el diagrama de cuerpo libre está visible
let bubbles = [];
let THEME   = {};

// --- DOM ---
let sliderMasa, sliderVol, sliderLiq;
let materialPresets, liquidPresets;
let modeCustomBtn, modeMaterialsBtn;

const defaultState = { mass: 50, vol: 100, liqDensity: 1.0, blockY: 90, velocityY: 0 };


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
    modeCustomBtn   = select('#mode-custom');
    modeMaterialsBtn= select('#mode-materials');

    sliderMasa.input(() => {
        select('#val-masa').html(`${sliderMasa.value()} kg`);
        setSliderFill(sliderMasa, MASA_MIN, MASA_MAX);
    });
    sliderVol.input(() => {
        select('#val-volumen').html(`${sliderVol.value()} L`);
        setSliderFill(sliderVol, VOL_MIN, VOL_MAX);
    });
    sliderLiq.input(() => {
        select('#val-liq').html(`${parseFloat(sliderLiq.value()).toFixed(3)} kg/L`);
        setSliderFill(sliderLiq, LIQ_MIN, LIQ_MAX);
    });

    materialPresets.changed(applyMaterialPreset);
    liquidPresets.changed(applyLiquidPreset);

    modeCustomBtn.mousePressed(() => setMode('custom'));
    modeMaterialsBtn.mousePressed(() => setMode('materials'));

    const fbdToggleBtn = document.getElementById('fbd-toggle');
    if (fbdToggleBtn) {
        fbdToggleBtn.addEventListener('click', () => {
            showFBD = !showFBD;
            fbdToggleBtn.setAttribute('aria-pressed', String(showFBD));
            fbdToggleBtn.classList.toggle('active', showFBD);
        });
    }

    // ── Selector de tema ──────────────────────────────────────────
    const themeBtn   = document.getElementById('theme-btn');
    const themePanel = document.getElementById('theme-panel');
    const themeOpts  = document.querySelectorAll('.theme-opt');

    if (themeBtn && themePanel) {
        themeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = themePanel.classList.toggle('open');
            themeBtn.classList.toggle('active', isOpen);
            themeBtn.setAttribute('aria-expanded', String(isOpen));
            themePanel.setAttribute('aria-hidden', String(!isOpen));
        });

        document.addEventListener('click', (e) => {
            if (!themeBtn.contains(e.target) && !themePanel.contains(e.target)) {
                themePanel.classList.remove('open');
                themeBtn.classList.remove('active');
                themeBtn.setAttribute('aria-expanded', 'false');
                themePanel.setAttribute('aria-hidden', 'true');
            }
        });
    }

    themeOpts.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            document.body.classList.remove('theme-light', 'theme-contrast');
            if (theme !== 'dark') document.body.classList.add('theme-' + theme);
            themeOpts.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (themePanel) {
                themePanel.classList.remove('open');
                themePanel.setAttribute('aria-hidden', 'true');
            }
            if (themeBtn) {
                themeBtn.classList.remove('active');
                themeBtn.setAttribute('aria-expanded', 'false');
            }
        });
    });

    refreshSliderFills();
}

function updateTheme() {
    const isLight    = document.body.classList.contains('theme-light');
    const isContrast = document.body.classList.contains('theme-contrast');

    if (isLight) {
        THEME = {
            canvasBg:       '#ccd6e8',
            tankWall:       '#3a4858',
            tankInner:      '#8090a0',
            tankReflect:    '#a8b8c8',
            tankDepthMark:  '#607080',
            tankDepthText:  '#4a5a6a',
            liquidName:     color(15, 30, 55, 24),
            blockStroke:    '#0066aa',
            blockHatch:     color(0, 90, 170, 28),
            blockMassLabel: color(255, 255, 255, 95),
            blockWaterline: '#0088cc',
            bubbleAlphaMax: 95,
            densBarBorder:  '#4a5a6a',
            densLiqLabel:   color(8, 28, 55, 255),
            densScaleLabel: '#4a5a6a',
            densTitle:      '#4a5a6a',
            annotLine:      color(35, 65, 105, 70),
            formulaP:       '#2a3a4a',
            formulaE:       color(0, 70, 95, 220),
            liquidLbl:      '#2a4a60',
            subPctFlt:      color(0, 95, 165, 185),
            subPctSink:     '#cc2020',
            fbdBg:          '#b4c8dc',
            fbdBorder:      '#6888a0',
            fbdTitle:       '#1a3050',
            fbdBlockFill:   '#85a5be',
            fbdBlockBorder: '#005a7055',
            fbdBlockText:   '#080e18',
            fbdCalcBg:      color(168, 192, 218, 225),
            fbdCalcBorder:  '#5878a0',
            fbdCalcTitle:   '#1a3050',
            fbdCalcText:    '#080e18',
            fbdCalcLine:    '#5878a0',
        };
    } else if (isContrast) {
        THEME = {
            canvasBg:       '#000000',
            tankWall:       '#ffff00',
            tankInner:      '#333300',
            tankReflect:    '#777700',
            tankDepthMark:  '#555500',
            tankDepthText:  '#aaaaaa',
            liquidName:     color(255, 255, 255, 32),
            blockStroke:    '#00ffff',
            blockHatch:     color(0, 255, 255, 38),
            blockMassLabel: color(255, 255, 255, 225),
            blockWaterline: '#00ffff',
            bubbleAlphaMax: 235,
            densBarBorder:  '#ffff00',
            densLiqLabel:   color(255, 255, 255, 255),
            densScaleLabel: '#aaaaaa',
            densTitle:      '#ffff00',
            annotLine:      color(255, 255, 0, 70),
            formulaP:       '#cccccc',
            formulaE:       color(0, 220, 238, 255),
            liquidLbl:      '#aaaaaa',
            subPctFlt:      color(0, 255, 255, 255),
            subPctSink:     '#ff4444',
            fbdBg:          '#000000',
            fbdBorder:      '#ffff00',
            fbdTitle:       '#ffff00',
            fbdBlockFill:   '#001818',
            fbdBlockBorder: '#00ffff88',
            fbdBlockText:   '#00ffff',
            fbdCalcBg:      color(0, 8, 12, 238),
            fbdCalcBorder:  '#ffff00',
            fbdCalcTitle:   '#ffff00',
            fbdCalcText:    '#ffffff',
            fbdCalcLine:    '#333300',
        };
    } else {
        THEME = {
            canvasBg:       '#141414',
            tankWall:       '#585858',
            tankInner:      '#1a1a1a',
            tankReflect:    '#888888',
            tankDepthMark:  '#333333',
            tankDepthText:  '#444444',
            liquidName:     color(255, 255, 255, 16),
            blockStroke:    '#00c8ff',
            blockHatch:     color(0, 200, 255, 18),
            blockMassLabel: color(255, 255, 255, 50),
            blockWaterline: '#00ffff',
            bubbleAlphaMax: 170,
            densBarBorder:  '#555555',
            densLiqLabel:   color(255, 255, 255, 220),
            densScaleLabel: '#666666',
            densTitle:      '#666666',
            annotLine:      color(255, 255, 255, 40),
            formulaP:       '#888888',
            formulaE:       color(0, 188, 212, 200),
            liquidLbl:      '#607888',
            subPctFlt:      color(0, 200, 255, 155),
            subPctSink:     '#ff7070',
            fbdBg:          '#141c24',
            fbdBorder:      '#22303c',
            fbdTitle:       '#7a8a98',
            fbdBlockFill:   '#182432',
            fbdBlockBorder: '#00c8ff55',
            fbdBlockText:   '#bcd8ee',
            fbdCalcBg:      color(10, 20, 32, 215),
            fbdCalcBorder:  '#1e3048',
            fbdCalcTitle:   '#5d7890',
            fbdCalcText:    '#bcbcbc',
            fbdCalcLine:    '#203040',
        };
    }
}

// ─────────────────────────────────────────────────────────────────
function draw() {
    updateTheme();
    background(THEME.canvasBg);

    // Layout dinámico: sin DCL el tanque ocupa más ancho
    if (showFBD) { TK.w = 300; }
    else          { TK.w = 700; }

    // 1. LEER CONTROLES (solo en modo deslizadores; en materiales los fija el preset)
    if (currentMode === 'custom') {
        blockMass  = parseFloat(sliderMasa.value());
        blockVol   = parseFloat(sliderVol.value());
        liqDensity = parseFloat(sliderLiq.value());
    }

    // 2. GEOMETRÍA DEL BLOQUE
    let blockDens = blockMass / blockVol;
    let bSide     = map(blockVol, VOL_MIN, VOL_MAX, 64, 150);  // tamaño visual
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

    // 4. ACTUALIZAR MÉTRICAS HTML
    updateUI(blockDens, buoyancy, weight, netForce, subRatio, subVol);

    // 5. RENDER DE PANELES
    drawMacroView(bX, bSide, subH, subVol, subRatio, buoyancy, weight, blockDens);

    if (showFBD) {
        drawFBDPanel(weight, buoyancy, netForce);
        stroke('#252525'); strokeWeight(1);
        line(FBD.x - 14, 8, FBD.x - 14, CV_H - 8);
    }
}

// ═══════════════════════════════════════════════════════════════════
//  PANEL IZQUIERDO: VISTA MACRO
// ═══════════════════════════════════════════════════════════════════
function drawMacroView(bX, bSide, subH, subVol, subRatio, buoyancy, weight, blockDens) {
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
    // Gradiente de profundidad
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
    // Marca de agua: nombre del líquido en el fondo del tanque
    let lname = getLiquidName();
    if (lname) {
        noStroke();
        fill(THEME.liquidName);
        textSize(13); textAlign(CENTER, BOTTOM);
        text(lname, TK.x + TK.w / 2, TK.y + TK.h - 10);
    }

    // Textura del líquido (solo modo materials)
    if (currentMode === 'materials' && liquidPresets) {
        drawFluidTexture(liquidPresets.value());
    }

    pop();
}

function drawTank() {
    push();
    // Sombra interior
    stroke(THEME.tankInner); strokeWeight(7); noFill();
    rect(TK.x + 1, TK.y + 1, TK.w - 2, TK.h - 2, 0, 0, 8, 8);
    // Pared
    stroke(THEME.tankWall); strokeWeight(3); noFill();
    rect(TK.x, TK.y, TK.w, TK.h, 0, 0, 8, 8);
    // Reflejo superior
    stroke(THEME.tankReflect); strokeWeight(1.5);
    line(TK.x + 9, TK.y + 5, TK.x + TK.w - 9, TK.y + 5);
    // Marcas de profundidad (lado derecho del tanque)
    stroke(THEME.tankDepthMark); strokeWeight(1);
    let nMarks = 5;
    for (let i = 1; i <= nMarks; i++) {
        let my = LIQ_Y + (TK.y + TK.h - LIQ_Y) * (i / (nMarks + 1));
        line(TK.x + TK.w, my, TK.x + TK.w + 6, my);
        noStroke(); fill(THEME.tankDepthText); textSize(8); textAlign(LEFT, CENTER);
        text((i * 100 / (nMarks + 1)).toFixed(0) + '%', TK.x + TK.w + 8, my);
        stroke(THEME.tankDepthMark);
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
        let a = map(b.y, LIQ_Y, TK.y + TK.h, 12, THEME.bubbleAlphaMax);
        fill(255, 255, 255, max(0, a));
        ellipse(b.x, b.y, b.r * 2, b.r * 2.7);
        if (b.y < LIQ_Y) bubbles.splice(i, 1);
    }
    pop();
}

function drawBlock(bX, bSide, subH, blockDens) {
    push();
    let emergedH = bSide - subH;
    let matKey = (currentMode === 'materials' && materialPresets) ? materialPresets.value() : null;
    let baseCol = matKey ? getMaterialBaseColor(matKey) : color(26, 38, 50);

    // Sombra proyectada sobre el líquido
    if (subH > 2) {
        noStroke(); fill(0, 0, 0, 55);
        rect(bX + 7, blockY + emergedH + 5, bSide, subH, 0, 0, 3, 3);
    }

    // Parte emergida — material sólido
    if (emergedH > 1) {
        stroke(THEME.blockStroke); strokeWeight(2);
        fill(baseCol);
        rect(bX, blockY, bSide, emergedH, 4, 4, 0, 0);
        if (!matKey) {
            stroke(THEME.blockHatch); strokeWeight(1);
            let step = 12;
            for (let k = 0; k < bSide + emergedH; k += step) {
                let x1 = bX + max(0, k - emergedH),  y1 = blockY + min(k, emergedH);
                let x2 = bX + min(bSide, k),           y2 = blockY + max(0, k - bSide);
                line(x1, y1, x2, y2);
            }
        }
    }

    // Parte sumergida — impregnada del líquido
    if (subH > 1) {
        stroke(THEME.blockStroke); strokeWeight(2);
        let lc = liquidColor(liqDensity);
        if (matKey) {
            fill(
                lerp(red(baseCol), red(lc) * 0.45, 0.45),
                lerp(green(baseCol), green(lc) * 0.45, 0.45),
                lerp(blue(baseCol), blue(lc) * 0.45, 0.45),
                175
            );
        } else {
            fill(red(lc) * 0.45, green(lc) * 0.45, blue(lc) * 0.45, 155);
        }
        rect(bX, blockY + emergedH, bSide, subH, 0, 0, 4, 4);
    }

    // Línea de flotación (waterline)
    if (subH > 2 && emergedH > 2) {
        stroke(THEME.blockWaterline); strokeWeight(2);
        line(bX - 5, blockY + emergedH, bX + bSide + 5, blockY + emergedH);
    }

    // Textura de material (encima del bloque, solo modo materials)
    if (matKey) drawBlockTexture(bX, blockY, bSide, matKey);

    // Masa dentro del bloque (si es suficientemente grande)
    if (bSide > 84) {
        noStroke(); fill(THEME.blockMassLabel); textSize(11); textAlign(CENTER, CENTER);
        text(`${blockMass.toFixed(0)} kg`, bX + bSide / 2, blockY + bSide / 2);
    }

    // Etiqueta de densidad sobre el bloque
    noStroke();
    let dCol = blockDens > liqDensity * 1.03 ? color(255, 90, 90) :
               blockDens < liqDensity * 0.97 ? color(0, 215, 120) :
               color(255, 205, 50);
    fill(dCol);
    textSize(12); textAlign(CENTER, BOTTOM);
    text(`ρ = ${blockDens.toFixed(2)} kg/L`, bX + bSide / 2, blockY - 8);

    pop();
}

function drawDensityBar(blockDens) {
    push();
    // Rango dinámico: se expande si alguna densidad supera DENS_MAX
    let minD = DENS_MIN;
    let rawMax = max(DENS_MAX, blockDens, liqDensity);
    let maxD = rawMax <= DENS_MAX ? DENS_MAX : ceil(rawMax / 5) * 5;

    // Gradiente de colores
    for (let i = 0; i < SC.h; i++) {
        let t = i / SC.h;
        let d = lerp(minD, maxD, t);
        stroke(liquidColor(d)); strokeWeight(1);
        line(SC.x, SC.y + i, SC.x + SC.w, SC.y + i);
    }
    noFill(); stroke(THEME.densBarBorder); strokeWeight(1);
    rect(SC.x, SC.y, SC.w, SC.h);

    // Marcador del líquido (triángulo derecha, blanco)
    let liqMY = map(constrain(liqDensity, minD, maxD), minD, maxD, SC.y, SC.y + SC.h);
    stroke('#ffffff'); strokeWeight(1.5); fill('#ffffff');
    triangle(SC.x + SC.w + 2, liqMY,
             SC.x + SC.w + 9, liqMY - 5,
             SC.x + SC.w + 9, liqMY + 5);

    // Marcador del bloque (triángulo también derecha, debajo del de líquido)
    let blkMY = map(constrain(blockDens, minD, maxD), minD, maxD, SC.y, SC.y + SC.h);
    let mCol  = blockDens > liqDensity ? color(255, 100, 100) : color(80, 220, 140);
    stroke(mCol); strokeWeight(1.5); fill(mCol);
    triangle(SC.x + SC.w + 2, blkMY,
             SC.x + SC.w + 9, blkMY - 5,
             SC.x + SC.w + 9, blkMY + 5);

    // Etiquetas con offset dinámico para evitar solapamiento
    let nearEq = abs(liqMY - blkMY) < 13;
    let liqLY = liqMY, blkLY = blkMY;
    if (nearEq) {
        if (liqMY <= blkMY) { liqLY = liqMY - 7;  blkLY = blkMY + 7; }
        else                { liqLY = liqMY + 7;  blkLY = blkMY - 7; }
    }

    noStroke(); fill(THEME.densLiqLabel); textSize(10); textAlign(LEFT, CENTER);
    text(liqDensity.toFixed(2), SC.x + SC.w + 12, liqLY);
    fill(mCol);
    text(blockDens.toFixed(2), SC.x + SC.w + 12, blkLY);

    // Título de la escala y extremos (mín. arriba, máx. abajo)
    noStroke(); fill(THEME.densTitle); textSize(9);
    textAlign(CENTER, BOTTOM);
    text('ρ', SC.x + SC.w / 2, SC.y - 14);
    fill(THEME.densScaleLabel); textSize(8);
    textAlign(CENTER, BOTTOM);
    text(minD.toFixed(2), SC.x + SC.w / 2, SC.y - 2);
    textAlign(CENTER, TOP);
    text(maxD.toFixed(1), SC.x + SC.w / 2, SC.y + SC.h + 3);

    pop();
}

function drawMacroAnnotations(bX, bSide, subH, subVol, subRatio, buoyancy, weight, blockDens) {
    push();
    let emergedH = bSide - subH;

    // Indicador de % sumergido (brace lateral izquierda del tanque)
    if (subRatio > 0.01) {
        let midSub = blockY + emergedH + subH / 2;
        drawingContext.setLineDash([3, 4]);
        stroke('#00c8ff44'); strokeWeight(1);
        line(TK.x - 5, blockY + emergedH, TK.x - 5, blockY + bSide);
        drawingContext.setLineDash([]);
        noStroke();
        fill(subRatio > 0.99 ? THEME.subPctSink : THEME.subPctFlt);
        textSize(11); textAlign(RIGHT, CENTER);
        text(`${(subRatio * 100).toFixed(0)}%`, TK.x - 8, midSub);
    }

    // Línea punteada de la superficie del líquido
    drawingContext.setLineDash([4, 5]);
    stroke(THEME.annotLine); strokeWeight(0.9);
    line(SC.x + SC.w + 12, LIQ_Y, TK.x - 6, LIQ_Y);
    drawingContext.setLineDash([]);

    // Fórmulas dinámicas bajo el tanque
    noStroke(); fill(THEME.formulaP); textSize(11); textAlign(LEFT, TOP);
    text(`P = m·g = ${blockMass.toFixed(1)} × 9.8 = ${weight.toFixed(0)} N`, TK.x, TK.y + TK.h + 16);
    fill(THEME.formulaE);
    text(`E = Vsub·ρlíq·g = ${subVol.toFixed(1)} × ${liqDensity.toFixed(2)} × 9.8 = ${buoyancy.toFixed(0)} N`, TK.x, TK.y + TK.h + 36);

    // Nombre del líquido si hay preset seleccionado
    let lname = getLiquidName();
    if (lname) {
        fill(THEME.liquidLbl); textSize(10); textAlign(LEFT, TOP);
        text(`Líquido: ${lname}`, TK.x, TK.y + TK.h + 56);
    }

    pop();
}

// ═══════════════════════════════════════════════════════════════════
//  PANEL DERECHO: DIAGRAMA DE CUERPO LIBRE
// ═══════════════════════════════════════════════════════════════════
function drawFBDPanel(weight, buoyancy, netForce) {
    push();
    // Fondo del panel
    stroke(THEME.fbdBorder); strokeWeight(1); fill(THEME.fbdBg);
    rect(FBD.x, FBD.y, FBD.w, FBD.h, 10);

    // Título
    noStroke(); fill(THEME.fbdTitle); textSize(13); textAlign(LEFT, TOP);
    text('DIAGRAMA DE CUERPO LIBRE', FBD.x + 18, FBD.y + 16);

    // Punto de aplicación: centro del bloque en la zona izquierda del panel
    let cx = FBD.x + FBD.w * 0.25;
    let cy = FBD.y + FBD.h * 0.48;
    let bW = 110, bH = 84;
    // Base x para etiquetas a la derecha del bloque
    let sideX = cx + bW / 2 + 14;

    // Escala proporcional de las flechas
    let maxF  = max(weight, buoyancy, 1);
    let maxPx = 155;

    // Bloque (primero, para que las flechas queden encima)
    stroke(THEME.fbdBlockBorder); strokeWeight(2.5); fill(THEME.fbdBlockFill);
    rect(cx - bW/2, cy - bH/2, bW, bH, 8);

    // Datos del bloque a la derecha, no dentro
    noStroke(); fill(THEME.fbdBlockText); textSize(12); textAlign(LEFT, CENTER);
    text('m = ' + blockMass.toFixed(1) + ' kg', sideX, cy - 10);
    text('V = ' + blockVol.toFixed(0)   + ' L', sideX, cy + 10);

    // Empuje ↑ — origen en el centro del bloque
    if (buoyancy > 0.5) {
        let px = (buoyancy / maxF) * maxPx;
        drawFBDArrow(cx, cy, 0, -px, color(0, 200, 255),
                     'E = ' + buoyancy.toFixed(1) + ' N', true);
    }

    // Peso ↓ — origen en el centro del bloque
    let ppx = (weight / maxF) * maxPx;
    drawFBDArrow(cx, cy, 0, ppx, color(255, 90, 90),
                 'P = ' + weight.toFixed(1) + ' N', false);

    // Fuerza neta — dibujada ÚLTIMA (encima de E y P), mismo punto de aplicación
    let fnAbs = abs(netForce);
    if (fnAbs > 3) {
        let fnPx  = (fnAbs / maxF) * maxPx;
        let fnDir = netForce > 0 ? 1 : -1;
        let fnCol = netForce > 0 ? color(255, 195, 40) : color(80, 255, 155);
        let hs    = 13;
        stroke(fnCol); strokeWeight(4.5); fill(fnCol);
        line(cx, cy, cx, cy + fnDir * fnPx);
        push();
        translate(cx, cy + fnDir * fnPx);
        rotate(fnDir > 0 ? HALF_PI : -HALF_PI);
        triangle(0, 0, -hs, -hs / 2.4, -hs, hs / 2.4);
        pop();
        // Etiqueta al lado derecho del bloque, a mitad de la flecha
        noStroke(); fill(fnCol); textSize(12); textAlign(LEFT, CENTER);
        text('Fn = ' + netForce.toFixed(0) + ' N', sideX, cy + fnDir * fnPx / 2);
    }

    // Ecuación de equilibrio centrada bajo el bloque
    let eqText = `P ${netForce > 3 ? '>' : netForce < -3 ? '<' : '≈'} E`;
    let eqCol  = netForce > 3 ? color(255, 90, 90) :
                 netForce < -3 ? color(0, 210, 120) : color(255, 205, 50);
    noStroke(); fill(eqCol); textSize(30); textAlign(CENTER, BOTTOM);
    text(eqText, cx, FBD.y + FBD.h - 56);
    let estado = computeEstado();
    fill(estado.col); textSize(14); textAlign(CENTER, BOTTOM);
    text(estado.label, cx, FBD.y + FBD.h - 24);

    // Franja de cálculo numérico (panel derecho del FBD)
    drawFBDCalculation(weight, buoyancy, netForce);

    pop();
}

function drawFBDCalculation(weight, buoyancy, netForce) {
    let px = FBD.x + FBD.w * 0.58;
    let py = FBD.y + 44;
    let pw = FBD.w * 0.40;
    let ph = FBD.h - 76;

    // Fondo con borde sutil
    stroke(THEME.fbdCalcBorder); strokeWeight(1); fill(THEME.fbdCalcBg);
    rect(px, py, pw, ph, 8);

    // Título
    noStroke(); fill(THEME.fbdCalcTitle); textSize(11); textAlign(LEFT, TOP);
    text('PASO A PASO', px + 16, py + 14);

    let tx = px + 16;
    let ty = py + 40;
    let ls = 21;

    // V_sub a partir del empuje: V_sub = E / (ρ × g)
    let vSub = liqDensity > 0 ? buoyancy / (liqDensity * G) : 0;

    // ── Peso ──
    fill(255, 120, 120); textSize(13); textAlign(LEFT, TOP);
    text('Peso:', tx, ty); ty += ls;
    fill(THEME.fbdCalcText);
    text(`P = m·g`, tx + 6, ty); ty += ls;
    text(`  = ${blockMass.toFixed(1)} × 9.8`, tx + 6, ty); ty += ls;
    fill(255, 170, 170);
    text(`  = ${weight.toFixed(1)} N`, tx + 6, ty); ty += ls + 6;

    stroke(THEME.fbdCalcLine); strokeWeight(0.8);
    line(px + 12, ty, px + pw - 12, ty);
    ty += 12;

    // ── Empuje ──
    noStroke(); fill(0, 200, 255); textSize(13); textAlign(LEFT, TOP);
    text('Empuje:', tx, ty); ty += ls;
    fill(THEME.fbdCalcText);
    text(`E = Vsub·ρlíq·g`, tx + 6, ty); ty += ls;
    text(`  = ${vSub.toFixed(1)} × ${liqDensity.toFixed(2)} × 9.8`, tx + 6, ty); ty += ls;
    fill(140, 225, 255);
    text(`  = ${buoyancy.toFixed(1)} N`, tx + 6, ty); ty += ls + 6;

    stroke(THEME.fbdCalcLine); strokeWeight(0.8);
    line(px + 12, ty, px + pw - 12, ty);
    ty += 12;

    // ── Fuerza neta ──
    let fnCol = netForce > 3  ? color(255, 195, 40) :
                netForce < -3 ? color(80, 255, 155)  : color(190, 190, 190);
    noStroke(); fill(fnCol); textSize(13); textAlign(LEFT, TOP);
    text('Fuerza neta:', tx, ty); ty += ls;
    fill(THEME.fbdCalcText);
    text(`Fn = P − E`, tx + 6, ty); ty += ls;
    let fnDir = netForce > 3 ? ' ↓ se hunde' : netForce < -3 ? ' ↑ flota' : ' ⇌ equilibrio';
    fill(fnCol);
    text(`  = ${netForce.toFixed(1)} N`, tx + 6, ty); ty += ls;
    text(`  ${fnDir}`, tx + 6, ty);
}

function drawFBDArrow(x, y, dx, dy, col, label, labelUp) {
    let len = sqrt(dx*dx + dy*dy);
    if (len < 4) return;
    push();
    let hs = 12;
    stroke(col); strokeWeight(3.4); fill(col);
    line(x, y, x + dx, y + dy);
    let a = atan2(dy, dx);
    push();
    translate(x + dx, y + dy); rotate(a);
    triangle(0, 0, -hs, -hs/2.4, -hs, hs/2.4);
    pop();
    noStroke(); fill(col); textSize(14);
    if (labelUp) { textAlign(CENTER, BOTTOM); text(label, x + dx, y + dy - 9); }
    else         { textAlign(CENTER, TOP);    text(label, x + dx, y + dy + 9); }
    pop();
}

// ═══════════════════════════════════════════════════════════════════
//  FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════════
function setSliderFill(slider, minV, maxV) {
    if (!slider) return;
    let pct = ((parseFloat(slider.value()) - minV) / (maxV - minV)) * 100;
    slider.elt.style.setProperty('--fill', pct.toFixed(1) + '%');
}

function refreshSliderFills() {
    setSliderFill(sliderMasa, MASA_MIN, MASA_MAX);
    setSliderFill(sliderVol,  VOL_MIN,  VOL_MAX);
    setSliderFill(sliderLiq,  LIQ_MIN,  LIQ_MAX);
}

function getLiquidName() {
    if (currentMode !== 'materials' || !liquidPresets) return '';
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
    return         color(155, 162, 172, 235);         // mercurio (plateado metálico)
}

function computeEstado() {
    let bd = blockMass / blockVol;
    let r  = bd / liqDensity;
    if (r > 1.03) return { label: '↓  HUNDIÉNDOSE   (ρ bloque > ρ líquido)', col: color(255, 80, 80) };
    if (r < 0.97) return { label: '↑  FLOTANDO   (ρ bloque < ρ líquido)',    col: color(0, 210, 120) };
    return         { label: '⇌  EQUILIBRIO NEUTRO   (ρ bloque ≈ ρ líquido)', col: color(255, 202, 50) };
}

function updateUI(blockDens, buoyancy, weight, netForce, subRatio, subVol) {
    select('#metric-densidad').html(blockDens.toFixed(2));
    select('#metric-dens-liq').html(liqDensity.toFixed(3));
    select('#metric-empuje').html(buoyancy.toFixed(0));
    select('#metric-peso').html(weight.toFixed(0));
    select('#metric-vol-sumergido').html(subVol.toFixed(1));
    select('#metric-fneta').html(netForce.toFixed(0));

    // Barras de comparación de densidades
    let maxD = max(blockDens, liqDensity, 0.5);
    let pctB = min((blockDens / maxD) * 100, 100);
    let pctL = min((liqDensity  / maxD) * 100, 100);
    let barB = document.getElementById('bar-block');
    let barL = document.getElementById('bar-liquid');
    let valB = document.getElementById('dval-block');
    let valL = document.getElementById('dval-liquid');
    if (barB) {
        barB.style.height = pctB + '%';
        barB.style.background = blockDens > liqDensity * 1.03
            ? 'linear-gradient(0deg,#993030,#ff7070)'
            : blockDens < liqDensity * 0.97
                ? 'linear-gradient(0deg,#205020,#50d050)'
                : 'linear-gradient(0deg,#806020,#ffc832)';
    }
    if (barL)  barL.style.height = pctL + '%';
    if (valB)  valB.textContent   = blockDens.toFixed(2);
    if (valL)  valL.textContent   = liqDensity.toFixed(3);

    // Estado del sistema
    let bd = blockMass / blockVol;
    let r  = bd / liqDensity;
    let estadoEl = select('#metric-estado');
    let condEl   = select('#metric-condicion');

    if (r > 1.03) {
        estadoEl.html('Hundiéndose'); estadoEl.style('color', '#ff5050');
        condEl.html('ρ<sub>bloque</sub> &gt; ρ<sub>líquido</sub>'); condEl.style('color', '#ff5050');
    } else if (r < 0.97) {
        estadoEl.html('Flotando'); estadoEl.style('color', '#00d080');
        condEl.html('ρ<sub>bloque</sub> &lt; ρ<sub>líquido</sub>'); condEl.style('color', '#00d080');
    } else {
        estadoEl.html('Equilibrio Neutro'); estadoEl.style('color', '#ffc832');
        condEl.html('ρ<sub>bloque</sub> ≈ ρ<sub>líquido</sub>'); condEl.style('color', '#ffc832');
    }
}

// ═══════════════════════════════════════════════════════════════════
//  MODOS, PRESETS Y CONTROLES
// ═══════════════════════════════════════════════════════════════════
function setMode(mode) {
    currentMode = mode;
    document.body.classList.toggle('mode-custom',    mode === 'custom');
    document.body.classList.toggle('mode-materials', mode === 'materials');

    // Marcar el botón activo
    if (modeCustomBtn && modeMaterialsBtn) {
        if (mode === 'custom') { modeCustomBtn.addClass('active'); modeMaterialsBtn.removeClass('active'); }
        else                   { modeMaterialsBtn.addClass('active'); modeCustomBtn.removeClass('active'); }
    }

    if (mode === 'materials') {
        applyMaterialPreset();
        applyLiquidPreset();
    } else {
        // Volver a tomar los valores de los deslizadores
        blockMass  = parseFloat(sliderMasa.value());
        blockVol   = parseFloat(sliderVol.value());
        liqDensity = parseFloat(sliderLiq.value());
        refreshSliderFills();
    }
}

function applyMaterialPreset() {
    if (!materialPresets) return;
    const d = MATERIAL_DENS[materialPresets.value()];
    if (d == null) return;
    blockVol  = MATERIALS_VOL;
    blockMass = d * blockVol;   // m = ρ × V (sin recortar, para respetar la densidad real)
}

function applyLiquidPreset() {
    if (!liquidPresets) return;
    const d = LIQUID_DENS[liquidPresets.value()];
    if (d == null) return;
    liqDensity = d;
}

// ═══════════════════════════════════════════════════════════════════
//  TEXTURAS DE MATERIALES
// ═══════════════════════════════════════════════════════════════════
function getMaterialBaseColor(matKey) {
    switch(matKey) {
        case 'corcho':   return color(195, 158, 95);
        case 'madera':   return color(115, 70, 28);
        case 'hielo':    return color(210, 235, 250);
        case 'plastico': return color(80, 120, 155);
        case 'aluminio': return color(155, 165, 175);
        case 'hierro':   return color(58, 62, 66);
        case 'plomo':    return color(48, 52, 68);
        case 'oro':      return color(200, 160, 18);
        default:         return color(26, 38, 50);
    }
}

function drawBlockTexture(bX, blockY, bSide, matKey) {
    push();
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(bX, blockY, bSide, bSide);
    drawingContext.clip();

    switch(matKey) {
        case 'madera':
            noFill(); noiseSeed(42);
            for (let i = 0; i < bSide + 10; i += 5) {
                let alpha = 35 + sin(i * 0.55) * 18;
                stroke(50 + noise(i * 0.12) * 40, 22 + noise(i * 0.09) * 18, 4, alpha);
                strokeWeight(0.8 + sin(i * 0.6) * 0.4);
                beginShape();
                for (let x = bX; x <= bX + bSide; x += 3) {
                    vertex(x, blockY + i + noise(x * 0.06, i * 0.1) * 6 - 3);
                }
                endShape();
            }
            noStroke(); fill(45, 22, 4, 55);
            ellipse(bX + bSide * 0.65, blockY + bSide * 0.4, 20, 14);
            noStroke(); fill(55, 28, 6, 35);
            ellipse(bX + bSide * 0.65, blockY + bSide * 0.4, 11, 8);
            break;

        case 'corcho':
            noStroke(); noiseSeed(7);
            for (let row = 0; row < 11; row++) {
                for (let col = 0; col < 11; col++) {
                    let cx2 = bX + 4 + col * (bSide - 8) / 10 + (noise(col * 0.9, row * 0.9) - 0.5) * 6;
                    let cy2 = blockY + 4 + row * (bSide - 8) / 10 + (noise(col * 0.9 + 30, row * 0.9) - 0.5) * 6;
                    let sz = 3 + noise(col * 1.1, row * 1.1) * 5;
                    fill(80 + noise(col * 0.7, row) * 50, 50 + noise(col * 0.8, row * 0.6) * 30, 5 + noise(col, row * 0.9) * 20, 90);
                    ellipse(cx2, cy2, sz, sz * 0.8);
                }
            }
            break;

        case 'hielo':
            randomSeed(11);
            stroke(220, 240, 255, 75); strokeWeight(1);
            for (let i = 0; i < 8; i++) {
                let sx = bX + random(bSide * 0.1, bSide * 0.9);
                let sy = blockY + random(bSide * 0.1, bSide * 0.9);
                let ex = sx + random(-35, 35), ey = sy + random(-35, 35);
                line(sx, sy, ex, ey);
                line((sx+ex)/2, (sy+ey)/2, (sx+ex)/2 + random(-18,18), (sy+ey)/2 + random(-18,18));
            }
            noStroke();
            for (let i = 0; i < bSide * 0.35; i += 3) {
                fill(235, 248, 255, map(i, 0, bSide * 0.35, 22, 0));
                rect(bX, blockY + i, bSide, 3);
            }
            break;

        case 'plastico':
            noStroke();
            for (let i = 0; i < bSide * 0.3; i += 2) {
                fill(255, 255, 255, map(i, 0, bSide * 0.3, 22, 0));
                rect(bX, blockY + i, bSide, 2);
            }
            stroke(255, 255, 255, 60); strokeWeight(3.5);
            line(bX + 8, blockY + 8, bX + bSide * 0.42, blockY + 8);
            break;

        case 'aluminio':
            noiseSeed(23);
            for (let i = 0; i < bSide; i += 2) {
                stroke(215, 220, 225, 18 + noise(i * 0.08) * 28); strokeWeight(1);
                line(bX, blockY + i, bX + bSide, blockY + i);
            }
            stroke(255, 255, 255, 75); strokeWeight(5);
            line(bX + 10, blockY + 6, bX + bSide * 0.45, blockY + 6);
            stroke(255, 255, 255, 28); strokeWeight(9);
            line(bX + 14, blockY + 15, bX + bSide * 0.3, blockY + 15);
            break;

        case 'hierro':
            randomSeed(17);
            for (let i = 0; i < 45; i++) {
                stroke(85, 80, 78, random(12, 38)); strokeWeight(random(0.5, 2.2));
                let rx = bX + random(bSide), ry = blockY + random(bSide);
                line(rx, ry, rx + random(-10, 10), ry + random(-7, 7));
            }
            randomSeed(99); noStroke();
            for (let i = 0; i < 7; i++) {
                fill(115, 52, 14, random(10, 26));
                ellipse(bX + random(bSide), blockY + random(bSide), random(7, 22), random(5, 14));
            }
            break;

        case 'plomo':
            randomSeed(31);
            for (let i = 0; i < 70; i++) {
                stroke(52, 52, 72, random(8, 20)); strokeWeight(random(1, 3.5));
                point(bX + random(bSide), blockY + random(bSide));
            }
            noStroke(); fill(65, 75, 110, 18);
            rect(bX, blockY, bSide, bSide / 2.8);
            break;

        case 'oro':
            noFill();
            for (let i = -bSide; i < bSide + 20; i += 11) {
                stroke(255, 225, 70, 28 + sin(i * 0.32) * 18); strokeWeight(1.2 + sin(i * 0.55) * 0.5);
                line(bX + i, blockY, bX + i + bSide * 0.85, blockY + bSide);
            }
            stroke(255, 252, 190, 95); strokeWeight(6);
            line(bX + 8, blockY + 7, bX + bSide * 0.48, blockY + 7);
            stroke(255, 248, 180, 35); strokeWeight(11);
            line(bX + 15, blockY + 18, bX + bSide * 0.35, blockY + 18);
            break;
    }

    drawingContext.restore();
    pop();
}

function drawFluidTexture(liquidKey) {
    push();
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(TK.x + 3, LIQ_Y, TK.w - 6, TK.y + TK.h - LIQ_Y);
    drawingContext.clip();

    switch(liquidKey) {
        case 'mercurio':
            randomSeed(55);
            for (let i = 0; i < 18; i++) {
                stroke(225, 230, 240, random(18, 50)); strokeWeight(random(1, 3.5));
                let sy = LIQ_Y + random(TK.y + TK.h - LIQ_Y - 10);
                line(TK.x + 10 + random(TK.w - 20), sy,
                     TK.x + 10 + random(TK.w - 20), sy + random(20, 60));
            }
            noStroke();
            for (let x = TK.x + 7; x < TK.x + TK.w - 7; x += 5) {
                fill(240, 245, 252, 50);
                ellipse(x, LIQ_Y + 5 + sin(frameCount * 0.04 + x * 0.09) * 2, 3, 3);
            }
            break;

        case 'aceite':
            randomSeed(77); noStroke();
            for (let i = 0; i < 10; i++) {
                fill(185, 168, 35, random(10, 22));
                let sy = LIQ_Y + random(20, 50);
                rect(TK.x + 10 + random(TK.w - 20), sy, random(7, 18), random(35, 100), 3);
            }
            break;

        case 'glicerina':
            randomSeed(33); noStroke();
            for (let i = 0; i < 12; i++) {
                fill(210, 158, 45, random(12, 28));
                let sy = LIQ_Y + random(15, 40);
                rect(TK.x + 10 + random(TK.w - 20), sy, random(5, 14), random(50, 130), 4);
            }
            break;

        case 'gasolina':
            noStroke();
            let iridColors = [
                [255,60,60],[255,155,0],[255,245,0],
                [0,210,100],[0,110,255],[160,0,255]
            ];
            for (let i = 0; i < iridColors.length; i++) {
                let c = iridColors[i];
                fill(c[0], c[1], c[2], 20);
                rect(TK.x + 3, LIQ_Y + 5 + i * 3 + sin(frameCount * 0.025 + i * 0.9) * 2,
                     TK.w - 6, 4);
            }
            break;

        case 'alcohol':
            randomSeed(44); noStroke();
            for (let i = 0; i < 20; i++) {
                fill(180, 210, 240, random(8, 18));
                let br = random(2, 6);
                ellipse(TK.x + 10 + random(TK.w - 20),
                        LIQ_Y + random(TK.y + TK.h - LIQ_Y - 10), br, br);
            }
            break;
    }

    drawingContext.restore();
    pop();
}
