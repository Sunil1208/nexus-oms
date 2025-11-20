import pg from "pg";
import { config } from "../config/env.js";
const { Pool } = pg;

export const pool = new Pool({
    host: config.pg.host,
    port: config.pg.port,
    user: config.pg.user,
    password: config.pg.password,
    database: config.pg.database,
    max: 20, // max number of clients in the pool
    idleTimeoutMillis: 30000, // close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
});

pool.on("error", (err) => {
    console.error("Unexpected error on idle PostgreSQL client", err);
    // process.exit(-1);
});

export async function query(text, params) {
    return pool.query(text, params);
}

export async function testDbConnection() {
    const res = await pool.query("SELECT NOW()");
    return res.rows[0].now;
}