---
name: current-session-summary
description: Текущее состояние проекта — статус разработки Шагов 1–8, детали реализации, что осталось заглушкой, следующий шаг
metadata:
  type: project
---

Дата фиксации: 2026-05-15.

**Why:** Сохранить состояние после выполнения Шагов 1–8 Приложения Б.

**How to apply:** Читать перед любой задачей по проекту. Отражает актуальный статус разработки и что нужно делать дальше.

---

## 1. Актуальное ТЗ

**`docs/TZ_v4.md`** — единственный источник правды.

| Файл | Роль |
|---|---|
| `docs/TZ_v4.md` | **Активное ТЗ** |
| `docs/NeuroTech_Quit_Final_TZ_Claude_Code_v4_FULL.docx` | Оригинал Word-файла v4 |
| `docs/archive/` | Старые версии v1/v2/v3 — не использовать |

---

## 2. Статус разработки

### Шаг 1 Приложения Б — ВЫПОЛНЕН

- Каркас Node.js проекта; фреймворк `telegraf` (не `node-telegram-bot-api`)
- Добавлен `node-cron` для будущих напоминаний
- `.env.example` расширен до всех 11 переменных (раздел 20 ТЗ)
- Структура папок: `src/bot/`, `src/db/`, `src/services/`, `src/utils/`

### Шаг 2 Приложения Б — ВЫПОЛНЕН

- `src/constants/userStatus.js` — `Object.freeze` с 23 константами (раздел 18.1 ТЗ)
- `src/bot/router.js` — `route(ctx, user)`: switch по 23 статусам
- `src/bot/handlers/start.js` — `/start`: проверяет `gift_*` deep link, вызывает `route()`
- `src/bot/bot.js` — `new Telegraf` + `registerStart` + `registerCallbacks`
- `src/db/users.js` — базовые функции работы с пользователями

### Шаг 3 Приложения Б — ВЫПОЛНЕН

- Зависимости: `knex ^3.1.0`, `pg ^8.11.0`; npm-скрипты: `migrate`, `migrate:rollback`, `seed`
- `knexfile.js` — конфиг knex (DATABASE_URL из .env)
- `src/db/connection.js` — lazy knex-пул
- 21 миграция в `migrations/` — все 20 таблиц ТЗ + ENUM-типы
- `seeds/01_procedures.js` — три процедуры: Анти-табак, Быстрый рычаг, Альфа
- `src/db/schema.js` — справочная документация схемы БД

**Важно: миграции не запускались. PostgreSQL пока не подключался.**

### Шаг 4 Приложения Б — ВЫПОЛНЕН

- Клавиатура: inline keyboard (`Markup.inlineKeyboard`)
- Переходы: `ctx.editMessageText` с fallback на `ctx.reply` при ошибке
- БД недоступна: fallback к `{ user_status: 'new' }`, бот не падает
- `/start` показывает реальный Welcome-экран; `upsertUser` с try/catch подключён
- `src/bot/screens/welcome.js` — текст 5.1 + inline keyboard 3 кнопки

### Шаг 5 Приложения Б — ВЫПОЛНЕН

Принятые решения:
- Диагностика: все вопросы через кнопки; текстового ввода нет
- Имя: из `ctx.from.first_name`; отдельного ввода нет
- Возраст: кнопки до 20 / 20–30 / 31–45 / 46–60 / 60+
- Видео (5.2): заглушка — текст + кнопки
- Отзывы (5.3): заглушка — текст + кнопки

Что создано:
- `src/bot/screens/introVideo.js` — экран 5.2 + заглушка ролика
- `src/bot/screens/reviews.js` — экран 5.3, текстовая заглушка
- `src/bot/screens/diagnostic.js` — 8 функций: `showDiagQ_age/what/duration/tried/times/maxtime/motivation/decision`
- `src/bot/handlers/callbacks.js` — структурирован по группам: Welcome, introVideo, reviews, diag навигация, diag ответы

### Шаг 6 Приложения Б — ВЫПОЛНЕН

