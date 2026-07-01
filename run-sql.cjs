const { Client } = require('pg');
const fs = require('fs');

async function runSql() {
  const connectionString = 'postgresql://postgres:1v0frumqesNr8oqC@db.kvyeumipuyooaprxlsah.supabase.co:5432/postgres';
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    const setupSql = fs.existsSync('supabase_schema.sql')
      ? fs.readFileSync('supabase_schema.sql', 'utf8')
      : fs.readFileSync('supabase-setup.sql', 'utf8');
    const sql = `${setupSql}

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;`;
    await client.query(sql);
    console.log('Successfully executed SQL schema and RLS policies on Supabase.');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

runSql();
