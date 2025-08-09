import React from "react";
import { Text } from "ink";
import type { PromptMode } from "./types";

export const PromptBar: React.FC<{ prompt: PromptMode }> = ({ prompt }) => {
    if (prompt.kind === "createMessage") {
        return (
            <Text>
                Create Message — Enter URL and press Enter (Esc to cancel): {prompt.buffer}
            </Text>
        );
    }
    if (prompt.kind === "getJob") {
        return (
            <Text>Open Job — Enter job id and press Enter (Esc to cancel): {prompt.buffer}</Text>
        );
    }
    if (prompt.kind === "getMessage") {
        return (
            <Text>
                Open Message — Enter message id and press Enter (Esc to cancel): {prompt.buffer}
            </Text>
        );
    }
    if (prompt.kind === "getCron") {
        return (
            <Text>
                Open Cron — Enter cron id and press Enter (Esc to cancel): {prompt.buffer}
            </Text>
        );
    }
    if (prompt.kind === "getQueue") {
        return (
            <Text>
                Open Queue — Enter queue id and press Enter (Esc to cancel): {prompt.buffer}
            </Text>
        );
    }
    return <></>;
};


