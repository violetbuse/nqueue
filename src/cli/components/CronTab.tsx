import React from "react";
import { Box, Text } from "ink";
import { truncate } from "./utils";
import type { CronJob } from "./types";

export const CronList: React.FC<{
    items: CronJob[];
    selectedIndex: number;
    total?: number;
    limit?: number;
    offset?: number;
}> = ({ items, selectedIndex, total, limit, offset }) => {
    if (items.length === 0) return <Text dimColor>No cron jobs.</Text>;
    return (
        <Box flexDirection="column">
            {items.map((c, idx) => (
                <Text key={c.id} color={idx === selectedIndex ? "cyan" : (undefined as unknown as never)}>
                    {idx === selectedIndex ? ">" : " "} {c.expression} → {c.method} {truncate(c.url, 60)}
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

export const CronDetails: React.FC<{ cron: CronJob }> = ({ cron }) => {
    return (
        <Box flexDirection="column" marginTop={1}>
            <Text>Cron: {cron.id}</Text>
            <Text>
                {cron.expression} → {cron.method} {cron.url} | Timeout: {cron.timeout_ms}ms
            </Text>
            {cron.body ? <Text>Body: {truncate(cron.body, 200)}</Text> : null}
        </Box>
    );
};


