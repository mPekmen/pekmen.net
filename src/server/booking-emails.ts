import { site } from "../data/site";
import { isLang, type Lang } from "../i18n/languages";
import {
  bookingConfig,
  contactRecipient,
  contactSender,
  isEmailConfigured,
} from "./config";
import { sendEmail } from "./email";
import { emailLayout, type EmailRow } from "./email-template";

export type BookingMail = {
  name: string;
  email: string;
  start: Date;
  end: Date;
  meetLink?: string;
  note?: string;
  message?: string;
  previousStart?: Date;
  lang?: string;
  pending?: boolean;
};

type Copy = {
  kicker: string;
  received: { subject: string; title: string; intro: string; footer: string };
  confirmed: { subject: string; title: string; intro: string; footer: string };
  rescheduled: {
    subject: string;
    title: string;
    intro: string;
    introPending: string;
    footer: string;
  };
  canceled: {
    subject: string;
    title: string;
    intro: string;
    introPending: string;
    footer: string;
  };
  labels: {
    when: string;
    previous: string;
    duration: string;
    where: string;
    note: string;
    message: string;
  };
  actions: { meet: string; rebook: string };
  duration: string;
  where: string;
};

const LOCALES: Record<Lang, string> = {
  en: "en-GB",
  tr: "tr-TR",
  de: "de-DE",
};

const COPY: Record<Lang, Copy> = {
  en: {
    kicker: "Booking",
    received: {
      subject: "Your call request",
      title: "Request received.",
      intro:
        "I'll check the time and confirm by email shortly. You'll get a separate confirmation with the meeting link.",
      footer: "Just reply to this email if you have a question.",
    },
    confirmed: {
      subject: "Your call is confirmed",
      title: "Your call is confirmed.",
      intro:
        "The call is on your calendar. Join with the link below when it's time.",
      footer: "See you on the call.",
    },
    rescheduled: {
      subject: "Your call has a new time",
      title: "A new time is set.",
      intro: "The call has been moved. Your previous time is below.",
      introPending:
        "Your requested time has been moved. Your previous time is below.",
      footer: "If the new time doesn't work, just reply to this email.",
    },
    canceled: {
      subject: "Your call was cancelled",
      title: "The call was cancelled.",
      intro: "The call on {when} has been cancelled.",
      introPending: "Your request for {when} has been cancelled.",
      footer: "You can pick a new time at pekmen.net/appointment.",
    },
    labels: {
      when: "When",
      previous: "Previous time",
      duration: "Duration",
      where: "Where",
      note: "Your note",
      message: "Message",
    },
    actions: { meet: "Google Meet", rebook: "Book another time" },
    duration: "30 minutes",
    where: "Google Meet",
  },
  tr: {
    kicker: "Randevu",
    received: {
      subject: "Randevu talebiniz alındı",
      title: "Talebiniz alındı.",
      intro:
        "Uygunluğu kontrol edip en kısa sürede onaylayacağım. Onaylandığında ayrıca e-posta alacaksınız.",
      footer: "Sorularınız için bu e-postayı yanıtlayabilirsiniz.",
    },
    confirmed: {
      subject: "Randevunuz onaylandı",
      title: "Randevunuz onaylandı.",
      intro:
        "Görüşme takviminize eklendi. Zamanı geldiğinde aşağıdaki bağlantıdan katılabilirsiniz.",
      footer: "Görüşmek üzere.",
    },
    rescheduled: {
      subject: "Randevunuz güncellendi",
      title: "Yeni bir saat ayarladık.",
      intro: "Görüşme saati güncellendi. Önceki saat aşağıda.",
      introPending:
        "Talep ettiğiniz saat güncellendi. Önceki saat aşağıda.",
      footer: "Yeni saat uymuyorsa bu e-postayı yanıtlayın.",
    },
    canceled: {
      subject: "Randevunuz iptal edildi",
      title: "Randevu iptal edildi.",
      intro: "{when} saatindeki görüşme iptal edildi.",
      introPending: "{when} için randevu talebiniz iptal edildi.",
      footer:
        "Yeni bir zaman seçmek için pekmen.net/appointment adresini kullanabilirsiniz.",
    },
    labels: {
      when: "Ne zaman",
      previous: "Önceki saat",
      duration: "Süre",
      where: "Nerede",
      note: "Notunuz",
      message: "Mesaj",
    },
    actions: { meet: "Google Meet", rebook: "Yeni randevu al" },
    duration: "30 dakika",
    where: "Google Meet",
  },
  de: {
    kicker: "Termin",
    received: {
      subject: "Ihre Terminanfrage",
      title: "Anfrage erhalten.",
      intro:
        "Ich prüfe die Zeit und bestätige sie in Kürze per E-Mail. Die Bestätigung enthält dann auch den Meeting-Link.",
      footer: "Bei Fragen antworten Sie einfach auf diese E-Mail.",
    },
    confirmed: {
      subject: "Ihr Termin ist bestätigt",
      title: "Ihr Termin ist bestätigt.",
      intro:
        "Der Termin steht in Ihrem Kalender. Nehmen Sie zum Termin über den Link unten teil.",
      footer: "Bis zum Termin.",
    },
    rescheduled: {
      subject: "Ihr Termin hat eine neue Zeit",
      title: "Neue Zeit gefunden.",
      intro: "Der Termin wurde verschoben. Die bisherige Zeit sehen Sie unten.",
      introPending:
        "Ihre angefragte Zeit wurde verschoben. Die bisherige Zeit sehen Sie unten.",
      footer: "Wenn die neue Zeit nicht passt, antworten Sie einfach.",
    },
    canceled: {
      subject: "Ihr Termin wurde abgesagt",
      title: "Der Termin wurde abgesagt.",
      intro: "Der Termin am {when} wurde abgesagt.",
      introPending: "Ihre Anfrage für {when} wurde storniert.",
      footer: "Unter pekmen.net/appointment können Sie eine neue Zeit wählen.",
    },
    labels: {
      when: "Wann",
      previous: "Bisherige Zeit",
      duration: "Dauer",
      where: "Wo",
      note: "Ihre Notiz",
      message: "Nachricht",
    },
    actions: { meet: "Google Meet", rebook: "Neuen Termin buchen" },
    duration: "30 Minuten",
    where: "Google Meet",
  },
};

