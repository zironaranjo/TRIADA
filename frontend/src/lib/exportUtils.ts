import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── CSV Export ───────────────────────────────────────
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
            const str = String(cell);
            // Escape commas and quotes
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filename}.csv`);
}

// ─── PDF Export ───────────────────────────────────────
interface PDFOptions {
    title: string;
    subtitle?: string;
    headers: string[];
    rows: (string | number)[][];
    summaryRows?: { label: string; value: string; bold?: boolean }[];
    filename: string;
}

export function exportToPDF({ title, subtitle, headers, rows, summaryRows, filename }: PDFOptions) {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 60);
    doc.text('TRIADAK', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 140);
    doc.text('Vacation Rental Management', 14, 26);

    // Title
    doc.setFontSize(16);
    doc.setTextColor(30, 30, 60);
    doc.text(title, 14, 40);

    if (subtitle) {
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 140);
        doc.text(subtitle, 14, 47);
    }

    // Date
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 160);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`, 14, subtitle ? 54 : 47);

    const startY = subtitle ? 60 : 53;

    // Summary section
    if (summaryRows && summaryRows.length > 0) {
        autoTable(doc, {
            startY,
            head: [],
            body: summaryRows.map(r => [r.label, r.value]),
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
                0: { fontStyle: 'normal', textColor: [100, 100, 120] },
                1: { fontStyle: 'bold', halign: 'right', textColor: [30, 30, 60] },
            },
            margin: { left: 14, right: 14 },
        });
    }

    // Main table
    const tableStartY = summaryRows && summaryRows.length > 0
        ? (doc as any).lastAutoTable.finalY + 10
        : startY;

    autoTable(doc, {
        startY: tableStartY,
        head: [headers],
        body: rows.map(row => row.map(String)),
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: {
            fillColor: [79, 70, 229],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
        },
        alternateRowStyles: { fillColor: [245, 245, 250] },
        margin: { left: 14, right: 14 },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 160);
        doc.text(
            `Page ${i} of ${pageCount} — TRIADAK © ${new Date().getFullYear()}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    doc.save(`${filename}.pdf`);
}

// ─── Helper ───────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