Принятые решения:
- **lowReadiness:** экран предупреждения о низкой готовности — не блокирует, только предупреждает
- **saveDraftAnswer / getDraftAnswer** — async, in-memory Map; при рестарте сбрасываются
- **Маршрутизация decision_yes:** мотивация 1–3 → lowReadiness; 4+ → consent; NaN/не найдено → warn + notSure
- **showLowReadiness(ctx, { markFlag })** — `markFlag: true` при первом показе, `false` при возврате
- **consent:accept** вызывает `showTariff(ctx)` и обновляет `user_status = consent_accepted`

Что создано:
- `src/bot/screens/lowReadiness.js` — экран 5.6 с утверждённым текстом + `{ markFlag }` опция
- `src/bot/screens/notSure.js` — экран 5.7, 3 кнопки
- `src/bot/screens/consent.js` — Приложение А (10 пунктов), `showConsent(ctx, source)`

### Шаг 7 Приложения Б — ВЫПОЛНЕН + АУДИТ ПРОЙДЕН + ПРАВКИ ВНЕСЕНЫ

Принятые решения:
- **4 варианта тарифа:** `single` (990 ₽, новый), `full` (4900 ₽, новый), `single_next` (990 ₽, следующая процедура), `upgrade` (3910 ₽, апгрейд до full)
- **`processTestPayment` бросает исключение** — не использует try/catch внутри; вызывающий код отвечает за показ ошибки
- **`updateUserAfterPayment`** — использует try/catch внутри (паттерн как у других db-функций)
- **Кнопка «Назад» из paymentStub:** `payment:back_new` (single/full) и `payment:back_upgrade` (single_next/upgrade)
- **Кнопка «Повторить» в paymentError:** повторно вызывает тот же `payment:test_{variant}` callback

Правки после аудита:
- `single_next` добавляет `available_alpha_sessions_count + 1` (каждый тариф 990 ₽ включает Альфа)
- `showTariff` защищена от `full_access` пользователя: показывает текст без кнопок оплаты + кнопка «Мой доступ»
- Добавлена заглушка `my_access:show` (заменена реальным обработчиком в Шаге 8)

Что создано:
- `src/bot/screens/tariff.js` — `showTariff(ctx, user)`: три варианта (новый / апгрейд / full_access-защита)
- `src/bot/screens/paymentStub.js` — `showPaymentStub(ctx, variant)`
- `src/bot/screens/paymentSuccess.js` — `showPaymentSuccess(ctx)`
- `src/bot/screens/paymentError.js` — `showPaymentError(ctx, variant)`
- `src/db/payments.js` — `processTestPayment(telegramId, variant)`

### Шаг 8 Приложения Б — ВЫПОЛНЕН

#### Файлы созданы:

| Файл | Назначение |
|---|---|
| `src/db/access.js` | `getAccessRights(userId)`, `getProtocolProgress(userId)` — lazy, с try/catch, null при ошибке |
| `src/bot/screens/myAccess.js` | `showMyAccess(ctx, user)` — динамический экран раздел 10.1 |
| `src/bot/screens/mainMenu.js` | `showMainMenu(ctx)` — Главное меню раздел 10.3 |

#### Файлы изменены:

| Файл | Что изменено |
|---|---|
| `src/bot/router.js` | Добавлен импорт `showMyAccess`; 6 заглушек заменены на `showMyAccess(ctx, user)` |
| `src/bot/handlers/callbacks.js` | Добавлены импорты `getUserByTelegramId`, `showMyAccess`, `showMainMenu`; заглушка `my_access:show` заменена на реальный обработчик; добавлены 11 новых callbacks |

#### Callbacks добавлены:

Группа «Мой доступ»:
- `my_access:show` — обновлён: загружает user из БД → `showMyAccess`
- `my_access:continue_protocol` → заглушка `[Шаг 9]`
- `my_access:alpha` → заглушка `[Шаг 9]`
- `my_access:support` → заглушка `[Шаг 9]`
- `my_access:pay_next` → `showPaymentStub(ctx, 'single_next')`
- `my_access:upgrade` → `showPaymentStub(ctx, 'upgrade')`
- `my_access:menu` → `showMainMenu(ctx)`

Группа «Главное меню»:
- `main_menu:my_access` → загружает user → `showMyAccess`
- `main_menu:reviews` → `showReviews(ctx)`
- `main_menu:support` → заглушка `[Шаг 9]`
- `main_menu:about` → заглушка `[Шаг 9]`

