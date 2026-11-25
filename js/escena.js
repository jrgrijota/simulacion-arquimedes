// ═══════════════════════════════════════════════════════════════════
//  ESCENA DE «PRINCIPIO DE ARQUÍMEDES»
//
//  Una sola escena (retícula A de la guía de diseño v2):
//   · columna 1: el depósito de vidrio con el líquido y el bloque (o
//     Arquímedes) y, debajo, los mandos HTML;
//   · columna 2: el papel con las fuerzas a escala y el líquido apartado,
//     o «¿De dónde sale el empuje?» (presiones);
//   · columna 3: el panel de estado con las cuentas;
//   · abajo: la regla de densidades en papel.
//  Con el interruptor «Fuerzas» apagado (2.º y 3.º de ESO) desaparecen el
//  papel y las flechas, el depósito crece y el panel habla de densidades y
//  de litros apartados, sin newtons.
//  Los dibujos están en js/dibujo.js, en las coordenadas del boceto
//  aprobado (/capturas/escena-arquimedes/boceto.html); los retos y el
//  álbum en js/retos.js.
// ═══════════════════════════════════════════════════════════════════

let CV_W = 1330, CV_H = 680;
let ESC_MOVIL = null, ESC_SINF = null;
let TARJETAS, TQ, ROTULO, MANDOS, PAPEL, PANEL, REGLA, SELLO_POS, BOCA, ACCIONES;

// Colores propios de la escena en cada tema
const TEMA_PROPIO = {
    pizarra:   { foco: 1, paperDim: '#3d5568', franjaF: '#bfeedd', franjaH: '#f6dcc2', tintaF: '#1d6b4f', tintaH: '#8a4a17', tintaAgua: '#1f6fae', tintaMercurio: '#4f5a66', aviso: '#b3261e', cortePres: '#9fd0f2',
                 flota: '#9fe7c4', hunde: '#ffb38a', neutro: '#d7e3ee', mano: '#9fdcff', cam: '#ffd84a',
                 pP: '#c8372d', pE: '#1f6fae', pN: '#6b4fbf', pF: '#b0287f', pLado: '#5f86a6',
                 fP: '#ff8f7f', fE: '#8cc8ff', fN: '#c7b1ff', fF: '#ff9ad8' },
    dia:       { foco: 0.35, paperDim: '#3d5568', franjaF: '#bfeedd', franjaH: '#f6dcc2', tintaF: '#1d6b4f', tintaH: '#8a4a17', tintaAgua: '#1f6fae', tintaMercurio: '#4f5a66', aviso: '#b3261e', cortePres: '#9fd0f2',
                 flota: '#9fe7c4', hunde: '#ffb38a', neutro: '#d7e3ee', mano: '#9fdcff', cam: '#ffd84a',
                 pP: '#c8372d', pE: '#1f6fae', pN: '#6b4fbf', pF: '#b0287f', pLado: '#5f86a6',
                 fP: '#c8372d', fE: '#1f6fae', fN: '#6b4fbf', fF: '#b0287f' },
    marca:     { foco: 0, paperDim: '#475569', franjaF: '#ccefe0', franjaH: '#f8e0c8', tintaF: '#0f766e', tintaH: '#c2410c', tintaAgua: '#0369a1', tintaMercurio: '#475569', aviso: '#b91c1c', cortePres: '#bae0f7',
                 flota: '#99e2c0', hunde: '#fdba8c', neutro: '#e2e8f0', mano: '#bae6fd', cam: '#fde68a', ink: '#1e293b',
                 pP: '#dc2626', pE: '#0369a1', pN: '#6d28d9', pF: '#be185d', pLado: '#64748b',
                 fP: '#dc2626', fE: '#0369a1', fN: '#6d28d9', fF: '#be185d' },
    contraste: { foco: 0, paperDim: '#cccccc', franjaF: '#00402a', franjaH: '#4d2800', tintaF: '#00ff88', tintaH: '#ffaa00', tintaAgua: '#33aaff', tintaMercurio: '#ffffff', aviso: '#ff5533', cortePres: '#003355',
                 flota: '#00ff88', hunde: '#ffaa00', neutro: '#ffffff', mano: '#00ffff', cam: '#ffff00', ink: '#000000',
                 pP: '#ff5533', pE: '#33aaff', pN: '#cc99ff', pF: '#ff66cc', pLado: '#aaaaaa',
                 fP: '#ff7766', fE: '#66bbff', fN: '#cc99ff', fF: '#ff88dd' },
};

// ── Estado ───────────────────────────────────────────────────────
const S = {
    modo: 'libre', m: 50, V: 100, rLibre: 1.00,
    mat: 'madera', liq: 'aguadulce',
    fuerzas: true, pestana: 'fuerzas',
};
const fmt = (x, d) => i18n.num(x, d);
const miles = (x) => { const s = String(Math.round(Math.abs(x))); return s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s; };
const fmtL = (v) => v >= 9.95 ? fmt(Math.round(v), 0) : fmt(v, 1);
const ARQ_DIM = { w: 3.0, h: 3.25, vol: 70, dens: 0.98, sc: 0.66 };   // caja de flotación (dm): de los pies a la barbilla
ARQ_DIM.d = ARQ_DIM.vol / (ARQ_DIM.w * ARQ_DIM.h);

const esArq = () => S.modo === 'materiales' && S.mat === 'arquimedes';
// El cuerpo que está en el depósito
function cuerpo() {
    if (S.modo === 'libre') return { k: 'libre', m: S.m, V: S.V, r: S.m / S.V };
    if (esArq()) return { k: 'arquimedes', m: ARQ_DIM.vol * ARQ_DIM.dens, V: ARQ_DIM.vol, r: ARQ_DIM.dens, arq: true };
    const r = MATS[S.mat].r;
    return { k: S.mat, m: r * 100, V: 100, r };
}
const rLiq = () => S.modo === 'libre' ? S.rLibre : LIQS[S.liq].r;
const liqDib = () => S.modo === 'libre' ? 'aguadulce' : S.liq;
const nomLiq = () => S.modo === 'libre' ? i18n.t('líquido') : i18n.t(LIQS[S.liq].n).toLowerCase();
// con artículo («la gasolina», «el agua dulce»): cada idioma lo traduce entero
const elLiq = () => i18n.t(S.modo === 'libre' ? 'el líquido' : LIQS[S.liq].el);
// Base, altura y sección del cuerpo (dm)
function dimensiones() {
    if (esArq()) return { h: ARQ_DIM.h, A: ARQ_DIM.w * ARQ_DIM.d };
    const a = Math.cbrt(cuerpo().V);
    return { h: a, A: a * a };
}
const EQ_TOL = 0.001;
const resultado = (rb, rl) => Math.abs(rb - rl) <= EQ_TOL ? 'neutro' : rb < rl ? 'flota' : 'hunde';

// ── Física ───────────────────────────────────────────────────────
// z = altura de la base del cuerpo sobre el suelo del depósito (dm); v hacia arriba (dm/s).
// El nivel sube con lo sumergido: nivel = nivel0 + A · sub / ÁREA.
const G_EF = 25;              // aceleración de la escena (dm/s²): cámara lenta para que se vea
const B = {
    z: 6, v: 0, estado: 'libre',      // libre | mano | fuera | salto
    tSoltar: 0, quieto: null, res: null, dentro: false,
    bajado: 0, zAnt: null,            // reto 5: cuánto ha bajado ya cubierto con la presión a la vista
    salto: null,                      // { t0, dur, de, a, entra }
};
const ARQ = { deficit: 0, chorro: 0, charco: 0, gotas: [], rellenando: false, eurekaT0: -1e9, rebosado: 0 };
let ONDAS = [], BURBUJAS = [];
let selloInfo = null, momento = null, eurekaVisto = false;

