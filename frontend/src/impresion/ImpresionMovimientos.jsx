// src/impresion/ImpresionMovimientos.js
import { formatearFecha, formatearNumero } from "../components/FormatoFV";

export default function imprimirMovimiento(movimiento) {
  if (!movimiento) return;

  const contenido = `
       <!DOCTYPE html>
<html lang="es">

  <head>
    <title>Plantilla de Impresión | Registro Financiero</title>
    <style>html {
  scroll-behavior: smooth;
}

.table-print {
  border-collapse: separate;
  border-spacing: 0;
}

.table-print th,
.table-print td {
  border: 1px solid #e2e8f0;
}

.table-print th {
  background: #f1f5f9;
}

.table-print .num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.meta-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

*,
::before,
::after {
  box-sizing: border-box;
  undefined: undefined;
  border-width: 0;
  border-style: solid;
  border-color: #e5e7eb;
}

html,
:host {
  line-height: 1.5;
  undefined: undefined;
  -webkit-text-size-adjust: 100%;
  -moz-tab-size: 4;
  tab-size: 4;
  font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  font-feature-settings: normal;
  font-variation-settings: normal;
  -webkit-tap-highlight-color: transparent;
}

body {
  margin: 0;
  undefined: undefined;
  line-height: inherit;
}

hr {
  height: 0;
  undefined: undefined;
  color: inherit;
  border-top-width: 1px;
}

abbr:where([title]) {
  text-decoration: underline dotted;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-size: inherit;
  font-weight: inherit;
}

a {
  color: inherit;
  text-decoration: inherit;
}

b,
strong {
  font-weight: bolder;
}

code,
kbd,
samp,
pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  undefined: undefined;
  font-feature-settings: normal;
  font-variation-settings: normal;
  font-size: 1em;
}

small {
  font-size: 80%;
}

sub,
sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}

sub {
  bottom: -0.25em;
}

sup {
  top: -0.5em;
}

table {
  text-indent: 0;
  undefined: undefined;
  border-color: inherit;
  border-collapse: collapse;
}

button,
input,
optgroup,
select,
textarea {
  font-family: inherit;
  undefined: undefined;
  font-feature-settings: inherit;
  font-variation-settings: inherit;
  font-size: 100%;
  font-weight: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  color: inherit;
  margin: 0;
  padding: 0;
}

button,
select {
  text-transform: none;
}

button,
input:where([type='button']),
input:where([type='reset']),
input:where([type='submit']) {
  -webkit-appearance: button;
  undefined: undefined;
  background-color: transparent;
  background-image: none;
}

:-moz-focusring {
  outline: auto;
}

:-moz-ui-invalid {
  box-shadow: none;
}

progress {
  vertical-align: baseline;
}

::-webkit-inner-spin-button,
::-webkit-outer-spin-button {
  height: auto;
}

[type='search'] {
  -webkit-appearance: textfield;
  undefined: undefined;
  outline-offset: -2px;
}

::-webkit-search-decoration {
  -webkit-appearance: none;
}

::-webkit-file-upload-button {
  -webkit-appearance: button;
  undefined: undefined;
  font: inherit;
}

summary {
  display: list-item;
}

blockquote,
dl,
dd,
h1,
h2,
h3,
h4,
h5,
h6,
hr,
figure,
p,
pre {
  margin: 0;
}

fieldset {
  margin: 0;
  padding: 0;
}

legend {
  padding: 0;
}

ol,
ul,
menu {
  list-style: none;
  margin: 0;
  padding: 0;
}

dialog {
  padding: 0;
}

textarea {
  resize: vertical;
}

input::placeholder,
textarea::placeholder {
  opacity: 1;
  undefined: undefined;
  color: #9ca3af;
}

button,
[role="button"] {
  cursor: pointer;
}

:disabled {
  cursor: default;
}

img,
svg,
video,
canvas,
audio,
iframe,
embed,
object {
  display: block;
  undefined: undefined;
  vertical-align: middle;
}

img,
video {
  max-width: 100%;
  height: auto;
}

[hidden] {
  display: none;
}

.cls-qo8foz {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.cls-bxh6nz {
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
  margin-top: 2rem;
  margin-bottom: 2rem;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  border-radius: 0.75rem;
}

.encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  border-bottom-width: 1px;
  border-color: rgb(226 232 240 / 1);
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
}

.marca-empresa {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cls-hhbo26 {
  width: 3.5rem;
  height: 3.5rem;
  object-fit: contain;
  border-radius: 0.375rem;
  box-shadow: 0 0 0 0px #fff, 0 0 0 calc(1px + 0px) rgb(59 130 246 / 0.5), 0 0 #0000;
}

.nombre-empresa {
  display: flex;
  flex-direction: column;
}

.cls-pz578m {
  color: rgb(15 23 42 / 1);
  font-weight: 600;
  font-size: 1.125rem;
  line-height: 1.75rem;
}

.cls-kr7zpc {
  color: rgb(100 116 139 / 1);
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.cls-h9i2j4 {
  color: rgb(100 116 139 / 1);
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.titulo-documento {
  text-align: right;
}

.cls-pf5mds {
  font-weight: 700;
  font-family: 'Roboto Slab', serif;
  letter-spacing: -0.025em;
}

.cls-u92vk4 {
  font-family: 'Inter', sans-serif;
  color: rgb(71 85 105 / 1);
}

.cls-as35wz {
  margin-top: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  border-radius: 0.375rem;
  box-shadow: 0 0 0 0px #fff, 0 0 0 calc(1px + 0px) rgb(59 130 246 / 0.5), 0 0 #0000;
}

.cls-lls6wq {
  width: 1rem;
  height: 1rem;
}

.cls-1udczh {
  color: rgb(51 65 85 / 1);
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
}

.metadatos {
  margin-top: 1.5rem;
}

.cls-xg3oyr {
  border-radius: 0.5rem;
  box-shadow: 0 0 0 0px #fff, 0 0 0 calc(1px + 0px) rgb(59 130 246 / 0.5), 0 0 #0000;
  overflow: hidden;
}

.cls-74q283 {
  background-image: linear-gradient(to right, #f8fafc, rgb(248 250 252 / 0));
  padding-left: 1.25rem;
  padding-right: 1.25rem;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom-width: 1px;
  border-color: rgb(226 232 240 / 1);
}

.cls-5l5l10 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.cls-0amwyr {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cls-guebgb {
  width: 1rem;
  height: 1rem;
}

.cls-7ecarq {
  color: rgb(51 65 85 / 1);
  font-weight: 600;
}

.cls-finnfu {
  color: rgb(100 116 139 / 1);
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.cls-ueq0ot {
  padding: 1.25rem;
}

.cls-v2mn68 {
  font-weight: 500;
}

.cls-1xglms {
  font-weight: 500;
}

.cls-d0687v {
  font-weight: 500;
}

.cls-yi0dqd {
  font-weight: 500;
}

.cls-vv34kg {
  font-weight: 500;
}

.cls-t95hlg {
  font-weight: 500;
}

.cls-czvpsj {
  color: rgb(4 120 87 / 1);
}

.cls-djbvxf {
  font-weight: 500;
}

.cls-vot5ml {
  font-weight: 500;
}

.tabla-movimientos {
  margin-top: 2rem;
}

.cls-w5bl7e {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.cls-zpje7x {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cls-i8p7mx {
  width: 1rem;
  height: 1rem;
}

.cls-is67rx {
  color: rgb(51 65 85 / 1);
  font-weight: 600;
}

.cls-95wj56 {
  overflow-x: auto;
  border-radius: 0.5rem;
  box-shadow: 0 0 0 0px #fff, 0 0 0 calc(1px + 0px) rgb(59 130 246 / 0.5), 0 0 #0000;
}

.tabla {
  width: 100%;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.cls-0fsjwg {
  color: rgb(51 65 85 / 1);
}

.cls-fzxy42 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  text-align: left;
  font-weight: 600;
}

.cls-yxwv9m {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  text-align: left;
  font-weight: 600;
}

.cls-f503iz {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  text-align: left;
  font-weight: 600;
}

.cls-fcg02u {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  text-align: left;
  font-weight: 600;
}

.cls-9vp79f {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  text-align: right;
  font-weight: 600;
}

.cls-mwfbe6 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  text-align: right;
  font-weight: 600;
}

.cls-rqb7at {
  color: rgb(51 65 85 / 1);
}

.fila-movimiento {
  vertical-align: top;
}

.cls-y462q6 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.cls-f4n8t4 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.cls-p3qssp {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.cls-ipddgo {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.cls-ba4q1l {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.cls-p9rlpm {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.cls-9dogc6 {
  background-color: rgb(248 250 252 / 1);
}

.cls-1ovg51 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  font-weight: 600;
}

.cls-q43c75 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  font-weight: 600;
}

.firmas {
  margin-top: 2.5rem;
}

.cls-jzx1kl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
}

#icur4 {
  padding-top: 0px;
  padding-right: 0px;
  padding-bottom: 0px;
  padding-left: 0px;
}

@page {
  size: A4;
  margin: 16mm;
}

@media print {

  html,
  body {
    background: #fff;
  }

  .page-footer .page-number::after {
    content: counter(page);
  }
}

@media (max-width: 992px) {
  .cls-bxh6nz {
    margin-top: 1.5rem;
    margin-bottom: 1.5rem;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }

  .encabezado {
    padding-top: 1.25rem;
    padding-bottom: 1.25rem;
  }

  .cls-jzx1kl {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .gjs-t-h1 {
    font-size: 22px;
  }

  .gjs-t-h2 {
    font-size: 16px;
  }

  .cls-bxh6nz {
    margin-top: 1rem;
    margin-bottom: 1rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .encabezado {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }

  .cls-jzx1kl {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}</style>
    </head>

  <body id="i6yo" class="gjs-t-body cls-qo8foz">
    <main id="icx3z" class="cls-bxh6nz">
      <header class="encabezado" id="i8yen">
        <div class="marca-empresa" id="icipv">
          <img alt="Logo de empresa" src="https://cdn.grapesjs.com/workspaces/cmnq3iawc16jb4lmutiz1o9gy/assets/c051235c-a435-4db8-ac0b-8e9be998d074__favicon.svg" id="irtcx" class="cls-hhbo26" />
          <div class="nombre-empresa" id="iiuhj">
            <span id="iadzp" class="cls-pz578m">Anderson Pott Marafon</span>
            <span id="ibv2i" class="cls-kr7zpc">Santa Rita, Alto Paraná, Paraguay.</span>
            <span id="ib65p" class="cls-h9i2j4">RUC: 6930017 | Tel: 0982 771 774</span>
          </div>
        </div>
        <div class="titulo-documento" id="ijxgc">
          <h1 class="gjs-t-h1 cls-pf5mds" id="ih4zf">Registro Financiero / Comprobante</h1>
          <div class="cls-as35wz" id="io0nz">
            <img alt="Icono" src="https://api.iconify.design/lucide-receipt.svg?color=%230f172a" class="cls-lls6wq" id="i1tos" />
            <span id="ina36" class="cls-1udczh">Moneda base: ${movimiento.moneda_principal}</span>
          </div>
        </div>
      </header>
      <section class="metadatos" id="ity1k">
        <div class="cls-xg3oyr" id="ioopm">
          <div class="cls-74q283" id="iiwbd">
            <div class="cls-5l5l10" id="ioe6x">
              <div class="cls-0amwyr" id="id4tl">
                <img alt="Icono metadata" src="https://api.iconify.design/lucide-info.svg?color=%23334155" class="cls-guebgb" id="ikgml" />
                <span id="ihr6a" class="cls-7ecarq">Detalles del registro</span>
              </div>
              <span id="iqmne" class="cls-finnfu">ID: ${movimiento.id}</span>
            </div>
          </div>
          <div class="cls-ueq0ot" id="iqs7x">
            <div id="ijc2n" class="cls-70gebs">
              <div id="ihsed" class="meta-item">
                <div id="imh2w" class="cls-v2mn68">Fecha</div>
                <div id="in1ai" class="cls-ojmnh8">${formatearFecha(movimiento.fecha)}</div>
              </div>
              <div id="igzb3" class="meta-item">
                <div id="isdpo" class="cls-1xglms">Usuario</div>
                <div id="imguu" class="cls-78vg8m">${movimiento.usuario_nombre}</div>
              </div>
              <div id="it2ex" class="meta-item">
                <div id="i4pd1" class="cls-d0687v">Referencia</div>
                <div id="inqwz" class="cls-wtumul">${movimiento.referencia}</div>
              </div>
              <div id="iptrd" class="meta-item">
                <div id="i4ils" class="cls-yi0dqd">Tipo</div>
                <div id="i1ojj" class="cls-5d8jpe">${movimiento.tipo_operacion}</div>
              </div>
              <div id="iudt6" class="meta-item">
                <div id="itv7l" class="cls-vv34kg">Punto Exp.</div>
                <div id="ik6w9" class="cls-xm6nsn">${movimiento.punto_exp}</div>
              </div>
              <div id="ico6e" class="meta-item">
                <div id="ickfs" class="cls-t95hlg">Estado</div>
                <div id="ihjov" class="cls-czvpsj">${movimiento.estado}</div>
              </div>
              <div id="isko6" class="meta-item">
                <div id="ilgr6" class="cls-djbvxf">Descripción</div>
                <div id="iysio" class="cls-vddptq">${movimiento.descripcion}</div>
              </div>
              <div id="i0a3z" class="meta-item">
                <div id="irzcs" class="cls-vot5ml">Moneda Base</div>
                <div id="isi8x" class="cls-l4e30m">${movimiento.moneda_principal}</div>
              </div>
              <div class="meta-item" id="i4hlw">
                <div class="cls-1xglms" id="i1oef">Caja logueada</div>
                <div id="iay2ol" class="cls-78vg8m">${movimiento.caja_logueada}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="iibph" class="tabla-movimientos">
        <div id="ii1kx" class="cls-w5bl7e">
          <div id="ijhw4" class="cls-zpje7x">
            <img alt="Icono movimientos" src="https://api.iconify.design/lucide-table.svg?color=%23334155" id="i5iqw" class="cls-i8p7mx" />
            <h2 id="iyq0u" class="cls-is67rx">Movimientos contables</h2>
          </div>
        </div>
        <div id="idwqw" class="cls-95wj56">

          <table id="icur4" class="tabla table-print">
            <thead id="impsv">
              <tr id="i8o2h" class="cls-0fsjwg">
                <th id="ih7ot" class="cls-fzxy42">Cuenta</th>
                <th id="iixuyf" class="cls-yxwv9m">Documento</th>
                <th id="iseb2f" class="cls-f503iz">Entidad</th>
                <th id="ienn0g" class="cls-fcg02u">Cambio</th>
                <th id="iboj6h" class="cls-9vp79f num">Débito</th>
                <th id="il1v2g" class="cls-mwfbe6 num">Crédito</th>
              </tr>
            </thead>
            <tbody>
                        ${movimiento.detalles
                          .map(d => `
                                <tr>
                                    <td class="cls-y462q6" id="iiwj6f">${d.cuenta_nombre || d.cuenta_id}</td>

                                    <td class="cls-f4n8t4" id="iwdq38">${d.documento || "-"}</td>
                                    <td id="iivmei" class="cls-p3qssp">${d.entidad || "-"}</td>
                                    <td class="cls-ipddgo" id="iazpll">${d.cambio != null && d.cambio !== "" ? Number(d.cambio).toFixed(6) : "-"}</td>
                                    <td class="cls-ba4q1l num" id="ig8dqq">${d.tipo === "DÉBITO" ? formatearNumero(d.monto, movimiento.moneda_principal) : "-"}</td>
                                    <td class="cls-p9rlpm num" id="i83z3t">${d.tipo === "CRÉDITO" ? formatearNumero(d.monto, movimiento.moneda_principal) : "-"}</td>
                                </tr>
                            `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td id="ie2b4t" class="cls-1ovg51"><strong>Totales:</strong></td>
                            <td id="ie2b4t" class="cls-1ovg51"></td>
                            <td id="ie2b4t" class="cls-1ovg51"></td>
                            <td id="ie2b4t" class="cls-1ovg51"></td>
                            <td id="ie2b4t-5" class="cls-1ovg51 num">
                                                      ${formatearNumero(
                              movimiento.detalles
                                .filter(d => d.tipo.toUpperCase() === "DÉBITO")
                                .reduce((sum, d) => sum + Number(d.monto || 0), 0),
                              movimiento.moneda_principal
                            )}
                            </td>
                            <td id="ictfqv" class="cls-q43c75 num">
                                                      ${formatearNumero(
                              movimiento.detalles
                                .filter(d => d.tipo.toUpperCase() === "CRÉDITO")
                                .reduce((sum, d) => sum + Number(d.monto || 0), 0),
                              movimiento.moneda_principal
                            )}
                            </td>
                        </tr>
                    </tfoot>
          </table>
        </div>
      </section>
      <section class="firmas" id="ibbzif">
        <div class="cls-jzx1kl" id="ivnx21"></div>
      </section>
    </main>
  </body>

</html>
    `;

  const ventana = window.open("", "_blank");
  ventana.document.write(contenido);
}