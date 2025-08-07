import { relations, sql } from "drizzle-orm";
import {
  check,
  int,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const self = sqliteTable(
  "self",
  {
    key: text("key", { enum: ["self"] })
      .notNull()
      .primaryKey()
      .default("self"),
    id: text("id").notNull(),
    address: text("address").notNull(),
    tags: text("tags", { mode: "json" })
      .$type<("api" | "orchestrator" | "scheduler" | "runner")[]>()
      .notNull()
      .default([]),
    data_version: int("data_version").notNull().default(1),
  },
  (table) => [check("key_can_only_be_self", sql`${table.key} = 'self'`)],
);

export const nodes = sqliteTable("nodes", {
  id: text("node_id").notNull().primaryKey(),
  address: text("address").notNull(),
  state: text("state", { enum: ["alive", "suspicious", "dead"] })
    .notNull()
    .default("alive"),
  data_version: int("data_version").notNull().default(0),
});

export const node_relations = relations(nodes, ({ many }) => ({
  tags: many(node_tags),
}));

export const node_tags = sqliteTable(
  "node_tags",
  {
    node_id: text("node_id")
      .notNull()
      .references(() => nodes.id),
    tag: text("tag")
      .notNull()
      .references(() => tags.name),
  },
  (table) => [
    primaryKey({
      name: "node_tags",
      columns: [table.node_id, table.tag],
    }),
  ],
);

export const tags_nodes_relations = relations(nodes, ({ one }) => ({
  node: one(nodes),
  tag: one(tags),
}));

export const tags = sqliteTable("tags", {
  name: text("name", { enum: ["api", "orchestrator", "scheduler", "runner"] })
    .notNull()
    .primaryKey(),
});

export const tag_relations = relations(tags, ({ many }) => ({
  nodes: many(node_tags),
}));
