import jsPDF from 'jspdf'
import type { GridEntry } from '../types'

async function toBase64(url: string): Promise<string> {
  const buf = await fetch(url).then((r) => r.arrayBuffer())
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
  }
  return btoa(binary)
}

export async function downloadGridPdf(
  eventLabel: string,
  eventDate: string,
  grid: GridEntry[],
  reserve: GridEntry[],
): Promise<void> {
  const [regularB64, boldB64] = await Promise.all([
    toBase64('/fonts/Roboto-Regular.ttf'),
    toBase64('/fonts/Roboto-Bold.ttf'),
  ])

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  doc.addFileToVFS('Roboto-Regular.ttf', regularB64)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.addFileToVFS('Roboto-Bold.ttf', boldB64)
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')

  const pageW = 210
  const colLeft = 20
  const colRight = 115

  // Header
  doc.setFontSize(18)
  doc.setFont('Roboto', 'bold')
  doc.text(eventLabel, pageW / 2, 22, { align: 'center' })

  doc.setFontSize(11)
  doc.setFont('Roboto', 'normal')
  doc.setTextColor(100)
  doc.text(
    `Starting Grid · ${new Date(`${eventDate}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    pageW / 2,
    30,
    { align: 'center' },
  )
  doc.setTextColor(0)

  // Divider
  doc.setDrawColor(200)
  doc.line(colLeft, 34, pageW - colLeft, 34)

  const groupA = grid.slice(0, 13)
  const groupB = grid.slice(13, 26)

  let y = 44

  // Group headers
  doc.setFontSize(13)
  doc.setFont('Roboto', 'bold')
  doc.text('Group A', colLeft, y)
  doc.text('Group B', colRight, y)

  y += 3
  doc.setDrawColor(220)
  doc.line(colLeft, y, colLeft + 70, y)
  doc.line(colRight, y, colRight + 70, y)
  y += 7

  // Driver rows
  const rowH = 7
  const maxRows = Math.max(groupA.length, groupB.length)

  for (let i = 0; i < maxRows; i++) {
    const a = groupA[i]
    const b = groupB[i]

    if (i % 2 === 0) {
      doc.setFillColor(245, 245, 245)
      doc.rect(colLeft - 2, y - 5, 72, rowH, 'F')
      doc.rect(colRight - 2, y - 5, 72, rowH, 'F')
    }

    doc.setFontSize(10)
    if (a) {
      doc.setFont('Roboto', 'bold')
      doc.text(`${i + 1}.`, colLeft, y)
      doc.setFont('Roboto', 'normal')
      doc.text(a.registration.nickname, colLeft + 8, y)
    }
    if (b) {
      doc.setFont('Roboto', 'bold')
      doc.text(`${i + 1}.`, colRight, y)
      doc.setFont('Roboto', 'normal')
      doc.text(b.registration.nickname, colRight + 8, y)
    }

    y += rowH
  }

  // Reserve section
  if (reserve.length > 0) {
    y += 8
    doc.setFontSize(13)
    doc.setFont('Roboto', 'bold')
    doc.text('Reserve', colLeft, y)
    y += 3
    doc.setDrawColor(220)
    doc.line(colLeft, y, colLeft + 70, y)
    y += 7

    doc.setFontSize(10)
    reserve.forEach((r, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(245, 245, 245)
        doc.rect(colLeft - 2, y - 5, 72, rowH, 'F')
      }
      doc.setFont('Roboto', 'bold')
      doc.text(`${i + 1}.`, colLeft, y)
      doc.setFont('Roboto', 'normal')
      doc.text(r.registration.nickname, colLeft + 8, y)
      y += rowH
    })
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(160)
  doc.text('gladiatorgokartgames.pl', pageW / 2, 287, { align: 'center' })

  doc.save(`starting_grid_${eventDate}.pdf`)
}
