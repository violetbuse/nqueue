import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import type { Queue } from "./types";

type HttpHeaders = Record<string, string>;

type SchedulingKind = "queue" | "wait_seconds" | "wait_until";

export type CreateMessageInput = {
    url: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: HttpHeaders;
    body?: string | null;
    timeout_ms: number;
    scheduling:
    | { queue_id: string }
    | { wait_seconds: number }
    | { wait_until: number };
};

export const CreateMessageForm: React.FC<{
    onSubmit: (input: CreateMessageInput) => void;
    onCancel: () => void;
    loadQueues: (args?: { limit?: number; offset?: number }) => Promise<{
        items: Queue[];
        total: number;
        limit: number;
        offset: number;
    }>;
}> = ({ onSubmit, onCancel, loadQueues }) => {
    const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
    const [focused, setFocused] = useState<number>(0);
    const [url, setUrl] = useState<string>("");
    const [methodIndex, setMethodIndex] = useState<number>(0);
    const [timeoutMs, setTimeoutMs] = useState<string>("1000");
    const [headersRaw, setHeadersRaw] = useState<string>("{}");
    const [body, setBody] = useState<string>("");
    const [schedKind, setSchedKind] = useState<SchedulingKind>("wait_seconds");
    const [schedQueueId, setSchedQueueId] = useState<string>("");
    const [queues, setQueues] = useState<Queue[]>([]);
    const [queueIndex, setQueueIndex] = useState<number>(0);
    const [qTotal, setQTotal] = useState<number>(0);
    const [qLimit, setQLimit] = useState<number>(50);
    const [qOffset, setQOffset] = useState<number>(0);
    const [schedWaitSeconds, setSchedWaitSeconds] = useState<string>("30");
    const [schedWaitUntil, setSchedWaitUntil] = useState<string>(
        String(Math.floor(Date.now() / 1000) + 60),
    );
    const [error, setError] = useState<string | null>(null);

    const fields = useMemo(
        () => [
            { label: "URL", type: "text" as const, get: () => url, set: setUrl },
            {
                label: "Method",
                type: "select" as const,
                get: () => methods[methodIndex],
                inc: () => setMethodIndex((i) => (i + 1) % methods.length),
                dec: () => setMethodIndex((i) => (i - 1 + methods.length) % methods.length),
            },
            {
                label: "Timeout (ms)",
                type: "text" as const,
                get: () => timeoutMs,
                set: setTimeoutMs,
            },
            {
                label: "Headers (JSON)",
                type: "text" as const,
                get: () => headersRaw,
                set: setHeadersRaw,
            },
            { label: "Body", type: "text" as const, get: () => body, set: setBody },
            {
                label: "Scheduling",
                type: "select" as const,
                get: () =>
                    schedKind === "queue"
                        ? "Queue"
                        : schedKind === "wait_seconds"
                            ? "Wait seconds"
                            : "Wait until (unix)",
                inc: () =>
                    setSchedKind((k) =>
                        k === "queue" ? "wait_seconds" : k === "wait_seconds" ? "wait_until" : "queue",
                    ),
                dec: () =>
                    setSchedKind((k) =>
                        k === "queue" ? "wait_until" : k === "wait_seconds" ? "queue" : "wait_seconds",
                    ),
            },
            {
                label: "Queue",
                type: "queue_select" as const,
                get: () => (queues[queueIndex]?.name ?? queues[queueIndex]?.id ?? "(none)"),
                visible: () => schedKind === "queue",
            },
            {
                label: "Wait seconds",
                type: "text" as const,
                get: () => schedWaitSeconds,
                set: setSchedWaitSeconds,
                visible: () => schedKind === "wait_seconds",
            },
            {
                label: "Wait until (unix)",
                type: "text" as const,
                get: () => schedWaitUntil,
                set: setSchedWaitUntil,
                visible: () => schedKind === "wait_until",
            },
        ],
        [
            url,
            methodIndex,
            timeoutMs,
            headersRaw,
            body,
            schedKind,
            schedQueueId,
            schedWaitSeconds,
            schedWaitUntil,
            methods,
        ],
    );

    const visibleFieldIndexes = fields
        .map((f, i) => ({ i, visible: (f as any).visible ? (f as any).visible() : true }))
        .filter((f) => f.visible)
        .map((f) => f.i);

    useEffect(() => {
        if (schedKind === "queue") {
            (async () => {
                try {
                    const res = await loadQueues({ limit: qLimit, offset: qOffset });
                    setQueues(res.items);
                    setQTotal(res.total);
                    setQLimit(res.limit);
                    setQOffset(res.offset);
                    setQueueIndex((i) => (res.items.length === 0 ? 0 : Math.max(0, Math.min(i, res.items.length - 1))));
                    setSchedQueueId(res.items[0]?.id ?? "");
                } catch (e) {
                    // ignore in form; parent shows errors
                }
            })();
        }
    }, [schedKind, qLimit, qOffset, loadQueues]);

    useInput((input, key) => {
        if (key.escape) {
            onCancel();
            return;
        }
        const field = fields[focused] as any;
        if (!field) return;
        if (field.type === "queue_select") {
            if (key.upArrow) {
                setQueueIndex((i) => Math.max(0, i - 1));
                setSchedQueueId((prev) => queues[Math.max(0, queueIndex - 1)]?.id ?? prev);
                return;
            }
            if (key.downArrow) {
                setQueueIndex((i) => Math.min(Math.max(0, queues.length - 1), i + 1));
                setSchedQueueId((prev) => queues[Math.min(Math.max(0, queues.length - 1), queueIndex + 1)]?.id ?? prev);
                return;
            }
            if (input === "[" || key.leftArrow) {
                setQOffset((o) => Math.max(0, o - qLimit));
                return;
            }
            if (input === "]" || key.rightArrow) {
                setQOffset((o) => o + qLimit);
                return;
            }
            if (key.return) {
                // advance to next visible field
                const currentVisibleIdx = visibleFieldIndexes.indexOf(focused);
                const next = visibleFieldIndexes[Math.min(visibleFieldIndexes.length - 1, currentVisibleIdx + 1)];
                setFocused(next ?? focused);
                return;
            }
        }
        if (key.upArrow) {
            const currentVisibleIdx = visibleFieldIndexes.indexOf(focused);
            const prev = visibleFieldIndexes[Math.max(0, currentVisibleIdx - 1)];
            setFocused(prev ?? focused);
            return;
        }
        if (key.downArrow) {
            const currentVisibleIdx = visibleFieldIndexes.indexOf(focused);
            const next = visibleFieldIndexes[Math.min(visibleFieldIndexes.length - 1, currentVisibleIdx + 1)];
            setFocused(next ?? focused);
            return;
        }
        if (field.type === "select") {
            if (key.leftArrow || input === "h") {
                field.dec?.();
                return;
            }
            if (key.rightArrow || input === "l" || input === " ") {
                field.inc?.();
                return;
            }
        } else if (field.type === "text") {
            if (key.backspace || key.delete) {
                field.set(field.get().slice(0, Math.max(0, field.get().length - 1)));
                return;
            }
            if (key.return) {
                // Advance or submit
                const currentVisibleIdx = visibleFieldIndexes.indexOf(focused);
                const isLast = currentVisibleIdx === visibleFieldIndexes.length - 1;
                if (isLast) {
                    try {
                        const timeout = Number(timeoutMs);
                        if (!Number.isFinite(timeout) || timeout < 0) throw new Error("Invalid timeout");
                        let headers: HttpHeaders = {};
                        if (headersRaw.trim().length > 0) {
                            headers = JSON.parse(headersRaw);
                        }
                        let scheduling:
                            | { queue_id: string }
                            | { wait_seconds: number }
                            | { wait_until: number };
                        if (schedKind === "queue") {
                            const selected = queues[queueIndex];
                            if (!selected) throw new Error("Select a queue");
                            scheduling = { queue_id: selected.id };
                        } else if (schedKind === "wait_seconds") {
                            const ws = Number(schedWaitSeconds);
                            if (!Number.isFinite(ws) || ws < 0) throw new Error("Invalid wait seconds");
                            scheduling = { wait_seconds: ws };
                        } else {
                            const wu = Number(schedWaitUntil);
                            if (!Number.isFinite(wu) || wu <= 0) throw new Error("Invalid wait until");
                            scheduling = { wait_until: wu };
                        }
                        setError(null);
                        onSubmit({
                            url,
                            method: methods[methodIndex]!,
                            headers,
                            body: body.length ? body : null,
                            timeout_ms: timeout,
                            scheduling,
                        });
                    } catch (e: any) {
                        setError(e?.message ?? "Invalid input");
                    }
                    return;
                } else {
                    const next = visibleFieldIndexes[currentVisibleIdx + 1];
                    setFocused(next ?? focused);
                    return;
                }
            }
            if (input) {
                field.set(field.get() + input);
                return;
            }
        }
    });

    return (
        <Box flexDirection="column" borderStyle="round" paddingX={1 as any}>
            <Text>Create Message (Esc cancel • Enter submit • ↑/↓ move • ←/→/h/l/space cycle)</Text>
            {error ? (
                <Text color="red">{error}</Text>
            ) : (
                <Text dimColor>Fill the fields below</Text>
            )}
            {fields.map((f, idx) => {
                const visible = (f as any).visible ? (f as any).visible() : true;
                if (!visible) return null;
                const isFocused = idx === focused;
                return (
                    <Text key={idx} color={isFocused ? ("cyan" as any) : (undefined as any)}>
                        {isFocused ? ">" : " "} {f.label}: {(f as any).get()}
                    </Text>
                );
            })}
            {schedKind === "queue" ? (
                <>
                    <Text dimColor>
                        Queues (use ↑/↓ to select, [/ ] to page): Page {Math.floor(qOffset / qLimit) + 1} — {queues.length} / {qTotal}
                    </Text>
                    {queues.map((q, i) => (
                        <Text key={q.id} color={i === queueIndex ? ("cyan" as any) : (undefined as any)}>
                            {i === queueIndex ? ">" : " "} {q.name ?? q.id}
                        </Text>
                    ))}
                </>
            ) : null}
        </Box>
    );
};


