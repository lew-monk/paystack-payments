import { Worker } from "bullmq";
import { connection } from "@shared/redis";
import axios from "axios";

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
			const res = await axios.post("https://gig.mtickets.com/api/v1/paystack/confirm-payment", {
				orderId: ref,
				data: job.data?.data,
			});
			if (res.status !== 200) {
				console.error("Paystack confirm payment failed", res.status, res.data);
				job.retry("failed");
				return;
			}

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
