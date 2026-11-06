/**
 * Progressive calendar enhancement for Pekmen Studio.
 * Keeps the original ISO date input in the form; if scripting fails the browser picker remains.
 */
const locale = document.documentElement.lang === "de" ? "de-DE" : document.documentElement.lang === "en" ? "en-US" : "tr-TR";
const months = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" });
const weekdays = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + i)))
);
const labels = locale === "de-DE"
  ? { prev: "Vorheriger Monat", next: "Nächster Monat", today: "Heute", clear: "Löschen", choose: "Datum auswählen", invalid: "Bitte ein gültiges Datum wählen." }
  : locale === "en-US"
    ? { prev: "Previous month", next: "Next month", today: "Today", clear: "Clear", choose: "Choose date", invalid: "Choose a valid date." }
    : { prev: "Önceki ay", next: "Sonraki ay", today: "Bugün", clear: "Temizle", choose: "Tarih seç", invalid: "Geçerli bir tarih seçin." };

const iso = (d: Date) => [d.getUTCFullYear(), String(d.getUTCMonth() + 1).padStart(2, "0"), String(d.getUTCDate()).padStart(2, "0")].join("-");
const parseIso = (s: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const value = new Date(Date.UTC(y, m - 1, d));
  return value.getUTCFullYear() === y && value.getUTCMonth() === m - 1 && value.getUTCDate() === d ? value : null;
};
const todayIso = (): string => {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
};

