import React from "react";
import { DashboardLayout } from "../layouts/dashboard";

export const MessagesPage = () => {
  return (
    <DashboardLayout pageTitle="Messages">
      <div>Messages</div>
    </DashboardLayout>
  );
};

type MessagesPerIdPageProps = {
  message_id: string;
};

export const MessagesPerIdPage: React.FC<MessagesPerIdPageProps> = ({
  message_id,
}) => {
  return (
    <DashboardLayout pageTitle="Specific Message">
      <div>Message {message_id}</div>
    </DashboardLayout>
  );
};
