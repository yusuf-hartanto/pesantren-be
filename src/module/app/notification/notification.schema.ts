import { z } from 'zod';

export const notificationSchema = z.object({
  from: z.any(),
  to: z.any(),
  title: z.any(),
  type: z.any(),
  url: z.any(),
  message: z.any(),
  status: z.any(),
});
