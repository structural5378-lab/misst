// Client-side CSV + PDF export helpers for the moderation suite.
// PDFs use jspdf; the analytics PDF captures the rendered dashboard DOM via
// html2canvas so charts are included as images.
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function download(filename, content, mime = 'text/csv') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvRows(rows) {
  return rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

function safe(name = 'export') {
  return String(name).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'export';
}

export function exportHistoryCSV(items, targetName = 'member') {
  const rows = [['Date', 'Admin/Author', 'Action', 'Category', 'Reason', 'Duration', 'Room', 'Message Preview', 'Source']];
  items.forEach((i) => rows.push([
    i.date || '', i.admin_name || '', i.action_label || i.action || '', i.category || '',
    i.reason || '', i.duration || '', i.room_name || '', i.message_preview || '', i.source || '',
  ]));
  download(`moderation-history-${safe(targetName)}.csv`, csvRows(rows));
}

export function exportHistoryPDF(items, communityName, targetName) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Moderation History', 14, 18);
  doc.setFontSize(10);
  doc.text(`${communityName} — ${targetName}`, 14, 26);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
  doc.setFontSize(9);
  let y = 42;
  items.forEach((i) => {
    if (y > 280) { doc.addPage(); y = 20; }
    const head = `${i.date ? new Date(i.date).toLocaleString() : ''}  ·  ${i.action_label || i.action || ''}  ·  ${i.admin_name || ''}`;
    doc.setTextColor(20);
    doc.text(doc.splitTextToSize(head, 180), 14, y);
    y += 6;
    if (i.reason) {
      doc.setTextColor(120);
      doc.text(doc.splitTextToSize(`Reason: ${i.reason}${i.duration ? ` (${i.duration})` : ''}`, 180), 18, y);
      y += 6;
    }
    y += 2;
  });
  doc.save(`moderation-history-${safe(targetName)}.pdf`);
}

export function exportAnalyticsCSV(data) {
  const rows = [['Section', 'Label', 'Value']];
  Object.entries(data.summary || {}).forEach(([k, v]) => rows.push(['Summary', k, v]));
  const c = data.charts || {};
  (c.dailyActions || []).forEach((d) => rows.push(['DailyActions', d.date, d.count]));
  (c.weeklyActions || []).forEach((d) => rows.push(['WeeklyActions', d.week, d.count]));
  (c.monthlyActions || []).forEach((d) => rows.push(['MonthlyActions', d.month, d.count]));
  (c.topModerators || []).forEach((d) => rows.push(['TopModerators', d.name, d.count]));
  (c.mostModeratedMembers || []).forEach((d) => rows.push(['MostModeratedMembers', d.name, d.count]));
  (c.mostModeratedRooms || []).forEach((d) => rows.push(['MostModeratedRooms', d.name, d.count]));
  (c.commonReasons || []).forEach((d) => rows.push(['CommonReasons', d.reason, d.count]));
  (c.muteDurationDistribution || []).forEach((d) => rows.push(['MuteDuration', d.bucket, d.count]));
  (c.banTrends || []).forEach((d) => rows.push(['BanTrends', d.month, d.count]));
  (c.reportResolutionTime || []).forEach((d) => rows.push(['ReportResolution', d.label, d.hours]));
  download(`moderation-analytics-${safe(data.community?.slug || 'community')}.csv`, csvRows(rows));
}

export async function exportAnalyticsPDFFromDOM(node, data) {
  if (!node) return;
  const canvas = await html2canvas(node, { backgroundColor: '#0a0f1e', scale: 2, logging: false, useCORS: true });
  const imgData = canvas.toDataURL('image/png');
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  const imgW = pageW - margin * 2;
  const imgH = (canvas.height * imgW) / canvas.width;
  let heightLeft = imgH;
  let position = margin;
  doc.addImage(imgData, 'PNG', margin, position, imgW, imgH);
  heightLeft -= pageH - margin;
  while (heightLeft > 0) {
    doc.addPage();
    position = margin - (imgH - heightLeft);
    doc.addImage(imgData, 'PNG', margin, position, imgW, imgH);
    heightLeft -= pageH;
  }
  // Footer with generation metadata on every page.
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `${data.community?.name || ''} · ${data.range || ''} · Generated ${new Date().toLocaleString()} · Page ${p}/${totalPages}`,
      margin, pageH - 6
    );
  }
  doc.save(`moderation-analytics-${safe(data.community?.slug || 'community')}.pdf`);
}