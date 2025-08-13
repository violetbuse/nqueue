import { RPCHandler } from "@orpc/server/node";
import { StandardHandlerPlugin } from "@orpc/server/standard";
import { Node, NodeTag, swim_contract } from "./contract";
import { SwimDriver } from "./driver";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { swim_sqlite_schema as schema } from "../db";
import { Database as SqliteDatabase } from "better-sqlite3";
import { implement } from "@orpc/server";
import { nanoid } from "nanoid";
import { eq, notInArray, and } from "drizzle-orm";
import { create_swim_client } from "./client";
import { logger } from "../logging";
import _ from "lodash";
import { Config } from "../config";

type DATABASE = BetterSQLite3Database<typeof schema> & {
  $client: SqliteDatabase;
};

export class SwimSqlite extends SwimDriver {
  constructor(private db: DATABASE) {
    super();

    this.initialize_self();
  }

  private initialize_self() {
    try {
      const tags = Config.getInstance().get_tags();

      const address = Config.getInstance().local_address();

      const current_self = this.db.select().from(schema.self).get();

      const version = current_self ? current_self.data_version + 1 : 1;

      this.db
        .insert(schema.self)
        .values({
          key: "self",
          id: "node_" + nanoid(),
          address: address,
          tags: tags,
          data_version: version,
        })
        .onConflictDoUpdate({
          target: schema.self.key,
          set: {
            address: address,
            tags: tags,
            data_version: version,
          },
        })
        .execute();
    } catch (error: any) {
      logger.error(`Failed to initialize self node: ${error.message}`);
    }
  }

  override async get_self(): Promise<Node> {
    const self = this.db.select().from(schema.self).get();
    if (!self) throw new Error("Self node not found");

    return {
      node_id: self.id,
      node_address: self.address,
      node_state: "alive",
      node_tags: self.tags,
      data_version: self.data_version,
    };
  }

  override async set_own_version(version: number): Promise<void> {
    await this.db.update(schema.self).set({ data_version: version });
  }

  override async get_nodes(): Promise<Node[]> {
    const nodes = this.db.select().from(schema.nodes).all();

    return nodes.map(
      (node): Node => ({
        node_id: node.id,
        node_address: node.address,
        node_state: "alive",
        node_tags: this.db
          .select({ name: schema.tags.name })
          .from(schema.tags)
          .leftJoin(
            schema.node_tags,
            eq(schema.node_tags.tag, schema.tags.name)
          )
          .where(eq(schema.node_tags.node_id, node.id))
          .all()
          .map((tag) => tag.name),
        data_version: node.data_version,
      })
    );
  }

  override async get_node(node_id: string): Promise<Node | null> {
    const node = this.db
      .select()
      .from(schema.nodes)
      .where(eq(schema.nodes.id, node_id))
      .get();

    if (!node) {
      return null;
    }

    return {
      node_id: node.id,
      node_address: node.address,
      node_state: "alive",
      node_tags: this.db
        .select({ name: schema.tags.name })
        .from(schema.tags)
        .leftJoin(schema.node_tags, eq(schema.node_tags.tag, schema.tags.name))
        .where(eq(schema.node_tags.node_id, node.id))
        .all()
        .map((tag) => tag.name),
      data_version: node.data_version,
    };
  }

  override async set_node_alive(node_id: string): Promise<void> {
    await this.db
      .update(schema.nodes)
      .set({ state: "alive" })
      .where(eq(schema.nodes.id, node_id))
      .execute();
  }

  override async set_node_dead(node_id: string): Promise<void> {
    await this.db
      .update(schema.nodes)
      .set({ state: "dead" })
      .where(eq(schema.nodes.id, node_id))
      .execute();
  }

  override async set_node_sus(node_id: string): Promise<void> {
    await this.db
      .update(schema.nodes)
      .set({ state: "suspicious" })
      .where(eq(schema.nodes.id, node_id))
      .execute();
  }

