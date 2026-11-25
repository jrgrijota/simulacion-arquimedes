// ═══════════════════════════════════════════════════════════════════
//  DIBUJOS DE «PRINCIPIO DE ARQUÍMEDES»
//
//  Traslado fiel del boceto aprobado (/capturas/escena-arquimedes/boceto.html,
//  v3): las mismas formas, los mismos degradados y la misma proyección
//  oblicua que la cubeta de «Densidad». Se dibuja con el contexto 2D del
//  lienzo (Path2D con trazados SVG), así que cada objeto usa las
//  coordenadas del boceto tal cual.
//  · cubo()          el bloque: cubo a escala (lado ∝ raíz cúbica de V)
//  · arquimedes()    el huevo de pascua (coordenadas locales 100 × 172)
//  · deposito()      depósito de vidrio de 12 × 6,5 × 11 dm con el líquido
//  · papelFuerzas()  columna 2: fuerzas a escala y el líquido apartado
//  · papelPresion()  columna 2: ¿de dónde sale el empuje?
//  · regla()         tira inferior: regla de densidades en dos tramos
//  · manoAgarre()    la mano que sujeta el cuerpo
// ═══════════════════════════════════════════════════════════════════

// Proyección oblicua: por cada unidad de profundidad, 0,34 a la derecha y 0,26 arriba
const PDX = 0.34, PDY = -0.26;
const ESC = 22;                                 // 1 dm son 22 unidades del lienzo
const TW = 12, TD = 6.5, TH = 11, L0 = 5;      // depósito (dm) y nivel sin bloque
const AREA = TW * TD;                           // dm² de la base del depósito
const lado = (V) => Math.cbrt(V) * ESC;
const G = 9.8;

// Colores fijos de los objetos (lo de alrededor sigue al tema)
const CF = {
    ink: '#071a2b', cyan: '#00c8ff', cam: '#ffd84a', vidrio: '#d8efff',
    flota: '#9fe7c4', hunde: '#ffb38a', neutro: '#d7e3ee',
    // fuerzas sobre el bloque del depósito (claras, con contorno de tinta)
    dP: '#ff8f7f', dE: '#8cc8ff', dN: '#c7b1ff', dF: '#ff9ad8',
};

// Materiales (densidad en kg/L); Arquímedes: 70 L a 0,98 kg/L
const MATS = {
    corcho:     { n: 'Corcho', r: 0.24, c: '#d7bc94' },
    madera:     { n: 'Madera', r: 0.60, c: '#b47a46' },
    hielo:      { n: 'Hielo', r: 0.917, c: '#d6ecff' },
    plastico:   { n: 'Plástico', r: 0.95, c: '#cbc6dc' },
    aluminio:   { n: 'Aluminio', r: 2.70, c: '#c7ced8' },
    hierro:     { n: 'Hierro', r: 7.87, c: '#7d8692' },
    plomo:      { n: 'Plomo', r: 11.34, c: '#6c7380' },
    oro:        { n: 'Oro', r: 19.30, c: '#f2c94c' },
    arquimedes: { n: 'Arquímedes', r: 0.98, c: '#7fae5a' },
    libre:      { n: 'Bloque', r: null, c: '#9b91d2' },
};
const ORDEN = ['corcho', 'madera', 'hielo', 'plastico', 'aluminio', 'hierro', 'plomo', 'oro', 'arquimedes'];

// Líquidos (kg/L). Colores reales: el color no dice la densidad.
const LIQS = {
    gasolina:  { n: 'Gasolina', el: 'la gasolina', r: 0.740, p: '#f2d65c' },
    etanol:    { n: 'Etanol', el: 'el etanol', r: 0.789, p: '#d9ecf5' },
    aceite:    { n: 'Aceite', el: 'el aceite', r: 0.920, p: '#e3b23c' },
    aguadulce: { n: 'Agua dulce', el: 'el agua dulce', r: 1.000, p: '#3a9be0' },
    aguamar:   { n: 'Agua de mar', el: 'el agua de mar', r: 1.025, p: '#2fa7b5' },
    glicerina: { n: 'Glicerina', el: 'la glicerina', r: 1.261, p: '#e3edf4' },
    mercurio:  { n: 'Mercurio', el: 'el mercurio', r: 13.534, p: '#b9c2cc' },
};
const ORDEN_LQ = ['gasolina', 'etanol', 'aceite', 'aguadulce', 'aguamar', 'glicerina', 'mercurio'];

// Aspecto de cada líquido: [color, opacidad] arriba y abajo de cada cara
const ASP = {
    aguadulce: { fondo: [['#46b3ec', 1], ['#16609f', 1]], lado: [['#2e8fd2', 1], ['#11497c', 1]], frente: [['#5cc0f2', .32], ['#2b8ad0', .42], ['#13568f', .62]], sup: ['#8fd3f7', '#d4f1ff'], suelo: '#4aa7e4', cau: '#d4f1ff', tinte: '#2b8ad0' },
    aguamar:   { fondo: [['#41c2c9', 1], ['#0f5f78', 1]], lado: [['#2aa0b0', 1], ['#0f4b62', 1]], frente: [['#62d4da', .32], ['#2a9cb0', .44], ['#11607a', .64]], sup: ['#90e2e6', '#d8f8f8'], suelo: '#47b6c2', cau: '#d8f8f8', tinte: '#2a9cb0' },
    gasolina:  { fondo: [['#efe08a', .42], ['#c9a843', .55]], lado: [['#e3cd68', .55], ['#a88a2a', .65]], frente: [['#fff2a8', .12], ['#f0d66a', .2], ['#c9a23a', .3]], sup: ['#f4e7a2', '#fffbe0'], suelo: '#cbb862', cau: '#fff8d0', tinte: '#e8c95a' },
    etanol:    { fondo: [['#d8eef8', .2], ['#a9cfe2', .3]], lado: [['#cfe6f2', .28], ['#8fb4c8', .38]], frente: [['#ffffff', .06], ['#dcefff', .1], ['#a9cfe2', .18]], sup: ['#dff2fb', '#ffffff'], suelo: '#7fa7bd', cau: '#f0faff', tinte: '#cfe6f2' },
    aceite:    { fondo: [['#f0bd4a', .8], ['#a8690f', .9]], lado: [['#d99a2a', .85], ['#83500c', .92]], frente: [['#ffd56a', .3], ['#e3a83a', .44], ['#a8670f', .62]], sup: ['#f5d470', '#fff0b8'], suelo: '#dfa83a', cau: '#fff0b8', tinte: '#e3a83a' },
    glicerina: { fondo: [['#e2edf5', .28], ['#b6c9d8', .38]], lado: [['#d6e4ee', .32], ['#9fb4c5', .42]], frente: [['#ffffff', .08], ['#e6f0f7', .14], ['#bccfdd', .24]], sup: ['#eaf4fa', '#ffffff'], suelo: '#93abbe', cau: '#ffffff', tinte: '#d6e4ee' },
    mercurio:  { fondo: [['#c3ccd5', 1], ['#5f6a76', 1]], lado: [['#8f9aa6', 1], ['#3f4954', 1]], frente: [['#8d99a5', 1], ['#dfe5ea', 1], ['#7a8591', 1], ['#a7b1bb', 1], ['#3c4651', 1]], sup: ['#a9b4bf', '#eef2f6'], suelo: '#8f9aa6', cau: '#ffffff', tinte: '#aab4be', opaco: true },
};
// Líquido de «Valores libres»: el agua, con la densidad que se elija
const liqAspecto = (k) => ASP[k] || ASP.aguadulce;

// Caras de cada material: [frente arriba, frente abajo], [arriba], [lado]; a = opacidad
const PAL = {
    corcho:   { f: ['#dfc095', '#bf9561'], t: ['#efd6ae', '#d9b886'], s: ['#ad8352', '#8b653a'] },
    madera:   { f: ['#cf955c', '#a66a38'], t: ['#e2b583', '#c99665'], s: ['#8f5c30', '#6f4420'] },
    hielo:    { f: ['#f2faff', '#b4d9f3'], t: ['#ffffff', '#dceffc'], s: ['#a6cfee', '#86b9e1'], a: 0.9 },
    plastico: { f: ['#eef4fa', '#c4d4e5'], t: ['#fafcfe', '#dde8f2'], s: ['#b6c7d9', '#9eb2c7'], a: 0.8 },
    aluminio: { f: ['#dfe5ec', '#b3bdc9'], t: ['#f6f9fb', '#e1e7ed'], s: ['#a1adbb', '#86929f'] },
    hierro:   { f: ['#8f97a1', '#5c636d'], t: ['#aab1ba', '#8c949e'], s: ['#5a616b', '#424851'] },
    plomo:    { f: ['#868d9a', '#606773'], t: ['#9da4af', '#838a96'], s: ['#59606b', '#454a54'] },
    oro:      { f: ['#ffe07a', '#cf9417'], t: ['#fff1b0', '#f4cb52'], s: ['#c08510', '#94640a'] },
    libre:    { f: ['#b8aff0', '#8a7fd2'], t: ['#cfc8f7', '#b0a6ea'], s: ['#766bbf', '#5d53a5'] },
};

// Color con opacidad (#rrggbb + a → rgba)
function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

