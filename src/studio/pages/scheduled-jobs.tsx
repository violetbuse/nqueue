import { DashboardLayout } from "../layouts/dashboard";

export const ScheduledJobsPage = () => {
  return (
    <DashboardLayout pageTitle="Scheduled Jobs">
      <div>Scheduled Jobs</div>
    </DashboardLayout>
  );
};

type ScheduledJobsPerIdPageProps = {
  scheduled_id: string;
};

export const ScheduledJobsPerIdPage: React.FC<ScheduledJobsPerIdPageProps> = ({
  scheduled_id,
}) => {
  return (
    <DashboardLayout pageTitle="Specific Scheduled Job">
      <div>Scheduled Job {scheduled_id}</div>
    </DashboardLayout>
  );
};
