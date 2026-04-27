# Аэропорт — Информационная система управления рейсами

Курсовая работа: проектирование и разработка ИС для управления рейсами аэропорта с AI-модулем оценки риска задержки.

---

## 1. Что делает система

Это веб-приложение для **диспетчеров и администраторов аэропорта**. Через него можно:

- Регистрировать рейсы и назначать им гейты
- Менять статус рейса (запланирован → посадка → вылет → прибытие)
- Управлять справочником гейтов (терминалы)
- Оценивать риск задержки рейса с помощью ML-модели
- Просматривать журнал действий пользователей (только админ)
- Управлять учётными записями (только админ)

---

## 2. Архитектура

Система состоит из **четырёх независимых компонентов**, общающихся через HTTP:

```
┌──────────────────┐    HTTP      ┌──────────────────┐    Prisma     ┌──────────────────┐
│                  │ ───────────> │                  │ ────────────> │                  │
│   FRONTEND       │   /api/*     │   BACKEND        │  SQL-запросы  │   POSTGRESQL     │
│   React + Vite   │ <─────────── │   Express + TS   │ <──────────── │   (Docker)       │
│   :5173          │   JSON       │   :3000          │               │   :5433          │
└──────────────────┘              └────────┬─────────┘               └──────────────────┘
                                           │
                                           │  HTTP /predict
                                           │  {hour, is_weekend, ...}
                                           ▼
                                  ┌──────────────────┐
                                  │   ML-СЕРВИС      │
                                  │   FastAPI        │
                                  │   RandomForest   │
                                  │   :8000          │
                                  └──────────────────┘
```

**Почему так:**
- Фронт и бэк разделены — фронт можно поменять не трогая API, и наоборот
- ML-сервис вынесен отдельно — Python удобен для ML, а JS/TS для веб-API. Каждый язык там, где он силён
- БД в Docker — не нужно ставить Postgres на машину, поднимается одной командой

---

## 3. Стек технологий

| Слой | Технология | Зачем |
|------|------------|-------|
| Фронт | **React + TypeScript + Vite** | Стандарт для SPA, Vite даёт мгновенный hot reload |
| Стили | **SCSS (модули)** | Переменные, вложенность, разбивка по компонентам |
| Маршрутизация | **react-router-dom** | URL → компонент страницы |
| Глобальное состояние | **React Context** | Auth и Toast — простая альтернатива Redux |
| HTTP-клиент | Самописная обёртка над **fetch** | Минимум зависимостей, автоматически добавляет JWT |
| Бэк | **Node.js + Express + TypeScript** | Лёгкий, асинхронный, типизация защищает от багов |
| ORM | **Prisma 7 + adapter-pg** | Типобезопасные запросы, миграции, генерация клиента |
| БД | **PostgreSQL 16** (в Docker) | Надёжная реляционка, есть всё что нужно |
| Авторизация | **JWT** (jsonwebtoken) | Stateless — сервер не хранит сессии |
| Хеширование | **bcryptjs** | Пароли никогда не хранятся в открытом виде |
| API-документация | **Swagger UI + swagger-jsdoc** | Документация генерируется из комментариев в коде |
| ML-сервис | **FastAPI + Pydantic** | Автоматическая валидация и документация |
| ML-модель | **scikit-learn RandomForestClassifier** | Простая, интерпретируемая, хорошо работает на табличных данных |
| Контейнеризация | **Docker Compose** | Поднять БД одной командой |

---

## 4. Структура проекта

