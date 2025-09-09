// db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.SUPABASE_URL,       // اسم المستخدم على Supabase
  host: process.env.SUPABASE_ANON_KEY,       // مثل db.xyz.supabase.co
  
  
  ssl: { rejectUnauthorized: false } // مهم للاتصال عبر Supabase
});

module.exports = pool;

