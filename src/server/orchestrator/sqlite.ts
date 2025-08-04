import { RPCHandler } from "@orpc/server/node";
import { StandardHandlerPlugin } from "@orpc/server/standard";
import { SqliteDB } from "../db";
import { orchestrator_contract } from "./contract";
import { OrchestratorDriver } from "./driver";
import { implement } from "@orpc/server";

export class SqliteOrchestrator extends OrchestratorDriver {
  constructor(private db: SqliteDB) {
    super();
  }

  override implement_routes(
    contract: typeof orchestrator_contract,
    plugins: StandardHandlerPlugin<{}>[],
  ): RPCHandler<{}> {
    const os = implement(contract);

    const request_job_assignments = os.request_job_assignments.handler(
      ({ input }) => {},
    );

    const reject_job_assignment = os.reject_job_assignment.handler(
      ({ input }) => {},
    );

    const submit_job_result = os.submit_job_result.handler(({ input }) => {});

    const submit_job_results = os.submit_job_results.handler(({ input }) => {});

    const router = os.router({
      request_job_assignments,
      reject_job_assignment,
      submit_job_result,
      submit_job_results,
    });

    return new RPCHandler(router, {
      plugins,
    });
  }
}
