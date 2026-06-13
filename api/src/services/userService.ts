import { db } from '../config/db';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function createUser(email: string, password: string) {
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const [user] = await db('users')
    .insert({ email, password_hash })
    .returning(['id', 'email', 'created_at']);
  return user;
}

export async function findUserByEmail(email: string) {
  return db('users').where({ email }).first();
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