function langOf(value: string | undefined): Lang {
  return isLang(value) ? value : "en";
}

function when(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALES[lang], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: bookingConfig().timeZone,
  }).format(date);
}

function shortWhen(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALES[lang], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: bookingConfig().timeZone,
  }).format(date);
}

function withSubject(subject: string, date: Date, lang: Lang): string {
  return `${subject} — ${shortWhen(date, lang)}`;
}

function rowsFor(
  data: BookingMail,
  copy: Copy,
  lang: Lang,
  includePrevious: boolean
): EmailRow[] {
  const rows: EmailRow[] = [];

  if (includePrevious && data.previousStart) {
    rows.push({
      label: copy.labels.previous,
      value: when(data.previousStart, lang),
    });
  }

  rows.push({ label: copy.labels.when, value: when(data.start, lang) });
  rows.push({ label: copy.labels.duration, value: copy.duration });
  rows.push({ label: copy.labels.where, value: copy.where });

  if (data.note) {
    rows.push({ label: copy.labels.note, value: data.note });
  }

  return rows;
}

function textBody(
  title: string,
  intro: string,
  rows: EmailRow[],
  footer: string,
  message?: string
): string {
  return [
    title,
    "",
    intro,
    "",
    ...rows.map((row) => `${row.label}: ${row.value}`),
    ...(message ? ["", message] : []),
    "",
    footer,
  ].join("\n");
}

