import { proxyActivities,ApplicationFailure } from "@temporalio/workflow";
//import { ApplicationFailure } from "@temporalio/common";

import type * as activities from "./activities.js";
import type {
  Hotel,
  HotelSearchInput
} from "./types.js";

const {
  fetchSupplierA,
  fetchSupplierB
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "4 seconds",
  retry: {
    initialInterval: "250 milliseconds",
    maximumInterval: "1 second",
    maximumAttempts: 2
  }
});

export interface HotelSearchResult {
  hotels: Hotel[];
  cheapestHotel: Hotel | null;
  supplierStatus: {
    supplierA: "success" | "failed";
    supplierB: "success" | "failed";
  };
}

export async function searchHotelsWorkflow(
  input: HotelSearchInput
): Promise<HotelSearchResult> {
  // Run both supplier activities in parallel.
  const [a, b] = await Promise.allSettled([
    fetchSupplierA(input),
    fetchSupplierB(input)
  ]);

  const supplierAHotels =
    a.status === "fulfilled" ? a.value : [];

  const supplierBHotels =
    b.status === "fulfilled" ? b.value : [];

  // If both suppliers fail, return an error.
  if (
    a.status === "rejected" &&
    b.status === "rejected"
  ) {
    throw ApplicationFailure.create({
    message: "Both hotel suppliers failed. Please try again.",
    type: "BothSuppliersFailed",
    nonRetryable: true
  });
  }

  // Combine and sort available hotel results.
  const hotels = [
    ...supplierAHotels,
    ...supplierBHotels
  ]
    .filter(
      (hotel) =>
        Number.isFinite(hotel.price) &&
        hotel.price >= 0
    )
    .sort(
      (left, right) =>
        left.price - right.price ||
        left.supplier.localeCompare(right.supplier) ||
        left.hotelId.localeCompare(right.hotelId)
    );

  return {
    hotels,
    cheapestHotel: hotels[0] ?? null,
    supplierStatus: {
      supplierA:
        a.status === "fulfilled" ? "success" : "failed",
      supplierB:
        b.status === "fulfilled" ? "success" : "failed"
    }
  };
}
