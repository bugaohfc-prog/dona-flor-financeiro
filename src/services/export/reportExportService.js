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

  const openedWindow = window.open('', '_blank')
  if (openedWindow) {
    try {
      openedWindow.document.open()
      openedWindow.document.write(html)
      openedWindow.document.close()

      let printed = false
      let attempt = 0

      const runPrint = async () => {
        if (printed) return

        const doc = openedWindow.document
        const ready = doc.readyState === 'complete' || doc.readyState === 'interactive'
        const rendered = Boolean(doc.body?.innerText?.trim())

        if ((!ready || !rendered) && attempt < 12) {
          attempt += 1
          window.setTimeout(runPrint, 250)
          return
        }

        printed = true

        try {
          if (doc.fonts?.ready) {
            await doc.fonts.ready
          }

          openedWindow.focus()
          window.setTimeout(() => openedWindow.print(), 150)
        } catch (error) {
          printWithHiddenIframe(html, onError)
        }
      }

      window.setTimeout(runPrint, 250)
      return
    } catch (error) {
      try {
        openedWindow.close()
      } catch {
        // Mantem fallback por iframe quando a janela nao puder ser controlada.
      }
    }
  }

  printWithHiddenIframe(html, onError)
}

function printWithHiddenIframe(html, onError) {
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
    rows: Array.isArray(sheet.rows) ? sheet.rows : [],
    landscape: sheet.landscape === true,
    fitToWidth: Number.isFinite(Number(sheet.fitToWidth)) ? Number(sheet.fitToWidth) : null,
    currencyColumns: Array.isArray(sheet.currencyColumns) ? sheet.currencyColumns : []
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
  <cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1"/><xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="1" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1"/></cellXfs>
</styleSheet>`)

  const files = [
    { path: '[Content_Types].xml', content: contentTypes },
    { path: '_rels/.rels', content: rootRels },
    { path: 'xl/workbook.xml', content: workbookXml },
    { path: 'xl/_rels/workbook.xml.rels', content: workbookRels },
    { path: 'xl/styles.xml', content: stylesXml },
    ...safeSheets.map((sheet, index) => ({ path: `xl/worksheets/sheet${index + 1}.xml`, content: createWorksheetXml(sheet.rows, sheet) }))
  ]

  return new Blob([zipStore(files)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export function createFluxoCaixaXlsxBlob(sheets) {
  const safeSheets = uniqueSheetNames((Array.isArray(sheets) ? sheets : []).map((sheet) => ({
    name: sheet?.name,
    model: sheet?.model || {}
  })))

  if (safeSheets.length === 0) {
    throw new Error('Nenhuma aba disponível para o Fluxo de Caixa.')
  }

  const workbookXml = xml(`
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${safeSheets.map((sheet, index) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('')}
  </sheets>
  <definedNames>
    ${safeSheets.map((sheet, index) => `<definedName name="_xlnm.Print_Area" localSheetId="${index}">'${escapeXml(sheet.name.replaceAll("'", "''"))}'!$A$1:$M$27</definedName>`).join('')}
  </definedNames>
  <calcPr calcId="191029" calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/>
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

  const files = [
    { path: '[Content_Types].xml', content: contentTypes },
    { path: '_rels/.rels', content: rootRels },
    { path: 'xl/workbook.xml', content: workbookXml },
    { path: 'xl/_rels/workbook.xml.rels', content: workbookRels },
    { path: 'xl/styles.xml', content: createFluxoCaixaStylesXml() },
    ...safeSheets.map((sheet, index) => ({
      path: `xl/worksheets/sheet${index + 1}.xml`,
      content: createFluxoCaixaWorksheetXml(sheet.model)
    }))
  ]

  return new Blob([zipStore(files)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

export function createFluxoCaixaWorksheetXml(model = {}) {
  const meses = Array.from({ length: 12 }, (_, index) => String(model.meses?.[index] || ''))
  const faturamento = Array.from({ length: 12 }, (_, index) => finiteNumber(model.faturamento?.[index]))
  const despesas = Array.from({ length: 12 }, (_, rowIndex) => ({
    nome: String(model.despesas?.[rowIndex]?.nome || ''),
    valores: Array.from({ length: 12 }, (_, monthIndex) => finiteNumber(model.despesas?.[rowIndex]?.valores?.[monthIndex]))
  }))
  const totais = Array.from({ length: 12 }, (_, monthIndex) => finiteNumber(
    model.totais?.[monthIndex] ?? faturamento[monthIndex] - despesas.reduce((sum, row) => sum + row.valores[monthIndex], 0)
  ))

  const rows = [
    `<row r="1" ht="20" customHeight="1">${inlineStringCell('A1', model.titulo, 1)}${emptyCells(1, 1, 12, 4)}</row>`,
    `<row r="2" ht="18" customHeight="1">${inlineStringCell('A2', `EMPRESA: ${model.empresa || ''}`, 1)}${emptyCells(2, 1, 12, 4)}</row>`,
    `<row r="3" ht="18" customHeight="1">${inlineStringCell('A3', `CNPJ: ${model.cnpj || ''}`, 1)}${emptyCells(3, 1, 12, 4)}</row>`,
    `<row r="4" ht="18" customHeight="1">${inlineStringCell('A4', `ENDEREÇO: ${model.endereco || ''}`, 3)}${emptyCells(4, 1, 12, 5)}</row>`,
    `<row r="5" ht="18" customHeight="1">${inlineStringCell('A5', '', 6)}${meses.map((mes, index) => inlineStringCell(`${colName(index + 1)}5`, mes, 7)).join('')}</row>`,
    `<row r="6" ht="18" customHeight="1">${inlineStringCell('A6', 'FATURAMENTO BRUTO', 8)}${faturamento.map((value, index) => numericCell(`${colName(index + 1)}6`, value, 9)).join('')}</row>`,
    ...despesas.map((row, rowIndex) => {
      const excelRow = rowIndex + 7
      return `<row r="${excelRow}" ht="18" customHeight="1">${inlineStringCell(`A${excelRow}`, row.nome, 8)}${row.valores.map((value, index) => numericCell(`${colName(index + 1)}${excelRow}`, value, 9)).join('')}</row>`
    }),
    `<row r="19" ht="18" customHeight="1">${inlineStringCell('A19', '', 8)}${emptyCells(19, 1, 12, 9)}</row>`,
    `<row r="20" ht="18" customHeight="1">${inlineStringCell('A20', 'TOTAL GERAL', 10)}${totais.map((value, index) => formulaCell(`${colName(index + 1)}20`, `${colName(index + 1)}6-SUM(${colName(index + 1)}7:${colName(index + 1)}18)`, value, 11)).join('')}</row>`,
    `<row r="26" ht="18" customHeight="1">${inlineStringCell('C26', '', 12)}</row>`,
    `<row r="27" ht="18" customHeight="1">${inlineStringCell('C27', model.assinatura || 'SÓCIO/PROPRIETÁRIO:', 13)}</row>`
  ].join('')

  return xml(`
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
  <sheetViews><sheetView showGridLines="0" workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>
    <col min="1" max="1" width="46.140625" customWidth="1"/>
    <col min="2" max="2" width="14.140625" customWidth="1"/>
    <col min="3" max="3" width="21.7109375" customWidth="1"/>
    <col min="4" max="7" width="14.140625" customWidth="1"/>
    <col min="8" max="12" width="13.42578125" customWidth="1"/>
    <col min="13" max="13" width="14.5703125" customWidth="1"/>
  </cols>
  <sheetData>${rows}</sheetData>
  <mergeCells count="6">
    <mergeCell ref="A1:M1"/><mergeCell ref="A2:M2"/><mergeCell ref="A3:M3"/><mergeCell ref="A4:M4"/>
    <mergeCell ref="C26:G26"/><mergeCell ref="C27:G27"/>
  </mergeCells>
  <printOptions horizontalCentered="1"/>
  <pageMargins left="0.511811024" right="0.511811024" top="0.787401575" bottom="0.787401575" header="0.31496062" footer="0.31496062"/>
  <pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`)
}

function createFluxoCaixaStylesXml() {
  return xml(`
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;R$&quot; #,##0.00;-&quot;R$&quot; #,##0.00;&quot;-&quot;"/></numFmts>
  <fonts count="3">
    <font><sz val="10"/><name val="Arial"/><family val="2"/></font>
    <font><b/><sz val="10"/><name val="Arial"/><family val="2"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/><family val="2"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF595959"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF7F7F7F"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="8">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right><top style="thin"><color rgb="FF000000"/></top><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/></border>
    <border><left style="medium"><color rgb="FF000000"/></left><right/><top/><bottom/><diagonal/></border>
    <border><left style="medium"><color rgb="FF000000"/></left><right/><top/><bottom style="medium"><color rgb="FF000000"/></bottom><diagonal/></border>
    <border><left/><right/><top/><bottom style="medium"><color rgb="FF000000"/></bottom><diagonal/></border>
    <border><left style="medium"><color rgb="FF000000"/></left><right/><top style="medium"><color rgb="FF000000"/></top><bottom style="medium"><color rgb="FF000000"/></bottom><diagonal/></border>
    <border><left/><right/><top style="medium"><color rgb="FF000000"/></top><bottom/><diagonal/></border>
    <border><left/><right/><top style="thin"><color rgb="FF000000"/></top><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="14">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="5" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="6" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="2" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="164" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="7" xfId="0" applyBorder="1"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
</styleSheet>`)
}

function uniqueSheetNames(sheets) {
  const used = new Set()
  return sheets.map((sheet, index) => {
    const base = sanitizeSheetName(sheet.name || `Planilha ${index + 1}`)
    let name = base
    let suffix = 2
    while (used.has(name.toLocaleLowerCase('pt-BR'))) {
      const marker = ` (${suffix})`
      name = `${base.slice(0, 31 - marker.length)}${marker}`
      suffix += 1
    }
    used.add(name.toLocaleLowerCase('pt-BR'))
    return { ...sheet, name }
  })
}

function inlineStringCell(ref, value, style) {
  return `<c r="${ref}" t="inlineStr" s="${style}"><is><t>${escapeXml(value)}</t></is></c>`
}

function numericCell(ref, value, style) {
  return `<c r="${ref}" s="${style}"><v>${finiteNumber(value)}</v></c>`
}

function formulaCell(ref, formula, value, style) {
  return `<c r="${ref}" s="${style}"><f>${escapeXml(formula)}</f><v>${finiteNumber(value)}</v></c>`
}

function emptyCells(row, startColumn, count, style) {
  return Array.from({ length: count }, (_, index) => (
    inlineStringCell(`${colName(startColumn + index)}${row}`, '', style)
  )).join('')
}

function finiteNumber(value) {
  const number = Number(value || 0)
  return Number.isFinite(number) ? Math.round((number + Number.EPSILON) * 100) / 100 : 0
}

function createWorksheetXml(rows, options = {}) {
  const colCount = rows.reduce((max, row) => Math.max(max, row?.length || 0), 0)
  const widths = Array.from({ length: colCount }, (_, index) => {
    const width = Math.min(Math.max(...rows.map((row) => String(row?.[index] ?? '').length), 10) + 2, 38)
    return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`
  }).join('')

  const xmlRows = rows.map((row, rowIndex) => {
    const cells = (row || []).map((value, colIndex) => createCellXml(value, colIndex, rowIndex, rows[0]?.[colIndex], options)).join('')
    return `<row r="${rowIndex + 1}">${cells}</row>`
  }).join('')

  return xml(`
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  ${options.fitToWidth != null ? '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' : ''}
  <cols>${widths}</cols>
  <sheetData>${xmlRows}</sheetData>
  ${options.landscape ? '<printOptions horizontalCentered="1"/>' : ''}
  ${options.landscape || options.fitToWidth != null ? `<pageSetup orientation="${options.landscape ? 'landscape' : 'portrait'}"${options.fitToWidth != null ? ` fitToWidth="${options.fitToWidth}" fitToHeight="0"` : ''}/>` : ''}
</worksheet>`)
}

function createCellXml(value, colIndex, rowIndex, headerValue, options = {}) {
  const ref = `${colName(colIndex)}${rowIndex + 1}`
  const isHeader = rowIndex === 0
  const isNumber = typeof value === 'number' && Number.isFinite(value)
  const moeda = options.currencyColumns?.includes(colIndex)
    || /r\$|valor|previsto|realizado|pago|pendente|vencido|encargo|desconto|saldo|falta|receita|despesa|custo/i.test(String(headerValue || ''))
  const style = isHeader ? (isNumber ? (moeda ? 3 : 5) : 1) : (isNumber ? (moeda ? 2 : 4) : 0)

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
