// ═══════════════════════════════════════════════════════════════════
//  SIMULACIÓN: PRINCIPIO DE ARQUÍMEDES
//  Física para Secundaria y Bachillerato
// ═══════════════════════════════════════════════════════════════════

// Números con coma decimal, como se escriben en clase (punto en inglés).
function fmt(x, d) {
    return i18n.num(x, d);
}

// Igual que text(), pero dibuja cada ρ con letra de serifa: en la fuente
// monoespaciada la ρ parece una P y se confunde con el peso.
const RHO_FONT = 'Cambria Math, Times New Roman, serif';
function textRho(str, x, y) {
    if (!str.includes('ρ')) { text(str, x, y); return; }
    const mono = textFont();
    const al = textAlign();
    const parts = str.split('ρ');
    textFont(RHO_FONT);
    textStyle(ITALIC);
    const wRho = textWidth('ρ');
    textFont(mono);
    textStyle(NORMAL);
    let total = (parts.length - 1) * wRho;
    for (const p of parts) total += textWidth(p);
    let cx = al.horizontal === CENTER ? x - total / 2
           : al.horizontal === RIGHT  ? x - total : x;
    textAlign(LEFT, al.vertical);
    parts.forEach((p, i) => {
        text(p, cx, y);
        cx += textWidth(p);
        if (i < parts.length - 1) {
            textFont(RHO_FONT);
            textStyle(ITALIC);
            text('ρ', cx, y);
            textFont(mono);
            textStyle(NORMAL);
            cx += wRho;
        }
    });
    textAlign(al.horizontal, al.vertical);
}

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
const LIQ_Y0 = TK.y + 110;  // nivel del líquido sin el bloque dentro (px)
let liqY = LIQ_Y0;          // nivel actual: sube con el volumen desalojado

// Diagrama de cuerpo libre (panel derecho, a pantalla completa)
const FBD = { x: 452, y: 30, w: CV_W - 452 - 24, h: CV_H - 60 };

// --- ESTADO GLOBAL ---
let showFBD = false;  // si el diagrama de cuerpo libre está visible
let enFondo = false;  // si el bloque descansa en el fondo del tanque
let THEME   = {};

// --- DOM ---
let sliderMasa, sliderVol, sliderLiq;
let materialPresets, liquidPresets;
let modeCustomBtn, modeMaterialsBtn;

const defaultState = { mass: 50, vol: 100, liqDensity: 1.0, blockY: 90, velocityY: 0 };

// --- HUEVO DE PASCUA: ARQUÍMEDES ---
// Última opción de «Materiales reales». Arquímedes aparece sujeto sobre el
// depósito, que está lleno hasta el borde. Al meterlo en el líquido (arrastrándolo,
// tocándolo o con el botón del panel) el líquido rebosa y grita «¡EUREKA!»; al
// sacarlo se ve que el depósito ya no está lleno: falta justo lo que se derramó.
// Para la física es un rectángulo de ARQ.w × ARQ.h con 70 L y 0,98 kg/L (cuerpo
// humano con aire en los pulmones): flota casi entero, con un 98 % sumergido.
const ARQ = { w: 96, h: 112, vol: 70, dens: 0.98 };
const BRIM = TK.y + 3;                 // nivel «lleno hasta el borde»
const ARQ_TOP_Y = BRIM - ARQ.h - 4;    // posición en la que está sujeto, fuera del líquido
const ARQ_SPEED = 5;                   // px por fotograma al sacarlo
// Siempre en el mismo sitio, con o sin diagrama de cuerpo libre. Centrado en el
// depósito ancho quedaría bajo el botón del diagrama, que en el móvil tapa la
// esquina superior derecha del lienzo.
const ARQ_CX = TK.x + 150;
let arq = {
    estado: 'sujeto',   // 'sujeto' | 'libre' (física) | 'arrastrando' | 'subiendo'
    previo: 'sujeto',   // estado antes de empezar a arrastrar
    deficit: 0,         // líquido derramado, en px² de la vista (área que falta hasta el borde)
    derramado: 0,       // litros derramados en total (para el charco)
    eurekaDesde: -1,    // fotograma en que empezó a rebosar en esta inmersión
    vertiendo: 0,       // fotogramas que quedan de chorro por encima del borde
    rellenando: false,
    gotas: [],
    subH: 0,
    dragOff: 0, downY: 0, moved: 0,
};


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
    // Las etiquetas de los <optgroup> no las traduce i18n.js
    document.querySelectorAll('optgroup').forEach(g => { g.label = i18n.t(g.label); });

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
        select('#val-liq').html(`${fmt(parseFloat(sliderLiq.value()), 3)} kg/L`);
        setSliderFill(sliderLiq, LIQ_MIN, LIQ_MAX);
    });

    materialPresets.changed(applyMaterialPreset);
    setupArquimedes(canvas.elt);
    liquidPresets.changed(applyLiquidPreset);

    modeCustomBtn.mouseClicked(() => setMode('custom'));
    modeMaterialsBtn.mouseClicked(() => setMode('materials'));

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

    // Ajustes de la dirección (fichas del alumnado): ver js/parametros.js.
    aplicarParametrosUrl({
        modo:     urlParam.click({ libre: 'mode-custom', materiales: 'mode-materials' }),
        masa:     urlParam.range('slider-masa'),
        volumen:  urlParam.range('slider-volumen'),
        densidad: urlParam.range('slider-liq'),
        material: urlParam.select('material-presets'),
        liquido:  urlParam.select('liquid-presets'),
        fuerzas:  urlParam.toggle('fbd-toggle', (b) => b.getAttribute('aria-pressed') === 'true'),
    });
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

    // 2. GEOMETRÍA DEL BLOQUE (o de Arquímedes, que no es cuadrado)
    const isArq   = esArquimedes();
    let blockDens = blockMass / blockVol;
    let bW        = isArq ? ARQ.w : map(blockVol, VOL_MIN, VOL_MAX, 64, 150);  // tamaño visual
    let bH        = isArq ? ARQ.h : bW;
    let bX        = (isArq ? ARQ_CX : TK.x + TK.w / 2) - bW / 2;

    // 3. FÍSICA — PRINCIPIO DE ARQUÍMEDES
    // El bloque desaloja líquido y el nivel sube: el área sumergida (bW·subH)
    // se reparte sobre el ancho interior del tanque. Como subH depende a su vez
    // del nivel, se resuelven juntos: subH = (fondo − nivel0) / (1 − bW/ancho).
    let bBottom  = blockY + bH;
    let tankW    = TK.w - 6;
    if (isArq && arq.rellenando) arq.deficit = max(0, arq.deficit - tankW * 1.2);
    // Con Arquímedes el depósito empieza lleno hasta el borde, menos lo derramado
    let nivel0   = isArq ? BRIM + arq.deficit / tankW : LIQ_Y0;
    let subH     = constrain((bBottom - nivel0) / (1 - bW / tankW), 0, bH);   // px sumergidos
    liqY         = nivel0 - bW * subH / tankW;
    if (isArq) {
        // Por encima del borde no cabe: lo que sobra se derrama y ya no vuelve
        let derrame = 0;
        if (liqY < BRIM) {
            liqY = BRIM;
            subH = constrain(bBottom - BRIM, 0, bH);
            derrame = max(0, bW * subH - arq.deficit);
            arq.deficit += derrame;
        }
        updateArquimedes(bX, bW, bH, subH, derrame, tankW);
    }
    let subRatio = bH > 0 ? subH / bH : 0;                  // fracción 0–1
    let subVol   = blockVol * subRatio;                     // litros sumergidos

    let weight   = blockMass * G;               // N  (kg × m/s²)
    let buoyancy = subVol * liqDensity * G;     // N  (L × kg/L × m/s²)
    let netForce = weight - buoyancy;
    let accel    = netForce / max(blockMass, 0.1);

    // Arquímedes sujeto, arrastrado o subiendo no se mueve por la física
    const arqSujeto = isArq && arq.estado !== 'libre';
    if (arqSujeto) {
        velocityY = 0;
        if (arq.estado === 'subiendo') {
            blockY = max(ARQ_TOP_Y, blockY - ARQ_SPEED);
            if (blockY <= ARQ_TOP_Y) arq.estado = 'sujeto';
        }
    } else {
        velocityY += accel * MOTION_SCALE;
        velocityY = constrain(velocityY, -9, 9);
        if (subH > 0) velocityY *= FLUID_DRAG;
        blockY += velocityY;
    }

    // Colisiones con las paredes del tanque
    if (blockY + bH > TK.y + TK.h) {
        blockY = TK.y + TK.h - bH;
        velocityY *= -0.10;
    }
    let techo = isArq ? ARQ_TOP_Y : TK.y - bH * 0.30;
    if (blockY < techo) {
        blockY = techo;
        velocityY = 0;
    }

    // Apoyado en el fondo: el suelo del tanque ejerce la fuerza normal que
    // equilibra lo que el empuje no compensa, y la fuerza neta pasa a ser 0.
    enFondo = blockY + bH >= TK.y + TK.h - 1 && weight > buoyancy;
    let normal = enFondo ? weight - buoyancy : 0;
    if (enFondo) netForce = 0;

    // 4. ACTUALIZAR MÉTRICAS HTML
    updateUI(blockDens, buoyancy, weight, netForce, subRatio, subVol);

    // 5. RENDER DE PANELES
    drawMacroView(bX, bW, bH, subH, subVol, subRatio, buoyancy, weight, blockDens, isArq);

    if (showFBD) {
        drawFBDPanel(weight, buoyancy, netForce, normal);
        stroke('#252525'); strokeWeight(1);
        line(FBD.x - 14, 8, FBD.x - 14, CV_H - 8);
    }
}

