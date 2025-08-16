import React from "react";
import { DashboardLayout } from "../layouts/dashboard";
import { useQuery } from "@tanstack/react-query";
import { studio } from "../lib/orpc";
import { CreateCronButton } from "../components/create-cron-button";
import { CronJobCard } from "../components/cron-card";

export const CronJobsPage = () => {
  const { data: cron_jobs, error } = useQuery(
    studio.cron.list.queryOptions({})
  );

  return (
    <DashboardLayout pageTitle="Cron Jobs">
      <div>Cron Jobs</div>
      <CreateCronButton />
      {cron_jobs && (
        <div className="flex flex-col gap-2 mt-2">
          {cron_jobs.items.map((job) => (
            <CronJobCard cron_id={job.id} key={job.id} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

type CronJobsPerIdPageProps = {
  cron_id: string;
};

export const CronJobsPerIdPage: React.FC<CronJobsPerIdPageProps> = ({
  cron_id,
}) => {
  return (
    <DashboardLayout pageTitle="Specific Cron Job">
      <div>Cron Job {cron_id}</div>
    </DashboardLayout>
  );
};
