import { createTool } from "@decocms/runtime/tools";
import { z } from "zod";
import type { Env } from "../types/env.ts";
import { GitCloudAdapterFactory, GitCloudTypes } from "api/clients/GitCloudAdapterFactory.ts";

export const getPatchInputSchema = z.object({
    prNumber: z.number().describe("The number of PR"),
    repository:z.string().describe("Repository to check example: gsbenevides2/pr-mcp"),
    plataform: z.enum(GitCloudTypes)
});

export type GetPatchInput = z.infer<typeof getPatchInputSchema>;

export const getPatchOutputSchema = z.object({
    contents: z.string().describe("The patch file content")
});

export type GetPatchOutput = z.infer<typeof getPatchOutputSchema>;

export const getPatchTool = (_env: Env) =>
    createTool({
        id: "getPatch",
        description:
            "Get a patch file content from a Pull Request (PR)",
        inputSchema: getPatchInputSchema,
        outputSchema: getPatchOutputSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
        execute: async ({ context }) => {
            const { plataform, prNumber, repository} = context;
            const client = GitCloudAdapterFactory.create(plataform)
            
            return {
                contents: await client.getPrPatch(prNumber, repository)
            };
        },
    });