// ═══════════════════════════════════════════════════════════════════
//  PANEL IZQUIERDO: VISTA MACRO
// ═══════════════════════════════════════════════════════════════════
function drawMacroView(bX, bW, bH, subH, subVol, subRatio, buoyancy, weight, blockDens, isArq) {
    drawLiquid();
    drawTank(isArq);
    drawLiquidSurface(isArq);
    if (isArq) drawArquimedesEscena(bX, bW, bH, subH, blockDens);
    else       drawBlock(bX, bW, subH, blockDens);
    drawDensityBar(blockDens);
    drawMacroAnnotations(bX, bH, subH, subVol, subRatio, buoyancy, weight, blockDens);
    if (isArq) drawArquimedesNotas();
}

function drawLiquid() {
    push();
    let lc = liquidColor(liqDensity);
    // Gradiente de profundidad
    for (let i = 0; i < 42; i++) {
        let t  = i / 42;
        let y0 = lerp(liqY, TK.y + TK.h, t);
        let y1 = lerp(liqY, TK.y + TK.h, (i + 1) / 42);
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

function drawTank(isArq) {
    push();
    // Sombra interior
    stroke(THEME.tankInner); strokeWeight(7); noFill();
    rect(TK.x + 1, TK.y + 1, TK.w - 2, TK.h - 2, 0, 0, 8, 8);
    // Pared
    stroke(THEME.tankWall); strokeWeight(3); noFill();
    rect(TK.x, TK.y, TK.w, TK.h, 0, 0, 8, 8);
    // Reflejo superior (con el depósito lleno hasta el borde quedaría dentro del agua)
    if (!isArq) {
        stroke(THEME.tankReflect); strokeWeight(1.5);
        line(TK.x + 9, TK.y + 5, TK.x + TK.w - 9, TK.y + 5);
    }
    // Marcas de profundidad (lado derecho del tanque)
    stroke(THEME.tankDepthMark); strokeWeight(1);
    let nMarks = 5;
    for (let i = 1; i <= nMarks; i++) {
        let my = liqY + (TK.y + TK.h - liqY) * (i / (nMarks + 1));
        line(TK.x + TK.w, my, TK.x + TK.w + 6, my);
        noStroke(); fill(THEME.tankDepthText); textSize(8); textAlign(LEFT, CENTER);
        text((i * 100 / (nMarks + 1)).toFixed(0) + '%', TK.x + TK.w + 8, my);
        stroke(THEME.tankDepthMark);
    }
    pop();
}

function drawLiquidSurface(isArq) {
    push();
    let t  = frameCount * 0.034;
    // Lleno hasta el borde, la ola apenas asoma por encima de él
    let amp = isArq && liqY < BRIM + 4 ? 0.4 : 1;
    let lc = liquidColor(liqDensity);
    // Onda principal
    stroke(red(lc), green(lc), blue(lc), 220);
    strokeWeight(2.2); noFill();
    beginShape();
    for (let x = TK.x + 3; x <= TK.x + TK.w - 3; x += 3) {
        let y = liqY + (sin(t + x * 0.042) * 2.8 + sin(t * 1.4 + x * 0.071) * 1.4) * amp;
        vertex(x, y);
    }
    endShape();
    // Reflejo
    stroke(red(lc), green(lc), blue(lc), 45);
    strokeWeight(3); noFill();
    beginShape();
    for (let x = TK.x + 3; x <= TK.x + TK.w - 3; x += 3) {
        let y = liqY + 7 + sin(t * 0.75 + x * 0.038) * 2.2;
        vertex(x, y);
    }
    endShape();
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
        noStroke(); fill(THEME.blockMassLabel); textSize(14); textAlign(CENTER, CENTER);
        text(`${fmt(blockMass, 0)} kg`, bX + bSide / 2, blockY + bSide / 2);
    }

    // Etiqueta de densidad sobre el bloque
    noStroke();
    let cmp  = compararDensidades();
    let dCol = cmp > 0 ? color(255, 90, 90) :
               cmp < 0 ? color(0, 215, 120) :
               color(255, 205, 50);
    fill(dCol);
    textSize(14); textAlign(CENTER, BOTTOM);
    textRho(`ρ = ${fmt(blockDens, 2)} kg/L`, bX + bSide / 2, blockY - 8);

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
    let nearEq = abs(liqMY - blkMY) < 15;
    let liqLY = liqMY, blkLY = blkMY;
    if (nearEq) {
        if (liqMY <= blkMY) { liqLY = liqMY - 8;  blkLY = blkMY + 8; }
        else                { liqLY = liqMY + 8;  blkLY = blkMY - 8; }
    }

    noStroke(); fill(THEME.densLiqLabel); textSize(12); textAlign(LEFT, CENTER);
    text(fmt(liqDensity, 2), SC.x + SC.w + 12, liqLY);
    fill(mCol);
    text(fmt(blockDens, 2), SC.x + SC.w + 12, blkLY);

    // Leyenda de las dos marcas: sin ella no se sabe cuál es el bloque
    textSize(12); textAlign(LEFT, CENTER);
    fill(THEME.densLiqLabel);
    text(i18n.t('◀ líquido'), SC.x - 14, SC.y - 66);
    fill(mCol);
    text(i18n.t('◀ bloque'), SC.x - 14, SC.y - 48);

    // Título de la escala y extremos (mín. arriba, máx. abajo)
    noStroke(); fill(THEME.densTitle); textSize(14);
    textAlign(CENTER, BOTTOM);
    textRho('ρ', SC.x + SC.w / 2, SC.y - 16);
    fill(THEME.densScaleLabel); textSize(11);
    textAlign(CENTER, BOTTOM);
    text(fmt(minD, 2), SC.x + SC.w / 2, SC.y - 2);
    textAlign(CENTER, TOP);
    text(fmt(maxD, 1), SC.x + SC.w / 2, SC.y + SC.h + 3);

    pop();
}

function drawMacroAnnotations(bX, bH, subH, subVol, subRatio, buoyancy, weight, blockDens) {
    push();
    let emergedH = bH - subH;

    // Indicador de % sumergido, junto al bloque (fuera del depósito se montaba
    // sobre los números de la escala de densidades)
    if (subRatio > 0.01) {
        let midSub = blockY + emergedH + subH / 2;
        drawingContext.setLineDash([3, 4]);
        stroke('#00c8ff44'); strokeWeight(1);
        line(bX - 6, blockY + emergedH, bX - 6, blockY + bH);
        drawingContext.setLineDash([]);
        noStroke();
        fill(subRatio > 0.99 ? THEME.subPctSink : color(150, 225, 255));
        textSize(13); textAlign(RIGHT, CENTER);
        stroke(0, 0, 0, 170); strokeWeight(3);   // contorno: se lee sobre el agua
        text(`${fmt((subRatio * 100), 0)} %`, bX - 10, midSub);
        noStroke();
    }

    // Línea punteada de la superficie del líquido
    drawingContext.setLineDash([4, 5]);
    stroke(THEME.annotLine); strokeWeight(0.9);
    line(SC.x + SC.w + 12, liqY, TK.x - 6, liqY);
    drawingContext.setLineDash([]);

    // Fórmulas dinámicas bajo el tanque
    // Las fórmulas con números son lo que se lee en voz alta: letra de proyector
    noStroke(); fill(THEME.formulaP); textSize(14); textAlign(LEFT, TOP);
    text(`P = m·g = ${fmt(blockMass, 1)} × ${fmt(G, 1)} = ${fmt(weight, 0)} N`, TK.x, TK.y + TK.h + 16);
    fill(THEME.formulaE);
    textRho(`${i18n.t('E = Vsub·ρlíq·g')} = ${fmt(subVol, 1)} × ${fmt(liqDensity, 2)} × ${fmt(G, 1)} = ${fmt(buoyancy, 0)} N`, TK.x, TK.y + TK.h + 40);

    // Nombre del líquido si hay preset seleccionado
    let lname = getLiquidName();
    if (lname) {
        fill(THEME.liquidLbl); textSize(13); textAlign(LEFT, TOP);
        text(i18n.t('Líquido: {nombre}', { nombre: lname }), TK.x, TK.y + TK.h + 66);
    }

    pop();
}

// ═══════════════════════════════════════════════════════════════════
//  PANEL DERECHO: DIAGRAMA DE CUERPO LIBRE
// ═══════════════════════════════════════════════════════════════════
function drawFBDPanel(weight, buoyancy, netForce, normal) {
    push();
    // Fondo del panel
    stroke(THEME.fbdBorder); strokeWeight(1); fill(THEME.fbdBg);
    rect(FBD.x, FBD.y, FBD.w, FBD.h, 10);

    // Título
    noStroke(); fill(THEME.fbdTitle); textSize(13); textAlign(LEFT, TOP);
    text(i18n.t('DIAGRAMA DE CUERPO LIBRE'), FBD.x + 18, FBD.y + 16);

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
    text('m = ' + fmt(blockMass, 1) + ' kg', sideX, cy - 10);
    text('V = ' + fmt(blockVol, 0)   + ' L', sideX, cy + 10);

    // Empuje ↑ — origen en el centro del bloque
    if (buoyancy > 0.5) {
        let px = (buoyancy / maxF) * maxPx;
        drawFBDArrow(cx, cy, 0, -px, color(0, 200, 255),
                     'E = ' + fmt(buoyancy, 1) + ' N', true);
    }

    // Peso ↓ — origen en el centro del bloque
    let ppx = (weight / maxF) * maxPx;
    drawFBDArrow(cx, cy, 0, ppx, color(255, 90, 90),
                 'P = ' + fmt(weight, 1) + ' N', false);

    // Normal ↑ — la ejerce el fondo sobre la cara inferior: la flecha empuja
    // esa cara desde abajo, desplazada a la izquierda para no tapar el peso
    if (normal > 0.5) {
        let npx = (normal / maxF) * maxPx;
        let nx  = cx - bW / 2 + 18, nBase = cy + bH / 2;
        let nCol = color(200, 140, 255), hs = 12;
        stroke(nCol); strokeWeight(3.4); fill(nCol);
        line(nx, nBase + npx, nx, nBase);
        triangle(nx, nBase, nx - hs / 2.4, nBase + hs, nx + hs / 2.4, nBase + hs);
        noStroke(); textSize(14); textAlign(RIGHT, CENTER);
        text('N = ' + fmt(normal, 1) + ' N', nx - 10, nBase + max(npx, 24) / 2 + 6);
    }

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
        text('Fn = ' + fmt(netForce, 0) + ' N', sideX, cy + fnDir * fnPx / 2);
    }

    // Ecuación de equilibrio centrada bajo el bloque
    // Flotando en reposo, el peso y el empuje son iguales: «P = E», no «P ≈ E»,
    // que hace pensar que el empuje es algo mayor. «≈» solo mientras oscila.
    let enReposo = abs(velocityY) < 0.05;
    let eqText = enFondo ? 'P = E + N'
               : `P ${netForce > 3 ? '>' : netForce < -3 ? '<' : (enReposo ? '=' : '≈')} E`;
    let eqCol  = netForce > 3 ? color(255, 90, 90) :
                 netForce < -3 ? color(0, 210, 120) : color(255, 205, 50);
    noStroke(); fill(eqCol); textSize(30); textAlign(CENTER, BOTTOM);
    text(eqText, cx, FBD.y + FBD.h - 56);
    let estado = computeEstado();
    fill(estado.col); textSize(14); textAlign(CENTER, BOTTOM);
    textRho(estado.label, cx, FBD.y + FBD.h - 24);

    // Franja de cálculo numérico (panel derecho del FBD)
    drawFBDCalculation(weight, buoyancy, netForce, normal);

    pop();
}

