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
		console.log("stream-links-event", job);
		const evt = job.data?.event;
		if (evt === "stream-links-event") {
			let res = await axios.post(
				`${process.env.STREAMLINK_API_URL}/streams/${job.data.data.event}/passcodes`,
				{
					body: JSON.stringify({
						assignedTo: job.data.data.assignedTo,
						assignedEmail: job.data.data.assignedToEmail,
						assignedToName: job.data.data.assignedToName,
						max_uses: 1,
						count: job.data.data.count,
						expires_at: new Date(
							new Date().setMonth(new Date().getMonth() + 6),
						).toISOString(),
					}),
				},
			);
			if (res.status !== 200) {
				console.error("Stream links failed", res.status, res.data);
				job.retry("failed");
				return;
			}

			console.log("stream-links-event", res.data);

			const streamLinkResponse = await axios.post(
				`${process.env.MTICKETS_PROCESS_WEBHOOKS}/api/vi/webhooks/process/`,
				{
					type: "stream.link.created",
					data: {
						eventId: job.data.data.eventId,
						name: job.data.data.assignedToName,
						transactionId: job.data.data.transactionId,
						passcodes: res.data.passcode,
					},
				},
			);
			if (streamLinkResponse.status !== 200) {
				console.error(
					"Stream links failed",
					streamLinkResponse.status,
					streamLinkResponse.data,
				);
				job.retry("failed");
				return;
			}

			console.log("stream-links-event", res.data);
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
