import { Paystack } from "@shared/paystack";

export type InitTxInput = {
	email: string;
	amount: number; // amount in kobo
	reference?: string;
	currency?: "NGN" | "GHS" | "USD" | string;
	callback_url?: string;
	metadata?: Record<string, unknown>;
};

export type VerifyResp = {
	status: boolean;
	message: string;
	data?: any;
};

let client: Paystack | null = null;

export function getPaystack() {
	if (client) return client;
	const BASEURL = process.env.PAYSTACK_BASE_URL || "https://api.paystack.co";
	const KEY = process.env.PAYSTACK_SECRET_KEY;
	if (!KEY) {
		throw new Error("PAYSTACK_SECRET_KEY is not set");
	}
	client = new Paystack(KEY, BASEURL);
	return client;
}

/**
 * Initialize a transaction using paystack-sdk
 */
export async function initTransaction(input: InitTxInput) {
	const ps = getPaystack();
	const res = await ps.transaction.initialize({
		email: input.email,
		amount: parseFloat(input.amount.toFixed(2)).toFixed(2),
		reference: input.reference,
		currency: input.currency ?? "USD",
		callback_url: input.callback_url,
		metadata: input.metadata
	});
	if (!res?.status) {
		throw new Error(`Paystack init failed: ${res?.message || "unknown error"}`);
	}
	return res;
}

/**
 * Verify a transaction by reference
 */
export async function verifyTransaction(reference: string): Promise<VerifyResp> {
	const ps = getPaystack();
	const res = await ps.transaction.verify(reference);
	return res as VerifyResp;
}