function drawFBDCalculation(weight, buoyancy, netForce, normal) {
    let px = FBD.x + FBD.w * 0.58;
    let py = FBD.y + 44;
    let pw = FBD.w * 0.40;
    let ph = FBD.h - 76;

    // Fondo con borde sutil
    stroke(THEME.fbdCalcBorder); strokeWeight(1); fill(THEME.fbdCalcBg);
    rect(px, py, pw, ph, 8);

    // Título
    noStroke(); fill(THEME.fbdCalcTitle); textSize(11); textAlign(LEFT, TOP);
    text(i18n.t('PASO A PASO'), px + 16, py + 14);

    let tx = px + 16;
    let ty = py + 40;
    let ls = 21;

    // V_sub a partir del empuje: V_sub = E / (ρ × g)
    let vSub = liqDensity > 0 ? buoyancy / (liqDensity * G) : 0;

    // ── Peso ──
    fill(255, 120, 120); textSize(13); textAlign(LEFT, TOP);
    text(i18n.t('Peso:'), tx, ty); ty += ls;
    fill(THEME.fbdCalcText);
    text(`P = m·g`, tx + 6, ty); ty += ls;
    text(`  = ${fmt(blockMass, 1)} × ${fmt(G, 1)}`, tx + 6, ty); ty += ls;
    fill(255, 170, 170);
    text(`  = ${fmt(weight, 1)} N`, tx + 6, ty); ty += ls + 6;

    stroke(THEME.fbdCalcLine); strokeWeight(0.8);
    line(px + 12, ty, px + pw - 12, ty);
    ty += 12;

    // ── Empuje ──
    noStroke(); fill(0, 200, 255); textSize(13); textAlign(LEFT, TOP);
    text(i18n.t('Empuje:'), tx, ty); ty += ls;
    fill(THEME.fbdCalcText);
    textRho(i18n.t('E = Vsub·ρlíq·g'), tx + 6, ty); ty += ls;
    text(`  = ${fmt(vSub, 1)} × ${fmt(liqDensity, 2)} × ${fmt(G, 1)}`, tx + 6, ty); ty += ls;
    fill(140, 225, 255);
    text(`  = ${fmt(buoyancy, 1)} N`, tx + 6, ty); ty += ls + 6;

    stroke(THEME.fbdCalcLine); strokeWeight(0.8);
    line(px + 12, ty, px + pw - 12, ty);
    ty += 12;

    // ── Normal (solo con el bloque apoyado en el fondo) ──
    if (enFondo) {
        noStroke(); fill(200, 140, 255); textSize(13); textAlign(LEFT, TOP);
        text(i18n.t('Normal (fondo):'), tx, ty); ty += ls;
        fill(THEME.fbdCalcText);
        text(`N = P − E`, tx + 6, ty); ty += ls;
        fill(220, 185, 255);
        text(`  = ${fmt(normal, 1)} N`, tx + 6, ty); ty += ls + 6;

        stroke(THEME.fbdCalcLine); strokeWeight(0.8);
        line(px + 12, ty, px + pw - 12, ty);
        ty += 12;
    }

    // ── Fuerza neta ──
    let fnCol = netForce > 3  ? color(255, 195, 40) :
                netForce < -3 ? color(80, 255, 155)  : color(190, 190, 190);
    noStroke(); fill(fnCol); textSize(13); textAlign(LEFT, TOP);
    text(i18n.t('Fuerza neta:'), tx, ty); ty += ls;
    fill(THEME.fbdCalcText);
    text(enFondo ? `Fn = P − E − N` : `Fn = P − E`, tx + 6, ty); ty += ls;
    let fnDir = i18n.t(enFondo ? ' ⇌ en reposo en el fondo'
              : netForce > 3 ? ' ↓ se hunde' : netForce < -3 ? ' ↑ flota' : ' ⇌ equilibrio');
    fill(fnCol);
    text(`  = ${fmt(abs(netForce) < 0.05 ? 0 : netForce, 1)} N`, tx + 6, ty); ty += ls;
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
    return i18n.t(names[liquidPresets.value()] || '');
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

// Compara densidades: 1 si el bloque es más denso (se hunde), −1 si menos (flota),
// 0 si son iguales. La tolerancia (0,1 %) solo absorbe el redondeo de los
// deslizadores: con cualquier diferencia apreciable el bloque se mueve.
const EQ_TOL = 0.001;
function compararDensidades() {
    let r = (blockMass / blockVol) / liqDensity;
    if (r > 1 + EQ_TOL) return 1;
    if (r < 1 - EQ_TOL) return -1;
    return 0;
}

function computeEstado() {
    if (arqFueraSujeto()) return { label: i18n.t('SUJETO FUERA DEL LÍQUIDO'), col: color(0, 200, 255) };
    let c = compararDensidades();
    if (c > 0 && enFondo) return { label: i18n.t('↓  HUNDIDO, EN EL FONDO   (ρ bloque > ρ líquido)'), col: color(255, 80, 80) };
    if (c > 0) return { label: i18n.t('↓  HUNDIÉNDOSE   (ρ bloque > ρ líquido)'), col: color(255, 80, 80) };
    if (c < 0) return { label: i18n.t('↑  FLOTANDO   (ρ bloque < ρ líquido)'),    col: color(0, 210, 120) };
    return       { label: i18n.t('⇌  EQUILIBRIO NEUTRO   (ρ bloque = ρ líquido)'), col: color(255, 202, 50) };
}

function updateUI(blockDens, buoyancy, weight, netForce, subRatio, subVol) {
    select('#metric-densidad').html(fmt(blockDens, 2));
    select('#metric-dens-liq').html(fmt(liqDensity, 3));
    select('#metric-empuje').html(fmt(buoyancy, 0));
    select('#metric-peso').html(fmt(weight, 0));
    select('#metric-vol-sumergido').html(fmt(subVol, 1));
    select('#metric-fneta').html(Math.abs(netForce) < 0.5 ? '0' : fmt(netForce, 0));

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
        let cmpB = compararDensidades();
        barB.style.background = cmpB > 0
            ? 'linear-gradient(0deg,#993030,#ff7070)'
            : cmpB < 0
                ? 'linear-gradient(0deg,#205020,#50d050)'
                : 'linear-gradient(0deg,#806020,#ffc832)';
    }
    if (barL)  barL.style.height = pctL + '%';
    if (valB)  valB.textContent   = fmt(blockDens, 2);
    if (valL)  valL.textContent   = fmt(liqDensity, 3);

    // Estado del sistema
    let cmp = compararDensidades();
    const rhoB = `<i class="rho">ρ</i><sub>${i18n.t('bloque')}</sub>`;
    const rhoL = `<i class="rho">ρ</i><sub>${i18n.t('líquido')}</sub>`;
    let estadoEl = select('#metric-estado');
    let condEl   = select('#metric-condicion');

    if (arqFueraSujeto()) {
        estadoEl.html(i18n.t('Sujeto')); estadoEl.style('color', '#00c8ff');
        condEl.html(`${rhoB} &lt; ${rhoL}`); condEl.style('color', '#00c8ff');
    } else if (cmp > 0) {
        estadoEl.html(i18n.t(enFondo ? 'En el fondo' : 'Hundiéndose')); estadoEl.style('color', '#ff5050');
        condEl.html(`${rhoB} &gt; ${rhoL}`); condEl.style('color', '#ff5050');
    } else if (cmp < 0) {
        estadoEl.html(i18n.t('Flotando')); estadoEl.style('color', '#00d080');
        condEl.html(`${rhoB} &lt; ${rhoL}`); condEl.style('color', '#00d080');
    } else {
        estadoEl.html(i18n.t('Equilibrio Neutro')); estadoEl.style('color', '#ffc832');
        condEl.html(`${rhoB} = ${rhoL}`); condEl.style('color', '#ffc832');
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
    const isArq = materialPresets.value() === 'arquimedes';
    const ayudaMasa = document.getElementById('ayuda-masa-material');
    const arqCtrl   = document.getElementById('arq-controles');
    if (ayudaMasa) ayudaMasa.hidden = isArq;
    if (arqCtrl)   arqCtrl.hidden   = !isArq;
    if (isArq) {
        blockVol  = ARQ.vol;
        blockMass = ARQ.dens * ARQ.vol;
        reiniciarArquimedes();
        return;
    }
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
    drawingContext.rect(TK.x + 3, liqY, TK.w - 6, TK.y + TK.h - liqY);
    drawingContext.clip();

    switch(liquidKey) {
        case 'mercurio':
            randomSeed(55);
            for (let i = 0; i < 18; i++) {
                stroke(225, 230, 240, random(18, 50)); strokeWeight(random(1, 3.5));
                let sy = liqY + random(TK.y + TK.h - liqY - 10);
                line(TK.x + 10 + random(TK.w - 20), sy,
                     TK.x + 10 + random(TK.w - 20), sy + random(20, 60));
            }
            noStroke();
            for (let x = TK.x + 7; x < TK.x + TK.w - 7; x += 5) {
                fill(240, 245, 252, 50);
                ellipse(x, liqY + 5 + sin(frameCount * 0.04 + x * 0.09) * 2, 3, 3);
            }
            break;

        case 'aceite':
            randomSeed(77); noStroke();
            for (let i = 0; i < 10; i++) {
                fill(185, 168, 35, random(10, 22));
                let sy = liqY + random(20, 50);
                rect(TK.x + 10 + random(TK.w - 20), sy, random(7, 18), random(35, 100), 3);
            }
            break;

        case 'glicerina':
            randomSeed(33); noStroke();
            for (let i = 0; i < 12; i++) {
                fill(210, 158, 45, random(12, 28));
                let sy = liqY + random(15, 40);
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
                rect(TK.x + 3, liqY + 5 + i * 3 + sin(frameCount * 0.025 + i * 0.9) * 2,
                     TK.w - 6, 4);
            }
            break;

        case 'alcohol':
            randomSeed(44); noStroke();
            for (let i = 0; i < 20; i++) {
                fill(180, 210, 240, random(8, 18));
                let br = random(2, 6);
                ellipse(TK.x + 10 + random(TK.w - 20),
                        liqY + random(TK.y + TK.h - liqY - 10), br, br);
            }
            break;
    }

    drawingContext.restore();
    pop();
}

// ═══════════════════════════════════════════════════════════════════
//  HUEVO DE PASCUA: ARQUÍMEDES EN LA BAÑERA
// ═══════════════════════════════════════════════════════════════════
function esArquimedes() {
    return currentMode === 'materials' && materialPresets && materialPresets.value() === 'arquimedes';
}

// Sujeto en el aire (fuera del líquido): las métricas no deben decir «se hunde»
function arqFueraSujeto() {
    return esArquimedes() && arq.estado !== 'libre' && arq.subH <= 0;
}

function reiniciarArquimedes() {
    arq.estado = 'sujeto';
    arq.deficit = 0;
    arq.derramado = 0;
    arq.eurekaDesde = -1;
    arq.vertiendo = 0;
    arq.rellenando = false;
    arq.gotas = [];
    arq.subH = 0;
    blockY = ARQ_TOP_Y;
    velocityY = 0;
    actualizarBotonesArq();
}

// Botón del panel (y toque sin arrastrar): sumergirlo si está fuera, sacarlo si está dentro
function alternarArquimedes() {
    if (arq.estado === 'libre') {
        arq.estado = 'subiendo';
    } else {
        arq.estado = 'libre';
        arq.rellenando = false;
    }
    actualizarBotonesArq();
}

function actualizarBotonesArq() {
    const sum = document.getElementById('arq-sumergir');
    const rel = document.getElementById('arq-rellenar');
    if (sum) sum.textContent = i18n.t(arq.estado === 'libre' ? '↑ Sacar a Arquímedes' : '↓ Sumergir a Arquímedes');
    // Solo se rellena con Arquímedes fuera: dentro, el líquido rebosaría otra vez
    if (rel) rel.disabled = !(arq.deficit > 1 && arq.subH <= 0 && !arq.rellenando);
}

function setupArquimedes(cv) {
    const sum = document.getElementById('arq-sumergir');
    const rel = document.getElementById('arq-rellenar');
    if (sum) sum.addEventListener('click', alternarArquimedes);
    if (rel) rel.addEventListener('click', () => { arq.rellenando = true; actualizarBotonesArq(); });

    // Arrastre vertical con ratón, lápiz o dedo
    const pos = (e) => {
        const r = cv.getBoundingClientRect();
        return { x: (e.clientX - r.left) * CV_W / r.width, y: (e.clientY - r.top) * CV_H / r.height };
    };
    const tocaArq = (p) => {
        if (!esArquimedes()) return false;
        const bX = ARQ_CX - ARQ.w / 2;
        return p.x >= bX - 6 && p.x <= bX + ARQ.w + 6 && p.y >= blockY - 24 && p.y <= blockY + ARQ.h + 4;
    };
    // Sin esto, en móvil el dedo desplazaría la página en vez de mover a Arquímedes
    cv.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        if (t && tocaArq(pos(t))) e.preventDefault();
    }, { passive: false });
    cv.addEventListener('pointerdown', (e) => {
        const p = pos(e);
        if (!tocaArq(p)) return;
        arq.previo = arq.estado;
        arq.estado = 'arrastrando';
        arq.rellenando = false;
        arq.dragOff = p.y - blockY;
        arq.downY = p.y;
        arq.moved = 0;
        velocityY = 0;
        cv.setPointerCapture(e.pointerId);
        cv.style.cursor = 'grabbing';
    });
    cv.addEventListener('pointermove', (e) => {
        const p = pos(e);
        if (arq.estado === 'arrastrando') {
            arq.moved = max(arq.moved, abs(p.y - arq.downY));
            blockY = constrain(p.y - arq.dragOff, ARQ_TOP_Y, TK.y + TK.h - ARQ.h);
        } else {
            cv.style.cursor = tocaArq(p) ? 'grab' : '';
        }
    });
    const soltar = () => {
        if (arq.estado !== 'arrastrando') return;
        cv.style.cursor = '';
        if (arq.moved < 4) {
            // Toque sin arrastrar: hace lo mismo que el botón
            arq.estado = arq.previo === 'subiendo' ? 'sujeto' : arq.previo;
            alternarArquimedes();
            return;
        }
        // Soltado fuera del líquido, se queda sujeto arriba; dentro, manda la física
        arq.estado = arq.subH > 0 ? 'libre' : 'subiendo';
        velocityY = 0;
        actualizarBotonesArq();
    };
    cv.addEventListener('pointerup', soltar);
    cv.addEventListener('pointercancel', soltar);
}