// Degradados del boceto, en unidades de la caja de cada forma (como en SVG):
// ['l', [x1, y1, x2, y2], paradas] o ['r', [cx, cy, r], paradas]
const GR = {
    foco:       ['r', [0.5, 0.5, 0.5], [[0, 'rgba(45,119,173,.55)'], [1, 'rgba(45,119,173,0)']]],
    cuerpoBal:  ['l', [0, 0, 0, 1], [[0, '#58768f'], [0.55, '#3a5469'], [1, '#2a3e50']]],
    cubFondo:   ['l', [0, 0, 0, 1], [[0, 'rgba(42,106,156,.45)'], [1, 'rgba(18,58,92,.55)']]],
    oclusion:   ['l', [0, 0, 0, 1], [[0.55, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.22)']]],
    nucleoHielo: ['r', [0.45, 0.5, 0.5], [[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]],
    toga:       ['l', [0, 0, 1, 1], [[0, '#fffdf6'], [0.6, '#f1e8d4'], [1, '#d9cbb0']]],
    piel:       ['r', [0.42, 0.38, 0.7], [[0, '#ffdcb8'], [0.75, '#f0c093'], [1, '#d99c6c']]],
};
for (const k in PAL) {
    const p = PAL[k];
    GR[k + '-f'] = ['l', [0, 0, 0.35, 1], [[0, p.f[0]], [1, p.f[1]]]];
    GR[k + '-t'] = ['l', [0, 1, 1, 0], [[0, p.t[0]], [1, p.t[1]]]];
    GR[k + '-s'] = ['l', [0, 0, 0, 1], [[0, p.s[0]], [1, p.s[1]]]];
}
// Aluminio cepillado y oro con reflejo: bandas
GR['aluminio-f'] = ['l', [0, 0, 1, 0], [[0, '#cfd7e0'], [0.22, '#f3f6f9'], [0.48, '#b9c3ce'], [0.76, '#e4e9ef'], [1, '#aeb8c4']]];
GR['oro-f'] = ['l', [0, 0, 1, 0.7], [[0, '#f6c64a'], [0.28, '#fff2b8'], [0.5, '#e6ad2e'], [1, '#b57d0e']]];
// Cada líquido: fondo, lado, frente y superficie
for (const k in ASP) {
    const a = ASP[k], pasos = (st) => st.map((s, i) => [i / (st.length - 1), rgba(s[0], s[1])]);
    GR[k + '-fondo'] = ['l', [0, 0, 0, 1], pasos(a.fondo)];
    GR[k + '-lado'] = ['l', [0, 0, 0, 1], pasos(a.lado)];
    GR[k + '-frente'] = ['l', [0, 0, 0, 1], pasos(a.frente)];
    GR[k + '-sup'] = ['l', [0, 1, 0, 0], [[0, rgba(a.sup[0], a.opaco ? 1 : 0.75)], [1, rgba(a.sup[1], a.opaco ? 1 : 0.9)]]];
}

// ── Primitivas ───────────────────────────────────────────────────
let CTX_FUERA = null;                       // contexto de un lienzo auxiliar (caché de cubos)
const cx2 = () => CTX_FUERA || drawingContext;
const tinta = () => THEME.ink || CF.ink;
const fuenteDib = () => (THEME.fun ? 'Fredoka, ' : '') + FUENTE_TEXTO;

// Semilla fija: las texturas salen siempre iguales
let semilla = 11;
const rnd = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };

// Trazados SVG de un rectángulo redondeado, una elipse y un polígono
function R(x, y, w, h, r = 0) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    if (!r) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
    return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
           `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}
function E(cx, cy, rx, ry) { return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`; }
function P(...q) { return 'M' + q.map(p => p.join(' ')).join(' L') + ' Z'; }

function pintar(p, f, bb) {
    const ctx = cx2();
    if (typeof f === 'string' && f.startsWith('g:')) {
        const g = GR[f.slice(2)], [bx, by, bw, bh] = bb;
        if (g[0] === 'l') {
            const [x1, y1, x2, y2] = g[1];
            const gr = ctx.createLinearGradient(bx + x1 * bw, by + y1 * bh, bx + x2 * bw, by + y2 * bh);
            g[2].forEach(([o, c]) => gr.addColorStop(o, c));
            ctx.fillStyle = gr; ctx.fill(p);
        } else {
            const [cx, cy, r] = g[1];
            ctx.save(); ctx.clip(p); ctx.translate(bx, by); ctx.scale(bw || 1, bh || 1);
            const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            g[2].forEach(([o, c]) => gr.addColorStop(o, c));
            ctx.fillStyle = gr; ctx.fillRect(0, 0, 1, 1); ctx.restore();
        }
    } else { ctx.fillStyle = f; ctx.fill(p); }
}
// Forma: d (trazado SVG) con o = { f, fo, s, sw, so, op, bb, lj, lc, dash }
function forma(d, o) {
    const ctx = cx2(), p = typeof d === 'string' ? new Path2D(d) : d;
    const a0 = ctx.globalAlpha, op = o.op == null ? 1 : o.op;
    if (o.f) { ctx.globalAlpha = a0 * op * (o.fo == null ? 1 : o.fo); pintar(p, o.f, o.bb); }
    if (o.s) {
        ctx.globalAlpha = a0 * op * (o.so == null ? 1 : o.so);
        ctx.strokeStyle = o.s; ctx.lineWidth = o.sw || 1;
        ctx.lineJoin = o.lj || 'miter'; ctx.lineCap = o.lc || 'butt';
        if (o.dash) ctx.setLineDash(o.dash);
        ctx.stroke(p);
        if (o.dash) ctx.setLineDash([]);
    }
    ctx.globalAlpha = a0;
}
const linea = (d, col, sw, op, lc) => forma(d, { s: col, sw, op, lc });
function recortar(d, fn) { const ctx = cx2(); ctx.save(); ctx.clip(new Path2D(d)); fn(); ctx.restore(); }
// Círculo de contorno «solo por fuera»: primero el contorno grueso, luego el relleno (nubes de pelo y barba)
function nube(cs, fill, sw = 2.4) {
    cs.forEach(([cx, cy, r]) => forma(E(cx, cy, r, r), { f: fill, s: tinta(), sw: sw * 2 }));
    cs.forEach(([cx, cy, r]) => forma(E(cx, cy, r, r), { f: fill }));
}

// Texto con la línea base abajo (como en SVG). o = { fs, w, c, a, sys, op, borde, bw }
function fuenteDe(o) { return `${o.w || 500} ${o.fs || 16}px ${o.sys ? FUENTE_TEXTO : fuenteDib()}`; }
function T(x, y, s, o = {}) {
    const ctx = cx2(), a0 = ctx.globalAlpha;
    ctx.font = fuenteDe(o);
    ctx.textAlign = { start: 'left', middle: 'center', end: 'right' }[o.a || 'start'];
    ctx.textBaseline = 'alphabetic';
    if (o.op != null) ctx.globalAlpha = a0 * o.op;
    if (o.borde) { ctx.strokeStyle = o.borde; ctx.lineWidth = o.bw || 3.5; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
    ctx.fillStyle = o.c || THEME.text;
    ctx.fillText(s, x, y);
    ctx.globalAlpha = a0;
}
function anchoT(s, o = {}) { const ctx = cx2(); ctx.font = fuenteDe(o); return ctx.measureText(s).width; }
// Texto con subíndices: trozos [[texto, sub?], …]
function Tsub(x, y, trozos, o = {}) {
    const fsSub = (o.fs || 16) * 0.72;
    let w = 0;
    trozos.forEach(([t, sub]) => { w += anchoT(t, sub ? Object.assign({}, o, { fs: fsSub }) : o); });
    let xx = o.a === 'end' ? x - w : o.a === 'middle' ? x - w / 2 : x;
    trozos.forEach(([t, sub]) => {
        const oo = Object.assign({}, o, { a: 'start' });
        if (sub) oo.fs = fsSub;
        T(xx, sub ? y + 3 : y, t, oo);
        xx += anchoT(t, oo);
    });
    return w;
}
function pildora(x, y, w, h, fill, stroke, sw = 2.5) { forma(R(x, y, w, h, h / 2), { f: fill, s: stroke, sw }); }
function chispaD(x, y, r, col = CF.cam) {
    let p = '';
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.42 : r; p += `${i ? 'L' : 'M'}${x + Math.cos(a) * rr} ${y + Math.sin(a) * rr}`; }
    forma(p + 'Z', { f: col, s: tinta(), sw: 1.8 });
}
function focoD(cx, cy, rx, ry) {
    if (!THEME.foco) return;
    forma(E(cx, cy, rx, ry), { f: 'g:foco', bb: [cx - rx, cy - ry, 2 * rx, 2 * ry], op: THEME.foco });
}
const sombraE = (cx, cy, w, op = 0.38) => forma(E(cx, cy, w / 2, Math.max(3, w * 0.09)), { f: '#04111c', op });

// ═════════ EL BLOQUE: cubo a escala ═════════
function caras(x, yb, s) {
    const dx = s * PDX, dy = s * PDY, y = yb - s;
    return {
        dx, dy, y,
        top: `M${x} ${y} L${x + dx} ${y + dy} L${x + s + dx} ${y + dy} L${x + s} ${y} Z`,
        side: `M${x + s} ${y} L${x + s + dx} ${y + dy} L${x + s + dx} ${yb + dy} L${x + s} ${yb} Z`,
    };
}
// Los cubos se pintan una vez en un lienzo auxiliar y luego se copian
// (el corcho lleva cientos de poros): clave = material, lado, resolución y tinta.
const CACHE_CUBOS = new Map();
function cubo(k, x, yb, s) {
    if (!(s > 2)) return;
    const ctx = cx2(), t = ctx.getTransform();
    const pd = pixelDensity() * Math.max(1, Math.hypot(t.a, t.b) / pixelDensity());
    const pad = 6, dx = s * PDX, dy = s * PDY;
    const W = s + dx + 2 * pad, H = s - dy + 2 * pad;
    const clave = k + '|' + s.toFixed(1) + '|' + pd.toFixed(2) + '|' + tinta();
    let c = CACHE_CUBOS.get(clave);
    if (!c) {
        c = document.createElement('canvas');
        c.width = Math.ceil(W * pd); c.height = Math.ceil(H * pd);
        const g = c.getContext('2d'); g.scale(pd, pd);
        const antes = CTX_FUERA; CTX_FUERA = g;
        try { cuboDirecto(k, pad, pad + s - dy, s); } finally { CTX_FUERA = antes; }
        CACHE_CUBOS.set(clave, c);
        if (CACHE_CUBOS.size > 90) CACHE_CUBOS.delete(CACHE_CUBOS.keys().next().value);
    }
    ctx.drawImage(c, x - pad, yb - s + dy - pad, W, H);
}
// (x, yb) = esquina inferior izquierda de la cara frontal; s = lado
function cuboDirecto(k, x, yb, s) {
    const F = caras(x, yb, s), y = F.y, ink = tinta(), a = PAL[k].a || 1;
    const sw = Math.max(2, Math.min(3.4, s / 24)), rr = Math.min(5, s * 0.05);
    semilla = Math.round(s * 13) + k.length * 31 || 1;
    forma(F.side, { f: `g:${k}-s`, fo: a, s: ink, sw, lj: 'round', bb: [x + s, y + F.dy, F.dx, s - F.dy] });
    forma(F.top, { f: `g:${k}-t`, fo: a, s: ink, sw, lj: 'round', bb: [x, y + F.dy, s + F.dx, -F.dy] });
    forma(R(x, y, s, s, rr), { f: `g:${k}-f`, fo: a, bb: [x, y, s, s] });
    const tonos = ['#8d6538', '#f3dfbe', '#6e4b25', '#a97c48'];
    let tapa = null;
    recortar(R(x, y, s, s, rr), () => {
        if (k === 'corcho') {
            const n = Math.round(s * s / 26);
            for (let i = 0; i < n; i++) {
                const px = x + rnd() * s, py = y + rnd() * s, r = 0.5 + rnd() * 1.5;
                forma(E(px, py, r, r * 0.7), { f: tonos[i % 4], op: 0.35 + rnd() * 0.4 });
            }
            tapa = () => {
                for (let i = 0; i < n / 3; i++) {
                    const px = x + rnd() * (s + F.dx), py = y + F.dy + rnd() * (-F.dy), r = 0.5 + rnd() * 1.1;
                    forma(E(px, py, r, r), { f: tonos[i % 4], op: 0.45 });
                }
            };
        }
        if (k === 'madera') {
            for (let i = 0; i < 9; i++) {
                const py = y + s * (i + 0.5) / 9 + (rnd() - 0.5) * 4, amp = s * (0.02 + rnd() * 0.03);
                forma(`M${x - 2} ${py} C${x + s * 0.3} ${py - amp} ${x + s * 0.6} ${py + amp * 1.6} ${x + s + 2} ${py - amp * 0.5}`,
                      { s: '#6f4120', sw: 1 + rnd() * 1.2, op: 0.28 + rnd() * 0.3 });
            }
            const kx = x + s * 0.64, ky = y + s * 0.4;
            forma(E(kx, ky, s * 0.07, s * 0.04), { f: '#7c4a22', op: 0.55 });
            forma(E(kx, ky, s * 0.12, s * 0.07), { s: '#6f4120', sw: 1.2, op: 0.45 });
            // anillos de la testa en la cara de arriba
            tapa = () => {
                const cx = x + s * 0.15, cy = y + F.dy * 0.2;
                for (let i = 1; i < 9; i++) forma(E(cx, cy, s * 0.13 * i, -F.dy * 0.32 * i), { s: '#a46f3f', sw: 1.2, op: 0.55 });
            };
        }
        if (k === 'hielo') {
            forma(E(x + s * 0.5, y + s * 0.52, s * 0.36, s * 0.32), { f: 'g:nucleoHielo', bb: [x + s * 0.14, y + s * 0.2, s * 0.72, s * 0.64] });
            forma(`M${x + s * 0.18} ${y + s * 0.78} L${x + s * 0.4} ${y + s * 0.6} L${x + s * 0.47} ${y + s * 0.68} L${x + s * 0.66} ${y + s * 0.5}`, { s: '#fff', sw: 1.4, op: 0.85 });
            forma(R(x + 1, y + 1, s - 2, s - 2, 4), { s: '#fff', sw: Math.max(2, s * 0.04), op: 0.55 });
        }
        if (k === 'plastico') {
            linea(`M${x + s * 0.15} ${y + s} L${x + s * 0.55} ${y}`, '#fff', s * 0.09, 0.45);
            linea(`M${x + s * 0.42} ${y + s} L${x + s * 0.72} ${y}`, '#fff', s * 0.04, 0.35);
        }
        if (k === 'aluminio') for (let py = y + 2; py < y + s; py += 2.6) linea(`M${x} ${py} H${x + s}`, '#fff', 0.7, 0.08 + rnd() * 0.14);
        if (k === 'hierro') {
            for (let i = 0; i < 14; i++) {
                const cx = x + rnd() * s, cy = y + rnd() * s, rx = s * (0.03 + rnd() * 0.05), ry = s * (0.02 + rnd() * 0.03);
                forma(E(cx, cy, rx, ry), { f: '#3e444c', op: 0.3 });
            }
            forma(`M${x} ${y + s * 0.3} L${x + s} ${y + s * 0.12} L${x + s} ${y + s * 0.2} L${x} ${y + s * 0.42}Z`, { f: '#c9d6e6', op: 0.14 });
        }
        if (k === 'plomo') for (let i = 0; i < 7; i++) {
            const px = x + rnd() * s * 0.85, py = y + rnd() * s * 0.9;
            linea(`M${px} ${py} l${s * (0.06 + rnd() * 0.1)} ${s * 0.02}`, '#c1c7d0', 1, 0.45);
        }
        if (k === 'oro') {
            forma(`M${x} ${y + s * 0.62} L${x + s} ${y + s * 0.38} L${x + s} ${y + s * 0.46} L${x} ${y + s * 0.72}Z`, { f: '#fff8d8', op: 0.35 });
            tapa = () => linea(`M${x + s * 0.2} ${y + F.dy * 0.3} L${x + s * 0.75} ${y + F.dy * 0.75}`, '#fffbe6', s * 0.05, 0.6);
        }
        if (k === 'libre') linea(`M${x + s * 0.12} ${y + s * 0.88} L${x + s * 0.88} ${y + s * 0.12}`, '#fff', s * 0.05, 0.16);
        forma(R(x, y, s, s), { f: 'g:oclusion', bb: [x, y, s, s] });
    });
    if (tapa) recortar(F.top, tapa);
    forma(R(x, y, s, s, rr), { s: ink, sw: sw + 0.6 });
    // aristas con luz y brillo
    linea(`M${x + 3} ${y + 1.8} H${x + s - 3}`, '#fff', 1.6, 0.6, 'round');
    linea(`M${x + s + F.dx * 0.15} ${y + F.dy * 0.15} L${x + s + F.dx * 0.85} ${y + F.dy * 0.85}`, '#fff', 1.4, 0.45, 'round');
    if (s > 22) {
        const claro = k === 'hielo' || k === 'plastico';
        forma(R(x + s * 0.09, y + s * 0.12, Math.max(3, s * 0.07), s * 0.5, Math.max(1.5, s * 0.035)), { f: '#fff', op: claro ? 0.6 : 0.3 });
        forma(E(x + s * 0.125, y + s * 0.7, Math.max(1.5, s * 0.035), Math.max(1.5, s * 0.035)), { f: '#fff', op: claro ? 0.5 : 0.22 });
    }
}

// Líquido en una caja de vidrio fino con la forma de la parte sumergida del cuerpo:
// mismo ancho y fondo que el bloque y la altura de lo que queda bajo el líquido.
function cajaLiquido(liq, x, yb, s, hh) {
    hh = hh == null ? s : hh;
    const dx = s * PDX, dy = s * PDY, y = yb - hh, ink = tinta();
    const sw = Math.max(2, Math.min(3, s / 26)), n = y + Math.min(4, hh * 0.08);
    const top = `M${x} ${y} L${x + dx} ${y + dy} L${x + s + dx} ${y + dy} L${x + s} ${y} Z`;
    const side = `M${x + s} ${y} L${x + s + dx} ${y + dy} L${x + s + dx} ${yb + dy} L${x + s} ${yb} Z`;
    if (hh > 0.5) {
        forma(side, { f: `g:${liq}-lado`, bb: [x + s, y + dy, dx, hh - dy] });
        forma(`M${x} ${n} L${x + dx} ${n + dy} L${x + s + dx} ${n + dy} L${x + s} ${n} Z`, { f: `g:${liq}-sup`, bb: [x, n + dy, s + dx, -dy] });
        forma(R(x, n, s, yb - n), { f: `g:${liq}-fondo`, bb: [x, n, s, yb - n] });
        linea(`M${x + s * 0.1} ${n + dy * 0.5} q${s * 0.2} ${-s * 0.03} ${s * 0.4} 0`, '#fff', 1.5, 0.75);
    }
    forma(top, { f: '#d8efff', fo: 0.06, s: ink, sw, lj: 'round' });
    forma(side, { s: ink, sw, lj: 'round' });
    forma(R(x, y, s, hh, 3), { s: ink, sw: sw + 1.2 });
    forma(R(x, y, s, hh, 3), { s: CF.vidrio, sw: Math.max(1, sw * 0.45), op: 0.9 });
    forma(top, { s: CF.vidrio, sw: Math.max(1, sw * 0.4), op: 0.7 });
    if (s > 22 && hh > 20) forma(R(x + s * 0.09, y + hh * 0.16, Math.max(3, s * 0.07), hh * 0.6, s * 0.035), { f: '#fff', op: 0.4 });
}

// ═════════ ARQUÍMEDES (huevo de pascua) ═════════
// Coordenadas locales 100 × 172: barbilla en y = 66, pies en y = 172.
function arquimedes(x, y, sc) {
    const ctx = cx2(), ink = tinta(), piel = 'g:piel';
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    const pielF = (d, bb, sw = 2.4) => forma(d, { f: piel, bb, s: ink, sw });
    const hoja = (cx, cy, ang, len, col) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang * Math.PI / 180);
        forma(`M0 0 Q${len * 0.5} ${-len * 0.36} ${len} 0 Q${len * 0.5} ${len * 0.36} 0 0Z`, { f: col, s: ink, sw: 1.5, lj: 'round' });
        forma(`M${len * 0.12} 0 H${len * 0.82}`, { s: '#2f5a1c', sw: 0.9, op: 0.7 });
        ctx.restore();
    };
    // piernas y sandalias
    [37, 53].forEach(lx => {
        pielF(R(lx, 148, 11, 20, 4), [lx, 148, 11, 20]);
        forma(R(lx - 3, 165, 17, 7, 3.5), { f: '#8a5a2b', s: ink, sw: 2.2 });
        forma(`M${lx + 1} 160 l9 -4 M${lx + 1} 154 l9 -4`, { s: '#8a5a2b', sw: 2.2, lc: 'round' });
    });
    // brazos (por detrás del manto)
    ['M27 92 Q16 112 18 132', 'M73 92 Q84 112 82 132'].forEach(d => {
        forma(d, { s: ink, sw: 15, lc: 'round' });
        forma(d, { s: '#f0c093', sw: 10, lc: 'round' });
    });
    pielF(E(18, 134, 6.5, 6.5), [11.5, 127.5, 13, 13]);
    pielF(E(82, 134, 6.5, 6.5), [75.5, 127.5, 13, 13]);
    // quitón: cuerpo acampanado con pliegues
    forma('M25 86 Q50 77 75 86 L82 150 Q66 156 50 154 Q34 156 18 150 Z', { f: 'g:toga', bb: [18, 77, 64, 79], s: ink, sw: 3, lj: 'round' });
    forma('M36 96 Q33 124 29 150 M46 98 Q45 126 44 154 M56 98 Q57 126 58 154 M66 96 Q69 124 72 150', { s: '#cdbd9c', sw: 1.8, lc: 'round' });
    forma('M18 150 Q34 156 50 154 Q66 156 82 150', { s: '#b59f78', sw: 2 });
    // manto (himatión) terracota con cenefa dorada
    forma('M26 86 Q38 82 46 88 L80 130 Q78 140 70 142 L30 100 Q24 94 26 86Z', { f: '#b5552e', s: ink, sw: 2.6, lj: 'round' });
    forma('M30 92 Q38 88 44 93 L76 132', { s: '#d97a4c', sw: 2, op: 0.9 });
    for (let i = 0; i < 7; i++) { const t = i / 6; forma(E(33 + t * 38, 100 + t * 38, 1.6, 1.6), { f: '#f2c94c' }); }
    // cuello
    forma('M43 64 h14 v14 q-7 4 -14 0Z', { f: '#e9b588', s: ink, sw: 2.4 });
    // orejas y cabeza (calva con brillo)
    pielF(E(27.5, 45, 5, 7), [22.5, 38, 10, 14]);
    pielF(E(72.5, 45, 5, 7), [67.5, 38, 10, 14]);
    pielF(E(50, 42, 22, 24), [28, 18, 44, 48], 3);
    ctx.save(); ctx.translate(42, 26); ctx.rotate(-22 * Math.PI / 180); forma(E(0, 0, 8, 4.5), { f: '#fff', op: 0.5 }); ctx.restore();
    // pelo blanco en mechones a los lados
    nube([[29, 34, 5], [27, 42, 5.5], [28, 50, 5]], '#f4f4ef', 2);
    nube([[71, 34, 5], [73, 42, 5.5], [72, 50, 5]], '#f4f4ef', 2);
    // barba rizada (nube) y bigote
    nube([[30, 54, 6], [32, 63, 7.5], [37, 71, 8], [44, 77, 8], [50, 79, 8], [56, 77, 8], [63, 71, 8], [68, 63, 7.5], [70, 54, 6]], '#f6f6f1', 2.4);
    forma(E(50, 64, 16, 11), { f: '#f6f6f1' });
    forma('M37 70 q2 3 0 5 M45 75 q2 3 0 5 M55 75 q-2 3 0 5 M63 70 q-2 3 0 5', { s: '#c9c9bf', sw: 1.5, lc: 'round' });
    // boca abierta (grita «¡Eureka!») y bigote encima
    forma(E(50, 63, 6, 5.5), { f: '#6b1f1a', s: ink, sw: 2 });
    forma(E(50, 66, 3.6, 2), { f: '#ff8f8f' });
    nube([[43.5, 56.5, 5], [56.5, 56.5, 5]], '#f6f6f1', 1.8);
    // nariz, ojos cerrados de alegría, cejas blancas y mejillas
    forma(E(50, 49, 4.2, 3.6), { f: '#e9a77a', s: ink, sw: 1.8 });
    forma('M37 43 q4.5 -5 9 0 M54 43 q4.5 -5 9 0', { s: ink, sw: 2.6, lc: 'round' });
    forma('M35 35 q6 -5 12 -1 M53 34 q6 -4 12 1', { s: ink, sw: 6, lc: 'round' });
    forma('M35 35 q6 -5 12 -1 M53 34 q6 -4 12 1', { s: '#f6f6f1', sw: 3.4, lc: 'round' });
    forma(E(34, 50, 4.5, 2.6), { f: '#f08a7a', op: 0.55 });
    forma(E(66, 50, 4.5, 2.6), { f: '#f08a7a', op: 0.55 });
    // corona de laurel: dos ramas que suben desde las orejas y casi se juntan delante
    [1, -1].forEach(sg => {
        const p0 = [50 - sg * 24, 40], p1 = [50 - sg * 27, 10], p2 = [50 - sg * 4, 19];
        forma(`M${p0[0]} ${p0[1]} Q${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`, { s: '#3f6e24', sw: 2.2, lc: 'round' });
        for (let i = 0; i < 7; i++) {
            const t = 0.06 + i * 0.14, u = 1 - t;
            const px = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], py = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
            const tx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]), ty = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
            const a = Math.atan2(ty, tx) * 180 / Math.PI;
            hoja(px, py, a - 38, 11, i % 2 ? '#5f9a3c' : '#7fbf4f');
            hoja(px, py, a + 38, 11, i % 2 ? '#7fbf4f' : '#5f9a3c');
        }
    });
    ctx.restore();
}

