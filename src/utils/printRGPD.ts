import { Client, getEffectiveTipo } from '@/hooks/useClients';

export function printRGPD(client: Client) {
  const tipo = getEffectiveTipo(client);
  const nome = tipo === 'coletivo' ? (client as any).nome_empresa : (client as any).nome;
  const nif = tipo === 'coletivo' ? (client as any).nif_empresa : (client as any).nif;
  const email = client.email || '';
  const telefone = client.telefone || '';
  const morada = (client as any).morada || '';
  const codigoPostal = (client as any).codigo_postal || '';
  const localidade = (client as any).localidade || '';
  const dataAtual = new Date().toLocaleDateString('pt-PT');

  const enderecoCompleto = [morada, codigoPostal, localidade].filter(Boolean).join(', ');

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Consentimento RGPD - ${nome || 'Cliente'}</title>
  <style>
    @page { margin: 2.5cm; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      max-width: 700px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      text-align: center;
      font-size: 16pt;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    h2 {
      text-align: center;
      font-size: 13pt;
      font-weight: normal;
      margin-top: 0;
      margin-bottom: 30px;
      color: #333;
    }
    .field {
      margin-bottom: 6px;
    }
    .field-label {
      font-weight: bold;
      display: inline-block;
      min-width: 180px;
    }
    .field-value {
      border-bottom: 1px solid #000;
      display: inline-block;
      min-width: 300px;
      padding-bottom: 1px;
    }
    .field-value:empty::after {
      content: '\\00a0';
    }
    .section {
      margin-top: 24px;
      margin-bottom: 12px;
      font-weight: bold;
      font-size: 12pt;
      border-bottom: 1px solid #ccc;
      padding-bottom: 4px;
    }
    .consent-item {
      margin-bottom: 8px;
      padding-left: 20px;
      text-indent: -20px;
    }
    .checkbox {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 1.5px solid #000;
      margin-right: 8px;
      vertical-align: middle;
      position: relative;
      top: -1px;
    }
    .signature-area {
      margin-top: 50px;
    }
    .signature-line {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
    }
    .signature-block {
      text-align: center;
      width: 45%;
    }
    .signature-block .line {
      border-top: 1px solid #000;
      padding-top: 4px;
      font-size: 10pt;
    }
    .footer {
      margin-top: 40px;
      font-size: 9pt;
      color: #666;
      text-align: center;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>Declaração de Consentimento</h1>
  <h2>Regulamento Geral sobre a Proteção de Dados (RGPD)</h2>

  <div class="section">Identificação do Titular dos Dados</div>
  <div class="field">
    <span class="field-label">Nome completo:</span>
    <span class="field-value">${nome || ''}</span>
  </div>
  <div class="field">
    <span class="field-label">NIF:</span>
    <span class="field-value">${nif || ''}</span>
  </div>
  <div class="field">
    <span class="field-label">Email:</span>
    <span class="field-value">${email}</span>
  </div>
  <div class="field">
    <span class="field-label">Telefone:</span>
    <span class="field-value">${telefone}</span>
  </div>
  <div class="field">
    <span class="field-label">Morada:</span>
    <span class="field-value">${enderecoCompleto}</span>
  </div>

  <div class="section">Finalidade do Tratamento de Dados</div>
  <p>
    Os dados pessoais recolhidos serão tratados para as seguintes finalidades:
  </p>
  <div class="consent-item"><span class="checkbox"></span> Prestação de serviços jurídicos e acompanhamento de processos</div>
  <div class="consent-item"><span class="checkbox"></span> Comunicação relativa ao andamento dos processos</div>
  <div class="consent-item"><span class="checkbox"></span> Faturação e gestão financeira</div>
  <div class="consent-item"><span class="checkbox"></span> Cumprimento de obrigações legais e regulamentares</div>

  <div class="section">Declaração de Consentimento</div>
  <p>
    Declaro que fui informado(a) sobre o tratamento dos meus dados pessoais, nos termos do
    Regulamento (UE) 2016/679 do Parlamento Europeu e do Conselho, de 27 de abril de 2016
    (Regulamento Geral sobre a Proteção de Dados), e que:
  </p>
  <div class="consent-item"><span class="checkbox"></span> Autorizo a recolha e o tratamento dos meus dados pessoais para as finalidades acima indicadas.</div>
  <div class="consent-item"><span class="checkbox"></span> Fui informado(a) de que posso, a qualquer momento, retirar o meu consentimento, exercer os direitos de acesso, retificação, apagamento, limitação, portabilidade e oposição, mediante comunicação escrita.</div>
  <div class="consent-item"><span class="checkbox"></span> Fui informado(a) de que os meus dados serão conservados pelo período necessário ao cumprimento das finalidades para que foram recolhidos ou pelo período legalmente exigido.</div>

  <div class="signature-area">
    <p>Data: ${dataAtual}</p>
    <div class="signature-line">
      <div class="signature-block">
        <div class="line">O/A Titular dos Dados</div>
      </div>
      <div class="signature-block">
        <div class="line">O/A Responsável pelo Tratamento</div>
      </div>
    </div>
  </div>

  <div class="footer">
    Documento gerado em ${dataAtual} — Este documento deve ser assinado e arquivado nos termos do RGPD.
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
