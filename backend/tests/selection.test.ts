
import { describe, it, expect } from "vitest";
import { selectCheapestHotel } from "../src/selection.js";
import type { Hotel } from "../src/types.js";

const hotelA: Hotel = {
  hotelId: "A-delhi",
  name: "Delhi Maple Grand Hotel",
  price: 120,
  supplier: "Supplier A",
};

const hotelB: Hotel = {
  hotelId: "B-delhi",
  name: "Delhi Urban Nest Hotel",
  price: 105,
  supplier: "Supplier B",
};

describe("selectCheapestHotel", () => {
  it("returns the cheapest hotel", () => {
    expect(selectCheapestHotel([hotelA, hotelB])).toEqual(hotelB);
  });

  it("returns null when the list is empty", () => {
    expect(selectCheapestHotel([])).toBeNull();
  });

  it("ignores hotels with negative or non-finite prices", () => {
    const invalidHotels: Hotel[] = [
      { ...hotelA, price: -10 },
      { ...hotelB, price: Number.NaN },
      { ...hotelA, price: Number.POSITIVE_INFINITY },
    ];

    expect(selectCheapestHotel(invalidHotels)).toBeNull();
  });

  it("chooses the valid hotel when other prices are invalid", () => {
    const hotels: Hotel[] = [
      { ...hotelA, price: -20 },
      hotelB,
    ];

    expect(selectCheapestHotel(hotels)).toEqual(hotelB);
  });

  it("uses supplier name to break price ties", () => {
    const hotels: Hotel[] = [
      { ...hotelB, price: 100 },
      { ...hotelA, price: 100 },
    ];

    expect(selectCheapestHotel(hotels)?.supplier).toBe("Supplier A");
  });

  it("does not modify the original array", () => {
    const hotels = [hotelA, hotelB];
    const originalOrder = [...hotels];

    selectCheapestHotel(hotels);

    expect(hotels).toEqual(originalOrder);
  });
});
