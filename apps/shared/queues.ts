import { Queue, QueueEvents, JobsOptions } from "bullmq";
import { connection } from "./redis";

const prefix = process.env.BULLMQ_PREFIX || "bullmq:prod";

const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 86400 }
};

export const paymentsQueue = new Queue("payments", {
  connection,
  prefix,
  defaultJobOptions
});

export const paymentsEvents = new QueueEvents("payments", {
  connection,
  prefix
});