```
airport/
└── backend/
    ├── docker-compose.yml         ← Запуск PostgreSQL
    ├── .env                       ← Переменные окружения
    │
    ├── ai_model/                  ← Python ML-сервис (FastAPI)
    │   ├── server.py              ← FastAPI приложение, эндпоинт /predict
    │   ├── train.py               ← Обучение модели на синтетических данных
    │   └── model.joblib           ← Сериализованная обученная модель
    │
    ├── node_api/                  ← Node.js бэкенд
    │   ├── src/
    │   │   ├── index.ts           ← Точка входа Express
    │   │   ├── lib/
    │   │   │   └── prisma.ts      ← Singleton Prisma-клиента с pg-адаптером
    │   │   ├── middleware/
    │   │   │   ├── auth.ts        ← Проверка JWT-токена
    │   │   │   └── requireRole.ts ← Проверка роли пользователя
    │   │   ├── routes/            ← REST-эндпоинты
    │   │   │   ├── auth.ts        ← Регистрация, вход
    │   │   │   ├── flights.ts     ← CRUD рейсов
    │   │   │   ├── gates.ts       ← CRUD гейтов
    │   │   │   ├── users.ts       ← Управление пользователями
    │   │   │   ├── ai.ts          ← Прокси к ML-сервису
    │   │   │   └── audit.ts       ← Журнал действий
    │   │   ├── utils/
    │   │   │   ├── audit.ts       ← Запись действия в журнал
    │   │   │   └── aiRisk.ts      ← Сбор признаков и вызов ML
    │   │   └── types/
    │   │       └── index.ts       ← Общие типы (UserRole, JwtPayload)
    │   ├── prisma/
    │   │   ├── schema.prisma      ← Схема БД
    │   │   └── seed.ts            ← Создание тестовых данных
    │   ├── generated/prisma/      ← Сгенерированный Prisma-клиент
    │   ├── prisma.config.ts       ← Конфиг Prisma 7 (с pg-адаптером)
    │   └── package.json
    │
    └── frontend/
        ├── src/
        │   ├── main.tsx           ← Точка входа React
        │   ├── App.tsx            ← Маршрутизация
        │   ├── api/               ← HTTP-клиент по ресурсам
        │   │   ├── client.ts      ← Базовая обёртка над fetch
        │   │   ├── auth.ts        ← /api/auth/*
        │   │   ├── flights.ts     ← /api/flights/*
        │   │   ├── gates.ts       ← /api/gates/*
        │   │   ├── users.ts       ← /api/users/*
        │   │   ├── ai.ts          ← /api/ai/*
        │   │   ├── audit.ts       ← /api/audit/*
        │   │   └── types.ts       ← TypeScript-типы (User, Flight, Gate...)
        │   ├── pages/             ← Компонент на каждый роут
        │   │   ├── LoginPage.tsx
        │   │   ├── RegisterPage.tsx
        │   │   ├── FlightsPage.tsx          ← Список рейсов с фильтрами
        │   │   ├── FlightFormPage.tsx       ← Создание/редактирование
        │   │   ├── FlightDetailPage.tsx     ← Карточка рейса
        │   │   ├── AIRiskPage.tsx           ← Виджет AI-оценки
        │   │   ├── GatesPage.tsx
        │   │   ├── UsersPage.tsx            ← Только ADMIN
        │   │   └── AuditPage.tsx            ← Только ADMIN
        │   ├── components/        ← Переиспользуемые UI-компоненты
        │   │   ├── Layout/
        │   │   │   ├── Frame.tsx       ← Каркас экрана (TopBar+Sidebar+Main)
        │   │   │   ├── TopBar.tsx
        │   │   │   └── Sidebar.tsx
        │   │   ├── Modal.tsx
        │   │   └── Status.tsx           ← Цветной индикатор статуса
        │   ├── context/           ← Глобальное состояние (React Context)
        │   │   ├── AuthContext.tsx      ← Хранит токен и user
        │   │   └── ToastContext.tsx     ← Всплывающие уведомления
        │   └── styles/            ← Стили, разбитые по разделам
        │       ├── _variables.scss      ← CSS-переменные
        │       ├── _layout.scss         ← Каркас (sidebar, topbar)
        │       ├── _forms.scss          ← Поля ввода, кнопки
        │       ├── _tables.scss         ← Таблицы и статус-индикатор
        │       ├── _panels.scss         ← Карточки-панели
        │       ├── _feedback.scss       ← Алерты, тосты, лоадер
        │       ├── _ai.scss             ← Виджет AI-оценки
        │       ├── _modal.scss          ← Модалки и экраны входа
        │       └── main.scss            ← Собирает все @use
        ├── vite.config.ts        ← Прокси /api → :3000
        └── package.json
```

---

## 5. База данных

### Схема (4 таблицы)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   User      │         │   Flight    │         │   Gate      │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ id (PK)     │         │ id (PK)     │   ┌────>│ id (PK)     │
│ username    │  ┌─────>│ flightNumber│   │     │ name        │
│ email       │  │      │ origin      │   │     │ terminal    │
│ passwordHash│  │      │ destination │   │     └─────────────┘
│ role        │  │      │ departureT. │   │
│ createdAt   │  │      │ arrivalTime │   │
└──────┬──────┘  │      │ gateId (FK) ├───┘
       │         │      │ status      │
       │         │      │ createdById │
       │         └──────┤ (FK→User)   │
       │                │ createdAt   │
       │                │ updatedAt   │
       │                └─────────────┘
       │
       │      ┌──────────────┐
       └─────>│  AuditLog    │
              ├──────────────┤
              │ id (PK)      │
              │ userId (FK)  │
              │ action       │ ← "CREATE", "DELETE", "STATUS_CHANGE"
              │ entityType   │ ← "Flight", "Gate", "User"
              │ entityId     │
              │ details      │
              │ createdAt    │
              └──────────────┘
