import CronExpressionParser from "cron-parser";

export const validateCronExpression = (expression: string): boolean => {
  try {
    if (expression.split(" ").length !== 5) {
      throw new Error("Invalid cron expression");
    }

    CronExpressionParser.parse(expression, { strict: true });

    return true;
  } catch (error: any) {
    return false;
  }
};
