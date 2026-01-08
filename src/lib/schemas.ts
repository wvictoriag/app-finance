import { z } from 'zod';

export const transactionSchema = z.object({
    id: z.string().optional(),
    account_id: z.string().min(1, 'La cuenta es obligatoria'),
    destination_account_id: z.string().optional().nullable(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
    category_id: z.string().optional().nullable(),
    amount: z.coerce.number().refine(val => val !== 0, 'El monto debe ser distinto de cero'),
    description: z.string().max(100, 'Descripción demasiado larga').optional(),
    type: z.enum(['income', 'expense', 'transfer']),
}).refine(data => {
    if (data.type === 'transfer' && !data.destination_account_id) return false;
    if (data.type !== 'transfer' && !data.category_id) return false;
    return true;
}, {
    message: 'Falta información requerida',
    path: ['category_id']
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

export const accountSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    bank: z.string().optional(),
    account_number: z.string().optional(),
    type: z.enum(['Debit', 'Credit', 'CreditLine', 'Receivable', 'Cash', 'Investment']),
    balance: z.coerce.number(),
    credit_limit: z.coerce.number().default(0),
    initial_balance: z.coerce.number().default(0),
});

export type AccountFormData = z.infer<typeof accountSchema>;