async function deliver(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<boolean> {
  if (!isEmailConfigured()) return false;

  try {
    return await sendEmail({
      to: input.to,
      from: contactSender(),
      replyTo: input.replyTo ?? contactRecipient(),
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  } catch {
    return false;
  }
}

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

export function renderBookingReceived(data: BookingMail): RenderedEmail {
  const lang = langOf(data.lang);
  const copy = COPY[lang];
  const rows = rowsFor(data, copy, lang, false);

  return {
    subject: withSubject(copy.received.subject, data.start, lang),
    html: emailLayout({
      preheader: `${copy.received.title} — ${when(data.start, lang)}`,
      kicker: copy.kicker,
      title: copy.received.title,
      intro: copy.received.intro,
      rows,
      footer: copy.received.footer,
    }),
    text: textBody(
      copy.received.title,
      copy.received.intro,
      rows,
      copy.received.footer
    ),
  };
}

export function renderBookingConfirmed(data: BookingMail): RenderedEmail {
  const lang = langOf(data.lang);
  const copy = COPY[lang];
  const rows = rowsFor(data, copy, lang, false);

  return {
    subject: withSubject(copy.confirmed.subject, data.start, lang),
    html: emailLayout({
      preheader: `${copy.confirmed.title} — ${when(data.start, lang)}`,
      kicker: copy.kicker,
      title: copy.confirmed.title,
      intro: copy.confirmed.intro,
      rows,
      actions: data.meetLink
        ? [{ label: copy.actions.meet, href: data.meetLink }]
        : [],
      footer: copy.confirmed.footer,
    }),
    text:
      textBody(
        copy.confirmed.title,
        copy.confirmed.intro,
        rows,
        copy.confirmed.footer
      ) + (data.meetLink ? `\n\n${copy.actions.meet}: ${data.meetLink}` : ""),
  };
}

export function renderBookingRescheduled(data: BookingMail): RenderedEmail {
  const lang = langOf(data.lang);
  const copy = COPY[lang];
  const rows = rowsFor(data, copy, lang, true);
  const intro = data.pending ? copy.rescheduled.introPending : copy.rescheduled.intro;

  return {
    subject: withSubject(copy.rescheduled.subject, data.start, lang),
    html: emailLayout({
      preheader: `${copy.rescheduled.title} — ${when(data.start, lang)}`,
      kicker: copy.kicker,
      title: copy.rescheduled.title,
      intro,
      rows,
      quote: data.message,
      actions: data.meetLink
        ? [{ label: copy.actions.meet, href: data.meetLink }]
        : [],
      footer: copy.rescheduled.footer,
    }),
    text:
      textBody(
        copy.rescheduled.title,
        intro,
        rows,
        copy.rescheduled.footer,
        data.message
      ) + (data.meetLink ? `\n\n${copy.actions.meet}: ${data.meetLink}` : ""),
  };
}

export function renderBookingCanceled(data: BookingMail): RenderedEmail {
  const lang = langOf(data.lang);
  const copy = COPY[lang];
  const template = data.pending ? copy.canceled.introPending : copy.canceled.intro;
  const intro = template.replace("{when}", when(data.start, lang));

  return {
    subject: withSubject(copy.canceled.subject, data.start, lang),
    html: emailLayout({
      preheader: `${copy.canceled.title} — ${when(data.start, lang)}`,
      kicker: copy.kicker,
      title: copy.canceled.title,
      intro,
      quote: data.message,
      actions: [
        { label: copy.actions.rebook, href: `${site.url}/appointment` },
      ],
      footer: copy.canceled.footer,
    }),
    text:
      textBody(copy.canceled.title, intro, [], copy.canceled.footer, data.message) +
      `\n\n${copy.actions.rebook}: ${site.url}/appointment`,
  };
}

export function renderOwnerNewBooking(data: BookingMail): RenderedEmail {
  const lang = langOf(data.lang);
  const rows: EmailRow[] = [
    { label: "Name", value: data.name },
    { label: "Email", value: data.email, href: `mailto:${data.email}` },
    { label: "When", value: when(data.start, lang) },
    ...(data.note ? [{ label: "Note", value: data.note }] : []),
  ];

  return {
    subject: `New request — ${data.name} — ${shortWhen(data.start, lang)}`,
    html: emailLayout({
      preheader: `${data.name} — ${shortWhen(data.start, lang)}`,
      kicker: "New request",
      title: `${data.name} requested a call`,
      intro:
        "The slot is held in Google Calendar and is waiting for your confirmation.",
      rows,
      actions: [
        { label: "Open panel", href: `${site.url}/admin` },
        ...(data.meetLink
          ? [{ label: "Google Meet", href: data.meetLink }]
          : []),
      ],
      footer: "Confirm, move or cancel the request from the panel.",
    }),
    text: textBody(
      `${data.name} requested a call`,
      "The slot is held in Google Calendar and is waiting for your confirmation.",
      rows,
      "Confirm, move or cancel the request from the panel."
    ),
  };
}

export async function sendBookingReceived(data: BookingMail): Promise<boolean> {
  return deliver({ to: data.email, ...renderBookingReceived(data) });
}

export async function sendBookingConfirmed(data: BookingMail): Promise<boolean> {
  return deliver({ to: data.email, ...renderBookingConfirmed(data) });
}

export async function sendBookingRescheduled(
  data: BookingMail
): Promise<boolean> {
  return deliver({ to: data.email, ...renderBookingRescheduled(data) });
}

export async function sendBookingCanceled(data: BookingMail): Promise<boolean> {
  return deliver({ to: data.email, ...renderBookingCanceled(data) });
}

export async function sendOwnerNewBooking(data: BookingMail): Promise<boolean> {
  return deliver({
    to: contactRecipient(),
    replyTo: data.email,
    ...renderOwnerNewBooking(data),
  });
}
