import fetch from "node-fetch";
import * as z from "zod";
import type { Express } from "express";

const address_schema = z.url().min(1);

type Address = z.infer<typeof address_schema>;

const node_schema = z.object({
  version: z.number().min(1),
  address: address_schema,
  state: z.enum(["alive", "suspect", "dead"]),
  tags: z.array(z.string()),
});

export type Node = z.infer<typeof node_schema>;

const ping_schema = z.object({
  self: node_schema,
  other: z.array(node_schema),
});

type Ping = z.infer<typeof ping_schema>;

const sus_notification_schema = z.object({
  node: node_schema,
});

type SusNotification = z.infer<typeof sus_notification_schema>;

const sus_notification_response = z.object({
  success: z.boolean(),
});

type SusResponse = z.infer<typeof sus_notification_response>;

const death_notification_schema = z.object({
  node: node_schema,
});

type DeathNotification = z.infer<typeof death_notification_schema>;

export type SwimOptions = {
  local_node: Address;
  tags: string[];
  nodes: Address[];
  interval: number;
};

export class Swim {
  local_node: Node;
  nodes: Node[];

  public static make_address(host: string, port: number): Address {
    return `http://${host}:${port}`;
  }

  constructor(options: SwimOptions) {
    const { local_node, tags, nodes } = options;

    this.local_node = {
      version: 1,
      address: local_node,
      state: "alive",
      tags,
    };

    this.nodes =
      nodes?.map((address) => ({
        version: 1,
        address,
        state: "alive",
        tags: [],
      })) || [];
  }

  private randomly_sorted_nodes() {
    return this.nodes
      .map((n) => ({ n, k: Math.random() }))
      .sort((a, b) => a.k - b.k)
      .map(({ n }) => n);
  }

  public get_alive_nodes(): Node[] {
    return this.randomly_sorted_nodes().filter((n) => n.state === "alive");
  }

  public own_node(): Node {
    return this.local_node;
  }

  private edit_node(node: Node) {
    // check that the node is not the local node
    if (node.address === this.local_node.address) {
      return;
    }

    const index = this.nodes.findIndex((n) => n.address === node.address);
    if (index !== -1) {
      this.nodes[index] = { ...node };
    } else {
      this.nodes.push(node);
    }
  }

  private async mark_as_sus(node: Node) {
    this.edit_node({
      ...node,
      state: "suspect",
    });
  }

