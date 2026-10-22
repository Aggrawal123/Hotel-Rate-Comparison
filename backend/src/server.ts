import express from "express";
import cors from "cors";
import { z } from "zod";
import { Connection, Client } from "@temporalio/client";
import { randomUUID } from "node:crypto";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);

app.use(express.json());

const searchSchema = z.object({
  city: z.string().trim().min(2).max(100),
  checkIn: z.string().date(),
  checkOut: z.string().date()
}).refine(
  (value) => value.checkOut > value.checkIn,
  {
    message: "Check-out must be after check-in",
    path: ["checkOut"]
  }
);

function delay(ms: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

function makeHotels(
  supplier: "A" | "B",
  city: string
) {
  const price = supplier === "A" ? 1200 : 1050;

  const name =
    supplier === "A"
      ? "Maple Grand Hotel"
      : "Urban Nest Hotel";

  return [
    {
      hotelId: `${supplier}-${city
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}`,
      name: `${city} ${name}`,
      price,
      supplier:
        supplier === "A"
          ? "Supplier A"
          : "Supplier B"
    }
  ];
}

async function supplierRoute(
  supplier: "A" | "B",
  req: express.Request,
  res: express.Response
) {
  const envKey =
    supplier === "A"
      ? "SUPPLIER_A_MODE"
      : "SUPPLIER_B_MODE";

  const mode = String(
    req.query.mode ??
    process.env[envKey] ??
    "normal"
  );

  if (mode === "delay") {
    await delay(900);
  }

  if (mode === "timeout") {
    await delay(8000);
  }

  if (mode === "error") {
    res.status(500).json({
      error: `Supplier ${supplier} simulated an error`
    });
    return;
  }

  if (mode === "empty") {
    res.json({ hotels: [] });
    return;
  }

  const city = String(
    req.query.city ?? "Unknown City"
  );

  res.json({
    hotels: makeHotels(supplier, city)
  });
}

// Health check.
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Mock Supplier A.
app.get(
  "/supplierA/hotels",
  (req, res) => {
    void supplierRoute("A", req, res);
  }
);

// Mock Supplier B.
app.get(
  "/supplierB/hotels",
  (req, res) => {
    void supplierRoute("B", req, res);
  }
);

// Main hotel search endpoint.
app.post("/api/search-hotels", async (req, res) => {
  const parsed = searchSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error:
        parsed.error.issues[0]?.message ??
        "Invalid search details"
    });
    return;
  }

  let connection: Connection | undefined;

  try {
    connection = await Connection.connect({
      address:
        process.env.TEMPORAL_ADDRESS ??
        "localhost:7233"
    });

    const client = new Client({ connection });

    const handle = await client.workflow.start(
      "searchHotelsWorkflow",
      {
        taskQueue: "hotel-rate-comparator",
        workflowId: `hotel-search-${randomUUID()}`,
        args: [parsed.data]
      }
    );

    const result = await handle.result();

    if (result.hotels.length === 0) {
      res.json({
        ...result,
        message: "No hotels found"
      });
      return;
    }

    res.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Hotel search failed";

    res.status(502).json({ error: message });
  } finally {
    await connection?.close().catch(() => undefined);
  }
});

const port = Number(process.env.PORT ?? 8000);

app.listen(port, () => {
  console.log(
    `API running at http://localhost:${port}`
  );
});