function nivelBase() { return esArq() ? TH - ARQ.deficit / AREA : L0; }
// Sumergido y nivel para la altura z
function hidro(z) {
    const { h, A } = dimensiones(), n0 = nivelBase();
    if (B.estado === 'fuera' || B.estado === 'salto') return { sub: 0, nivel: n0, rebosa: 0 };
    let sub = n0 <= z ? 0 : Math.min(h, (n0 - z) / (1 - A / AREA));
    let nivel = n0 + A * sub / AREA, rebosa = 0;
    if (esArq() && nivel > TH) {
        nivel = TH; sub = Math.max(0, Math.min(h, TH - z));
        rebosa = Math.max(0, A * sub - ARQ.deficit);
    }
    return { sub, nivel, rebosa };
}
function fuerzas() {
    const c = cuerpo(), hd = hidro(B.z), { h, A } = dimensiones();
    const Vsub = A * hd.sub, E = Vsub * rLiq() * G, P = c.m * G;
    let N = 0, F = 0;
    if (B.estado === 'mano') F = E - P;
    else if (B.estado === 'fuera') N = P;
    else if (B.z <= 0.001 && P > E && Math.abs(B.v) < 0.3) N = P - E;
    return { E, P, N, F, Vsub, sub: hd.sub, frac: hd.sub / h, nivel: hd.nivel, rebosa: hd.rebosa };
}
function zInicial() { return TH - dimensiones().h - 0.15; }
const zMax = () => TH - dimensiones().h;

// Suelta el cuerpo otra vez desde arriba del líquido
function soltar() {
    ONDAS = []; BURBUJAS = [];
    selloInfo = null; momento = null;
    B.v = 0; B.quieto = null; B.res = null; B.bajado = 0; B.zAnt = null;
    B.tSoltar = millis();
    if (esArq()) {
        Object.assign(ARQ, { deficit: 0, chorro: 0, charco: 0, gotas: [], rellenando: false, eurekaT0: -1e9, rebosado: 0 });
        B.estado = 'fuera'; B.z = 0;
        setTimeout(() => { if (esArq() && B.estado === 'fuera') meterArq(); }, MOV_REDUCIDO ? 0 : 450);
    } else {
        B.estado = 'libre'; B.z = zInicial();
    }
    B.dentro = hidro(B.z).sub > 0;
    mostrarAcciones();
}
// Arquímedes: salto del borde de la mesa al agua y vuelta
function meterArq() {
    if (!esArq() || B.estado !== 'fuera') return;
    B.salto = { t0: millis(), dur: MOV_REDUCIDO ? 1 : 900, entra: true };
    B.estado = 'salto'; selloInfo = null;
    mostrarAcciones();
}
function sacarArq() {
    if (!esArq() || B.estado === 'fuera' || B.estado === 'salto') return;
    B.salto = { t0: millis(), dur: MOV_REDUCIDO ? 1 : 900, entra: false, z0: B.z };
    B.estado = 'salto'; selloInfo = null; momento = null;
    mostrarAcciones();
}
function llenarArq() { if (esArq() && B.estado === 'fuera' && ARQ.deficit > 0.5) { ARQ.rellenando = true; mostrarAcciones(); } }

function paso(dt) {
    const t = millis();
    // Arquímedes: salto con una parábola
    if (B.estado === 'salto') {
        const s = B.salto, u = Math.min(1, (t - s.t0) / s.dur);
        s.u = u;
        if (u >= 1) {
            if (s.entra) { B.estado = 'libre'; B.z = TH - 0.2; B.v = -2; B.tSoltar = t; B.quieto = null; B.res = null; }
            else { B.estado = 'fuera'; B.z = 0; B.v = 0; }
            mostrarAcciones();
        }
    }
    if (ARQ.rellenando) {
        ARQ.deficit = Math.max(0, ARQ.deficit - dt * 60);
        if (ARQ.deficit <= 0) { ARQ.rellenando = false; mostrarAcciones(); }
    }
    if (B.estado === 'libre') {
        const pasos = 6, h = dt / pasos, c = cuerpo(), dim = dimensiones(), P = c.m * G;
        for (let p = 0; p < pasos; p++) {
            const hd = hidro(B.z), f = hd.sub / dim.h, E = dim.A * hd.sub * rLiq() * G;
            const roce = f > 0 ? (2.2 + 3.5 * f) * B.v + 0.6 * f * B.v * Math.abs(B.v) : 0;
            const a = G_EF * (E - P) / P - roce;
            B.v += a * h; B.z += B.v * h;
            if (B.z < 0) { B.z = 0; B.v = B.v < -1.5 ? -B.v * 0.12 : 0; }
            if (B.z > zMax() + 0.4) { B.z = zMax() + 0.4; B.v = Math.min(0, B.v); }
            if (esArq()) {
                const r = hidro(B.z).rebosa;
                if (r > 0.01) arqRebosa(r);
            }
        }
    } else if (B.estado === 'mano' && esArq()) {
        const r = hidro(B.z).rebosa;
        if (r > 0.01) arqRebosa(r);
    }
    // Ondas al entrar y burbujas mientras baja ya cubierto
    const fz = fuerzas();
    if (!B.dentro && fz.sub > 0) {
        B.dentro = true;
        if (Math.abs(B.v) > 1.5 && !MOV_REDUCIDO) ONDAS.push({ edad: 0 });
    }
    if (fz.sub <= 0) B.dentro = false;
    if (!MOV_REDUCIDO && !esArq() && fz.frac >= 1 && B.v < -0.8 && Math.random() < dt * 14) {
        const g = geoCuerpo();
        BURBUJAS.push({ x: g.x + Math.random() * g.s + g.s * PDX * 0.3, y: g.yb - g.s - 2, r: 1.6 + Math.random() * 2.2, vy: -(60 + Math.random() * 40), fase: Math.random() * 6, op: 1 });
    }
    ONDAS.forEach(o => o.edad += dt);
    ONDAS = ONDAS.filter(o => o.edad < 1.4);
    const yl = geoCuerpo().yl;
    BURBUJAS.forEach(b => { b.y += b.vy * dt; b.fase += dt * 7; b.x += Math.sin(b.fase) * 0.3; });
    BURBUJAS = BURBUJAS.filter(b => b.y > yl + 2);
    // Arquímedes: el chorro se apaga, el charco crece y las gotas caen
    ARQ.chorro = Math.max(0, ARQ.chorro - dt * 1.2);
    ARQ.gotas.forEach(g => { g.vy += 380 * dt; g.x += g.vx * dt; g.y += g.vy * dt; });
    const yF = TH * ESC;
    ARQ.gotas = ARQ.gotas.filter(g => g.y < yF + 18);
    // Reto 5: cuánto baja ya cubierto mientras se ven las presiones
    if (B.estado === 'libre' && fz.frac >= 1 && S.fuerzas && S.pestana === 'presion' && !esArq()) {
        if (B.zAnt != null && B.z < B.zAnt) B.bajado += B.zAnt - B.z;
        B.zAnt = B.z;
        if (B.bajado >= 2) retosHecho('profundo');
    } else B.zAnt = null;
    // ¿Ya está quieto?
    if (B.estado === 'libre') {
        const tranquilo = Math.abs(B.v) < 0.08 && t - B.tSoltar > 600;
        if (!tranquilo) B.quieto = null;
        else if (B.quieto == null) B.quieto = t;
        if (B.quieto != null && t - B.quieto > 350) cuerpoQuieto(fz);
    }
}
function arqRebosa(litros) {
    ARQ.deficit += litros; ARQ.rebosado += litros;
    ARQ.chorro = 1; ARQ.charco = Math.min(1, ARQ.charco + litros / 40);
    if (!MOV_REDUCIDO && ARQ.gotas.length < 60) {
        const { x1 } = geomDeposito(0, 0);
        for (let i = 0; i < 2; i++) ARQ.gotas.push({ x: (Math.random() < 0.5 ? -6 : x1 + 10) + Math.random() * 30, y: -6 - Math.random() * 10, vx: (Math.random() - 0.5) * 60, vy: -80 - Math.random() * 60, r: 2 + Math.random() * 2.2 });
    }
    if (millis() - ARQ.eurekaT0 > 4000) ARQ.eurekaT0 = millis();
    if (!eurekaVisto) { eurekaVisto = true; retosSecreto(); }
}
// El cuerpo ya no se mueve: sello (una vez por caída, o si cambia lo que hace)
function cuerpoQuieto(fz) {
    const c = cuerpo(), rl = rLiq();
    const res = c.arq ? 'flota' : resultado(c.r, rl);
    if (B.res === res) return;
    B.res = res;
    const nl = nomLiq();
    let t, sub;
    if (c.arq) {
        if (ARQ.rebosado < 0.5) return;
        t = i18n.t('¡EUREKA!'); sub = i18n.t('rebosan {v} L de agua', { v: fmtL(ARQ.rebosado) });
    } else if (!S.fuerzas) {
        t = { flota: '¡FLOTA!', hunde: '¡SE HUNDE!', neutro: '¡NI FLOTA NI SE HUNDE!' }[res];
        sub = { flota: 'menos denso que {el}', hunde: 'más denso que {el}', neutro: 'igual de denso que {el}' }[res];
        t = i18n.t(t); sub = i18n.t(sub, { el: elLiq() });
    } else {
        t = i18n.t({ flota: '¡FLOTA!', hunde: '¡SE HUNDE!', neutro: '¡NI FLOTA NI SE HUNDE!' }[res]);
        sub = res === 'flota' ? i18n.t('E = P: aparta su peso en {l}', { l: nl })
            : res === 'hunde' ? i18n.t('P > E: {p} N frente a {e} N', { p: miles(fz.P), e: miles(fz.E) })
            : i18n.t('E = P en cualquier punto');
    }
    selloInfo = { t, sub, t0: millis() };
    momento = { t0: millis(), res };
    retosQuieto({ k: c.k, arq: !!c.arq, res, frac: fz.frac, liq: S.modo === 'libre' ? null : S.liq });
}
// Intensidad del momento clave (0–1): aparece en 0,3 s y se va a los 6 s
function intensidadMomento() {
    if (!momento) return 0;
    const e = millis() - momento.t0;
    if (e > 6000) return 0;
    return Math.min(1, e / 300, (6000 - e) / 500);
}

