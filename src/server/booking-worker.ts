import type { BookingCommand } from "./booking-binding";
import { BookingCoordination, CoordinationError, type CoordinationStorage } from "./booking-coordination";
import { BookingError, createBooking } from "./booking";
import { GoogleError } from "./google";
import { json } from "./http";
import { cancelBooking, confirmBooking, ManageError, rescheduleBooking } from "./manage";

// Wrangler binds this class privately. The public Astro worker never proxies arbitrary requests.
export class BookingCoordinator {
  private readonly coordination: BookingCoordination;

  constructor(state: { storage: CoordinationStorage }) {
    this.coordination = new BookingCoordination(state.storage);
  }

  alarm(): Promise<void> {
    return this.coordination.alarm();
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") return json({ error: "not_found" }, 404);
    const command = await request.json() as BookingCommand;
    try {
      switch (command.action) {
        case "create":
          return json(await createBooking(command.input, this.coordination));
        case "move":
          return json(await rescheduleBooking(
            this.coordination, command.id, command.start, command.message, command.requestId,
          ));
        case "confirm":
          return json(await this.coordination.edit(command.id, () => confirmBooking(command.id)));
        case "cancel":
          return json(await this.coordination.edit(command.id, async () => {
            const result = await cancelBooking(command.id, command.message);
            this.coordination.release(command.id);
            return result;
          }));
        default:
          return json({ error: "not_found" }, 404);
      }
    } catch (error) {
      if (error instanceof GoogleError && error.ambiguous) {
        return json({ error: "booking_in_progress" }, 503);
      }
      if (error instanceof BookingError || error instanceof CoordinationError ||
          error instanceof GoogleError || error instanceof ManageError) {
        return json({ error: error.code }, error.status);
      }
      return command.action === "create"
        ? json({ error: "server_error" }, 500)
        : json({ error: "booking_in_progress" }, 503);
    }
  }
}