  private async notify_sus(node: Node) {
    try {
      const notification: SusNotification = {
        node,
      };

      const random_alive_nodes = this.randomly_sorted_nodes()
        .filter((n) => n.state === "alive")
        .slice(0, 3);

      const responses = await Promise.all(
        random_alive_nodes.map(async (tester) => {
          const response = await fetch(`${tester.address}/swim/sus`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(notification),
          });

          const data = await response.json();

          const body = await sus_notification_response.parseAsync(data);

          return body.success;
        }),
      );

      const success = responses.some((r) => !!r);

      if (success) {
        await this.mark_as_alive(node);
      } else {
        await this.mark_as_dead(node);
        await this.notify_dead(node);
      }
    } catch (error: any) {
      console.error(
        `Failed to mark node ${node.address} as suspect: ${error?.message || "Unknown error"}`,
      );
    }
  }

  private async handle_sus_notification(body: unknown): Promise<SusResponse> {
    try {
      const { node } = await sus_notification_schema.parseAsync(body);

      const ping_response = await this.ping(node);

      return { success: ping_response };
    } catch (err: any) {
      console.error(
        `Failed to handle SUS notification: ${err?.message || "Unknown error"}`,
      );
      return { success: false };
    }
  }

  private async mark_as_alive(node: Node) {
    this.edit_node({
      ...node,
      state: "alive",
    });
  }

  private async mark_as_dead(node: Node) {
    this.edit_node({
      ...node,
      state: "dead",
      version: node.version + 10,
    });
  }

  private async notify_dead(node: Node) {
    try {
      // get at least 10 alive nodes to notify
      const random_alive_nodes = this.randomly_sorted_nodes()
        .filter((n) => n.state === "alive")
        .slice(0, 3);

      await Promise.all(
        random_alive_nodes.map(async (remote) => {
          const body: DeathNotification = {
            node,
          };

          await fetch(`${remote.address}/swim/dead`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });
        }),
      );
    } catch (error: any) {
      console.error(
        `Failed to mark node as dead: ${error?.message || "Unknown error"}`,
      );
    }
  }

  private async handle_death_notification(body: unknown) {
    try {
      const { node } = await death_notification_schema.parseAsync(body);

      if (node.address === this.local_node.address) {
        return;
      }

      const local_node_data = this.nodes.find(
        (n) => n.address === node.address,
      );

      if (local_node_data?.state === "dead") {
        return;
      }

      await this.mark_as_dead(node);
    } catch (error: any) {
      console.error(
        `Failed to handle death notification: ${error?.message || "Unknown error"}`,
      );
    }
  }

  private async ping(node: Node): Promise<boolean> {
    try {
      const body: Ping = {
        self: this.local_node,
        other: this.nodes,
      };

      const response = await fetch(`${node.address}/swim/ping`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        await this.mark_as_sus(node);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await this.mark_as_alive(node);

      return true;
    } catch (error: any) {
      console.error(
        `Failed to ping node ${node.address}: ${error?.message || "Unknown error"}`,
      );
      try {
        await this.mark_as_sus(node);
      } catch (error) {
        console.error(
          `Failed to mark node ${node.address} as suspect: ${error}`,
        );
      }

      return false;
    }
  }

  private async handle_ping(body: unknown) {
    try {
      const ping = await ping_schema.parseAsync(body);

      this.edit_node(ping.self);

      const remote_local_node = ping.other.find(
        (node) => node.address === this.local_node.address,
      );

      if (
        remote_local_node &&
        remote_local_node.version > this.local_node.version
      ) {
        this.local_node.version = remote_local_node.version + 1;
      }

      for (const local_node of this.nodes) {
        const remote_node = ping.other.find(
          (node) => node.address === local_node.address,
        );

        if (!remote_node) {
          await this.mark_as_sus(local_node);
          continue;
        }

        if (remote_node.version > local_node.version) {
          this.edit_node(remote_node);
        }
      }
    } catch (error: any) {
      console.error(
        `Failed to handle ping: ${error?.message || "Unknown error"}`,
      );
    }
  }

  private async drive() {
    const randomly_sorted_nodes = this.randomly_sorted_nodes();

    const alive_nodes_randomly_sorted = randomly_sorted_nodes
      .filter((n) => n.state === "alive")
      .slice(0, 5);
    const pings = alive_nodes_randomly_sorted.map((node) => this.ping(node));

    const sus_nodes_randomly_sorted = randomly_sorted_nodes
      .filter((n) => n.state === "suspect")
      .slice(0, 3);
    const sus_notifications = sus_nodes_randomly_sorted.map((node) =>
      this.notify_sus(node),
    );

    const dead_nodes_randomly_sorted = randomly_sorted_nodes
      .filter((n) => n.state === "dead")
      .slice(0, 3);
    const dead_notifications = dead_nodes_randomly_sorted.map((node) =>
      this.notify_dead(node),
    );

    await Promise.all([
      Promise.all(pings),
      Promise.all(sus_notifications),
      Promise.all(dead_notifications),
    ]);
  }

  public register_handlers(app: Express) {
    app.post("/swim/ping", async (req, res) => {
      try {
        await this.handle_ping(req.body);

        res.status(200).end();
      } catch (error: any) {
        console.error(
          `Failed to handle ping: ${error?.message || "Unknown error"}`,
        );

        res.status(500).end();
      }
    });

    app.post("/swim/sus", async (req, res) => {
      try {
        const body: SusResponse = await this.handle_sus_notification(req.body);

        res.status(200).send(body);
      } catch (error: any) {
        console.error(
          `Failed to handle swim/sus: ${error?.message || "Unknown error"}`,
        );

        const body: SusResponse = { success: false };
        res.status(500).send(body);
      }
    });

    app.post("/swim/dead", async (req, res) => {
      try {
        await this.handle_death_notification(req.body);

        res.status(200).end();
      } catch (error: any) {
        console.error(
          `Failed to handle swim/dead: ${error?.message || "Unknown error"}`,
        );

        res.status(500).end();
      }
    });
  }

  static timer: NodeJS.Timeout | null = null;

  public static start_swim(app: Express, options: SwimOptions) {
    const swim = new Swim(options);
    swim.register_handlers(app);

    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(async () => {
      try {
        await swim.drive();
      } catch (error: any) {
        console.error(
          `Failed to drive swim: ${error?.message || "Unknown error"}`,
        );
      }
    }, options.interval);

    return swim;
  }
}
