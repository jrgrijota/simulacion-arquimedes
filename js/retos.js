// ═══════════════════════════════════════════════════════════════════
//  RETOS Y ÁLBUM «ALGO QUE FLOTE EN…» (opcionales)
//
//  Ocultos por defecto: el botón «★ Retos» los despliega (o ?retos=1 en la
//  dirección). Lo conseguido se guarda en este navegador con localStorage
//  (sin cookies y sin enviar nada a ningún sitio). «Borrar lo conseguido»
//  lo vacía. La escena avisa con retosQuieto() cuando el cuerpo se queda
//  quieto, con retosHecho() y con retosSecreto() (¡Eureka!).
// ═══════════════════════════════════════════════════════════════════

const RETOS_CLAVE = 'simulaciencia-arquimedes-retos';

const RETOS = [
    { id: 'mitad', txt: 'Haz que un bloque flote con más de la mitad fuera del líquido' },
    { id: 'neutro', txt: 'Consigue un bloque que ni flote ni se hunda' },
    { id: 'hierro', txt: 'Haz flotar un bloque de hierro' },
    { id: 'hielo', txt: 'Encuentra un líquido en el que el hielo se hunda' },
    { id: 'profundo', txt: 'Mira cómo baja un bloque que se hunde: ¿cambia el empuje?', pista: 'Con las fuerzas a la vista, abre «¿De dónde sale el empuje?» mientras baja.' },
];
const ALBUM = ['gasolina', 'etanol', 'aceite', 'aguadulce', 'aguamar', 'glicerina', 'mercurio'];

const ALMACEN = crearAlmacen(RETOS_CLAVE, () => ({ sellos: {}, hechos: {}, secreto: false }));   // js/escena-comun.js
let retosDatos = ALMACEN.leer();
if (!retosDatos.sellos) retosDatos.sellos = {};
if (!retosDatos.hechos) retosDatos.hechos = {};
let selloNuevo = null;

function guardarRetos() { ALMACEN.guardar(retosDatos); pintarRetos(); }
function retosHecho(id) {
    if (retosDatos.hechos[id]) return;
    retosDatos.hechos[id] = true;
    guardarRetos();
}
function retosSecreto() {
    if (retosDatos.secreto) return;
    retosDatos.secreto = true; selloNuevo = 'secreto';
    guardarRetos();
}
// d = { k, arq, res, frac, liq }: el cuerpo se ha quedado quieto
function retosQuieto(d) {
    if (d.res === 'flota' && !d.arq && d.frac < 0.5) retosHecho('mitad');
    if (d.res === 'neutro') retosHecho('neutro');
    if (d.k === 'hierro' && d.res === 'flota') retosHecho('hierro');
    if (d.k === 'hielo' && d.res === 'hunde') retosHecho('hielo');
    if (d.res === 'flota' && d.liq && ALBUM.includes(d.liq) && !retosDatos.sellos[d.liq]) {
        retosDatos.sellos[d.liq] = true; selloNuevo = d.liq;
        guardarRetos();
    }
}

function pintarRetos() {
    const lista = document.getElementById('lista-retos');
    if (!lista) return;
    const modo = document.getElementById('retos-modo');
    if (modo) modo.textContent = '· ' + i18n.t('Principio de Arquímedes');
    lista.innerHTML = '';
    RETOS.forEach(r => {
        const hecho = !!retosDatos.hechos[r.id];
        const txt = i18n.t(r.txt);
        const li = document.createElement('li');
        li.className = hecho ? 'hecho' : '';
        li.style.setProperty('--progreso', hecho ? '1' : '0');
        li.innerHTML = `<span class="anillo" aria-hidden="true"></span><span class="reto-txt"></span><span class="reto-estrella" aria-hidden="true">${hecho ? '★' : '☆'}</span>`;
        li.querySelector('.reto-txt').textContent = txt;
        if (r.pista && !hecho) { const s = document.createElement('small'); s.className = 'reto-pista'; s.textContent = i18n.t(r.pista); li.querySelector('.reto-txt').appendChild(document.createElement('br')); li.querySelector('.reto-txt').appendChild(s); }
        li.setAttribute('aria-label', txt + ' · ' + i18n.t(hecho ? 'conseguido' : 'pendiente'));
        lista.appendChild(li);
    });
    // Álbum en miniatura: un sello por líquido (↑ = algo ha flotado en él) y un sello secreto
    const mini = document.getElementById('album-mini');
    mini.innerHTML = '';
    let n = 0;
    ALBUM.forEach(k => {
        const ok = !!retosDatos.sellos[k];
        if (ok) n++;
        const el = document.createElement('span');
        el.className = 'sello' + (ok ? ' ganado' : '') + (k === selloNuevo ? ' nuevo' : '');
        el.style.setProperty('--col', LIQS[k].p);
        el.textContent = ok ? '↑' : '?';
        el.title = i18n.t(LIQS[k].n) + ' · ' + i18n.t(ok ? 'algo ha flotado' : 'pendiente');
        mini.appendChild(el);
    });
    const sec = document.createElement('span');
    sec.className = 'sello secreto' + (retosDatos.secreto ? ' ganado' : '') + (selloNuevo === 'secreto' ? ' nuevo' : '');
    sec.style.setProperty('--col', '#ffd84a');
    sec.textContent = retosDatos.secreto ? '!' : '?';
    sec.title = retosDatos.secreto ? i18n.t('¡Eureka!') : i18n.t('Sello secreto');
    mini.appendChild(sec);
    document.getElementById('album-cuenta').textContent = `${n} / ${ALBUM.length}`;
    const nota = document.getElementById('nota-album');
    if (nota) nota.textContent = selloNuevo === 'secreto'
        ? i18n.t('¡Sello secreto! Arquímedes ha hecho rebosar el depósito.')
        : selloNuevo ? i18n.t('Sello nuevo: algo flota en {l}. Cada líquido se gana al ver flotar un bloque en él.', { l: i18n.t(LIQS[selloNuevo].n).toLowerCase() })
        : i18n.t('Cada líquido se gana al ver flotar un bloque en él.');
}

function pintarAlbum() {
    const tabla = document.getElementById('album-tabla');
    let h = '<div class="mat-fila">';
    ALBUM.forEach(k => {
        const ok = !!retosDatos.sellos[k];
        h += `<div class="mat-celda"><span class="sello grande${ok ? ' ganado' : ''}" style="--col:${LIQS[k].p}">${ok ? '↑' : '?'}</span>` +
             `<strong>${i18n.t(LIQS[k].n)}</strong><small>${i18n.num(LIQS[k].r, 3)} kg/L · ${i18n.t(ok ? 'algo ha flotado' : 'pendiente')}</small></div>`;
    });
    const ok = !!retosDatos.secreto;
    h += `<div class="mat-celda"><span class="sello grande secreto${ok ? ' ganado' : ''}" style="--col:#ffd84a">${ok ? '!' : '?'}</span>` +
         `<strong>${i18n.t(ok ? '¡Eureka!' : 'Sello secreto')}</strong><small>${i18n.t(ok ? 'Arquímedes hizo rebosar el depósito' : 'pendiente')}</small></div>`;
    tabla.innerHTML = h + '</div>';
}

document.addEventListener('DOMContentLoaded', () => iniciarPanelRetos({
    pintar: pintarRetos,
    pintarAlbum,
    alBorrar: () => { retosDatos = ALMACEN.vacio(); selloNuevo = null; pintarRetos(); },
}, ALMACEN));
