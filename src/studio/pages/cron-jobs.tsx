import React from "react";
import { DashboardLayout } from "../layouts/dashboard";

export const CronJobsPage = () => {
  return (
    <DashboardLayout pageTitle="Cron Jobs">
      <div>Cron Jobs</div>
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
