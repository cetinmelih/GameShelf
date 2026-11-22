/**
 * GameShelf Dinamik Kapak Paleti Çıkarıcı
 * Kapak görselinden baskın ve ikincil vurgu renklerini çıkarır,
 * koyu arayüz üzerinde kontrast ve okunabilirlik için HSL dengesi uygular.
 */
const PaletteExtractor = (() => {
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  function normalizeForDarkUI(rgb) {
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const clampedS = Math.max(48, Math.min(88, hsl.s));
    const clampedL = Math.max(52, Math.min(68, hsl.l));
    const normalizedRgb = hslToRgb(hsl.h, clampedS, clampedL);

    const luminance = (0.299 * normalizedRgb.r + 0.587 * normalizedRgb.g + 0.114 * normalizedRgb.b) / 255;
    const contrastText = luminance > 0.62 ? "#0b0d12" : "#ffffff";

    return {
      hex: `rgb(${normalizedRgb.r}, ${normalizedRgb.g}, ${normalizedRgb.b})`,
      rgbString: `${normalizedRgb.r}, ${normalizedRgb.g}, ${normalizedRgb.b}`,
      contrastText,
      hsl: { h: hsl.h, s: clampedS, l: clampedL }
    };
  }

  function extractFromImageElement(imgEl) {
    return new Promise((resolve) => {
      const fallback = {
        primary: normalizeForDarkUI({ r: 231, g: 94, b: 141 }),
        secondary: normalizeForDarkUI({ r: 108, g: 142, b: 235 })
      };

      const process = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          const w = (canvas.width = 64);
          const h = (canvas.height = 64);
          ctx.drawImage(imgEl, 0, 0, w, h);

          const data = ctx.getImageData(0, 0, w, h).data;
          const buckets = new Map();

          for (let i = 0; i < data.length; i += 16) {
            const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            if (a < 180) continue;

            const hsl = rgbToHsl(r, g, b);
            if (hsl.l < 14 || hsl.l > 88) continue;

            const hueBucket = Math.floor(hsl.h / 15);
            const weight = (hsl.s / 100) * 2.2 + (1 - Math.abs(hsl.l - 50) / 50);

            if (!buckets.has(hueBucket)) {
              buckets.set(hueBucket, { weight: 0, r: 0, g: 0, b: 0, count: 0, h: hsl.h });
            }
            const entry = buckets.get(hueBucket);
            entry.weight += weight;
            entry.r += r;
            entry.g += g;
            entry.b += b;
            entry.count += 1;
          }

          const sorted = Array.from(buckets.values()).sort((a, b) => b.weight - a.weight);
          if (!sorted.length) {
            resolve(fallback);
            return;
          }

          const top1 = sorted[0];
          const primaryRgb = {
            r: Math.round(top1.r / top1.count),
            g: Math.round(top1.g / top1.count),
            b: Math.round(top1.b / top1.count)
          };

          const top2 = sorted.find((b) => Math.abs(b.h - top1.h) >= 35) || sorted[1] || top1;
          const secondaryRgb = {
            r: Math.round(top2.r / top2.count),
            g: Math.round(top2.g / top2.count),
            b: Math.round(top2.b / top2.count)
          };

          resolve({
            primary: normalizeForDarkUI(primaryRgb),
            secondary: normalizeForDarkUI(secondaryRgb)
          });
        } catch (err) {
          console.warn("Kapak paleti çıkarılamadı, varsayılan palet kullanılıyor:", err);
          resolve(fallback);
        }
      };

      if (imgEl.complete && imgEl.naturalWidth > 0) {
        process();
      } else {
        imgEl.addEventListener("load", process, { once: true });
        imgEl.addEventListener("error", () => resolve(fallback), { once: true });
      }
    });
  }

  function applyPaletteToDocument(palette) {
    const root = document.documentElement;
    root.style.setProperty("--gs-accent", palette.primary.hex);
    root.style.setProperty("--gs-accent-rgb", palette.primary.rgbString);
    root.style.setProperty("--gs-accent-contrast", palette.primary.contrastText);
    root.style.setProperty("--gs-secondary", palette.secondary.hex);
    root.style.setProperty("--gs-secondary-rgb", palette.secondary.rgbString);
  }

  return { extractFromImageElement, applyPaletteToDocument };
})();
