# Principio de Arquímedes — Simulación Interactiva

Simulación para **Física y Química de ESO y Bachillerato** sobre la flotabilidad: un bloque
dentro de un tanque de líquido, con el peso, el empuje y la fuerza neta en cada instante.

## Modos

- **Valores libres:** ajusta con los deslizadores la masa y el volumen del bloque y la densidad
  del líquido, y observa cuándo flota, se hunde o queda en equilibrio.
- **Materiales reales:** elige uno de 8 materiales (corcho, madera, hielo, plástico, aluminio,
  hierro, plomo y oro; 100 L cada uno) y uno de 7 líquidos (gasolina, etanol, aceite, agua dulce,
  agua de mar, glicerina y mercurio).

En los dos modos puedes abrir el **diagrama de cuerpo libre**, con las fuerzas que actúan sobre
el bloque dibujadas a escala.

## Uso

Abre `index.html` en un navegador (con `?lang=en`, la interfaz se muestra en inglés, y con `?lang=ca`, en catalán). No necesita instalación ni conexión: incluye
[p5.js](https://p5js.org/) en `js/vendor/`. Tiene temas oscuro, claro y alto contraste
(botón del engranaje).

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Panel de controles y métricas |
| `css/style.css` | Estilos y temas |
| `js/sketch.js` | Física del bloque, dibujo del tanque y diagrama de cuerpo libre |
| `js/estadisticas.js` | Recuento anónimo de visitas (GoatCounter, sin cookies) |

## Licencia

Código bajo licencia MIT (`LICENSE`); contenidos didácticos bajo CC BY-SA 4.0
(`LICENSE-CONTENT.md`). Forma parte de [SimulaCiencia](https://simulaciencia.es).
