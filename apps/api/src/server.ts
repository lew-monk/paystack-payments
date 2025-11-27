import { Elysia, t } from "elysia";
import cors from "@elysiajs/cors";
import { verifyPaystackSignature } from "./signature";
import { paymentsQueue } from "@shared/queues";
import { Paystack } from "./paystack/service";
import streams from "./stream-links";

const app = new Elysia()
	.use(cors())
	.use(streams)
	.get("/healthz", () => {
		console.log("healthz");
		return { ok: true };
	})
	.post(
		"/payments/start",
		async ({ body }) => {
			const res = await Paystack.initializeTransaction(body);
			if (!res.status) {
				return res;
			}
			return res;
		},
		{
			body: t.Object({
				email: t.String(),
				amount: t.Number(),
				reference: t.String(),
				currency: t.String(),
				callback_url: t.Optional(t.String()),
				metadata: t.Optional(t.Record(t.String(), t.Any())),
			}),
		},
	)
	.post("/payments/verify/:reference", async ({ params }) => {
		const res = await Paystack.verify(params.reference);
		if (!res.status) {
			return false;
		}
		return res.status;
	})
	.post("/api/v1/paystack/webhooks", async ({ request, set }) => {
		const WEBHOOK_SECRET = Bun.env.PAYSTACK_WEBHOOK_SECRET || "";
		const raw = new Uint8Array(await request.json());
		const sig = request.headers.get("x-paystack-signature") || undefined;

		if (!verifyPaystackSignature(raw, sig, WEBHOOK_SECRET)) {
			set.status = 401;
			return "Invalid signature";
		}

		const event = JSON.parse(new TextDecoder().decode(raw));

		const jobId =
			`${event?.event || "evt"}:` +
			`${event?.data?.reference || event?.data?.id || crypto.randomUUID()}`;

		let verify = await Paystack.verify(event.data.reference);
		if (!verify.status) {
			console.log(Array(20).fill("=").join(""));
			console.log("Transaction not complete", verify.message);
			console.log(Array(20).fill("=").join(""));
			set.status = 400;
			return { status: false, message: "Transaction not complete" };
		}
		await paymentsQueue.add("paystack-event", event, { jobId });
		set.status = 200;
		return "ok";
	});

app.listen(Bun.env.PORT || 3000);

app.onError(({ code, error, request }) => {
	console.error("Elysia error", code, request.method, request.url, error);
	return { error: "internal_error" };
});

console.log(`API on :${Bun.env.PORT || 3000}`);
