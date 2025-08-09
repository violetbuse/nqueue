// Shared type definitions for the CLI TUI

export type HttpHeaders = Record<string, string>;

export type TabKey = "cron" | "messages" | "scheduled" | "queues";

export type CronJob = {
    id: string;
    expression: string;
    url: string;
    method: string;
    headers: HttpHeaders;
    body: string | null;
    timeout_ms: number;
};

export type MessageScheduling =
    | { queue_id: string }
    | { wait_seconds: number }
    | { wait_until: number };

export type Message = {
    id: string;
    url: string;
    method: string;
    headers: HttpHeaders;
    body: string | null;
    timeout_ms: number;
    scheduling: MessageScheduling;
};

export type Queue = {
    id: string;
    name: string | null;
    description: string | null;
    requests_per_period: number;
    period_length_secs: number;
};

export type ScheduledJob = {
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

export type AppProps = {
    address?: string;
};

export type PromptMode =
    | { kind: "none" }
    | { kind: "createMessage"; buffer: string }
    | { kind: "getJob"; buffer: string }
    | { kind: "getMessage"; buffer: string }
    | { kind: "getCron"; buffer: string }
    | { kind: "getQueue"; buffer: string };


