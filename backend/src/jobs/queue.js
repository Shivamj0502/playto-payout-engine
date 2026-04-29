import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
  host: "127.0.0.1",
  port: 7002,
  maxRetriesPerRequest: null,
});

export const payoutQueue = new Queue("payout-queue", {
  connection,
});