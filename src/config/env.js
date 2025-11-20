import dotenv from "dotenv";

dotenv.config();

function required(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Environment variable ${name} is required but not set.`);
    }
    return value;
}


export const config = {
    pg: {
        host: required("PG_HOST"),
        prot: Number(required("PG_PORT")),
        user: required("PG_USER"),
        password: required("PG_PASSWORD"),
        database: required("PG_DATABASE"),
    },
    redis: {
        host: required("REDIS_HOST"),
        port: Number(required("REDIS_PORT")),
    },
    queueName: required("QUEUE_NAME"),
    nodeEnv: process.env.NODE_ENV || "development",
}