// ── Composición ──────────────────────────────────────────────────
function calcularEscena() {
    const movil = esMovil(), sinF = !S.fuerzas;
    const cambia = movil !== ESC_MOVIL || sinF !== ESC_SINF;
    ESC_MOVIL = movil; ESC_SINF = sinF;
    const libre = S.modo === 'libre';
    if (!movil) {
        CV_W = 1330; CV_H = 680;
        TARJETAS = [{ x: 0, y: 0, w: 1330, h: 540 }];
        PANEL = { x: 902, y: 30, w: 400, h: 480, compacto: false };
        REGLA = { x: 0, y: 552, w: 1330, h: 128 };
        SELLO_POS = { x: 1143, y: 462 };
        if (!sinF) {
            TQ = { tx: 106, ty: 88, s: 1 };
            ROTULO = { x: 222, y: 30 };
            MANDOS = { x: 42, y: libre ? 350 : 358, w: 360, cols: 3 };
            PAPEL = { x: 462, y: 30, w: 400, h: 480 };
        } else {
            TQ = { tx: 176, ty: 118, s: 1.3 };
            ROTULO = { x: 176 + 132 * 1.3, y: 44 };
            MANDOS = { x: 646, y: libre ? 120 : 64, w: 216, cols: 1 };
            PAPEL = null;
        }
        BOCA = { x: TQ.tx - 88 * TQ.s, y: TQ.ty - 58 * TQ.s };
        ACCIONES = null;
    } else {
        CV_W = 370;
        TARJETAS = [{ x: 0, y: 0, w: 370, h: 604 }];
        TQ = { tx: 88, ty: 84, s: 0.82 };
        ROTULO = { x: 185, y: 26 };
        ACCIONES = { x: 10, y: 310, w: 350 };
        MANDOS = { x: 16, y: 368, w: 338, cols: 2 };
        PANEL = { x: 0, y: 620, w: 370, h: 436, compacto: true };
        SELLO_POS = { x: 185, y: 1008 };
        BOCA = { x: 12, y: 46 };
        if (!sinF) { PAPEL = { x: 0, y: 1072, w: 370, h: 470 }; REGLA = { x: 0, y: 1558, w: 370, h: 160 }; }
        else { PAPEL = null; REGLA = { x: 0, y: 1072, w: 370, h: 160 }; }
        CV_H = REGLA.y + REGLA.h + 6;
    }
    colocarMandos();
    return cambia;
}
function colocarMandos() {
    const mandos = document.querySelector('.mandos-arq');
    colocarSobreLienzo(mandos, MANDOS, CV_W, CV_H);
    mandos.classList.toggle('una-col', MANDOS.cols === 1);
    mandos.classList.toggle('dos-col', MANDOS.cols === 2);
    const pest = $('pestanas');
    pest.hidden = !PAPEL;
    if (PAPEL) colocarSobreLienzo(pest, { x: PAPEL.x + 16, y: PAPEL.y + 14, w: PAPEL.w - 32 }, CV_W, CV_H);
    // Botones de acción: en la fila de contexto (ancho) o bajo el depósito (móvil)
    const acc = $('acciones'), escena = $('escena'), fila = document.querySelector('.barra-sus');
    if (ACCIONES) {
        if (acc.parentElement !== escena) escena.appendChild(acc);
        acc.classList.add('sobre-lienzo');
        colocarSobreLienzo(acc, ACCIONES, CV_W, CV_H);
    } else {
        if (acc.parentElement !== fila) fila.appendChild(acc);
        acc.classList.remove('sobre-lienzo');
        acc.style.left = acc.style.top = acc.style.width = '';
    }
}
function ajustarEscena(cv) { encajarEscena(cv, CV_W, CV_H, ESC_MOVIL); }
function fitCanvas() {
    const cv = document.querySelector('#canvas-container canvas');
    if (!cv) return;
    ajustarEscena(cv);
    const d = densidadAdecuada(cv);
    if (Math.abs(d - pixelDensity()) > 0.01) { pixelDensity(d); ajustarEscena(cv); }
}
let topeDensidad = 2;
function densidadAdecuada(cv) {
    const visto = cv.getBoundingClientRect().width / CV_W * displayDensity();
    return constrain(Math.ceil(visto * 4) / 4, 1, topeDensidad);
}
let fpsMarca = { t: 0, f: 0 };
function vigilarRendimiento() {
    const ahora = performance.now();
    if (!fpsMarca.t) { fpsMarca = { t: ahora, f: frameCount }; return; }
    if (ahora - fpsMarca.t < 3000) return;
    if (ahora - fpsMarca.t > 4500) { fpsMarca = { t: ahora, f: frameCount }; return; }
    const fps = (frameCount - fpsMarca.f) * 1000 / (ahora - fpsMarca.t);
    fpsMarca = { t: ahora, f: frameCount };
    if (document.hidden || fps >= 40 || pixelDensity() <= 1) return;
    topeDensidad = Math.max(1, pixelDensity() - 0.25);
    fitCanvas();
}
function rehacerComposicion() {
    calcularEscena();
    resizeCanvas(CV_W, CV_H);
    fitCanvas();
}
function windowResized() {
    if (calcularEscena()) resizeCanvas(CV_W, CV_H);
    fitCanvas();
}

