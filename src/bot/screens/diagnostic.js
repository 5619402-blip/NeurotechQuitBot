const { Markup } = require('telegraf');

async function send(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard);
  } catch {
    await ctx.reply(text, keyboard);
  }
}

// ─── Экран 0: Фильтр 18+ ─────────────────────────────────────────────────────

async function showDiagQ_adult(ctx) {
  const firstName = ctx.from.first_name || 'Здравствуйте';
  await send(
    ctx,
    `${firstName}, для диагностики нужно несколько ответов.\n\nВам уже есть 18 лет?`,
    Markup.inlineKeyboard([
      [
        Markup.button.callback('Да', 'diag:adult_yes'),
        Markup.button.callback('Нет', 'diag:adult_no'),
      ],
      [Markup.button.callback('Назад', 'welcome:show')],
    ])
  );
}

// ─── Экран 1: Стаж ───────────────────────────────────────────────────────────

async function showDiagQ_duration(ctx) {
  await send(
    ctx,
    'Какой у вас стаж курения / употребления никотина?',
    Markup.inlineKeyboard([
      [Markup.button.callback('До 1 года', 'diag:dur_lt1y')],
      [Markup.button.callback('1–3 года', 'diag:dur_1_3y')],
      [Markup.button.callback('3–5 лет', 'diag:dur_3_5y')],
      [Markup.button.callback('5–10 лет', 'diag:dur_5_10y')],
      [Markup.button.callback('Больше 10 лет', 'diag:dur_gt10y')],
      [Markup.button.callback('Назад', 'diag:nav_adult')],
    ])
  );
}

// ─── Экран 2: Попытки бросить ─────────────────────────────────────────────────

async function showDiagQ_attempts(ctx) {
  await send(
    ctx,
    'Были ли у вас попытки бросить курить или отказаться от никотина?',
    Markup.inlineKeyboard([
      [Markup.button.callback('Не было попыток', 'diag:att_none')],
      [Markup.button.callback('1 раз', 'diag:att_1')],
      [Markup.button.callback('2–3 раза', 'diag:att_2_3')],
      [Markup.button.callback('Больше 3 раз', 'diag:att_gt3')],
      [Markup.button.callback('Пробовал(а) много раз', 'diag:att_many')],
      [Markup.button.callback('Назад', 'diag:nav_dur')],
    ])
  );
}

// ─── Экран 3: Максимальный срок без никотина ──────────────────────────────────

async function showDiagQ_maxtime(ctx) {
  await send(
    ctx,
    'Сколько максимально вам удавалось продержаться без никотина?',
    Markup.inlineKeyboard([
      [Markup.button.callback('Не пробовал(а) бросать', 'diag:max_never')],
      [Markup.button.callback('До 1 дня', 'diag:max_lt1d')],
      [Markup.button.callback('Несколько дней', 'diag:max_days')],
      [Markup.button.callback('1–2 недели', 'diag:max_1_2wk')],
      [Markup.button.callback('Больше месяца', 'diag:max_gt1mo')],
      [Markup.button.callback('Больше 3 месяцев', 'diag:max_gt3mo')],
      [Markup.button.callback('Назад', 'diag:nav_att')],
    ])
  );
}

// ─── Экран 4: Осознание проблемы ─────────────────────────────────────────────

async function showDiagQ_awareness(ctx) {
  await send(
    ctx,
    'Чувствуете ли вы, что никотин мешает вам или влияет на здоровье?',
    Markup.inlineKeyboard([
      [Markup.button.callback('Да, заметно мешает', 'diag:aware_def_yes')],
      [Markup.button.callback('Скорее да', 'diag:aware_prob_yes')],
      [Markup.button.callback('Пока не уверен(а)', 'diag:aware_not_sure')],
      [Markup.button.callback('Скорее нет', 'diag:aware_prob_no')],
      [Markup.button.callback('Нет, не мешает', 'diag:aware_no')],
      [Markup.button.callback('Назад', 'diag:nav_maxtime')],
    ])
  );
}

// ─── Экран 5: Мотивация 1–10 ─────────────────────────────────────────────────

async function showDiagQ_motivation(ctx) {
  await send(
    ctx,
    'Насколько сильно вы хотите бросить курить?\n\nОцените от 1 до 10, где 1 — «не особо хочу», 10 — «очень хочу».',
    Markup.inlineKeyboard([
      [1, 2, 3, 4, 5].map(n => Markup.button.callback(String(n), `diag:motiv_${n}`)),
      [6, 7, 8, 9, 10].map(n => Markup.button.callback(String(n), `diag:motiv_${n}`)),
      [Markup.button.callback('Назад', 'diag:nav_aware')],
    ])
  );
}

// ─── Экран 6: Финальное решение ───────────────────────────────────────────────

async function showDiagQ_decision(ctx) {
  await send(
    ctx,
    'Это ваше личное решение бросить курить?',
    Markup.inlineKeyboard([
      [Markup.button.callback('Да, моё решение', 'diag:decision_yes')],
      [Markup.button.callback('Нет, меня уговорили', 'diag:decision_no')],
      [Markup.button.callback('Пока не уверен(а)', 'diag:decision_not_sure')],
      [Markup.button.callback('Назад', 'diag:nav_motiv')],
    ])
  );
}

module.exports = {
  showDiagQ_adult,
  showDiagQ_duration,
  showDiagQ_attempts,
  showDiagQ_maxtime,
  showDiagQ_awareness,
  showDiagQ_motivation,
  showDiagQ_decision,
};
