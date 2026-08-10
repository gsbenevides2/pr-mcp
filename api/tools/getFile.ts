import { createTool } from "@decocms/runtime/tools";
import { z } from "zod";
import { GitCloudAdapterFactory, GitCloudTypes } from "api/clients/GitCloudAdapterFactory.ts";
import type { Env } from "../types/env.ts";

export const getFileInputSchema = z.object({
    prNumber: z.number().describe("The number of PR"),
    repository: z.string().describe("Repository to check example: gsbenevides2/pr-mcp"),
    plataform: z.enum(GitCloudTypes),
    path: z.string().describe("Path of the file inside the repository example: api/clients/Common.ts")
});

export type GetFileInput = z.infer<typeof getFileInputSchema>;

export const getFileOutputSchema = z.object({
    contents: z.string().describe("The raw file content at the head commit of the PR")
});

export type GetFileOutput = z.infer<typeof getFileOutputSchema>;

export const getFileTool = (_env: Env) =>
    createTool({
        id: "getFile",
        description:
            "Get the full content of a file as it exists on the head commit of a Pull Request (PR). Use it to read the surrounding context of a file that a patch only shows partially.",
        inputSchema: getFileInputSchema,
        outputSchema: getFileOutputSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
        execute: async ({ context }) => {
            const { plataform, prNumber, repository, path } = context;
            const client = GitCloudAdapterFactory.create(plataform)

            return {
                contents: await client.getPRFile(prNumber, repository, path)
            };
        },
    });
