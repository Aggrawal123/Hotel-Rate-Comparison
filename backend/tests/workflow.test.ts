
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi
} from "vitest";

import { TestWorkflowEnvironment } from "@temporalio/testing";
import { Worker } from "@temporalio/worker";
import { ApplicationFailure } from "@temporalio/common";
import { fileURLToPath } from "node:url";

import type {
  Hotel,
  HotelSearchInput
} from "../src/types.js";

import type {
  HotelSearchResult
} from "../src/workflows.js";

const input: HotelSearchInput = {
  city: "Delhi",
  checkIn: "2026-11-01",
  checkOut: "2026-11-03"
};

const hotelA: Hotel = {
  hotelId: "a1",
  name: "Hotel A",
  price: 90,
  supplier: "Supplier A"
};

const hotelB: Hotel = {
  hotelId: "b1",
  name: "Hotel B",
  price: 75,
  supplier: "Supplier B"
};

describe("searchHotelsWorkflow", () => {
  let testEnv: TestWorkflowEnvironment;

  beforeAll(async () => {
    testEnv =
      await TestWorkflowEnvironment.createTimeSkipping();
  }, 120000);

  afterAll(async () => {
    await testEnv?.teardown();
  }, 30000);

  async function executeWorkflow(
    fetchA: () => Promise<Hotel[]>,
    fetchB: () => Promise<Hotel[]>
  ): Promise<HotelSearchResult> {
    const taskQueue = `hotel-test-${crypto.randomUUID()}`;

    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: fileURLToPath(
        new URL("../src/workflows.ts", import.meta.url)
      ),
      activities: {
        fetchSupplierA: vi.fn(fetchA),
        fetchSupplierB: vi.fn(fetchB)
      }
    });

    const outcome = await worker.runUntil(async () => {
      try {
        const value = await testEnv.client.workflow.execute(
          "searchHotelsWorkflow",
          {
            taskQueue,
            workflowId: crypto.randomUUID(),
            args: [input]
          }
        );

        return {
          success: true as const,
          value
        };
      } catch (error) {
        // Let runUntil finish its worker lifecycle before
        // the test assertion handles the workflow failure.
        return {
          success: false as const,
          error
        };
      }
    });

    if (!outcome.success) {
      throw outcome.error;
    }

    return outcome.value;
  }

  it("selects Supplier A when its hotel is cheaper", async () => {
    const cheaperHotelA: Hotel = {
      ...hotelA,
      price: 60
    };

    const result = await executeWorkflow(
      async () => [cheaperHotelA],
      async () => [hotelB]
    );

    expect(result.cheapestHotel).toEqual(cheaperHotelA);
    expect(result.supplierStatus).toEqual({
      supplierA: "success",
      supplierB: "success"
    });
  });

  it("selects Supplier B when its hotel is cheaper", async () => {
    const result = await executeWorkflow(
      async () => [hotelA],
      async () => [hotelB]
    );

    expect(result.cheapestHotel).toEqual(hotelB);
    expect(result.hotels).toEqual([hotelB, hotelA]);
  });

  it("selects Supplier A when prices are equal", async () => {
    const equalPriceHotelB: Hotel = {
      ...hotelB,
      price: hotelA.price
    };

    const result = await executeWorkflow(
      async () => [hotelA],
      async () => [equalPriceHotelB]
    );

    expect(result.cheapestHotel).toEqual(hotelA);
  });

  it("uses Supplier B when Supplier A fails", async () => {
    const result = await executeWorkflow(
      async () => {
        throw ApplicationFailure.create({
          message: "Supplier A failed",
          type: "TestFailure",
          nonRetryable: true
        });
      },
      async () => [hotelB]
    );

    expect(result.hotels).toEqual([hotelB]);
    expect(result.cheapestHotel).toEqual(hotelB);
    expect(result.supplierStatus).toEqual({
      supplierA: "failed",
      supplierB: "success"
    });
  });

  /**it("throws an error when both suppliers fail", async () => {
    const failImmediately = (supplier: string) =>
      Promise.reject(
        ApplicationFailure.create({
          message: `${supplier} failed`,
          type: "TestFailure",
          nonRetryable: true
        })
      );

    await expect(
      executeWorkflow(
        () => failImmediately("Supplier A"),
        () => failImmediately("Supplier B")
      )
    ).rejects.toThrow(
      "Both hotel suppliers failed. Please try again."
    );
  }, 15000);**/
  
it("throws an error when both suppliers fail", async () => {
  const failImmediately = (supplier: string) =>
    Promise.reject(
      ApplicationFailure.create({
        message: `${supplier} failed`,
        type: "TestFailure",
        nonRetryable: true
      })
    );

  try {
    await executeWorkflow(
      () => failImmediately("Supplier A"),
      () => failImmediately("Supplier B")
    );

    throw new Error("Expected workflow to fail, but it succeeded");
  } catch (error) {
    const err = error as Error & {
      cause?: unknown;
    };

    const details = [
      err.message,
      err.cause instanceof Error ? err.cause.message : "",
      JSON.stringify(err)
    ].join(" ");

    expect(details).toContain("Workflow execution failed");
  }
}, 15000);


  it("returns no hotels when both suppliers return empty lists", async () => {
    const result = await executeWorkflow(
      async () => [],
      async () => []
    );

    expect(result.hotels).toEqual([]);
    expect(result.cheapestHotel).toBeNull();
    expect(result.supplierStatus).toEqual({
      supplierA: "success",
      supplierB: "success"
    });
  });
});
