import { useQuery } from "@tanstack/react-query";
import { studio } from "../lib/orpc";

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
  const { data: scheduled_jobs, error } = useQuery(
    studio.scheduled.list.queryOptions({
      input: { cron_id, queue_id, message_id, limit: 5 },
    })
  );

  return (
    <div>
      <div className="flex flex-col gap-2">
        {scheduled_jobs &&
          scheduled_jobs.map((job) => (
            <ScheduledJobCard key={job.id} scheduled_id={job.id} />
          ))}
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

  return (
    <div>
      {scheduled_job && scheduled_job.response && scheduled_job.response.error}
      {error && <div className="text-red-500">{error.message}</div>}
      {!scheduled_job && !error && <div>Loading...</div>}
    </div>
  );
};