#### Как работает full_access:

`showMyAccess` загружает `access_rights` и `protocol_progress` через `Promise.all`. Если `user.access_type === 'full_access'` — строит текст из `buildFullAccessText`: статус, пройдено процедур, следующая рекомендованная процедура (из `protocol_progress.next_procedure_type` или `anti_tobacco` по умолчанию). Кнопки: «Продолжить протокол», «Альфа-процедура» (всегда, NULL = безлимит), «Поддержка», «Главное меню».

#### Как работает single_procedure:

Строит текст из `buildSingleProcedureText`: оплачено/пройдено основных, доступно/пройдено Альфа. Кнопки: если `paid_main > used_main` → «Продолжить протокол»; иначе → «Оплатить следующую процедуру — 990 ₽». Всегда: «Доплатить до полного доступа — 3 910 ₽». Если `available_alpha > used_alpha` → «Альфа-процедура». Всегда: «Поддержка», «Главное меню».

#### Как работает protocol_paused:

Базовый текст (full_access или single_procedure) + баннер: «Протокол приостановлен. Вы можете продолжить, когда будете готовы.». Клавиатура заменяется на: «Продолжить протокол», «Поддержка», «Главное меню».

#### Как работает procedure_completed:

Базовый текст + баннер: «Последняя процедура завершена. Чтобы продолжить, нажмите «Продолжить протокол».». Клавиатура заменяется на: «Продолжить протокол», «Поддержка», «Главное меню».

#### Что происходит, если access_rights не загружается:

`getAccessRights` перехватывает ошибку БД, возвращает `null`. `showMyAccess` проверяет `if (!ar)` и показывает экран ошибки: «Не удалось загрузить данные доступа. Попробуйте позже или обратитесь в поддержку.» с кнопками «Поддержка» и «Главное меню». Тарифные кнопки не показываются.

Аналогично: если `user?.id` отсутствует (fallback-объект при недоступной БД) — тот же экран ошибки.

---

## 3. Порядок миграций

```
001 — create_enums          (16 ENUM-типов)
002 — create_procedures     (без FK, создаётся до users)
003 — create_users          (FK → procedures)
004 — create_audio_files    (FK → procedures)
005 — create_diagnostics    (FK → users)
006 — create_draft_answers  (FK → users)
007 — create_user_consents  (FK → users)
008 — create_payments       (FK → users)
009 — create_access_rights  (FK → users, payments)
010 — create_procedure_sessions (FK → users, procedures)
011 — create_protocol_progress  (FK → users, UNIQUE user_id)
012 — create_player_tokens  (FK → users, procedure_sessions)
013 — create_post_procedure_answers (FK → users, procedure_sessions)
014 — create_next_day_followups (FK → users, procedure_sessions)
015 — create_seven_day_followups (FK → users)
016 — create_reminders      (FK → users, procedures, procedure_sessions)
017 — create_reviews        (без FK, витринные отзывы)
018 — create_user_reviews   (FK → users)
019 — create_support_requests (FK → users)
020 — create_gift_access_tokens (FK → users nullable)
021 — create_events         (FK → users nullable)
```

---

## 4. Как запустить миграции (когда PostgreSQL будет готов)

```bash
docker run --name nq-db -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=neurotech_quit -p 5432:5432 -d postgres:16
# DATABASE_URL=postgresql://postgres:dev@localhost:5432/neurotech_quit в .env
npm install && npm run migrate && npm run seed
```

---

## 5. Что осталось заглушкой после Шага 8