// ── Geometría del cuerpo en el depósito (coordenadas locales del depósito) ──
function geoCuerpo() {
    const { w, Dp, DX, DY, yF } = geomDeposito(0, 0);
    const hd = hidro(B.z), yA = yF - hd.nivel * ESC;
    if (esArq()) {
        const sc = ARQ_DIM.sc, oy = DY * 0.3, ox = DX * 0.3;
        const axIn = w * 0.5 + ox - 50 * sc;
        const afuera = { ax: -88, ay: yF + 10 - 172 * sc };
        let ax = axIn, ay = yF + oy - B.z * ESC - 172 * sc, dentro = true;
        if (B.estado === 'fuera') { ax = afuera.ax; ay = afuera.ay; dentro = false; }
        if (B.estado === 'salto') {
            const s = B.salto, u = s.u || 0, k = s.entra ? u : 1 - u;
            const zIn = s.entra ? TH - 0.2 : s.z0;
            const ayIn = yF + oy - zIn * ESC - 172 * sc;
            ax = afuera.ax + (axIn - afuera.ax) * k;
            ay = afuera.ay + (ayIn - afuera.ay) * k - Math.sin(Math.PI * k) * 90;
            dentro = false;
        }
        return { arq: true, ax, ay, sc, dentro, yl: yA + oy, x: ax, s: 100 * sc, yb: ay + 172 * sc, oy, ox };
    }
    const s = lado(cuerpo().V), od = (Dp - s) / 2, ox = od * PDX, oy = od * PDY;
    const x = (w - s) / 2 + ox, yb = yF + oy - B.z * ESC;
    return { s, x, yb, ox, oy, yl: yA + oy };
}

// ── Panel de estado ──────────────────────────────────────────────
let rotuloTag = '', rotuloDesde = -1e9, mensajeCache = { clave: '' };
function parte(f) {
    if (f < 0.3) return 'una parte pequeña';
    if (f < 0.47) return 'menos de la mitad';
    if (f < 0.53) return 'la mitad';
    if (f < 0.75) return 'algo más de la mitad';
    return 'casi todo el bloque';
}
function nombreCuerpo(mayus) {
    const c = cuerpo();
    if (c.arq) return i18n.t('Arquímedes');
    const t = S.modo === 'libre' ? i18n.t('el bloque') : i18n.t('el bloque de {m}', { m: i18n.t(MATS[c.k].n).toLowerCase() });
    return mayus ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}
function mensaje(fz) {
    const c = cuerpo(), rl = rLiq(), nl = nomLiq(), nom = nombreCuerpo(true);
    const v = { nom, l: nl, el: elLiq(), E: miles(fz.E), P: miles(fz.P), F: miles(Math.abs(fz.F)), Vs: fmtL(fz.Vsub), V: fmtL(c.V), r: fmt(c.r, 2), rl: fmt(rl, rl >= 10 ? 2 : 3) };
    const T_ = (t) => i18n.t(t, v);
    if (c.arq) {
        if (B.estado === 'fuera') return ARQ.deficit > 0.5
            ? { tag: i18n.t('FUERA'), col: THEME.neutro, txt: i18n.t('Arquímedes ha salido del agua. Ahora faltan <strong>{d} L</strong> para llenar el depósito: los que rebosaron cuando se metió.', { d: fmtL(ARQ.deficit) }) }
            : { tag: i18n.t('FUERA'), col: THEME.neutro, txt: i18n.t('El depósito está lleno hasta el borde. Mete a Arquímedes y mira cuánta agua rebosa.') };
        if (B.estado === 'salto') return { tag: i18n.t('¡AL AGUA!'), col: THEME.neutro, txt: i18n.t('El depósito está lleno hasta el borde. Todo lo que Arquímedes meta bajo el agua tiene que salir por algún sitio…') };
        if (B.estado === 'mano') return manoMsg(fz, v);
        return { tag: i18n.t('FLOTA'), col: THEME.flota, txt: i18n.t('El depósito estaba lleno hasta el borde. Al meterse Arquímedes rebosan <strong>{d} L</strong>: justo el volumen de su cuerpo que ha quedado bajo el agua.', { d: fmtL(ARQ.rebosado) }) };
    }
    if (B.estado === 'mano') return manoMsg(fz, v);
    const res = resultado(c.r, rl), quieto = B.res != null;
    if (!S.fuerzas) {
        if (fz.sub <= 0 && !quieto) return { tag: i18n.t('CAE'), col: THEME.neutro, txt: T_('{nom} cae hacia {el}. ¿Flotará o se hundirá?') };
        if (res === 'flota') return { tag: i18n.t('FLOTA'), col: THEME.flota, txt: T_('{nom} es menos denso que {el}. Baja hasta apartar <strong>{Vs} L</strong> de {l}: tantos kilos de {l} como kilos tiene él. Ahí se queda quieto.') };
        if (res === 'hunde') return { tag: i18n.t('SE HUNDE'), col: THEME.hunde, txt: T_('{nom} es más denso que {el}. Aunque aparte <strong>{Vs} L</strong>, esos litros tienen menos masa que él: se hunde hasta el fondo.') };
        return { tag: i18n.t('NI FLOTA NI SE HUNDE'), col: THEME.neutro, txt: T_('{nom} es igual de denso que {el}. Se queda quieto donde esté, sin subir ni bajar.') };
    }
    if (fz.sub <= 0) return { tag: i18n.t('CAE'), col: THEME.neutro, txt: T_('Todavía no toca {el}: solo actúa su peso (<strong>{P} N</strong>). Por eso cae.') };
    if (!quieto) {
        if (fz.frac >= 0.999 && B.v < -0.2) return { tag: i18n.t('SE HUNDE'), col: THEME.hunde, txt: T_('{nom} baja ya cubierto. Aunque baje más, el empuje no cambia: sigue siendo <strong>{E} N</strong>, el peso de los {Vs} L de {l} que aparta.') };
        return { tag: i18n.t('ENTRANDO'), col: THEME.neutro, txt: T_('Cuanto más entra, más {l} aparta y más empuja: ahora <strong>{E} N</strong> frente a un peso de {P} N.') };
    }
    if (res === 'flota') {
        if (S.liq === 'mercurio' && S.modo === 'materiales' && c.r > 2)
            return { tag: i18n.t('FLOTA'), col: THEME.flota, txt: T_('¡{nom} flota en mercurio! Cada litro de mercurio tiene {rl} kg, más que uno de su material ({r} kg). Le basta con apartar <strong>{Vs} L</strong> para flotar.') };
        if (S.modo === 'libre') return { tag: i18n.t('FLOTA'), col: THEME.flota, txt: i18n.t('El bloque flota quieto con {p} bajo {el}. Esa parte aparta <strong>{Vs} L</strong> de {l}, que pesan {E} N: justo lo que pesa el bloque.', Object.assign({ p: i18n.t(parte(fz.frac)) }, v)) };
        return { tag: i18n.t('FLOTA'), col: THEME.flota, txt: T_('{nom} ha bajado hasta apartar <strong>{Vs} L</strong> de {l}. Esos {Vs} L pesan {E} N, lo mismo que el bloque: por eso se queda quieto.') };
    }
    if (res === 'hunde') return { tag: i18n.t('EN EL FONDO'), col: THEME.hunde, txt: T_('{nom} aparta {V} L de {l}, que solo pesan <strong>{E} N</strong>. El empuje no basta para sostener sus {P} N: el fondo pone el resto.') };
    return { tag: i18n.t('NI FLOTA NI SE HUNDE'), col: THEME.neutro, txt: T_('Cada litro del bloque tiene la misma masa que un litro de {l}. Aparta su propio peso en {l} y se queda quieto donde esté.') };
}
function manoMsg(fz, v) {
    const tag = i18n.t('LO SUJETAS'), col = THEME.mano;
    if (fz.sub <= 0) return { tag, col, txt: i18n.t('Tu mano lo sostiene fuera: sin empuje, la mano aguanta todo su peso (<strong>{P} N</strong>).', v) };
    if (Math.abs(fz.F) < 0.5) return { tag, col, txt: i18n.t('Así no hace falta fuerza: el empuje ({E} N) ya iguala al peso. Si lo sueltas, se queda donde está.', v) };
    if (fz.F > 0) return { tag, col, txt: i18n.t('Tu mano lo mantiene bajo {el}. Ahora aparta {Vs} L, que pesan {E} N: más que el bloque ({P} N). La mano empuja hacia abajo con <strong>{F} N</strong>.', v) };
    return { tag, col, txt: i18n.t('Tu mano lo sostiene. Aparta {Vs} L, que pesan {E} N, menos que su peso ({P} N): la mano pone los <strong>{F} N</strong> que faltan.', v) };
}