for (const input of document.querySelectorAll<HTMLInputElement>(".studio-body input[type='date']")) {
  if (input.dataset.calendarEnhanced || input.disabled) continue;
  const label = input.closest("label");
  const fieldName = label?.textContent?.trim() || labels.choose;
  const host = document.createElement("div");
  host.className = "studio-date-control";
  const field = label ?? input;
  field.before(host);
  host.append(field);
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "studio-date-trigger";
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  const caption = document.createElement("span");
  caption.className = "studio-date-caption";
  const icon = document.createElement("span");
  icon.className = "studio-date-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "▦";
  trigger.append(caption, icon);
  host.append(trigger);

  const panel = document.createElement("div");
  panel.className = "studio-date-popover";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", fieldName);
  const head = document.createElement("div");
  head.className = "studio-date-head";
  const prev = document.createElement("button");
  prev.type = "button"; prev.textContent = "‹"; prev.setAttribute("aria-label", labels.prev);
  const heading = document.createElement("strong");
  heading.setAttribute("aria-live", "polite");
  const next = document.createElement("button");
  next.type = "button"; next.textContent = "›"; next.setAttribute("aria-label", labels.next);
  head.append(prev, heading, next);
  const grid = document.createElement("div");
  grid.className = "studio-date-grid";
  const foot = document.createElement("div");
  foot.className = "studio-date-foot";
  const goToday = document.createElement("button");
  goToday.type = "button"; goToday.textContent = labels.today;
  const clear = document.createElement("button");
  clear.type = "button"; clear.textContent = labels.clear;
  foot.append(goToday, clear);
  panel.append(head, grid, foot);
  host.append(panel);

  let view = parseIso(input.value) ?? parseIso(todayIso())!;
  const format = (value: string) => {
    const parsed = parseIso(value);
    return parsed ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed) : labels.choose;
  };
  const permitted = (date: string) => date
    ? (!input.min || date >= input.min) && (!input.max || date <= input.max)
    : !input.required;
  const error = document.createElement("span");
  error.className = "studio-date-error";
  error.setAttribute("role", "status");
  host.append(error);
  const sync = () => {
    caption.textContent = format(input.value);
    trigger.setAttribute("aria-label", `${fieldName}: ${caption.textContent}`);
    trigger.classList.toggle("is-empty", !input.value);
    const invalid = input.getAttribute("aria-invalid") === "true" || Boolean(error.textContent);
    trigger.setAttribute("aria-invalid", String(invalid));
    const description = input.getAttribute("aria-describedby");
    if (description) trigger.setAttribute("aria-describedby", description);
  };
  const close = (restoreFocus = false) => {
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus) trigger.focus();
  };
  const select = (value: string) => {
    if (!permitted(value)) return;
    input.value = value;
    error.textContent = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    sync(); close(true);
  };
  const render = () => {
    heading.textContent = months.format(view);
    grid.replaceChildren();
    for (const day of weekdays) {
      const cell = document.createElement("span");
      cell.className = "studio-date-weekday";
      cell.textContent = day;
      grid.append(cell);
    }
    const year = view.getUTCFullYear(), month = view.getUTCMonth();
    const firstOffset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
    const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    for (let i = 0; i < firstOffset; i++) {
      const gap = document.createElement("span");
      gap.setAttribute("aria-hidden", "true");
      grid.append(gap);
    }
    for (let day = 1; day <= count; day++) {
      const date = new Date(Date.UTC(year, month, day));
      const value = iso(date);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = String(day);
      btn.setAttribute("aria-label", new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }).format(date));
      btn.disabled = !permitted(value);
      btn.setAttribute("aria-pressed", String(value === input.value));
      if (value === todayIso()) btn.classList.add("is-today");
      btn.addEventListener("click", () => select(value));
      grid.append(btn);
    }
    const earliestNext = iso(new Date(Date.UTC(year, month + 1, 1)));
    const lastPrev = iso(new Date(Date.UTC(year, month, 0)));
    prev.disabled = Boolean(input.min && lastPrev < input.min);
    next.disabled = Boolean(input.max && earliestNext > input.max);
    goToday.disabled = !permitted(todayIso());
    clear.hidden = input.required;
  };

  trigger.addEventListener("click", () => {
    if (!panel.hidden) { close(); return; }
    document.querySelectorAll<HTMLElement>(".studio-date-popover").forEach((p) => { p.hidden = true; p.parentElement?.querySelector(".studio-date-trigger")?.setAttribute("aria-expanded", "false"); });
    const initial = input.value || todayIso();
    const bounded = input.min && initial < input.min ? input.min : input.max && initial > input.max ? input.max : initial;
    view = parseIso(bounded) ?? parseIso(todayIso())!;
    render(); panel.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    const focused = grid.querySelector<HTMLButtonElement>('button[aria-pressed="true"]:not(:disabled)') ?? grid.querySelector<HTMLButtonElement>("button:not(:disabled)");
    focused?.focus();
  });
  const changeMonth = (offset: number, control: HTMLButtonElement) => {
    view = new Date(Date.UTC(view.getUTCFullYear(), view.getUTCMonth() + offset, 1));
    render();
    (control.disabled ? grid.querySelector<HTMLButtonElement>("button:not(:disabled)") : control)?.focus();
  };
  prev.addEventListener("click", () => changeMonth(-1, prev));
  next.addEventListener("click", () => changeMonth(1, next));
  goToday.addEventListener("click", () => select(todayIso()));
  clear.addEventListener("click", () => select(""));
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); close(true); }
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (step && event.target instanceof HTMLButtonElement && grid.contains(event.target)) {
      const days = Array.from(grid.querySelectorAll<HTMLButtonElement>("button"));
      const target = days[days.indexOf(event.target) + step];
      event.preventDefault();
      if (target && !target.disabled) target.focus();
    }
    if (event.key === "Tab") {
      const focusable = Array.from(panel.querySelectorAll<HTMLButtonElement>("button:not([disabled]):not([hidden])"));
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!panel.hidden && !host.contains(event.target as Node) && !label?.contains(event.target as Node)) close();
  });
  input.addEventListener("change", sync);
  new MutationObserver(sync).observe(input, { attributes: true, attributeFilter: ["aria-invalid"] });
  input.addEventListener("invalid", (event) => {
    event.preventDefault();
    error.textContent = labels.invalid;
    sync();
    const form = input.form;
    if (!form || form.querySelector(":invalid") === input) trigger.focus();
  });
  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");
  input.dataset.calendarEnhanced = "true";
  sync();
}
