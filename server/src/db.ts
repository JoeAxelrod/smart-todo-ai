import { Pool } from "pg";
import { Task } from "./types.js";

const pool = new Pool({ connectionString: process.env.PG_CONN });

export async function init() {
  await pool.query(`
    create table if not exists tasks (
      id       text primary key,
      user_id  text not null,
      text     text not null,
      tag      text not null,
      created  timestamp default now()
    )
  `);
}

export async function list(userId: string): Promise<Task[]> {
  const { rows } = await pool.query<Task>(
    "select * from tasks where user_id=$1 order by created desc",
    [userId]
  );
  return rows;
}

export async function insert(t: Task): Promise<void> {
  await pool.query(
    "insert into tasks(id,user_id,text,tag) values($1,$2,$3,$4)",
    [t.id, t.userId, t.text, t.tag]
  );
}

export async function del(id: string, userId: string): Promise<number> {
  const { rowCount } = await pool.query(
    "delete from tasks where id=$1 and user_id=$2",
    [id, userId]
  );
  return rowCount ?? 0;
}

export async function updateTag(id: string, tag: string): Promise<void> {
  await pool.query("update tasks set tag=$1 where id=$2", [tag, id]);
}