// ═════════ LA MANO QUE SUJETA (cursor «agarrar», dibujado como guante) ═════════
// (x, y) = punta de los nudillos
function manoAgarre(x, y, sc = 1) {
    const ctx = cx2(), ink = tinta();
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    forma(E(0, 2, 20, 5), { f: ink, op: 0.25 });
    forma(R(-13, -58, 26, 16, 5), { f: CF.cyan, s: ink, sw: 2.6 });
    forma('M-9 -54 h18', { s: '#bff0ff', sw: 2, lc: 'round', op: 0.8 });
    forma('M-16 -44 Q-17 -14 -14 -9 H14 Q17 -14 16 -44 Z', { f: '#ffffff', s: ink, sw: 2.8, lj: 'round' });
    [-12, -4, 4, 12].forEach((fx, i) => forma(R(fx - 4.4, -16, 8.8, i % 3 ? 17 : 15, 4.4), { f: '#ffffff', s: ink, sw: 2.4 }));
    forma('M-12 -9 v3 M-4 -8 v4 M4 -8 v4 M12 -9 v3', { s: '#c9d6e2', sw: 1.6, lc: 'round' });
    forma('M-16 -34 Q-27 -28 -22 -19 Q-18 -14 -10 -20', { f: '#ffffff', s: ink, sw: 2.6, lj: 'round' });
    forma('M-8 -40 Q0 -43 8 -40', { s: '#c9d6e2', sw: 1.8, lc: 'round' });
    forma(R(7, -40, 4, 18, 2), { f: '#ffffff', op: 0.9 });
    forma('M10 -40 V-22', { s: '#e3ecf4', sw: 2, lc: 'round' });
    forma('M-26 -50 l-6 -6 M26 -50 l6 -6 M-29 -38 h-8 M29 -38 h8', { s: '#bff0ff', sw: 2.4, lc: 'round' });
    ctx.restore();
}

