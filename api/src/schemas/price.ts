import { z } from 'zod';

export const priceHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
