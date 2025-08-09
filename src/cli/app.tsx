import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, render, useInput } from "ink";
import { create_api_client } from "@/server/api/client";
import { Tabs, ScheduledJobDetails, ScheduledJobsList, CronList, CronDetails, MessagesList, MessageDetails, QueuesList, QueueDetails, Heading as HeaderComp, PromptBar as PromptBarComp, CreateMessageForm, CreateCronForm, CreateQueueForm } from "@/cli/components";
import type { AppProps, CronJob, Message, Queue, ScheduledJob, TabKey, PromptMode } from "@/cli/components";


const App: React.FC<AppProps> = ({ address = "http://localhost:1337" }) => {
  const api = useMemo(() => create_api_client(address), [address]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("scheduled");
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [focusedJob, setFocusedJob] = useState<ScheduledJob | null>(null);
  const [focusedMessage, setFocusedMessage] = useState<Message | null>(null);
  const [focusedCron, setFocusedCron] = useState<CronJob | null>(null);
  const [focusedQueue, setFocusedQueue] = useState<Queue | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [prompt, setPrompt] = useState<PromptMode>({ kind: "none" });
  const [showCreateMessage, setShowCreateMessage] = useState<boolean>(false);
  const [showCreateCron, setShowCreateCron] = useState<boolean>(false);
  const [showCreateQueue, setShowCreateQueue] = useState<boolean>(false);

  const refreshScheduled = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get_scheduled_jobs({});
      setJobs(data as any);
      setSelectedIndex((idx) => {
        if (data.length === 0) return 0;
        return Math.max(0, Math.min(idx, data.length - 1));
      });
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch scheduled jobs");
    } finally {
      setLoading(false);
    }
  };

  const openJobDetails = async (jobId: string) => {
    try {
      setError(null);
      const job = await api.get_scheduled_job({ job_id: jobId });
      if (job) {
        setFocusedJob(job as any);
      } else {
        setFocusedJob(null);
        setError(`Job not found: ${jobId}`);
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch job details");
    }
  };

  const openMessageDetails = async (messageId: string) => {
    try {
      setError(null);
      const message = await api.get_message({ message_id: messageId });
      if (message) {
        setFocusedMessage(message as any);
      } else {
        setFocusedMessage(null);
        setError(`Message not found: ${messageId}`);
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch message details");
    }
  };

  const openCronDetails = async (cronId: string) => {
    try {
      setError(null);
      const cron = await api.get_cron_job({ cron_id: cronId });
      if (cron) {
        setFocusedCron(cron as any);
      } else {
        setFocusedCron(null);
        setError(`Cron job not found: ${cronId}`);
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch cron job details");
    }
  };

  const openQueueDetails = async (queueId: string) => {
    try {
      setError(null);
      const queue = await api.get_queue({ queue_id: queueId });
      if (queue) {
        setFocusedQueue(queue as any);
      } else {
        setFocusedQueue(null);
        setError(`Queue not found: ${queueId}`);
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch queue details");
    }
  };

  // Deprecated per list views; kept pattern for clarity

  const [cronList, setCronList] = useState<CronJob[]>([]);
  const [cronIndex, setCronIndex] = useState<number>(0);
  const [cronTotal, setCronTotal] = useState<number>(0);
  const [cronLimit, setCronLimit] = useState<number>(50);
  const [cronOffset, setCronOffset] = useState<number>(0);
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [messageIndex, setMessageIndex] = useState<number>(0);
  const [messageTotal, setMessageTotal] = useState<number>(0);
  const [messageLimit, setMessageLimit] = useState<number>(50);
  const [messageOffset, setMessageOffset] = useState<number>(0);
  const [queueList, setQueueList] = useState<Queue[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [queueTotal, setQueueTotal] = useState<number>(0);
  const [queueLimit, setQueueLimit] = useState<number>(50);
  const [queueOffset, setQueueOffset] = useState<number>(0);

  const fetchCronList = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.list_cron_jobs({ limit: cronLimit, offset: cronOffset });
      const items = (res as any).items as CronJob[];
      setCronList(items);
      setCronTotal((res as any).total);
      setCronLimit((res as any).limit);
      setCronOffset((res as any).offset);
      setCronIndex((idx) => (items.length === 0 ? 0 : Math.max(0, Math.min(idx, items.length - 1))));
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch cron jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageList = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.list_messages({ limit: messageLimit, offset: messageOffset });
      const items = (res as any).items as Message[];
      setMessageList(items);
      setMessageTotal((res as any).total);
      setMessageLimit((res as any).limit);
      setMessageOffset((res as any).offset);
      setMessageIndex((idx) => (items.length === 0 ? 0 : Math.max(0, Math.min(idx, items.length - 1))));
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueList = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.list_queues({ limit: queueLimit, offset: queueOffset });
      const items = (res as any).items as Queue[];
      setQueueList(items);
      setQueueTotal((res as any).total);
      setQueueLimit((res as any).limit);
      setQueueOffset((res as any).offset);
      setQueueIndex((idx) => (items.length === 0 ? 0 : Math.max(0, Math.min(idx, items.length - 1))));
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err?.message ?? "Failed to fetch queues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    void refreshScheduled();
    void fetchCronList();
    void fetchMessageList();
    void fetchQueueList();
  }, []);

  useInput((input, key) => {
    // When in prompt mode, capture raw input
    if (showCreateMessage || showCreateCron || showCreateQueue) {
      return;
    }
    if (prompt.kind !== "none") {
      if (key.return) {
        const buffer = prompt.buffer.trim();
        if (prompt.kind === "createMessage") {
          if (buffer.length > 0) {
            (async () => {
              try {
                setError(null);
                await api.create_message({
                  url: buffer,
                  method: "GET",
                  headers: {},
                  body: null,
                  timeout_ms: 1000,
                  scheduling: { wait_seconds: 30 },
                } as any);
              } catch (err: any) {
                setError(err?.message ?? "Failed to create message");
              } finally {
                setPrompt({ kind: "none" });
                if (activeTab === "scheduled") {
                  void refreshScheduled();
                }
              }
            })();
          } else {
            setPrompt({ kind: "none" });
          }
        } else if (prompt.kind === "getJob") {
          if (buffer.length > 0) {
            void openJobDetails(buffer);
          }
          setPrompt({ kind: "none" });
        } else if (prompt.kind === "getMessage") {
          if (buffer.length > 0) {
            void openMessageDetails(buffer);
          }
          setPrompt({ kind: "none" });
        } else if (prompt.kind === "getCron") {
          if (buffer.length > 0) {
            void openCronDetails(buffer);
          }
          setPrompt({ kind: "none" });
        } else if (prompt.kind === "getQueue") {
          if (buffer.length > 0) {
            void openQueueDetails(buffer);
          }
          setPrompt({ kind: "none" });
        }
        return;
      }
      if (key.escape) {
        setPrompt({ kind: "none" });
        return;
      }
      if (key.backspace || key.delete) {
        setPrompt({
          ...prompt,
          buffer: prompt.buffer.slice(0, Math.max(0, prompt.buffer.length - 1)),
        });
        return;
      }
      // Regular character input
      if (input) {
        setPrompt({ ...prompt, buffer: prompt.buffer + input });
      }
      return;
    }

    // Global navigation
    const order: TabKey[] = ["cron", "messages", "scheduled", "queues"];
    if (key.leftArrow) {
      setActiveTab((t) => {
        const i = order.indexOf(t);
        const next = order[(i - 1 + order.length) % order.length];
        return (next ?? "scheduled") as TabKey;
      });
      return;
    }
    if (key.rightArrow) {
      setActiveTab((t) => {
        const i = order.indexOf(t);
        const next = order[(i + 1) % order.length];
        return (next ?? "scheduled") as TabKey;
      });
      return;
    }
    if (input === "1") {
      setActiveTab("cron");
      return;
    }
    if (input === "2") {
      setActiveTab("messages");
      return;
    }
    if (input === "3") {
      setActiveTab("scheduled");
      return;
    }
    if (input === "4") {
      setActiveTab("queues");
      return;
    }

    if (activeTab === "scheduled" && key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (activeTab === "scheduled" && key.downArrow) {
      setSelectedIndex((i) => Math.min(Math.max(0, jobs.length - 1), i + 1));
      return;
    }
    if (activeTab === "cron" && key.upArrow) {
      setCronIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (activeTab === "cron" && key.downArrow) {
      setCronIndex((i) => Math.min(Math.max(0, cronList.length - 1), i + 1));
      return;
    }
    if (activeTab === "cron" && input === "[") {
      setCronOffset((o) => Math.max(0, o - cronLimit));
      void fetchCronList();
      return;
    }
    if (activeTab === "cron" && input === "]") {
      setCronOffset((o) => o + cronLimit);
      void fetchCronList();
      return;
    }
    if (activeTab === "messages" && key.upArrow) {
      setMessageIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (activeTab === "messages" && key.downArrow) {
      setMessageIndex((i) => Math.min(Math.max(0, messageList.length - 1), i + 1));
      return;
    }
    if (activeTab === "messages" && input === "[") {
      setMessageOffset((o) => Math.max(0, o - messageLimit));
      void fetchMessageList();
      return;
    }
    if (activeTab === "messages" && input === "]") {
      setMessageOffset((o) => o + messageLimit);
      void fetchMessageList();
      return;
    }
    if (activeTab === "queues" && key.upArrow) {
      setQueueIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (activeTab === "queues" && key.downArrow) {
      setQueueIndex((i) => Math.min(Math.max(0, queueList.length - 1), i + 1));
      return;
    }
    if (activeTab === "queues" && input === "[") {
      setQueueOffset((o) => Math.max(0, o - queueLimit));
      void fetchQueueList();
      return;
    }
    if (activeTab === "queues" && input === "]") {
      setQueueOffset((o) => o + queueLimit);
      void fetchQueueList();
      return;
    }
    if (activeTab === "scheduled" && key.return) {
      const job = jobs[selectedIndex];
      if (job) void openJobDetails(job.id);
      return;
    }
    if (input === "r" || (key.ctrl && input.toLowerCase() === "r")) {
      if (activeTab === "scheduled") void refreshScheduled();
      else if (activeTab === "messages") void fetchMessageList();
      else if (activeTab === "cron") void fetchCronList();
      else if (activeTab === "queues") void fetchQueueList();
      return;
    }
    if (input === "q") {
      // Let Ink exit by throwing an unhandled promise rejection is not ideal; rely on parent to exit.
      // Users can Ctrl+C to quit; still provide hint in UI.
      return;
    }
    // Context-specific actions
    if (activeTab === "messages") {
      if (input === "n" || input === "m") {
        setShowCreateMessage(true);
        return;
      }
      if (input === "o" || input === "g") {
        setPrompt({ kind: "getMessage", buffer: "" });
        return;
      }
      if (key.return) {
        const item = messageList[messageIndex];
        if (item) void openMessageDetails(item.id);
        return;
      }
    } else if (activeTab === "scheduled") {
      if (input === "g") {
        setPrompt({ kind: "getJob", buffer: "" });
        return;
      }
    } else if (activeTab === "cron") {
      if (input === "o" || input === "g") {
        setPrompt({ kind: "getCron", buffer: "" });
        return;
      }
      if (input === "n" || input === "c") {
        setShowCreateCron(true);
        return;
      }
      if (key.return) {
        const item = cronList[cronIndex];
        if (item) void openCronDetails(item.id);
        return;
      }
    } else if (activeTab === "queues") {
      if (input === "o" || input === "g") {
        setPrompt({ kind: "getQueue", buffer: "" });
        return;
      }
      if (input === "n" || input === "q") {
        setShowCreateQueue(true);
        return;
      }
      if (key.return) {
        const item = queueList[queueIndex];
        if (item) void openQueueDetails(item.id);
        return;
      }
    }
  });

  const Header = (
    <HeaderComp address={address} loading={loading} error={error} lastRefresh={lastRefresh} />
  );

  // Lists and detail components for tabs moved to components/*

  return (
    <Box flexDirection="column">
      {Header}
      <Tabs activeTab={activeTab} />
      {activeTab === "scheduled" ? (
        <>
          <Box>
            <ScheduledJobsList jobs={jobs} selectedIndex={selectedIndex} />
          </Box>
          {focusedJob ? <ScheduledJobDetails job={focusedJob} /> : null}
          <Box marginTop={1}>
            <Text dimColor>
              Keys: 1/2/3/4 switch tabs • ←/→ cycle tabs • ↑/↓ select • Enter details • r refresh • g open job • Ctrl+C to exit
            </Text>
          </Box>
        </>
      ) : null}

      {activeTab === "messages" ? (
        <>
          <Box>
            <MessagesList items={messageList} selectedIndex={messageIndex} total={messageTotal} limit={messageLimit} offset={messageOffset} />
          </Box>
          {focusedMessage ? <MessageDetails message={focusedMessage} /> : null}
          <Box marginTop={1}>
            <Text dimColor>Keys: 1/2/3/4 switch tabs • ↑/↓ select • Enter details • n create • o open by id • r refresh • [/ ] page • Ctrl+C to exit</Text>
          </Box>
        </>
      ) : null}

      {activeTab === "cron" ? (
        <>
          <Box>
            <CronList items={cronList} selectedIndex={cronIndex} total={cronTotal} limit={cronLimit} offset={cronOffset} />
          </Box>
          {focusedCron ? <CronDetails cron={focusedCron} /> : null}
          <Box marginTop={1}>
            <Text dimColor>Keys: 1/2/3/4 switch tabs • ↑/↓ select • Enter details • n new cron • o open by id • r refresh • [/ ] page • Ctrl+C to exit</Text>
          </Box>
        </>
      ) : null}

      {activeTab === "queues" ? (
        <>
          <Box>
            <QueuesList items={queueList} selectedIndex={queueIndex} total={queueTotal} limit={queueLimit} offset={queueOffset} />
          </Box>
          {focusedQueue ? <QueueDetails queue={focusedQueue} /> : null}
          <Box marginTop={1}>
            <Text dimColor>Keys: 1/2/3/4 switch tabs • ↑/↓ select • Enter details • n new queue • o open by id • r refresh • [/ ] page • Ctrl+C to exit</Text>
          </Box>
        </>
      ) : null}
      <Box marginTop={1}>
        <PromptBarComp prompt={prompt} />
      </Box>
      {showCreateMessage ? (
        <CreateMessageForm
          onCancel={() => setShowCreateMessage(false)}
          onSubmit={async (input) => {
            try {
              await api.create_message(input as any);
              setShowCreateMessage(false);
              await fetchMessageList();
            } catch (e: any) {
              setError(e?.message ?? "Failed to create message");
              setShowCreateMessage(false);
            }
          }}
          loadQueues={async ({ limit, offset } = {}) => (await api.list_queues({ limit, offset })) as any}
        />
      ) : null}
      {showCreateCron ? (
        <CreateCronForm
          onCancel={() => setShowCreateCron(false)}
          onSubmit={async (input) => {
            try {
              await api.create_cron_job(input as any);
              setShowCreateCron(false);
              await fetchCronList();
            } catch (e: any) {
              setError(e?.message ?? "Failed to create cron job");
              setShowCreateCron(false);
            }
          }}
        />
      ) : null}
      {showCreateQueue ? (
        <CreateQueueForm
          onCancel={() => setShowCreateQueue(false)}
          onSubmit={async (input) => {
            try {
              await api.create_queue(input as any);
              setShowCreateQueue(false);
              await fetchQueueList();
            } catch (e: any) {
              setError(e?.message ?? "Failed to create queue");
              setShowCreateQueue(false);
            }
          }}
        />
      ) : null}
    </Box>
  );
};

export const render_app = (opts?: { address?: string }) => {
  const address = opts?.address ?? process.env["NQUEUE_ADDRESS"] ?? "http://localhost:1337";
  render(<App address={address} />);
};
