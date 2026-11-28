/**
 * GameShelf Dinamik Logo Kontrolcüsü (3 Saniye Position Geçişi)
 * Her 3 saniyede bir konum (position X / Y) ve ölçek geçişiyle konsol tuşları
 * ve kontrolcü illüstrasyonları arasında dinamik geçiş yapar.
 */
(function () {
  function initDynamicLogo() {
    const logoEl = document.getElementById("gsDynamicLogo");
    if (!logoEl) return;

    let currentState = 0;
    const totalStates = 4;
    const INTERVAL_MS = 3000; // 3 saniyede bir geçiş

    function nextLogoState() {
      currentState = (currentState + 1) % totalStates;
      logoEl.setAttribute("data-state", String(currentState));
    }

    let timer = setInterval(nextLogoState, INTERVAL_MS);

    document.addEventListener("visibilitychange", () => {
      clearInterval(timer);
      if (!document.hidden) {
        timer = setInterval(nextLogoState, INTERVAL_MS);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDynamicLogo);
  } else {
    initDynamicLogo();
  }
})();