```

### Перечисления

- **Role:** `ADMIN`, `DISPATCHER`
- **FlightStatus:** `SCHEDULED` → `BOARDING` → `DEPARTED` → `ARRIVED` (плюс `DELAYED`, `CANCELLED`)

### Связи

- **User → Flight** (один-ко-многим): пользователь создаёт много рейсов
- **Gate → Flight** (один-ко-многим, опционально): на одном гейте может быть много рейсов
- **User → AuditLog** (один-ко-многим): пользователь оставляет много записей в журнале

---

## 6. Авторизация и роли

### Как работает JWT

1. Пользователь вводит email/пароль на `/login`
2. Бэкенд проверяет пароль через `bcrypt.compare`
3. Создаёт JWT-токен с payload `{id, username, email, role}`, подписанный `JWT_SECRET`
4. Возвращает токен фронту
5. Фронт сохраняет токен в `localStorage`
6. На каждый последующий запрос фронт добавляет заголовок `Authorization: Bearer <token>`
7. Middleware `authenticate` на бэкенде проверяет подпись и кладёт user в `req.user`
8. Middleware `requireRole('ADMIN')` дополнительно проверяет роль для админских эндпоинтов

### Роли

| Роль | Что может |
|------|-----------|
| **DISPATCHER** | Просматривать всё, создавать/редактировать рейсы, менять статус, вызывать AI |
| **ADMIN** | Всё то же + удалять рейсы, управлять гейтами и пользователями, видеть журнал |

### Защита роутов на фронте

В `App.tsx` есть два HOC:
- `<RequireAuth>` — пускает только залогиненных
- `<RequireAdmin>` — пускает только ADMIN, остальных редиректит

```tsx
<Route path="/users" element={<RequireAdmin><UsersPage /></RequireAdmin>} />
```

---

## 7. REST API

Базовый URL: `http://localhost:3000/api`

### Auth
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| POST | `/auth/register` | публичный | Регистрация (по умолчанию роль DISPATCHER) |
| POST | `/auth/login` | публичный | Возвращает JWT |
| GET | `/auth/me` | любой авторизованный | Данные текущего пользователя |

### Flights
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/flights` | любой | Список с фильтрами (status, origin, destination, gate_id) |
| GET | `/flights/:id` | любой | Один рейс с гейтом и автором |
| POST | `/flights` | любой | Создать (с проверкой конфликта гейта) |
| PUT | `/flights/:id` | любой | Обновить |
| PATCH | `/flights/:id/status` | любой | Сменить статус |
| DELETE | `/flights/:id` | ADMIN | Удалить |

### Gates
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/gates` | любой | Список с количеством рейсов на каждом |
| POST | `/gates` | ADMIN | Создать |
| PUT | `/gates/:id` | ADMIN | Обновить |
| DELETE | `/gates/:id` | ADMIN | Удалить (упадёт если есть привязанные рейсы) |

### Users
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/users` | ADMIN | Список всех |
| PATCH | `/users/:id/role` | ADMIN | Сменить роль (нельзя себе) |
| DELETE | `/users/:id` | ADMIN | Удалить |

### AI
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| POST | `/ai/delay-risk` | любой | Тело: `{flight_id}`. Возвращает уровень риска и причины |

### Audit
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/audit` | ADMIN | Журнал с фильтрами (entity_type, user_id, limit) |

**Полная интерактивная документация:** `http://localhost:3000/docs` (Swagger UI)

---

## 8. AI-модуль (оценка риска задержки)

### Архитектура

ML вынесен в отдельный сервис на Python. Node-бэкенд выступает посредником: собирает данные из БД, формирует признаки и шлёт в Python.

### Признаки модели (4 шт.)

| Признак | Тип | Что означает | Откуда берётся |
|---------|-----|--------------|----------------|
| `hour` | int 0–23 | Час вылета | `departureTime.getUTCHours()` |
| `is_weekend` | 0 или 1 | Суббота/воскресенье | `[0,6].includes(departureTime.getUTCDay())` |
| `gate_load` | int | Кол-во рейсов на том же гейте за 2 часа до вылета | `prisma.flight.count(...)` |
| `historical_delays` | int | Задержки на этом маршруте за 30 дней | `prisma.flight.count({status: {in: ['DELAYED','CANCELLED']}})` |

