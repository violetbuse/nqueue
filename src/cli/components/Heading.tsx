import React from "react";
import { Box, Text } from "ink";

export const Heading: React.FC<{ address: string; loading: boolean; error: string | null; lastRefresh: Date | null }> = ({ address, loading, error, lastRefresh }) => (
    <Box flexDirection="column" marginBottom={1}>
        <Text>
            <Text color="cyan">nqueue</Text> API Client — Address: {address}
        </Text>
        <Text>
            {loading ? "Loading…" : ""}
            {error ? ` Error: ${error}` : ""}
            {!loading && !error && lastRefresh ? ` Last refresh: ${lastRefresh.toLocaleTimeString()}` : ""}
        </Text>
    </Box>
);


