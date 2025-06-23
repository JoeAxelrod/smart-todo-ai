// db.js  (PostgreSQL)
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.PG_CONN });

await pool.query(`
  create table if not exists tasks (
    id       text primary key,
    user_id  text not null,
    text     text not null,
    tag      text not null,
    created  timestamp default now()
  )
`);

export async function list(userId) {
  const { rows } = await pool.query(
    'select * from tasks where user_id=$1 order by created desc', [userId]);
  return rows;
}

export async function insert(t) {
  await pool.query(
    'insert into tasks(id,user_id,text,tag) values($1,$2,$3,$4)',
    [t.id, t.userId, t.text, t.tag]);
}

export async function del(id, userId) {
  const { rowCount } = await pool.query(
    'delete from tasks where id=$1 and user_id=$2', [id, userId]);
  return rowCount;
}

export async function updateTag(id, tag) {
  await pool.query('update tasks set tag=$1 where id=$2', [tag, id]);
}
