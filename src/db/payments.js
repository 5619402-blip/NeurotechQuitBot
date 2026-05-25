const db = require('./connection');

const VARIANT_CONFIG = {
  single:      { tariff_type: 'single_procedure', amount: 990 },
  full:        { tariff_type: 'full_access',       amount: 4900 },
  single_next: { tariff_type: 'single_procedure',  amount: 990 },
  upgrade:     { tariff_type: 'full_access',       amount: 3910 },
};

// Выполняет тестовую оплату: создаёт payment + обновляет/создаёт access_rights.
// Бросает исключение при ошибке — вызывающий код показывает paymentError.
async function processTestPayment(telegramId, variant) {
  const cfg = VARIANT_CONFIG[variant];
  if (!cfg) throw new Error(`Unknown payment variant: ${variant}`);

  const user = await db('users').where({ telegram_id: telegramId }).first();
  if (!user) throw new Error('User not found in DB');

  const [payment] = await db('payments')
    .insert({
      user_id: user.id,
      tariff_type: cfg.tariff_type,
      amount: cfg.amount,
      currency: 'RUB',
      payment_provider: 'test',
      payment_status: 'paid',
      created_at: db.fn.now(),
      paid_at: db.fn.now(),
    })
    .returning('*');

  if (variant === 'single') {
    await db('access_rights').insert({
      user_id: user.id,
      payment_id: payment.id,
      access_type: 'single_procedure',
      access_status: 'active',
      paid_main_procedures_count: 1,
      used_main_procedures_count: 0,
      available_alpha_sessions_count: 1,
      used_alpha_sessions_count: 0,
      upgrade_available: true,
      upgrade_amount: 3910,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

  } else if (variant === 'full') {
    await db('access_rights').insert({
      user_id: user.id,
      payment_id: payment.id,
      access_type: 'full_access',
      access_status: 'active',
      paid_main_procedures_count: 0,
      used_main_procedures_count: 0,
      available_alpha_sessions_count: null,
      used_alpha_sessions_count: 0,
      upgrade_available: false,
      upgrade_amount: null,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

  } else if (variant === 'single_next') {
    await db('access_rights')
      .where({ user_id: user.id })
      .update({
        paid_main_procedures_count: db.raw('paid_main_procedures_count + 1'),
        available_alpha_sessions_count: db.raw('available_alpha_sessions_count + 1'),
        updated_at: db.fn.now(),
      });

  } else if (variant === 'upgrade') {
    await db('access_rights')
      .where({ user_id: user.id })
      .update({
        access_type: 'full_access',
        available_alpha_sessions_count: null,
        upgrade_available: false,
        upgrade_amount: null,
        updated_at: db.fn.now(),
      });
  }
}

module.exports = { processTestPayment };