function drawPanelEstado(m, fz) {
    const { x, y, w, h, compacto } = PANEL, pad = 24, px = x + pad, rx = x + w - pad;
    tarjeta({ x, y, w, h }, THEME.pillBg || THEME.panelBg, 20);
    if (m.tag !== rotuloTag) { rotuloTag = m.tag; rotuloDesde = millis(); }
    fuenteJuego();
    etiquetaRotulo(m.tag, m.col, px, y + 20, compacto ? 15 : 16.5, rotuloDesde);
    T(rx, y + 42, i18n.t('{p} % sumergido', { p: fmt(fz.frac * 100, 0) }), { fs: 14, a: 'end', c: THEME.textDim, sys: true });
    const fsMsg = compacto ? 16.5 : 18.5, lead = fsMsg + 7.5;
    textSize(fsMsg);
    const clave = m.txt + '|' + fsMsg + '|' + w + '|' + textFont();
    if (clave !== mensajeCache.clave) {
        let lineas = partirRico(trozosRicos(m.txt), w - 2 * pad), fs = fsMsg;
        if (lineas.length > 4) { fs = fsMsg - 2; textSize(fs); lineas = partirRico(trozosRicos(m.txt), w - 2 * pad); }
        if (lineas.length > 4) { fs = fsMsg - 3.5; textSize(fs); lineas = partirRico(trozosRicos(m.txt), w - 2 * pad); }
        mensajeCache = { clave, lineas, fs };
    }
    textSize(mensajeCache.fs); noStroke(); fill(THEME.text);
    textoRico(mensajeCache.lineas.slice(0, 5), px, y + 68, mensajeCache.fs + 7.5);
    let dy = y + 86 + 3 * lead + 22;
    linea(`M${px} ${dy} H${rx}`, THEME.border, 1.5);
    const dim = THEME.textDim, c = cuerpo(), sm = compacto ? 12.5 : 13.5;
    const fila = (nom, val, sub, col, yy) => {
        T(px, yy, nom, { fs: 16, w: 600, c: col });
        T(rx, yy, val, { fs: 20, w: 600, a: 'end', c: col });
        if (Array.isArray(sub)) Tsub(px, yy + 21, sub, { fs: sm, c: dim, sys: true });
        else T(px, yy + 21, sub, { fs: sm, c: dim, sys: true });
    };
    if (!S.fuerzas) {
        const rl = rLiq(), res = resultado(c.r, rl), nl = nomLiq();
        const mat = c.arq ? i18n.t('Arquímedes') : S.modo === 'libre' ? i18n.t('el bloque') : i18n.t(MATS[c.k].n).toLowerCase();
        const comp = { flota: 'menos que {el} → flota', hunde: 'más que {el} → se hunde', neutro: 'igual que {el} → ni flota ni se hunde' }[res];
        fila(i18n.t('Densidad del bloque'), `${fmt(c.r, 2)} kg/L`, `${mat}: ${i18n.t(comp, { el: elLiq() })}`, c.arq ? MATS.arquimedes.c : THEME.fE, dy + 30);
        fila(i18n.t('Densidad del líquido'), `${fmt(rl, rl >= 10 ? 2 : 3)} kg/L`, i18n.t('cada litro de {l} tiene {r} kg', { l: nl, r: fmt(rl, rl >= 10 ? 2 : 3) }), THEME.fE, dy + 80);
        linea(`M${px} ${dy + 108} H${rx}`, THEME.border, 1, 1);
        const masa = fz.Vsub * rl;
        const sub = fz.sub <= 0 ? i18n.t('todavía no aparta nada')
            : Math.abs(masa - c.m) < 0.5 ? i18n.t('{a} kg de {l} = {b} kg del bloque', { a: fmt(masa, 0), b: fmt(c.m, 0), l: nl })
            : masa < c.m ? i18n.t('{a} kg de {l}, menos que los {b} kg del bloque', { a: fmt(masa, 0), b: fmt(c.m, 0), l: nl })
            : i18n.t('{a} kg de {l}, más que los {b} kg del bloque', { a: fmt(masa, 0), b: fmt(c.m, 0), l: nl });
        fila(i18n.t('Líquido apartado'), `${fmtL(fz.Vsub)} L`, sub, THEME.cam, dy + 138);
        return;
    }
    fila(i18n.t('Peso'), `${miles(fz.P)} N`, `P = m · g = ${fmt(c.m, 1)} · 9,8`.replace('9,8', fmt(9.8, 1)), THEME.fP, dy + 30);
    fila(i18n.t('Empuje'), `${miles(fz.E)} N`, [['E = V'], ['sum', 1], [' · ρ'], [i18n.t('líq'), 1], [` · g = ${fmt(fz.Vsub, 1)} · ${fmt(rLiq(), 3)} · ${fmt(9.8, 1)}`]], THEME.fE, dy + 80);
    let extra = false;
    if (fz.N > 0 && B.estado === 'fuera') { fila(i18n.t('Normal (mesa)'), `${miles(fz.N)} N`, 'N = P', THEME.fN, dy + 130); extra = true; }
    else if (fz.N > 0) { fila(i18n.t('Normal (fondo)'), `${miles(fz.N)} N`, `N = P − E = ${miles(fz.P)} − ${miles(fz.E)}`, THEME.fN, dy + 130); extra = true; }
    if (B.estado === 'mano' && Math.abs(fz.F) >= 0.5) {
        fila(i18n.t(fz.F > 0 ? 'Mano (hacia abajo)' : 'Mano (hacia arriba)'), `${miles(fz.F)} N`, fz.F > 0 ? `F = E − P = ${miles(fz.E)} − ${miles(fz.P)}` : `F = P − E = ${miles(fz.P)} − ${miles(fz.E)}`, THEME.fF, dy + 130);
        extra = true;
    }
    const fy2 = dy + (extra ? 188 : 138);
    forma(`M${px} ${fy2 - 30} H${rx}`, { s: THEME.border, sw: 1, dash: [4, 4] });
    const neta = netaTexto(fz);
    T(px, fy2 + 4, i18n.t('Fuerza neta'), { fs: 16, w: 600, c: THEME.text });
    T(rx, fy2, neta.val, { fs: 20, w: 600, a: 'end', c: THEME.text });
    T(px, fy2 + 21, neta.txt, { fs: sm, c: dim, sys: true });
}
// Fuerza neta: valor y explicación
function netaTexto(fz) {
    if (B.estado === 'mano') return { val: '0 N', txt: Math.abs(fz.F) < 0.5 ? i18n.t('P − E = 0 → quieto') : fz.F > 0 ? i18n.t('P + F − E = 0 → si lo sueltas, sube') : i18n.t('E + F − P = 0 → si lo sueltas, baja') };
    if (B.estado === 'fuera' || B.estado === 'salto') return { val: '0 N', txt: i18n.t('P − N = 0 → quieto en la mesa') };
    if (B.res != null || (Math.abs(B.v) < 0.08 && B.quieto != null)) {
        return { val: '0 N', txt: fz.N > 0 ? i18n.t('P − E − N = 0 → quieto en el fondo') : i18n.t('P − E = 0 → quieto') };
    }
    const n = fz.P - fz.E;
    if (Math.abs(n) < 0.5) return { val: '0 N', txt: i18n.t('P − E = 0 → sigue como iba y el líquido lo frena') };
    return n > 0 ? { val: `${miles(n)} N ↓`, txt: i18n.t('P − E: hacia abajo → baja') } : { val: `${miles(-n)} N ↑`, txt: i18n.t('E − P: hacia arriba → sube') };
}

