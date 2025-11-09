import { Elysia, t } from "elysia";
import cors from "@elysiajs/cors";
import { verifyPaystackSignature } from "./signature";
import { paymentsQueue } from "@shared/queues";
import { initTransaction } from "@shared/index";

const app = new Elysia()
	.use(cors())
	.get("/healthz", () => {
		console.log("healthz");
		return { ok: true };
	})
	.post("/healthz", ({ body }) => {
		console.log("healthz");
		return { ok: body };
	}, {
		body: t.Object({
			email: t.String(),
			amount: t.Number(),
			reference: t.Optional(t.String()),
			currency: t.Optional(t.String()),
			callback_url: t.Optional(t.String()),
			metadata: t.Optional(t.Record(t.String(), t.Any()))
		})
	})
	.post(
		"/payments/start",
		async ({ body, set }) => {
			try {
				const data = await initTransaction({
					email: body.email,
					amount: body.amount,
					reference: body.reference,
					currency: body.currency,
					callback_url: body.callback_url,
					metadata: body.metadata
				});
				return data;
			} catch (e: any) {
				set.status = 502;
				return { error: e.response?.data ?? e.response.data ?? "init failed" };
			}
		},
		{
			body: t.Object({
				email: t.String(),
				amount: t.Number(),
				reference: t.Optional(t.String()),
				currency: t.Optional(t.String()),
				callback_url: t.Optional(t.String()),
				metadata: t.Optional(t.Record(t.String(), t.Any()))
			})
		}
	)
	.post("/webhooks/paystack", async ({ request, set }) => {
		const WEBHOOK_SECRET = Bun.env.PAYSTACK_WEBHOOK_SECRET || "";
		const raw = new Uint8Array(await request.arrayBuffer());
		const sig = request.headers.get("x-paystack-signature") || undefined;

		if (!verifyPaystackSignature(raw, sig, WEBHOOK_SECRET)) {
			set.status = 401;
			return "Invalid signature";
		}

		const event = JSON.parse(new TextDecoder().decode(raw));

		const jobId =
			`${event?.event || "evt"}:` +
			`${event?.data?.reference || event?.data?.id || crypto.randomUUID()}`;

		await paymentsQueue.add("paystack-event", event, { jobId });

		set.status = 200;
		return "ok";
	});

app.listen(Bun.env.PORT || 3000);
console.log(`API on :${Bun.env.PORT || 3000}`);
