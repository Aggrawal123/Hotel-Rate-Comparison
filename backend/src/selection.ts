import type { Hotel } from "./types.js";

export function selectCheapestHotel(
  hotels: Hotel[]
): Hotel | null {
  return (
    [...hotels]
      .filter(
        (hotel) =>
          Number.isFinite(hotel.price) &&
          hotel.price >= 0
      )
      .sort(
        (a, b) =>
          a.price - b.price ||
          a.supplier.localeCompare(b.supplier) ||
          a.hotelId.localeCompare(b.hotelId)
      )[0] ?? null
  );
}