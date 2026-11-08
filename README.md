# 🏡 Nuestro Nido

App para planear la independencia en pareja con un **bote común** (el 100% de los ingresos de los dos en una sola cuenta).

## Qué hace
- 💬 **Plan**: cuestionario en 8 categorías con notas y avance.
- 🫙 **Bote**: reparte el ingreso de los dos en sobres (renta, súper, fondo de emergencia, metas, gustitos de cada quien…).
- 🧾 **Gastos**: registro de gastos y apartados por mes, con barras por sobre.
- 🎯 **Metas**: cuánto apartar al mes para llegar a cada meta en su fecha.
- 📄 **PDF**: exporta un resumen con todo.
- 💾 **Respaldo**: guarda y carga un archivo `.json` para pasar los datos a otro teléfono.

## Privacidad
Los datos se guardan **solo en el teléfono** (localStorage). Nada se sube a este repositorio ni a ningún servidor.

## Instalar en el teléfono
La app debe abrirse desde una dirección `https` (por ejemplo GitHub Pages).
- **iPhone (Safari):** Compartir → *Agregar a pantalla de inicio*.
- **Android (Chrome):** menú ⋮ → *Instalar app*.

Después de abrirla una vez con internet, funciona sin conexión.

## Publicar con GitHub Pages
Settings → Pages → *Deploy from a branch* → rama `main`, carpeta `/ (root)`.

## Actualizar
Al cambiar archivos, sube la versión en `sw.js` (`VERSION`) para que los teléfonos descarguen la nueva versión.

## Créditos
PDF con [jsPDF](https://github.com/parallax/jsPDF) (MIT, ver `vendor/jspdf-LICENSE`). Tipografías Nunito y Bricolage Grotesque (SIL Open Font License) vía Fontsource.
