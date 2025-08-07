import { StandardHandlerPlugin } from "@orpc/server/standard";
import { logger } from "../logging";
import { Node, swim_contract } from "./contract";
import { RPCHandler } from "@orpc/server/node";
import type { Express } from "express";
import _ from "lodash";
import { create_swim_client } from "./client";
import { safe } from "@orpc/client";
import { Config } from "../config";

export abstract class SwimDriver {
  constructor(private interval: number = 3_000) {}

  abstract implement_routes(
    contract: typeof swim_contract,
    plugins: StandardHandlerPlugin<{}>[],
  ): RPCHandler<{}>;

  private register_routes(app: Express) {
    const router = this.implement_routes(swim_contract, []);
    app.use("/swim/*splat", async (req, res, next) => {
      const { matched } = await router.handle(req, res, {
        prefix: "/swim",
        context: {},
      });

      if (matched) {
        return;
      }

      next();
    });
  }

  abstract get_self(): Promise<Node>;
  abstract get_nodes(): Promise<Node[]>;

  private async ping_nodes(): Promise<void> {
    try {
      const nodes = await this.get_nodes();
      const shuffled = _.shuffle(nodes);

      const nodes_to_ping = shuffled.slice(
        0,
        Math.min(Math.max(Math.round(shuffled.length / 7), 2), 5),
      );

      const nodes_to_include = _.takeRight(
        nodes,
        Math.min(Math.max(Math.round(shuffled.length / 7), 2), 5),
      );

      await Promise.all(
        nodes_to_ping.map(async (node) =>
          this.ping_node(node, nodes_to_include),
        ),
      );
    } catch (error: any) {
      logger.error(`Error in ping_nodes: ${error.message ?? "Unknown error"}`);
    }
  }

  abstract set_node_sus(node_id: string): Promise<void>;
  abstract conditional_update(node: Node): Promise<void>;
  abstract get_node(node_id: string): Promise<Node | null>;
  abstract set_own_version(version: number): Promise<void>;
  abstract set_node_alive(node_id: string): Promise<void>;
  abstract set_node_dead(node_id: string): Promise<void>;

  public async ping_node(
    node: Node,
    random_nodes: Node[],
  ): Promise<{ success: boolean }> {
    try {
      const self = await this.get_self();
      const node_client = create_swim_client(node.node_address);

      const [error, response] = await safe(
        node_client.ping_node(
          {
            self,
            random_nodes,
          },
          {
            signal: AbortSignal.timeout(this.interval / 2),
          },
        ),
      );

      if (error || !response) {
        await this.set_node_sus(node.node_id);
        return { success: false };
      }

      if ((response.you?.data_version ?? 0) > self.data_version) {
        await this.set_own_version((response.you?.data_version ?? 0) + 1);
      }

      if (response.you?.node_state !== "alive") {
        await this.set_own_version(
          Math.max(self.data_version, response.you?.data_version ?? 0) + 1,
        );
      }

      await Promise.all([
        this.conditional_update(response.self),
        ...response.random_nodes.map(this.conditional_update),
      ]);

      return { success: true };
    } catch (error: any) {
      logger.error(`Error in ping_node: ${error.message ?? "Unknown error"}`);
      try {
        await this.set_node_sus(node.node_id);
      } catch (error: any) {
        logger.error(
          `Error in set_node_sus: ${error.message ?? "Unknown error"}`,
        );
      }
      return { success: false };
    }
  }

  private async test_sus_nodes() {
    const nodes = await this.get_nodes();
    const random_sus_nodes = _.sampleSize(
      nodes.filter((n) => n.node_state === "suspicious"),
      Math.min(Math.max(Math.round(nodes.length / 3), 2), 5),
    );

    const alive_nodes = nodes.filter((n) => n.node_state === "alive");

    await Promise.all(
      random_sus_nodes.map((node) =>
        this.test_sus_node(node.node_id, alive_nodes),
      ),
    );
  }

  private async test_sus_node(node_id: string, alive_nodes: Node[]) {
    try {
      const alive_nodes_to_test_against = _.sampleSize(alive_nodes, 3);

      const results = await Promise.all(
        alive_nodes_to_test_against.map(async (tester) => {
          try {
            const test_client = create_swim_client(tester.node_address);
            const response = await test_client.request_ping_test(
              { node_id },
              { signal: AbortSignal.timeout(this.interval * 1.5) },
            );

            return response;
          } catch (error: any) {
            try {
              await this.set_node_sus(tester.node_id);
            } catch (error: any) {
              logger.error(
                `Error in mark_node_sus: ${error.message ?? "Unknown error"}`,
              );
            }
            return { success: false };
          }
        }),
      );

      const successful_result = results.find((result) => result.success);
      if (!successful_result || !successful_result.success) {
        await this.set_node_dead(node_id);
      }

      if (successful_result && "node_data" in successful_result) {
        await this.conditional_update(successful_result.node_data);
      }
    } catch (error: any) {
      logger.error(
        `Error in test_sus_node: ${error.message ?? "Unknown error"}`,
      );
    }
  }

  private async drive() {
    try {
      await Promise.all([this.ping_nodes(), this.test_sus_nodes()]);
    } catch (error: any) {
      logger.error(`Error in drive: ${error.message ?? "Unknown error"}`);
    }
  }

  private _interval: NodeJS.Timeout | null = null;

  async bootstrap_membership(): Promise<void> {
    try {
      const bootstrap_nodes =
        Config.getInstance().read().cluster_bootstrap_nodes;

      if (bootstrap_nodes.length === 0) {
        logger.info("No bootstrap nodes provided");
        return;
      }

      const self = await this.get_self();
      await Promise.all(
        bootstrap_nodes.map(async (address) => {
          try {
            const client = create_swim_client(address);
            const result = await client.ping_node({
              self,
              random_nodes: [],
            });

            const you_version = result.you?.data_version ?? 0;
            if (you_version > self.data_version) {
              await this.set_own_version(you_version + 1);
            }

            await Promise.all([
              this.conditional_update(result.self),
              ...result.random_nodes.map(this.conditional_update),
            ]);
          } catch (error: any) {
            logger.error(
              `Error joining bootstrap node at ${address}: ${error.message ?? "Unknown error"}`,
            );
          }
        }),
      );
    } catch (error: any) {
      logger.error(
        `Error joining bootstrap nodes: ${error.message ?? "Unknown error"}`,
      );
    }
  }

  async start(app: Express) {
    this.register_routes(app);

    if (this._interval) {
      clearInterval(this._interval);
    }

    this._interval = setInterval(async () => {
      try {
        await this.drive();
      } catch (error: any) {
        logger.error(
          `Error in driver loop: ${error.message ?? "Unknown error"}`,
        );
      }
    }, this.interval);

    setTimeout(async () => {
      try {
        await this.bootstrap_membership();
      } catch (error: any) {
        logger.error(
          `Error bootstrapping membership: ${error.message ?? "Unknown error"}`,
        );
      }
    }, this.interval);
  }
}
