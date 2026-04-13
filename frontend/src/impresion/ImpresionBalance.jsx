import { formatearFecha, formatearNumero } from "../components/FormatoFV";

export default function imprimirBalance(balance) {
    if (!balance || !Array.isArray(balance)) return;

    const filasHtml = balance.map(item => {
        const nivel = (item.codigo.match(/\./g) || []).length;
        const isSintetica = item.tipo_contable === 'SINTÉTICA';
        const sAnt = parseFloat(item.saldo_anterior) || 0;
        const sAct = parseFloat(item.saldo_actual) || 0;

        return `
            <tr style="background-color: ${isSintetica ? '#f3f4f6' : '#ffffff'}; font-weight: ${isSintetica ? 'bold' : 'normal'};">
                <td style="padding:10px; border-bottom:1px solid #e5e7eb; font-size: 12px; font-family:monospace;">${item.codigo}</td>
                <td style="padding:10px; border-bottom:1px solid #e5e7eb; font-size: 12px; padding-left: ${nivel * 20 + 10}px;">
                    ${item.cuenta}
                </td>
                <td style="padding:10px; border-bottom:1px solid #e5e7eb; font-size: 12px; text-align:right; font-family:monospace; color: ${sAnt < 0 ? 'green' : '#1f2937'};">
                    ${formatearNumero(sAnt)}
                </td>
                <td style="padding:10px; border-bottom:1px solid #e5e7eb; font-size: 12px; text-align:right; font-family:monospace; color: ${sAct < 0 ? 'green' : '#1f2937'};">
                    ${formatearNumero(sAct)}
                </td>
            </tr>
        `;
    }).join('');

    const contenido = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            @page { size: A4; margin: 10mm; }
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                margin: 0;
                font-family: sans-serif;
                background-color: #f3f4f6;
            }
            
            table { width: 100%; border-collapse: collapse; }
            
            /* ESTO HACE QUE EL ENCABEZADO SE REPITA */
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            
            tr { page-break-inside: avoid; }

            .main-container { 
                max-width: 210mm; 
                margin: auto; 
                background: white; 
                padding: 20px; 
                min-height: 297mm;
            }

            @media print {
                body { background-color: #fff; }
                .no-print { display: none; }
                .main-container { border: none; box-shadow: none; width: 100%; padding: 0; }
            }
        </style>
    </head>
    <body>
        <div class="main-container">
            <table>
                <thead>
                    <tr>
                        <td colspan="4" style="border:none; padding: 0;">
                             <header style="display:flex; justify-content:space-between; padding:8px; border-bottom:2px solid #1f2937; margin-bottom:16px;">
                <div style="display:flex; gap:12px;">
                    <div style="width:80px; height:80px; display:flex; justify-content:center; align-items:center;">
                        <img src="https://cdn.grapesjs.com/workspaces/cmnq3iawc16jb4lmutiz1o9gy/assets/c051235c-a435-4db8-ac0b-8e9be998d074__favicon.svg" alt="Logo" style="width:100%; height:100%; object-fit:contain;" />
                    </div>
                    <div style="display:flex; flex-direction:column; justify-content:center;">
                        <h1 style="font-size:1.25rem; font-weight:bold; margin:0;">H&Y Technology</h1>
                        <span style="font-size:0.75rem;"><b>RUC: </b>6930017</span>
                        <span style="font-size:0.75rem;">Santa Rita, Alto Paraná, Paraguay</span>
                    </div>
                </div>
                <div style="text-align:right; display:flex; flex-direction:column; justify-content:center;">
                    <span style="font-weight:bold; font-size:1.25rem; color:#1f2937;">BALANCE GENERAL</span>
                    <span style="font-size:0.875rem; color:#4b5563;">Fecha de Emisión: ${formatearFecha(new Date())}</span>
                    <span style="font-size:0.875rem; font-weight:bold;">Moneda: PYG</span>
                </div>
            </header>
                    </tr>
                    <tr style="background-color:#1f2937; color:white;">
                        <th style="padding:10px; text-align:left; font-size:0.8rem;">CÓDIGO</th>
                        <th style="padding:10px; text-align:left; font-size:0.8rem;">CUENTA</th>
                        <th style="padding:10px; text-align:right; font-size:0.8rem;">ANTERIOR</th>
                        <th style="padding:10px; text-align:right; font-size:0.8rem;">ACTUAL</th>
                    </tr>
                </thead>
                
                <tbody>
                    ${filasHtml}
                </tbody>

                <tfoot>
                    <tr>
                        <td colspan="4" style="padding-top: 40px; border:none;">
                            <div style="display:flex; justify-content:space-around; font-size:0.7rem; text-align:center;">
                                <div style="width:200px; border-top:1px solid #000; padding-top:5px;">Firma Contador</div>
                                <div style="width:200px; border-top:1px solid #000; padding-top:5px;">Firma Responsable</div>
                            </div>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </body>
    </html>
    `;

    const ventana = window.open("", "_blank");
    ventana.document.write(contenido);
    ventana.document.close();
}