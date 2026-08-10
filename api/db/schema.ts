import { GitCloudTypes } from "api/clients/GitCloudAdapterFactory";
import { defineRelations } from "drizzle-orm";
import {
  boolean,
  pgEnum,
  pgTable,
  text,
  integer,
} from "drizzle-orm/pg-core";

export const gitCloudType = pgEnum("gitCloudTypes", GitCloudTypes)
export const pullRequest = pgTable("projects", {
   id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  repository: text().notNull(),
  number: integer().notNull(),
  gitCloudType: gitCloudType().notNull()
})
export const comments = pgTable("comments", {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  content: text().notNull(),
  lineStart: integer().notNull(),
  lineEnd: integer().notNull(),
  filePath: text().notNull(),
  revised: boolean().notNull().default(false),
  pullRequestId: text().notNull(),
})


export const relations = defineRelations(
  {
    pullRequest,
    comments,
  },
  (r) => ({
    comments: {
      pullRequest: r.one.pullRequest({
        from: r.comments.pullRequestId,
        to: r.pullRequest.id,
      }),
    },
    pullRequest: {
      comments: r.many.comments({
        from: r.pullRequest.id,
        to: r.comments.pullRequestId,
      }),
    },
  }),
);