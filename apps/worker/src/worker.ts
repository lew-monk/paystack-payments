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
			const res = await axios.post(
				"https://gig.mtickets.com/api/v1/paystack/confirm-payment",
				{
					orderId: ref,
					data: job.data?.data,
				},
			);
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
	{ connection, concurrency, prefix },
);

worker.on("completed", (job) => console.log(`completed ${job.name} ${job.id}`));
worker.on("failed", (job, err) =>
	console.error(`failed ${job?.name} ${job?.id}`, err),
);

const streamLinksWorker = new Worker<JobData>(
	"streams",
	async (job) => {
		const evt = job.data?.event;
		if (evt === "stream-links-event") {
			let res = await axios.post(
				`${process.env.STREAMLINK_API_URL}/api/streams/${job.data.data.event}/passcodes`,
				{
					assignedTo: "",
					assignedEmail: job.data.data.assignedToEmail,
					assignedToName: job.data.data.assignedToName,
					max_uses: 1,
					count: job.data.data.count,
					expires_at: new Date(
						new Date().setMonth(new Date().getMonth() + 6),
					).toISOString(),
				},
				{
					headers: {
						"Content-Type": "application/json",
						"x-api-key": process.env.STREAMLINK_API_KEY,
					},
				},
			);
			if (res.status !== 201) {
				console.error("Stream links failed", res.status, res.data);
				await job.moveToFailed(
					new Error("Stream links failed"),
					job.data.data.transactionId,
					false,
				);
				return;
			}

			const streamLinkResponse = await axios.post(
				`${process.env.MTICKETS_PROCESS_WEBHOOKS}`,
				{
					type: "stream.link.created",
					data: {
						eventId: job.data.data.eventId,
						email: job.data.data.assignedToEmail,
						name: job.data.data.assignedToName,
						transactionId: job.data.data.transactionId,
						passcodes: res.data.passcodes,
					},
				},
			);
			if (streamLinkResponse.status !== 200) {
				await job.moveToFailed(
					new Error("Stream links failed"),
					job.data.data.transactionId,
					false,
				);
				console.error(
					"Stream links failed",
					streamLinkResponse.status,
					streamLinkResponse.data,
				);
				return;
			}

			console.log("stream-links-event", streamLinkResponse.data);
		} else {
			console.log("Unhandled event", evt);
		}
	},
	{ connection, concurrency, prefix },
);

streamLinksWorker.on("completed", (job) =>
	console.log(`completed ${job.name} ${job.id}`),
);
streamLinksWorker.on("failed", (job, err) =>
	console.error(`failed ${job?.name} ${job?.id}`, err),
);
