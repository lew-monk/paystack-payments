import { Elysia, t } from "elysia";
import { streamLinksQueue } from "@shared/queues";

const streams = new Elysia().post(
	"/stream-links/generate-passcode",
	async ({ body }) => {
		let data = {
			event: "stream-links-event",
			data: body,
		};
		const res = await streamLinksQueue.add("stream-links-event", data);
		return { ok: true, id: res.id };
	},
	{
		body: t.Object({
			assignedTo: t.String(),
			assignedToEmail: t.String(),
			assignedToName: t.String(),
			max_uses: t.Number(),
			expiresAt: t.String(),
			metadata: t.Optional(t.Record(t.String(), t.Any())),
			event: t.String(),
			transactionId: t.String(),
			count: t.Number(),
		}),
	},
);

export default streams;
