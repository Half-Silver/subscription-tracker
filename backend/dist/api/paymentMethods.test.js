"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const paymentMethods_1 = __importDefault(require("./paymentMethods"));
const db_1 = __importDefault(require("../db"));
vitest_1.vi.mock('../db', () => {
    return {
        default: {
            paymentMethod: {
                findMany: vitest_1.vi.fn(),
                create: vitest_1.vi.fn(),
            }
        }
    };
});
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/payment-methods', paymentMethods_1.default);
(0, vitest_1.describe)('Payment Methods API', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('GET /payment-methods should map models to frontend format', async () => {
        db_1.default.paymentMethod.findMany.mockResolvedValue([
            { id: '1', name: 'Chase Sapphire', last4: '4111' },
            { id: '2', name: 'PayPal', last4: null }
        ]);
        const res = await (0, supertest_1.default)(app).get('/payment-methods');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body).toEqual([
            { id: '1', label: 'Chase Sapphire', type: 'credit', detail: 'Chase Sapphire • 4111' },
            { id: '2', label: 'PayPal', type: 'credit', detail: 'PayPal' }
        ]);
    });
    (0, vitest_1.it)('POST /payment-methods should create and map the returned model', async () => {
        db_1.default.paymentMethod.create.mockResolvedValue({
            id: '3', name: 'Amex', last4: '1000'
        });
        const res = await (0, supertest_1.default)(app)
            .post('/payment-methods')
            .send({ name: 'Amex', last4: '1000' });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body).toEqual({
            id: '3',
            label: 'Amex',
            type: 'credit',
            detail: 'Amex • 1000'
        });
        (0, vitest_1.expect)(db_1.default.paymentMethod.create).toHaveBeenCalledWith({
            data: { name: 'Amex', last4: '1000' }
        });
    });
});
