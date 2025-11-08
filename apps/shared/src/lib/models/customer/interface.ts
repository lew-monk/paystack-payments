export interface Customer {
	id: number;
	transactions: Transaction[];
	subscriptions: Subscription[];
	authorizations: Authorization[];
	first_name: string;
	last_name: string;
	email: string;
	phone?: string;
	metadata?: Record<string, unknown>;
	domain: string;
	customer_code: string;
	risk_action: string;
	international_format_phone?: string;
	integration: number;
	createdAt: Date;
	updatedAt: Date;
	identified: boolean;
	identifications: CustomerIdentification[];
	dedicated_account: DedicatedAccount[];
}
