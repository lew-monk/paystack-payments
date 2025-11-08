import { Worker } from "bullmq";
import { connection } from "@shared/redis";

const concurrency = Number(process.env.CONCURRENCY || 8);
const prefix = process.env.BULLMQ_PREFIX || "bullmq:prod";

type JobData = {
  event: string;
  data: any;
};

const worker = new Worker<JobData>(
  "payments",
  async (job) => {
    const evt = job.data?.event;
    if (evt === "charge.success") {
      const ref = job.data?.data?.reference;
      // TODO: make this idempotent at DB level (unique refs)
      // 1) verify transaction (optional but recommended)
      // 2) mark invoice/order paid
      // 3) emit domain events / emails
      console.log("charge.success", ref);
    } else {
      console.log("Unhandled event", evt);
    }
  },
  { connection, concurrency, prefix }
);

worker.on("completed", (job) =>
  console.log(`completed ${job.name} ${job.id}`)
);
worker.on("failed", (job, err) =>
  console.error(`failed ${job?.name} ${job?.id}`, err)
);
