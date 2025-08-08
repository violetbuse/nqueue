import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, render, useInput } from "ink";
import { create_api_client } from "@/server/api/client";

type HttpHeaders = Record<string, string>;

type ScheduledJob = {
  id: string;
  planned_at: number; // unix seconds
  timeout_ms: number;
  request: {
    url: string;
    method: string;
    headers: HttpHeaders;
    body: string | null;
  };
  response: {
    status_code: number;
    headers: HttpHeaders;
    body: string | null;
    executed_at: number;
    timed_out: boolean;
    error: string | null;
  } | null;
};

type AppProps = {
  address?: string;
};

type PromptMode =
  | { kind: "none" }
  | { kind: "createMessage"; buffer: string }
  | { kind: "getJob"; buffer: string };

const truncate = (value: string, max: number) =>
  value.length > max ? value.slice(0, Math.max(0, max - 1)) + "…" : value;

const formatTime = (unixSeconds: number) => {
  const date = new Date(unixSeconds * 1000);
  return date.toLocaleString();
};

const App: React.FC<AppProps> = ({ address = "http://localhost:1337" }) => {
  const api = useMemo(() => create_api_client(address), [address]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [focusedJob, setFocusedJob] = useState<ScheduledJob | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [prompt, setPrompt] = useState<PromptMode>({ kind: "none" });

  const refresh = async () => {
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

  useEffect(() => {
    // Initial load
    void refresh();
  }, []);

  useInput((input, key) => {
    // When in prompt mode, capture raw input
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
                void refresh();
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
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(Math.max(0, jobs.length - 1), i + 1));
      return;
    }
    if (key.return) {
      const job = jobs[selectedIndex];
      if (job) void openJobDetails(job.id);
      return;
    }
    if (input === "r" || (key.ctrl && input.toLowerCase() === "r")) {
      void refresh();
      return;
    }
    if (input === "q") {
      // Let Ink exit by throwing an unhandled promise rejection is not ideal; rely on parent to exit.
      // Users can Ctrl+C to quit; still provide hint in UI.
      return;
    }
    if (input === "m") {
      setPrompt({ kind: "createMessage", buffer: "" });
      return;
    }
    if (input === "g") {
      setPrompt({ kind: "getJob", buffer: "" });
      return;
    }
  });

  const Heading: React.FC = () => (
    <Box flexDirection="column" marginBottom={1}>
      <Text>
        <Text color="cyan">nqueue</Text> API Client — Address: {address}
      </Text>
      <Text>
        {loading ? "Loading…" : ""}
        {error ? ` Error: ${error}` : ""}
        {!loading && !error && lastRefresh
          ? ` Last refresh: ${lastRefresh.toLocaleTimeString()}`
          : ""}
      </Text>
    </Box>
  );

  const JobsList: React.FC = () => {
    if (jobs.length === 0) {
      return <Text dimColor>No scheduled jobs.</Text>;
    }
    const visible = jobs; // simple full list
    return (
      <Box flexDirection="column">
        {visible.map((job, idx) => (
          <Text key={job.id} color={idx === selectedIndex ? "cyan" : (undefined as unknown as never)}>
            {idx === selectedIndex ? ">" : " "} [{formatTime(job.planned_at)}] {truncate(job.request.method, 6)} {truncate(job.request.url, 80)}
          </Text>
        ))}
      </Box>
    );
  };

  const JobDetails: React.FC<{ job: ScheduledJob }> = ({ job }) => {
    return (
      <Box flexDirection="column" marginTop={1}>
        <Text>Job: {job.id}</Text>
        <Text>
          Planned: {formatTime(job.planned_at)} | Timeout: {job.timeout_ms}ms
        </Text>
        <Text>
          Request: {job.request.method} {job.request.url}
        </Text>
        {job.request.body ? (
          <Text>Req Body: {truncate(job.request.body, 200)}</Text>
        ) : null}
        {job.response ? (
          <>
            <Text>
              Response: {job.response.status_code} at {formatTime(job.response.executed_at)}
            </Text>
            {job.response.body ? (
              <Text>Res Body: {truncate(job.response.body, 200)}</Text>
            ) : null}
            {job.response.error ? (
              <Text color="red">Error: {job.response.error}</Text>
            ) : null}
            {job.response.timed_out ? (
              <Text color="yellow">Timed out</Text>
            ) : null}
          </>
        ) : (
          <Text dimColor>No response yet.</Text>
        )}
      </Box>
    );
  };

  const PromptBar: React.FC = () => {
    if (prompt.kind === "createMessage") {
      return (
        <Text>
          Create Message — Enter URL and press Enter (Esc to cancel): {prompt.buffer}
        </Text>
      );
    }
    if (prompt.kind === "getJob") {
      return (
        <Text>Open Job — Enter job id and press Enter (Esc to cancel): {prompt.buffer}</Text>
      );
    }
    return <></>;
  };

  return (
    <Box flexDirection="column">
      <Heading />
      <Box>
        <JobsList />
      </Box>
      {focusedJob ? <JobDetails job={focusedJob} /> : null}
      <Box marginTop={1}>
        <Text dimColor>
          Keys: ↑/↓ select • Enter details • r refresh • m create message • g open job • Ctrl+C to exit
        </Text>
      </Box>
      <Box marginTop={1}>
        <PromptBar />
      </Box>
    </Box>
  );
};

export const render_app = (opts?: { address?: string }) => {
  const address = opts?.address ?? process.env["NQUEUE_ADDRESS"] ?? "http://localhost:1337";
  render(<App address={address} />);
};
