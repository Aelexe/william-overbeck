import axios from "axios";
import { Submission } from "../../model/submission-model";

export default class SubmissionsApi {
	public static async getSubmissionsForGroupAnalysis(): Promise<Submission[]> {
		const response = await axios.get<Submission[]>("/api/submissions/group-analysis");
		return response.data;
	}

	public static async setSubmissionGroupStatus(documentId: string, isGrouped: boolean): Promise<void> {
		await axios.put(`/api/submissions/${documentId}/group-status`, { isGrouped });
	}

	public static async setNames(documentId: string, names: string[]): Promise<void> {
		await axios.put(`/api/submissions/${documentId}/names`, { names });
	}
}
