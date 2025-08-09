import { useCallback, useState } from "react";
import type { ContractRouterClient } from "@orpc/contract";
import type { CronJob, Message, Queue, ScheduledJob } from "./types";
import { api_contract } from "@/server/api/contract";

export type ApiClient = ContractRouterClient<typeof api_contract>;

export const useScheduledJobs = (api: ApiClient) => {
    const [jobs, setJobs] = useState<ScheduledJob[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [focusedJob, setFocusedJob] = useState<ScheduledJob | null>(null);

    const refresh = useCallback(async () => {
        const data = await api.get_scheduled_jobs({});
        setJobs(data as any);
        setSelectedIndex((idx) => (data.length === 0 ? 0 : Math.max(0, Math.min(idx, data.length - 1))));
    }, [api]);

    const openDetails = useCallback(
        async (jobId: string) => {
            const job = await api.get_scheduled_job({ job_id: jobId });
            setFocusedJob((job ?? null) as any);
            return job;
        },
        [api],
    );

    return { jobs, selectedIndex, setSelectedIndex, focusedJob, setFocusedJob, refresh, openDetails };
};

export const useCronJobs = (api: ApiClient) => {
    const [cronList, setCronList] = useState<CronJob[]>([]);
    const [cronIndex, setCronIndex] = useState<number>(0);
    const [focusedCron, setFocusedCron] = useState<CronJob | null>(null);

    const refreshList = useCallback(async () => {
        const items = await api.list_cron_jobs({});
        setCronList(items as any);
        setCronIndex((idx) => (items.length === 0 ? 0 : Math.max(0, Math.min(idx, items.length - 1))));
    }, [api]);

    const openDetails = useCallback(
        async (cronId: string) => {
            const cron = await api.get_cron_job({ cron_id: cronId });
            setFocusedCron((cron ?? null) as any);
            return cron;
        },
        [api],
    );

    return { cronList, cronIndex, setCronIndex, focusedCron, setFocusedCron, refreshList, openDetails };
};

export const useMessages = (api: ApiClient) => {
    const [messageList, setMessageList] = useState<Message[]>([]);
    const [messageIndex, setMessageIndex] = useState<number>(0);
    const [focusedMessage, setFocusedMessage] = useState<Message | null>(null);

    const refreshList = useCallback(async () => {
        const items = await api.list_messages({});
        setMessageList(items as any);
        setMessageIndex((idx) => (items.length === 0 ? 0 : Math.max(0, Math.min(idx, items.length - 1))));
    }, [api]);

    const openDetails = useCallback(
        async (messageId: string) => {
            const message = await api.get_message({ message_id: messageId });
            setFocusedMessage((message ?? null) as any);
            return message;
        },
        [api],
    );

    return { messageList, messageIndex, setMessageIndex, focusedMessage, setFocusedMessage, refreshList, openDetails };
};

export const useQueues = (api: ApiClient) => {
    const [queueList, setQueueList] = useState<Queue[]>([]);
    const [queueIndex, setQueueIndex] = useState<number>(0);
    const [focusedQueue, setFocusedQueue] = useState<Queue | null>(null);

    const refreshList = useCallback(async () => {
        const items = await api.list_queues({});
        setQueueList(items as any);
        setQueueIndex((idx) => (items.length === 0 ? 0 : Math.max(0, Math.min(idx, items.length - 1))));
    }, [api]);

    const openDetails = useCallback(
        async (queueId: string) => {
            const queue = await api.get_queue({ queue_id: queueId });
            setFocusedQueue((queue ?? null) as any);
            return queue;
        },
        [api],
    );

    return { queueList, queueIndex, setQueueIndex, focusedQueue, setFocusedQueue, refreshList, openDetails };
};


