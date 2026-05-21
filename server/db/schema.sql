-- Users table
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100)        NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  password   VARCHAR(255)        NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Categories table (each user has their own)
CREATE TABLE IF NOT EXISTS categories (
  id      SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name    VARCHAR(100) NOT NULL,
  color   VARCHAR(20)  NOT NULL DEFAULT '#378ADD',
  icon    VARCHAR(50)  NOT NULL DEFAULT 'wallet',
  type    VARCHAR(10)  NOT NULL CHECK (type IN ('income', 'expense'))
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  type        VARCHAR(10)    NOT NULL CHECK (type IN ('income', 'expense')),
  amount      NUMERIC(10, 2) NOT NULL,
  note        VARCHAR(255),
  date        DATE           NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title          VARCHAR(150)   NOT NULL,
  target_amount  NUMERIC(10, 2) NOT NULL,
  current_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  deadline       DATE,
  icon           VARCHAR(50) DEFAULT 'target',
  color          VARCHAR(20) DEFAULT '#1D9E75',
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Bills table
CREATE TABLE IF NOT EXISTS bills (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(150)   NOT NULL,
  amount       NUMERIC(10, 2) NOT NULL,
  due_date     INTEGER        NOT NULL CHECK (due_date BETWEEN 1 AND 31),
  is_recurring BOOLEAN        NOT NULL DEFAULT true,
  remind_days  INTEGER        NOT NULL DEFAULT 3,
  email_remind BOOLEAN        NOT NULL DEFAULT true,
  created_at   TIMESTAMP DEFAULT NOW()
);