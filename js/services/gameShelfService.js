/**
 * GameShelf Veri & İş Mantığı Servis Katmanı
 * - Koleksiyon, Puanlama ve İnceleme birbirinden tamamen bağımsızdır.
 * - Bilinmeyen tarih veya süreler null tutulur; asla 0 veya "Belirtilmedi" olarak üretilmez.
 */
const GameShelfService = (() => {
  const STORAGE_KEYS = {
    COLLECTIONS: "gs_v1_collections",
    PLAYTHROUGHS: "gs_v1_playthroughs",
    RATINGS: "gs_v1_user_ratings",
    REVIEWS: "gs_v1_user_reviews",
    VOTES: "gs_v1_review_votes"
  };

  let seedCache = null;

  async function loadSeed() {
    if (seedCache) return seedCache;
    const response = await fetch("js/data/gameshelf-seed.json");
    if (!response.ok) throw new Error("gameshelf-seed.json yüklenemedi.");
    seedCache = await response.json();
    return seedCache;
  }

  function readStore(key, defaultValue = []) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  function writeStore(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async function getAllGames() {
    const seed = await loadSeed();
    return seed.games;
  }

  async function getGameDetails(gameId) {
    const seed = await loadSeed();
    const id = Number(gameId) || seed.games[0].id;
    const game = seed.games.find((g) => g.id === id) || seed.games[0];

    const companies = seed.gameCompanies
      .filter((gc) => gc.gameId === game.id)
      .map((gc) => {
        const company = seed.companies.find((c) => c.id === gc.companyId);
        return company ? { ...company, role: gc.role } : null;
      })
      .filter(Boolean);

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
      ? seed.games.find((g) => g.id === game.parentGameId) || null
      : null;

    const dlcs = (game.dlcIds || [])
      .map((did) => seed.games.find((g) => g.id === did))
      .filter(Boolean);

    const editions = (game.editionIds || [])
      .map((eid) => seed.games.find((g) => g.id === eid))
      .filter(Boolean);

    const similarGames = (game.similarGameIds || [])
      .map((sid) => seed.games.find((g) => g.id === sid))
      .filter(Boolean);

    return {
      game,
      parentGame,
      dlcs,
      editions,
      similarGames,
      gameBlogs: game.gameBlogs || [],
      latestNewsBlogs: seed.latestNewsBlogs || [],
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
    const user = seed.currentUser;
    const collections = readStore(STORAGE_KEYS.COLLECTIONS, []).filter((c) => c.userId === user.id);
    const allPlaythroughs = readStore(STORAGE_KEYS.PLAYTHROUGHS, []);
    const userRatings = readStore(STORAGE_KEYS.RATINGS, []).filter((r) => r.userId === user.id);
    const userReviews = readStore(STORAGE_KEYS.REVIEWS, []).filter((r) => r.userId === user.id);
    const userVotes = readStore(STORAGE_KEYS.VOTES, {});

    const entries = collections
      .map((entry) => {
        const game = seed.games.find((g) => g.id === entry.gameId);
        if (!game) return null;
        const pts = allPlaythroughs.filter((p) => p.collectionEntryId === entry.id);
        const knownHours = pts
          .map((p) => p.playtime)
          .filter((v) => v !== null && v !== undefined && !Number.isNaN(Number(v)));
        const totalHours = knownHours.length > 0 ? knownHours.reduce((s, h) => s + Number(h), 0) : null;
        const ratingObj = userRatings.find((r) => r.gameId === game.id) || null;
        const companyRel = seed.gameCompanies.find((gc) => gc.gameId === game.id && gc.role === "developer");
        const studio = companyRel ? seed.companies.find((c) => c.id === companyRel.companyId)?.name : null;
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
        const game = seed.games.find((g) => g.id === rev.gameId) || null;
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
        const game = seed.games.find((g) => g.id === r.gameId);
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
    deleteUserReview
  };
})();
