import { Queue, QueueEvents, JobsOptions } from "bullmq";
import { connection } from "./redis";

const prefix = process.env.BULLMQ_PREFIX || "bullmq:prod";

const defaultJobOptions: JobsOptions = {
	attempts: 5,
	backoff: { type: "exponential", delay: 2000 },
	removeOnComplete: true,
	removeOnFail: { age: 86400 },
};

export const paymentsQueue = new Queue("payments", {
	connection,
	prefix,
	defaultJobOptions,
});

export const paymentsEvents = new QueueEvents("payments", {
	connection,
	prefix,
});

export const streamLinksQueue = new Queue("streams", {
	connection,
	prefix,
});
