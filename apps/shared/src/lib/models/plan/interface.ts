export interface IPlan {
	domain: string;
	name: string;
	plan_code: string;
	description: string;
	amount: number;
	interval: string;
	send_invoices: boolean;
	send_sms: boolean;
	hosted_page: boolean;
	hosted_page_url: string;
	hosted_page_summary: string;
	currency: string;
	migrate: boolean;
	id: number;
	integration: number;
	is_archived: boolean;
	createdAt: Date;
	updatedAt: Date;
}
