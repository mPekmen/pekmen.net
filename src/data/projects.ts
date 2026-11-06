export type Lang = "en" | "tr" | "de";

export type Localized = Record<Lang, string>;

export type ProjectSection = {
  title: Localized;
  body: Localized;
};

export type ProjectScreen = {
  src: string;
  srcset?: string;
  width: number;
  height: number;
  alt: Localized;
  caption: Localized;
};

export type Project = {
  slug: string;
  index: string;
  title: string;
  category: Localized;
  year: string;
  role: Localized;
  summary: Localized;
  short?: Localized;
  tagline: Localized;
  overview: Localized;
  tags: string[];
  live?: string;
  image?: string;
  imageAlt: Localized;
  imageCaption?: Localized;
  screens?: ProjectScreen[];
  domain?: string;
  archived?: boolean;
  appStore?: string;
  playStore?: string;
  repo?: string;
  sections: ProjectSection[];
};

const projectList: Project[] = [
  {
    slug: "barber",
    index: "01",
    title: "BarBer",
    category: { en: "Booking platform", tr: "Randevu platformu", de: "Buchungsplattform" },
    year: "2025",
    role: {
      en: "Product design & full-stack development",
      tr: "Ürün tasarımı & full-stack geliştirme",
      de: "Produktdesign & Full-Stack-Entwicklung",
    },
    summary: {
      en: "A booking platform for salons, with a discovery map, live queues and online payments.",
      tr: "Salon keşif haritası, canlı sıra takibi ve çevrimiçi ödeme sunan bir randevu platformu.",
      de: "Eine Buchungsplattform für Salons mit Kartensuche, Live-Warteschlange und Online-Zahlung.",
    },
    short: {
      en: "An online booking app for hairdressers, barbers and massage salons.",
      tr: "Kuaför, berber ve masaj salonları için online randevu uygulaması.",
      de: "Eine Online-Buchungs-App für Friseure, Barbiere und Massagesalons.",
    },
    tagline: {
      en: "Find a salon, pick a time, pay for it — and follow your place in the queue from the screen.",
      tr: "Salonunu bul, saatini seç, ödemesini yap — sıranı da ekrandan takip et.",
      de: "Salon finden, Zeit wählen, bezahlen — und den Platz in der Warteschlange am Bildschirm verfolgen.",
    },
    overview: {
      en: "BarBer lets you book a haircut without calling anyone. Find a salon near you, choose the service and the time, pay on the same screen. When you get there, you follow your place in the queue from your phone instead of asking at the desk.",
      tr: "BarBer, berber ve kuaför salonlarından telefonla uğraşmadan randevu almanı sağlıyor. Yakınındaki salonu buluyor, hizmeti ve saati seçiyorsun, ödemeyi de aynı ekranda yapıyorsun. Salona gittiğinde sıranı kasada sormak yerine telefonundan takip ediyorsun.",
      de: "Mit BarBer buchst du einen Termin, ohne irgendwo anzurufen. Salon in der Nähe finden, Leistung und Uhrzeit wählen, auf demselben Bildschirm bezahlen. Vor Ort verfolgst du deinen Platz in der Warteschlange am Handy, statt an der Theke zu fragen.",
    },
    tags: ["Flutter", "Supabase", "PostgreSQL", "PayTR"],
    live: "https://barberapp.tech",
    appStore: "https://apps.apple.com/us/app/barber-salon-ve-randevu/id6779294470",
    playStore: "https://play.google.com/store/apps/details?id=com.barberyazilim.barbernow",
    image: "/projects/barber.webp",
    imageAlt: {
      en: "BarBer website with a salon search form and featured salons",
      tr: "Salon arama formu ve öne çıkan salonları gösteren BarBer sitesi",
      de: "BarBer-Website mit Salonsuche und ausgewählten Salons",
    },
    // Published iPhone previews from the official App Store listing above.
    screens: [
      {
        src: "/projects/barber-discovery.webp",
        srcset: "/projects/barber-discovery-300.webp 300w, /projects/barber-discovery.webp 600w",
        width: 600,
        height: 1298,
        alt: {
          en: "BarBer on iPhone showing a nearby salon map and shortcuts to appointments",
          tr: "iPhone’da yakındaki salonların haritasını ve randevu kısayollarını gösteren BarBer",
          de: "BarBer auf dem iPhone mit einer Karte naher Salons und Schnellzugriff auf Termine",
        },
        caption: { en: "Discover nearby salons", tr: "Yakındaki salonları keşfet", de: "Salons in der Nähe entdecken" },
      },
      {
        src: "/projects/barber-queue.webp",
        srcset: "/projects/barber-queue-300.webp 300w, /projects/barber-queue.webp 600w",
        width: 600,
        height: 1298,
        alt: {
          en: "BarBer live queue screen telling the customer it is their turn",
          tr: "Müşteriye sıranın kendisinde olduğunu gösteren BarBer canlı sıra ekranı",
          de: "BarBer-Live-Warteschlange mit dem Hinweis, dass die Kundin oder der Kunde an der Reihe ist",
        },
        caption: { en: "Follow the live queue", tr: "Sıranı canlı takip et", de: "Die Warteschlange live verfolgen" },
      },
    ],
    domain: "barberapp.tech",
    sections: [
      {
        title: {
          en: "Payment and appointment together",
          tr: "Ödeme ile randevu bir arada",
          de: "Zahlung und Termin zusammen",
        },
        body: {
          en: "Choosing a service opens the payment step right away. When the payment goes through, that time is held for you; if it is interrupted, the slot is released again. So neither “I paid but have no appointment” nor “the time is booked but the payment is missing” can happen.",
          tr: "Hizmeti seçtiğinde ödeme adımı hemen açılıyor. Ödeme tamamlanınca o saat senin adına ayrılıyor; yarıda kalırsa saat yeniden boşa çıkıyor. Yani “ödedim ama randevu yok” ya da “saat ayrıldı ama ödeme görünmüyor” gibi bir karışıklık olmuyor.",
          de: "Mit der Leistungswahl öffnet sich direkt der Zahlungsschritt. Geht die Zahlung durch, ist die Zeit für dich reserviert; bricht sie ab, wird sie wieder frei. „Bezahlt, aber keinen Termin“ oder „Termin reserviert, aber keine Zahlung“ kann also nicht passieren.",
        },
      },
      {
        title: {
          en: "You can see your place",
          tr: "Sıranı ekrandan görüyorsun",
          de: "Du siehst deinen Platz",
        },
        body: {
          en: "When the queue moves in the salon, your screen updates on its own — no refresh needed. You see how many people are ahead of you, and the display inside the salon shows the same number.",
          tr: "Salonda sıra ilerledikçe telefonundaki ekran kendiliğinden güncelleniyor; sayfayı yenilemen gerekmiyor. Önünde kaç kişi olduğunu görüyorsun, salonun içindeki ekranda da aynı sıra yazıyor.",
          de: "Bewegt sich die Warteschlange im Salon, aktualisiert sich dein Bildschirm von selbst — kein Neuladen nötig. Du siehst, wie viele vor dir dran sind, und im Salon steht dieselbe Nummer.",
        },
      },
      {
        title: {
          en: "The same on phone and computer",
          tr: "Telefonda da bilgisayarda da aynı",
          de: "Gleich am Handy und am Rechner",
        },
        body: {
          en: "One app runs on the phone and in the browser, and appointments, queue and payments are kept in one place. Adding a new feature does not mean building it twice for two platforms.",
          tr: "Uygulama hem telefonda hem tarayıcıda aynı şekilde çalışıyor; randevular, sıra ve ödemeler tek yerde tutuluyor. Yeni bir özellik eklerken aynı işi her platform için yeniden yapmak gerekmiyor.",
          de: "Eine App läuft am Handy und im Browser; Termine, Warteschlange und Zahlungen liegen an einer Stelle. Ein neues Feature muss nicht für jede Plattform neu gebaut werden.",
        },
      },
    ],
  },
  {
    slug: "boyaci",
    index: "02",
    title: "boyacı.net",
    category: { en: "Local business site", tr: "Yerel işletme sitesi", de: "Website für einen lokalen Betrieb" },
    year: "2026",
    role: {
      en: "Design & development",
      tr: "Tasarım & geliştirme",
      de: "Design & Entwicklung",
    },
    summary: {
      en: "A site for a painter in Maltepe, with services, prices, work photos and contact details.",
      tr: "Maltepe’deki bir boyacı için hizmetleri, fiyatları, iş fotoğraflarını ve iletişim bilgilerini bir araya getiren site.",
      de: "Eine Website für einen Maler in Maltepe mit Leistungen, Preisen, Arbeitsfotos und Kontaktdaten.",
    },
    short: {
      en: "A brochure and contact site for a painter in Maltepe.",
      tr: "Maltepe'deki bir boyacının tanıtım ve iletişim sitesi.",
      de: "Eine Präsentations- und Kontaktseite für einen Maler in Maltepe.",
    },
    tagline: {
      en: "See what the painter offers, check prices and get in touch from one page.",
      tr: "Hizmetleri incele, fiyatlara bak ve boyacıya aynı sayfadan ulaş.",
      de: "Leistungen ansehen, Preise prüfen und den Maler direkt von derselben Seite kontaktieren.",
    },
    overview: {
      en: "Made for a painter working in Maltepe. A customer opens the site and immediately sees the services, the prices, photos of finished work and a phone number — no wandering through ten pages to find the answer. That is why it is small: four clear sections and nothing standing in between.",
      tr: "Maltepe'de çalışan bir boyacı için yapıldı. Müşteri siteye girdiğinde hizmetleri, fiyatları, yapılan işlerin fotoğraflarını ve telefon numarasını hemen görüyor; cevabı bulmak için on sayfa dolaşmıyor. Site bu yüzden küçük: dört net bölüm ve arada duran hiçbir şey yok.",
      de: "Gemacht für einen Malerbetrieb in Maltepe. Kundinnen öffnen die Seite und sehen sofort Leistungen, Preise, Fotos erledigter Arbeiten und eine Telefonnummer — ohne zehn Seiten durchzuklicken. Deshalb ist sie klein: vier klare Bereiche und nichts dazwischen.",
    },
    tags: ["Astro", "TypeScript", "Local SEO"],
    live: "https://xn--boyac-r4a.net",
    image: "/projects/boyaci.webp",
    imageAlt: {
      en: "boyacı.net homepage with a price summary, contact button and list of painting services",
      tr: "Fiyat özeti, iletişim düğmesi ve boya hizmetlerini gösteren boyacı.net ana sayfası",
      de: "boyacı.net-Startseite mit Preisübersicht, Kontakt-Schaltfläche und Malerleistungen",
    },
    domain: "boyacı.net",
    sections: [
      {
        title: {
          en: "Built for mobile browsing",
          tr: "Telefonda gezinmeye uygun",
          de: "Für den Aufruf am Handy gestaltet",
        },
        body: {
          en: "The mobile layout puts prices and contact options near the top, with service photos further down the page.",
          tr: "Mobil yerleşimde fiyatlar ve iletişim seçenekleri üstte, hizmet fotoğrafları ise sayfanın devamında yer alıyor.",
          de: "In der mobilen Ansicht stehen Preise und Kontaktmöglichkeiten weit oben. Fotos der Arbeiten folgen weiter unten.",
        },
      },
      {
        title: {
          en: "Clear local search information",
          tr: "Yerel arama için açık bilgiler",
          de: "Klare Angaben für die lokale Suche",
        },
        body: {
          en: "The page title and description name the painting service and its location so visitors can tell whether the business serves their area.",
          tr: "Sayfa başlığı ve açıklaması, ziyaretçilerin işletmenin kendi bölgelerine hizmet verip vermediğini anlayabilmesi için boya hizmetini ve konumu belirtiyor.",
          de: "Seitentitel und Beschreibung nennen die Malerleistung und den Ort. So erkennen Besucher, ob der Betrieb in ihrer Gegend arbeitet.",
        },
      },
      {
        title: {
          en: "One thumb is enough",
          tr: "Telefonla tek elle",
          de: "Eine Hand reicht",
        },
        body: {
          en: "This is not a one-page business card: services, prices, gallery and contact each have their own place. The menu and the call button sit where a thumb reaches without stretching.",
          tr: "Site tek sayfalık bir kartvizit değil: hizmetler, fiyatlar, galeri ve iletişim ayrı ayrı duruyor. Menü ve “ara” butonu başparmağın uzanmadan ulaştığı yerde.",
          de: "Das ist keine einseitige Visitenkarte: Leistungen, Preise, Galerie und Kontakt haben jeweils ihren Platz. Menü und Anruf-Button liegen dort, wo der Daumen sie ohne Strecken erreicht.",
        },
      },
    ],
  },
  {
    slug: "pekmen-net",
    index: "03",
    title: "pekmen.net",
    category: { en: "Personal portfolio", tr: "Kişisel portfolyo", de: "Persönliches Portfolio" },
    year: "2021",
    role: {
      en: "Design & development",
      tr: "Tasarım & geliştirme",
      de: "Design & Entwicklung",
    },
    summary: {
      en: "This site: a Swiss grid, two colours and as little JavaScript as possible. Built with Astro.",
      tr: "Bu site: İsviçre ızgarası, iki renk ve mümkün olduğunca az JavaScript. Astro ile yapıldı.",
      de: "Diese Seite: Schweizer Raster, zwei Farben und so wenig JavaScript wie möglich. Gebaut mit Astro.",
    },
    short: {
      en: "This portfolio: two colours, minimal JavaScript, built with Astro.",
      tr: "Bu portfolyo: iki renk, minimum JavaScript, Astro ile.",
      de: "Dieses Portfolio: zwei Farben, minimales JavaScript, mit Astro.",
    },
    tagline: {
      en: "This is my corner: one grid, two colours, nothing extra.",
      tr: "Burası benim köşem: tek ızgara, iki renk, fazlası yok.",
      de: "Das hier ist mein Platz: ein Raster, zwei Farben, nichts darüber hinaus.",
    },
    overview: {
      en: "My personal portfolio brings together selected projects, writing and a way to request a call. The same structure serves visitors in English, Turkish and German.",
      tr: "Kişisel portfolyom seçili projeleri, yazıları ve görüşme talebini bir araya getiriyor. Ziyaretçiler aynı yapıyı İngilizce, Türkçe ve Almanca kullanabiliyor.",
      de: "Mein persönliches Portfolio bündelt ausgewählte Projekte, Texte und die Möglichkeit, ein Gespräch anzufragen. Dieselbe Struktur steht auf Englisch, Türkisch und Deutsch bereit.",
    },
    tags: ["Astro", "TypeScript", "CSS"],
    live: "https://pekmen.net",
    image: "/projects/pekmen-net.webp",
    imageAlt: {
      en: "An earlier Pekmen portfolio homepage with its cream background and green typography",
      tr: "Krem zemin ve yeşil tipografiyle Pekmen portfolyosunun önceki ana sayfası",
      de: "Eine frühere Pekmen-Startseite mit cremefarbenem Hintergrund und grüner Typografie",
    },
    imageCaption: { en: "Earlier portfolio homepage", tr: "Portfolyonun önceki ana sayfası", de: "Frühere Portfolio-Startseite" },
    domain: "pekmen.net",
    sections: [
      {
        title: {
          en: "Two colours are enough",
          tr: "İki renk yetiyor",
          de: "Zwei Farben reichen",
        },
        body: {
          en: "Green and cream carry the whole interface. Order comes from size, weight and thin rules — not from shadow, gradients or ornament.",
          tr: "Yeşil ve krem bütün arayüzü taşıyor. Sıralama büyüklükten, kalınlıktan ve ince çizgilerden geliyor; gölge, gradyan ya da süs yok.",
          de: "Grün und Creme tragen die ganze Oberfläche. Ordnung entsteht aus Größe, Gewicht und feinen Linien — nicht aus Schatten, Verläufen oder Schmuck.",
        },
      },
      {
        title: {
          en: "A shareable link for each language",
          tr: "Her dil için paylaşılabilir adres",
          de: "Ein teilbarer Link pro Sprache",
        },
        body: {
          en: "English, Turkish and German each have their own addresses. The language switch takes you to the same page in the selected language.",
          tr: "İngilizce, Türkçe ve Almanca ayrı adreslere sahip. Dil seçici, bulunduğun sayfanın seçtiğin dildeki sürümüne götürüyor.",
          de: "Englisch, Türkisch und Deutsch haben eigene Adressen. Die Sprachauswahl öffnet dieselbe Seite in der gewählten Sprache.",
        },
      },
      {
        title: {
          en: "Nothing unnecessary",
          tr: "Gereksiz hiçbir şey yok",
          de: "Nichts Überflüssiges",
        },
        body: {
          en: "Astro renders the public pages on the server. JavaScript supports interactive parts like the mobile menu and the appointment form.",
          tr: "Astro, ziyaretçiye açık sayfaları sunucuda hazırlıyor. JavaScript mobil menü ve randevu formu gibi etkileşimli bölümlerde kullanılıyor.",
          de: "Astro rendert die öffentlichen Seiten auf dem Server. JavaScript unterstützt interaktive Bereiche wie das mobile Menü und das Terminformular.",
        },
      },
    ],
  },
];

export const projects: Project[] = projectList
  .slice()
  .sort((a, b) => Number(b.year) - Number(a.year))
  .map((project, position) => ({
    ...project,
    index: String(position + 1).padStart(2, "0"),
  }));

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getNextProject(slug: string): Project {
  const index = projects.findIndex((project) => project.slug === slug);
  return projects[(index + 1) % projects.length] ?? projects[0];
}