// Flecha fina sobre el cuerpo del depósito: solo la letra, sin números
function flechaFina(xx, yy, len, dir, col, l, izq) {
    if (len < 3) return;
    const ink = CF.ink, hd = Math.min(11, len * 0.5), y2 = yy + dir * len, yh = y2 - dir * hd;
    forma(`M${xx} ${yy} V${yh}`, { s: ink, sw: 7.5, lc: 'round' });
    forma(`M${xx - hd * 0.7} ${yh} L${xx} ${y2 + dir * 1.5} L${xx + hd * 0.7} ${yh}Z`, { f: ink, s: ink, sw: 3, lj: 'round' });
    forma(`M${xx} ${yy} V${yh}`, { s: col, sw: 4, lc: 'round' });
    forma(`M${xx - hd * 0.55} ${yh} L${xx} ${y2} L${xx + hd * 0.55} ${yh}Z`, { f: col });
    T(izq ? xx - 9 : xx + 9, y2 - dir * 2 + (dir > 0 ? 0 : 10), l, { fs: 15, w: 700, c: col, a: izq ? 'end' : 'start', borde: ink, bw: 3.5 });
}

// ═════════ DEPÓSITO DE VIDRIO (12 × 6,5 × 11 dm) ═════════
// Frente: x0..x0+w, y0..y0+h. El fondo se desplaza (DX, DY) en la misma proyección que los bloques.
function geomDeposito(x0, y0) {
    const w = TW * ESC, h = TH * ESC, Dp = TD * ESC;
    return { w, h, Dp, DX: Dp * PDX, DY: Dp * PDY, x1: x0 + w, yF: y0 + h };
}
// est = { liq, nivel (dm), nivel0 (dm, sin cuerpo), cuerpo, mom, flechas, mano, burbujas, ondas, arq, t }
// cuerpo = { k, s, x, yb } (bloque) o { arq: true, ax, ay, sc } (Arquímedes)
function deposito(x0, y0, est) {
    const liq = est.liq, A = liqAspecto(liq), ink = CF.ink;
    const { w, h, DX, DY, x1, yF } = geomDeposito(x0, y0);
    const yA = yF - est.nivel * ESC, yA0 = yF - est.nivel0 * ESC;
    focoD(x0 + w / 2 + DX / 2, y0 + h * 0.5, w * 0.78, h * 0.7);
    // peana metálica y sombra
    sombraE(x0 + w / 2 + DX / 2, yF + 14, w + DX * 1.6);
    forma(P([x1 + 4, yF + 2], [x1 + DX + 4, yF + DY + 2], [x1 + DX + 4, yF + DY + 11], [x1 + 4, yF + 11]), { f: '#2a3e50', s: ink, sw: 2.5, lj: 'round' });
    forma(R(x0 - 4, yF + 1, w + 8, 11, 3), { f: 'g:cuerpoBal', bb: [x0 - 4, yF + 1, w + 8, 11], s: ink, sw: 2.5 });
    forma(R(x0, yF + 3, w, 2.5, 1.2), { f: '#9fb9cc', op: 0.55 });
    // interior en seco
    forma(R(x0 + DX, y0 + DY, w, h), { f: 'g:cubFondo', bb: [x0 + DX, y0 + DY, w, h] });
    forma(P([x0, y0], [x0 + DX, y0 + DY], [x0 + DX, yF + DY], [x0, yF]), { f: '#173d5e', op: 0.55 });
    // líquido por detrás: pared del fondo, lado izquierdo y suelo
    forma(R(x0 + DX, yA + DY, w, yF - yA), { f: `g:${liq}-fondo`, bb: [x0 + DX, yA + DY, w, yF - yA] });
    forma(P([x0, yA], [x0 + DX, yA + DY], [x0 + DX, yF + DY], [x0, yF]), { f: `g:${liq}-lado`, bb: [x0, yA + DY, DX, yF - yA - DY], op: 0.8 });
    const t = MOV_REDUCIDO ? 0 : est.t || 0;
    if (!A.opaco) {
        const suelo = P([x0, yF], [x0 + DX, yF + DY], [x1 + DX, yF + DY], [x1, yF]);
        forma(suelo, { f: A.suelo, op: 0.85 });
        recortar(suelo, () => {
            semilla = 7;
            for (let i = 0; i < 26; i++) {
                const cx = x0 + rnd() * (w + DX) + Math.sin(t * 0.7 + i) * 3, cy = yF + DY * rnd(), r = 6 + rnd() * 10;
                forma(`M${cx - r} ${cy} q${r * 0.5} ${-r * 0.35} ${r} 0 t${r} 0`, { s: A.cau, sw: 1 + rnd() * 1.2, op: 0.3 + rnd() * 0.35 });
            }
        });
    }
    // superficie (vista un poco desde arriba)
    forma(P([x0, yA], [x0 + DX, yA + DY], [x1 + DX, yA + DY], [x1, yA]), { f: `g:${liq}-sup`, bb: [x0, yA + DY, w + DX, -DY] });
    semilla = 3;
    for (let i = 0; i < 7; i++) {
        const f = 0.12 + rnd() * 0.76, g = rnd();
        forma(`M${x0 + w * f + DX * g} ${yA + DY * g} q${w * 0.03} -2.5 ${w * 0.06} 0`, { s: '#fff', sw: 1.5, op: 0.4 + rnd() * 0.4 });
    }
    // aristas del fondo: se dibujan ANTES del cuerpo, que las tapa
    const vid = (d, wi) => {
        forma(d, { s: ink, sw: wi + 3, lj: 'round', lc: 'round' });
        forma(d, { s: '#bdeef2', sw: wi, lj: 'round', lc: 'round' });
    };
    forma(`M${x0 + DX} ${yF + DY} V${y0 + DY} M${x0 + DX} ${yF + DY} H${x1 + DX}`, { s: '#a8e4ea', sw: 1.6, op: 0.45 });
    vid(`M${x0} ${y0} L${x0 + DX} ${y0 + DY} H${x1 + DX} V${yF + DY}`, 2.5);
    // ── el cuerpo ──
    const encima = [], c = est.cuerpo;
    let flechas = null, mano = null;
    if (c && c.arq && c.dentro) {
        arquimedes(c.ax, c.ay, c.sc);
        if (est.mano) mano = () => manoAgarre(c.ax + 62 * c.sc, c.ay + 14 * c.sc, 0.9);
        if (est.flechas) flechas = () => flechasCuerpo(c.ax + 50 * c.sc, c.ay + 120 * c.sc, est.flechas);
    } else if (c && !c.arq) {
        const { k, s, x, yb } = c, F = caras(x, yb, s), yl = yA + c.oy;
        if (yb >= yF + c.oy - 2.5) sombraE(x + s / 2 + s * PDX * 0.3, yb, s + s * PDX, 0.3);
        cubo(k, x, yb, s);
        if (est.mano) {
            const dd = `M${x} ${yb} V${yb - s} L${x + F.dx} ${yb - s + F.dy} H${x + s + F.dx} V${yb + F.dy} L${x + s} ${yb} Z`;
            forma(dd, { s: CF.cyan, sw: 7, lj: 'round', op: 0.35 });
            forma(dd, { s: '#bff0ff', sw: 2, lj: 'round' });
            mano = () => manoAgarre(x + s * 0.76 + F.dx * 0.5, yb - s + F.dy * 0.5 + 2, 1);
        }
        if (est.flechas) flechas = () => flechasCuerpo(x + s / 2, yb - s / 2, est.flechas);
        // parte sumergida teñida por el líquido
        const ys = Math.max(yl, yb - s);
        if (!A.opaco) {
            if (yb > ys) forma(R(x, ys, s, yb - ys), { f: A.tinte, op: 0.22 });
            if (yb > yl && yb - s < yl) encima.push(() => {
                linea(`M${x - 3} ${yl} H${x + s + 3}`, '#effaff', 2.2, 0.95);
                linea(`M${x + s} ${yl} L${x + s + F.dx} ${yl + F.dy}`, '#effaff', 1.8, 0.8);
            });
        } else if (yb > yl) {
            // mercurio: la superficie que queda delante del bloque lo tapa; contorno discontinuo de la parte oculta
            forma(P([x0, yA], [x0 + c.ox, yA + c.oy], [x1 + c.ox, yA + c.oy], [x1, yA]), { f: `g:${liq}-sup`, bb: [x0, yA + c.oy, w + c.ox, -c.oy] });
            encima.push(() => {
                forma(R(x, Math.max(yl, yb - s), s, yb - Math.max(yl, yb - s), 4), { s: '#24323f', sw: 2, dash: [6, 5], op: 0.8 });
                if (yb - s < yl) {
                    linea(`M${x - 3} ${yl} H${x + s + 3}`, '#ffffff', 2.4);
                    linea(`M${x + s} ${yl} L${x + s + F.dx} ${yl + F.dy}`, '#fff', 1.8, 0.9);
                }
            });
        }
    }
    // ondas al entrar en el líquido (la mitad de delante de cada anillo)
    (est.ondas || []).forEach(o => encima.push(() => {
        const ctx = cx2(), a0 = ctx.globalAlpha, yl = yA + o.oy;
        [[16, 6, 0.65], [34, 11, 0.4]].forEach(([a, b, op], j) => {
            const e = Math.min(1, o.edad / 1.4), crece = 0.4 + e * 1.1 - j * 0.15;
            if (crece <= 0) return;
            ctx.globalAlpha = a0 * op * (1 - e);
            ctx.beginPath(); ctx.ellipse(o.cx, yl - o.dx * 0.38, o.w / 2 + a * crece, o.dx * 0.4 + b * crece, 0, 0, Math.PI);
            ctx.strokeStyle = '#effaff'; ctx.lineWidth = 1.6; ctx.stroke();
        });
        ctx.globalAlpha = a0;
    }));
    // burbujas que suben mientras algo baja
    (est.burbujas || []).forEach(b => encima.push(() => forma(E(b.x, b.y, b.r, b.r), { f: 'rgba(212,241,255,.25)', s: '#effaff', sw: 1.1, op: b.op })));
    // líquido del frente y del lado derecho
    forma(P([x1, yA], [x1 + DX, yA + DY], [x1 + DX, yF + DY], [x1, yF]), { f: `g:${liq}-lado`, bb: [x1, yA + DY, DX, yF - yA - DY] });
    forma(R(x0, yA, w, yF - yA), { f: `g:${liq}-frente`, bb: [x0, yA, w, yF - yA] });
    if (A.opaco) { // brillo metálico del mercurio
        linea(`M${x0} ${yA + 14} H${x1}`, '#2f3943', 5, 0.35);
        linea(`M${x0} ${yA + 26} H${x1}`, '#fff', 2, 0.35);
        linea(`M${x0} ${yF - 22} H${x1}`, '#fff', 7, 0.14);
        linea(`M${x0} ${yA + 8} H${x1}`, '#fff', 3, 0.55);
        forma(`M${x0 + w * 0.08} ${yA + 20} L${x0 + w * 0.02} ${yF - 6} H${x0 + w * 0.1} L${x0 + w * 0.18} ${yA + 20}Z`, { f: '#fff', op: 0.28 });
        forma(`M${x0 + w * 0.55} ${yA + 16} L${x0 + w * 0.5} ${yF - 6} H${x0 + w * 0.53} L${x0 + w * 0.6} ${yA + 16}Z`, { f: '#fff', op: 0.22 });
    } else forma(`M${x0 + w * 0.18} ${yA + 6} L${x0 + w * 0.06} ${yF - 4} H${x0 + w * 0.13} L${x0 + w * 0.26} ${yA + 6} Z`, { f: '#fff', op: 0.05 });
    // momento clave: el líquido que el cuerpo ha apartado (franja entre las dos marcas)
    if (est.mom && !(c && c.arq) && yA0 - yA > 0.5) {
        forma(R(x0, yA, w, yA0 - yA), { f: THEME.cam || CF.cam, op: 0.26 * est.mom });
        forma(`M${x0} ${yA0} H${x1}`, { s: THEME.cam || CF.cam, sw: 2, dash: [7, 5], op: 0.9 * est.mom });
    }
    // menisco
    forma(`M${x0 + 3} ${yA - 3} Q${x0 + 8} ${yA} ${x0 + 18} ${yA} H${x1 - 18} Q${x1 - 8} ${yA} ${x1 - 3} ${yA - 3}`, { s: A.opaco ? '#ffffff' : '#e6f7ff', sw: 2.4 });
    linea(`M${x1} ${yA - 2} L${x1 + DX} ${yA + DY - 2}`, '#e6f7ff', 1.8, 0.8);
    encima.forEach(f => f());
    // vidrio con grosor: aristas de delante
    vid(`M${x1} ${y0} L${x1 + DX} ${y0 + DY}`, 2.5);
    vid(`M${x1 + DX} ${yF + DY} L${x1} ${yF}`, 2.5);
    forma(R(x0, y0, w, h, 6), { s: ink, sw: 6 });
    forma(R(x0 + 2.5, y0 + 2.5, w - 5, h - 5, 4), { s: '#9fdde6', sw: 3.5, op: 0.75 });
    forma(R(x0 + 5, y0 + 5, w - 10, h - 10, 3), { s: '#ffffff', sw: 1, op: 0.35 });
    forma(R(x0 - 1, y0 - 3, w + 2, 6, 3), { f: '#d4f6f8', s: ink, sw: 2.5 });
    // escala grabada en el vidrio (sin números)
    for (let i = 1; i < TH; i++) { const yy = yF - i * ESC; linea(`M${x1 - 6} ${yy} h-${i % 2 ? 7 : 13}`, '#d8efff', 1.6, 0.55); }
    recortar(R(x0, y0, w, h, 6), () => {
        forma(`M${x0 + w * 0.04} ${y0} L${x0 + w * 0.22} ${y0} L${x0 - w * 0.1} ${yF} L${x0 - w * 0.28} ${yF} Z`, { f: '#fff', op: 0.09 });
        forma(`M${x0 + w * 0.27} ${y0} L${x0 + w * 0.3} ${y0} L${x0 - w * 0.02} ${yF} L${x0 - w * 0.05} ${yF} Z`, { f: '#fff', op: 0.18 });
        forma(`M${x1 - w * 0.12} ${y0} L${x1 - w * 0.07} ${y0} L${x1 - w * 0.27} ${yF} L${x1 - w * 0.32} ${yF} Z`, { f: '#fff', op: 0.06 });
    });
    forma(R(x0 + 9, y0 + 14, 5, h * 0.4, 2.5), { f: '#fff', op: 0.45 });
    // ── Arquímedes: rebosa por el borde y forma un charco en la mesa ──
    if (est.arq) derrame(x0, y0, w, x1, yF, est.arq, est.liq);
    if (c && c.arq && !c.dentro) arquimedes(c.ax, c.ay, c.sc);   // fuera, junto al depósito
    if (flechas) flechas();
    if (mano) mano();
    return { yA, yA0, x1, yF, DX, DY };
}
// Flechas E, P, N y F sobre el cuerpo (longitudes a escala, sin números)
function flechasCuerpo(cx, cy, f) {
    const kt = 58 / Math.max(1, f.P + Math.max(0, f.F), f.E + f.N + Math.max(0, -f.F));
    const oE = f.N > 0 || f.F < 0 ? -7 : 0, oP = f.F > 0 ? -8 : 0;
    flechaFina(cx + oE, cy, f.E * kt, -1, CF.dE, 'E');
    flechaFina(cx + oP, cy, f.P * kt, 1, CF.dP, 'P', f.F > 0);
    if (f.N > 0) flechaFina(cx + 7, cy, f.N * kt, -1, CF.dN, 'N');
    if (f.F > 0) flechaFina(cx + 8, cy, f.F * kt, 1, CF.dF, 'F');
    if (f.F < 0) flechaFina(cx + 7, cy, -f.F * kt, -1, CF.dF, 'F');
    forma(E(cx, cy, 3.5, 3.5), { f: '#fff', s: CF.ink, sw: 2 });
}
// Arquímedes: chorros por el borde, charcos en la mesa y gotas
function derrame(x0, y0, w, x1, yF, a, liq) {
    const ink = CF.ink, col = (LIQS[liq] || LIQS.aguadulce).p === '#3a9be0' ? '#5ab4ef' : (LIQS[liq] || LIQS.aguadulce).p;
    const cx = x1 + 3, cy = y0 - 1, ch = a.chorro;
    if (ch > 0.02) {
        const ctx = cx2(), a0 = ctx.globalAlpha;
        ctx.globalAlpha = a0 * Math.min(1, ch);
        forma(`M${cx - 30} ${cy - 3} Q${cx - 6} ${cy - 10} ${cx + 4} ${cy} Q${cx + 14} ${cy + 40} ${cx + 10} ${yF + 6} L${cx + 3} ${yF + 6} Q${cx + 5} ${cy + 40} ${cx - 4} ${cy + 5} Z`, { f: col, op: 0.85, s: ink, sw: 2 });
        forma(`M${cx + 7} ${cy + 16} Q${cx + 10} ${cy + 60} ${cx + 8} ${yF - 10}`, { s: '#d4f1ff', sw: 1.6, op: 0.8 });
        forma(`M${x0 + 18} ${cy - 2} Q${x0 + 4} ${cy - 6} ${x0 - 3} ${cy + 6} Q${x0 - 9} ${cy + 60} ${x0 - 7} ${yF + 6} L${x0 - 1} ${yF + 6} Q${x0 - 3} ${cy + 50} ${x0 + 2} ${cy + 4}Z`, { f: col, op: 0.75, s: ink, sw: 1.8 });
        ctx.globalAlpha = a0;
    }
    if (a.charco > 0.01) {
        const e = Math.min(1, a.charco);
        forma(E(x1 + 30, yF + 22, 62 * e, 9 * Math.max(0.4, e)), { f: '#3a9be0', op: 0.75, s: ink, sw: 2 });
        forma(E(x1 + 22, yF + 20, 30 * e, 3), { f: '#d4f1ff', op: 0.6 });
        forma(E(x0 - 12, yF + 20, 30 * e, 6 * Math.max(0.4, e)), { f: '#3a9be0', op: 0.7, s: ink, sw: 1.8 });
    }
    (a.gotas || []).forEach(g => forma(E(g.x, g.y, g.r, g.r * 1.15), { f: '#8fd3f7', s: ink, sw: 1.4 }));
}
// Marcas del nivel a la izquierda del depósito (fuera del vidrio)
function marcas(x0, g, mom, litros) {
    const xm = x0 - 8, sep = Math.max(0, 16 - (g.yA0 - g.yA)), dim = THEME.textDim, txt = THEME.text;
    forma(`M${xm} ${g.yA0} h-16`, { s: dim, sw: 2, dash: [3, 3] });
    T(xm - 20, g.yA0 + 5 + sep / 2, i18n.t('sin bloque'), { fs: 12.5, a: 'end', c: dim, sys: true });
    if (g.yA0 - g.yA > 0.6) {
        linea(`M${xm} ${g.yA} h-16`, txt, 2.2);
        T(xm - 20, g.yA + 1 - sep / 2, i18n.t('con bloque'), { fs: 12.5, a: 'end', c: txt, sys: true });
    }
    if (mom && g.yA0 - g.yA > 0.6) {
        const ctx = cx2(), a0 = ctx.globalAlpha; ctx.globalAlpha = a0 * mom;
        forma(`M${xm - 2} ${g.yA + 2} V${g.yA0 - 2}`, { s: THEME.cam, sw: 3, lc: 'round' });
        T(xm - 20, g.yA0 + 27 + sep / 2, `+${fmtL(litros)} L`, { fs: 17, w: 700, a: 'end', c: THEME.cam });
        ctx.globalAlpha = a0;
    }
}
// Bocadillo «¡EUREKA!» (no se traduce), fuera del depósito, con la cola hacia la cabeza
function bocadillo(x, y, t0) {
    const ink = tinta(), e = salto(t0), ctx = cx2();
    ctx.save(); ctx.translate(x + 73, y + 25); ctx.scale(e, e); ctx.translate(-x - 73, -y - 25);
    forma(`M${x + 14} ${y} h118 a14 14 0 0 1 14 14 v8 l26 14 l-26 2 v4 a14 14 0 0 1 -14 14 h-118 a14 14 0 0 1 -14 -14 v-28 a14 14 0 0 1 14 -14Z`, { f: '#fff6d6', s: ink, sw: 3, lj: 'round' });
    T(x + 73, y + 37, '¡EUREKA!', { fs: 24, w: 700, a: 'middle', c: '#a5281b' });
    chispaD(x + 6, y - 4, 7); chispaD(x + 140, y + 64, 5);
    ctx.restore();
}

