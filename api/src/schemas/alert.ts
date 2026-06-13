import { z } from 'zod';

export const createAlertSchema = z.object({
  symbol: z.string().min(1).max(10),
  condition: z.enum(['above', 'below']),
  target_price: z.coerce.number().positive(),
});

export const updateAlertSchema = z.object({
  is_active: z.boolean(),
});
