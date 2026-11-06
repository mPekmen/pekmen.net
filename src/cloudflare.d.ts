declare module "cloudflare:workers" {
  export const env: {
    BOOKING_COORDINATOR?: import("./server/booking-binding").BookingNamespace;
  };
}
