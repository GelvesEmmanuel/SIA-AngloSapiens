import { Pool } from 'pg';
export const pool = new Pool({
    user:'postgres',
    password:' EGT0419',
    host:'localhost',
    port:5432,
    database:'postgres'
});
