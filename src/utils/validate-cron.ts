import { CronExpression, CronExpressionParser } from "cron-parser";

export const validate_cron_expression = (
  expression: string,
): [false, string] | [true, CronExpression] => {
  try {
    if (expression.split(" ").length !== 5) {
      throw new Error("Invalid cron expression");
    }

    const cron_parsed = CronExpressionParser.parse(expression, {
      strict: true,
    });

    return [true, cron_parsed];
  } catch (error: any) {
    return [false, error.message ?? "Unknown error"];
  }
};
