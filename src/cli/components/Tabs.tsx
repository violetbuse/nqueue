import React from "react";
import { Box, Text } from "ink";
import type { TabKey } from "./types";

export const Tabs: React.FC<{
    activeTab: TabKey;
}> = ({ activeTab }) => {
    const renderTab = (key: TabKey, label: string) => (
        <Text color={activeTab === key ? ("cyan" as any) : (undefined as any)}>
            {activeTab === key ? "[" : " "}
            {label}
            {activeTab === key ? "]" : " "}
        </Text>
    );
    return (
        <Box marginBottom={1} gap={2 as any}>
            {renderTab("cron", "Cron Jobs")}
            <Text> </Text>
            {renderTab("messages", "Messages")}
            <Text> </Text>
            {renderTab("scheduled", "Scheduled Jobs")}
            <Text> </Text>
            {renderTab("queues", "Queues")}
        </Box>
    );
};


