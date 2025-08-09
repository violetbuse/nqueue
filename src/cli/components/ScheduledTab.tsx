import React from "react";
import { Box, Text } from "ink";
import { formatTime, truncate } from "./utils";
import type { ScheduledJob } from "./types";

export const ScheduledJobsList: React.FC<{
    jobs: ScheduledJob[];
    selectedIndex: number;
}> = ({ jobs, selectedIndex }) => {
    if (jobs.length === 0) {
        return <Text dimColor>No scheduled jobs.</Text>;
    }
    return (
        <Box flexDirection="column">
            {jobs.map((job, idx) => (
                <Text key={job.id} color={idx === selectedIndex ? "cyan" : (undefined as unknown as never)}>
                    {idx === selectedIndex ? ">" : " "} [{formatTime(job.planned_at)}] {truncate(job.request.method, 6)} {truncate(job.request.url, 80)}
                </Text>
            ))}
        </Box>
    );
};

export const ScheduledJobDetails: React.FC<{ job: ScheduledJob }> = ({ job }) => {
    return (
        <Box flexDirection="column" marginTop={1}>
            <Text>Job: {job.id}</Text>
            <Text>Planned: {formatTime(job.planned_at)} | Timeout: {job.timeout_ms}ms</Text>
            <Text>
                Request: {job.request.method} {job.request.url}
            </Text>
            {job.request.body ? <Text>Req Body: {truncate(job.request.body, 200)}</Text> : null}
            {job.response ? (
                <>
                    <Text>Response: {job.response.status_code} at {formatTime(job.response.executed_at)}</Text>
                    {job.response.body ? <Text>Res Body: {truncate(job.response.body, 200)}</Text> : null}
                    {job.response.error ? <Text color="red">Error: {job.response.error}</Text> : null}
                    {job.response.timed_out ? <Text color="yellow">Timed out</Text> : null}
                </>
            ) : (
                <Text dimColor>No response yet.</Text>
            )}
        </Box>
    );
};


