import { handle } from "@astrojs/cloudflare/handler";

export { BookingCoordinator } from "./server/booking-worker";
export default { fetch: handle };
