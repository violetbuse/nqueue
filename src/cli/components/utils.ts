export const truncate = (value: string, max: number) =>
    value.length > max ? value.slice(0, Math.max(0, max - 1)) + "…" : value;

export const formatTime = (unixSeconds: number) => {
    const date = new Date(unixSeconds * 1000);
    return date.toLocaleString();
};


