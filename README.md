# Expense Tracker Application

## Overview
The Expense Tracker Application helps users manage personal finances by tracking expenses, organizing them by category, and monitoring budgets over time.

## Features
- Add, edit, and delete expenses
- Categorize transactions and view totals by category
- Track budgets by month and year
- Secure authentication with JWT

## Technology Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** SQLite (local file)

## Getting Started

### Prerequisites
- Node.js (18+ recommended)
- npm

### Installation
Clone the repository and install dependencies for both the backend and frontend.

```bash
git clone <repository-url>
cd <repository-folder>
```

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Update `.env` as needed:
```
PORT=5000
JWT_SECRET=replace-with-a-secure-secret
SQLITE_DB_PATH=./data/expense-tracker.sqlite
```

Start the backend in development mode:
```bash
npm run dev
```

#### Frontend Setup
```bash
cd ../frontend
npm install
```

Start the frontend:
```bash
npm run dev
```

The frontend will connect to the backend API (default: `http://localhost:5000`).

## SQLite Storage
The backend stores data in a local SQLite file. By default, the database file is created at `backend/data/expense-tracker.sqlite`. You can override this location using the `SQLITE_DB_PATH` environment variable.

