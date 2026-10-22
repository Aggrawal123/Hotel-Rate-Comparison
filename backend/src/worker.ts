import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities.js";
import { fileURLToPath } from "node:url";

async function run() {
  const connection =
    await NativeConnection.connect({
      address:
        process.env.TEMPORAL_ADDRESS ??
        "localhost:7233"
    });

  const worker = await Worker.create({
    connection,
    namespace: "default",
    taskQueue: "hotel-rate-comparator",
    workflowsPath: fileURLToPath(
      new URL("./workflows.ts", import.meta.url)
    ),
    activities
  });

  console.log(
    "Temporal worker started on hotel-rate-comparator"
  );

  await worker.run();
}

run().catch((error) => {
  console.error("Temporal worker failed:", error);
  process.exit(1);
});