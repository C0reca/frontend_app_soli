import type { MovimentoCaixa } from '@/hooks/useCaixa';

interface TalaoOptions {
  clienteNome?: string | null;
  processoTitulo?: string | null;
}

export function printTalao(movimento: MovimentoCaixa, options: TalaoOptions = {}) {
  const dataMovimento = movimento.data
    ? new Date(movimento.data).toLocaleDateString('pt-PT')
    : new Date().toLocaleDateString('pt-PT');

  const hora = movimento.hora ?? (movimento.data
    ? new Date(movimento.data).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    : '');

  const valor = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(movimento.valor);

  const tipoLabel = movimento.tipo === 'entrada' ? 'Entrada' : 'Saida';

  const tipoTransferencia = (() => {
    switch (movimento.tipo_transferencia) {
      case 'mb': return 'Multibanco';
      case 'transferencia': return 'Transferencia';
      default: return 'Dinheiro';
    }
  })();

  const entidadeHtml = options.clienteNome
    ? `<tr>
        <td class="label">Entidade:</td>
        <td class="value">${options.clienteNome}</td>
      </tr>`
    : '';

  const processoHtml = options.processoTitulo
    ? `<tr>
        <td class="label">Processo:</td>
        <td class="value">${options.processoTitulo}</td>
      </tr>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Talao #${movimento.id}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 4mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.4;
      color: #000;
      width: 72mm;
      margin: 0 auto;
      padding: 4mm 0;
    }
    .header {
      text-align: center;
      border-bottom: 1px dashed #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .header h1 {
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .header .subtitle {
      font-size: 10px;
      color: #333;
      margin-top: 2px;
    }
    .tipo-badge {
      display: inline-block;
      font-size: 13px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 4px 12px;
      margin: 8px 0;
      border: 2px solid #000;
    }
    .tipo-entrada { color: #16a34a; border-color: #16a34a; }
    .tipo-saida { color: #dc2626; border-color: #dc2626; }
    .valor-section {
      text-align: center;
      padding: 10px 0;
      border-bottom: 1px dashed #000;
      margin-bottom: 8px;
    }
    .valor {
      font-size: 22px;
      font-weight: bold;
    }
    .details {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .details td {
      padding: 3px 0;
      vertical-align: top;
    }
    .details .label {
      font-weight: bold;
      width: 40%;
      white-space: nowrap;
    }
    .details .value {
      text-align: right;
      width: 60%;
      word-break: break-word;
    }
    .descricao {
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 8px 0;
      margin: 8px 0;
    }
    .descricao .label {
      font-weight: bold;
      font-size: 10px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .descricao .text {
      font-size: 11px;
    }
    .footer {
      text-align: center;
      font-size: 9px;
      color: #666;
      padding-top: 8px;
      border-top: 1px dashed #000;
      margin-top: 8px;
    }
    .footer .id {
      font-size: 10px;
      font-weight: bold;
      color: #000;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Talao de Caixa</h1>
    <div class="subtitle">Comprovativo de Movimento</div>
  </div>

  <div class="valor-section">
    <div class="tipo-badge tipo-${movimento.tipo}">${tipoLabel}</div>
    <div class="valor">${valor}</div>
  </div>

  <table class="details">
    <tr>
      <td class="label">Data:</td>
      <td class="value">${dataMovimento}</td>
    </tr>
    <tr>
      <td class="label">Hora:</td>
      <td class="value">${hora}</td>
    </tr>
    <tr>
      <td class="label">Pagamento:</td>
      <td class="value">${tipoTransferencia}</td>
    </tr>
    ${entidadeHtml}
    ${processoHtml}
  </table>

  <div class="descricao">
    <div class="label">Descricao</div>
    <div class="text">${movimento.descricao}</div>
  </div>

  <div class="footer">
    <div class="id">Mov. #${movimento.id}</div>
    <div>Documento gerado em ${new Date().toLocaleDateString('pt-PT')} ${new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</div>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
