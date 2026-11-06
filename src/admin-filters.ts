export function matchesAppointment(
  booking: { status: string; date: string; name: string; email: string },
  filter: { status: string; from: string; to: string; search: string },
): boolean {
  const search = filter.search.trim();
  return (!filter.status || booking.status === filter.status) &&
    (!filter.from || booking.date >= filter.from) &&
    (!filter.to || booking.date <= filter.to) &&
    (!search || booking.name.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr")) ||
      booking.email.toLowerCase().includes(search.toLowerCase()));
}
