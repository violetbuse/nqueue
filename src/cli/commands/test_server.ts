import express, { Request, Response } from "express";

type RunTestServerOptions = {
    port?: number;
    defaultDelayMs?: number;
};

const getHeaderNumber = (req: Request, names: string[], fallback: number): number => {
    for (const name of names) {
        const raw = req.header(name);
        if (raw !== undefined) {
            const parsed = Number(raw);
            if (Number.isFinite(parsed) && parsed >= 0) return parsed;
        }
    }
    return fallback;
};

const getHeaderString = (req: Request, names: string[]): string | undefined => {
    for (const name of names) {
        const raw = req.header(name);
        if (typeof raw === "string") return raw;
    }
    return undefined;
};

export const run_test_server_command = (options?: RunTestServerOptions) => {
    const port = options?.port ?? Number(process.env["TEST_SERVER_PORT"] ?? "3000");
    const defaultDelayMs = options?.defaultDelayMs ?? 250;

    const app = express();

    // Capture body as text to echo back regardless of content-type
    app.use(express.text({ type: "*/*" }));

    // Simple request logging
    app.use((req, res, next) => {
        const start = Date.now();
        const { method, originalUrl } = req;
        res.on("finish", () => {
            const duration = Date.now() - start;
            // eslint-disable-next-line no-console
            console.log(`${new Date().toISOString()} ${method} ${originalUrl} -> ${res.statusCode} ${duration}ms`);
        });
        next();
    });

    app.all("*splat", async (req: Request, res: Response) => {
        const handlerStartAt = Date.now();

        const delayMs = getHeaderNumber(req, ["x-echo-delay", "x-delay", "x-delay-ms"], defaultDelayMs);
        // Total duration controls: prefer ms header, then seconds
        const durationMsHeader = getHeaderNumber(req, ["x-duration-ms"], -1);
        const durationSecHeader = durationMsHeader >= 0 ? -1 : getHeaderNumber(req, ["x-duration"], -1);
        const requestedDurationMs = durationMsHeader >= 0
            ? durationMsHeader
            : durationSecHeader >= 0
                ? durationSecHeader * 1000
                : -1;
        const status = getHeaderNumber(req, ["x-echo-status", "x-status"], 200);
        const errorMessage = getHeaderString(req, ["x-echo-error", "x-error"]);

        const responseHeaders: Record<string, string> = {};

        // Optional: echo request headers in response headers when requested
        const echoHeadersPrefix = getHeaderString(req, ["x-echo-headers-prefix"]);
        if (echoHeadersPrefix) {
            for (const [key, value] of Object.entries(req.headers)) {
                if (typeof value === "string") {
                    responseHeaders[`${echoHeadersPrefix}${key}`] = value;
                } else if (Array.isArray(value)) {
                    responseHeaders[`${echoHeadersPrefix}${key}`] = value.join(", ");
                }
            }
        }

        const tryParseJson = (): unknown => {
            const body = req.body as string | undefined;
            if (!body) return undefined;
            try {
                return JSON.parse(body);
            } catch {
                return undefined;
            }
        };

        const requestEcho = {
            method: req.method,
            path: req.path,
            url: req.originalUrl,
            query: req.query,
            headers: req.headers,
            body: req.body,
            json: tryParseJson(),
        };

        const doRespond = () => {
            for (const [key, value] of Object.entries(responseHeaders)) {
                res.setHeader(key, value);
            }

            if (errorMessage) {
                res.status(status >= 400 ? status : 500).json({ error: errorMessage, request: requestEcho });
                return;
            }

            res.status(status).json({ ok: status >= 200 && status < 300, request: requestEcho });
        };

        // Compute final wait time based on desired total duration and explicit delay
        let finalDelayMs = delayMs;
        if (requestedDurationMs >= 0) {
            const elapsed = Date.now() - handlerStartAt;
            const remainingToDuration = Math.max(0, requestedDurationMs - elapsed);
            finalDelayMs = Math.max(finalDelayMs, remainingToDuration);
        }

        if (finalDelayMs > 0) {
            setTimeout(doRespond, finalDelayMs);
        } else {
            doRespond();
        }
    });

    app.listen(port, () => {
        // eslint-disable-next-line no-console
        console.log(`Echo test server listening on http://localhost:${port} (default delay ${defaultDelayMs}ms)`);
    });
};

export const print_test_server_help = () => {
    console.log(`nqueue test-server

Usage:
  nqueue test-server [--port=PORT]

Description:
  Starts an echo test server that logs requests and responds after a configurable delay.
  Defaults to 250ms delay.

Options:
  --port=PORT               Port for the test server (default 3000)

Environment:
  TEST_SERVER_PORT          Default port for the test server

Controlling behavior via headers (sent on the request):
  x-delay-ms | x-delay | x-echo-delay   Base response delay in milliseconds (default 250)
  x-duration-ms                          Ensure total time from request start to response is at least this many ms
  x-duration                             Same as above, in seconds
  x-status | x-echo-status               HTTP status to return (e.g., 200, 400, 500)
  x-error | x-echo-error                 Error message to return; sets status to provided value or 500 if < 400
  x-echo-headers-prefix                  If provided, copies all request headers into response with this prefix
`);
};


