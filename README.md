# ZAVOZ — сайт импорта автомобилей и техники из Азии

Производственный сайт компании **ZAVOZ** (Благовещенск): импорт автомобилей,
мотоциклов, спецтехники и запчастей из **Китая, Южной Кореи и Японии** в любой
город России. Премиальный минималистичный лендинг + каталог + защищённая форма
заявки с отправкой в Telegram и сохранением в Supabase.

Стек: **чистый HTML / CSS / vanilla JS** на фронтенде, лёгкий **Node.js + Express**
бэкенд (без фронтенд-фреймворков и лишних зависимостей).

---

## 1. Структура проекта

```
project-root/
├── public/                 # Статический фронтенд (отдаётся сервером)
│   ├── index.html          # Главный лендинг
│   ├── cars.html           # Каталог /cars
│   ├── css/
│   │   ├── styles.css      # Дизайн-система и секции лендинга
│   │   ├── form.css        # Модальное окно и форма заявки
│   │   └── cars.css        # Страница каталога и фильтры
│   ├── js/
│   │   ├── main.js         # Точка входа лендинга
│   │   ├── catalog.js      # Логика каталога и фильтров
│   │   ├── form.js         # Модалка, валидация, отправка заявки
│   │   ├── shared.js       # Общие хелперы (карточки, reveal, placeholder)
│   │   └── data/
│   │       └── vehicles.js # ⭐ Данные автомобилей (легко редактируются)
│   ├── images/             # Реальные фото (логотип, команда, авто) — заменить
│   └── icons/
├── server/
│   ├── index.js            # Express: статика + /api/request + безопасность
│   ├── validate.js         # Серверная валидация и очистка ввода
│   ├── rateLimit.js        # Антиспам / rate limiting (без зависимостей)
│   ├── telegram.js         # Уведомление менеджеров в Telegram
│   └── supabase.js         # Сохранение заявок в Supabase
├── supabase/
│   └── schema.sql          # SQL-схема таблицы requests + RLS
├── .env.example            # Шаблон переменных окружения
├── .gitignore
├── render.yaml             # Blueprint для деплоя на Render
├── package.json
├── README.md
└── SECURITY.md             # Чек-лист безопасности
```

---

## 2. Локальный запуск

Требуется **Node.js 18+** (используется встроенный `fetch`).

```bash
# 1. Установить зависимости
npm install

# 2. Создать .env из шаблона и заполнить значения
cp .env.example .env

# 3. Запустить сервер
npm start           # или: npm run dev  (авто-перезапуск)
```

Откройте <http://localhost:3000>. Каталог: <http://localhost:3000/cars>.

> Сайт запускается и без ключей Supabase/Telegram — но форма заявки вернёт ошибку
> «не удалось отправить», пока не настроен хотя бы один из каналов (это сделано
> намеренно, чтобы заявки не терялись молча). Проверить состояние:
> <http://localhost:3000/api/health>.

---

## 3. Подключение Supabase

1. Создайте проект на <https://supabase.com>.
2. Откройте **SQL Editor → New query**, вставьте содержимое
   [`supabase/schema.sql`](supabase/schema.sql) и выполните. Будет создана
   таблица `public.requests` с включённым **Row Level Security** (по умолчанию —
   полный запрет для публичных ролей; сервер работает через service role key).
3. В **Project Settings → API** скопируйте:
   - `Project URL` → переменная `SUPABASE_URL`
   - `service_role` **secret** ключ → переменная `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ `service_role` ключ обходит RLS и используется **только на сервере**. Никогда
> не помещайте его во фронтенд.

---

## 4. Создание и подключение Telegram-бота

1. Напишите [@BotFather](https://t.me/BotFather) → `/newbot` → получите **token**
   → переменная `TELEGRAM_BOT_TOKEN`.
2. Создайте приватную группу менеджеров и **добавьте туда бота**.
3. Узнайте `chat_id` группы (один из способов):
   - добавьте в группу [@getidsbot](https://t.me/getidsbot) или
     [@RawDataBot](https://t.me/RawDataBot) — он покажет `chat.id`
     (для супергрупп число обычно вида `-100…`);
   - либо отправьте сообщение в группу и откройте
     `https://api.telegram.org/bot<TOKEN>/getUpdates`.