// ═════════ COLUMNA 2: el papel ═════════
function flechaPapel(x, y, len, dir, col, wd = 7) {  // dir −1 arriba, +1 abajo
    if (len < 1) return;
    const head = Math.min(18, len * 0.6), y2 = y + dir * len, yh = y2 - dir * head;
    forma(`M${x} ${y} V${yh}`, { s: col, sw: wd, lc: 'round' });
    forma(`M${x - head * 0.62} ${yh} L${x} ${y2} L${x + head * 0.62} ${yh} Z`, { f: col, s: col, sw: 2, lj: 'round' });
}
function papel(x, y, w, h) {
    const ink = tinta();
    forma(R(x + 4, y + 5, w, h, 20), { f: ink, op: THEME.fun ? 0.55 : 0 });
    forma(R(x, y, w, h, 20), { f: THEME.paper });
    recortar(R(x, y, w, h, 20), () => {
        let d = '';
        for (let gx = x + 20; gx < x + w; gx += 20) d += `M${gx} ${y + 3} V${y + h - 3}`;
        for (let gy = y + 20; gy < y + h; gy += 20) d += `M${x + 3} ${gy} H${x + w - 3}`;
        linea(d, THEME.paperGrid, 1);
    });
    forma(R(x, y, w, h, 20), { s: THEME.paperLine, sw: THEME.fun ? 3 : 1.5 });
}
// d = { k, liq, nomLiq, P, E, N, F, frac, Vsub, arq, mom, quieto, cae, fondo, neutro, m }
function papelFuerzas(x, y, w, h, d, m) {
    const pi = THEME.paperInk, dim = THEME.paperDim, cam = THEME.cam;
    T(x + 20, y + 76, i18n.t('flechas a escala · g = 9,8 N/kg'), { fs: 13, c: dim, sys: true });
    const mid = x + w * 0.54, cA = x + (mid - x) / 2 + 8, cB = mid + (x + w - mid) / 2;
    forma(`M${mid} ${y + 96} V${y + h - 110}`, { s: dim, sw: 1.6, dash: [5, 5], op: 0.7 });
    T(cA, y + 104, i18n.t(d.arq ? 'sobre Arquímedes' : 'sobre el bloque'), { fs: 15, w: 600, a: 'middle', c: pi, sys: true });
    T(cB, y + 104, i18n.t('el líquido apartado'), { fs: 15, w: 600, a: 'middle', c: pi, sys: true });
    const Fd = Math.max(0, d.F), Fu = Math.max(0, -d.F);
    const max = Math.max(1, d.P + Fd, d.E + d.N + Fu), Lmax = m ? 88 : 96, k = Lmax / max, cy = y + (m ? 222 : 232);
    const bs = m ? 54 : 58, ctx = cx2(), a0 = ctx.globalAlpha;
    if (d.mom) {
        ctx.globalAlpha = a0 * d.mom;
        forma(R(cA - 28, cy - d.E * k - 14, 56, d.E * k + d.P * k + 28, 28), { f: cam, op: 0.38 });
        ctx.globalAlpha = a0;
    }
    if (d.arq) arquimedes(cA - 50 * 0.5, cy - 95 * 0.5, 0.5);
    else cubo(d.k, cA - bs * 0.5 - bs * PDX * 0.5, cy + bs * 0.5 - bs * PDY * 0.5, bs);
    const offE = d.N > 0 || Fu > 0 ? -11 : 0, offP = Fd > 0 ? -11 : 0;
    flechaPapel(cA + offE, cy, d.E * k, -1, THEME.pE);
    flechaPapel(cA + offP, cy, d.P * k, 1, THEME.pP);
    if (d.N > 0) flechaPapel(cA + 11, cy, d.N * k, -1, THEME.pN);
    if (Fd > 0) flechaPapel(cA + 11, cy, Fd * k, 1, THEME.pF);
    if (Fu > 0) flechaPapel(cA + 11, cy, Fu * k, -1, THEME.pF);
    forma(E(cA, cy, 5, 5), { f: pi, s: THEME.paper, sw: 2 });
    const lab = (t, v, yy, col, al, xx) => { T(xx, yy, t, { fs: 18, w: 700, a: al, c: col }); T(xx, yy + 20, v, { fs: 16, w: 600, a: al, c: col }); };
    const xl = cA - bs / 2 - 12;
    if (d.E > 0.5) lab('E', `${miles(d.E)} N`, cy - Math.max(d.E * k, bs / 2 + 16) + 10, THEME.pE, 'end', xl);
    lab('P', `${miles(d.P)} N`, cy + Math.max(d.P * k, bs / 2 + 34) - 18, THEME.pP, 'end', xl);
    if (d.N > 0) lab('N', `${miles(d.N)} N`, cy - d.N * k + 10, THEME.pN, 'start', cA + 24);
    if (Fd > 0) lab(i18n.t('F (mano)'), `${miles(Fd)} N`, cy + Math.max(Fd * k, bs / 2 + 34) - 18, THEME.pF, 'start', cA + bs / 2 + 14);
    if (Fu > 0) lab(i18n.t('F (mano)'), `${miles(Fu)} N`, cy - Math.max(Fu * k, bs / 2 + 16) + 10, THEME.pF, 'start', cA + bs / 2 + 14);
    // el líquido apartado: con la forma de la parte sumergida (mismo ancho y fondo, altura de lo sumergido)
    const hh = bs * d.frac;
    if (d.mom) {
        ctx.globalAlpha = a0 * d.mom;
        forma(R(cB - 28, cy - Math.max(8, hh) * 0.5 - 22, 56, d.E * k + Math.max(8, hh) * 0.5 + 36, 28), { f: cam, op: 0.38 });
        ctx.globalAlpha = a0;
    }
    if (d.frac > 0.002) {
        cajaLiquido(d.liq, cB - bs * 0.5 - bs * PDX * 0.5, cy + Math.max(8, hh) * 0.5 - bs * PDY * 0.5, bs, Math.max(8, hh));
        flechaPapel(cB, cy, d.E * k, 1, THEME.pP);
        forma(E(cB, cy, 5, 5), { f: pi, s: THEME.paper, sw: 2 });
    } else T(cB, cy + 5, i18n.t('(nada todavía)'), { fs: 14, a: 'middle', c: dim, sys: true });
    const yt = cy + Math.max(d.E * k, 30) + 28;
    T(cB, yt, i18n.t('{v} L de {l}', { v: fmtL(d.Vsub), l: d.nomLiq }), { fs: 14, w: 600, a: 'middle', c: pi, sys: true });
    T(cB, yt + 22, i18n.t('pesan {e} N', { e: miles(d.E) }), { fs: 17, w: 700, a: 'middle', c: THEME.pP });
    // conclusión al pie del papel
    const fy = y + h - (m ? 90 : 92);
    linea(`M${x + 20} ${fy} H${x + w - 20}`, dim, 1.5, 0.6);
    T(x + w / 2, fy + 30, i18n.t('Empuje = peso del líquido apartado'), { fs: m ? 16.5 : 18, w: 700, a: 'middle', c: pi });
    if (d.mom && d.fin) {
        const fw = anchoT(d.fin, { fs: 15, w: 600 }) + 34, hund = d.fondo;
        ctx.globalAlpha = a0 * d.mom;
        pildora(x + w / 2 - fw / 2, fy + 44, fw, 30, hund ? '#ffe1cc' : '#fff3b8', hund ? '#a24a1c' : '#8a6d00', 2);
        T(x + w / 2, fy + 64, d.fin, { fs: 15, w: 600, a: 'middle', c: hund ? '#8a3a10' : '#5c4800' });
        ctx.globalAlpha = a0;
    } else if (d.neta) T(x + w / 2, fy + 62, d.neta, { fs: 13.5, a: 'middle', c: dim, sys: true });
}
// ¿De dónde sale el empuje? El líquido empuja cada cara del bloque, y más cuanto más hondo.
// d = { k, lado (m), hTop (m, profundidad de la cara de arriba; < 0 si asoma), rl (kg/m³) }
function papelPresion(x, y, w, h, d, m) {
    const pi = THEME.paperInk, dim = THEME.paperDim, cP = THEME.pE, cL = THEME.pLado;
    const side = d.lado, area = side * side, rl = d.rl;
    const hTop = Math.max(0, d.hTop), hBot = d.hTop + side;
    const pTop = rl * G * hTop, pBot = rl * G * Math.max(0, hBot);
    const FT = pTop * area, FB = pBot * area;
    const L = m ? 128 : 140, cx = x + (m ? 150 : 160), escD = L / side;   // px por metro de profundidad
    // si el bloque asoma, la superficie baja para que su cara de arriba no se salga del papel
    const ys = y + (m ? 100 : 104) + Math.max(0, -d.hTop) * escD, fuera = d.hTop < 0;
    const yT = ys + d.hTop * escD, yB = yT + L, xl = cx - L / 2, xr = cx + L / 2;
    const kp = (m ? 50 : 58) / Math.max(1, rl * G * Math.max(hBot, side));
    const fondoY = Math.min(y + h - (m ? 112 : 116), Math.max(yB + (m ? 64 : 70), ys + 40));
    // líquido (corte) y su superficie
    recortar(R(x + 14, y + 60, w - 28, fondoY - y - 60, 8), () => {
        forma(R(x + 14, ys, w - 28, fondoY - ys, 8), { f: THEME.cortePres, op: 0.55 });
        let ola = `M${x + 14} ${ys} q12 -4 24 0`;
        for (let i = 0; i < 14; i++) ola += ' t24 0';
        linea(ola, cP, 2.4);
    });
    if (fuera) T(x + 20, ys - 8, i18n.t('superficie'), { fs: 13, c: cP, w: 600, sys: true });
    else T(x + w - 22, ys - 8, i18n.t('superficie'), { fs: 13, a: 'end', c: cP, w: 600, sys: true });
    // regla de profundidad a la izquierda
    if (yB > ys) {
        linea(`M${x + 30} ${ys} V${Math.min(yB, fondoY)}`, pi, 1.6);
        if (yT >= ys) linea(`M${x + 25} ${yT} h10`, pi, 1.6);
        linea(`M${x + 25} ${yB} h10`, pi, 1.6);
        if (yT >= ys) T(x + 38, yT + (yT - ys < 16 ? 14 : -4), `${fmt(hTop * 100, 0)} cm`, { fs: 12.5, c: pi, sys: true });
        T(x + 38, yB - 4, `${fmt(Math.max(0, hBot) * 100, 0)} cm`, { fs: 12.5, c: pi, sys: true });
    }
    // el bloque en corte (de frente)
    forma(R(xl, yT, L, L, 5), { f: `g:${d.k}-f`, bb: [xl, yT, L, L], s: tinta(), sw: 3.5 });
    forma(R(xl + 8, yT + 10, 7, L * 0.5, 3.5), { f: '#fff', op: 0.3 });
    // flechas de presión: crecen con la profundidad (p = ρ · g · h)
    const fp = (x1, y1, dx, dy, len, col) => {
        if (len < 2) { forma(E(x1, y1, 2, 2), { f: col }); return; }
        const ux = dx, uy = dy, hd = Math.min(9, len * 0.55), x2 = x1 + ux * len, y2 = y1 + uy * len, bx = x2 - ux * hd, by = y2 - uy * hd;
        forma(`M${x1} ${y1} L${bx} ${by}`, { s: col, sw: 3.2, lc: 'round' });
        forma(`M${bx - uy * hd * 0.6} ${by + ux * hd * 0.6} L${x2} ${y2} L${bx + uy * hd * 0.6} ${by - ux * hd * 0.6}Z`, { f: col });
    };
    for (let i = 0; i < 5; i++) {
        const xx = xl + L * (i + 0.5) / 5;
        if (d.hTop >= 0) fp(xx, yT - pTop * kp - 4, 0, 1, pTop * kp, cP);
        if (hBot > 0) fp(xx, yB + pBot * kp + 4, 0, -1, pBot * kp, cP);
    }
    for (let i = 0; i < 4; i++) {
        const hh = d.hTop + side * (i + 0.5) / 4;
        if (hh <= 0) continue;
        const yy = yT + L * (i + 0.5) / 4, pp = rl * G * hh;
        fp(xl - pp * kp - 4, yy, 1, 0, pp * kp, cL);
        fp(xr + pp * kp + 4, yy, -1, 0, pp * kp, cL);
    }
    // rótulos de las dos caras
    const rx = x + w - 20;
    const yA = fuera ? yT - 30 : yT + 18;                   // si asoma, el rótulo de arriba va por encima
    T(rx, yA, i18n.t('arriba'), { fs: 14, w: 600, a: 'end', c: pi, sys: true });
    T(rx, yA + 20, fuera ? i18n.t('fuera: 0 N') : `${miles(FT)} N ↓`, { fs: 17, w: 700, a: 'end', c: cP });
    const yAb = yB - Math.max(yT, ys) < 56 ? yB + 22 : yB - 24;   // poca parte dentro: el rótulo va debajo
    T(rx, yAb, i18n.t('abajo'), { fs: 14, w: 600, a: 'end', c: pi, sys: true });
    T(rx, yAb + 20, `${miles(FB)} N ↑`, { fs: 17, w: 700, a: 'end', c: cP });
    if (yB - Math.max(yT, ys) > 80) T(rx, (Math.max(yT, ys) + yB) / 2 + 5, i18n.t('lados: se anulan'), { fs: 13, a: 'end', c: dim, sys: true });
    // conclusión
    const fy = y + h - (m ? 104 : 108);
    linea(`M${x + 20} ${fy} H${x + w - 20}`, dim, 1.5, 0.6);
    T(x + w / 2, fy + 28, `E = ${miles(FB)} − ${miles(FT)} = ${miles(FB - FT)} N`, { fs: m ? 17 : 19, w: 700, a: 'middle', c: cP });
    T(x + w / 2, fy + 52, i18n.t('Abajo el líquido empuja más que arriba.'), { fs: m ? 13.5 : 14.5, a: 'middle', c: pi, sys: true });
    T(x + w / 2, fy + 72, i18n.t(d.hTop >= 0 ? 'Si baja más, las dos crecen igual: E no cambia.' : 'Mientras entra, E crece. Cubierto, ya no.'), { fs: m ? 13.5 : 14.5, w: 700, a: 'middle', c: pi, sys: true });
}

