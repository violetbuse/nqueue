import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";

type HttpHeaders = Record<string, string>;

export type CreateCronInput = {
    expression: string;
    url: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: HttpHeaders;
    body?: string | null;
    timeout_ms: number;
};

export const CreateCronForm: React.FC<{
    onSubmit: (input: CreateCronInput) => void;
    onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
    const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
    const [focused, setFocused] = useState<number>(0);
    const [expression, setExpression] = useState<string>("* * * * *");
    const [url, setUrl] = useState<string>("");
    const [methodIndex, setMethodIndex] = useState<number>(0);
    const [timeoutMs, setTimeoutMs] = useState<string>("1000");
    const [headersRaw, setHeadersRaw] = useState<string>("{}");
    const [body, setBody] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const fields = useMemo(
        () => [
            { label: "Cron expression", type: "text" as const, get: () => expression, set: setExpression },
            { label: "URL", type: "text" as const, get: () => url, set: setUrl },
            {
                label: "Method",
                type: "select" as const,
                get: () => methods[methodIndex],
                inc: () => setMethodIndex((i) => (i + 1) % methods.length),
                dec: () => setMethodIndex((i) => (i - 1 + methods.length) % methods.length),
            },
            { label: "Timeout (ms)", type: "text" as const, get: () => timeoutMs, set: setTimeoutMs },
            { label: "Headers (JSON)", type: "text" as const, get: () => headersRaw, set: setHeadersRaw },
            { label: "Body", type: "text" as const, get: () => body, set: setBody },
        ],
        [expression, url, methodIndex, timeoutMs, headersRaw, body, methods],
    );

    useInput((input, key) => {
        if (key.escape) {
            onCancel();
            return;
        }
        if (key.upArrow) {
            setFocused((i) => Math.max(0, i - 1));
            return;
        }
        if (key.downArrow) {
            setFocused((i) => Math.min(fields.length - 1, i + 1));
            return;
        }
        const field = fields[focused] as any;
        if (!field) return;
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
                if (focused === fields.length - 1) {
                    try {
                        const timeout = Number(timeoutMs);
                        if (!Number.isFinite(timeout) || timeout < 0) throw new Error("Invalid timeout");
                        let headers: HttpHeaders = {};
                        if (headersRaw.trim().length > 0) {
                            headers = JSON.parse(headersRaw);
                        }
                        setError(null);
                        onSubmit({
                            expression,
                            url,
                            method: methods[methodIndex]!,
                            headers,
                            body: body.length ? body : null,
                            timeout_ms: timeout,
                        });
                    } catch (e: any) {
                        setError(e?.message ?? "Invalid input");
                    }
                    return;
                } else {
                    setFocused((i) => Math.min(fields.length - 1, i + 1));
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
            <Text>Create Cron Job (Esc cancel • Enter submit • ↑/↓ move • ←/→/h/l/space cycle)</Text>
            {error ? <Text color="red">{error}</Text> : <Text dimColor>Fill the fields below</Text>}
            {fields.map((f, idx) => (
                <Text key={idx} color={idx === focused ? ("cyan" as any) : (undefined as any)}>
                    {idx === focused ? ">" : " "} {f.label}: {(f as any).get()}
                </Text>
            ))}
        </Box>
    );
};


