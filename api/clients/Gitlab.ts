import { Gitlab, type CommitDiffSchema, type MergeRequestChangesSchema } from "@gitbeaker/rest";
import type { GitCloudAdapter } from "./Common.ts";

/** Mode reported by GitLab when a side of the diff does not exist. */
const NULL_MODE = "0000000";

export class GitlabAdapter implements GitCloudAdapter {
	client = new Gitlab({
		token: process.env.GITLAB_PERSONAL_ACCESS_TOKEN!,
		host: process.env.GITLAB_ENDPOINT!,
	});

	public async getPrPatch(number: number, repository: string): Promise<string> {
		// GitLab accepts the namespaced path ("group/subgroup/project") as the project id,
		// so there is no need to search for the project by name.
		const mergeRequest = await this.client.MergeRequests.showChanges(repository, number);
		return this.buildPatch(mergeRequest);
	}

	public async getPRFile(number: number, repository: string, path: string): Promise<string> {
		const mergeRequest = await this.client.MergeRequests.show(repository, number);
		const ref = mergeRequest.diff_refs?.head_sha ?? mergeRequest.sha;
		if (!ref) throw new Error(`Could not resolve head commit of !${number} in ${repository}`);
		const file = await this.client.RepositoryFiles.showRaw(repository, path, ref);
		return typeof file === "string" ? file : await file.text();
	}

	/** Rebuilds a `git format-patch`-like file out of the merge request payload. */
	protected buildPatch(mergeRequest: MergeRequestChangesSchema): string {
		const sections = [this.buildHeader(mergeRequest)];

		if (mergeRequest.overflow) {
			sections.push(
				"NOTE: GitLab truncated this merge request diff (overflow), so the patch below is incomplete.\n",
			);
		}

		for (const change of mergeRequest.changes) {
			sections.push(this.buildFileDiff(change));
		}

		return sections.join("\n");
	}

	/** mbox-style preamble; everything before the first `diff --git` is ignored by `git apply`. */
	protected buildHeader(mergeRequest: MergeRequestChangesSchema): string {
		const author = mergeRequest.author;
		const lines = [
			`From ${mergeRequest.sha ?? "0".repeat(40)} Mon Sep 17 00:00:00 2001`,
			`From: ${author?.name ?? "unknown"} <${author?.username ?? "unknown"}@users.noreply>`,
			`Date: ${this.formatDate(mergeRequest.created_at)}`,
			`Subject: [PATCH] ${mergeRequest.title ?? `Merge request !${mergeRequest.iid}`}`,
			"",
		];

		if (mergeRequest.description) {
			lines.push(mergeRequest.description, "");
		}

		lines.push("---", "");
		return lines.join("\n");
	}

	/** Reassembles the `diff --git` header GitLab strips from each change entry. */
	protected buildFileDiff(change: CommitDiffSchema): string {
		const oldPath = change.old_path;
		const newPath = change.new_path;
		const lines = [`diff --git a/${oldPath} b/${newPath}`];

		if (change.new_file) {
			lines.push(`new file mode ${change.b_mode}`);
		} else if (change.deleted_file) {
			lines.push(`deleted file mode ${change.a_mode ?? NULL_MODE}`);
		} else {
			if (change.renamed_file) {
				lines.push("similarity index 100%", `rename from ${oldPath}`, `rename to ${newPath}`);
			}
			if (change.a_mode && change.b_mode && change.a_mode !== change.b_mode) {
				lines.push(`old mode ${change.a_mode}`, `new mode ${change.b_mode}`);
			}
		}

		const body = change.diff ?? "";
		if (body.trim().length > 0) {
			// GitLab only returns the hunks (`@@ ... @@`); the file markers have to be re-added.
			if (!body.startsWith("---")) {
				lines.push(
					`--- ${change.new_file ? "/dev/null" : `a/${oldPath}`}`,
					`+++ ${change.deleted_file ? "/dev/null" : `b/${newPath}`}`,
				);
			}
			lines.push(body.endsWith("\n") ? body.slice(0, -1) : body);
		} else if (!change.renamed_file) {
			// Empty diff with content changes means GitLab could not render it (binary or too large).
			lines.push(`Binary files a/${oldPath} and b/${newPath} differ`);
		}

		return `${lines.join("\n")}\n`;
	}

	/** RFC 2822 date, the format `git format-patch` writes. */
	protected formatDate(value?: string): string {
		const date = value ? new Date(value) : new Date(0);
		return Number.isNaN(date.getTime()) ? new Date(0).toUTCString() : date.toUTCString();
	}
}
