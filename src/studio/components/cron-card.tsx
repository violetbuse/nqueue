import { useQuery } from "@tanstack/react-query";
import { studio } from "../lib/orpc";
import { Link } from "wouter";

type CronCardProps = {
  cron_id: string;
};

export const CronJobCard: React.FC<CronCardProps> = ({ cron_id }) => {
  const { data: cron } = useQuery(
    studio.cron.get.queryOptions({
      input: { cron_id },
    })
  );

  return (
    <Link href={`/crons/${cron_id}`}>
      <div className="w-full bg-card hover:bg-primary p-2 rounded-md">
        {cron ? `${cron.id} | ${cron.expression}` : "Loading..."}
      </div>
    </Link>
  );
};
