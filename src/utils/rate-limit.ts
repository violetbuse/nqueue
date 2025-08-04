type RateLimit = {
  requests_per_period: number;
  period_in_seconds: number;
};

export const compute_next_invocation_at = (
  rateLimit: RateLimit,
  invocations: Date[],
  now: Date,
): Date => {
  const latest_invocation = invocations[invocations.length - 1];

  if (
    !latest_invocation ||
    invocations.length < rateLimit.requests_per_period
  ) {
    return now;
  }

  const requests_in_period = invocations.filter(
    (invocation) =>
      invocation >=
      new Date(now.getTime() - rateLimit.period_in_seconds * 1000),
  );

  if (requests_in_period.length < rateLimit.requests_per_period) {
    return now;
  }

  const first_invocation_in_period = requests_in_period[0];

  if (!first_invocation_in_period) {
    return now;
  }

  const next_invocation_at = new Date(
    first_invocation_in_period.getTime() + rateLimit.period_in_seconds * 1000,
  );

  return next_invocation_at;
};
