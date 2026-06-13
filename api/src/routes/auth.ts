import { Router } from 'express';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema } from '../schemas/auth';
import { register, login } from '../controllers/authController';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), register);
authRouter.post('/login', validateBody(loginSchema), login);
