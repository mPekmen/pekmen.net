import type { Lang } from "./languages";

const strings = {
  "İçeriğe geç": {
    "en": "Skip to content",
    "de": "Zum Inhalt"
  },
  "Yönetim paneli": {
    "en": "Administration",
    "de": "Verwaltung"
  },
  "Yönetim bölümleri": {
    "en": "Studio navigation",
    "de": "Studio-Navigation"
  },
  "Siteye dön": {
    "en": "Back to site",
    "de": "Zur Website"
  },
  "Çıkış yap": {
    "en": "Sign out",
    "de": "Abmelden"
  },
  "Takvim erişilebilir": {
    "en": "Calendar reachable",
    "de": "Kalender erreichbar"
  },
  "Yapılandırılmamış": {
    "en": "Not configured",
    "de": "Nicht eingerichtet"
  },
  "Takvim okunamadı": {
    "en": "Could not read calendar",
    "de": "Kalender konnte nicht gelesen werden"
  },
  "Google Takvim bağlantısı yapılandırılmamış.": {
    "en": "Google Calendar is not configured.",
    "de": "Google Kalender ist nicht eingerichtet."
  },
  "Google Takvim okunamadı. Bağlantıyı yenileyerek tekrar deneyin.": {
    "en": "Could not read Google Calendar. Refresh and try again.",
    "de": "Google Kalender konnte nicht gelesen werden. Bitte erneut aktualisieren."
  },
  "Panelin güvenlik yapılandırması tamamlanmamış.": {
    "en": "Studio security setup is incomplete.",
    "de": "Die Sicherheitseinrichtung ist unvollständig."
  },
  "Şifre yanlış. Tekrar deneyin.": {
    "en": "Incorrect password. Try again.",
    "de": "Falsches Passwort. Bitte erneut versuchen."
  },
  "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin.": {
    "en": "Too many attempts. Try again in a few minutes.",
    "de": "Zu viele Versuche. Bitte in einigen Minuten erneut versuchen."
  },
  "Oturum sona erdi. Yeniden giriş yapın.": {
    "en": "Your session expired. Sign in again.",
    "de": "Die Sitzung ist abgelaufen. Bitte erneut anmelden."
  },
  "Giriş formunun süresi doldu. Yeniden deneyin.": {
    "en": "The sign-in form expired. Try again.",
    "de": "Das Anmeldeformular ist abgelaufen. Bitte erneut versuchen."
  },
  "İptali randevu ayrıntılarından açıkça onaylayın.": {
    "en": "Confirm cancellation from the appointment details.",
    "de": "Bitte die Absage in den Termindetails bestätigen."
  },
  "Geçersiz kayıt.": {
    "en": "Invalid record.",
    "de": "Ungültiger Eintrag."
  },
  "Randevu bulunamadı. İptal edilmiş olabilir.": {
    "en": "Appointment not found. It may have been canceled.",
    "de": "Termin nicht gefunden. Er wurde möglicherweise abgesagt."
  },
  "Takvim işleminin sonucu henüz doğrulanmadı. Biraz sonra tekrar kontrol edin.": {
    "en": "The calendar change is still unverified. Check again shortly.",
    "de": "Die Kalenderänderung ist noch unbestätigt. Bitte gleich erneut prüfen."
  },
  "Seçilen saat artık müsait değil. Başka bir saat seçin.": {
    "en": "That time is no longer available. Choose another.",
    "de": "Diese Uhrzeit ist nicht mehr frei. Bitte eine andere wählen."
  },
  "Geçerli bir saat seçin.": {
    "en": "Choose a valid time.",
    "de": "Bitte eine gültige Uhrzeit wählen."
  },
  "Katılımcının e-posta adresi bulunamadı.": {
    "en": "The guest’s email address is missing.",
    "de": "Die E-Mail-Adresse des Gasts fehlt."
  },
  "Google Takvim bağlantısı doğrulanamadı.": {
    "en": "Could not verify the Google Calendar connection.",
    "de": "Die Verbindung zu Google Kalender konnte nicht geprüft werden."
  },
  "Google Takvim isteği reddedildi.": {
    "en": "Google Calendar rejected the request.",
    "de": "Google Kalender hat die Anfrage abgelehnt."
  },
  "Randevu koordinatörü yapılandırılmamış.": {
    "en": "The booking coordinator is not configured.",
    "de": "Die Terminkoordination ist nicht eingerichtet."
  },
  "Randevu onaylanamadı.": {
    "en": "Could not confirm the appointment.",
    "de": "Der Termin konnte nicht bestätigt werden."
  },
  "Randevu güncellenemedi.": {
    "en": "Could not update the appointment.",
    "de": "Der Termin konnte nicht geändert werden."
  },
  "Randevu iptal edilemedi.": {
    "en": "Could not cancel the appointment.",
    "de": "Der Termin konnte nicht abgesagt werden."
  },
  "Randevu takvimde onaylandı.": {
    "en": "Appointment confirmed in the calendar.",
    "de": "Der Termin wurde im Kalender bestätigt."
  },
  "Randevunun yeni saati takvimde kayıtlı.": {
    "en": "The new time is saved in the calendar.",
    "de": "Die neue Uhrzeit wurde im Kalender gespeichert."
  },
  "Randevu takvimde iptal edildi.": {
    "en": "Appointment canceled in the calendar.",
    "de": "Der Termin wurde im Kalender abgesagt."
  },
  "Bu randevu zaten takvimde onaylı.": {
    "en": "This appointment is already confirmed.",
    "de": "Dieser Termin ist bereits bestätigt."
  },
  "E-posta gönderilemedi. Katılımcıya elle haber vermeniz gerekebilir.": {
    "en": "Email could not be sent. You may need to notify the guest directly.",
    "de": "Die E-Mail konnte nicht gesendet werden. Bitte informieren Sie den Gast gegebenenfalls direkt."
  },
  "Bildirim e-posta sağlayıcısına iletildi.": {
    "en": "The email provider accepted the notification.",
    "de": "Der E-Mail-Anbieter hat die Benachrichtigung angenommen."
  },
  "Yeni bir bildirim e-postası gönderilmedi.": {
    "en": "No new notification email was sent.",
    "de": "Es wurde keine neue Benachrichtigung gesendet."
  },
  "Giriş — Pekmen Studio": {
    "en": "Sign in — Pekmen Studio",
    "de": "Anmeldung — Pekmen Studio"
  },
  "Özel alan": {
    "en": "Private area",
    "de": "Privater Bereich"
  },
  "Panele giriş": {
    "en": "Sign in to Studio",
    "de": "Bei Studio anmelden"
  },
  "Kurulum gerekli": {
    "en": "Setup required",
    "de": "Einrichtung erforderlich"
  },
  "Randevularınızı yönetmek için giriş yapın.": {
    "en": "Sign in to manage your site.",
    "de": "Melden Sie sich an, um Ihre Website zu verwalten."
  },
  "Yönetici oturumu için sunucu yapılandırmasını kontrol edin.": {
    "en": "Check the server configuration for admin sign-in.",
    "de": "Prüfen Sie die Serverkonfiguration für die Anmeldung."
  },
  "Şifre": {
    "en": "Password",
    "de": "Passwort"
  },
  "Giriş yap": {
    "en": "Sign in",
    "de": "Anmelden"
  },
  "Yenile": {
    "en": "Refresh",
    "de": "Aktualisieren"
  },
  "Son başarılı kontrol bilgisi yok.": {
    "en": "No successful check recorded.",
    "de": "Keine erfolgreiche Prüfung erfasst."
  },
  "Son başarılı güncelleme": {
    "en": "Last successful check",
    "de": "Letzte erfolgreiche Prüfung"
  },
  "Onay bekleyen": {
    "en": "Awaiting approval",
    "de": "Warten auf Bestätigung"
  },
  "Bekleyenleri aç": {
    "en": "View pending",
    "de": "Offene Anfragen anzeigen"
  },
  "Onaylı randevular": {
    "en": "Confirmed appointments",
    "de": "Bestätigte Termine"
  },
  "Randevuları aç": {
    "en": "View appointments",
    "de": "Termine anzeigen"
  },
  "Sıradaki görüşme": {
    "en": "Next meeting",
    "de": "Nächstes Gespräch"
  },
  "Onaylı görüşme yok": {
    "en": "No confirmed meeting",
    "de": "Kein bestätigtes Gespräch"
  },
  "Onay kuyruğu": {
    "en": "Pending requests",
    "de": "Offene Anfragen"
  },
  "Onaylandığında katılımcıya bildirim gönderilmeye çalışılır.": {
    "en": "Confirmation attempts to notify the guest by email.",
    "de": "Bei der Bestätigung wird versucht, den Gast per E-Mail zu benachrichtigen."
  },
  "Onay bekleyen talep yok.": {
    "en": "No pending requests.",
    "de": "Keine offenen Anfragen."
  },
  "Tüm bekleyen talepler": {
    "en": "All pending requests",
    "de": "Alle offenen Anfragen"
  },
  "Yaklaşan görüşmeler": {
    "en": "Upcoming meetings",
    "de": "Anstehende Gespräche"
  },
  "Onaylanmış randevular, tarih sırasıyla.": {
    "en": "Confirmed appointments in date order.",
    "de": "Bestätigte Termine nach Datum."
  },
  "Yaklaşan onaylı görüşme yok.": {
    "en": "No upcoming confirmed meetings.",
    "de": "Keine anstehenden bestätigten Gespräche."
  },
  "Randevu listesi": {
    "en": "Appointment list",
    "de": "Terminliste"
  },
  "Yaklaşan kayıtlar": {
    "en": "Upcoming appointments",
    "de": "Anstehende Termine"
  },
  "Arama": {
    "en": "Search",
    "de": "Suche"
  },
  "İsim veya e-posta": {
    "en": "Name or email",
    "de": "Name oder E-Mail"
  },
  "Durum": {
    "en": "Status",
    "de": "Status"
  },
  "Tümü": {
    "en": "All",
    "de": "Alle"
  },
  "Onay bekliyor": {
    "en": "Pending",
    "de": "Offen"
  },
  "Onaylandı": {
    "en": "Confirmed",
    "de": "Bestätigt"
  },
  "Başlangıç": {
    "en": "From",
    "de": "Von"
  },
  "Bitiş": {
    "en": "To",
    "de": "Bis"
  },
  "Temizle": {
    "en": "Clear",
    "de": "Zurücksetzen"
  },
  "Bu filtrelerle eşleşen randevu yok.": {
    "en": "No appointments match these filters.",
    "de": "Keine Termine entsprechen den Filtern."
  },
  "Yaklaşan randevu yok.": {
    "en": "No upcoming appointments.",
    "de": "Keine anstehenden Termine."
  },
  "Bağlantılar": {
    "en": "Connections",
    "de": "Verbindungen"
  },
  "Bu panelin doğrulayabildiği sistem bilgileri.": {
    "en": "System information verified by this panel.",
    "de": "Systeminformationen, die dieses Panel prüfen kann."
  },
  "Google Takvim": {
    "en": "Google Calendar",
    "de": "Google Kalender"
  },
  "Son başarılı takvim okuması": {
    "en": "Last successful calendar check",
    "de": "Letzte erfolgreiche Kalenderprüfung"
  },
  "Bilgi yok": {
    "en": "Unavailable",
    "de": "Nicht verfügbar"
  },
  "Panel sunucusu": {
    "en": "Studio server",
    "de": "Studio-Server"
  },
  "Bu isteğe yanıt verdi": {
    "en": "Responded to this request",
    "de": "Hat auf diese Anfrage geantwortet"
  },
  "Randevu koordinatörü": {
    "en": "Booking coordinator",
    "de": "Terminkoordination"
  },
  "Yapılandırma mevcut": {
    "en": "Configured",
    "de": "Eingerichtet"
  },
  "E-posta sağlayıcısı": {
    "en": "Email provider",
    "de": "E-Mail-Anbieter"
  },
  "Yapılandırılmış · teslimat ölçülmedi": {
    "en": "Configured · delivery unverified",
    "de": "Eingerichtet · Zustellung ungeprüft"
  },
  "Rezervasyon kuralları": {
    "en": "Booking rules",
    "de": "Buchungsregeln"
  },
  "Sitede uygulanan çalışma saatleri ve sınırlar.": {
    "en": "The hours and limits used on the site.",
    "de": "Öffnungszeiten und Grenzen für Buchungen auf der Website."
  },
  "Saat dilimi": {
    "en": "Time zone",
    "de": "Zeitzone"
  },
  "Çalışma günleri": {
    "en": "Working days",
    "de": "Arbeitstage"
  },
  "Çalışma saatleri": {
    "en": "Working hours",
    "de": "Arbeitszeiten"
  },
  "Görüşme / tampon": {
    "en": "Meeting / buffer",
    "de": "Gespräch / Puffer"
  },
  "Talep süresi / ileri tarih sınırı": {
    "en": "Minimum notice / booking horizon",
    "de": "Vorlaufzeit / Buchungshorizont"
  },
  "Yönetici uyarıları": {
    "en": "Admin notices",
    "de": "Hinweise"
  },
  "Randevu yazma işlemleri için koordinatör yapılandırması gerekli.": {
    "en": "Booking changes require a configured coordinator.",
    "de": "Terminänderungen erfordern eine eingerichtete Koordination."
  },
  "Bildirim e-postası göndermek için sağlayıcı yapılandırması gerekli.": {
    "en": "Email notifications require a configured provider.",
    "de": "E-Mail-Benachrichtigungen erfordern einen eingerichteten Anbieter."
  },
  "Onayla": {
    "en": "Confirm",
    "de": "Bestätigen"
  },
  "Ayrıntılar ve işlemler": {
    "en": "Details and actions",
    "de": "Details und Aktionen"
  },
  "Google Takvim ↗": {
    "en": "Google Calendar ↗",
    "de": "Google Kalender ↗"
  },
  "Tarihi değiştir": {
    "en": "Reschedule",
    "de": "Termin verschieben"
  },
  "Tarih": {
    "en": "Date",
    "de": "Datum"
  },
  "Saat": {
    "en": "Time",
    "de": "Uhrzeit"
  },
  "Tarih seçin": {
    "en": "Choose a date",
    "de": "Datum wählen"
  },
  "Katılımcıya not (isteğe bağlı)": {
    "en": "Note to guest (optional)",
    "de": "Nachricht an den Gast (optional)"
  },
  "Yeni saati gönder": {
    "en": "Save new time",
    "de": "Neue Uhrzeit speichern"
  },
  "Müsait saatler listelenir.": {
    "en": "Available times will appear here.",
    "de": "Freie Uhrzeiten werden hier angezeigt."
  },
  "İptal et": {
    "en": "Cancel appointment",
    "de": "Termin absagen"
  },
  "Randevu takvimden kaldırılır ve katılımcıya bildirim gönderilmeye çalışılır.": {
    "en": "The appointment will be removed from the calendar and an email notification will be attempted.",
    "de": "Der Termin wird aus dem Kalender entfernt. Anschließend wird versucht, den Gast zu benachrichtigen."
  },
  "Vazgeç": {
    "en": "Keep appointment",
    "de": "Termin behalten"
  },
  "İptali onayla": {
    "en": "Confirm cancellation",
    "de": "Absage bestätigen"
  },
  "Yükleniyor…": {
    "en": "Loading…",
    "de": "Wird geladen…"
  },
  "Müsait saatler kontrol ediliyor…": {
    "en": "Checking available times…",
    "de": "Freie Uhrzeiten werden geprüft…"
  },
  "Boş saat yok": {
    "en": "No times available",
    "de": "Keine freien Uhrzeiten"
  },
  "Bu gün için boş saat yok. Başka bir tarih seçin.": {
    "en": "No times are available on this date. Choose another.",
    "de": "An diesem Tag sind keine Zeiten frei. Bitte ein anderes Datum wählen."
  },
  "Saat seçin": {
    "en": "Choose a time",
    "de": "Uhrzeit wählen"
  },
  "Yüklenemedi": {
    "en": "Could not load",
    "de": "Laden fehlgeschlagen"
  },
  "Müsaitlik yüklenemedi. Sayfayı yenileyip tekrar deneyin.": {
    "en": "Could not load availability. Refresh and try again.",
    "de": "Verfügbare Zeiten konnten nicht geladen werden. Bitte erneut aktualisieren."
  },
  "Bitiş tarihi başlangıçtan önce olamaz.": {
    "en": "The end date must not precede the start date.",
    "de": "Das Enddatum darf nicht vor dem Startdatum liegen."
  },
  "İşlem sürüyor…": {
    "en": "Working…",
    "de": "Wird verarbeitet…"
  },
  "Takvim yenileniyor…": {
    "en": "Refreshing calendar…",
    "de": "Kalender wird aktualisiert…"
  },
  "Takvim yenilenemedi.": {
    "en": "Could not refresh the calendar.",
    "de": "Der Kalender konnte nicht aktualisiert werden."
  },
  "Takvim durumu doğrulanamadı": {
    "en": "Calendar status unverified",
    "de": "Kalenderstatus ungeprüft"
  },
  "Yayındaki projeler": {
    "en": "Published projects",
    "de": "Veröffentlichte Projekte"
  },
  "Sistem durumu": {
    "en": "System status",
    "de": "Systemstatus"
  },
  "Okunmamış mesajlar": {
    "en": "Unread messages",
    "de": "Ungelesene Nachrichten"
  },
  "Dil": {
    "en": "Language",
    "de": "Sprache"
  },
  "randevu": {
    "en": "appointments",
    "de": "Termine"
  },
  "boş saat": {
    "en": "available times",
    "de": "freie Uhrzeiten"
  },
  "dakika": {
    "en": "minutes",
    "de": "Minuten"
  },
  "saat": {
    "en": "hours",
    "de": "Stunden"
  },
  "gün": {
    "en": "days",
    "de": "Tage"
  }
} satisfies Record<string, Record<Exclude<Lang,"tr">, string>>;

export function studioT(lang: Lang) {
  return (text: keyof typeof strings): string => lang === "tr" ? text : strings[text][lang];
}
