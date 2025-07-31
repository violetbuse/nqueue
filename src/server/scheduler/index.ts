import express from "express";

const app = express();

app.use(express.json());

export const run_server = (port: number) => {
  app.listen(port);
};
