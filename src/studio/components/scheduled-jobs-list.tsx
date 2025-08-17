import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { studio } from "../lib/orpc";
import { useMemo } from "react";
import { Button } from "./ui/button";

type ScheduledJobsListProps = {
  cron_id?: string;
  queue_id?: string;
  message_id?: string;
};

export const ScheduledJobsList: React.FC<ScheduledJobsListProps> = ({
  cron_id,
  queue_id,
  message_id,
}) => {
  const amount_per_page = 5;

  const {
    data: scheduled_jobs,
    error,
    hasNextPage,
    fetchNextPage,
    hasPreviousPage,
    fetchPreviousPage,
  } = useInfiniteQuery(
    studio.scheduled.list.infiniteOptions({
      input: (pageParam: number | undefined) => ({
        cron_id,
        queue_id,
        message_id,
        limit: amount_per_page,
        offset: pageParam ? pageParam * amount_per_page : 0,
      }),
      initialPageParam: 0,
      getNextPageParam: ({ limit, offset, total }): number | undefined => {
        if (offset >= total) return undefined;
        return offset / limit + 1;
      },
      getPreviousPageParam: ({ limit, offset }): number | undefined => {
        if (offset === 0) return undefined;
        return offset / limit - 1;
      },
      refetchInterval: 10000,
    })
  );

  const items = useMemo(() => {
    if (!scheduled_jobs) return [];
    const seen = new Set<string>();

    return scheduled_jobs.pages
      .flatMap((page) => page.items)
      .filter(({ id }) => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  }, [scheduled_jobs]);

  return (
    <div>
      <div className="flex flex-col gap-2">
        {scheduled_jobs && (
          <>
            {hasPreviousPage && (
              <Button
                onClick={() => fetchPreviousPage({ cancelRefetch: false })}
                className="w-full"
              >
                Load Previous
              </Button>
            )}
            {items.map((job) => (
              <ScheduledJobCard key={job.id} scheduled_id={job.id} />
            ))}
            {hasNextPage && (
              <Button
                onClick={() => fetchNextPage({ cancelRefetch: false })}
                className="w-full"
              >
                Load More
              </Button>
            )}
          </>
        )}
      </div>
      {error && <div className="text-red-500">{error.message}</div>}
      {!scheduled_jobs && !error && <div>Loading...</div>}
    </div>
  );
};

type ScheduledJobCardProps = {
  scheduled_id: string;
};

export const ScheduledJobCard: React.FC<ScheduledJobCardProps> = ({
  scheduled_id,
}) => {
  const { data: scheduled_job, error } = useQuery(
    studio.scheduled.get.queryOptions({ input: { job_id: scheduled_id } })
  );

  const planned_date = useMemo(() => {
    if (!scheduled_job?.planned_at) return null;
    const date = new Date(scheduled_job.planned_at * 1000);

    const d_format =
      [
        date.getHours().toString().padStart(2, "0"),
        date.getMinutes().toString().padStart(2, "0"),
        date.getSeconds().toString().padStart(2, "0"),
      ].join(":") +
      " " +
      [
        date.getFullYear(),
        (date.getMonth() + 1).toString().padStart(2, "0"),
        date.getDate().toString().padStart(2, "0"),
      ].join("-");

    return d_format;
  }, [scheduled_job?.planned_at]);

  return (
    <div>
      {scheduled_job && (
        <>
          <div>Planned at: {planned_date}</div>
        </>
      )}
      {error && <h1 className="text-red-500">{error.message}</h1>}
      {!scheduled_job && !error && <div>Loading...</div>}
    </div>
  );
};