  override async conditional_update(node: Node): Promise<void> {
    const existing_node = this.db
      .select()
      .from(schema.nodes)
      .where(eq(schema.nodes.id, node.node_id))
      .get();

    let should_update = false;
    if (!existing_node) {
      should_update = true;
    } else if (
      existing_node.state !== node.node_state &&
      (existing_node.state === "alive" ||
        (existing_node.state === "suspicious" && node.node_state === "dead"))
    ) {
      should_update = true;
    } else if (node.data_version > existing_node.data_version) {
      should_update = true;
    }
    if (should_update) {
      await this.db
        .insert(schema.nodes)
        .values({
          id: node.node_id,
          address: node.node_address,
          state: node.node_state,
          data_version: node.data_version,
        })
        .onConflictDoUpdate({
          target: schema.nodes.id,
          set: {
            address: node.node_address,
            state: node.node_state,
            data_version: node.data_version,
          },
        });

      await this.db
        .insert(schema.node_tags)
        .values(
          node.node_tags.map((tag) => ({
            node_id: node.node_id,
            tag: tag,
          }))
        )
        .onConflictDoNothing();

      await this.db
        .delete(schema.node_tags)
        .where(
          and(
            eq(schema.node_tags.node_id, node.node_id),
            notInArray(schema.node_tags.tag, node.node_tags)
          )
        );
    }
  }

  override implement_routes(
    contract: typeof swim_contract,
    plugins: StandardHandlerPlugin<{}>[]
  ): RPCHandler<{}> {
    try {
      const os = implement(contract);

      const request_ping_test = os.request_ping_test.handler(
        async ({ input }) => {
          try {
            const node = await this.get_node(input.node_id);

            if (!node) {
              return { success: false };
            }

            const node_client = create_swim_client(node.node_address);

            const self = await this.get_self();

            const result = await node_client.ping_node({
              self,
              random_nodes: [],
            });

            await this.conditional_update(result.self);

            for (const node of result.random_nodes) {
              await this.conditional_update(node);
            }

            return { success: true, node_data: result.self };
          } catch (error: any) {
            logger.error(
              `Error while pinging node ${input.node_id}: ${error.message}`
            );
            return { success: false };
          }
        }
      );

      const ping_node = os.ping_node.handler(async ({ input }) => {
        const self = await this.get_self();
        const nodes = await this.get_nodes();

        const nodes_to_sample = Math.min(Math.max(nodes.length / 3, 2), 7);

        const random_nodes = _.sampleSize(nodes, nodes_to_sample);
        const you = nodes.find((n) => n.node_id === input.self.node_id) ?? null;

        await this.conditional_update(input.self);
        for (const node of random_nodes) {
          await this.conditional_update(node);
        }

        return {
          self,
          you,
          random_nodes,
        };
      });

      const get_nodes = os.get_nodes.handler(async ({ input }) => {
        const nodes_data = await this.get_nodes();
        const self = await this.get_self();

        const nodes = _.shuffle([self, ...nodes_data]);

        return nodes.filter((n) =>
          input.restrict_alive ? n.node_state === "alive" : true
        );
      });

      const get_node = os.get_node.handler(async ({ input }) => {
        return this.get_node(input.node_id);
      });

      const get_node_of_tag = os.get_node_of_tag.handler(async ({ input }) => {
        const nodes_data = await this.get_nodes();
        const self = await this.get_self();

        const nodes = _.shuffle([self, ...nodes_data]);

        const filtered_nodes = nodes.filter(
          (n) =>
            (input.restrict_alive ? n.node_state === "alive" : true) &&
            n.node_tags.includes(input.tag as NodeTag)
        );

        return filtered_nodes[0] ?? null;
      });

      const get_nodes_of_tag = os.get_nodes_of_tag.handler(
        async ({ input }) => {
          const nodes_data = await this.get_nodes();
          const self = await this.get_self();

          const nodes = _.shuffle([self, ...nodes_data]);

          const filtered_nodes = nodes.filter(
            (n) =>
              (input.restrict_alive ? n.node_state === "alive" : true) &&
              n.node_tags.includes(input.tag as NodeTag)
          );

          return filtered_nodes;
        }
      );

      const get_tagged_count = os.get_tagged_count.handler(
        async ({ input }) => {
          const nodes_data = await this.get_nodes();
          const self = await this.get_self();

          const nodes = [self, ...nodes_data];

          const filtered_nodes = nodes.filter(
            (n) =>
              (input.restrict_alive ? n.node_state === "alive" : true) &&
              n.node_tags.includes(input.tag as NodeTag)
          );

          return filtered_nodes.length;
        }
      );

      const get_self = os.get_self.handler(async () => {
        const self = await this.get_self();

        return self;
      });

      const router = os.router({
        request_ping_test,
        ping_node,
        get_nodes,
        get_node,
        get_node_of_tag,
        get_nodes_of_tag,
        get_tagged_count,
        get_self,
      });

      return new RPCHandler(router, {
        plugins,
      });
    } catch (error: any) {
      logger.error(
        `Error implementing swim routes: ${error.message ?? "unknown"}`
      );
      throw error;
    }
  }
}
