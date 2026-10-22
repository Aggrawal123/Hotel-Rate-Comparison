import type {
  Hotel,
  HotelSearchInput,
  SupplierResponse
} from "./types.js";

const API_BASE_URL =
  process.env.SUPPLIER_API_BASE_URL ??
  "http://localhost:8000";

/**async function fetchSupplier(
  supplier: "A" | "B",
  input: HotelSearchInput
): Promise<Hotel[]> {
  const url = new URL(
    `${API_BASE_URL}/supplier${supplier}/hotels`
  );

  url.searchParams.set("city", input.city);
  url.searchParams.set("checkIn", input.checkIn);
  url.searchParams.set("checkOut", input.checkOut);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(2500)
  });

  if (!response.ok) {
    throw new Error(
      `Supplier ${supplier} returned HTTP ${response.status}`
    );
  }

  const data =
    (await response.json()) as SupplierResponse;

  return data.hotels.map((hotel) => ({
    ...hotel,
    supplier:
      supplier === "A" ? "Supplier A" : "Supplier B"
  }));
}**/

async function fetchSupplier(
  supplier: "A" | "B",
  input: HotelSearchInput
): Promise<Hotel[]> {
  const url = new URL(
    `${API_BASE_URL}/supplier${supplier}/hotels`
  );

  url.searchParams.set("city", input.city);
  url.searchParams.set("checkIn", input.checkIn);
  url.searchParams.set("checkOut", input.checkOut);

  // Optional modes for testing supplier behavior.
  const modeKey =
    supplier === "A"
      ? "SUPPLIER_A_MODE"
      : "SUPPLIER_B_MODE";

  const mode = process.env[modeKey];

  if (mode) {
    url.searchParams.set("mode", mode);
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(2500)
  });

  if (!response.ok) {
    throw new Error(
      `Supplier ${supplier} returned HTTP ${response.status}`
    );
  }

  const data =
    (await response.json()) as SupplierResponse;

  return data.hotels.map((hotel) => ({
    ...hotel,
    supplier:
      supplier === "A" ? "Supplier A" : "Supplier B"
  }));
}

export async function fetchSupplierA(
  input: HotelSearchInput
): Promise<Hotel[]> {
  return fetchSupplier("A", input);
}

export async function fetchSupplierB(
  input: HotelSearchInput
): Promise<Hotel[]> {
  return fetchSupplier("B", input);
}