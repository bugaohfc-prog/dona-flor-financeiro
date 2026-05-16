const CSV_SEPARATOR = ';'

export function downloadBlob(filename, blob) {
  if (!(blob instanceof Blob)) {
    throw new Error('Arquivo de exportação inválido.')
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1200)
}

export function createCsvBlob(headers, rows) {
  const normalizedRows = Array.isArray(rows) ? rows : []
  const csv = [headers, ...normalizedRows]
    .map((row) => row.map(csvCell).join(CSV_SEPARATOR))
    .join('\r\n')

  return new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
}

export function exportCsv({ filename, headers, rows }) {
  downloadBlob(filename, createCsvBlob(headers, rows))
}

function csvCell(value) {
  const text = String(value ?? '')
    .replace(/\r|\n/g, ' ')
    .replace(/"/g, '""')
  return `"${text}"`
}

export function printHtmlReport(html, onError) {
  if (!html || typeof html !== 'string') {
    onError?.(new Error('Conteúdo de impressão vazio.'))
    return
  }

  const iframe = document.createElement('iframe')
  iframe.title = 'Relatório para impressão'
  iframe.style.position = 'fixed'
  iframe.style.left = '-10000px'
  iframe.style.top = '0'
  iframe.style.width = '794px'
  iframe.style.height = '1123px'
  iframe.style.border = '0'
  iframe.style.background = '#ffffff'
  iframe.style.opacity = '0.01'
  iframe.setAttribute('aria-hidden', 'true')

  let printed = false
  let retryId
  let cleanupId

  const cleanup = () => {
    window.clearTimeout(retryId)
    window.clearTimeout(cleanupId)
    cleanupId = window.setTimeout(() => iframe.remove(), 3000)
  }

  const runPrint = () => {
    if (printed) return
    printed = true

    try {
      const printWindow = iframe.contentWindow
      if (!printWindow) throw new Error('Janela de impressão indisponível.')

      printWindow.focus()
      printWindow.print()
      cleanup()
    } catch (error) {
      cleanup()
      onError?.(error)
    }
  }

  const waitAndPrint = async (attempt = 0) => {
    if (printed) return

    const doc = iframe.contentDocument
    const rendered = Boolean(doc?.body?.innerText?.trim())

    if (!rendered) {
      if (attempt < 12) {
        retryId = window.setTimeout(() => waitAndPrint(attempt + 1), 250)
        return
      }

      cleanup()
      onError?.(new Error('Documento de impressão não foi renderizado.'))
      return
    }

    try {
      if (doc.fonts?.ready) {
        await doc.fonts.ready
      }

      const images = Array.from(doc.images || [])
      await Promise.all(images.map((image) => {
        if (image.complete) return Promise.resolve()
        return new Promise((resolve) => {
          image.onload = resolve
          image.onerror = resolve
        })
      }))

      window.requestAnimationFrame(() => {
        window.setTimeout(runPrint, 350)
      })
    } catch (error) {
      if (attempt < 12) {
        retryId = window.setTimeout(() => waitAndPrint(attempt + 1), 250)
        return
      }

      cleanup()
      onError?.(error)
    }
  }

  iframe.onload = () => waitAndPrint()

  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  if (!doc) {
    cleanup()
    onError?.(new Error('Documento de impressão indisponível.'))
    return
  }

  doc.open()
  doc.write(html)
  doc.close()

  retryId = window.setTimeout(() => waitAndPrint(), 500)
}

export function createXlsxBlob(sheets) {
  const safeSheets = (Array.isArray(sheets) ? sheets : []).map((sheet) => ({
    name: sanitizeSheetName(sheet.name),
    rows: Array.isArray(sheet.rows) ? sheet.rows : []
  }))

  if (safeSheets.length === 0) {
    safeSheets.push({ name: 'Relatório', rows: [['Sem dados para exportar']] })
  }

  const workbookXml = xml(`
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${safeSheets.map((sheet, index) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('')}
  </sheets>
</workbook>`)

  const workbookRels = xml(`
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${safeSheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('')}
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`)

  const rootRels = xml(`
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`)

  const contentTypes = xml(`
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${safeSheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}
</Types>`)

  const stylesXml = xml(`
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;R$&quot; #,##0.00"/></numFmts>
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1"/></cellXfs>
</styleSheet>`)

  const files = [
    { path: '[Content_Types].xml', content: contentTypes },
    { path: '_rels/.rels', content: rootRels },
    { path: 'xl/workbook.xml', content: workbookXml },
    { path: 'xl/_rels/workbook.xml.rels', content: workbookRels },
    { path: 'xl/styles.xml', content: stylesXml },
    ...safeSheets.map((sheet, index) => ({ path: `xl/worksheets/sheet${index + 1}.xml`, content: createWorksheetXml(sheet.rows) }))
  ]

  return new Blob([zipStore(files)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

function createWorksheetXml(rows) {
  const colCount = rows.reduce((max, row) => Math.max(max, row?.length || 0), 0)
  const widths = Array.from({ length: colCount }, (_, index) => {
    const width = Math.min(Math.max(...rows.map((row) => String(row?.[index] ?? '').length), 10) + 2, 38)
    return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`
  }).join('')

  const xmlRows = rows.map((row, rowIndex) => {
    const cells = (row || []).map((value, colIndex) => createCellXml(value, colIndex, rowIndex)).join('')
    return `<row r="${rowIndex + 1}">${cells}</row>`
  }).join('')

  return xml(`
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${widths}</cols>
  <sheetData>${xmlRows}</sheetData>
</worksheet>`)
}

function createCellXml(value, colIndex, rowIndex) {
  const ref = `${colName(colIndex)}${rowIndex + 1}`
  const isHeader = rowIndex === 0
  const isNumber = typeof value === 'number' && Number.isFinite(value)
  const style = isHeader ? (isNumber ? 3 : 1) : (isNumber ? 2 : 0)

  if (isNumber) {
    return `<c r="${ref}" s="${style}"><v>${value}</v></c>`
  }

  return `<c r="${ref}" t="inlineStr" s="${style}"><is><t>${escapeXml(value)}</t></is></c>`
}

function colName(index) {
  let name = ''
  let current = index + 1
  while (current > 0) {
    const modulo = (current - 1) % 26
    name = String.fromCharCode(65 + modulo) + name
    current = Math.floor((current - modulo) / 26)
  }
  return name
}

function sanitizeSheetName(name) {
  return String(name || 'Planilha').replace(/[\\/?*\[\]:]/g, ' ').slice(0, 31) || 'Planilha'
}

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function xml(content) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${content}`
}

function zipStore(files) {
  const encoder = new TextEncoder()
  const chunks = []
  const central = []
  let offset = 0

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.path)
    const data = encoder.encode(file.content)
    const crc = crc32(data)
    const local = new Uint8Array(30 + nameBytes.length)
    const view = new DataView(local.buffer)
    view.setUint32(0, 0x04034b50, true)
    view.setUint16(4, 20, true)
    view.setUint16(6, 0, true)
    view.setUint16(8, 0, true)
    view.setUint16(10, 0, true)
    view.setUint16(12, 0, true)
    view.setUint32(14, crc, true)
    view.setUint32(18, data.length, true)
    view.setUint32(22, data.length, true)
    view.setUint16(26, nameBytes.length, true)
    view.setUint16(28, 0, true)
    local.set(nameBytes, 30)
    chunks.push(local, data)

    const centralHeader = new Uint8Array(46 + nameBytes.length)
    const centralView = new DataView(centralHeader.buffer)
    centralView.setUint32(0, 0x02014b50, true)
    centralView.setUint16(4, 20, true)
    centralView.setUint16(6, 20, true)
    centralView.setUint16(8, 0, true)
    centralView.setUint16(10, 0, true)
    centralView.setUint16(12, 0, true)
    centralView.setUint16(14, 0, true)
    centralView.setUint32(16, crc, true)
    centralView.setUint32(20, data.length, true)
    centralView.setUint32(24, data.length, true)
    centralView.setUint16(28, nameBytes.length, true)
    centralView.setUint16(30, 0, true)
    centralView.setUint16(32, 0, true)
    centralView.setUint16(34, 0, true)
    centralView.setUint16(36, 0, true)
    centralView.setUint32(38, 0, true)
    centralView.setUint32(42, offset, true)
    centralHeader.set(nameBytes, 46)
    central.push(centralHeader)
    offset += local.length + data.length
  })

  const centralOffset = offset
  central.forEach((chunk) => {
    chunks.push(chunk)
    offset += chunk.length
  })

  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)
  endView.setUint32(0, 0x06054b50, true)
  endView.setUint16(8, files.length, true)
  endView.setUint16(10, files.length, true)
  endView.setUint32(12, offset - centralOffset, true)
  endView.setUint32(16, centralOffset, true)
  chunks.push(end)

  return new Blob(chunks)
}

function crc32(data) {
  let crc = -1
  for (let i = 0; i < data.length; i += 1) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff]
  }
  return (crc ^ -1) >>> 0
}

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()
