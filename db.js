// db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,       // اسم المستخدم على Supabase
  host: process.env.DB_HOST,       // مثل db.xyz.supabase.co
  database: process.env.DB_NAME,   // اسم قاعدة البيانات
  password: process.env.DB_PASSWORD,
  port: 5432,
  ssl: { rejectUnauthorized: false } // مهم للاتصال عبر Supabase
});

module.exports = pool;
