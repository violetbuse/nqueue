import fetch from "node-fetch";
import * as z from "zod";
import type { Express } from "express";

const address_schema = z.url().min(1);

type Address = z.infer<typeof address_schema>;

const node_schema = z.object({
  version: z.number().min(1),
  address: address_schema,
  suspect: z.boolean(),
  tags: z.array(z.string()),
});

type Node = z.infer<typeof node_schema>;

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
      suspect: false,
      tags,
    };

    this.nodes =
      nodes?.map((address) => ({
        version: 1,
        address,
        suspect: false,
        tags: [],
      })) || [];
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
      suspect: true,
    });

    try {
      const notification: SusNotification = {
        node,
      };

      const random_not_sus_nodes = this.nodes
        .filter((n) => !n.suspect)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const responses = await Promise.all(
        random_not_sus_nodes.map(async (tester) => {
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
        await this.remove_node(node);
      }
    } catch (error: any) {
      console.error(
        `Failed to mark node ${node.address} as suspect: ${error?.message || "Unknown error"}`,
      );
    }
  }

  private async mark_as_alive(node: Node) {
    this.edit_node({
      ...node,
      suspect: false,
    });
  }

  private async remove_node(node: Node) {
    this.nodes = this.nodes.filter((n) => n.address !== node.address);
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

  public async drive() {
    const nodes_randomly_sorted = this.nodes.sort(() => Math.random() - 0.5);
    const first_five_nodes = nodes_randomly_sorted.slice(0, 5);

    await Promise.all(first_five_nodes.map((node) => this.ping(node)));
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
  }
}
