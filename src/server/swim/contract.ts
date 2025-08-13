import { oc } from "@orpc/contract";
import { z } from "zod";

export const node_state = z.enum(["alive", "suspicious", "dead"]);
export const node_tag = z.enum(["api", "orchestrator", "scheduler", "runner"]);

export type NodeState = z.infer<typeof node_state>;
export type NodeTag = z.infer<typeof node_tag>;

const node_schema = z.object({
  node_id: z.string(),
  node_address: z.string(),
  node_state: node_state,
  node_tags: z.array(node_tag),
  data_version: z.number().min(0).int(),
});

export type Node = z.infer<typeof node_schema>;

const request_ping_test = oc
  .route({ method: "POST", path: "/swim/request-test/{node_id}" })
  .input(z.object({ node_id: z.string() }))
  .output(
    z.discriminatedUnion("success", [
      z.object({ success: z.literal(false) }),
      z.object({ success: z.literal(true), node_data: node_schema }),
    ])
  );

const ping_node = oc
  .route({ method: "POST", path: "/swim/ping" })
  .input(
    z.object({
      self: node_schema,
      random_nodes: z.array(node_schema),
    })
  )
  .output(
    z.object({
      self: node_schema,
      you: node_schema.nullable(),
      random_nodes: z.array(node_schema),
    })
  );

const get_nodes = oc
  .route({ method: "GET", path: "/swim/nodes" })
  .input(
    z.object({
      restrict_alive: z.boolean().default(true),
    })
  )
  .output(z.array(node_schema));

const get_node = oc
  .route({ method: "GET", path: "/swim/nodes/{node_id}" })
  .input(
    z.object({
      node_id: z.string(),
    })
  )
  .output(node_schema.nullable());

const get_node_of_tag = oc
  .route({ method: "GET", path: "/swim/tags/{tag}/one" })
  .input(
    z.object({
      tag: node_tag,
      restrict_alive: z.boolean().default(true),
    })
  )
  .output(node_schema.nullable());

const get_nodes_of_tag = oc
  .route({ method: "GET", path: "/swim/tags/{tag}" })
  .input(
    z.object({
      tag: node_tag,
      restrict_alive: z.boolean().default(true),
    })
  );

const get_tagged_count = oc
  .route({ method: "GET", path: "/swim/tags/{tag}/count" })
  .input(
    z.object({
      tag: node_tag,
      restrict_alive: z.boolean().default(true),
    })
  )
  .output(z.number().int().min(0));

const get_self = oc
  .route({ method: "GET", path: "/swim/self" })
  .output(node_schema);

export const swim_contract = {
  request_ping_test,
  ping_node,
  get_nodes,
  get_node,
  get_node_of_tag,
  get_nodes_of_tag,
  get_tagged_count,
  get_self,
};
