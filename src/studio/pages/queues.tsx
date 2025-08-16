import { DashboardLayout } from "../layouts/dashboard";

export const QueuesPage = () => {
  return (
    <DashboardLayout pageTitle="Queues">
      <div>Queues</div>
    </DashboardLayout>
  );
};

type QueuesPerIdPageProps = {
  queue_id: string;
};

export const QueuesPerIdPage: React.FC<QueuesPerIdPageProps> = ({
  queue_id,
}) => {
  return (
    <DashboardLayout pageTitle="Specific Queue">
      <div>Queue {queue_id}</div>
    </DashboardLayout>
  );
};
