import { Paystack } from "paystack-sdk";
const SECRET = process.env.PAYSTACK_SECRET_KEY!;

export const paystack = new Paystack(SECRET);
