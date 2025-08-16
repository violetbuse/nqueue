import { Route, Switch } from "wouter";
import { MessagesPage, MessagesPerIdPage } from "./pages/messages";
import { HomePage } from "./pages/home";
import { QueuesPage, QueuesPerIdPage } from "./pages/queues";
import { CronJobsPage, CronJobsPerIdPage } from "./pages/cron-jobs";
import {
  ScheduledJobsPage,
  ScheduledJobsPerIdPage,
} from "./pages/scheduled-jobs";
import { NotFoundPage } from "./pages/not-found";

export const App: React.FC = () => {
  return (
    <>
      <Switch>
        <Route path="/">
          <HomePage />
        </Route>
        <Route path="/messages">
          <MessagesPage />
        </Route>
        <Route path="/messages/:message_id">
          {({ message_id }) => <MessagesPerIdPage message_id={message_id} />}
        </Route>
        <Route path="/queues">
          <QueuesPage />
        </Route>
        <Route path="/queues/:queue_id">
          {({ queue_id }) => <QueuesPerIdPage queue_id={queue_id} />}
        </Route>
        <Route path="/crons">
          <CronJobsPage />
        </Route>
        <Route path="/crons/:cron_id">
          {({ cron_id }) => <CronJobsPerIdPage cron_id={cron_id} />}
        </Route>
        <Route path="/scheduled-jobs">
          <ScheduledJobsPage />
        </Route>
        <Route path="/scheduled-jobs/:scheduled_id">
          {({ scheduled_id }) => (
            <ScheduledJobsPerIdPage scheduled_id={scheduled_id} />
          )}
        </Route>
        <Route>
          <NotFoundPage />
        </Route>
      </Switch>
    </>
  );
};