// Gotas, chorro, «¡EUREKA!» y estado de los botones, una vez por fotograma
function updateArquimedes(bX, bW, bH, subH, derrame, tankW) {
    const estabaFuera = arq.subH <= 0;
    arq.subH = subH;
    const kL = ARQ.vol / (ARQ.w * ARQ.h);      // litros por px² de la vista
    if (derrame > 0.05) {
        arq.derramado += derrame * kL;
        arq.vertiendo = 18;
        // Gotas que caen por fuera de las dos paredes
        const n = min(6, ceil(derrame / 60));
        for (let i = 0; i < n; i++) {
            for (const lado of [-1, 1]) {
                arq.gotas.push({
                    x: lado < 0 ? TK.x - 1 : TK.x + TK.w + 1,
                    y: BRIM + random(-2, 2),
                    vx: lado * random(0.4, 1.8), vy: random(-1.2, 0.4),
                    r: random(2.5, 5), fuera: true,
                });
            }
        }
        // Salpicaduras junto a Arquímedes
        if (derrame > 40 && arq.gotas.length < 260) {
            for (let i = 0; i < 3; i++) {
                const lado = random() < 0.5 ? -1 : 1;
                arq.gotas.push({
                    x: lado < 0 ? bX - random(2, 10) : bX + bW + random(2, 10),
                    y: BRIM, vx: lado * random(0.5, 2.2), vy: random(-5, -2.5),
                    r: random(2, 4), fuera: false,
                });
            }
        }
        if (arq.eurekaDesde < 0) {
            arq.eurekaDesde = frameCount;
            const aviso = document.getElementById('arq-aviso');
            if (aviso) aviso.textContent = i18n.t('¡EUREKA! El líquido se desborda.');
        }
    }
    if (arq.vertiendo > 0) arq.vertiendo--;
    // Fuera del líquido se le pasa la emoción
    if (subH <= 0) arq.eurekaDesde = -1;
    if (arq.rellenando && arq.deficit <= 0) arq.rellenando = false;

    const suelo = TK.y + TK.h;
    arq.gotas = arq.gotas.filter(g => {
        g.vy += 0.32; g.x += g.vx; g.y += g.vy;
        if (g.fuera) {
            // Pegadas a la pared: al llegar a ella dejan de alejarse
            if (g.x < TK.x - 14) g.vx = 0.15;
            if (g.x > TK.x + TK.w + 14) g.vx = -0.15;
            return g.y < suelo;
        }
        return g.y < liqY + 2 || g.vy < 0;
    });
    if (estabaFuera !== (subH <= 0) || frameCount % 10 === 0) actualizarBotonesArq();
}

