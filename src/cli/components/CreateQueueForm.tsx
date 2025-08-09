import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";

export type CreateQueueInput = {
    name: string | undefined;
    description: string | undefined;
    request_count: number;
    time_period_seconds: number;
};

export const CreateQueueForm: React.FC<{
    onSubmit: (input: CreateQueueInput) => void;
    onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
    const [focused, setFocused] = useState<number>(0);
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [requestCount, setRequestCount] = useState<string>("60");
    const [periodSeconds, setPeriodSeconds] = useState<string>("60");
    const [error, setError] = useState<string | null>(null);

    const fields = useMemo(
        () => [
            { label: "Name (optional)", type: "text" as const, get: () => name, set: setName },
            { label: "Description (optional)", type: "text" as const, get: () => description, set: setDescription },
            { label: "Request count", type: "text" as const, get: () => requestCount, set: setRequestCount },
            { label: "Time period (secs)", type: "text" as const, get: () => periodSeconds, set: setPeriodSeconds },
        ],
        [name, description, requestCount, periodSeconds],
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
        if (field.type === "text") {
            if (key.backspace || key.delete) {
                field.set(field.get().slice(0, Math.max(0, field.get().length - 1)));
                return;
            }
            if (key.return) {
                if (focused === fields.length - 1) {
                    try {
                        const reqs = Number(requestCount);
                        const secs = Number(periodSeconds);
                        if (!Number.isFinite(reqs) || reqs <= 0) throw new Error("Invalid request count");
                        if (!Number.isFinite(secs) || secs <= 0) throw new Error("Invalid period seconds");
                        setError(null);
                        onSubmit({
                            name: name.length ? name : undefined,
                            description: description.length ? description : undefined,
                            request_count: reqs,
                            time_period_seconds: secs,
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
            <Text>Create Queue (Esc to cancel, Enter to submit, ↑/↓ move)</Text>
            {error ? <Text color="red">{error}</Text> : <Text dimColor>Fill the fields below</Text>}
            {fields.map((f, idx) => (
                <Text key={idx} color={idx === focused ? ("cyan" as any) : (undefined as any)}>
                    {idx === focused ? ">" : " "} {f.label}: {(f as any).get()}
                </Text>
            ))}
        </Box>
    );
};