// ── Escena ───────────────────────────────────────────────────────
function drawEscena() {
    TARJETAS.forEach(t => tarjeta(t));
    const fz = fuerzas(), c = cuerpo(), g = geoCuerpo(), mom = intensidadMomento();
    // Columna 1: el depósito
    const liq = liqDib();
    const est = {
        liq, nivel: fz.nivel, nivel0: nivelBase(), t: millis() / 1000, mom,
        mano: B.estado === 'mano', burbujas: BURBUJAS,
        ondas: ONDAS.map(o => ({ edad: o.edad, cx: g.x + 0.67 * g.s, dx: g.s * PDX, w: g.s + g.s * PDX, oy: g.oy })),
        cuerpo: g.arq ? g : { k: c.k, s: g.s, x: g.x, yb: g.yb, ox: g.ox, oy: g.oy },
        flechas: S.fuerzas && !g.arq ? { E: fz.E, P: fz.P, N: B.estado === 'fuera' ? 0 : fz.N, F: fz.F } : null,
        arq: c.arq ? ARQ : null,
    };
    push(); translate(TQ.tx, TQ.ty); scale(TQ.s);
    const gd = deposito(0, 0, est);
    if (!c.arq) marcas(0, gd, mom, fz.Vsub);
    else if (ARQ.deficit > 0.5 && B.estado !== 'libre' && B.estado !== 'mano') {
        // nivel inicial (lleno hasta el borde) cuando ya falta agua
        const { w } = geomDeposito(0, 0);
        forma(`M4 2 H${w - 4}`, { s: THEME.cam, sw: 1.6, dash: [5, 5] });
        T(w - 8, -6, i18n.t('nivel inicial'), { fs: 12.5, a: 'end', c: THEME.cam, sys: true });
    }
    pop();
    // Rótulo del depósito y bocadillo de Arquímedes
    const nl = S.modo === 'libre' ? i18n.t('líquido de {r} kg/L', { r: fmt(S.rLibre, 3) }) : `${i18n.t(LIQS[S.liq].n).toLowerCase()} (${fmt(LIQS[S.liq].r, 3)} kg/L)`;
    if (!c.arq) T(ROTULO.x, ROTULO.y, i18n.t('depósito de vidrio · {l}', { l: nl }), { fs: ESC_MOVIL ? 13 : 14, a: 'middle', c: THEME.textDim, sys: true });
    else if (ESC_MOVIL || !S.fuerzas) T(ROTULO.x, ROTULO.y, i18n.t('depósito lleno hasta el borde · {l}', { l: nl }), { fs: 13, a: 'middle', c: THEME.textDim, sys: true });
    if (c.arq && millis() - ARQ.eurekaT0 < 4000 && B.estado !== 'fuera') bocadillo(BOCA.x, BOCA.y, ARQ.eurekaT0);
    // Columna 2: el papel
    if (PAPEL) {
        papel(PAPEL.x, PAPEL.y, PAPEL.w, PAPEL.h);
        const m = ESC_MOVIL;
        if (S.pestana === 'presion' && !c.arq) {
            const a = Math.cbrt(c.V) / 10;                         // lado en metros
            const hTop = (fz.nivel - B.z - Math.cbrt(c.V)) / 10;    // profundidad de la cara de arriba (m)
            papelPresion(PAPEL.x, PAPEL.y, PAPEL.w, PAPEL.h, { k: c.k, lado: a, hTop: fz.sub <= 0 ? -a : hTop, rl: rLiq() * 1000 }, m);
        } else {
            const res = resultado(c.r, rLiq());
            const fin = B.estado === 'mano' ? null : fz.N > 0 ? i18n.t('P > E: el fondo pone el resto (N)') : res === 'neutro' ? i18n.t('E = P en cualquier punto') : i18n.t('quieto: E = P');
            papelFuerzas(PAPEL.x, PAPEL.y, PAPEL.w, PAPEL.h, {
                k: c.k, liq, nomLiq: nomLiq(), P: fz.P, E: fz.E, N: fz.N, F: fz.F, frac: fz.frac, Vsub: fz.Vsub,
                arq: !!c.arq, mom: c.arq ? 0 : mom, fondo: fz.N > 0, fin,
                neta: i18n.t('Fuerza neta: {t}', { t: netaTexto(fz).txt }),
            }, m);
        }
    }
    // Columna 3: el panel de estado
    const msg = mensaje(fz);
    anunciar(msg);
    drawPanelEstado(msg, fz);
    // Tira: la regla de densidades
    regla(REGLA, ESC_MOVIL, {
        rb: c.r, rl: rLiq(), k: c.k, liq, nomLiq: S.modo === 'libre' ? i18n.t('el líquido') : nomLiq(),
        nomR: (S.modo === 'libre' ? i18n.t('líquido') : nomLiq()) + ' ' + fmt(rLiq(), rLiq() >= 10 ? 2 : 3), brillo: mom > 0,
    });
    // Sello del momento clave
    if (selloInfo && millis() - selloInfo.t0 < 6000) {
        const ctx = drawingContext, a = ctx.globalAlpha, edad = millis() - selloInfo.t0;
        ctx.globalAlpha = a * constrain((6000 - edad) / 500, 0, 1);
        sello(selloInfo.t, selloInfo.sub, SELLO_POS.x, SELLO_POS.y, selloInfo.t0, ESC_MOVIL);
        ctx.globalAlpha = a;
    }
    colocarAgarre(g);
}

