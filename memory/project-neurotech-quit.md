---
name: project-neurotech-quit
description: Описание проекта NeurotechQuitBot — что это, цель, статус, что уже создано
metadata:
  type: project
---

Telegram-бот **NeuroTech Quit** для помощи в отказе от никотиновой зависимости через авторскую технологию NeuroTech (аудио-процедуры, работа с нейронными автоматизмами).

**Почему:** Не сила воли, а работа с автоматическими реакциями мозга. Продукт коммерческий — оплата 990 ₽ (одна процедура) или 4 900 ₽ (полный доступ).

**Стек:** Node.js, node-telegram-bot-api, dotenv. База данных, платёжный провайдер и хранилище для аудио — ещё не выбраны.

**Рабочая директория:** `/Users/eliezermarko/NeurotechQuitBot`

## Что уже создано (структура проекта):

```
NeurotechQuitBot/
├── src/
│   ├── index.js       # точка входа
│   └── config.js      # конфиг (BOT_TOKEN из .env)
├── docs/
│   ├── NeuroTech_Quit_Final_TZ_Claude_Code.docx   # оригинал ТЗ
│   └── TZ.md          # текстовая версия ТЗ (полная, с разметкой)
├── assets/
├── media/
├── scripts/
├── memory/            # файлы памяти проекта
├── package.json
├── README.md
├── .gitignore
├── .env.example
├── CLAUDE.md          # правила работы с проектом
└── MEMORY.md          # индекс памяти
```

## Ключевой flow бота:
```
/start → welcome → intro_video → questionnaire_step_1 → questionnaire_step_2
→ low_motivation ИЛИ user_consent → payment → rules_video
→ preparation_screen → procedure_1 → after_procedure → reminders
→ procedure_2 → procedure_3 → final_check → final_success
```

## Критические бизнес-правила:
- Пользователь с motivation_level <= 3 или «Меня уговорили» → low_motivation, не допускается к протоколу
- Аудиофайлы НИКОГДА не отправляются в Telegram — только через защищённый плеер с временными ссылками
- Интерфейс полностью на русском языке

## Процедуры (3 основных + Альфа):
1. Анти-табак — сразу после оплаты
2. Быстрый рычаг — через 1–2 дня
3. Анти-табак — через 2–3 дня после 2-й
4. Альфа-процедура — для снижения стресса, при full_access включена

**How to apply:** Любые решения по разработке сверять с этим flow и бизнес-правилами. Всё должно соответствовать ТЗ в docs/TZ.md.