// Contorno del color del fondo para que el texto se lea encima del líquido
function contornoTexto() {
    const bg = color(THEME.canvasBg);
    stroke(red(bg), green(bg), blue(bg), 190); strokeWeight(3);
}

function drawArquimedesEscena(bX, bW, bH, subH, blockDens) {
    const eureka = arq.eurekaDesde >= 0;
    const lc = liquidColor(liqDensity);
    const tinte = color(red(lc) * 0.55, green(lc) * 0.55, blue(lc) * 0.55);
    const ctx = drawingContext;

    // Parte fuera del líquido, con sus colores
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, CV_W, liqY); ctx.clip();
    drawArquimedesFigura(bX, blockY, eureka, null);
    ctx.restore();
    // Parte sumergida, teñida del color del líquido
    if (subH > 0) {
        ctx.save();
        ctx.beginPath(); ctx.rect(0, liqY, CV_W, CV_H - liqY); ctx.clip();
        drawArquimedesFigura(bX, blockY, eureka, tinte);
        ctx.restore();
        // Línea de flotación
        if (subH < bH - 1) {
            push();
            stroke(red(lc), green(lc), blue(lc), 230); strokeWeight(2.2);
            line(bX - 6, liqY, bX + bW + 6, liqY);
            pop();
        }
    }

    push();
    // Densidad a la derecha: encima de la cabeza va el bocadillo
    noStroke();
    let cmp  = compararDensidades();
    fill(cmp > 0 ? color(255, 90, 90) : cmp < 0 ? color(0, 215, 120) : color(255, 205, 50));
    textSize(14); textAlign(LEFT, CENTER);
    contornoTexto();
    textRho(`ρ = ${fmt(blockDens, 2)} kg/L`, bX + bW + 14, blockY + bH * 0.62);
    noStroke();
    if (arq.estado === 'sujeto') {
        fill(THEME.formulaE); textSize(13); textAlign(CENTER, TOP);
        contornoTexto();
        text(i18n.t('↓ arrástralo al agua'), bX + bW / 2, BRIM + 14);
    }
    pop();

    if (eureka) drawEureka(bX + bW / 2, blockY + 30);
}

