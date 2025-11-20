import pg from "pg";
import { config } from "../src/config/env.js";
const { Pool } = pg;

const pool = new Pool({
    host: config.pg.host,
    port: config.pg.port,
    user: config.pg.user,
    password: config.pg.password,
    database: config.pg.database,
});

async function testWrites(count = 1000) {
    console.log(`Running ${count} write tests...`);

    for (let i = 0; i < count; i++) {
        await pool.query(
            `
                UPDATE shipments
                SET status = 'IN_TRANSIT'
                WHERE order_id = 3
            `
        );

        if (i % 100 === 0) {
            console.log(`${i} writes done...`);
        }
    }
    console.log("Write tests completed.");
    process.exit(0);
}

testWrites()