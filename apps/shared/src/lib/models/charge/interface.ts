export interface Authorization {
	authorization_code: string;
	card_type: string;
	bank: string;
	bin: string;
	brand: string;
	channel: string;
	country_code: string;
	exp_month: string;
	exp_year: string;
	last4: string;
	reusable: boolean;
	signature: string;
	account_name: string;
}
