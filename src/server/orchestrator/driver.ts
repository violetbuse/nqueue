import { RPCHandler } from "@orpc/server/node";
import type { Express } from "express";
import { orchestrator_contract } from "./contract";
import { StandardHandlerPlugin } from "@orpc/server/standard";

export abstract class OrchestratorDriver {
  constructor() {}

  abstract implement_routes(
    contract: typeof orchestrator_contract,
    plugins: StandardHandlerPlugin<{}>[],
  ): RPCHandler<{}>;

  private register_routes(app: Express) {
    const router = this.implement_routes(orchestrator_contract, []);
    app.use("/orchestrator*", async (req, res, next) => {
      const { matched } = await router.handle(req, res, {
        prefix: "/orchestrator",
        context: {},
      });

      if (matched) {
        return;
      }

      next();
    });
  }

  async start(app: Express) {
    this.register_routes(app);
  }
}