4. Впишите значение в `TELEGRAM_CHAT_ID`.

Заявки будут приходить структурированным сообщением (см. `server/telegram.js`).

---

## 5. Переменные окружения

| Переменная                    | Обязательна | Назначение |
|-------------------------------|:-----------:|------------|
| `PORT`                        | нет         | Порт сервера (Render задаёт сам). |
| `NODE_ENV`                    | нет         | `production` на Render. |
| `TELEGRAM_BOT_TOKEN`          | да\*        | Токен бота от @BotFather. |
| `TELEGRAM_CHAT_ID`            | да\*        | ID чата менеджеров. |
| `SUPABASE_URL`                | да\*        | URL проекта Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY`   | да\*        | Service role ключ (секрет). |
| `RATE_LIMIT_MAX`              | нет         | Заявок с одного IP за окно (по умолчанию 5). |
| `RATE_LIMIT_WINDOW_MS`        | нет         | Окно rate limit, мс (по умолчанию 600000). |
| `ALLOWED_ORIGINS`             | нет         | Доп. origin'ы для CORS через запятую. |

\* Нужен хотя бы один рабочий канал (Supabase **или** Telegram), иначе форма
вернёт ошибку. Рекомендуется настроить оба.

Все секреты хранятся в `.env` (локально) или в панели Render (продакшн) и
**никогда не попадают в git** и во фронтенд.

---

## 6. Деплой на GitHub + Render

### GitHub
```bash
git add .
git commit -m "ZAVOZ website"
git push -u origin <branch>
```
Файл `.env` в репозиторий не попадёт (он в `.gitignore`).

### Render
Вариант A — **Blueprint** (рекомендуется), используя [`render.yaml`](render.yaml):
1. Render Dashboard → **New → Blueprint** → подключите репозиторий.
2. Render прочитает `render.yaml` и создаст web-сервис.
3. На вкладке **Environment** задайте секреты (`TELEGRAM_BOT_TOKEN`,
   `TELEGRAM_CHAT_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   при необходимости `ALLOWED_ORIGINS`).

Вариант B — вручную: **New → Web Service** →
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`
- добавьте те же переменные окружения.

Render раздаёт сайт по HTTPS автоматически. При необходимости обновите
`canonical`/`og:url` в HTML и `ALLOWED_ORIGINS` под ваш реальный домен.

---

## 7. Что заменить (плейсхолдеры)

Все места помечены комментариями в коде. Ключевые:

- **Логотип** — `index.html` / `cars.html`, блок `.logo`: замените содержимое
  `.logo__mark` на `<img src="/images/logo.svg" alt="ZAVOZ">` (разметка не
  изменится).
- **Favicon** — inline-SVG в `<link rel="icon">`, замените на реальный.
- **Фото команды** — секция `#team`, блоки `.member__photo`: замените
  `<span class="member__initials">` на `<img>`. Фамилия четвёртого представителя
  («Андрей») отмечена комментарием.
- **Данные автомобилей** — `public/js/data/vehicles.js` (массив `VEHICLES`).
  Добавьте поле `image` с путём к реальному фото — плейсхолдер заменится
  автоматически.
- **Фото/визуал авто и hero** — `.hero__visual`, `.prep__visual`, `.car__media`
  (сейчас — аккуратные CSS/SVG-плейсхолдеры).
- **Контакты** — секция `#contacts` и футер: замените `href="#"` на реальные
  ссылки Telegram / WhatsApp / Instagram и телефон.
- **Домен** — `canonical`, `og:url` в `<head>`.

---

## 8. Будущие улучшения

- Реальные фотографии авто, команды и фирменный логотип.
- Отдельные страницы карточек авто (`/cars/:id`) с галереей.
- Мини-CRM на статусах (`new → in_progress → assigned → completed → rejected`),
  которые уже заложены в схеме Supabase.
- Подтверждение заявки на e-mail/в мессенджер клиенту.
- reCAPTCHA / hCaptcha как дополнительный слой антиспама.
- Многоязычность (RU/EN/ZH).
- Аналитика и цели конверсии.
- Общий rate-limit store (Redis/Upstash) при масштабировании на несколько
  инстансов.

---

Подробности по безопасности — в [SECURITY.md](SECURITY.md).