// Arquímedes, ilustración sencilla: calvo, barba blanca, corona de laurel y túnica.
// Coordenadas locales en un rectángulo de ARQ.w × ARQ.h; con «tinte» se dibuja
// mezclado con el color del líquido (la parte que está debajo de la superficie).
function drawArquimedesFigura(x0, y0, eureka, tinte) {
    const c = (r, g, b) => {
        const k = color(r, g, b);
        return tinte ? lerpColor(k, tinte, 0.38) : k;
    };
    const linea = c(45, 32, 26);
    const piel = c(232, 186, 146), pielSombra = c(205, 152, 112);
    const tela = c(243, 236, 218), telaSombra = c(214, 202, 178);
    const franja = c(196, 96, 48);
    const barba = c(238, 238, 236);
    const laurel = c(86, 150, 70);
    push();
    translate(x0, y0);
    strokeJoin(ROUND);

    // Brazos (detrás del cuerpo): en alto con el «¡EUREKA!», si no, a los lados
    stroke(linea); strokeWeight(11.5);
    const mano = (x, y) => { push(); stroke(linea); strokeWeight(1.5); fill(piel); circle(x, y, 13); pop(); };
    if (eureka) {
        const s = sin(frameCount * 0.25) * 3;
        line(26, 58, 8, 14 + s); line(70, 58, 88, 14 - s);
        stroke(piel); strokeWeight(8.5);
        line(26, 58, 8, 14 + s); line(70, 58, 88, 14 - s);
        mano(7, 11 + s); mano(89, 11 - s);
    } else {
        line(25, 58, 14, 88); line(71, 58, 82, 88);
        stroke(piel); strokeWeight(8.5);
        line(25, 58, 14, 88); line(71, 58, 82, 88);
        mano(13, 91); mano(83, 91);
    }

    // Piernas y sandalias
    stroke(linea); strokeWeight(1.5); fill(piel);
    rect(33, 96, 10, 11, 2); rect(53, 96, 10, 11, 2);
    fill(c(120, 72, 38));
    rect(29, 105, 17, 6, 3); rect(50, 105, 17, 6, 3);

    // Túnica (quitón) con franja en el bajo y pliegue cruzado
    stroke(linea); strokeWeight(1.6); fill(tela);
    beginShape();
    vertex(28, 50); vertex(68, 50);
    vertex(76, 99); vertex(20, 99);
    endShape(CLOSE);
    noStroke(); fill(franja);
    quad(21, 92, 75, 92, 76, 99, 20, 99);
    stroke(telaSombra); strokeWeight(2); noFill();
    line(30, 54, 62, 90); line(42, 66, 38, 92); line(56, 70, 60, 91);
    // Manto sobre el hombro izquierdo
    stroke(linea); strokeWeight(1.4); fill(telaSombra);
    beginShape();
    vertex(28, 50); vertex(45, 50); vertex(70, 82); vertex(62, 86);
    endShape(CLOSE);

    // Cabeza
    stroke(linea); strokeWeight(1.6); fill(piel);
    ellipse(48, 28, 40, 42);
    // Orejas
    ellipse(28, 30, 8, 11); ellipse(68, 30, 8, 11);
    // Barba y bigote (rizos)
    noStroke(); fill(barba);
    const rizos = [[34, 40, 13], [41, 47, 14], [48, 50, 15], [55, 47, 14], [62, 40, 13],
                   [38, 54, 11], [48, 57, 12], [58, 54, 11], [48, 62, 9]];
    for (const [rx, ry, rd] of rizos) circle(rx, ry, rd);
    stroke(c(170, 170, 168)); strokeWeight(1); noFill();
    for (const [rx, ry, rd] of rizos) arc(rx, ry, rd * 0.6, rd * 0.6, 0.3, PI - 0.3);
    // Pelo blanco a los lados
    noStroke(); fill(barba);
    ellipse(30, 22, 9, 14); ellipse(66, 22, 9, 14);
    // Ojos y cejas
    fill(linea);
    if (eureka) { circle(41, 26, 5.5); circle(55, 26, 5.5); }
    else        { ellipse(41, 27, 4, 4.5); ellipse(55, 27, 4, 4.5); }
    stroke(barba); strokeWeight(3);
    line(36, eureka ? 18 : 21, 45, eureka ? 17 : 21); line(51, eureka ? 17 : 21, 60, eureka ? 18 : 21);
    // Nariz
    stroke(pielSombra); strokeWeight(1.6); noFill();
    arc(48, 32, 7, 6, -0.2, PI * 0.8);
    // Boca: abierta de par en par al gritar
    if (eureka) { stroke(linea); strokeWeight(1.2); fill(c(120, 40, 40)); ellipse(48, 41, 9, 9); }
    else        { stroke(linea); strokeWeight(1.4); noFill(); arc(48, 39, 9, 5, 0.2, PI - 0.2); }
    // Corona de laurel
    stroke(c(50, 100, 40)); strokeWeight(1); fill(laurel);
    for (let i = 0; i < 6; i++) {
        const a = map(i, 0, 5, PI * 1.12, PI * 1.88);
        for (const lado of [-1, 1]) {
            push();
            translate(48 + cos(a) * 21, 27 + sin(a) * 20);
            rotate(a + HALF_PI + lado * 0.55);
            ellipse(0, -4, 5, 10);
            pop();
        }
    }
    pop();
}

