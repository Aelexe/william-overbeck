import axios from "axios";

export default class NamesApi {
	public static async createName(name: string): Promise<void> {
		await axios.post(`/api/names/${name}`);
	}
}
