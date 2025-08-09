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
    const [cronTotal, setCronTotal] = useState<number>(0);
    const [cronLimit, setCronLimit] = useState<number>(50);
    const [cronOffset, setCronOffset] = useState<number>(0);
    const [focusedCron, setFocusedCron] = useState<CronJob | null>(null);

    const refreshList = useCallback(async () => {
        const res = await api.list_cron_jobs({ limit: cronLimit, offset: cronOffset });
        setCronList((res as any).items);
        setCronTotal((res as any).total);
        setCronLimit((res as any).limit);
        setCronOffset((res as any).offset);
        setCronIndex((idx) => (((res as any).items.length === 0) ? 0 : Math.max(0, Math.min(idx, (res as any).items.length - 1))));
    }, [api, cronLimit, cronOffset]);

    const openDetails = useCallback(
        async (cronId: string) => {
            const cron = await api.get_cron_job({ cron_id: cronId });
            setFocusedCron((cron ?? null) as any);
            return cron;
        },
        [api],
    );

    const nextPage = useCallback(() => setCronOffset((o) => o + cronLimit), [cronLimit]);
    const prevPage = useCallback(() => setCronOffset((o) => Math.max(0, o - cronLimit)), [cronLimit]);

    return { cronList, cronIndex, setCronIndex, focusedCron, setFocusedCron, refreshList, openDetails, cronTotal, cronLimit, cronOffset, nextPage, prevPage };
};

export const useMessages = (api: ApiClient) => {
    const [messageList, setMessageList] = useState<Message[]>([]);
    const [messageIndex, setMessageIndex] = useState<number>(0);
    const [messageTotal, setMessageTotal] = useState<number>(0);
    const [messageLimit, setMessageLimit] = useState<number>(50);
    const [messageOffset, setMessageOffset] = useState<number>(0);
    const [focusedMessage, setFocusedMessage] = useState<Message | null>(null);

    const refreshList = useCallback(async () => {
        const res = await api.list_messages({ limit: messageLimit, offset: messageOffset });
        setMessageList((res as any).items);
        setMessageTotal((res as any).total);
        setMessageLimit((res as any).limit);
        setMessageOffset((res as any).offset);
        setMessageIndex((idx) => (((res as any).items.length === 0) ? 0 : Math.max(0, Math.min(idx, (res as any).items.length - 1))));
    }, [api, messageLimit, messageOffset]);

    const openDetails = useCallback(
        async (messageId: string) => {
            const message = await api.get_message({ message_id: messageId });
            setFocusedMessage((message ?? null) as any);
            return message;
        },
        [api],
    );

    const nextPage = useCallback(() => setMessageOffset((o) => o + messageLimit), [messageLimit]);
    const prevPage = useCallback(() => setMessageOffset((o) => Math.max(0, o - messageLimit)), [messageLimit]);

    return { messageList, messageIndex, setMessageIndex, focusedMessage, setFocusedMessage, refreshList, openDetails, messageTotal, messageLimit, messageOffset, nextPage, prevPage };
};

export const useQueues = (api: ApiClient) => {
    const [queueList, setQueueList] = useState<Queue[]>([]);
    const [queueIndex, setQueueIndex] = useState<number>(0);
    const [queueTotal, setQueueTotal] = useState<number>(0);
    const [queueLimit, setQueueLimit] = useState<number>(50);
    const [queueOffset, setQueueOffset] = useState<number>(0);
    const [focusedQueue, setFocusedQueue] = useState<Queue | null>(null);

    const refreshList = useCallback(async () => {
        const res = await api.list_queues({ limit: queueLimit, offset: queueOffset });
        setQueueList((res as any).items);
        setQueueTotal((res as any).total);
        setQueueLimit((res as any).limit);
        setQueueOffset((res as any).offset);
        setQueueIndex((idx) => (((res as any).items.length === 0) ? 0 : Math.max(0, Math.min(idx, (res as any).items.length - 1))));
    }, [api, queueLimit, queueOffset]);

    const openDetails = useCallback(
        async (queueId: string) => {
            const queue = await api.get_queue({ queue_id: queueId });
            setFocusedQueue((queue ?? null) as any);
            return queue;
        },
        [api],
    );

    const nextPage = useCallback(() => setQueueOffset((o) => o + queueLimit), [queueLimit]);
    const prevPage = useCallback(() => setQueueOffset((o) => Math.max(0, o - queueLimit)), [queueLimit]);

    return { queueList, queueIndex, setQueueIndex, focusedQueue, setFocusedQueue, refreshList, openDetails, queueTotal, queueLimit, queueOffset, nextPage, prevPage };
};