// ═════════ TIRA INFERIOR: regla de densidades en dos tramos ═════════
// d = { rb, rl, k, liq, nomLiq, nomR, brillo }
function regla(g, m, d) {
    const { x, y, w, h } = g, ink = tinta(), pi = THEME.paperInk, gris = THEME.paperDim;
    forma(R(x + 4, y + 5, w, h, 16), { f: ink, op: THEME.fun ? 0.55 : 0 });
    forma(R(x + 1, y + 1, w - 2, h - 2, 16), { f: THEME.paper, s: THEME.paperLine, sw: THEME.fun ? 3 : 1.5 });
    const gx0 = x + (m ? 26 : 236), gx1 = x + w - (m ? 26 : 40), ly = y + (m ? 96 : 62), W = gx1 - gx0, cut = 0.6, gap = 14;
    // dos tramos: 0–2 kg/L ampliado y 2–20 kg/L comprimido (se avisa)
    const X = (r) => r <= 2 ? gx0 + W * cut * r / 2 : gx0 + W * cut + gap + (W * (1 - cut) - gap) * (Math.min(r, 20) - 2) / 18;
    if (!m) {
        T(x + 22, y + 34, i18n.t('Densidad'), { fs: 19, w: 700, c: pi });
        T(x + 22, y + 54, i18n.t('en kg/L (= g/cm³)'), { fs: 13, c: gris, sys: true });
        forma(R(x + 22, y + 70, 14, 12, 3), { f: THEME.franjaF, s: THEME.tintaF, sw: 1.2 });
        T(x + 42, y + 81, i18n.t('flotan en {l}', { l: d.nomLiq }), { fs: 13, w: 600, c: THEME.tintaF, sys: true });
        forma(R(x + 22, y + 92, 14, 12, 3), { f: THEME.franjaH, s: THEME.tintaH, sw: 1.2 });
        T(x + 42, y + 103, i18n.t('se hunden en {l}', { l: d.nomLiq }), { fs: 13, w: 600, c: THEME.tintaH, sys: true });
    } else T(x + 16, y + 26, i18n.t('Densidad (kg/L)'), { fs: 16, w: 700, c: pi });
    const xl = X(d.rl), fin = X(20);
    forma(R(gx0, ly - 18, xl - gx0, 18, 5), { f: THEME.franjaF });
    forma(R(xl, ly - 18, fin - xl, 18, 5), { f: THEME.franjaH });
    // corte de escala
    const xc = gx0 + W * cut + gap / 2;
    linea(`M${gx0} ${ly} H${xc - 5}`, pi, 2.5, 1, 'round');
    linea(`M${xc + 5} ${ly} H${fin}`, pi, 2.5, 1, 'round');
    linea(`M${xc - 8} ${ly + 7} l6 -14 M${xc + 2} ${ly + 7} l6 -14`, pi, 2);
    T(xc + 12, ly + (m ? 38 : 52), i18n.t('escala comprimida'), { fs: 12, w: 700, c: THEME.aviso, sys: true });
    [0, 0.5, 1, 1.5, 2, 5, 10, 15, 20].forEach(t => {
        const xx = X(t);
        linea(`M${xx} ${ly} v${t % 1 ? 5 : 9}`, pi, 1.5);
        if (t % 1 === 0) T(xx, ly + 21, fmt(t, 0), { fs: 12.5, w: 600, a: 'middle', c: pi, sys: true });
    });
    // el líquido: línea de su color que separa las dos zonas
    const pl = (LIQS[d.liq] || LIQS.aguadulce).p, claro = pl === '#d9ecf5' || pl === '#e3edf4';
    linea(`M${xl} ${ly - 28} V${ly + 8}`, claro ? '#7fa7bd' : d.liq === 'mercurio' ? '#6f7a86' : pl, 4, 1, 'round');
    forma(`M${xl} ${ly - 40} q-6 8 0 12 q6 -4 0 -12Z`, { f: pl, s: ink, sw: 1.5 });
    // materiales sobre la regla (cubitos) y su nombre
    ORDEN.slice(0, 8).forEach(k => {
        const xx = X(MATS[k].r), on = d.k === k, c = on ? 13 : 10;
        cubo(k, xx - c * 0.67, ly - (on ? 3 : 2), c);
        const fila = { madera: 1, plastico: 1 }[k] || 0;
        if (!m) T(xx, ly + 37 + fila * 15, i18n.t(MATS[k].n), { fs: 12.5, w: on ? 700 : 400, a: 'middle', c: on ? pi : gris, sys: true });
    });
    // nombre del líquido junto a su línea, del lado contrario al puntero
    const xp = X(d.rb), lab = fmt(d.rb, 2), lwp = anchoT(lab, { fs: 14, w: 700 }) + 18, der = xp <= xl;
    const xlab = der ? Math.max(xl + 10, xp + lwp / 2 + 8) : Math.min(xl - 10, xp - lwp / 2 - 8);
    T(xlab, ly - 30, d.nomR, { fs: 12.5, w: 700, a: der ? 'start' : 'end', c: d.liq === 'mercurio' ? THEME.tintaMercurio : THEME.tintaAgua, sys: true });
    // puntero del bloque actual
    const py = ly - (m ? 60 : 54);
    pildora(xp - lwp / 2, py, lwp, 26, CF.cyan, ink, 2);
    T(xp, py + 18, lab, { fs: 14, w: 700, a: 'middle', c: CF.ink });
    forma(`M${xp - 6} ${py + 26} L${xp} ${py + 34} L${xp + 6} ${py + 26} Z`, { f: CF.cyan, s: ink, sw: 1.8, lj: 'round' });
    if (d.brillo) {
        forma(E(xp, ly - 8, 14, 14), { s: THEME.cam, sw: 3 });
        chispaD(xp + 20, ly - 20, 6);
    }
}
