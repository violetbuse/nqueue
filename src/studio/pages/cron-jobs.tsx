import React from "react";
import { DashboardLayout } from "../layouts/dashboard";
import { NewCronForm } from "../components/forms/cron";
import { useQuery } from "@tanstack/react-query";
import { studio } from "../lib/orpc";

export const CronJobsPage = () => {
  const jobs = useQuery(studio.cron.list.queryOptions({}));

  console.log(jobs.data);

  return (
    <DashboardLayout pageTitle="Cron Jobs">
      <div>Cron Jobs</div>
      <NewCronForm />
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
