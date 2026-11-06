/// <reference types="astro/client" />

import type { Lang } from "./i18n/languages";
import type { BookingNamespace } from "./server/booking-binding";
import type { StudioDatabase } from "./server/studio-messages";

declare global {
  namespace App {
    interface Locals {
      /** Locale resolved by the middleware from the request path. */
      lang?: Lang;
      bookingCoordinator?: BookingNamespace;
      studioMessages?: StudioDatabase;
    }
  }
}

export {};
