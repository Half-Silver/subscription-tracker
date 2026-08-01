import { Router } from 'express';
import prisma from '../db';

const router = Router();

const mapPaymentMethod = (m: any) => ({
  id: m.id,
  label: m.name,
  type: "credit", // Default
  detail: m.last4 ? `${m.name} • ${m.last4}` : m.name,
});

// Get all payment methods
router.get('/', async (req, res) => {
  try {
    const methods = await prisma.paymentMethod.findMany();
    res.json(methods.map(mapPaymentMethod));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// Create a payment method
router.post('/', async (req, res) => {
  const { name, last4 } = req.body;
  try {
    const method = await prisma.paymentMethod.create({
      data: { name, last4 },
    });
    res.json(mapPaymentMethod(method));
  } catch (err) {
    res.status(500).json({ error: 'Failed to create payment method' });
  }
});

// Update a payment method
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, last4 } = req.body;
  try {
    const method = await prisma.paymentMethod.update({
      where: { id },
      data: { name, last4 },
    });
    res.json(mapPaymentMethod(method));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment method' });
  }
});

// Delete a payment method
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.paymentMethod.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

export default router;
