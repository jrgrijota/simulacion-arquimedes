# Principio de Arquímedes — Simulación Interactiva

Simulación para **Física y Química de ESO y Bachillerato** sobre la flotabilidad, dibujada como
una escena: un bloque cae en un depósito de vidrio con líquido, el nivel sube con los litros que
aparta, y al lado se ven las fuerzas a escala junto al líquido apartado. Una regla compara la
densidad del bloque con la del líquido.

## Modos

- **Valores libres:** ajusta con los deslizadores la masa y el volumen del bloque y la densidad
  del líquido, y observa cuándo flota, se hunde o ni flota ni se hunde.
- **Materiales reales:** elige uno de 8 materiales (corcho, madera, hielo, plástico, aluminio,
  hierro, plomo y oro; 100 L cada uno) y uno de 7 líquidos (gasolina, etanol, aceite, agua dulce,
  agua de mar, glicerina y mercurio). El último «material» es Arquímedes: el depósito está lleno
  hasta el borde y, al meterse, rebosa el agua que aparta (¡Eureka!).

Además:

- **La mano:** arrastra el bloque con el ratón, el dedo o las flechas del teclado. Mientras lo
  sujetas aparece la fuerza de tu mano (F).
- **¿De dónde sale el empuje?:** pestaña con las presiones sobre las caras del bloque.
- **Interruptor Fuerzas** (tecla F): oculta flechas y newtons para centrarse en el dibujo
  (pensado para 2.º y 3.º de ESO). El panel habla entonces de densidades y litros.
- **Retos y álbum** (opcionales, botón «★ Retos»): se guardan solo en el navegador.

## Uso

Abre `index.html` en un navegador (con `?lang=en`, la interfaz se muestra en inglés, con `?lang=ca`, en catalán, con `?lang=eu`, en euskera, y con `?lang=gl`, en gallego). No necesita instalación ni conexión: incluye
[p5.js](https://p5js.org/) en `js/vendor/`. Tiene temas SimulaCiencia, oscuro, claro y alto
contraste (botón del engranaje).

Parámetros de la dirección: `modo` (`libre` o `materiales`), `masa`, `volumen`, `densidad`,
`material`, `liquido`, `fuerzas` (`0` o `1`), `presion=1`, `retos=1`, `tema` y `lang`.

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Cabecera, mandos y paneles de ayuda y retos |
| `css/escena-comun.css`, `js/escena-comun.js` | Módulo común de las escenas de SimulaCiencia (no se edita aquí) |
| `css/escena.css` | Estilos propios de esta escena |
| `js/dibujo.js` | Datos de materiales y líquidos y dibujo: depósito, bloque, Arquímedes, papel y regla |
| `js/escena.js` | Estado, física del bloque, mano, panel y arranque |
| `js/retos.js` | Retos y álbum «Algo que flote en…» |
| `js/i18n*.js` | Traducciones (en, ca, eu, gl) |
| `js/estadisticas.js` | Recuento anónimo de visitas (GoatCounter, sin cookies) |

## Licencia

Código bajo licencia MIT (`LICENSE`); contenidos didácticos bajo CC BY-SA 4.0
(`LICENSE-CONTENT.md`). Forma parte de [SimulaCiencia](https://simulaciencia.es).