### Модель

**RandomForestClassifier** (sklearn). Обучена в `train.py` на 2000 синтетических примеров с 3-классовой меткой:
- `0 = LOW` (риск ≤ 33)
- `1 = MEDIUM` (33 < риск ≤ 66)
- `2 = HIGH` (риск > 66)

Признаки в обучении были связаны с риском по правилам (загруженный гейт +40, час пик +20, выходной +15, история +20), плюс шум. Модель учится этим закономерностям и обобщает.

### Что возвращает ML-сервис

```json
{
  "level": "MEDIUM",
  "interpretation": "Средний риск задержки",
  "confidence": 78,
  "probabilities": { "LOW": 12, "MEDIUM": 78, "HIGH": 10 },
  "expected_delay_minutes": 50,
  "reason": "Час пик и загруженный гейт"
}
```

Node добавляет к ответу `flight` и `features` и отдаёт фронту.

### Поток end-to-end

1. Пользователь на странице рейса жмёт «Оценить риск AI»
2. React-роут `/flights/:id/risk` → `AIRiskPage` монтируется
3. `useEffect` вызывает `aiApi.getRisk(flightId)`
4. `axios → POST /api/ai/delay-risk { flight_id: 5 }` с JWT в заголовке
5. Express → middleware `authenticate` (валидирует JWT)
6. Роут `routes/ai.ts` → `calculateDelayRisk(5)`
7. `aiRisk.ts` достаёт рейс из Postgres → считает признаки → `fetch :8000/predict`
8. FastAPI валидирует через Pydantic → `model.predict_proba` → JSON-ответ
9. Node возвращает фронту
10. React рендерит `risk-box` (уровень), `bar` (вероятности), таблицу признаков

---

## 9. Frontend в деталях

### Маршрутизация (`App.tsx`)

```
/login                  ← публичный
/register               ← публичный
/flights                ← список рейсов (защищённый)
/flights/new            ← форма создания
/flights/:id            ← детальная карточка
/flights/:id/edit       ← редактирование
/flights/:id/risk       ← AI-оценка
/gates                  ← гейты
/users                  ← только ADMIN
/audit                  ← только ADMIN
```

### Слои фронта

```
┌────────────────────────────────────┐
│  pages/        ← Страницы           │  ← компонуют всё вместе
├────────────────────────────────────┤
│  components/   ← UI-блоки           │  ← Frame, Modal, Status
├────────────────────────────────────┤
│  context/      ← Глобальное         │  ← Auth, Toast
├────────────────────────────────────┤
│  api/          ← HTTP-клиент        │  ← обёртка над fetch + типы
└────────────────────────────────────┘
```

### Пример: AuthContext

`AuthContext.tsx` — обёртка над React Context. Хранит:
- `token` и `user` (из localStorage при загрузке)
- `login(token, user)` — записывает в localStorage и state
- `logout()` — очищает
- `isAdmin: boolean` — производное от `user.role`

Любой компонент через `useAuth()` получает доступ к этим данным:
```tsx
const { user, isAdmin, logout } = useAuth()
```

### Пример: HTTP-клиент

`api/client.ts` — одна функция `request<T>` под капотом:
- Берёт токен из localStorage
- Подставляет `Authorization: Bearer <token>`
- Бросает `Error` на не-2xx ответы (фронт ловит и показывает Toast)

Сверху обёртки: `api.get()`, `api.post()`, `api.put()`, и т.д.

Конкретные ресурсы (`api/flights.ts`, `api/gates.ts`...) — это просто типизированные обёртки:
```ts
export const flightsApi = {
  list: () => api.get<Flight[]>('/flights'),
  get: (id: number) => api.get<Flight>(`/flights/${id}`),
  // ...
}
```

### Стили

Разбиты на 8 партиалов в `styles/`:

| Файл | Что стилизует |
|------|----------------|
| `_variables.scss` | CSS-переменные (цвета), сбросы, body, #root |
| `_layout.scss` | Каркас: screen, topbar, sidebar, main, footer |
| `_forms.scss` | Поля ввода, метки, кнопки, btn-group |
| `_tables.scss` | Таблицы и статус-индикатор (.st) |
| `_panels.scss` | Карточки .panel и список .dl |
| `_feedback.scss` | Алерты .msg, тосты, пагинация, empty state, .loading |
| `_ai.scss` | Бары вероятностей и .risk-box |
| `_modal.scss` | Модалки и экраны входа/регистрации |
| `main.scss` | Собирает всё через `@use` |

