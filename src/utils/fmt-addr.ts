export const fmt_addr = (hostname: string, port: number): string => {
  const is_ipv6 = hostname.includes(":");

  if (!is_ipv6) {
    return `http://${hostname}:${port}`;
  } else {
    // For IPv6 addresses, we need to wrap the hostname in square brackets
    return `http://[${hostname}]:${port}`;
  }
};
