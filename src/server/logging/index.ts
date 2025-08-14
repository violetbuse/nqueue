export const silence_logging = () => {
  process.env["SILENCE_NQUEUE"] = "true";
};

export const logger = {
  info: (message: string) => {
    if (process.env["SILENCE_NQUEUE"] === "true") {
      return;
    }
    console.log(`[INFO] ${message}`);
  },
  error: (message: string) => {
    if (process.env["SILENCE_NQUEUE"] === "true") {
      return;
    }
    console.error(`[ERROR] ${message}`);
  },
};
