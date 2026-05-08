// Parser de resúmenes de tarjeta de crédito para bancos argentinos
// Extrae texto con pdfjs-dist y aplica regex para encontrar los campos clave

let _pdfjs = null

async function getPdfJs() {
  if (_pdfjs) return _pdfjs
  _pdfjs = await import('pdfjs-dist')
  // Worker via CDN — funciona en browser sin config de Vite adicional
  _pdfjs.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${_pdfjs.version}/pdf.worker.min.js`
  return _pdfjs
}

async function extractText(file) {
  const pdfjs = await getPdfJs()
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: buffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map(it => it.str).join(' ') + '\n'
  }
  return text
}

// Parsea número argentino: "1.234.567,89" → 1234567.89
function parseARNumber(raw) {
  if (!raw) return null
  const s = raw.replace(/[$\s ]/g, '').trim()
  if (!s) return null
  // Formato "1.234,56" o "1.234.567,89"
  if (/\.\d{3}/.test(s) || /,\d{1,2}$/.test(s)) {
    const n = parseFloat(s.replace(/\./g, '').replace(',', '.'))
    return isNaN(n) ? null : n
  }
  const n = parseFloat(s.replace(/,/g, ''))
  return isNaN(n) ? null : n
}

function findNumber(text, patterns) {
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      const n = parseARNumber(m[1])
      if (n !== null && n > 0) return n
    }
  }
  return null
}

function findDate(text, patterns) {
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      const parts = m[1].split(/[\/\-]/)
      if (parts.length === 3) {
        const day = parseInt(parts[0])
        const month = parseInt(parts[1]) - 1
        let year = parseInt(parts[2])
        if (year < 100) year += 2000
        const d = new Date(year, month, day)
        if (!isNaN(d.getTime()) && day >= 1 && day <= 31) return d
      }
    }
  }
  return null
}

export async function parseStatementPDF(file) {
  try {
    const text = await extractText(file)

    return {
      ok: true,
      total_resumen: findNumber(text, [
        /TOTAL\s+A\s+PAGAR[\s:$ ]*([\d.,]+)/i,
        /TOTAL\s+DEL\s+RES[ÚU]MEN[\s:$ ]*([\d.,]+)/i,
        /IMPORTE\s+TOTAL[\s:$ ]*([\d.,]+)/i,
        /TOTAL\s+FACTURADO[\s:$ ]*([\d.,]+)/i,
        /TOTAL\s+RESUMEN[\s:$ ]*([\d.,]+)/i,
        /TOTAL[\s:$ ]*([\d.,]+)\s*\n/i,
      ]),
      pago_minimo: findNumber(text, [
        /PAGO\s+M[IÍ]NIMO[\s:$ ]*([\d.,]+)/i,
        /M[IÍ]NIMO\s+A\s+PAGAR[\s:$ ]*([\d.,]+)/i,
        /PAGO\s+MINIMO[\s:$ ]*([\d.,]+)/i,
      ]),
      saldo_anterior: findNumber(text, [
        /SALDO\s+ANTERIOR[\s:$ ]*([\d.,]+)/i,
        /SALDO\s+PREVIO[\s:$ ]*([\d.,]+)/i,
        /DEUDA\s+ANTERIOR[\s:$ ]*([\d.,]+)/i,
      ]),
      pagos_acreditados: findNumber(text, [
        /PAGOS?\s+(?:ACREDITADOS?|RECIBIDOS?)[\s:$ ]*([\d.,]+)/i,
        /ACREDITACIONES?[\s:$ ]*([\d.,]+)/i,
        /PAGOS\s+Y\s+ACREDITACIONES[\s:$ ]*([\d.,]+)/i,
      ]),
      compras_periodo: findNumber(text, [
        /COMPRAS?\s+(?:DEL\s+PER[IÍ]ODO|Y\s+CARGOS)[\s:$ ]*([\d.,]+)/i,
        /NUEVAS?\s+COMPRAS?[\s:$ ]*([\d.,]+)/i,
        /CONSUMOS?\s+DEL\s+PER[IÍ]ODO[\s:$ ]*([\d.,]+)/i,
        /CARGOS\s+DEL\s+PER[IÍ]ODO[\s:$ ]*([\d.,]+)/i,
      ]),
      cuotas_periodo: findNumber(text, [
        /CUOTAS?\s+(?:DEL\s+PER[IÍ]ODO|VIGENTES?)[\s:$ ]*([\d.,]+)/i,
        /PLANES?\s+(?:DE\s+)?CUOTAS?[\s:$ ]*([\d.,]+)/i,
        /FINANCIACI[OÓ]N\s+EN\s+CUOTAS?[\s:$ ]*([\d.,]+)/i,
      ]),
      ajustes: findNumber(text, [
        /INTERESES?\s+(?:Y\s+CARGOS?|FINANCIEROS?)[\s:$ ]*([\d.,]+)/i,
        /CARGOS?\s+FINANCIEROS?[\s:$ ]*([\d.,]+)/i,
        /AJUSTES?\s+(?:Y\s+CARGOS?)?[\s:$ ]*([\d.,]+)/i,
        /RECARGOS?[\s:$ ]*([\d.,]+)/i,
      ]),
      closing_date: findDate(text, [
        /FECHA\s+(?:DE\s+)?CIERRE[\s:]*([\d]{1,2}[\/\-][\d]{1,2}[\/\-][\d]{2,4})/i,
        /F\.\s*CIERRE[\s:]*([\d]{1,2}[\/\-][\d]{1,2}[\/\-][\d]{2,4})/i,
        /CIERRE[\s:]*([\d]{1,2}[\/\-][\d]{1,2}[\/\-][\d]{2,4})/i,
      ]),
      due_date: findDate(text, [
        /FECHA\s+(?:DE\s+)?VENCIMIENTO[\s:]*([\d]{1,2}[\/\-][\d]{1,2}[\/\-][\d]{2,4})/i,
        /F\.\s*VENC[\s.]*([\d]{1,2}[\/\-][\d]{1,2}[\/\-][\d]{2,4})/i,
        /VENCIMIENTO[\s:]*([\d]{1,2}[\/\-][\d]{1,2}[\/\-][\d]{2,4})/i,
      ]),
    }
  } catch (err) {
    console.error('pdfParser error:', err)
    return { ok: false, error: 'No se pudo leer el PDF. Ingresá los datos manualmente.' }
  }
}
