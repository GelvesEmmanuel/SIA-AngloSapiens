
import {drizzle} from "drizzle-orm/postgres-js";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not defined in the environment variables");
let connectionString = databaseUrl
if(connectionString.includes('postgres:postgres@supabase_db_')){

    const url= new URL(connectionString)
    url.hostname = url.hostname.split('_')[1]
    connectionString = url.href
}

export const client = postgres(connectionString, {prepare: false})
export const db = drizzle(client)
