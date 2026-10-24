/**
 * Certificate PDF generation using pdf-lib (zero native dependencies).
 *
 * Produces a clean, professional A4-landscape certificate with:
 * - Double border frame (gold outer, thin inner)
 * - Soft Reset School branding
 * - Track title, recipient name, date, exam score
 * - Verification code + URL
 */
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';

/* ─── Colors ─── */
const GOLD = rgb(0.788, 0.659, 0.298);     // #c9a84c
const DARK = rgb(0.1, 0.1, 0.1);
const MID = rgb(0.4, 0.4, 0.38);
const LIGHT = rgb(0.6, 0.6, 0.57);

/* ─── Track display names ─── */
const TRACK_NAMES: Record<string, string> = {
  fundamentals: 'Code from Bed',
  ai: 'AI Literacy for Humans',
  tools: 'Build Cool Tools Fast',
  advanced: 'AI Agents that Work',
  'ai-orchestrated-dev': 'AI-Assisted Software Development',
  'ai-workflow-consulting': 'AI Automation Consulting',
  'ai-oversight-health-informatics': 'AI-Augmented Medical Coding',
  'accessibility-qa-lived-experience': 'Digital Accessibility QA',
};

/* ─── Helpers ─── */

/** Draw centered text on a page. Returns the Y position after drawing. */
function drawCentered(
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
  color = DARK,
): number {
  const width = font.widthOfTextAtSize(text, size);
  const pageWidth = page.getWidth();
  page.drawText(text, {
    x: (pageWidth - width) / 2,
    y,
    size,
    font,
    color,
  });
  return y - size * 1.4;
}

/** Draw a horizontal line centered on the page. */
function drawHLine(page: PDFPage, y: number, lineWidth: number, color = GOLD, thickness = 1.5) {
  const pageWidth = page.getWidth();
  const x = (pageWidth - lineWidth) / 2;
  page.drawLine({
    start: { x, y },
    end: { x: x + lineWidth, y },
    thickness,
    color,
  });
}

/* ─── Main export ─── */

export interface CertificateData {
  recipientName: string;
  trackId: string;
  examScore: number;
  issuedAt: Date;
  verifyCode: string;
  verifyBaseUrl?: string;
}

/**
 * Generate a certificate PDF and return as a Uint8Array (Buffer-compatible).
 */
export async function generateCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // A4 landscape: 841.89 x 595.28 pts
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const page = doc.addPage([pageWidth, pageHeight]);

  // Embed standard fonts (no custom font files needed)
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const courier = await doc.embedFont(StandardFonts.Courier);
  const timesItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  // ── Outer gold border ──
  const borderInset = 24;
  page.drawRectangle({
    x: borderInset,
    y: borderInset,
    width: pageWidth - borderInset * 2,
    height: pageHeight - borderInset * 2,
    borderColor: GOLD,
    borderWidth: 3,
  });

  // ── Inner thin border ──
  const innerInset = 36;
  page.drawRectangle({
    x: innerInset,
    y: innerInset,
    width: pageWidth - innerInset * 2,
    height: pageHeight - innerInset * 2,
    borderColor: GOLD,
    borderWidth: 0.75,
    opacity: 0.4,
  });

  // ── Corner ornaments (small gold squares) ──
  const corners = [
    [borderInset + 6, pageHeight - borderInset - 14],
    [pageWidth - borderInset - 14, pageHeight - borderInset - 14],
    [borderInset + 6, borderInset + 6],
    [pageWidth - borderInset - 14, borderInset + 6],
  ];
  for (const [cx, cy] of corners) {
    page.drawRectangle({ x: cx, y: cy, width: 8, height: 8, color: GOLD });
  }

  // ── Top accent line ──
  let y = pageHeight - 70;
  drawHLine(page, y, 80, GOLD, 2);

  // ── "SOFT RESET SCHOOL" branding ──
  y -= 28;
  y = drawCentered(page, 'SOFT RESET SCHOOL', y, helvetica, 11, GOLD);

  // ── "Certificate of Completion" ──
  y -= 12;
  y = drawCentered(page, 'CERTIFICATE OF COMPLETION', y, helvetica, 10, LIGHT);

  // ── Track title ──
  y -= 16;
  const trackName = TRACK_NAMES[data.trackId] ?? data.trackId;
  y = drawCentered(page, trackName, y, helveticaBold, 26, DARK);

  // ── Divider ──
  y -= 8;
  drawHLine(page, y, 50, LIGHT, 0.75);

  // ── "Awarded to" ──
  y -= 24;
  y = drawCentered(page, 'Awarded to', y, timesItalic, 12, LIGHT);

  // ── Recipient name ──
  y -= 8;
  const name = data.recipientName || 'Certificate Holder';
  y = drawCentered(page, name, y, helveticaBold, 22, DARK);

  // ── Date ──
  y -= 12;
  const dateStr = data.issuedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  y = drawCentered(page, dateStr, y, helvetica, 10, MID);

  // ── Score ──
  y -= 8;
  y = drawCentered(
    page,
    `Exam Score: ${Math.round(data.examScore)}%`,
    y,
    helvetica,
    10,
    MID,
  );

  // ── Verification box ──
  y -= 24;
  const boxW = 260;
  const boxH = 48;
  const boxX = (pageWidth - boxW) / 2;
  page.drawRectangle({
    x: boxX,
    y: y - boxH,
    width: boxW,
    height: boxH,
    borderColor: GOLD,
    borderWidth: 0.5,
    opacity: 0.15,
    color: rgb(0.96, 0.96, 0.94),
  });

  // "Verification Code" label
  const labelText = 'VERIFICATION CODE';
  const labelWidth = helvetica.widthOfTextAtSize(labelText, 7);
  page.drawText(labelText, {
    x: (pageWidth - labelWidth) / 2,
    y: y - 14,
    size: 7,
    font: helvetica,
    color: LIGHT,
  });

  // Code itself
  const codeWidth = courier.widthOfTextAtSize(data.verifyCode, 14);
  page.drawText(data.verifyCode, {
    x: (pageWidth - codeWidth) / 2,
    y: y - 34,
    size: 14,
    font: courier,
    color: GOLD,
  });

  // ── Verification URL (small, at bottom) ──
  y = y - boxH - 16;
  const verifyUrl = data.verifyBaseUrl
    ? `${data.verifyBaseUrl}/verify/${data.verifyCode}`
    : `https://softreset.school/verify/${data.verifyCode}`;
  drawCentered(page, `Verify at: ${verifyUrl}`, y, helvetica, 7.5, LIGHT);

  // ── Bottom accent line ──
  drawHLine(page, borderInset + 48, 80, GOLD, 2);

  // ── Set PDF metadata ──
  doc.setTitle(`Soft Reset School Certificate – ${trackName}`);
  doc.setAuthor('Soft Reset School');
  doc.setSubject(`Certificate of Completion: ${trackName}`);
  doc.setCreator('Soft Reset School Platform');

  return doc.save();
}
