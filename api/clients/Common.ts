export interface GitCloudAdapter {
	getPrPatch(number: number, repository: string): Promise<string>;
	/** Raw content of `path` as it exists on the head commit of the PR/MR. */
	getPRFile(number: number, repository: string, path: string): Promise<string>;
}
