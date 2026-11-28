/**
 * GameShelf Strict Bilingual Engine (Türkçe / English)
 * İngilizce seçildiğinde browser sekme başlığı (<title>), metinler, dinamik kartlar,
 * öznitelikler ve bildirimler dahil "Türkçe" dil etiketi hariç hiçbir Türkçe kelime bırakmaz.
 */
(function () {
  const LANG_STORAGE_KEY = "gs_ui_lang";

  const EXACT_TR_TO_EN = {
  "Hakkımızda — GameShelf": "About Us — GameShelf",
  "Admin İçerik Yönetim Paneli — GameShelf": "Admin Content Management Panel — GameShelf",
  "Tüm Duyurular — GameShelf": "All Announcements — GameShelf",
  "GameShelf — Oyun Kataloğu & Çoklu Aktif Filtreleme": "GameShelf — Game Catalog & Multi-Active Filtering",
  "İletişim — GameShelf": "Contact — GameShelf",
  "GameShelf — Oyun Detayı": "GameShelf — Game Details",
  "GameShelf — Kişisel Oyun Günlüğü ve Keşif Platformu": "GameShelf — Personal Game Journal & Discovery Platform",
  "Misyon & Vizyon — GameShelf": "Mission & Vision — GameShelf",
  "GameShelf — Profilim & Oyun Rafı": "GameShelf — My Profile & Game Shelf",
  "Canlı Yayın & Akış Birimi — GameShelf": "Live Streams & Community Feed — GameShelf",
  "Topluluk": "Community",
  "Topluluğun katalogdaki oyunlardan yaptığı yayınları tek yerde keşfet. Bir yayına tıklayarak oyunun detay sayfasına, günlük ve inceleme alanına geçebilirsin.": "Discover the community's streams of catalog games in one place. Click a stream to jump to the game's details, journal and review area.",
  "Bu sayfadaki yayınlar ve izleyici sayıları prototip için hazırlanmış örnek verilerdir.": "The streams and viewer counts on this page are sample data prepared for the prototype.",
  "Öne Çıkan Yayınlar": "Featured Streams",
  "Canlı": "Live",
  "izleyici": "viewers",
  "Oyun Kataloğuna Git": "Go to Game Catalog",
  "Night City’de akşam turu": "Evening tour of Night City",
  "Karanlık Mevcudiyet bölümü, ilk bitirme": "Dark Presence chapter, first playthrough",
  "Boss rush: Shadow of the Erdtree": "Boss rush: Shadow of the Erdtree",
  "Hasarsız koşu denemesi": "No-damage run attempt",
  "Dogtown hikâyesi, sohbet yayını": "Dogtown story, chat stream",
  "Yeni DLC ilk bakış": "New DLC first look",
  "Korku": "Horror",
  "Aksiyon": "Action",
  "Aksiyon RPG": "Action RPG",
  "Ana Sayfa": "Home",
  "Ana Sayfa Bölümleri": "Home Sections",
  "En Popüler Oyunlar": "Most Popular Games",
  "Yeni Oyunlar (Ön Plan)": "New Releases (Featured)",
  "Yeni Oyunlar": "New Releases",
  "En Çok Upvote Alan İncelemeler": "Top Upvoted Reviews",
  "Son Zamanlarda En Çok Upvote Alan İncelemeler": "Recently Most Upvoted Reviews",
  "Duyurular & Haberler": "Announcements & News",
  "Duyurular, Fırsatlar & Editör Seçkisi": "Announcements, Deals & Editor's Picks",
  "Ürünlerimiz": "Our Products",
  "Oyun Kataloğu & Sürümler": "Game Catalog & Editions",
  "Tüm Oyun Kataloğu": "All Game Catalog",
  "Ana Oyunlar": "Base Games",
  "Ana Oyun": "Base Game",
  "Ana Oyun, DLC ve Özel Sürümler": "Base Games, DLC & Special Editions",
  "DLC & Genişleme Paketleri": "DLC & Expansion Packs",
  "DLC & Ek Paket": "DLC & Expansion",
  "Ek Paketler (DLC)": "Expansions (DLC)",
  "Özel Sürümler": "Special Editions",
  "Özel Sürüm": "Special Edition",
  "Oyun Detay Sayfası": "Game Details Page",
  "Oyun Detayı": "Game Details",
  "Detay Sayfası": "Details Page",
  "Birimlerimiz": "Our Units",
  "Platform & Topluluk Birimleri": "Platform & Community Units",
  "Kişisel Günlük & İstatistikler": "Personal Journal & Stats",
  "Oyun Rafı (Kapaklar)": "Game Shelf (Covers)",
  "Oyun Rafı": "Game Shelf",
  "Oyun Rafım": "My Game Shelf",
  "Oyun Rafına Git": "Go to Game Shelf",
  "Canlı Yayın & Akış Birimi": "Live Streams & Feed Unit",
  "Duyuru & Arşiv Birimi": "Announcements & Archive Unit",
  "Duyuru & Kampanya Arşivi": "Announcements & Campaign Archive",
  "Kurumsal": "Corporate",
  "Kurumsal Sayfalar": "Corporate Pages",
  "Hakkımızda": "About Us",
  "Hakkımda": "About",
  "GameShelf Hakkında": "About GameShelf",
  "Misyon & Vizyon": "Mission & Vision",
  "Misyonumuz ve Vizyonumuz": "Our Mission and Vision",
  "Misyonumuz": "Our Mission",
  "Vizyonumuz": "Our Vision",
  "Tüm Duyurular": "All Announcements",
  "Tüm Duyurular (En Yeniden En Eskiye)": "All Announcements (Newest to Oldest)",
  "Duyurular": "Announcements",
  "Duyuru": "Announcement",
  "Duyuruları Görüntüle": "View Announcements",
  "Duyuruyu Yayınla": "Publish Announcement",
  "Yayındaki Duyurular": "Published Announcements",
  "İletişim": "Contact",
  "İletişim & Destek": "Contact & Support",
  "İletişim Sayfasını Aç": "Open Contact Page",
  "Bizimle İletişime Geçin": "Contact Us",
  "Admin Paneli": "Admin Panel",
  "Admin Panelinden Duyuru Ekle": "Add Announcement from Admin Panel",
  "GameShelf Yönetici (Admin) Paneli": "GameShelf Administrator (Admin) Panel",
  "Oyun dünyanı": "Discover your gaming world",
  "keşfet": "and save",
  "ve rafına kaydet.": "it to your shelf.",
  "Kişisel oyun günlüğünü oluştur, oynayış sürelerini arşivle ve topluluğun en beğenilen incelemelerini takip et.": "Build your personal game journal, archive playtime, and follow top community reviews.",
  "Ara": "Search",
  "Tümünü Gör": "View All",
  "Katalogda Keşfet →": "Explore in Catalog →",
  "İncelemelere Git": "Go to Reviews",
  "Yeni Duyuru": "New Announcement",
  "Daha Fazla →": "More →",
  "Daha Fazla İçerik": "More Content",
  "Ayrıntıları Aç": "Open Details",
  "Detayları Gör": "View Details",
  "Oyun Kataloğu & Çoklu Aktif Filtreleme": "Game Catalog & Multi-Active Filtering",
  "Oyun Kataloğu": "Game Catalog",
  "Katalog": "Catalog",
  "Katalog & Arşiv": "Catalog & Archive",
  "Katalog Güncel": "Catalog Up to Date",
  "Katalog Yönetimine Git": "Go to Catalog Management",
  "İçerik Tipi:": "Content Type:",
  "Türler:": "Genres:",
  "Platform:": "Platform:",
  "Hızlı Kriter:": "Quick Criteria:",
  "VE (Hepsi)": "AND (All)",
  "VEYA (Herhangi)": "OR (Any)",
  "Tümünü Temizle": "Clear All",
  "Temizle": "Clear",
  "Aktif Filtreler (": "Active Filters (",
  "Çoklu seçim mantığı": "Multi-selection logic",
  "Sırala:": "Sort:",
  "Sırala: En Yeni Çıkış": "Sort: Newest Release",
  "Sırala: Metacritic Puanı": "Sort: Metacritic Score",
  "Sırala: Topluluk Puanı": "Sort: Community Rating",
  "Sırala: İsme Göre (A-Z)": "Sort: Name (A-Z)",
  "İsme Göre (A-Z)": "Name (A-Z)",
  "Sıralama": "Sorting",
  "2023 ve Sonrası": "2023 and Later",
  "4.5+ Topluluk Puanı": "4.5+ Community Rating",
  "Rafımda Ekli": "In My Shelf",
  "Raftaki Oyun": "Game in Shelf",
  "oyun gösteriliyor": "games shown",
  "yapımdan": "from titles",
  "tanesi aktif filtrelere uyuyor": "match active filters",
  "Birden fazla tür, platform, içerik tipi, puan veya çıkış dönemi etiketine aynı anda tıklayarak oyunları anlık daraltın.": "Instantly narrow down games by clicking multiple genre, platform, content type, rating, or release era tags at once.",
  "Filtre etiketlerine tıklayarak çoklu seçim yapabilirsiniz.": "Click filter tags to make multiple selections.",
  "Topluluk İncelemeleri": "Community Reviews",
  "Puanla & İncele": "Rate & Review",
  "Puanla & İnceleme Yaz": "Rate & Write Review",
  "Puanla ve İnceleme Yaz": "Rate and Write Review",
  "İncelememi Güncelle": "Update My Review",
  "İncelemeyi Güncelle": "Update Review",
  "İncelemeyi Yayınla": "Publish Review",
  "Puanı & İncelemeyi Yayınla": "Publish Rating & Review",
  "Puanlanmadı": "Unrated",
  "Senin Puanın": "Your Rating",
  "Topluluk Puanı": "Community Rating",
  "GameShelf Ortalaması": "GameShelf Average",
  "En Yararlı": "Most Helpful",
  "En Yeni": "Newest",
  "Oyun Günlüğüm": "My Game Journal",
  "Oyun Günlüğüm & Oynayış Geçmişi": "My Game Journal & Playthrough History",
  "Oyun Günlüğüm, Puanlama & İnceleme": "My Game Journal, Rating & Review",
  "Günlük Geçmişi": "Journal History",
  "Günlük Kaydını Düzenle": "Edit Journal Entry",
  "Günlüğü Kaydet": "Save Journal",
  "+ Oynayış Kaydı Ekle": "+ Add Playthrough Entry",
  "Düzenle": "Edit",
  "Kaydet": "Save",
  "Kaydet ve Yenile": "Save and Refresh",
  "Kapat": "Close",
  "Durum": "Status",
  "Durum Dağılımı": "Status Distribution",
  "Koleksiyona Ekle": "Add to Collection",
  "Koleksiyondan Kaldır": "Remove from Collection",
  "Raftan Kaldır": "Remove from Shelf",
  "Rafı örnek oyunlarla doldur": "Populate shelf with sample games",
  "Örnek Raf Doldur": "Fill Sample Shelf",
  "Favori Oyunlarım": "My Favorite Games",
  "Favori oyunlarıma ekle": "Add to my favorite games",
  "Favorilere Ekle/Çıkar": "Add/Remove Favorites",
  "Favoriler": "Favorites",
  "Favorilerim": "My Favorites",
  "Öne Çıkan Yorumlar": "Featured Reviews",
  "Öne Çıkan İncelemeler": "Featured Reviews",
  "En İyi": "Top",
  "Senin İncelemen": "Your Review",
  "Oynama Süresi": "Playtime",
  "Toplam Oynama Süresi": "Total Playtime",
  "Oynayış Geçmişi (Playthroughs)": "Playthrough History",
  "Süre (saat)": "Duration (hours)",
  "Başlangıç Tarihi (İsteğe bağlı)": "Start Date (Optional)",
  "Bitiş Tarihi (İsteğe bağlı)": "End Date (Optional)",
  "Kişisel Not": "Personal Note",
  "Kişisel Notlar (isteğe bağlı)": "Personal Notes (optional)",
  "Kişisel Puanlar": "Personal Ratings",
  "Eklenme Sırası": "Date Added",
  "Çıkış Yılı": "Release Year",
  "Çıkış Tarihi:": "Release Date:",
  "Tasarımcı": "Designer",
  "Tasarımcı:": "Designer:",
  "Farklı Sürümler": "Different Editions",
  "Oyun Hakkında Bloglar": "Game Blogs & Guides",
  "Benzer Oyunlar": "Similar Games",
  "Resmi Fragman": "Official Trailer",
  "Son Oynanan & Eklenenler": "Recently Played & Added",
  "Tamamlanan": "Completed",
  "Toplam": "Total",
  "Profil": "Profile",
  "Oyun Ekle": "Add Game",
  "İncelemeler": "Reviews",
  "Tüm İncelemeler": "All Reviews",
  "Tüm İncelemelerim": "All My Reviews",
  "Son İncelemelerim": "My Recent Reviews",
  "0 kayıt": "0 entries",
  "0 sa": "0 hr",
  "Şikâyet ve Öneri Formu": "Complaint & Suggestion Form",
  "Adınız Soyadınız": "Full Name",
  "E-posta Adresiniz": "Your Email Address",
  "Bildirim Türü": "Submission Type",
  "Öneri": "Suggestion",
  "Şikâyet": "Complaint",
  "Hata Bildirimi": "Bug Report",
  "İş Birliği": "Collaboration",
  "Başlık": "Subject",
  "İçerik": "Message",
  "Müşteri İlişkilerine Gönder": "Send to Customer Relations",
  "Konumumuz (Google Haritalar)": "Our Location (Google Maps)",
  "GameShelf Konum Haritası": "GameShelf Location Map",
  "Adres & İletişim": "Address & Contact",
  "Adres:": "Address:",
  "Müşteri İlişkileri & İletişim": "Customer Relations & Contact",
  "Müşteri İlişkileri E-posta:": "Customer Relations Email:",
  "Müşteri İlişkileri Temsilcisi": "Customer Relations Representative",
  "Hızlı Bağlantılar & Sosyal": "Quick Links & Social",
  "Proje & Tasarım Künyesi": "Project & Design Credits",
  "Künye & Teknik Bilgiler": "Credits & Technical Info",
  "Güncel Haber": "Latest News",
  "Tüm Haberler": "All News",
  "Tüm Kategoriler": "All Categories",
  "Kategori": "Category",
  "Haber": "News",
  "Kampanya": "Campaign",
  "Dosya Konusu": "Feature Article",
  "Sistem Güncellemesi": "System Update",
  "Yayın Tarihi": "Published Date",
  "Görsel Dosyası (.png/.jpg)": "Image File (.png/.jpg)",
  "PDF Belgesi (.pdf)": "PDF Document (.pdf)",
  "Word Belgesi (.doc/.docx)": "Word Document (.doc/.docx)",
  "Duyuru Dosya Ekleri (PDF, Word Belgesi, Resim)": "Announcement Attachments (PDF, Word Document, Image)",
  "Görünürlük": "Visibility",
  "Herkese Açık": "Public",
  "Gizli": "Private",
  "Gizli (Sadece Ben)": "Private (Only Me)",
  "Profil Görünürlüğü": "Profile Visibility",
  "Platform Adı": "Platform Name",
  "Kapak Görseli Seçimi": "Cover Image Selection",
  "Varsayılana Dön": "Reset to Default",
  "Menüyü Aç": "Toggle Menu",
  "Sağa Kaydır": "Scroll Right",
  "Sola Kaydır": "Scroll Left",
  "Önceki Kapak Görseli": "Previous Cover Image",
  "Sonraki Kapak Görseli": "Next Cover Image",
  "Fragmanı Küçült": "Minimize Trailer",
  "Yükleniyor...": "Loading...",
  "Tümü": "All",
  "Konum": "Location",
  "Ana Sayfaya Dön": "Back to Home",
  "Dinamik Kapak Paleti Testi:": "Dynamic Cover Palette Test:",
  "Aktif Vurgu:": "Active Accent:",
  "3D Kayan Oyun ve İnceleme Akışı": "3D Sliding Game & Review Stream",
  "1. Varsayılan Mod: Steam Canlı API (Anahtarsız)": "1. Default Mode: Steam Live API (Keyless)",
  "2. İsteğe Bağlı: RAWG.io Tam Veritabanı API Anahtarı": "2. Optional: RAWG.io Full Database API Key",
  "API Kaynağı & RAWG Anahtarı": "API Source & RAWG Key",
  "Canlı Oyun API Yapılandırması": "Live Game API Configuration",
  "Canlı API akışını yenile": "Refresh live API feed",
  "Arka Yüz (Back-end) İçerik Yönetimi": "Back-End Content Management",
  "Arka plan görsel geçişleri": "Background image transitions",
  "Oyun Telemetri ve Metacritic Özeti": "Game Telemetry & Metacritic Summary",
  "Stratejik Yol Haritası": "Strategic Roadmap",
  "Dinamik Arayüz": "Dynamic Interface",
  "Kapağa Uyumlu Tema Paleti": "Cover-Matched Theme Palette",
  "Dengeli Puanlama & Tartışma": "Balanced Rating & Discussion",
  "Çalışma Saatleri:": "Working Hours:",
  "Hafta içi 09:00 – 18:00": "Weekdays 09:00 – 18:00",
  "Çevrimiçi": "Online",
  "Duyuru Başlığı *": "Announcement Title *",
  "Duyuru İçeriği *": "Announcement Content *",
  "Önyüz Sayfa İçerik & Katalog Yönetimi": "Front-End Page Content & Catalog Management",
  "Ürün / Oyun Kataloğu Yönetimi": "Product / Game Catalog Management",
  "Dil Seçimi / Language": "Language Selection",
  "Language / Dil Seçimi": "Language Selection",
  "Dil / Language": "Language",
  "Kişisel oyun günlüğü, koleksiyon rafı ve topluluk inceleme platformu. TBL303 Web Tasarımı Dersi kapsamında geliştirilmiştir.": "Personal game journal, collection shelf, and community review platform. Developed for TBL303 Web Design.",
  "GameShelf, oyuncuların oynadıkları oyunları düzenli bir oyun günlüğünde kayıt altına almasını, oynanış sürelerini ve deneyim notlarını arşivlemesini, ayrıca topluluk incelemeleri üzerinden yeni yapımlar keşfetmesini sağlayan modern bir web platformudur.": "GameShelf is a modern web platform that lets players record played games in a structured journal, archive playtimes and notes, and discover new titles via community reviews.",
  "Hikaye odaklı RPG, aksiyon-macera ve zorlu boss savaşlarının kişisel oyun günlüğü.": "Personal game journal of story-driven RPGs, action-adventure, and tough boss battles.",
  "Bitirdiğim oyunları not alıyor, farklı sonları ve oynayış sürelerini arşivliyorum.": "I note finished games and archive alternate endings and playtimes.",
  "Henüz rafında oyun yok.": "No games in your shelf yet.",
  "Henüz koleksiyonuna eklenmedi. Durum ve oynayış geçmişi eklemek için yukarıdaki butonu kullanabilirsin.": "Not added to your collection yet. Use the button above to set status and playthrough history.",
  "Koleksiyon durumunu, oynayış geçmişini, puanını ve incelemeni tek yerden yönet.": "Manage collection status, playthrough history, rating, and review in one place.",
  "Koleksiyonuna eklemeden de puan verebilir veya yazılı inceleme paylaşabilirsin.": "You can also rate or post a written review without adding to your collection.",
  "Bu oyun için hazırlanmış rehberler, analizler ve topluluk yazıları": "Guides, analyses, and community articles prepared for this game",
  "Güncel oyun haberleri, dosya konuları ve editör blogları": "Latest gaming news, features, and editorial blogs",
  "Tür ve atmosfer olarak bu oyuna yakın yapımlar": "Titles similar to this game in genre and atmosphere",
  "Farklı sürümleri ve genişleme paketlerini ana yapımlarla ilişkili şekilde inceleyebilir, oynama durumlarını (Backlog, Playing, Completed, Dropped) kolayca yönetebilirsin.": "Explore different editions and expansions linked to base games and easily manage statuses (Backlog, Playing, Completed, Dropped).",
  "Yarım yıldız hassasiyetinde puanlama, puan dağılım grafikleri ve faydalı/yeni sıralamalarıyla gerçek oyuncu deneyimlerine hızlıca ulaşabilirsin.": "Quickly reach real player experiences with half-star ratings, score distributions, and helpful/newest sorting.",
  "Oyun detay sayfalarından paylaştığın yazılı değerlendirmeler": "Written reviews you shared from game detail pages",
  "Tüm oyunlara ait kayıtlı oturum ve bitiriş tarihlerin": "Recorded sessions and completion dates across all games",
  "En güncel duyurular — ayrıntılar ve ekli dosyalar için duyuruya tıklayın": "Latest announcements — click an announcement for details and attachments",
  "Platform güncellemeleri, sezonluk etkinlikler ve ekli dokümanlar kronolojik olarak en yeniden en eskiye listelenir.": "Platform updates, seasonal events, and attached documents are listed chronologically from newest to oldest.",
  "Konumumuzu harita üzerinde inceleyebilir veya şikâyet ve önerilerinizi aşağıdaki form üzerinden müşteri ilişkileri temsilcimize iletebilirsin.": "View our location on the map or send complaints and suggestions to our customer relations representative via the form below.",
  "Herhangi bir API anahtarı gerektirmeden Steam mağazasından gerçek oyun kapaklarını (": "Automatically fetches real game covers (",
  "), hero arka planlarını ve canlı arama sonuçlarını otomatik çeker.": "), hero backgrounds, and live search results from the Steam store without any API key.",
  "Ücretsiz RAWG anahtarı girerseniz tüm oyunlar için sinopsis, stüdyo, ekran görüntüleri ve fragmanlar doğrudan RAWG API'den çekilir.": "If you enter a free RAWG key, synopses, studios, screenshots, and trailers for all games are fetched directly from the RAWG API.",
  "Sunucu tarafı kodlama gerektirmeden önyüzdeki duyuruları, PDF/Word/Resim eklerini, oyun kataloğu notlarını ve kurumsal içerikleri yönetin.": "Manage front-end announcements, PDF/Word/Image attachments, catalog notes, and corporate content without server-side code.",
  "Hakkımızda, Misyon-Vizyon, İletişim ve Katalog verileri için içerik giriş ve senkronizasyon paneli.": "Content entry and synchronization panel for About, Mission-Vision, Contact, and Catalog data.",
  "Katalogdaki ana oyun, DLC ve özel sürümlerin durum ve inceleme kayıtlarını düzenleyin.": "Edit status and review entries for base games, DLCs, and special editions in the catalog.",
  "Eklenen duyurular otomatik olarak tarih sırasıyla ana sayfada ve": "Added announcements automatically appear by date on the home page and",
  "sayfasında yayınlanır.": "page.",
  "Henüz dosya seçilmedi — PDF, Word (.docx) ve Görsel dosyalarını birlikte ekleyebilirsiniz.": "No file selected yet — you can attach PDF, Word (.docx), and Image files together.",
  "Form gönderildiğinde mesajınız": "When submitted, your message is prepared to be sent to",
  ") adına iletilmek üzere hazırlanır.": ").",
  "Şikâyet ve öneri formu yönlendirme adresi:": "Complaint & suggestion form routing address:",
  "Her Oyuncuya Düzenli ve Anlamlı Bir Oyun Günlüğü Sunmak": "Delivering a Structured and Meaningful Game Journal to Every Player",
  "Dijital Oyun Arşivleme ve Keşifte Referans Bir Platform Olmak": "Becoming a Reference Platform in Digital Game Archiving and Discovery",
  "Her oyunun kapak görselinden uyumlu vurgu renkleri türeten arayüz sayesinde detay sayfaları her yapıma özgü bir kimlik kazanır.": "Detail pages gain a unique identity for each title through an interface that derives accent colors from its cover art.",
  "Oyun kültürünü dağınık mağaza listelerinin ötesine taşıyarak kişisel bir hafıza, nitelikli inceleme alanı ve estetik bir keşif deneyimi sunmak amacıyla çalışıyoruz.": "We aim to move gaming culture beyond scattered store lists by offering personal memory, quality reviews, and aesthetic discovery.",
  "Oyun sürümleri, DLC'ler ve topluluk puanlarını anlaşılır biçimde bir araya getirmek": "Bringing game editions, DLCs, and community ratings together clearly",
  "Oyuncuların tamamladığı, yarıda bıraktığı veya oynamayı planladığı oyunları tek bir merkezde toplamalarını; oturum bazlı oynanış sürelerini ve kişisel notlarını kalıcı olarak saklamalarını sağlıyoruz.": "We help players centralize completed, dropped, or planned games and permanently store session playtimes and personal notes.",
  "Kişiselleştirilmiş keşif ve akıllı arama deneyimlerini sürekli geliştirmek": "Continuously improving personalized discovery and smart search",
  "Masaüstü ve mobil cihazlarda tutarlı performans sağlamak": "Ensuring consistent performance across desktop and mobile devices",
  "Modern web standartlarıyla erişilebilir ve ölçeklenebilir bir mimari sürdürmek": "Maintaining an accessible, scalable architecture with modern web standards",
  "Sade, hızlı ve dikkat dağıtmayan kullanıcı deneyimi sunmak": "Providing a clean, fast, distraction-free user experience",
  "Topluluk odaklı, şeffaf ve yapıcı inceleme kültürünü desteklemek": "Supporting a community-driven, transparent, and constructive review culture",
  "Yüzeysel skor tabloları yerine oyuncunun zamanını, zevkini ve derinlikli değerlendirmelerini merkeze alan; açık veri akışlarıyla sürekli gelişen yenilikçi bir topluluk ekosistemi oluşturmayı hedefliyoruz.": "We aim to build an evolving community ecosystem centered on player time, taste, and thoughtful reviews with open data streams.",
  "Oyun kapakları, ekran görüntüleri ve künye verilerinin kaynağı": "Source of game covers, screenshots, and metadata",
  "Kabaoğlu Mah. Baki Komsuoğlu Cad. No:515, Umuttepe / İzmit, Kocaeli": "Kabaoglu Mah. Baki Komsuoglu Cad. No:515, Umuttepe / Izmit, Kocaeli",
  "Kabaoğlu Mah. Baki Komsuoğlu Cad. No:515, İzmit / Kocaeli": "Kabaoglu Mah. Baki Komsuoglu Cad. No:515, Izmit / Kocaeli",
  "Umuttepe / İzmit, Kocaeli": "Umuttepe / Izmit, Kocaeli",
  "Umuttepe Yerleşkesi / İzmit, Kocaeli konumu harita üzerinde işaretlenmiştir.": "Umuttepe Campus / Izmit, Kocaeli is marked on the map.",
  "Kocaeli Üniversitesi • TBL303 Web Tasarımı": "Kocaeli University • TBL303 Web Design",
  "Melih Çetin (Kocaeli Üniversitesi — Bilişim Sistemleri Mühendisliği)": "Melih Cetin (Kocaeli University — Information Systems Engineering)",
  "Melih Çetin • Bilişim Sistemleri Mühendisliği (Kocaeli Üniversitesi)": "Melih Cetin • Information Systems Engineering (Kocaeli University)",
  "— Kişisel Oyun Günlüğü ve Topluluk Platformu": "— Personal Game Journal & Community Platform",
  "— Tüm hakları saklıdır.": "— All rights reserved.",
  "İnceleme başlığı (isteğe bağlı)": "Review title (optional)",
  "Oyun hakkındaki düşüncelerin (isteğe bağlı)...": "Your thoughts about the game (optional)...",
  "Kısa notun...": "Your short note...",
  "Oynayış notu...": "Playthrough note...",
  "Raf içinde ara...": "Search in shelf...",
  "Oyun adı, stüdyo, tür veya tema...": "Game title, studio, genre, or theme...",
  "Oyun, stüdyo veya tür yazmaya başla...": "Start typing a game, studio, or genre...",
  "Duyuru başlığı veya içeriğinde ara...": "Search announcement title or content...",
  "Konu başlığını yazınız...": "Enter subject title...",
  "Şikâyet veya önerinizi detaylıca yazınız...": "Write your complaint or suggestion in detail...",
  "Duyuru açıklamasını, etkinlik kurallarını veya kampanya detaylarını yazın...": "Write announcement description, event rules, or campaign details...",
  "Örn. Kış Sezonu Topluluk Etkinliği Başladı": "e.g. Winter Season Community Event Started",
  "Örn. Melih Çetin": "e.g. Melih Cetin",
  "Örn: a1b2c3d4e5f6... (Boş bırakılırsa Steam Canlı API kullanılır)": "e.g. a1b2c3d4e5f6... (Steam Live API is used if left blank)",
  "Puan vermek için tıklayın (sol yarı: .5, sağ yarı: tam)": "Click to rate (left half: .5, right half: full)",
  "Sesi duymak için üzerine gelin, tam ekran fragman için tıklayın": "Hover for sound, click for full-screen trailer",
  "Seçilen etiketlerden en az birini taşıyan oyunları getir": "Show games matching at least one selected tag",
  "Seçilen tüm etiketleri aynı anda taşıyan oyunları getir": "Show games matching all selected tags simultaneously",
  "Profil Sekmeleri": "Profile Tabs",
  "Oyun ara": "Search games",
  "ornek@eposta.com": "example@email.com",
  "Varsayılan": "Default",
  "Duyuru ve ekli dosyalar kaydedildi! Ana sayfada ve Tüm Duyurular listesinde yayında.": "Announcement and attachments saved! Live on the Home page and All Announcements list.",
  "Lütfen duyuru başlığı ve içeriğini doldurun.": "Please fill in the announcement title and content.",
  "Seçilen dosyalar ->": "Selected files ->",
  "kayıt": "entries",
  "Duyuruya Eklenen Belgeler & Görseller": "Documents & Images Attached to Announcement",
  "Eşleşen duyuru bulunamadı.": "No matching announcements found.",
  "Aranıyor...": "Searching...",
  "Filtreyi kaldır": "Remove filter",
  "VE modu: Seçili tüm filtre kriterlerini aynı anda karşılayan oyunlar gösteriliyor.": "AND mode: Showing games matching all selected filter criteria simultaneously.",
  "VEYA modu: Seçili filtre kriterlerinden en az birini karşılayan oyunlar gösteriliyor.": "OR mode: Showing games matching at least one selected filter criterion.",
  "Bildiriminiz hazırlandı!": "Your submission has been prepared!",
  "E-posta İstemcisinde Aç": "Open in Email Client",
  "Lütfen ad soyad, e-posta, başlık ve içerik alanlarını doldurun.": "Please fill in your full name, email, subject, and message.",
  "1 sürüm": "1 edition",
  "Bu oyun için henüz yazılı inceleme bulunmuyor.": "No written reviews for this game yet.",
  "Bu yapım için ek künye kaydı bulunmuyor.": "No additional metadata entries for this title.",
  "Henüz oynayış kaydı bulunmuyor.": "No playthrough entries yet.",
  "Kayıtlı oynayış yok.": "No recorded playthroughs.",
  "Bakış Açısı": "Perspective",
  "Büyütmek için tıkla": "Click to enlarge",
  "Geliştirici": "Developer",
  "Yayıncı": "Publisher",
  "Platformlar": "Platforms",
  "Türler": "Genres",
  "Çıkış Tarihi": "Release Date",
  "Oyun Süresi": "Playtime",
  "Lütfen en azından bir puan seçin veya inceleme yazın.": "Please select at least a rating or write a review.",
  "Ekli Dosyalar (PDF / Word / Görsel)": "Attached Files (PDF / Word / Image)",
  "Beğen (Upvote)": "Upvote",
  "Beğenme (Downvote)": "Downvote",
  "Henüz favori oyun seçilmedi. Oyun detay sayfasından kalp simgesine basarak favorilerine ekleyebilirsin.": "No favorite games selected yet. Click the heart icon on a game detail page to add favorites.",
  "Henüz kayıtlı oynayış oturumu (playthrough) bulunmuyor.": "No recorded playthrough sessions yet.",
  "Henüz rafında kayıt bulunmuyor.": "No entries in your shelf yet.",
  "Henüz rafında oyun bulunmuyor.": "No games in your shelf yet.",
  "Henüz yazılı inceleme paylaşmadın.": "You haven't posted any written reviews yet.",
  "Durumu Düzenle": "Edit Status",
  "Eşleşen oyun bulunamadı": "No matching games found",
  "Farklı bir sekme veya arama terimi deneyebilirsin.": "Try a different tab or search query.",
  "Oyun rafın henüz boş": "Your game shelf is empty",
  "İncelemeyi Sil": "Delete Review",
  "Canlı API": "Live API",
  "Mağaza": "Store",
  "GameShelf Yönetici": "GameShelf Admin",
  "RAWG.io Veritabanı": "RAWG.io Database",
  "Steam Kataloğu": "Steam Catalog",
  "Steam Mağaza Veritabanı": "Steam Store Database",
  "+ Rafıma Ekle": "+ Add to Shelf",
  "Rafıma Ekle": "Add to Shelf",
  "Rafta": "In Shelf",
  "Rafta (Completed)": "In Shelf (Completed)",
  "Rafta (Playing)": "In Shelf (Playing)",
  "Rafta (Backlog)": "In Shelf (Backlog)",
  "Rafta (Dropped)": "In Shelf (Dropped)",
  "Yeni": "New",
  "Favorilere Ekle": "Add to Favorites",
  "Favorilerden Çıkar": "Remove from Favorites",
  "Katalogda Ara →": "Search in Catalog →",
  "Oyuna Git →": "Open Game →",
  "Rafta değil": "Not in shelf",
  "Oyun": "Game",
  "Güncelleme": "Update",
  "Tamamlandı": "Completed",
  "Oynanıyor": "Playing",
  "Planlandı": "Backlog",
  "Bırakıldı": "Dropped",
  "Oynanış": "Playthrough",
  "İnceleme": "Review",
  "Puan": "Rating",
  "Ekle": "Add",
  "Kaldır": "Remove",
  "Sil": "Delete",
  "Güncelle": "Update",
  "Gönder": "Send",
  "İptal": "Cancel",
  "Detay": "Details",
  "Tümünü Göster": "Show All",
  "Sonuç bulunamadı": "No results found",
  "Eşleşen oyun bulunamadı.": "No matching games found.",
  "Arama sonucu bulunamadı.": "No search results found."
};

  const EXACT_EN_TO_TR = {};
  Object.keys(EXACT_TR_TO_EN).forEach((trKey) => {
    EXACT_EN_TO_TR[EXACT_TR_TO_EN[trKey]] = trKey;
  });

  // Parçalı / şablon tabanlı dinamik cümle çevirileri (sayı veya isim içeren ifadeler)
  const PATTERN_RULES = [
    {
      trToEn: /^Rafta\s*\((.+?)\)$/i,
      enToTr: /^In Shelf\s*\((.+?)\)$/i,
      toEn: (_, st) => `In Shelf (${st})`,
      toTr: (_, st) => `Rafta (${st})`
    },
    {
      trToEn: /^\+?\s*Rafıma Ekle$/i,
      enToTr: /^\+?\s*Add to Shelf$/i,
      toEn: () => "+ Add to Shelf",
      toTr: () => "+ Rafıma Ekle"
    },
    {
      trToEn: /^(\d+)\.\s*Oynayış$/i,
      enToTr: /^Playthrough\s*#(\d+)$/i,
      toEn: (_, n) => `Playthrough #${n}`,
      toTr: (_, n) => `${n}. Oynayış`
    },
    {
      trToEn: /^(\d+)\s+kişi yararlı buldu$/i,
      enToTr: /^(\d+)\s+people found this helpful$/i,
      toEn: (_, n) => `${n} people found this helpful`,
      toTr: (_, n) => `${n} kişi yararlı buldu`
    },
    {
      trToEn: /^(\d+)\s+kayıt$/i,
      enToTr: /^(\d+)\s+entries$/i,
      toEn: (_, n) => `${n} entries`,
      toTr: (_, n) => `${n} kayıt`
    },
    {
      trToEn: /^(\d+)\s+sa$/i,
      enToTr: /^(\d+)\s+hr$/i,
      toEn: (_, n) => `${n} hr`,
      toTr: (_, n) => `${n} sa`
    },
    {
      trToEn: /^(\d+)\s+paket\s*•\s*kaydır$/i,
      enToTr: /^(\d+)\s+packs?\s*•\s*scroll$/i,
      toEn: (_, n) => `${n} packs • scroll`,
      toTr: (_, n) => `${n} paket • kaydır`
    },
    {
      trToEn: /^(\d+)\s+sürüm\s*•\s*kaydır$/i,
      enToTr: /^(\d+)\s+editions?\s*•\s*scroll$/i,
      toEn: (_, n) => `${n} editions • scroll`,
      toTr: (_, n) => `${n} sürüm • kaydır`
    },
    {
      trToEn: /^(\d+)\s+oynayış$/i,
      enToTr: /^(\d+)\s+playthroughs?$/i,
      toEn: (_, n) => `${n} playthroughs`,
      toTr: (_, n) => `${n} oynayış`
    },
    {
      trToEn: /^(.+?)\s+tarihinde değiştirildi$/i,
      enToTr: /^Edited on\s+(.+)$/i,
      toEn: (_, dt) => `Edited on ${dt}`,
      toTr: (_, dt) => `${dt} tarihinde değiştirildi`
    },
    {
      trToEn: /^(.+?)\s*•\s*Son düzenleme:\s*(.+)$/i,
      enToTr: /^(.+?)\s*•\s*Last edited:\s*(.+)$/i,
      toEn: (_, c, u) => `${c} • Last edited: ${u}`,
      toTr: (_, c, u) => `${c} • Son düzenleme: ${u}`
    },
    {
      trToEn: /^Tür:\s*(.+)$/i,
      enToTr: /^Genre:\s*(.+)$/i,
      toEn: (_, g) => `Genre: ${g}`,
      toTr: (_, g) => `Tür: ${g}`
    },
    {
      trToEn: /^Günlük:\s*(.+)$/i,
      enToTr: /^Journal:\s*(.+)$/i,
      toEn: (_, s) => `Journal: ${s}`,
      toTr: (_, s) => `Günlük: ${s}`
    },
    {
      trToEn: /^Başlangıç:\s*(.+)$/i,
      enToTr: /^Started:\s*(.+)$/i,
      toEn: (_, d) => `Started: ${d}`,
      toTr: (_, d) => `Başlangıç: ${d}`
    },
    {
      trToEn: /^Bitiş:\s*(.+)$/i,
      enToTr: /^Completed:\s*(.+)$/i,
      toEn: (_, d) => `Completed: ${d}`,
      toTr: (_, d) => `Bitiş: ${d}`
    },
    {
      trToEn: /^Görsel\s+(\d+)$/i,
      enToTr: /^Image\s+(\d+)$/i,
      toEn: (_, n) => `Image ${n}`,
      toTr: (_, n) => `Görsel ${n}`
    },
    {
      trToEn: /^(.+?)\s+—\s+Günlük & İnceleme$/i,
      enToTr: /^(.+?)\s+—\s+Journal & Review$/i,
      toEn: (_, t) => `${t} — Journal & Review`,
      toTr: (_, t) => `${t} — Günlük & İnceleme`
    },
    {
      trToEn: /^(.+?)\s+—\s+Ekran Görüntüsü\s+(\d+)$/i,
      enToTr: /^(.+?)\s+—\s+Screenshot\s+(\d+)$/i,
      toEn: (_, t, n) => `${t} — Screenshot ${n}`,
      toTr: (_, t, n) => `${t} — Ekran Görüntüsü ${n}`
    },
    {
      trToEn: /^(.+?)\s*•\s*(\d+)\s+yapım$/i,
      enToTr: /^(.+?)\s*•\s*(\d+)\s+titles$/i,
      toEn: (_, p, n) => `${p} • ${n} titles`,
      toTr: (_, p, n) => `${p} • ${n} yapım`
    }
  ];

  // Kelime / tarih ayı yedek çevirisi (kalan tekil Türkçe terimler için)
  const WORD_FALLBACK_TR_TO_EN = {
    "Ocak": "January",
    "Şubat": "February",
    "Mart": "March",
    "Nisan": "April",
    "Mayıs": "May",
    "Haziran": "June",
    "Temmuz": "July",
    "Ağustos": "August",
    "Eylül": "September",
    "Ekim": "October",
    "Kasım": "November",
    "Aralık": "December",
    "Geliştirici": "Developer",
    "Yayıncı": "Publisher",
    "Platformlar": "Platforms",
    "Türler": "Genres",
    "Çıkış Tarihi": "Release Date",
    "Oyun Süresi": "Playtime",
    "Bakış Açısı": "Perspective"
  };

  let observer = null;
  let isApplying = false;
  let pendingRoots = new Set();
  let rafScheduled = false;

  function getLang() {
    return localStorage.getItem(LANG_STORAGE_KEY) === "en" ? "en" : "tr";
  }

  function isLanguageSwitcherItem(el) {
    if (!el) return false;
    return Boolean(el.closest && el.closest("[data-set-lang='tr']"));
  }

  function convertString(str, lang) {
    if (!str) return str;
    const norm = str.replace(/\s+/g, " ").trim();
    if (!norm) return str;

    // "Türkçe" dil seçici etiketi her zaman kendi dilinde ("Türkçe") kalır
    if (norm === "Türkçe" || norm === "🇹🇷 Türkçe") return str;

    if (lang === "en") {
      if (EXACT_TR_TO_EN[norm]) return EXACT_TR_TO_EN[norm];
      for (const rule of PATTERN_RULES) {
        const m = norm.match(rule.trToEn);
        if (m) return rule.toEn(...m);
      }
      // Kısmi tarih ayı veya künye alanı içeriyorsa değiştir
      let replaced = norm;
      let changed = false;
      for (const [trW, enW] of Object.entries(WORD_FALLBACK_TR_TO_EN)) {
        const rx = new RegExp(`\\b${trW}\\b`, "g");
        if (rx.test(replaced)) {
          replaced = replaced.replace(rx, enW);
          changed = true;
        }
      }
      if (changed) return replaced;
      return str;
    } else {
      if (EXACT_EN_TO_TR[norm]) return EXACT_EN_TO_TR[norm];
      for (const rule of PATTERN_RULES) {
        const m = norm.match(rule.enToTr);
        if (m) return rule.toTr(...m);
      }
      return str;
    }
  }

  function translateDocumentTitle(lang) {
    const titleEl = document.querySelector("title");
    if (!titleEl) return;
    const curr = document.title.replace(/\s+/g, " ").trim();
    if (!titleEl.dataset.gsOrigTitle) {
      if (EXACT_TR_TO_EN[curr]) titleEl.dataset.gsOrigTitle = curr;
      else if (EXACT_EN_TO_TR[curr]) titleEl.dataset.gsOrigTitle = EXACT_EN_TO_TR[curr];
    }
    if (titleEl.dataset.gsOrigTitle) {
      const nextTitle = lang === "en" ? EXACT_TR_TO_EN[titleEl.dataset.gsOrigTitle] : titleEl.dataset.gsOrigTitle;
      if (nextTitle && document.title !== nextTitle) {
        document.title = nextTitle;
      }
    } else {
      const converted = convertString(curr, lang);
      if (converted && converted !== curr) {
        document.title = converted;
      }
    }
  }

  function translateTextNode(node, lang) {
    if (!node || !node.nodeValue) return;
    const parent = node.parentElement;
    if (isLanguageSwitcherItem(parent)) return;

    const raw = node.nodeValue;
    const norm = raw.replace(/\s+/g, " ").trim();
    if (!norm) return;
    if (norm === "Türkçe" || norm === "🇹🇷 Türkçe") return;

    if (!node._gsOrigRaw) {
      node._gsOrigRaw = raw;
      node._gsOrigNorm = norm;
    }

    if (lang === "tr") {
      if (node._gsOrigRaw && node.nodeValue !== node._gsOrigRaw) {
        node.nodeValue = node._gsOrigRaw;
      }
      return;
    }

    const converted = convertString(node._gsOrigNorm, "en");
    if (converted && converted !== norm) {
      const lead = raw.match(/^\s*/)[0];
      const trail = raw.match(/\s*$/)[0];
      node.nodeValue = `${lead}${converted}${trail}`;
    }
  }

  function translateAttributes(el, lang) {
    if (isLanguageSwitcherItem(el)) return;
    ["placeholder", "title", "aria-label"].forEach((attr) => {
      if (!el.hasAttribute(attr)) return;
      const val = el.getAttribute(attr).replace(/\s+/g, " ").trim();
      if (!val) return;
      const storeKey = "gsOrig_" + attr;
      if (!el.dataset[storeKey]) {
        el.dataset[storeKey] = val;
      }
      const orig = el.dataset[storeKey];
      const target = lang === "en" ? convertString(orig, "en") : orig;
      if (target && val !== target) {
        el.setAttribute(attr, target);
      }
    });
  }

  function translateSubtree(rootEl, lang) {
    if (!rootEl || rootEl.nodeType !== 1) return;
    if (rootEl.id === "gsDynamicLogo") return;

    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const parent = n.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || tag === "SVG") {
          return NodeFilter.FILTER_REJECT;
        }
        if (isLanguageSwitcherItem(parent)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let curr;
    while ((curr = walker.nextNode())) {
      translateTextNode(curr, lang);
    }

    if (rootEl.matches && rootEl.matches("[placeholder],[title],[aria-label]")) {
      translateAttributes(rootEl, lang);
    }
    if (rootEl.querySelectorAll) {
      rootEl.querySelectorAll("[placeholder],[title],[aria-label]").forEach((el) => {
        translateAttributes(el, lang);
      });
    }

    const heroTitle = rootEl.querySelector ? rootEl.querySelector(".gs-home-hero-title") : null;
    if (heroTitle) {
      const desired =
        lang === "en"
          ? 'Discover your gaming world <span>and save</span> it to your shelf.'
          : 'Oyun dünyanı <span>keşfet</span> ve rafına kaydet.';
      if (heroTitle.innerHTML !== desired) {
        heroTitle.innerHTML = desired;
      }
    }
  }

  function applyTranslations(lang = getLang(), targetRoot = document.body) {
    if (isApplying) return;
    isApplying = true;
    try {
      if (observer) observer.disconnect();
      document.documentElement.lang = lang;
      translateDocumentTitle(lang);
      translateSubtree(targetRoot, lang);
    } finally {
      isApplying = false;
      if (observer && document.body) {
        observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder', 'aria-label'] });
      }
    }
  }

  function updateSwitcherUi(lang) {
    const labelEl = document.getElementById("gsCurrentLangLabel");
    if (labelEl) {
      labelEl.textContent = lang === "en" ? "English" : "Türkçe";
    }
    document.querySelectorAll("[data-set-lang]").forEach((btn) => {
      const isAct = btn.dataset.setLang === lang;
      btn.classList.toggle("active", isAct);
      btn.setAttribute("aria-pressed", isAct ? "true" : "false");
    });
  }

  function setLang(lang) {
    const next = lang === "en" ? "en" : "tr";
    localStorage.setItem(LANG_STORAGE_KEY, next);
    updateSwitcherUi(next);
    applyTranslations(next, document.body);
    window.dispatchEvent(new CustomEvent("gs-language-changed", { detail: { lang: next } }));
  }

  function flushPendingMutations() {
    rafScheduled = false;
    const lang = getLang();
    if (lang !== "en") {
      pendingRoots.clear();
      return;
    }
    const roots = Array.from(pendingRoots);
    pendingRoots.clear();
    if (!roots.length || !document.body) return;

    isApplying = true;
    try {
      if (observer) observer.disconnect();
      translateDocumentTitle("en");
      for (const el of roots) {
        if (document.body.contains(el)) {
          translateSubtree(el, "en");
        }
      }
    } finally {
      isApplying = false;
      if (observer && document.body) {
        observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder', 'aria-label'] });
      }
    }
  }

  function syncSavedLanguageNow() {
    if (!document.body) return;
    const lang = getLang();
    updateSwitcherUi(lang);
    applyTranslations(lang, document.body);
  }

  function initLangSwitcher() {
    if (window.__gsI18nInitialized) {
      syncSavedLanguageNow();
      return;
    }
    window.__gsI18nInitialized = true;

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-set-lang]");
      if (!btn) return;
      e.preventDefault();
      setLang(btn.dataset.setLang);
    });

    observer = new MutationObserver((mutations) => {
      if (isApplying || getLang() !== "en") return;
      for (const m of mutations) {
        if (m.type === "characterData" && m.target && m.target.parentElement) {
          const p = m.target.parentElement;
          if (!p.closest("#gsDynamicLogo")) pendingRoots.add(p);
        }
        for (const node of m.addedNodes) {
          if (node.nodeType === 1 && node.id !== "gsDynamicLogo") {
            pendingRoots.add(node);
          } else if (node.nodeType === 3 && node.parentElement && !node.parentElement.closest("#gsDynamicLogo")) {
            pendingRoots.add(node.parentElement);
          }
        }
      }
      if (pendingRoots.size > 0 && !rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(flushPendingMutations);
      }
    });

    // İlk açılışta ve asenkron API/JSON yüklemeleri tamamlandığında otomatik çevir
    syncSavedLanguageNow();
    [50, 150, 350, 700, 1200, 2200, 3500].forEach((ms) => {
      setTimeout(() => {
        if (getLang() === "en") syncSavedLanguageNow();
      }, ms);
    });

    window.addEventListener("load", syncSavedLanguageNow);
    window.addEventListener("pageshow", syncSavedLanguageNow);
  }

  // Helper for JS alerts / dynamic strings
  function t(trStr) {
    return getLang() === "en" ? convertString(trStr, "en") : trStr;
  }

  window.GameShelfI18n = {
    getLang,
    setLang,
    applyTranslations,
    t
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLangSwitcher);
  } else {
    initLangSwitcher();
  }
})();
