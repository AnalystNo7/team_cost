# Team Cost Calculator

Калькулятор расчёта стоимости проектной команды с учётом налогового законодательства РФ.

## Возможности

- **Два метода реализации проекта:**
  - Waterfall (Каскадный)
  - Agile (Гибкий)

- **Расчёт себестоимости:**
  - Внутренние ресурсы (ЗП + страховые взносы 30.2%)
  - Внешние ресурсы (по ставкам или фиксированной стоимости)
  - Учёт премий (годовых/квартальных)

- **Справочники:**
  - Проектные роли (15 предустановленных)
  - Категории ставок K1-K6

- **Производственный календарь РФ:**
  - Данные на 2024-2027 годы
  - Автоматический расчёт FTE загрузки

- **Версионирование расчётов:**
  - Базовая версия и актуализации
  - Сравнение версий

- **Экспорт:**
  - Excel (детализация по этапам, ролям, месяцам)
  - PDF (сводный отчёт)

## Технологический стек

- **Backend:** Python 3.11, FastAPI, SQLAlchemy, SQLite
- **Frontend:** React 18, TypeScript, Ant Design
- **Инфраструктура:** Docker, Docker Compose

## Быстрый старт

### Вариант 1: Docker (рекомендуется)

```bash
# Клонировать репозиторий
git clone <repository-url>
cd team_cost

# Запустить через Docker Compose
docker-compose up --build

# Открыть в браузере
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Вариант 2: Локальный запуск

**Требования:**
- Python 3.11+
- Node.js 18+

**Linux/macOS:**
```bash
chmod +x scripts/run_local.sh
./scripts/run_local.sh
```

**Windows:**
```cmd
scripts\run_local.bat
```

### Вариант 3: Ручной запуск

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Структура проекта

```
team_cost/
├── backend/
│   ├── app/
│   │   ├── models/       # SQLAlchemy модели
│   │   ├── schemas/      # Pydantic схемы
│   │   ├── routers/      # API эндпоинты
│   │   ├── services/     # Бизнес-логика
│   │   └── utils/        # Утилиты
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/   # React компоненты
│   │   ├── pages/        # Страницы
│   │   ├── services/     # API клиент
│   │   └── types/        # TypeScript типы
│   ├── package.json
│   └── Dockerfile
├── scripts/
│   ├── run_local.sh      # Скрипт запуска (Linux/macOS)
│   ├── run_local.bat     # Скрипт запуска (Windows)
│   └── build_exe.py      # Сборка установщика
├── docker-compose.yml
└── README.md
```

## API Документация

После запуска доступна по адресу: http://localhost:8000/docs

### Основные эндпоинты:

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/roles | Список ролей |
| GET | /api/rate-categories | Категории ставок |
| GET | /api/calculations | Список расчётов |
| POST | /api/calculations | Создать расчёт |
| GET | /api/calculations/{id}/versions/{v}/calculate | Расчёт стоимости |
| GET | /api/export/{id}/versions/{v}/excel | Экспорт в Excel |
| GET | /api/export/{id}/versions/{v}/pdf | Экспорт в PDF |

## Формулы расчёта

### Себестоимость (внутренний ресурс)
```
Себестоимость = (ЗП_месяц + Премия_месяц) × 1.302 × FTE
Премия_месяц = (ЗП_год × %_премии) / 12
```

### Страховые взносы (30.2%)
- ПФР: 22% (до предельной базы 2 225 000 ₽)
- ФСС: 2.9% (до предельной базы)
- ФОМС: 5.1% (без ограничений)

### Выручка
```
Выручка = Часовая_ставка × Раб_часы_месяца × FTE
Раб_часы = Раб_дни_по_календарю × 8
```

### Маржинальность
```
Маржа = Выручка - Себестоимость
Маржинальность = (Маржа / Выручка) × 100%
```

## Сборка установщика (Windows)

```bash
cd scripts
python build_exe.py
```

Результат: `installer/TeamCostCalculator/`

## Лицензия

MIT License