Подключается один раз в `main.tsx`:
```tsx
import './styles/main.scss'
```

---

## 10. Docker

В `docker-compose.yml` пока один сервис — PostgreSQL:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: airport_db
    environment:
      POSTGRES_USER: airport_user
      POSTGRES_PASSWORD: airport_pass
      POSTGRES_DB: airport_db
    ports:
      - "5433:5432"
```

Бэкенд и ML-сервис запускаются локально (для разработки). На проде их тоже можно запихнуть в контейнеры — нужно будет добавить Dockerfile для каждого.

---

## 11. Как запустить

### Первый раз

```bash
# 1. Поднять БД
cd backend
docker compose up -d

# 2. Установить зависимости бэкенда
cd node_api
npm install

# 3. Применить схему к БД и заполнить тестовыми данными
npx prisma db push
npm run db:seed

# 4. Установить Python-зависимости для ML
cd ../ai_model
pip install fastapi uvicorn joblib numpy scikit-learn pydantic
python train.py    # один раз обучить модель

# 5. Установить зависимости фронта
cd ../frontend
npm install
```

### Запуск (3 терминала)

```bash
# Терминал 1 — БД (если не запущена)
cd backend && docker compose up -d

# Терминал 2 — Node API
cd backend/node_api && npm run dev
# → http://localhost:3000 (Swagger: /docs)

# Терминал 3 — ML-сервис
cd backend && uvicorn ai_model.server:app --port 8000 --reload
# → http://localhost:8000

# Терминал 4 — фронт
cd backend/frontend && npm run dev
# → http://localhost:5173
```

### Тестовые пользователи (после `db:seed`)

| Email | Пароль | Роль |
|-------|--------|------|
| admin@airport.com | admin123 | ADMIN |
| dispatcher@airport.com | disp123 | DISPATCHER |

---

## 12. Процессы (Use Cases)

Эти процессы можно демонстрировать через UI:

### Процесс 1: Создание рейса
1. Логин как `dispatcher`
2. Список рейсов → кнопка «Новый рейс»
3. Форма: номер, откуда, куда, время вылета/прилёта, гейт
4. Сохранить → бэкенд проверяет конфликт гейта (нельзя занять занятый)
5. Запись в `audit_log` (CREATE Flight)

### Процесс 2: Изменение статуса
1. Открыть карточку рейса
2. Нажать `BOARDING` → `DEPARTED` → `ARRIVED`
3. Каждое изменение → запись в журнал (STATUS_CHANGE)

### Процесс 3: AI-оценка риска
1. На карточке рейса → «Оценить риск AI»
2. Бэк собирает признаки → шлёт ML → возвращает уровень
3. UI показывает карточку с уровнем (LOW/MEDIUM/HIGH), вероятностями, причинами и таблицей признаков

### Процесс 4 (только ADMIN): Управление гейтами
1. Меню «Гейты» → видно сколько рейсов на каждом
2. Создать гейт → нужно имя и терминал
3. Удалить — упадёт если есть привязанные рейсы

### Процесс 5 (только ADMIN): Просмотр журнала
1. Меню «Журнал»
2. Фильтр по сущности (Flight/Gate/User) и пользователю
3. Видно кто, что, когда — полная аудит-история

---

## 13. Что важно сказать на защите

**Архитектурные решения:**
- Разделение фронт/бэк/ML — каждый сервис делает одно и хорошо
- Stateless-авторизация через JWT — масштабируемо
- Prisma как ORM — типобезопасные запросы, миграции через `db push`
- ML-сервис на FastAPI с Pydantic — автоматическая валидация и документация
- React Context вместо Redux — для проекта такого размера хватает

**Качество кода:**
- TypeScript на бэке и фронте — общие типы, защита от багов
- Стили разбиты по разделам — легко найти и поддерживать
- Swagger-документация прямо в комментариях к роутам — всегда актуальна
- Журнал действий — полная прослеживаемость кто что делал

**Безопасность:**
- Пароли хешируются bcrypt (никогда не хранятся в открытом виде)
- JWT подписан секретом (нельзя подделать)
- Проверка ролей на каждом защищённом эндпоинте
- Защита роутов на фронте через `RequireAuth` / `RequireAdmin`