// ── Mandos HTML ──────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
function pintarRelleno(sl) {
    const p = (sl.value - sl.min) / (sl.max - sl.min) * 100;
    sl.style.setProperty('--fill', p.toFixed(1) + '%');
}
function mostrarValores() {
    document.body.classList.toggle('modo-libre', S.modo === 'libre');
    document.body.classList.toggle('modo-materiales', S.modo === 'materiales');
    document.body.classList.toggle('sin-fuerzas', !S.fuerzas);
    document.body.classList.toggle('es-arq', esArq());
    $('sl-masa').value = S.m; $('sl-vol').value = S.V; $('sl-liq').value = S.rLibre;
    $('val-masa').textContent = `${S.m} kg`;
    $('val-vol').textContent = `${S.V} L`;
    $('val-liq').textContent = `${fmt(S.rLibre, 2)} kg/L`;
    ['sl-masa', 'sl-vol', 'sl-liq'].forEach(id => pintarRelleno($(id)));
    document.querySelectorAll('[data-modo]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.modo === S.modo)));
    document.querySelectorAll('[data-mat]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.mat === S.mat)));
    document.querySelectorAll('[data-liq]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.liq === S.liq)));
    const sw = $('btn-fuerzas');
    sw.setAttribute('aria-checked', String(S.fuerzas));
    if (esArq() && S.pestana === 'presion') S.pestana = 'fuerzas';
    document.querySelectorAll('[data-pestana]').forEach(b => {
        b.setAttribute('aria-selected', String(b.dataset.pestana === S.pestana));
        if (b.dataset.pestana === 'presion') b.disabled = esArq();
    });
}
function mostrarAcciones() {
    const arq = esArq();
    $('btn-soltar').hidden = arq;
    $('btn-arq-mover').hidden = !arq;
    $('btn-arq-llenar').hidden = !arq;
    if (!arq) return;
    const fuera = B.estado === 'fuera';
    $('btn-arq-mover').querySelector('.txt').textContent = i18n.t(fuera ? '↓ Meterlo en el agua' : '↑ Sacarlo del agua');
    $('btn-arq-mover').disabled = B.estado === 'salto';
    $('btn-arq-llenar').disabled = !(fuera && ARQ.deficit > 0.5 && !ARQ.rellenando);
}
function elegirModo(m) {
    if (m !== 'libre' && m !== 'materiales') return;
    S.modo = m;
    rehacerComposicion();
    mostrarValores();
    soltar();
}
function elegirMaterial(k) {
    if (!MATS[k] || k === 'libre') return;
    S.mat = k;
    mostrarValores();
    verMaterialElegido();
    soltar();
}
function elegirLiquido(k) {
    if (!LIQS[k]) return;
    S.liq = k;
    mostrarValores();
    if (esArq()) return;
    // el bloque sigue donde está; si estaba quieto, vuelve a moverse con el líquido nuevo
    if (B.estado !== 'mano') { B.estado = 'libre'; B.quieto = null; B.res = null; B.tSoltar = millis(); }
    selloInfo = null; momento = null;
}
function cambiarFuerzas(on) {
    S.fuerzas = on;
    selloInfo = null; momento = null; B.res = null; B.quieto = null;
    rehacerComposicion();
    mostrarValores();
}
function cambioLibre() {
    mostrarValores();
    if (B.estado !== 'mano') { B.estado = 'libre'; B.quieto = null; B.res = null; B.tSoltar = millis(); }
    if (B.z > zMax() + 0.4) B.z = zMax();
    selloInfo = null; momento = null;
}
function setupControles() {
    $('sl-masa').addEventListener('input', (e) => { S.m = +e.target.value; cambioLibre(); });
    $('sl-vol').addEventListener('input', (e) => { S.V = +e.target.value; cambioLibre(); });
    $('sl-liq').addEventListener('input', (e) => { S.rLibre = Math.round(+e.target.value * 100) / 100; cambioLibre(); });
    document.querySelectorAll('[data-modo]').forEach(b => b.addEventListener('click', () => elegirModo(b.dataset.modo)));
    document.querySelectorAll('[data-mat]').forEach(b => b.addEventListener('click', () => elegirMaterial(b.dataset.mat)));
    document.querySelectorAll('[data-liq]').forEach(b => b.addEventListener('click', () => elegirLiquido(b.dataset.liq)));
    document.querySelectorAll('[data-pestana]').forEach(b => b.addEventListener('click', () => { if (!b.disabled) { S.pestana = b.dataset.pestana; mostrarValores(); } }));
    $('btn-fuerzas').addEventListener('click', () => cambiarFuerzas(!S.fuerzas));
    $('btn-soltar').addEventListener('click', soltar);
    $('btn-arq-mover').addEventListener('click', () => B.estado === 'fuera' ? meterArq() : sacarArq());
    $('btn-arq-llenar').addEventListener('click', llenarArq);
    $('check-pantalla').addEventListener('change', (e) => {
        try {
            if (e.target.checked && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
            else if (!e.target.checked && document.fullscreenElement) document.exitFullscreen();
        } catch (err) { /* nada */ }
    });
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) $('check-pantalla').checked = false; setTimeout(fitCanvas, 100); });
    // El tema elegido se recuerda en este navegador
    document.querySelectorAll('.theme-opt').forEach(b => b.addEventListener('click', () => { try { localStorage.setItem('sim-arquimedes-tema', b.dataset.theme); } catch (e) { /* nada */ } CACHE_CUBOS.clear(); }));
    const t = temaActual(), clave = { pizarra: 'dark', dia: 'light', marca: 'marca', contraste: 'contrast' }[t];
    document.querySelectorAll('.theme-opt').forEach(b => b.classList.toggle('active', b.dataset.theme === clave));
    // En los grupos de opciones, las flechas pasan a la opción vecina
    document.querySelectorAll('.carril[role="radiogroup"], .carril[role="tablist"], .rejilla-liq').forEach(grupo => {
        grupo.addEventListener('keydown', (e) => {
            const paso = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
            if (!paso) return;
            e.preventDefault();
            const btns = [...grupo.querySelectorAll('button:not([disabled])')];
            const sig = btns[(btns.indexOf(document.activeElement) + paso + btns.length) % btns.length];
            sig.focus(); sig.click();
        });
    });
    // Atajos: S (soltar otra vez) y F (fuerzas). No actúan con el foco en un control.
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.target.closest('button, input, select, textarea, summary, a')) return;
        if (e.key === 's' || e.key === 'S') { if (esArq()) { if (B.estado === 'fuera') meterArq(); else sacarArq(); } else soltar(); }
        if (e.key === 'f' || e.key === 'F') cambiarFuerzas(!S.fuerzas);
    });
    iniciarCarrusel();
    iniciarPopover('btn-ayuda', 'panel-ayuda');
    window.addEventListener('load', fitCanvas);
    if (document.fonts) document.fonts.ready.then(() => { CACHE_CUBOS.clear(); mensajeCache.clave = ''; fitCanvas(); });
    new ResizeObserver(fitCanvas).observe(document.querySelector('.barra-sus'));
}
// Carrusel de materiales: flechas a los lados cuando la fila no cabe entera
function iniciarCarrusel() {
    const caja = document.querySelector('.carrusel'), fila = caja.querySelector('.carril');
    const marcar = () => {
        const max = fila.scrollWidth - fila.clientWidth;
        caja.classList.toggle('hay-izq', fila.scrollLeft > 4);
        caja.classList.toggle('hay-der', fila.scrollLeft < max - 4);
    };
    caja.querySelector('.izq').addEventListener('click', () => fila.scrollBy({ left: -fila.clientWidth * 0.7 }));
    caja.querySelector('.der').addEventListener('click', () => fila.scrollBy({ left: fila.clientWidth * 0.7 }));
    fila.addEventListener('scroll', marcar, { passive: true });
    new ResizeObserver(marcar).observe(fila);
    marcar();
}
function verMaterialElegido() {
    const fila = document.querySelector('.carril.materiales'), b = fila && fila.querySelector('[aria-checked="true"]');
    if (!b || fila.scrollWidth <= fila.clientWidth) return;
    const x = b.offsetLeft - fila.offsetLeft, izq = fila.scrollLeft, der = izq + fila.clientWidth;
    if (x < izq + 40) fila.scrollTo({ left: x - 44 });
    else if (x + b.offsetWidth > der - 40) fila.scrollTo({ left: x + b.offsetWidth - fila.clientWidth + 44 });
}

