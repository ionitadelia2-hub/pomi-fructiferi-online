(() => {
  "use strict";
  const PRODUCT_PATH = "/produse/butasi-lavanda-sevtopolis/";
  const SEEN_KEY = "pfo-lavanda-sevtopolis-2026-v1";
  const excluded = /^\/(admin-comenzi|checkout|cos|comanda-trimisa)(\/|$)/;
  if (excluded.test(location.pathname) || location.pathname === PRODUCT_PATH) return;
  if (document.getElementById("lavender-announcement")) return;
  try { if (sessionStorage.getItem(SEEN_KEY)) return; } catch (_) { /* storage optional */ }

  const style = document.createElement("style");
  style.textContent = `
    #lavender-announcement{border:0;padding:0;border-radius:22px;width:min(860px,calc(100% - 32px));max-height:calc(100dvh - 32px);overflow:auto;color:#24372c;background:#fffdf9;box-shadow:0 22px 90px #15251c55;font-family:inherit}
    #lavender-announcement:not([open]){display:none}
    #lavender-announcement::backdrop{background:rgba(19,34,25,.62)}
    #lavender-announcement *{box-sizing:border-box}
    #lavender-announcement .lavender-layout{display:grid;grid-template-columns:1fr 1fr;position:relative}
    #lavender-announcement .lavender-photo{width:100%;height:100%;min-height:420px;object-fit:cover;display:block}
    #lavender-announcement .lavender-copy{padding:48px 36px 32px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center}
    #lavender-announcement .lavender-tag{color:#73538a;letter-spacing:.13em;font-size:12px;font-weight:800;text-transform:uppercase;margin:0 0 16px}
    #lavender-announcement h2{font-size:clamp(28px,4vw,38px);line-height:1.1;letter-spacing:-.025em;margin:0 0 14px;color:#24372c}
    #lavender-announcement .lavender-name{font-size:16px;line-height:1.5;color:#66536c;margin:0 0 18px;font-style:italic}
    #lavender-announcement .lavender-intro{font-size:16px;line-height:1.55;margin:0 0 18px}
    #lavender-announcement .lavender-price{font-size:28px;font-weight:800;line-height:1.2;margin:0 0 22px}
    #lavender-announcement .lavender-price span{font-size:15px;font-weight:500}
    #lavender-announcement .lavender-cta{background:#376f3d;color:white;text-decoration:none;border-radius:10px;padding:14px 24px;min-height:48px;display:inline-flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;width:100%}
    #lavender-announcement .lavender-cta:hover{background:#28582d}
    #lavender-announcement .lavender-note{font-size:12px;line-height:1.5;color:#68706a;margin:14px 0 0}
    #lavender-announcement .lavender-close{position:absolute;right:12px;top:12px;display:grid;place-items:center;width:44px;height:44px;border:1px solid #dedbd4;border-radius:50%;background:#fff;color:#263d2b;font-size:26px;cursor:pointer;z-index:1}
    #lavender-announcement :focus-visible{outline:3px solid #9468b0;outline-offset:3px}
    @media(max-width:620px){
      #lavender-announcement{width:calc(100% - 24px);max-height:calc(100dvh - 24px);border-radius:18px}
      #lavender-announcement .lavender-layout{grid-template-columns:1fr}
      #lavender-announcement .lavender-photo{min-height:0;height:clamp(130px,25dvh,210px);object-position:center 48%}
      #lavender-announcement .lavender-copy{padding:24px}
      #lavender-announcement .lavender-tag{margin-bottom:10px}
      #lavender-announcement h2{font-size:29px;margin-bottom:10px}
      #lavender-announcement .lavender-name{font-size:14px;margin-bottom:12px}
      #lavender-announcement .lavender-intro{font-size:15px;margin-bottom:12px}
      #lavender-announcement .lavender-price{font-size:25px;margin-bottom:16px}
    }`;

  const modal = document.createElement("dialog");
  modal.id = "lavender-announcement";
  modal.setAttribute("aria-labelledby", "lavender-title");
  modal.setAttribute("aria-describedby", "lavender-intro");
  modal.innerHTML = `<div class="lavender-layout">
    <button type="button" class="lavender-close" aria-label="Închide anunțul despre lavandă" autofocus>×</button>
    <img class="lavender-photo" src="/images/plante-aromatice/lavanda/butasi-lavanda-sevtopolis/lavanda-sevtopolis.jpg" width="1200" height="800" alt="Imagine de prezentare cu lavandă Sevtopolis la înflorire" decoding="async">
    <div class="lavender-copy">
      <p class="lavender-tag">Nou în catalog</p>
      <h2 id="lavender-title">Au sosit butașii de lavandă!</h2>
      <p class="lavender-name">Lavandula angustifolia „Sevtopolis”</p>
      <p class="lavender-intro" id="lavender-intro">Un început parfumat pentru grădina ta. Descoperă lavanda Sevtopolis și adaugă butașii în comandă.</p>
      <p class="lavender-price">25 lei <span>/ butaș</span></p>
      <a class="lavender-cta" href="${PRODUCT_PATH}">Descoperă lavanda</a>
      <p class="lavender-note">Imagine de prezentare a plantei la înflorire. Produsul comercializat este un butaș.</p>
    </div>
  </div>`;
  let previousFocus;
  let previousOverflow;
  let timeout;
  const remember = () => { try { sessionStorage.setItem(SEEN_KEY, "1"); } catch (_) {} };
  const cleanup = () => {
    document.documentElement.style.overflow = previousOverflow;
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  };
  modal.addEventListener("close", cleanup);
  modal.querySelector(".lavender-close").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (event) => {
    if (event.target !== modal) return;
    const rect = modal.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close();
  });
  function openWhenReady(attempt = 0) {
    if (document.hidden) {
      document.addEventListener("visibilitychange", function resume() {
        if (!document.hidden) { document.removeEventListener("visibilitychange", resume); openWhenReady(attempt); }
      });
      return;
    }
    const cookieBanner = document.getElementById("pomi-cookie-banner");
    const cookieVisible = cookieBanner && !cookieBanner.hidden && getComputedStyle(cookieBanner).display !== "none";
    if (cookieVisible || document.querySelector("dialog[open]")) {
      // Let visitors finish another dialog or choose their cookie preferences first.
      if (attempt < 120) timeout = setTimeout(() => openWhenReady(attempt + 1), 1000);
      return;
    }
    if (typeof modal.showModal !== "function") return;
    document.head.append(style);
    document.body.append(modal);
    previousFocus = document.activeElement;
    previousOverflow = document.documentElement.style.overflow;
    modal.showModal();
    document.documentElement.style.overflow = "hidden";
    remember();
  }
  function init() { timeout = setTimeout(() => openWhenReady(), 1800); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
  window.addEventListener("pagehide", () => clearTimeout(timeout), { once: true });
})();
