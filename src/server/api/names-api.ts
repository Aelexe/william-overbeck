import axios from "axios";

export default class NamesApi {
	public static async createNames(names: string[]): Promise<void> {
		await axios.post(`/api/names`, { names });
	}
}