// ── Sujetar el cuerpo con la mano (ratón, dedo o teclado) ─────────
const AG = { activo: false, dy: 0, y0: 0, movido: 0, id: null };
// Punto del lienzo → coordenadas locales del depósito
function aLocal(e, cv) {
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left) * CV_W / r.width, y = (e.clientY - r.top) * CV_H / r.height;
    return { x: (x - TQ.tx) / TQ.s, y: (y - TQ.ty) / TQ.s };
}
function tocaCuerpo(p) {
    const g = geoCuerpo();
    if (g.arq) return p.x >= g.ax + 8 * g.sc && p.x <= g.ax + 92 * g.sc && p.y >= g.ay && p.y <= g.ay + 172 * g.sc;
    return p.x >= g.x - 4 && p.x <= g.x + g.s + g.s * PDX + 4 && p.y >= g.yb - g.s + g.s * PDY - 4 && p.y <= g.yb + 4;
}
function zDesdeY(ybLocal) {
    const g = geoCuerpo(), { yF } = geomDeposito(0, 0);
    const z = (yF + g.oy - ybLocal) / ESC;
    return constrain(z, 0, esArq() ? TH - 1.2 : zMax());
}
function agarrar() {
    if (esArq() && (B.estado === 'fuera' || B.estado === 'salto')) return false;
    B.estado = 'mano'; B.v = 0; B.quieto = null; B.res = null;
    selloInfo = null; momento = null;
    return true;
}
function soltarMano() {
    if (B.estado !== 'mano') return;
    B.estado = 'libre'; B.v = 0; B.tSoltar = millis(); B.quieto = null; B.res = null;
}
function setupAgarre(cv) {
    cv.addEventListener('touchstart', (e) => { const t = e.touches[0]; if (t && tocaCuerpo(aLocal(t, cv))) e.preventDefault(); }, { passive: false });
    cv.addEventListener('pointerdown', (e) => {
        const p = aLocal(e, cv);
        if (!tocaCuerpo(p)) return;
        if (esArq() && B.estado === 'fuera') { meterArq(); return; }
        if (!agarrar()) return;
        AG.activo = true; AG.dy = geoCuerpo().yb - p.y; AG.y0 = p.y; AG.movido = 0; AG.id = e.pointerId;
        cv.setPointerCapture(e.pointerId);
        cv.style.cursor = 'grabbing';
    });
    cv.addEventListener('pointermove', (e) => {
        const p = aLocal(e, cv);
        if (AG.activo) {
            AG.movido = Math.max(AG.movido, Math.abs(p.y - AG.y0));
            B.z = zDesdeY(p.y + AG.dy);
        } else cv.style.cursor = tocaCuerpo(p) ? 'grab' : '';
    });
    const fin = () => {
        if (!AG.activo) return;
        AG.activo = false; cv.style.cursor = '';
        soltarMano();
    };
    cv.addEventListener('pointerup', fin);
    cv.addEventListener('pointercancel', fin);
    // Teclado: un botón invisible sobre el cuerpo
    const b = $('agarre');
    b.addEventListener('keydown', (e) => {
        const paso = { ArrowUp: 0.25, ArrowDown: -0.25 }[e.key];
        if (paso) {
            e.preventDefault();
            if (B.estado !== 'mano' && !agarrar()) return;
            B.z = constrain(B.z + paso, 0, esArq() ? TH - 1.2 : zMax());
        } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault();
            if (B.estado === 'mano') soltarMano();
            else if (esArq() && B.estado === 'fuera') meterArq();
        }
    });
    b.addEventListener('blur', soltarMano);
}
function colocarAgarre(g) {
    const b = $('agarre');
    if (!b) return;
    let x, y, w, h;
    if (g.arq) { x = g.ax + 8 * g.sc; y = g.ay; w = 84 * g.sc; h = 172 * g.sc; }
    else { x = g.x; y = g.yb - g.s + g.s * PDY; w = g.s + g.s * PDX; h = g.s - g.s * PDY; }
    const X = TQ.tx + x * TQ.s, Y = TQ.ty + y * TQ.s;
    b.style.left = (100 * X / CV_W) + '%';
    b.style.top = (100 * Y / CV_H) + '%';
    b.style.width = (100 * w * TQ.s / CV_W) + '%';
    b.style.height = (100 * h * TQ.s / CV_H) + '%';
}

// ── Arranque ─────────────────────────────────────────────────────
const ALIAS_MAT = { plastic: 'plastico', 'plástico': 'plastico', aluminum: 'aluminio', iron: 'hierro', lead: 'plomo', gold: 'oro', cork: 'corcho', wood: 'madera', ice: 'hielo', archimedes: 'arquimedes', 'arquímedes': 'arquimedes' };
const ALIAS_LIQ = { agua: 'aguadulce', 'agua-dulce': 'aguadulce', 'agua_dulce': 'aguadulce', 'agua-mar': 'aguamar', 'agua_de_mar': 'aguamar', water: 'aguadulce', seawater: 'aguamar', ethanol: 'etanol', alcohol: 'etanol', oil: 'aceite', gasoline: 'gasolina', glycerin: 'glicerina', mercury: 'mercurio' };
function setup() {
    calcularEscena();
    const cv = createCanvas(CV_W, CV_H);
    pixelDensity(1);
    cv.parent('canvas-container');
    cv.elt.setAttribute('role', 'img');
    cv.elt.setAttribute('aria-label', i18n.t('Simulación del principio de Arquímedes: un bloque cae en un depósito con líquido; las fuerzas se dibujan a escala junto al líquido que aparta y la regla compara su densidad con la del líquido. Los mensajes de la simulación se leen en voz alta.'));
    frameRate(60);
    if (document.fonts) document.fonts.load('600 12px Fredoka');
    iniciarSelectorTema();
    setupControles();
    setupAgarre(cv.elt);
    // Ajustes de la dirección (fichas del alumnado): ver js/parametros.js
    const num = (v) => { const x = parseFloat(String(v).replace(',', '.')); return isFinite(x) ? x : null; };
    aplicarParametrosUrl({
        tema:     (v) => { const t = { simulaciencia: 'marca', marca: 'marca', claro: 'light', oscuro: 'dark', contraste: 'contrast' }[v];
                           const b = t && document.querySelector(`.theme-opt[data-theme="${t}"]`); if (b) b.click(); },
        modo:     (v) => { if (v === 'libre' || v === 'custom') S.modo = 'libre'; if (v === 'materiales' || v === 'materials') S.modo = 'materiales'; },
        masa:     (v) => { const x = num(v); if (x != null) S.m = constrain(Math.round(x), 10, 200); },
        volumen:  (v) => { const x = num(v); if (x != null) S.V = constrain(Math.round(x), 50, 150); },
        densidad: (v) => { const x = num(v); if (x != null) S.rLibre = constrain(Math.round(x * 100) / 100, 0.5, 13.6); },
        material: (v) => { const k = ALIAS_MAT[v] || v; if (MATS[k] && k !== 'libre') S.mat = k; },
        liquido:  (v) => { const k = ALIAS_LIQ[v] || v; if (LIQS[k]) S.liq = k; },
        fuerzas:  (v) => { S.fuerzas = !['0', 'no', 'false'].includes(v); },
        presion:  (v) => { if (['1', 'si', 'sí', 'true'].includes(v)) S.pestana = 'presion'; },
        retos:    (v) => { if (['1', 'si', 'sí', 'true'].includes(v)) abrirRetos(); },
    });
    calcularEscena(); resizeCanvas(CV_W, CV_H);
    mostrarValores();
    soltar();
    requestAnimationFrame(verMaterialElegido);
    fitCanvas();
}
function draw() {
    vigilarRendimiento();
    actualizarTema(TEMA_PROPIO);
    clear();
    const dt = Math.min(deltaTime / 1000, 1 / 30);
    paso(dt);
    drawEscena();
}