- `my_access:continue_protocol` → `[Шаг 9]` (умная маршрутизация раздел 10.2)
- `my_access:alpha` → `[Шаг 9]` (Альфа-процедура)
- `my_access:support` → `[Шаг 9]` (Поддержка)
- `main_menu:support` → `[Шаг 9]` (Поддержка)
- `main_menu:about` → `[Шаг 9]` (О проекте)
- `payment_success:rules` → `[Шаг 8]` (ролик с правилами — не переименован, остался с Шага 7)
- `PROCEDURE_IN_PROGRESS` / `PROCEDURE_INTERRUPTED` в роутере → заглушка (плеер — Шаг 9+)
- `NOT_SMOKING`, `PROTOCOL_COMPLETED`, `STOPPED_BY_USER` в роутере → заглушки (Шаг 9+)
- Плеер (раздел 8) — не реализован
- Follow-up (раздел 12) — не реализован
- Напоминания (раздел 12.2) — не реализованы
- Подарочный доступ (раздел 16) — не реализован
- Реальный платёжный провайдер (раздел 6.3) — не подключён
- Реальный видеофайл `introVideo:watch` — заглушка
- Реальные витринные отзывы из таблицы `reviews` — заглушка
- In-memory Map (`draft_answers`) → реальная таблица `draft_answers` — ждём БД
- Запись в `user_consents` при принятии согласия — ждём БД

---

## 6. Следующий шаг

**Сначала:** провести аудит Шага 8.

**Если аудит пройден — Шаг 9 Приложения Б:**
- Умная маршрутизация `my_access:continue_protocol` (раздел 10.2)
- Ролик с правилами (раздел 7.1) — замена заглушки `payment_success:rules`
- Поддержка (раздел 14) — замена заглушек `my_access:support` / `main_menu:support`
- О проекте — замена заглушки `main_menu:about`

Пока не трогать: плеер, follow-up, напоминания, подарочный доступ, реальную оплату.

---

## 7. Текущий код проекта

**Не менять без отдельной команды.**

```
src/index.js                      — Telegraf.launch() + SIGINT/SIGTERM
src/config.js                     — все 11 ENV-переменных
src/bot/bot.js                    — new Telegraf + registerStart(bot) + registerCallbacks(bot)
src/bot/router.js                 — route(ctx, user): 23 ветки; Шаги 1–8 реальные; PROCEDURE_IN_PROGRESS/INTERRUPTED, NOT_SMOKING и др. — заглушки
src/bot/handlers/start.js         — /start: gift deep link stub → upsertUser (try/catch) → route
src/bot/handlers/callbacks.js     — ~55 групп bot.action(); Шаги 4–8 реализованы
src/bot/screens/welcome.js        — showWelcome(ctx): текст 5.1 + 3 кнопки
src/bot/screens/introVideo.js     — showIntroVideo / showIntroVideoWatch: экран 5.2 + заглушка ролика
src/bot/screens/reviews.js        — showReviews: экран 5.3, текстовая заглушка
src/bot/screens/diagnostic.js     — 8 функций диагностики: Q_age/what/duration/tried/times/maxtime/motivation/decision
src/bot/screens/lowReadiness.js   — showLowReadiness(ctx, { markFlag }): утверждённый текст предупреждения
src/bot/screens/notSure.js        — showNotSure(ctx): экран 5.7
src/bot/screens/consent.js        — showConsent(ctx, source): Приложение А, 10 пунктов
src/bot/screens/tariff.js         — showTariff(ctx, user): три варианта (новый / апгрейд / full_access-защита)
src/bot/screens/paymentStub.js    — showPaymentStub(ctx, variant): оплата-заглушка, текст ТЗ 6.3
src/bot/screens/paymentSuccess.js — showPaymentSuccess(ctx): успешная оплата, текст ТЗ 6.4
src/bot/screens/paymentError.js   — showPaymentError(ctx, variant): ошибка БД при тестовой оплате
src/bot/screens/myAccess.js       — showMyAccess(ctx, user): динамический экран раздел 10.1
src/bot/screens/mainMenu.js       — showMainMenu(ctx): Главное меню раздел 10.3
src/constants/userStatus.js       — Object.freeze с 23 значениями user_status
src/db/connection.js              — lazy knex-пул
src/db/users.js                   — getUserByTelegramId, upsertUser, updateUserStatus, setLowReadinessFlag, updateUserAfterPayment
src/db/diagnostics.js             — in-memory Map; saveDraftAnswer async, getDraftAnswer async
src/db/payments.js                — processTestPayment(telegramId, variant): payments + access_rights
src/db/access.js                  — getAccessRights(userId), getProtocolProgress(userId)
src/db/schema.js                  — справочная документация схемы БД
knexfile.js                       — конфиг knex
migrations/                       — 21 файл миграций (не запускались)
seeds/01_procedures.js            — начальные данные: 3 процедуры
```
