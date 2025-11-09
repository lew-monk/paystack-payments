
import { initTransaction, InitTxInput } from "@shared/index";
import { BadRequest } from "@shared/src/lib/models/interface";
import { TransactionInitialized } from "@shared/src/lib/models/transaction/interface";

export abstract class Paystack {
	static async initializeTransaction(body: InitTxInput): Promise<TransactionInitialized | BadRequest> {
		try {
			const data = await initTransaction({
				email: body.email,
				amount: body.amount,
				reference: body.reference,
				currency: body.currency,
				callback_url: body.callback_url,
				metadata: body.metadata
			});
			if (data.status) {
				return data;
			}
			return {
				data: data.data,
				status: false,
				message: "Something went wrong"
			}
		}
		catch (e: any) {
			return {
				data: e.response?.data,
				status: e.response?.status,
				message: e.response?.message
			};
		}
	}
}
