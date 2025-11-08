import IORedis from "ioredis";

const {
	REDIS_HOST = "redis",
	REDIS_PORT = "6379",
	REDIS_PASSWORD = "",
} = process.env;

export const connection = new IORedis({
	host: REDIS_HOST,
	port: Number(REDIS_PORT),
	password: REDIS_PASSWORD,
	maxRetriesPerRequest: null,
	enableReadyCheck: true
});
