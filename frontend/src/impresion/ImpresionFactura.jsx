// src/impresion/ImpresionMovimientos.js
import { formatearFecha, formatearNumero, formatearSoloFecha } from "../components/FormatoFV";

export default function imprimirFactura(factura) {
    if (!factura) return;
    const { encabezado, detalle, pagos } = factura.datosVentaImprimir
    const { totales } = factura;

    const contenido = `
      <!DOCTYPE html>
  <html lang="es">

  <head>
      <meta charset="UTF-8">
      <title>Factura A4</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
          @page {
              size: A4;
              margin: 2mm;
          }

          tr {
              page-break-inside: avoid;
          }

          body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: #ffffff;
              color: #1f2937; /* text-gray-900 */
              margin: 0;
              font-family: sans-serif;
          }
              <style>
          @page {
              size: A4;
              margin: 10mm;
          }
          body {
              margin: 0;
              padding: 0;
              font-family: 'Helvetica', 'Arial', sans-serif;
              background-color: #fff;

          .hoja {
              width: 210mm; 
              margin: auto;
              padding: 10mm;
              box-sizing: border-box;
              background: white;
          }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
          
          @media print {
              .hoja {
                  width: 100%;
                  margin: 0;
                  padding: 0;
                  box-shadow: none;
              }
              button { display: none; } /* Ocultar botones al imprimir */
          }
      </style>
  </head>

  <body>

      <div style="margin-left:auto;margin-right:auto;padding:16px;">

          <div style="border:2px solid #e5e7eb;padding:16px;border-radius:1rem;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -2px rgba(0,0,0,0.05);">
              <!-- Header -->
              <header style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #d1d5db;margin-bottom:16px;">
                  <div style="display:flex;gap:12px;">
                      <div style="width:96px;height:96px;display:flex;justify-content:center;align-items:center;">
                          <img src="https://cdn.grapesjs.com/workspaces/cmnq3iawc16jb4lmutiz1o9gy/assets/c051235c-a435-4db8-ac0b-8e9be998d074__favicon.svg" alt="Logo" style="width:100%;height:100%;object-fit:contain;" />
                      </div>
                      <div style="display:flex;flex-direction:column;justify-content:center;">
                          <h1 style="font-size:1.5rem;font-weight:bold;margin:0;">H&Y Technology</h1>
                          <span style="font-size:0.75rem;"><b>De: </b>Anderson Pott Marafon</span>
                          <span style="font-size:0.75rem;"><b>RUC: </b>6930017</span>
                          <span style="font-size:0.75rem;"><b>Dirección: </b>Santa Rita, Alto Paraná, Paraguay</span>
                          <span style="font-size:0.75rem;"><b>Tél: </b>0982 771 774</span>
                          <span style="font-size:0.75rem;"><b>E-mail: </b>anderpott33@gmail.com</span>
                      </div>
                  </div>
                  <div style="text-align:right;display:flex;flex-direction:column;justify-content:center;">
                      <div>
                          <span style="font-weight:600;font-size:1.25rem;">${encabezado.tipo === "VENTA" ? "FACTURA" : encabezado.tipo} Nº:</span>
                          <span style="font-size:1.25rem;">${encabezado.numero_factura}</span>
                          </div>
                          <div>
                          ${encabezado.referencia_id > 0 ? `<span><b>Comprobante Venta:</b> <span style="font-size:0.80rem;">${encabezado.factura_vinculada}</span></span>` : ""}
                          </div>
                      <div style="display:flex;flex-direction:column;font-size:0.75rem;color:#4b5563;">
                          <span><b>Timbrado:</b> ${encabezado.timbrado}</span>
                          <span><b>Inicio Vigencia:</b> ${formatearSoloFecha(encabezado.fecha_inicio)}</span>
                          <span><b>Fin Vigencia:</b> ${formatearSoloFecha(encabezado.fecha_fin)}</span>
                        
                      </div>
                  </div>
              </header>

              <!-- Nota -->
              <div style="border:2px solid #e5e7eb; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius:1rem;margin-bottom:16px;padding:12px;background-color:#f9fafb;">
                  <div style="font-style:italic;font-size:0.875rem;color:#374151;display: flex; flex-direction: column;">
                  Actividad económica: 6201 - Desarrollo de sistemas informáticos</div>
                  <div style="font-style:italic;font-size:0.875rem;color:#374151;display: flex; flex-direction: column;">
                  Actividad económica principal: 6201 - Desarrollo de sistemas informáticos</div>
                  <div style="font-style:italic;font-size:0.875rem;color:#374151;display: flex; flex-direction: column;">
                      Actividades secundarias: 6202 - Consultoría informática</div>
                  
              </div>

              <!-- Cliente & Factura Info -->
              <div style="display:flex;justify-content:space-between;margin-bottom:16px;border:2px solid #e5e7eb;border-radius:1rem;padding:12px;background-color:#f9fafb;">
                  <div style="width:50%;display:flex;flex-direction:column;gap:4px;">
                  <span><b>Fecha Emisión:</b> ${formatearFecha(encabezado.fecha)}</span>    
                  <span><b>Cliente: </b>${`${encabezado.cliente_id} - ${encabezado.cliente_nombre}`}</span>
                      <span><b>Dirección: </b>${encabezado?.direccion || "--"}</span>
                      <span><b>E-mail: </b>${encabezado?.email || "--"}</span>
                  </div>
                  <div style="width:33.33%;display:flex;flex-direction:column;gap:4px;text-align:left;font-size:0.875rem;">
                      <span><b>RUC: </b>${encabezado.ruc}</span>
                      <span><b>Tel: </b>${encabezado?.telefono || "--"}</span>
                      <span><b>Condición: </b>${encabezado.condicion_pago}</span>
                  </div>
              </div>

              <!-- DETALLES ITENES -->
              <div style="border:1px solid #d1d5db;border-radius:1rem;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,0.05);margin-bottom:16px;">
                  <div style="width:100%;border:1px solid #d1d5db;border-radius:1rem;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,0.05);">
                      <table style="width:100%;border-collapse:collapse;">
                          <thead style="background-color:#e5e7eb;">
                              <tr>
                                  <th style="padding:16px;text-align:left;font-weight:600;border-bottom:1px solid #bfdbfe;">Descripción</th>
                                  <th style="padding:16px;text-align:right;font-weight:600;border-bottom:1px solid #bfdbfe;">Cantidad</th>
                                  <th style="padding:16px;text-align:right;font-weight:600;border-bottom:1px solid #bfdbfe;">Precio Unitario</th>
                                  <th style="padding:16px;text-align:right;font-weight:600;border-bottom:1px solid #bfdbfe;">Exento</th>
                                  <th style="padding:16px;text-align:right;font-weight:600;border-bottom:1px solid #bfdbfe;">Subtotal 5%</th>
                                  <th style="padding:16px;text-align:right;font-weight:600;border-bottom:1px solid #bfdbfe;">Subtotal 10%</th>
                              </tr>
                          </thead>
                          <tbody style="color:#1f2937;">
                          ${detalle.map(d => `
                              <tr style="background-color:#f9fafb;">
                                  <td style="padding:16px;border-bottom:1px solid #e5e7eb;">${`${d.producto_id} - ${d.producto_nombre}`}</td>
                                  <td style="padding:16px;text-align:right;border-bottom:1px solid #e5e7eb;">${d.cantidad}</td>
                                  <td style="padding:16px;text-align:right;border-bottom:1px solid #e5e7eb;">${formatearNumero(d.precio_unitario)}</td>
                                  <td style="padding:16px;text-align:right;border-bottom:1px solid #e5e7eb;">${d.impuesto_por === 'EXENTO' ? formatearNumero(d.total) : "-"}</td>
                                  <td style="padding:16px;text-align:right;border-bottom:1px solid #e5e7eb;">${d.impuesto_por === '5%' ? formatearNumero(d.total) : "-"}</td>
                                  <td style="padding:16px;text-align:right;border-bottom:1px solid #e5e7eb;">${d.impuesto_por === '10%' ? formatearNumero(d.total) : "-"}</td>
                              </tr>
                            `).join('')}
                          </tbody>
                      </table>
                  </div>

                  <!-- TOTALES -->
                  <div style="display:flex;gap:4px;justify-content:flex-end;margin-top:4px;">
                      <!-- PAGO -->
                      <div style="width:100%;border:1px solid #d1d5db;border-radius:1rem;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,0.05);">
                          <table style="width:100%;border-collapse:collapse;">
                              <thead style="background-color:#e5e7eb;">
                                  <tr>
                                      <th style="padding:16px;text-align:left;font-weight:600;border-bottom:1px solid #bfdbfe;">Forma Pago</th>
                                      <th style="padding:16px;text-align:left;font-weight:600;border-bottom:1px solid #bfdbfe;">Cuenta</th>
                                      <th style="padding:16px;text-align:right;font-weight:600;border-bottom:1px solid #bfdbfe;">Valor</th>
                                  </tr>
                              </thead>
                              <tbody style="color:#1f2937;">
                              ${pagos.map(p => `
                                  <tr style="background-color:#f9fafb;">
                                      <td style="padding:16px;border-bottom:1px solid #e5e7eb;">${p.forma_pago}</td>
                                      <td style="padding:16px;text-align:left;border-bottom:1px solid #e5e7eb;">${p.cuenta_nombre}</td>
                                      <td style="padding:16px;text-align:right;border-bottom:1px solid #e5e7eb;">${formatearNumero(p.monto)}</td>
                                  </tr>
                                  `).join('')}
                              </tbody>
                          </table>
                          <div style="padding:8px;font-style:italic;"><b>Observaciones:</b></div>
                      </div>

                      <div style="width:50%;border:1px solid #d1d5db;border-radius:1rem;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,0.05);">
                          <table style="width:100%;border-collapse:collapse;text-align:right;">
                              <tbody>
                                  <tr style="background-color:#e5e7eb;">
                                      <th style="padding:16px;font-weight:600;color:#374151;">Subtotal:</th>
                                      <td style="padding:16px;">${formatearNumero(totales.subTotal)}</td>
                                  </tr>
                                  <tr style="background-color:#f9fafb;">
                                      <th style="padding:16px;font-weight:600;color:#374151;">IVA (5%):</th>
                                      <td style="padding:16px;">${formatearNumero(totales.totalIVA5)}</td>
                                  </tr>
                                  <tr style="background-color:#e5e7eb;">
                                      <th style="padding:16px;font-weight:600;color:#374151;">IVA (10%):</th>
                                      <td style="padding:16px;">${formatearNumero(totales.totalIVA10)}</td>
                                  </tr>
                                  <tr style="background-color:#f9fafb;border-top:1px solid #d1d5db;">
                                      <th style="padding:16px;font-weight:600;color:#374151;">Total IVA:</th>
                                      <td style="padding:16px;">${formatearNumero(totales.totalIVA)}</td>
                                  </tr>
                                  <tr style="background-color:#e5e7eb;font-weight:bold;font-size:1.125rem;border-top:1px solid #9ca3af;">
                                      <th style="padding:16px;">Total:</th>
                                      <td style="padding:16px;">${formatearNumero(totales.totalGeneral)}</td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>
                  </div>

              </div>

              <!-- Footer -->
              <footer style="text-align:center;border:2px solid #e5e7eb;border-radius:1rem;font-size:0.75rem;padding:8px;">
                  Gracias por la preferencia
              </footer>
          </div>

      </div>

  </body>

  </html>
      `;

    const ventana = window.open("", "_blank");
    ventana.document.write(contenido);

}
