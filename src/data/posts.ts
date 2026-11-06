export type Localized = { en: string; tr: string; de: string };

export type Post = {
  slug: string;
  date: string;
  readingMinutes: number;
  tags: string[];
  title: Localized;
  excerpt: Localized;
  body: Localized[];
};

export const posts: Post[] = [
  {
    slug: "cfmoto-450sr-25854-km",
    date: "2026-10-31",
    readingMinutes: 7,
    tags: ["Motorcycle", "CFMoto 450SR", "Ownership"],
    title: {
      en: "CFMoto 450SR: ownership notes at 25,854 km",
      tr: "CFMoto 450SR: 25.854 kilometrelik sahiplik notları",
      de: "CFMoto 450SR: Besitznotizen bei 25.854 Kilometern",
    },
    excerpt: {
      en: "From Istanbul traffic to the Ankara road, from an oil cooler that burst at 10,284 km to the name “Barut”: real ownership notes at 25,854 km on a 2023 450SR.",
      tr: "İstanbul trafiğinden Ankara yoluna, 10.284 kilometrede patlayan yağ soğutucusundan “Barut” ismine: 25.854 kilometrede 2023 model 450SR ile gerçek kullanım notları.",
      de: "Vom Istanbuler Verkehr bis zur Strecke nach Ankara, vom bei 10.284 km geplatzten Ölkühler bis zum Namen „Barut“: echte Besitznotizen bei 25.854 Kilometern zu einer 450SR von 2023.",
    },
    body: [
      {
        en: "This bike was built on 24 October 2023 and has been mine since that year. I mostly ride in Istanbul, but I've also done the Tekirdağ, Eskişehir, Şile, Düzce and Ankara roads. Its name is Barut — gunpowder. The exhaust pops like popcorn when I get off the throttle, and that's where the name came from. What follows isn't a showroom review; these are real ownership notes at 25,854 km.",
        tr: "Bu motor 24 Ekim 2023'te üretildi ve o yıldan beri bende. Çoğu zaman İstanbul'da sürüyorum; Tekirdağ, Eskişehir, Şile, Düzce ve Ankara yollarını da yaptım. Adı Barut. Gaza oturup bıraktığında egzozdan çıkan patlamalar mısır patlağı gibi olduğu için bu ismi taktım. Aşağıdakiler bir showroom incelemesi değil; 25.854 kilometreye gelen gerçek kullanım notları.",
        de: "Diese Maschine wurde am 24. Oktober 2023 gebaut und ist seitdem meine. Ich fahre meistens in Istanbul, aber auch die Strecken nach Tekirdağ, Eskişehir, Şile, Düzce und Ankara. Sie heißt Barut — Schießpulver. Der Auspuff knallt beim Gaswegnehmen wie Popcorn, daher der Name. Was folgt, ist kein Showroom-Test, sondern echte Besitznotizen bei 25.854 Kilometern.",
      },
      {
        en: "450 cc parallel twin, 34.5 kW — about 46–47 hp, just under the A2 ceiling of 35 kW. On paper that puts it at the top of the class, and on the road it feels like the class king. It delivers all of its power when you open the throttle, and the mid-range acceleration is especially fun outside the city. Acceleration is one of my three favourite things about it. The other two are the screen and the brakes.",
        tr: "450 cc paralel çift silindir, 34,5 kW — yaklaşık 46–47 beygir, yani A2'nin 35 kW sınırının hemen altında. Kâğıt üzerinde sınıfın tepesinde; kullanınca da A2'nin kralı olduğunu hissettiriyor. Gazı açtığında gücün tamamını veriyor, ara hızlanmalar özellikle şehir dışında çok keyifli. En sevdiğim üç şeyden biri hızlanması. Diğer ikisi ekran ve frenler.",
        de: "450 cm³ Parallel-Twin, 34,5 kW — etwa 46–47 PS, also knapp unter der A2-Grenze von 35 kW. Auf dem Papier steht sie damit an der Spitze der Klasse, auf der Straße fühlt sie sich wie der König der Klasse an. Sie gibt beim Gasgeben die volle Leistung frei, und die Zwischenbeschleunigung ist besonders außerhalb der Stadt ein Vergnügen. Die Beschleunigung ist eines meiner drei Lieblingsdinge. Die anderen beiden sind das Display und die Bremsen.",
      },
      {
        en: "The sound and the exhaust pops are a separate matter. That pop-pop on a closed throttle is why the bike is called Barut. Not everyone likes it; I still smile every time.",
        tr: "Sesi ve egzoz patlatması ayrı bir konu. Kapalı gazda çıkardığı o pat pat sesi yüzünden motorun adı Barut oldu. Herkes sevmez; ben hâlâ her seferinde gülüyorum.",
        de: "Klang und Auspuffknallen sind ein eigenes Thema. Dieses Pat-pat beim Gaswegnehmen ist der Grund für den Namen Barut. Nicht jeder mag es; ich lache immer noch jedes Mal.",
      },
      {
        en: "The Brembo brakes really do bite; the front has a clear initial bite and feels reassuring in a panic stop. The ABS, though, sometimes cuts in when it doesn't need to — especially on rough surfaces or during slow manoeuvres. The rear brake is weak; you have to get used to it. Still, in this class the brake feel is one of its strongest sides.",
        tr: "Frenlerde Brembo gerçekten iyi tutuyor; ön frenin ısırma noktası net, panik frende güven veriyor. Ama ABS bazen gereksiz devreye giriyor; özellikle bozuk zeminde veya yavaş manevrada erken müdahale ettiği oluyor. Arka fren ise zayıf; alışman gerekiyor. Yine de bu sınıfta fren hissi bence en güçlü tarafı.",
        de: "Die Bremsen von Brembo packen wirklich zu; die Vorderbremse hat einen klaren Druckpunkt und gibt bei einer Panikbremsung Sicherheit. Das ABS greift allerdings manchmal ein, wenn es nicht nötig ist — besonders auf rauem Untergrund oder bei langsamen Manövern. Die Hinterradbremse ist schwach; daran muss man sich gewöhnen. Trotzdem ist das Bremsgefühl in dieser Klasse eine ihrer stärksten Seiten.",
      },
      {
        en: "In Istanbul traffic the bike runs very hot; in summer you feel serious heat between your legs. On the other hand, the steering lock is wide and the bike is incredibly playful in traffic. In tight gaps and heavy traffic that agility saves the day. It feels like a trade-off between heat and agility.",
        tr: "İstanbul trafiğinde motor çok ısınıyor; yazın bacaklarının arasında ciddi sıcaklık hissediyorsun. Buna karşılık gidon turu çok geniş, motor trafikte inanılmaz oynak. Dar aralıklarda, yoğun trafikte bu çeviklik günü kurtarıyor. Isınma ile çeviklik arasında bir tercih yapılmış gibi.",
        de: "Im Istanbuler Verkehr wird sie sehr heiß; im Sommer spürt man die Hitze deutlich zwischen den Beinen. Dafür ist der Lenkeinschlag groß und die Maschine im Verkehr unglaublich verspielt. In engen Lücken und dichtem Verkehr rettet diese Wendigkeit den Tag. Es fühlt sich wie ein Kompromiss zwischen Hitze und Wendigkeit an.",
      },
      {
        en: "My average consumption is around 6 litres per 100 km. It changes with mixed city and intercity use; aggressive riding pushes it up. That's reasonable for a 450 cc, but anyone commuting long distances every day should factor it in.",
        tr: "Ortalama tüketimim 6 litre civarında. Şehir içi ve şehirlerarası karışık kullanımda bu rakam değişiyor; agresif sürüşte yukarı çıkıyor. 450 cc için makul ama her gün uzun yol yapan biri için hesaba katılması gereken bir rakam.",
        de: "Mein Durchschnittsverbrauch liegt bei etwa 6 Litern auf 100 km. Er schwankt zwischen Stadt und Überland; bei aggressiver Fahrweise steigt er. Für 450 cm³ ist das vernünftig, wer aber täglich weite Strecken fährt, sollte es einplanen.",
      },
      {
        en: "I service it every 3,000–3,500 km on average. That's my choice; I like the bike and put it in early. At that interval the cost stays predictable.",
        tr: "Bakımları ortalama 3.000–3.500 kilometrede bir yapıyorum. Bu benim tercihim; motoru sevdiğim için erken sokuyorum. Bu aralıkta bakım maliyeti belirli ve öngörülebilir kalıyor.",
        de: "Ich bringe sie im Schnitt alle 3.000–3.500 km zur Wartung. Das ist meine Entscheidung; ich mag die Maschine und bringe sie früh hin. In diesem Intervall bleiben die Kosten planbar.",
      },
      {
        en: "The 2023 and 2024 models have a known issue: the oil cooler bursts. It happened to me at 10,284 km. The part was fixed on 2025 models, where there is no such problem. If you're buying used, always ask whether the cooler on a 2023–24 has been replaced.",
        tr: "2023 ve 2024 modellerin bilinen bir sorunu var: yağ soğutucu patlatıyor. Benim başıma 10.284 kilometrede geldi. 2025 modellerde bu parça düzeltildi, orada problem yok. İkinci el bakıyorsan 2023–24'te bu parçanın değişip değişmediğini mutlaka sor.",
        de: "Die Modelle 2023 und 2024 haben ein bekanntes Problem: Der Ölkühler platzt. Bei mir passierte es bei 10.284 km. Bei den 2025er-Modellen wurde das Teil überarbeitet, dort gibt es das Problem nicht. Wer gebraucht kauft, sollte bei einer 2023–24 unbedingt fragen, ob der Kühler getauscht wurde.",
      },
      {
        en: "What I don't like is storage. There is almost no space on the bike; you can't even find a place for the registration. The pillion seat is very hard too; if you're going to take someone on a long ride, know that going in. My bike has Pirelli Diablo Rosso 4 tyres, and that's the only change.",
        tr: "Sevmediğim şeyler depolamayla ilgili. Motorda neredeyse hiç boşluk yok; ruhsatı bile koyacak yer bulamıyorsun. Artçı selesi de çok sert; arkana uzun yolculuğa çıkacak birini alacaksan bunu bilerek al. Benim motorun üzerinde Pirelli Diablo Rosso 4 var, başka da bir değişiklik yok.",
        de: "Was mir nicht gefällt, ist der Stauraum. Es gibt fast keinen Platz; nicht einmal für den Fahrzeugschein. Der Soziussitz ist sehr hart; wer jemanden auf eine lange Tour mitnimmt, sollte das wissen. Auf meiner Maschine sind Pirelli Diablo Rosso 4, sonst ist nichts verändert.",
      },
      {
        en: "Who should buy it? Not as a first bike. The 450SR is the right step-up for someone who already has some A2 miles behind them and wants to move to a big racing bike later. It can also work as a sport tourer: playful in the city, fast enough outside it. Who shouldn't? Someone looking for a first bike, carrying a pillion every day, wanting storage, or putting comfort before speed.",
        tr: "Kim almalı? Bu motorla başlanmaz. 450SR, A2 sınıfında biraz yol almış ve ileride büyük racinge geçmek isteyen biri için doğru geçiş motoru. Sport touring gibi de kullanılabilir; şehirde oynak, şehir dışında yeterince hızlı. Kim almamalı? İlk motorunu arayan, her gün artçı taşıyan, eşya koyacak yer isteyen ve konforu hızın önüne koyan biri.",
        de: "Für wen ist sie? Nicht als erstes Motorrad. Die 450SR ist der richtige Zwischenschritt für jemanden, der schon einige A2-Kilometer hinter sich hat und später auf ein großes Rennmotorrad umsteigen will. Sie lässt sich auch als Sporttourer fahren: verspielt in der Stadt, außerhalb schnell genug. Für wen nicht? Für jemanden, der ein erstes Motorrad sucht, täglich einen Sozius mitnimmt, Stauraum will oder Komfort über Geschwindigkeit stellt.",
      },
      {
        en: "After years with Barut, one thing is clear: the 450SR isn't perfect, but it has character. Its acceleration, brakes, sound and agility in traffic make it worth starting every morning. If you go in knowing its two concrete compromises — the oil cooler and the seat — it's a thoroughly satisfying bike in the A2 class.",
        tr: "Barut'la geçen yıllardan sonra net olan şu: 450SR kusursuz değil ama karakterli. Hızlanması, freni, sesi ve trafikteki çevikliği onu her sabah tekrar çalıştırmaya değer kılıyor. Yağ soğutucu ve sele gibi iki somut eksiği bilerek alırsan, A2 sınıfında fazlasıyla tatmin edici bir motor.",
        de: "Nach Jahren mit Barut ist eines klar: Die 450SR ist nicht perfekt, aber sie hat Charakter. Beschleunigung, Bremsen, Klang und Wendigkeit im Verkehr machen sie jeden Morgen wieder startenswert. Wer die zwei konkreten Kompromisse — Ölkühler und Sitzbank — kennt, bekommt in der A2-Klasse eine rundum zufriedenstellende Maschine.",
      },
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

export function getNextPost(slug: string): Post {
  const index = posts.findIndex((post) => post.slug === slug);
  return posts[(index + 1) % posts.length] ?? posts[0]!;
}

export function formatPostDate(iso: string, locale: "en" | "tr" | "de"): string {
  const date = new Date(`${iso}T00:00:00Z`);
  const intl = locale === "en" ? "en-GB" : locale === "tr" ? "tr-TR" : "de-DE";

  return new Intl.DateTimeFormat(intl, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
