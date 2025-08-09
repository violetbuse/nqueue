import React from "react";
import { Box, Text } from "ink";
import { truncate } from "./utils";
import type { Queue } from "./types";

export const QueuesList: React.FC<{
    items: Queue[];
    selectedIndex: number;
    total?: number;
    limit?: number;
    offset?: number;
}> = ({ items, selectedIndex, total, limit, offset }) => {
    if (items.length === 0) return <Text dimColor>No queues.</Text>;
    return (
        <Box flexDirection="column">
            {items.map((q, idx) => (
                <Text key={q.id} color={idx === selectedIndex ? "cyan" : (undefined as unknown as never)}>
                    {idx === selectedIndex ? ">" : " "} {q.name ?? q.id} — {q.requests_per_period}/{q.period_length_secs}s
                </Text>
            ))}
            {typeof total === "number" && typeof limit === "number" && typeof offset === "number" ? (
                <Text dimColor>
                    Page {Math.floor(offset / limit) + 1} · {items.length} / {total}
                </Text>
            ) : null}
        </Box>
    );
};

export const QueueDetails: React.FC<{ queue: Queue }> = ({ queue }) => {
    return (
        <Box flexDirection="column" marginTop={1}>
            <Text>Queue: {queue.id}</Text>
            <Text>
                Name: {queue.name ?? "(none)"} | Requests/Period: {queue.requests_per_period} | Period: {queue.period_length_secs}s
            </Text>
            {queue.description ? <Text>Description: {truncate(queue.description, 200)}</Text> : null}
        </Box>
    );
};


