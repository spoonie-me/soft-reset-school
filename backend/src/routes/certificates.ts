// @ts-nocheck
import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { generateCertificatePdf } from '../lib/certificatePdf.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

// Verify certificate by code (public) — MUST be before /:id to avoid shadowing
router.get('/verify/:code', async (req, res) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { verifyCode: req.params.code },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!certificate) {
      res.json({ valid: false, message: 'No certificate found with this code' });
      return;
    }

    res.json({
      valid: true,
      certificate: {
        id: certificate.id,
        trackId: certificate.trackId,
        examScore: certificate.examScore,
        issuedAt: certificate.issuedAt,
        holderName: certificate.user.name,
      },
    });
  } catch (err) {
    console.error('Certificate verify error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download certificate as PDF (requires auth — only the owner can download)
router.get('/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const certificate = await prisma.certificate.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    if (!certificate) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }

    if (certificate.userId !== authReq.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const origin = req.get('origin') ?? 'https://softreset.school';
    const pdfBytes = await generateCertificatePdf({
      recipientName: certificate.user.name ?? 'Certificate Holder',
      trackId: certificate.trackId,
      examScore: certificate.examScore,
      issuedAt: certificate.issuedAt,
      verifyCode: certificate.verifyCode,
      verifyBaseUrl: origin,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="soft-reset-school-certificate-${certificate.verifyCode}.pdf"`,
    );
    res.setHeader('Content-Length', pdfBytes.length);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Certificate PDF error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Get certificate by ID — requires auth; only returns email to the certificate owner
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const certificate = await prisma.certificate.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!certificate) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }

    const isOwner = certificate.userId === authReq.userId;

    res.json({
      certificate: {
        id: certificate.id,
        trackId: certificate.trackId,
        examScore: certificate.examScore,
        issuedAt: certificate.issuedAt,
        verifyCode: certificate.verifyCode,
        pdfUrl: `/api/certificates/${certificate.id}/pdf`,
        holder: {
          name: certificate.user.name,
          // Only expose email to the certificate owner
          ...(isOwner ? { email: certificate.user.email } : {}),
        },
      },
    });
  } catch (err) {
    console.error('Certificate get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
