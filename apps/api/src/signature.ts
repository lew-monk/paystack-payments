import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyPaystackSignature(
	rawBody: Uint8Array,
	signatureHeader: string | undefined,
	webhookSecret: string
) {
	if (!signatureHeader) return false;
	const computed = createHmac("sha512", webhookSecret)
		.update(rawBody)
		.digest("hex");
	try {
		return timingSafeEqual(
			Buffer.from(signatureHeader, "utf8"),
			Buffer.from(computed, "utf8")
		);
	} catch {
		return false;
	}
}
