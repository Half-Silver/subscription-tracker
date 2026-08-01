import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import paymentMethodsRouter from './paymentMethods';
import prisma from '../db';

vi.mock('../db', () => {
  return {
    default: {
      paymentMethod: {
        findMany: vi.fn(),
        create: vi.fn(),
      }
    }
  };
});

const app = express();
app.use(express.json());
app.use('/payment-methods', paymentMethodsRouter);

describe('Payment Methods API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /payment-methods should map models to frontend format', async () => {
    (prisma.paymentMethod.findMany as any).mockResolvedValue([
      { id: '1', name: 'Chase Sapphire', last4: '4111' },
      { id: '2', name: 'PayPal', last4: null }
    ]);

    const res = await request(app).get('/payment-methods');
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: '1', label: 'Chase Sapphire', type: 'credit', detail: 'Chase Sapphire • 4111' },
      { id: '2', label: 'PayPal', type: 'credit', detail: 'PayPal' }
    ]);
  });

  it('POST /payment-methods should create and map the returned model', async () => {
    (prisma.paymentMethod.create as any).mockResolvedValue({
      id: '3', name: 'Amex', last4: '1000'
    });

    const res = await request(app)
      .post('/payment-methods')
      .send({ name: 'Amex', last4: '1000' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: '3',
      label: 'Amex',
      type: 'credit',
      detail: 'Amex • 1000'
    });
    
    expect(prisma.paymentMethod.create).toHaveBeenCalledWith({
      data: { name: 'Amex', last4: '1000' }
    });
  });
});
