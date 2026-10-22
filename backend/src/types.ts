export interface Hotel {
  hotelId: string;
  name: string;
  price: number;
  supplier: "Supplier A" | "Supplier B";
}

export interface HotelSearchInput {
  city: string;
  checkIn: string;
  checkOut: string;
}

export interface SupplierResponse {
  hotels: Hotel[];
}