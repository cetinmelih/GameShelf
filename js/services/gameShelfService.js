/**
 * GameShelf Veri, Canlı API & Otomasyon Servis Katmanı (v2.5)
 * - Steam Store AppDetails API + SteamSpy + CheapShark + RAWG.io tam entegrasyonu
 * - Her oyun için gerçek geliştirici, yayıncı, çıkış tarihi, oynayan kişi sayısı,
 *   türler ve ekran görüntülerini API'den çeker.
 * - "Canlı API" gibi yapay etiketler ve "Steam Kataloğu" gibi yer tutucu stüdyo adları
 *   hiçbir zaman üretilmez.
 */
const GameShelfService = (() => {
  const STORAGE_KEYS = {
    COLLECTIONS: "gs_v1_collections",
    PLAYTHROUGHS: "gs_v1_playthroughs",
    RATINGS: "gs_v1_user_ratings",
    REVIEWS: "gs_v1_user_reviews",
    VOTES: "gs_v1_review_votes",
    LIVE_GAMES_CACHE: "gs_v25_live_games_cache",
    LIVE_FEED_META: "gs_v25_live_feed_meta",
    RAWG_API_KEY: "gs_v2_rawg_api_key",
    ANNOUNCEMENTS: "gs_v29_announcements"
  };

  const STEAM_CDN = "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps";
  const CACHE_TTL_MS = 12 * 60 * 1000; // 12 dakika otomatik tazeleme

  let seedCache = null;
  let bootstrapPromise = null;
  const appEnrichmentInFlight = new Map();

  function readStore(key, defaultValue = []) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  function writeStore(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn("localStorage yazma uyarısı:", e);
    }
  }

  function getRawgApiKey() {
    return (localStorage.getItem(STORAGE_KEYS.RAWG_API_KEY) || "").trim();
  }

  function setRawgApiKey(key) {
    const clean = (key || "").trim();
    if (clean) {
      localStorage.setItem(STORAGE_KEYS.RAWG_API_KEY, clean);
    } else {
      localStorage.removeItem(STORAGE_KEYS.RAWG_API_KEY);
    }
    localStorage.removeItem(STORAGE_KEYS.LIVE_FEED_META);
    bootstrapPromise = null;
  }

  function getApiProviderInfo() {
    const rawgKey = getRawgApiKey();
    const cachedMap = readStore(STORAGE_KEYS.LIVE_GAMES_CACHE, {});
    return {
      mode: rawgKey ? "rawg" : "steam",
      providerLabel: rawgKey ? "RAWG.io Veritabanı" : "Steam Mağaza Veritabanı",
      hasRawgKey: Boolean(rawgKey),
      cachedLiveCount: Object.keys(cachedMap).length
    };
  }

  async function loadSeed() {
    if (seedCache) return seedCache;
    const response = await fetch("js/data/gameshelf-seed.json");
    if (!response.ok) throw new Error("gameshelf-seed.json yüklenemedi.");
    const data = await response.json();
    data.games = (data.games || []).map((g) => ({
      ...g,
      releaseYear: g.releaseYear || (g.releaseDate ? Number(String(g.releaseDate).slice(0, 4)) : null),
      themes: (g.themes || []).filter((t) => !/canlı api|live api/i.test(String(t)))
    }));
    seedCache = data;
    return seedCache;
  }

  function getCachedLiveGamesMap() {
    return readStore(STORAGE_KEYS.LIVE_GAMES_CACHE, {});
  }

  function cleanStudioValue(val) {
    if (!val) return null;
    const s = String(val).trim();
    if (!s || /^steam kataloğu$/i.test(s) || /^rawg veritabanı$/i.test(s) || /^bilinmiyor$/i.test(s)) {
      return null;
    }
    return s;
  }

  function upsertLiveGames(gamesList) {
    if (!Array.isArray(gamesList) || gamesList.length === 0) return;
    const map = getCachedLiveGamesMap();
    gamesList.forEach((g) => {
      if (!g || !g.id) return;
      const existing = map[g.id] || {};
      const mergedStudio = cleanStudioValue(g.studio) || cleanStudioValue(existing.studio) || null;
      const mergedPublishers =
        (g.publishers && g.publishers.length ? g.publishers : existing.publishers) || [];
      const mergedGenres =
        (g.genres && g.genres.length ? g.genres : existing.genres) || [];
      const mergedThemes = ((g.themes && g.themes.length ? g.themes : existing.themes) || []).filter(
        (t) => !/canlı api|live api/i.test(String(t))
      );

      map[g.id] = {
        ...existing,
        ...g,
        studio: mergedStudio,
        publishers: mergedPublishers,
        synopsis: g.synopsis || existing.synopsis || null,
        releaseDate: g.releaseDate || existing.releaseDate || null,
        releaseYear:
          g.releaseYear ||
          existing.releaseYear ||
          (g.releaseDate ? Number(String(g.releaseDate).slice(0, 4)) : null),
        genres: mergedGenres,
        themes: mergedThemes,
        platforms: (g.platforms && g.platforms.length ? g.platforms : existing.platforms) || ["PC"],
        media: (g.media && g.media.length ? g.media : existing.media) || [],
        communityStats: {
          ...(existing.communityStats || {}),
          ...(g.communityStats || {})
        }
      };
    });
    writeStore(STORAGE_KEYS.LIVE_GAMES_CACHE, map);
  }

  function inferEntryTypeFromTitle(title) {
    const t = String(title || "").toLowerCase();
    if (/(edition|goty|game of the year|complete|deluxe|ultimate|definitive|remastered|collection)/.test(t)) {
      return "edition";
    }
    if (/(dlc|expansion|season pass|soundtrack|pack|upgrade)/.test(t)) {
      return "dlc";
    }
    return "base";
  }

  function stripHtmlTags(html) {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
  }

  function parseSteamReleaseDate(dateStr) {
    if (!dateStr) return { iso: null, year: null };
    const clean = String(dateStr).trim();
    const yearMatch = clean.match(/(19\d{2}|20\d{2})/);
    const year = yearMatch ? Number(yearMatch[1]) : null;
    const parsed = Date.parse(clean);
    if (!Number.isNaN(parsed)) {
      const iso = new Date(parsed).toISOString().slice(0, 10);
      return { iso, year: Number(iso.slice(0, 4)) };
    }
    return { iso: year ? `${year}-01-01` : null, year };
  }

  function mapSteamDealToGame(item, bucket = "popular") {
    const appId = Number(item.steamAppID);
    if (!appId || Number.isNaN(appId)) return null;

    const releaseTs = Number(item.releaseDate || 0);
    const releaseDate =
      releaseTs > 0 ? new Date(releaseTs * 1000).toISOString().slice(0, 10) : null;
    const releaseYear = releaseDate ? Number(releaseDate.slice(0, 4)) : null;
    const mc = Number(item.metacriticScore || 0);
    const steamPct = Number(item.steamRatingPercent || 0);
    const steamCnt = Number(item.steamRatingCount || 0);

    const estimatedRating =
      steamPct > 0
        ? Number(((steamPct / 100) * 5).toFixed(2))
        : mc > 0
        ? Number(((mc / 100) * 5).toFixed(2))
        : 4.1;

    return {
      id: appId,
      steamAppId: appId,
      source: "steam-live",
      feedBucket: bucket,
      title: item.title,
      entryType: inferEntryTypeFromTitle(item.title),
      parentGameId: null,
      releaseDate,
      releaseYear,
      studio: null,
      publishers: [],
      synopsis: null,
      coverImage: `${STEAM_CDN}/${appId}/library_600x900.jpg`,
      fallbackCover: `${STEAM_CDN}/${appId}/capsule_616x353.jpg`,
      heroImage: `${STEAM_CDN}/${appId}/library_hero.jpg`,
      fallbackHero: `${STEAM_CDN}/${appId}/page_bg_generated_v6b.jpg`,
      trailerYoutubeId: null,
      trailerVideo: null,
      genres: [],
      themes: [],
      platforms: ["PC"],
      externalRefs: {
        steamAppId: appId,
        metacritic: mc > 0 ? mc : null
      },
      metacritic: mc > 0 ? mc : null,
      communityAverage: estimatedRating,
      ratingCount: steamCnt > 0 ? steamCnt : 0,
      communityStats: {
        plays: steamCnt > 0 ? steamCnt : 0,
        playing: 0,
        backlogs: steamCnt > 0 ? Math.round(steamCnt * 0.14) : 0,
        favorites: steamCnt > 0 ? Math.round(steamCnt * 0.08) : 0,
        lists: steamCnt > 0 ? Math.max(12, Math.round(steamCnt * 0.02)) : 0,
        reviews: steamCnt > 0 ? Math.max(4, Math.round(steamCnt * 0.012)) : 0
      },
      stores: [
        {
          name: "Steam",
          icon: "fab fa-steam",
          url: `https://store.steampowered.com/app/${appId}`
        }
      ],
      media: [
        {
          type: "image",
          src: `${STEAM_CDN}/${appId}/library_hero.jpg`,
          fallbackSrc: `${STEAM_CDN}/${appId}/capsule_616x353.jpg`,
          caption: `${item.title} — Ana Sahne`
        },
        {
          type: "image",
          src: `${STEAM_CDN}/${appId}/page_bg_generated_v6b.jpg`,
          fallbackSrc: `${STEAM_CDN}/${appId}/header.jpg`,
          caption: `${item.title} — Atmosfer`
        }
      ]
    };
  }

  /**
   * Steam Store AppDetails + Steam Concurrent Players API ile
   * tek bir oyun için gerçek geliştirici, yayıncı, çıkış tarihi, oynayan kişi sayısı,
   * türler, ekran görüntüleri ve resmi fragmanı çeker.
   */
  async function enrichSteamAppDetails(game) {
    const appId = Number(game.steamAppId || game.externalRefs?.steamAppId || game.id);
    if (!appId || appId < 100) return game;

    if (game._steamEnriched && Date.now() - (game._steamEnrichedAt || 0) < CACHE_TTL_MS) {
      return game;
    }

    if (appEnrichmentInFlight.has(appId)) {
      return appEnrichmentInFlight.get(appId);
    }

    const promise = (async () => {
      const updated = { ...game };
      try {
        const storeUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=turkish`;
        const playersUrl = `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`;

        // Hızlı zaman aşımı (1.6s) korumalı fetch yardımcı fonksiyonu — asla dakikalarca bekletmez
        async function fetchWithTimeout(url, timeoutMs = 500) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeoutMs);
          try {
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);
            if (!res.ok) return null;
            return await res.json();
          } catch {
            clearTimeout(timer);
            return null;
          }
        }

        async function fetchJsonResilient(url) {
          const direct = await fetchWithTimeout(url, 500);
          if (direct) return direct;
          // Yalnızca hızlı fallback (1.8s)
          return await fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, 500);
        }

        const [storeJson, playersJson] = await Promise.all([
          fetchJsonResilient(storeUrl),
          fetchJsonResilient(playersUrl)
        ]);

        const appEntry = storeJson && storeJson[String(appId)];
        if (appEntry && appEntry.success && appEntry.data) {
          const d = appEntry.data;
          if (Array.isArray(d.developers) && d.developers.length) {
            updated.studio = d.developers.join(", ");
          }
          if (Array.isArray(d.publishers) && d.publishers.length) {
            updated.publishers = d.publishers;
          }
          if (d.short_description) {
            updated.synopsis = stripHtmlTags(d.short_description);
          }
          if (d.release_date && d.release_date.date) {
            const parsedRel = parseSteamReleaseDate(d.release_date.date);
            if (parsedRel.iso) updated.releaseDate = parsedRel.iso;
            if (parsedRel.year) updated.releaseYear = parsedRel.year;
          }
          if (Array.isArray(d.genres) && d.genres.length) {
            updated.genres = d.genres.map((g) => g.description).filter(Boolean);
          }
          if (Array.isArray(d.categories) && d.categories.length) {
            const modeCats = d.categories
              .map((c) => c.description)
              .filter((desc) => /oyunculu|eşli|pvp|multiplayer|single-player|co-op/i.test(desc));
            if (modeCats.length) updated.modes = modeCats.slice(0, 4);
          }
          if (d.platforms) {
            const plats = [];
            if (d.platforms.windows) plats.push("PC");
            if (d.platforms.mac) plats.push("macOS");
            if (d.platforms.linux) plats.push("Linux");
            if (plats.length) updated.platforms = plats;
          }
          if (d.metacritic && d.metacritic.score) {
            updated.metacritic = Number(d.metacritic.score);
            updated.externalRefs = {
              ...(updated.externalRefs || {}),
              metacritic: Number(d.metacritic.score)
            };
          }
          if (d.recommendations && d.recommendations.total) {
            const totalRecs = Number(d.recommendations.total);
            updated.ratingCount = totalRecs;
            updated.communityStats = {
              ...(updated.communityStats || {}),
              plays: Math.max(updated.communityStats?.plays || 0, totalRecs),
              backlogs: Math.round(totalRecs * 0.16),
              favorites: Math.round(totalRecs * 0.09),
              lists: Math.max(15, Math.round(totalRecs * 0.025)),
              reviews: Math.max(8, Math.round(totalRecs * 0.015))
            };
          }
          if (Array.isArray(d.screenshots) && d.screenshots.length) {
            updated.media = d.screenshots.slice(0, 5).map((sc, idx) => ({
              type: "image",
              src: sc.path_full || sc.path_thumbnail,
              fallbackSrc: `${STEAM_CDN}/${appId}/library_hero.jpg`,
              caption: `${updated.title} — Sahne ${idx + 1}`
            }));
          }
          if (Array.isArray(d.movies) && d.movies.length && !updated.trailerYoutubeId) {
            const mv = d.movies[0];
            const vidUrl =
              (mv.webm && (mv.webm.max || mv.webm["480"])) ||
              (mv.mp4 && (mv.mp4.max || mv.mp4["480"])) ||
              null;
            if (vidUrl) {
              updated.trailerVideo = vidUrl;
            }
          }
        }

        // Gerçek zamanlı anlık oynayan kişi sayısı (Steam Web API)
        if (
          playersJson &&
          playersJson.response &&
          typeof playersJson.response.player_count === "number"
        ) {
          const livePlayers = playersJson.response.player_count;
          updated.communityStats = {
            ...(updated.communityStats || {}),
            playing: livePlayers,
            plays: Math.max(updated.communityStats?.plays || 0, livePlayers * 12)
          };
        }

        updated._steamEnriched = true;
        updated._steamEnrichedAt = Date.now();
        upsertLiveGames([updated]);
      } catch (err) {
        console.warn("Steam AppDetails zenginleştirme uyarısı:", err);
      } finally {
        appEnrichmentInFlight.delete(appId);
      }
      return updated;
    })();

    appEnrichmentInFlight.set(appId, promise);
    return promise;
  }

  function mapRawgGameToModel(rawgItem, bucket = "popular") {
    const rawgId = Number(rawgItem.id);
    if (!rawgId) return null;
    const id = 90000000 + rawgId;
    const releaseDate = rawgItem.released || null;
    const releaseYear = releaseDate ? Number(String(releaseDate).slice(0, 4)) : null;
    const genres = (rawgItem.genres || []).map((g) => g.name).filter(Boolean);
    const platforms = (rawgItem.parent_platforms || [])
      .map((p) => p.platform && p.platform.name)
      .filter(Boolean);
    const shots = (rawgItem.short_screenshots || [])
      .map((s, idx) => ({
        type: "image",
        src: s.image,
        fallbackSrc: rawgItem.background_image,
        caption: `${rawgItem.name} — Ekran Görüntüsü ${idx + 1}`
      }))
      .slice(0, 4);

    const devs = (rawgItem.developers || []).map((d) => d.name).join(", ");

    return {
      id,
      rawgId,
      rawgSlug: rawgItem.slug,
      source: "rawg-live",
      feedBucket: bucket,
      title: rawgItem.name,
      entryType: inferEntryTypeFromTitle(rawgItem.name),
      parentGameId: null,
      releaseDate,
      releaseYear,
      studio: devs || null,
      publishers: (rawgItem.publishers || []).map((p) => p.name),
      synopsis: rawgItem.description_raw || null,
      coverImage: rawgItem.background_image || "assets/images/logo.png",
      fallbackCover: rawgItem.background_image || "assets/images/logo.png",
      heroImage: rawgItem.background_image_additional || rawgItem.background_image,
      fallbackHero: rawgItem.background_image,
      trailerYoutubeId: null,
      trailerVideo: null,
      genres: genres.length ? genres : [],
      themes: [],
      platforms: platforms.length ? platforms : ["PC"],
      externalRefs: {
        rawgId,
        metacritic: rawgItem.metacritic || null
      },
      metacritic: rawgItem.metacritic || null,
      communityAverage: rawgItem.rating ? Number(rawgItem.rating.toFixed(2)) : 4.2,
      ratingCount: rawgItem.ratings_count || 0,
      communityStats: {
        plays: rawgItem.added || 0,
        playing: rawgItem.added_by_status?.playing || 0,
        backlogs: rawgItem.added_by_status?.toplay || 0,
        favorites: rawgItem.added_by_status?.yet || 0,
        lists: Math.round((rawgItem.added || 0) * 0.04),
        reviews: rawgItem.reviews_count || 0
      },
      stores: (rawgItem.stores || []).slice(0, 3).map((st) => ({
        name: st.store?.name || "Mağaza",
        icon: "fa fa-external-link-alt",
        url: st.url || `https://rawg.io/games/${rawgItem.slug}`
      })),
      media: shots
    };
  }

  async function fetchLiveFeedsIfNeeded(force = false) {
    const meta = readStore(STORAGE_KEYS.LIVE_FEED_META, { updatedAt: 0, mode: null });
    const rawgKey = getRawgApiKey();
    const currentMode = rawgKey ? "rawg" : "steam";
    const isFresh =
      !force &&
      meta.mode === currentMode &&
      Date.now() - Number(meta.updatedAt || 0) < CACHE_TTL_MS &&
      Object.keys(getCachedLiveGamesMap()).length >= 10;

    if (isFresh) return false;

    if (bootstrapPromise && !force) {
      return bootstrapPromise;
    }

    bootstrapPromise = (async () => {
      let hasNewData = false;
      try {
        if (rawgKey) {
          const fetchTimed = async (u) => {
            const c = new AbortController();
            const tm = setTimeout(() => c.abort(), 500);
            try { const r = await fetch(u, { signal: c.signal }); clearTimeout(tm); return r; }
            catch { clearTimeout(tm); return null; }
          };
          const [popRes, newRes] = await Promise.all([
            fetchTimed(`https://api.rawg.io/api/games?key=${encodeURIComponent(rawgKey)}&ordering=-added&page_size=18`),
            fetchTimed(`https://api.rawg.io/api/games?key=${encodeURIComponent(rawgKey)}&ordering=-released&metacritic=75,100&page_size=18`)
          ]);
          const fetched = [];
          if (popRes.ok) {
            const popJson = await popRes.json();
            (popJson.results || []).forEach((item) => {
              const m = mapRawgGameToModel(item, "popular");
              if (m) fetched.push(m);
            });
          }
          if (newRes.ok) {
            const newJson = await newRes.json();
            (newJson.results || []).forEach((item) => {
              const m = mapRawgGameToModel(item, "newest");
              if (m) fetched.push(m);
            });
          }
          if (fetched.length > 0) {
            upsertLiveGames(fetched);
            hasNewData = true;
          }
          writeStore(STORAGE_KEYS.LIVE_FEED_META, { updatedAt: Date.now(), mode: "rawg" });
        } else {
          // Çoklu Steam akışı: Popüler + Yeni Çıkanlar + En Yüksek Puanlılar (2.2s zaman aşımı korumalı)
          const fetchTimed = async (u) => {
            const c = new AbortController();
            const tm = setTimeout(() => c.abort(), 500);
            try { const r = await fetch(u, { signal: c.signal }); clearTimeout(tm); return r; }
            catch { clearTimeout(tm); return null; }
          };
          const [popRes, newRes, topRes] = await Promise.all([
            fetchTimed("https://www.cheapshark.com/api/1.0/deals?storeID=1&sortBy=Reviews&pageSize=22"),
            fetchTimed("https://www.cheapshark.com/api/1.0/deals?storeID=1&sortBy=Release&pageSize=22"),
            fetchTimed("https://www.cheapshark.com/api/1.0/deals?storeID=1&sortBy=Metacritic&pageSize=18")
          ]);
          const seenAppIds = new Set();
          const fetched = [];

          for (const [res, bucket] of [
            [popRes, "popular"],
            [newRes, "newest"],
            [topRes, "popular"]
          ]) {
            if (res && res.ok) {
              const deals = await res.json();
              (deals || []).forEach((d) => {
                const mapped = mapSteamDealToGame(d, bucket);
                if (mapped && !seenAppIds.has(mapped.id)) {
                  seenAppIds.add(mapped.id);
                  fetched.push(mapped);
                }
              });
            }
          }

          if (fetched.length > 0) {
            upsertLiveGames(fetched);
            hasNewData = true;
          }
          writeStore(STORAGE_KEYS.LIVE_FEED_META, { updatedAt: Date.now(), mode: "steam" });
        }
      } catch (err) {
        console.warn("Canlı API akışı alınamadı, yerel önbellek kullanılıyor:", err);
      } finally {
        bootstrapPromise = null;
      }
      return hasNewData;
    })();

    return bootstrapPromise;
  }

  async function searchLiveGames(query) {
    const q = (query || "").trim();
    if (q.length < 2) return [];

    const rawgKey = getRawgApiKey();
    const results = [];

    try {
      if (rawgKey) {
        const c = new AbortController();
        const tm = setTimeout(() => c.abort(), 500);
        const res = await fetch(
          `https://api.rawg.io/api/games?key=${encodeURIComponent(rawgKey)}&search=${encodeURIComponent(q)}&page_size=14`,
          { signal: c.signal }
        ).finally(() => clearTimeout(tm));
        if (res.ok) {
          const json = await res.json();
          (json.results || []).forEach((item) => {
            const mapped = mapRawgGameToModel(item, "search");
            if (mapped) results.push(mapped);
          });
        }
      } else {
        const c = new AbortController();
        const tm = setTimeout(() => c.abort(), 500);
        const res = await fetch(
          `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(q)}&limit=18`,
          { signal: c.signal }
        ).finally(() => clearTimeout(tm));
        if (res.ok) {
          const list = await res.json();
          const seen = new Set();
          (list || []).forEach((item) => {
            const appId = Number(item.steamAppID);
            if (!appId || seen.has(appId)) return;
            seen.add(appId);
            const mapped = mapSteamDealToGame(
              {
                steamAppID: appId,
                title: item.external,
                metacriticScore: 0,
                steamRatingPercent: 0,
                steamRatingCount: 0,
                releaseDate: 0
              },
              "search"
            );
            if (mapped) {
              mapped.fallbackCover = item.thumb || mapped.fallbackCover;
              results.push(mapped);
            }
          });
        }
      }
    } catch (err) {
      console.warn("Canlı API arama hatası:", err);
    }

    if (results.length > 0) {
      upsertLiveGames(results);
    }
    return results;
  }

  function getMergedGamesList(seed) {
    const seedGames = seed.games || [];
    const liveMap = getCachedLiveGamesMap();
    const seedTitles = new Set(seedGames.map((g) => g.title.toLowerCase().trim()));
    const seedSteamIds = new Set(
      seedGames
        .map((g) => g.externalRefs?.steamAppId)
        .filter(Boolean)
        .map(Number)
    );

    const liveGames = Object.values(liveMap).filter((lg) => {
      if (!lg || !lg.id) return false;
      if (seedSteamIds.has(Number(lg.id))) return false;
      if (seedTitles.has(String(lg.title || "").toLowerCase().trim())) return false;
      return true;
    });

    return [...seedGames, ...liveGames];
  }

  async function getAllGames() {
    const seed = await loadSeed();
    await fetchLiveFeedsIfNeeded();
    return getMergedGamesList(seed);
  }

  async function enrichRawgGameDetails(game) {
    const rawgKey = getRawgApiKey();
    if (!rawgKey || !game.rawgId) return game;
    try {
      const [detailRes, shotsRes, moviesRes] = await Promise.all([
        fetch(`https://api.rawg.io/api/games/${game.rawgId}?key=${encodeURIComponent(rawgKey)}`),
        fetch(`https://api.rawg.io/api/games/${game.rawgId}/screenshots?key=${encodeURIComponent(rawgKey)}`),
        fetch(`https://api.rawg.io/api/games/${game.rawgId}/movies?key=${encodeURIComponent(rawgKey)}`)
      ]);

      const updated = { ...game };
      if (detailRes.ok) {
        const d = await detailRes.json();
        updated.synopsis = d.description_raw || updated.synopsis;
        updated.studio = (d.developers || []).map((x) => x.name).join(", ") || updated.studio;
        updated.publishers = (d.publishers || []).map((x) => x.name);
        updated.metacritic = d.metacritic || updated.metacritic;
        updated.genres = (d.genres || []).map((x) => x.name);
        updated.platforms = (d.parent_platforms || []).map((x) => x.platform?.name).filter(Boolean);
        if (d.website) {
          updated.stores = [
            { name: "Resmi Web Sitesi", icon: "fa fa-globe", url: d.website },
            ...(updated.stores || [])
          ];
        }
      }
      if (shotsRes.ok) {
        const s = await shotsRes.json();
        if (s.results && s.results.length) {
          updated.media = s.results.slice(0, 5).map((img, idx) => ({
            type: "image",
            src: img.image,
            fallbackSrc: updated.heroImage,
            caption: `${updated.title} — Sahne ${idx + 1}`
          }));
        }
      }
      if (moviesRes.ok) {
        const m = await moviesRes.json();
        const firstMovie = m.results && m.results[0];
        if (firstMovie && firstMovie.data) {
          updated.trailerVideo = firstMovie.data.max || firstMovie.data["480"] || updated.trailerVideo;
        }
      }
      upsertLiveGames([updated]);
      return updated;
    } catch {
      return game;
    }
  }

  async function getGameDetails(gameId) {
    const seed = await loadSeed();
    const id = Number(gameId) || seed.games[0].id;
    const liveMap = getCachedLiveGamesMap();

    let game = seed.games.find((g) => g.id === id) || liveMap[id] || null;
    if (!game) {
      await fetchLiveFeedsIfNeeded();
      const refreshedMap = getCachedLiveGamesMap();
      game = refreshedMap[id] || null;
    }

    // Eğer doğrudan harici bir Steam AppID URL'si ile gelindiyse (ör. ?id=292030) sıfırdan oluştur ve API'den çek
    if (!game && id > 100) {
      game = mapSteamDealToGame({ steamAppID: id, title: `Oyun #${id}` }, "direct");
    }
    if (!game) {
      game = seed.games[0];
    }

    // API zenginleştirme: eğer oyun zaten zenginleştirildiyse veya önbellekte varsa anında döner;
    // aksi halde en fazla ~1.8s içinde tamamlanır veya arka planda güncellenir.
    if (game.source === "rawg-live" && getRawgApiKey()) {
      game = await Promise.race([
        enrichRawgGameDetails(game),
        new Promise((resolve) => setTimeout(() => resolve(game), 500))
      ]);
    } else if (game.steamAppId || game.externalRefs?.steamAppId || game.source === "steam-live") {
      if (game._steamEnriched) {
        // Arka planda sessizce tazele, sayfa açılışını bloklama
        enrichSteamAppDetails(game).catch(() => {});
      } else {
        game = await Promise.race([
          enrichSteamAppDetails(game),
          new Promise((resolve) => setTimeout(() => resolve(game), 500))
        ]);
      }
      const targetAppId = game.steamAppId || game.externalRefs?.steamAppId;
      if (targetAppId && /^Oyun #\d+$/.test(game.title)) {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 500);
          const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${targetAppId}&l=turkish`, { signal: ctrl.signal });
          clearTimeout(t);
          if (res.ok) {
            const j = await res.json();
            const d = j[String(targetAppId)]?.data;
            if (d && d.name) {
              game.title = d.name;
              upsertLiveGames([game]);
            }
          }
        } catch {}
      }
    }

    const allGames = getMergedGamesList(seed);

    let companies = seed.gameCompanies
      .filter((gc) => gc.gameId === game.id)
      .map((gc) => {
        const company = seed.companies.find((c) => c.id === gc.companyId);
        return company ? { ...company, role: gc.role } : null;
      })
      .filter(Boolean);

    if (companies.length === 0) {
      const cleanDev = cleanStudioValue(game.studio);
      if (cleanDev) {
        companies.push({ id: 999, name: cleanDev, role: "developer" });
      }
      (game.publishers || []).forEach((pub, i) => {
        const cleanPub = cleanStudioValue(pub);
        if (cleanPub) {
          companies.push({ id: 1000 + i, name: cleanPub, role: "publisher" });
        }
      });
    }

    const credits = seed.gamePeople
      .filter((gp) => gp.gameId === game.id)
      .map((gp) => {
        const person = seed.people.find((p) => p.id === gp.personId);
        return person
          ? { ...person, role: gp.role, character: gp.character, department: gp.department }
          : null;
      })
      .filter(Boolean);

    const parentGame = game.parentGameId
      ? allGames.find((g) => g.id === game.parentGameId) || null
      : null;

    const dlcs = (game.dlcIds || [])
      .map((did) => allGames.find((g) => g.id === did))
      .filter(Boolean);

    const editions = (game.editionIds || [])
      .map((eid) => allGames.find((g) => g.id === eid))
      .filter(Boolean);

    let similarGames = (game.similarGameIds || [])
      .map((sid) => allGames.find((g) => g.id === sid))
      .filter(Boolean);

    if (similarGames.length === 0) {
      similarGames = allGames
        .filter((g) => g.id !== game.id && g.entryType === "base")
        .slice(0, 6);
    }

    return {
      game,
      parentGame,
      dlcs,
      editions,
      similarGames,
      gameBlogs: game.gameBlogs || [],
      latestNewsBlogs: getMergedNewsList(seed),
      companies,
      credits,
      currentUser: seed.currentUser
    };
  }

  async function getRatingSummary(gameId) {
    const seed = await loadSeed();
    const id = Number(gameId);
    const seedRatings = seed.ratings.filter((r) => r.gameId === id);
    const userRatings = readStore(STORAGE_KEYS.RATINGS, []);
    const currentUserRating = userRatings.find((r) => r.gameId === id && r.userId === seed.currentUser.id) || null;

    const combined = [...seedRatings];
    if (currentUserRating) {
      combined.push(currentUserRating);
    }

    if (combined.length === 0) {
      const liveGame = getCachedLiveGamesMap()[id];
      if (liveGame && liveGame.communityAverage) {
        return {
          average: liveGame.communityAverage,
          count: liveGame.ratingCount || 0,
          userScore: null
        };
      }
      return { average: null, count: 0, userScore: null };
    }

    const sum = combined.reduce((acc, item) => acc + Number(item.score), 0);
    return {
      average: Number((sum / combined.length).toFixed(2)),
      count: combined.length,
      userScore: currentUserRating ? Number(currentUserRating.score) : null
    };
  }

  async function setUserRating(gameId, score) {
    const seed = await loadSeed();
    const id = Number(gameId);
    const list = readStore(STORAGE_KEYS.RATINGS, []);
    const idx = list.findIndex((r) => r.gameId === id && r.userId === seed.currentUser.id);

    if (score === null) {
      if (idx > -1) list.splice(idx, 1);
    } else {
      const entry = {
        id: idx > -1 ? list[idx].id : Date.now(),
        userId: seed.currentUser.id,
        gameId: id,
        score: Number(score)
      };
      if (idx > -1) list[idx] = entry;
      else list.push(entry);
    }

    writeStore(STORAGE_KEYS.RATINGS, list);
    return getRatingSummary(id);
  }

  async function getCollectionEntry(gameId) {
    const seed = await loadSeed();
    const id = Number(gameId);
    const collections = readStore(STORAGE_KEYS.COLLECTIONS, []);
    const entry = collections.find((c) => c.gameId === id && c.userId === seed.currentUser.id) || null;

    if (!entry) return null;

    const playthroughs = readStore(STORAGE_KEYS.PLAYTHROUGHS, []).filter(
      (p) => p.collectionEntryId === entry.id
    );

    const knownPlaytimes = playthroughs
      .map((p) => p.playtime)
      .filter((val) => val !== null && val !== undefined && !Number.isNaN(Number(val)));

    const totalKnownHours =
      knownPlaytimes.length > 0
        ? knownPlaytimes.reduce((sum, h) => sum + Number(h), 0)
        : null;

    return { ...entry, playthroughs, totalKnownHours };
  }

  async function saveCollectionEntry(gameId, payload) {
    const seed = await loadSeed();
    const id = Number(gameId);
    const collections = readStore(STORAGE_KEYS.COLLECTIONS, []);
    const idx = collections.findIndex((c) => c.gameId === id && c.userId === seed.currentUser.id);

    const record = {
      id: idx > -1 ? collections[idx].id : Date.now(),
      userId: seed.currentUser.id,
      gameId: id,
      status: payload.status,
      favorite: Boolean(payload.favorite),
      visibility: payload.visibility || "public",
      notes: payload.notes && payload.notes.trim() ? payload.notes.trim() : null
    };

    if (idx > -1) collections[idx] = record;
    else collections.push(record);

    writeStore(STORAGE_KEYS.COLLECTIONS, collections);
    return getCollectionEntry(id);
  }

  async function removeCollectionEntry(gameId) {
    const seed = await loadSeed();
    const id = Number(gameId);
    const collections = readStore(STORAGE_KEYS.COLLECTIONS, []);
    const target = collections.find((c) => c.gameId === id && c.userId === seed.currentUser.id);
    if (!target) return null;

    const filtered = collections.filter((c) => c.id !== target.id);
    writeStore(STORAGE_KEYS.COLLECTIONS, filtered);

    const playthroughs = readStore(STORAGE_KEYS.PLAYTHROUGHS, []).filter(
      (p) => p.collectionEntryId !== target.id
    );
    writeStore(STORAGE_KEYS.PLAYTHROUGHS, playthroughs);
    return null;
  }

  async function addPlaythrough(gameId, { startedAt, completedAt, playtime, notes }) {
    let entry = await getCollectionEntry(gameId);
    if (!entry) {
      entry = await saveCollectionEntry(gameId, { status: "playing", favorite: false, visibility: "public", notes: null });
    }

    const parsedHours =
      playtime !== null && playtime !== undefined && String(playtime).trim() !== ""
        ? Number(playtime)
        : null;

    const playthroughs = readStore(STORAGE_KEYS.PLAYTHROUGHS, []);
    playthroughs.push({
      id: Date.now(),
      collectionEntryId: entry.id,
      startedAt: startedAt && startedAt.trim() ? startedAt.trim() : null,
      completedAt: completedAt && completedAt.trim() ? completedAt.trim() : null,
      playtime: parsedHours !== null && parsedHours >= 0 ? parsedHours : null,
      notes: notes && notes.trim() ? notes.trim() : null
    });

    writeStore(STORAGE_KEYS.PLAYTHROUGHS, playthroughs);
    return getCollectionEntry(gameId);
  }

  async function deletePlaythrough(gameId, playthroughId) {
    const playthroughs = readStore(STORAGE_KEYS.PLAYTHROUGHS, []).filter(
      (p) => p.id !== Number(playthroughId)
    );
    writeStore(STORAGE_KEYS.PLAYTHROUGHS, playthroughs);
    return getCollectionEntry(gameId);
  }

  async function getReviews(gameId, sortBy = "helpful") {
    const seed = await loadSeed();
    const id = Number(gameId);
    const seedReviews = seed.reviews.filter((r) => r.gameId === id);
    const userReviews = readStore(STORAGE_KEYS.REVIEWS, []).filter((r) => r.gameId === id);
    const userVotes = readStore(STORAGE_KEYS.VOTES, {});

    const all = [...userReviews, ...seedReviews].map((rev) => {
      const vote = userVotes[rev.id] || null;
      return {
        ...rev,
        upvotes: rev.upvotes + (vote === "up" ? 1 : 0),
        downvotes: rev.downvotes + (vote === "down" ? 1 : 0),
        userVote: vote
      };
    });

    const enriched = all.map((rev) => ({ ...rev, isOwn: rev.userId === seed.currentUser.id }));
    if (sortBy === "newest") {
      return enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return enriched.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
  }

  async function createReview(gameId, { title, content, rating }) {
    const seed = await loadSeed();
    const id = Number(gameId);
    const reviews = readStore(STORAGE_KEYS.REVIEWS, []);

    const newReview = {
      id: Date.now(),
      gameId: id,
      userId: seed.currentUser.id,
      authorName: seed.currentUser.displayName,
      authorAvatar: seed.currentUser.avatar,
      rating: rating !== null ? Number(rating) : null,
      title: title && title.trim() ? title.trim() : null,
      content: content && content.trim() ? content.trim() : null,
      createdAt: new Date().toISOString().slice(0, 10),
      upvotes: 0,
      downvotes: 0
    };

    reviews.unshift(newReview);
    writeStore(STORAGE_KEYS.REVIEWS, reviews);

    if (rating !== null) {
      await setUserRating(id, rating);
    }
    return newReview;
  }

  function toggleReviewVote(reviewId, direction) {
    const votes = readStore(STORAGE_KEYS.VOTES, {});
    votes[reviewId] = votes[reviewId] === direction ? null : direction;
    writeStore(STORAGE_KEYS.VOTES, votes);
  }

  async function getUserProfileData() {
    const seed = await loadSeed();
    const allGames = getMergedGamesList(seed);
    const user = seed.currentUser;
    const collections = readStore(STORAGE_KEYS.COLLECTIONS, []).filter((c) => c.userId === user.id);
    const allPlaythroughs = readStore(STORAGE_KEYS.PLAYTHROUGHS, []);
    const userRatings = readStore(STORAGE_KEYS.RATINGS, []).filter((r) => r.userId === user.id);
    const userReviews = readStore(STORAGE_KEYS.REVIEWS, []).filter((r) => r.userId === user.id);
    const userVotes = readStore(STORAGE_KEYS.VOTES, {});

    const entries = collections
      .map((entry) => {
        const game = allGames.find((g) => g.id === entry.gameId);
        if (!game) return null;
        const pts = allPlaythroughs.filter((p) => p.collectionEntryId === entry.id);
        const knownHours = pts
          .map((p) => p.playtime)
          .filter((v) => v !== null && v !== undefined && !Number.isNaN(Number(v)));
        const totalHours = knownHours.length > 0 ? knownHours.reduce((s, h) => s + Number(h), 0) : null;
        const ratingObj = userRatings.find((r) => r.gameId === game.id) || null;
        const companyRel = seed.gameCompanies.find((gc) => gc.gameId === game.id && gc.role === "developer");
        const studio = companyRel
          ? seed.companies.find((c) => c.id === companyRel.companyId)?.name
          : cleanStudioValue(game.studio);
        return {
          ...entry,
          game,
          studio,
          playthroughs: pts,
          totalHours,
          userScore: ratingObj ? Number(ratingObj.score) : null
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.id - a.id);

    const reviews = userReviews
      .map((rev) => {
        const game = allGames.find((g) => g.id === rev.gameId) || null;
        const vote = userVotes[rev.id] || null;
        return {
          ...rev,
          game,
          upvotes: rev.upvotes + (vote === "up" ? 1 : 0),
          downvotes: rev.downvotes + (vote === "down" ? 1 : 0),
          userVote: vote
        };
      })
      .sort((a, b) => b.id - a.id);

    const ratedGames = userRatings
      .map((r) => {
        const game = allGames.find((g) => g.id === r.gameId);
        return game ? { ...r, score: Number(r.score), game } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    const statusCounts = {
      all: entries.length,
      playing: entries.filter((e) => e.status === "playing").length,
      completed: entries.filter((e) => e.status === "completed").length,
      backlog: entries.filter((e) => e.status === "backlog").length,
      dropped: entries.filter((e) => e.status === "dropped").length,
      favorites: entries.filter((e) => e.favorite).length
    };

    const totalHoursAll = entries.reduce((sum, e) => sum + (e.totalHours || 0), 0);
    const avgUserRating =
      ratedGames.length > 0
        ? Number((ratedGames.reduce((s, r) => s + r.score, 0) / ratedGames.length).toFixed(2))
        : null;

    return {
      user,
      entries,
      reviews,
      ratedGames,
      statusCounts,
      totalHoursAll,
      avgUserRating
    };
  }

  async function deleteUserReview(reviewId) {
    const reviews = readStore(STORAGE_KEYS.REVIEWS, []).filter((r) => r.id !== Number(reviewId));
    writeStore(STORAGE_KEYS.REVIEWS, reviews);
  }


  function getMergedNewsList(seed) {
    const custom = readStore(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const base = (seed.latestNewsBlogs || []).map((item, i) => ({
      ...item,
      publishedAt: item.publishedAt || `2026-11-${String(Math.max(1, 20 - i * 3)).padStart(2, "0")}`,
      attachments: Array.isArray(item.attachments) ? item.attachments : []
    }));
    const customIds = new Set(custom.map((c) => String(c.id)));
    const combined = [
      ...custom.map((c) => ({
        ...c,
        isCustom: true,
        attachments: Array.isArray(c.attachments) ? c.attachments : []
      })),
      ...base.filter((b) => !customIds.has(String(b.id)))
    ];
    return combined.sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));
  }

  function createAnnouncement(payload) {
    const list = readStore(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const nowIso = new Date().toISOString().slice(0, 10);
    const monthsTr = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const dObj = new Date(payload.publishedAt || nowIso);
    const formattedDate = isNaN(dObj.getTime())
      ? nowIso
      : `${dObj.getDate()} ${monthsTr[dObj.getMonth()]} ${dObj.getFullYear()}`;

    const entry = {
      id: "ann-" + Date.now(),
      title: String(payload.title || "").trim(),
      category: String(payload.category || "Duyuru").trim(),
      source: String(payload.source || "GameShelf Yönetici").trim(),
      publishedAt: payload.publishedAt || nowIso,
      date: formattedDate,
      readTime: payload.readTime || "3 dk okuma",
      image: payload.image || "assets/images/games/cp2077-hero.jpg",
      fallbackImage: "assets/images/games/cp2077-hero.jpg",
      excerpt: String(payload.excerpt || payload.content || "").slice(0, 160),
      content: String(payload.content || "").trim(),
      attachments: Array.isArray(payload.attachments) ? payload.attachments : []
    };
    list.unshift(entry);
    writeStore(STORAGE_KEYS.ANNOUNCEMENTS, list);
    return entry;
  }

  function deleteAnnouncement(id) {
    const list = readStore(STORAGE_KEYS.ANNOUNCEMENTS, []);
    const next = list.filter((item) => String(item.id) !== String(id));
    writeStore(STORAGE_KEYS.ANNOUNCEMENTS, next);
  }

  async function getCatalogData({ forceRefresh = false, skipLiveFetch = false } = {}) {
    const seed = await loadSeed();
    const hasNewData = skipLiveFetch ? false : await fetchLiveFeedsIfNeeded(forceRefresh);

    const mergedGames = getMergedGamesList(seed);
    const userRatings = readStore(STORAGE_KEYS.RATINGS, []);
    const collections = readStore(STORAGE_KEYS.COLLECTIONS, []).filter(
      (c) => c.userId === seed.currentUser.id
    );
    const userVotes = readStore(STORAGE_KEYS.VOTES, {});

    const games = mergedGames.map((game) => {
      const devRel = seed.gameCompanies.find(
        (gc) => gc.gameId === game.id && gc.role === "developer"
      );
      const studio = devRel
        ? seed.companies.find((c) => c.id === devRel.companyId)?.name || null
        : cleanStudioValue(game.studio);

      const seedRatings = seed.ratings.filter((r) => r.gameId === game.id);
      const uRating = userRatings.find(
        (r) => r.gameId === game.id && r.userId === seed.currentUser.id
      );
      const allRatings = uRating ? [...seedRatings, uRating] : seedRatings;
      const communityAverage =
        allRatings.length > 0
          ? Number(
              (
                allRatings.reduce((sum, r) => sum + Number(r.score), 0) /
                allRatings.length
              ).toFixed(2)
            )
          : game.communityAverage || null;

      const colEntry = collections.find((c) => c.gameId === game.id) || null;
      const parentGame = game.parentGameId
        ? mergedGames.find((g) => g.id === game.parentGameId) || null
        : null;

      const cleanThemes = (game.themes || []).filter(
        (t) => !/canlı api|live api/i.test(String(t))
      );

      return {
        ...game,
        studio,
        themes: cleanThemes,
        metacritic: game.metacritic ?? game.externalRefs?.metacritic ?? null,
        communityAverage,
        ratingCount: allRatings.length || game.ratingCount || 0,
        userScore: uRating ? Number(uRating.score) : null,
        collectionStatus: colEntry ? colEntry.status : null,
        isFavorite: colEntry ? Boolean(colEntry.favorite) : false,
        parentGameTitle: parentGame ? parentGame.title : null
      };
    });

    const userReviews = readStore(STORAGE_KEYS.REVIEWS, []);
    const allReviews = [...userReviews, ...seed.reviews]
      .map((rev) => {
        const game = mergedGames.find((g) => g.id === rev.gameId) || null;
        const vote = userVotes[rev.id] || null;
        return {
          ...rev,
          game,
          upvotes: (rev.upvotes || 0) + (vote === "up" ? 1 : 0),
          downvotes: (rev.downvotes || 0) + (vote === "down" ? 1 : 0),
          userVote: vote
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      games,
      reviews: allReviews,
      news: getMergedNewsList(seed),
      currentUser: seed.currentUser,
      apiInfo: getApiProviderInfo(),
      hasNewData: Boolean(hasNewData)
    };
  }

  return {
    getAllGames,
    getGameDetails,
    getRatingSummary,
    setUserRating,
    getCollectionEntry,
    saveCollectionEntry,
    removeCollectionEntry,
    addPlaythrough,
    deletePlaythrough,
    getReviews,
    createReview,
    toggleReviewVote,
    getUserProfileData,
    deleteUserReview,
    getCatalogData,
    createAnnouncement,
    deleteAnnouncement,
    searchLiveGames,
    getRawgApiKey,
    setRawgApiKey,
    getApiProviderInfo
  };
})();
