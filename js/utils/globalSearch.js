/**
 * GameShelf Global Navbar Oyun Arama & Anlık Tahmin Yöneticisi
 * Tüm sayfalarda GameShelf logosu ile Home sekmesi arasındaki arama kutusunu yönetir.
 */
(function () {
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function scoreMatch(game, query) {
    const title = String(game.title || "").toLowerCase();
    const q = query.toLowerCase();
    let score = 0;
    if (title === q) score += 120;
    else if (title.startsWith(q)) score += 85;
    else if (title.includes(` ${q}`)) score += 65;
    else if (title.includes(q)) score += 45;
    else if (
      (game.studio && game.studio.toLowerCase().includes(q)) ||
      (game.genres || []).some((g) => g.toLowerCase().includes(q))
    ) {
      score += 25;
    }
    score += Math.min(20, Math.log10(((game.communityStats && game.communityStats.plays) || 1) + 1) * 4);
    return score;
  }

  function initGlobalNavSearch() {
    const wrap = document.getElementById("globalNavSearchWrap");
    const form = document.getElementById("globalNavSearchForm");
    const input = document.getElementById("globalNavSearchInput");
    const box = document.getElementById("globalNavSearchSuggestions");
    const icon = document.getElementById("globalNavSearchIcon");
    if (!wrap || !form || !input || !box) return;

    let cachedGames = [];
    let debounceTimer = null;
    let reqSeq = 0;
    let highlightedIdx = -1;

    async function ensureCatalogLoaded() {
      if (cachedGames.length > 0 || !window.GameShelfService) return;
      try {
        cachedGames = await window.GameShelfService.getAllGames();
      } catch (e) {
        cachedGames = [];
      }
    }

    function hideSuggestions() {
      box.classList.remove("is-open");
      box.innerHTML = "";
      highlightedIdx = -1;
    }

    function paintSuggestions(query, extraLive = [], isSearchingLive = false) {
      const q = (query || "").trim();
      if (q.length < 1) {
        hideSuggestions();
        return;
      }

      const poolMap = new Map();
      [...cachedGames, ...extraLive].forEach((g) => {
        if (g && g.id) poolMap.set(String(g.id), g);
      });

      const ranked = Array.from(poolMap.values())
        .map((g) => ({ game: g, score: scoreMatch(g, q) }))
        .filter((item) => item.score > 20)
        .sort((a, b) => b.score - a.score)
        .slice(0, 7)
        .map((item) => item.game);

      const isEn = window.GameShelfI18n && window.GameShelfI18n.getLang() === "en";

      if (ranked.length === 0) {
        box.innerHTML = `
          <div class="px-3 py-2 small text-secondary d-flex justify-content-between align-items-center gap-2">
            <span>${
              isSearchingLive
                ? isEn
                  ? `Searching "${escapeHtml(q)}"...`
                  : `"${escapeHtml(q)}" için eşleşme aranıyor...`
                : isEn
                ? `No instant match for "${escapeHtml(q)}"`
                : `"${escapeHtml(q)}" için anlık eşleşme bulunamadı`
            }</span>
            <a href="browse.html?q=${encodeURIComponent(q)}" class="text-decoration-none flex-shrink-0" style="color:var(--gs-accent);">
              ${isEn ? "Search in Catalog →" : "Katalogda Ara →"}
            </a>
          </div>
        `;
        box.classList.add("is-open");
        highlightedIdx = -1;
        return;
      }

      highlightedIdx = -1;
      box.innerHTML =
        ranked
          .map(
            (g, idx) => `
            <a href="details.html?id=${encodeURIComponent(g.id)}" class="gs-suggestion-item" data-suggestion-idx="${idx}" role="option">
              <img src="${g.coverImage}"
                   class="gs-suggestion-poster"
                   onerror="if(this.dataset.fb && this.src!==this.dataset.fb){this.src=this.dataset.fb;}"
                   data-fb="${g.fallbackCover || g.coverImage}"
                   alt="${escapeHtml(g.title)}" />
              <div class="flex-grow-1 min-w-0">
                <div class="text-white fw-semibold text-truncate" style="font-size:0.82rem;">${escapeHtml(g.title)}</div>
                <div class="text-secondary text-truncate" style="font-size:0.7rem;">
                  ${escapeHtml(g.studio || (g.genres && g.genres[0]) || "Game")}${g.releaseYear ? " • " + g.releaseYear : ""}
                </div>
              </div>
              ${
                g.metacritic
                  ? `<span class="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25" style="font-size:0.68rem;">${g.metacritic}</span>`
                  : g.communityAverage
                  ? `<span class="small text-warning fw-semibold" style="font-size:0.72rem;"><i class="fa fa-star me-1"></i>${g.communityAverage}</span>`
                  : ""
              }
            </a>`
          )
          .join("") +
        `<a href="browse.html?q=${encodeURIComponent(q)}" class="d-block text-center small py-1 mt-1 border-top border-secondary border-opacity-25 text-decoration-none" style="color:var(--gs-accent); font-size:0.74rem;">
          ${isEn ? `See all results for "${escapeHtml(q)}" →` : `"${escapeHtml(q)}" için tüm sonuçları gör →`}
        </a>`;
      box.classList.add("is-open");
    }

    async function handleSearchInput() {
      const q = input.value.trim();
      if (q.length < 1) {
        hideSuggestions();
        return;
      }

      await ensureCatalogLoaded();
      // 1) Anında yerel katalog sonuçlarını göster (sıfır gecikme)
      paintSuggestions(q, [], q.length >= 2);

      // 2) En az 2 harf yazıldıysa Steam/RAWG canlı aramasıyla sonuçları zenginleştir
      if (q.length >= 2 && window.GameShelfService && typeof window.GameShelfService.searchLiveGames === "function") {
        const currentSeq = ++reqSeq;
        if (icon) icon.className = "fa fa-spinner fa-spin text-secondary";
        try {
          const liveMatches = await window.GameShelfService.searchLiveGames(q);
          if (currentSeq !== reqSeq) return;
          paintSuggestions(q, liveMatches || [], false);
        } catch (err) {
          if (currentSeq === reqSeq) paintSuggestions(q, [], false);
        } finally {
          if (currentSeq === reqSeq && icon) {
            icon.className = "fa fa-search text-secondary";
          }
        }
      }
    }

    input.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handleSearchInput, 140);
    });

    input.addEventListener("focus", () => {
      if (input.value.trim().length >= 1) {
        handleSearchInput();
      }
    });

    input.addEventListener("keydown", (e) => {
      const items = Array.from(box.querySelectorAll(".gs-suggestion-item"));
      if (!items.length || !box.classList.contains("is-open")) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        highlightedIdx = (highlightedIdx + 1) % items.length;
        items.forEach((el, i) => el.classList.toggle("is-highlighted", i === highlightedIdx));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        highlightedIdx = (highlightedIdx - 1 + items.length) % items.length;
        items.forEach((el, i) => el.classList.toggle("is-highlighted", i === highlightedIdx));
      } else if (e.key === "Enter" && highlightedIdx >= 0 && items[highlightedIdx]) {
        e.preventDefault();
        window.location.href = items[highlightedIdx].href;
      } else if (e.key === "Escape") {
        hideSuggestions();
      }
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      window.location.href = q ? `browse.html?q=${encodeURIComponent(q)}` : "browse.html";
    });

    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) {
        hideSuggestions();
      }
    });

    // Sayfa açılır açılmaz yerel kataloğu arka planda hazırla
    ensureCatalogLoaded();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGlobalNavSearch);
  } else {
    initGlobalNavSearch();
  }
})();