// Bocadillo de cómic «¡EUREKA!», con un pequeño rebote al aparecer
function drawEureka(hx, hy) {
    const t = min((frameCount - arq.eurekaDesde) / 16, 1);
    const esc = t < 1 ? 1 + 1.7 * pow(t - 1, 3) + 0.7 * pow(t - 1, 2) : 1;   // sale con rebote
    const bw = 186, bh = 70;
    // A la derecha de la cabeza y a su altura: más arriba lo taparía en el
    // móvil el botón del diagrama de cuerpo libre
    let cx = hx + 150, cy = max(bh / 2 + 96, hy - 24);
    if (showFBD) cx = min(cx, FBD.x - 16 - bw / 2);
    push();
    translate(cx, cy);
    scale(max(esc, 0.01));
    const isContrast = document.body.classList.contains('theme-contrast');
    const tinta = isContrast ? color(0) : color(25, 20, 20);
    // Cola del bocadillo hacia la cabeza
    const tx = (hx + 20 - cx) / max(esc, 0.01), ty = (hy - 10 - cy) / max(esc, 0.01);
    stroke(tinta); strokeWeight(3); fill(255, 252, 232);
    triangle(-34, 18, -6, 26, tx, ty);
    // Contorno de explosión (grito)
    beginShape();
    const puntas = 22;
    for (let i = 0; i < puntas * 2; i++) {
        const a = TWO_PI * i / (puntas * 2);
        const k = i % 2 === 0 ? 1 : 0.84 + 0.05 * sin(i * 1.7);
        vertex(cos(a) * bw / 2 * k, sin(a) * bh / 2 * k);
    }
    endShape(CLOSE);
    // Tapa la unión con la cola
    noStroke(); fill(255, 252, 232);
    ellipse(0, 0, bw * 0.78, bh * 0.66);
    // Texto
    textAlign(CENTER, CENTER);
    textFont('Impact, "Arial Black", "Helvetica Neue", sans-serif');
    textStyle(BOLD);
    textSize(30);
    stroke(tinta); strokeWeight(5); fill(isContrast ? color(255, 220, 0) : color(255, 196, 40));
    text('¡EUREKA!', 0, 1);
    pop();
    textFont('monospace');
    textStyle(NORMAL);
}

