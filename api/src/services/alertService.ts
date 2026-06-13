import { db } from '../config/db';

export async function getAlertsForUser(userId: number) {
  return db('alerts').where({ user_id: userId }).orderBy('created_at', 'desc');
}

export async function createAlert(
  userId: number,
  symbol: string,
  condition: 'above' | 'below',
  targetPrice: number
) {
  const [alert] = await db('alerts')
    .insert({
      user_id: userId,
      symbol: symbol.toUpperCase(),
      condition,
      target_price: targetPrice,
    })
    .returning('*');
  return alert;
}

export async function getAlertById(id: number, userId: number) {
  return db('alerts').where({ id, user_id: userId }).first();
}

export async function updateAlertActive(id: number, userId: number, isActive: boolean) {
  const [alert] = await db('alerts')
    .where({ id, user_id: userId })
    .update({ is_active: isActive })
    .returning('*');
  return alert;
}

export async function deleteAlert(id: number, userId: number) {
  return db('alerts').where({ id, user_id: userId }).del();
}
