import { Authorization } from "../charge/interface";
import { Customer } from "../customer/interface";
import { IPlan } from "../plan/interface";

export interface Subscription {
	customer: Customer;
	plan: IPlan;
	integration: number;
	authorization: Authorization;
	domain: string;
	start: number;
	status: string;
	quantity: number;
	amount: number;
	subscription_code: string;
	email_token: string;
	easy_cron_id: string;
	cron_expression: string;
	next_payment_date: Date;
	open_invoice: string;
	id: number;
	createdAt: Date;
	updatedAt: Date;
}