// Lo que pasa fuera del depósito: chorro por el borde, gotas, charco y
// cuánto falta para volver a estar lleno
function drawArquimedesNotas() {
    const lc = liquidColor(liqDensity);
    const suelo = TK.y + TK.h;
    push();
    // Charco en el suelo: crece con lo derramado
    if (arq.derramado > 0.2) {
        const ext = min(36, 6 + sqrt(arq.derramado) * 4);
        noStroke(); fill(red(lc), green(lc), blue(lc), 150);
        rect(TK.x - ext, suelo - 3, TK.w + 2 * ext, 5, 3);
    }
    // Chorro por encima de los dos bordes
    if (arq.vertiendo > 0) {
        const a = map(arq.vertiendo, 0, 18, 0, 200);
        stroke(red(lc), green(lc), blue(lc), a); strokeWeight(4); noFill();
        for (const lado of [-1, 1]) {
            const x = lado < 0 ? TK.x : TK.x + TK.w;
            bezier(x - lado * 4, BRIM, x + lado * 6, BRIM - 3, x + lado * 9, BRIM + 10, x + lado * 8, BRIM + 34);
        }
    }
    // Gotas
    noStroke(); fill(red(lc), green(lc), blue(lc), 210);
    for (const g of arq.gotas) ellipse(g.x, g.y, g.r, g.r * 1.3);

    // Nivel inicial y litros derramados, si ya falta líquido
    if (arq.deficit > 1 && liqY > BRIM + 1.5) {
        drawingContext.setLineDash([5, 5]);
        stroke(THEME.formulaE); strokeWeight(1.2);
        line(TK.x + 4, BRIM, TK.x + TK.w - 4, BRIM);
        drawingContext.setLineDash([]);
        noStroke(); fill(THEME.formulaE); textSize(12); textAlign(RIGHT, BOTTOM);
        text(i18n.t('nivel inicial'), TK.x + TK.w - 8, BRIM - 3);
    }
    // Lo que falta para el borde es lo que se derramó desde el último llenado
    const faltan = arq.deficit * ARQ.vol / (ARQ.w * ARQ.h);
    if (faltan > 0.05) {
        noStroke(); fill(THEME.formulaE); textSize(13); textAlign(LEFT, TOP);
        text(i18n.t('Líquido derramado: {v} L', { v: fmt(faltan, 1) }), TK.x, TK.y + TK.h + 88);
    }
    pop();
}
