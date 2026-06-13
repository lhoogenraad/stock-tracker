import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('watchlists', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('name', 100).notNullable().defaultTo('My Watchlist');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index('user_id', 'idx_watchlists_user_id');
  });

  await knex.schema.createTable('watchlist_items', (table) => {
    table.increments('id').primary();
    table.integer('watchlist_id').notNullable()
      .references('id').inTable('watchlists').onDelete('CASCADE');
    table.string('symbol', 10).notNullable();
    table.timestamp('added_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(['watchlist_id', 'symbol']);
    table.index('watchlist_id', 'idx_watchlist_items_watchlist_id');
  });

  await knex.schema.createTable('price_history', (table) => {
    table.bigIncrements('id').primary();
    table.string('symbol', 10).notNullable();
    table.decimal('price', 12, 4).notNullable();
    table.timestamp('recorded_at', { useTz: true }).notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Critical index: every "latest price" and "history range" query filters by
  // symbol and orders by time. Without this, full table scan once this grows large.
  await knex.schema.raw(
    'CREATE INDEX idx_price_history_symbol_time ON price_history (symbol, recorded_at DESC)'
  );

  await knex.schema.createTable('alerts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('symbol', 10).notNullable();
    table.string('condition', 10).notNullable();
    table.decimal('target_price', 12, 4).notNullable();
    table.timestamp('triggered_at', { useTz: true });
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index('user_id', 'idx_alerts_user_id');
    table.index(['symbol', 'is_active'], 'idx_alerts_symbol_active');
  });

  await knex.schema.raw(
    `ALTER TABLE alerts ADD CONSTRAINT chk_alerts_condition CHECK (condition IN ('above', 'below'))`
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('alerts');
  await knex.schema.dropTableIfExists('price_history');
  await knex.schema.dropTableIfExists('watchlist_items');
  await knex.schema.dropTableIfExists('watchlists');
  await knex.schema.dropTableIfExists('users');
}
