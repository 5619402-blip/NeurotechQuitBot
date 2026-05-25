# NeuroTech Quit — Development Log

## Формат записей
Каждая запись: дата · шаг · статус · что сделано · что осталось · риски.

---

## Шаги 1–10 — ВЫПОЛНЕНЫ ✅

Шаги 1–10 реализованы полностью и прошли аудит.

### Шаг 10 — аудит и точечная правка (2026-05-16)

После аудита Шага 10 в `player_stub:completed:*` добавлена защита:
- `getProcedureById(session.procedure_id)` → если null → показать безопасную ошибку → return.
- `completeSession`, `incrementUsedMain/Alpha`, `upsertProtocolProgress` не вызываются если procedure === null.

Порядок в `player_stub:completed:*` после правки:
```
1. session ownership check
2. if session_status !== 'started' → [Шаг 11] заглушка → return
3. getProcedureById(session.procedure_id)        ← ЗАЩИТА null здесь
4. if !procedure → error screen → return
5. completeSession(sessionId)
6. incrementUsed (alpha / main)
7. if main: upsertProtocolProgress
8. setActiveUnfinishedProcedure(false)
9. updateUserStatus('procedure_completed')
10. [Шаг 11] заглушка
```

---

## Шаг 11 — ВЫПОЛНЕН ✅ (2026-05-18)

### Что сделано

Реализованы экран после процедуры и обязательные вопросы Q1–Q6.

**Созданы новые файлы (10):**

| Файл | Назначение |
|---|---|
| `src/db/nextDayFollowups.js` | `createNextDayFollowup(userId, sessionId)` — SELECT-first по `procedure_session_id` |
| `src/db/sevenDayFollowups.js` | `createSevenDayFollowup(userId)` — SELECT-first по `user_id + sent_at IS NULL` |
| `src/db/supportRequests.js` | `createSupportRequest(userId, text, opts)` — SELECT-first по `user_id+screen+text+status='new'` |
| `src/bot/screens/postProcedure.js` | `showPostProcedure(ctx, { sessionId })` — только экран, без DB |
| `src/bot/screens/postQ.js` | `showPostQ1`…`showPostQ6`, `showPostQComplete` |
| `src/bot/screens/sessionPaused.js` | `showSessionPaused(ctx)` — текст TZ 13.1 |
| `src/bot/screens/notSmokingResult.js` | `showNotSmokingResult(ctx)` — текст TZ 13.2 |
| `src/bot/screens/supportRequest.js` | `showSupportRequest(ctx)` — MVP поддержки |

**Изменены существующие файлы (2):**

| Файл | Что изменено |
|---|---|
| `src/db/users.js` | Добавлена `setPaused(userId, reason)` — `where({ id: userId })` |
| `src/bot/handlers/callbacks.js` | Добавлены top-level imports (`Markup`, `config`), `awaitingSupportText Map`, заменены 2 заглушки `[Шаг 11]`, добавлены 10+ новых обработчиков, `bot.on('text')` с двумя guard'ами |

**Проверки пройдены:**
- `node --check` на всех 10 файлах — без ошибок
- `if (!procedure)` стоит ДО `completeSession` — подтверждено (строка 604 vs 624)
- `incrementUsedMain/Alpha`, `upsertProtocolProgress` — только в `player_stub:completed:*`
- `session_status !== 'started'` → только `showPostProcedure` + return
- `bot.on('text')` имеет оба guard'а (`awaitingSupportText.has()` И `!startsWith('/')`)
- Alpha: reminder не создаётся, protocol_progress не меняется

**Риски, которые остались:**
- `awaitingSupportText` — in-memory Map, не переживает перезапуск бота (MVP-ограничение)
- Cron-отправка reminders/followups — Шаг 12

### Следующий шаг — Шаг 12

Cron-задачи для отправки:
- 48h reminder (таблица `reminders`)
- next_day_followup (таблица `next_day_followups`)
- seven_day_followup (таблица `seven_day_followups`)

