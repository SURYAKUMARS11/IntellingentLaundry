import { Router } from 'express';
import { getWhatsAppStatus, disconnectWhatsApp } from '../services/whatsappGateway';

const router = Router();

router.get('/status', (req, res) => {
  const status = getWhatsAppStatus();
  res.json({ success: true, ...status });
});

router.post('/disconnect', async (req, res) => {
  await disconnectWhatsApp();
  res.json({ success: true, message: 'WhatsApp Gateway disconnected. Scan new QR code.' });
});

export default router;
