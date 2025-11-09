import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Transaction } from '@shared/src/lib/transaction/transaction';


export class Paystack {
	private readonly http: AxiosInstance;
	public transaction: Transaction;
	constructor(private readonly key: string, private readonly baseURL: string) {
		this.http = axios.create({
			baseURL: this.baseURL,
			headers: {
				Authorization: `Bearer ${this.key}`,
				'Content-Type': 'application/json',
			},
		});
		this.http.interceptors.response.use(
			(response: AxiosResponse) => response.data,
		);

		this.transaction = new Transaction(this.http);
	}
}

