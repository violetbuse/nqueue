import React from "react";
import { Box, Text } from "ink";
import { truncate } from "./utils";
import type { Message } from "./types";

export const MessagesList: React.FC<{
    items: Message[];
    selectedIndex: number;
}> = ({ items, selectedIndex }) => {
    if (items.length === 0) return <Text dimColor>No messages.</Text>;
    return (
        <Box flexDirection="column">
            {items.map((m, idx) => (
                <Text key={m.id} color={idx === selectedIndex ? "cyan" : (undefined as unknown as never)}>
                    {idx === selectedIndex ? ">" : " "} {m.method} {truncate(m.url, 80)}
                </Text>
            ))}
        </Box>
    );
};

export const MessageDetails: React.FC<{ message: Message }> = ({ message }) => {
    const schedulingDesc = (() => {
        if ("queue_id" in message.scheduling) return `Queue: ${message.scheduling.queue_id}`;
        if ("wait_seconds" in message.scheduling) return `Wait: ${message.scheduling.wait_seconds}s`;
        if ("wait_until" in message.scheduling)
            return `At: ${new Date(message.scheduling.wait_until * 1000).toLocaleString()}`;
        return "";
    })();
    return (
        <Box flexDirection="column" marginTop={1}>
            <Text>Message: {message.id}</Text>
            <Text>
                Request: {message.method} {message.url} | Timeout: {message.timeout_ms}ms
            </Text>
            <Text>Scheduling: {schedulingDesc}</Text>
            {message.body ? <Text>Body: {truncate(message.body, 200)}</Text> : null}
        </Box>
    );
};


