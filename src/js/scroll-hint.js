/**
 * Hide hero scroll cue after the user scrolls down (do not show again).
 * Requires: <a class="scroll-hint" href="#doing">…</a>
 */
(function () {
  "use strict";

  const hint = document.querySelector(".scroll-hint");
  if (!hint) return;

  const THRESHOLD_PX = 48;
  let hidden = false;

  function hide() {
    if (hidden) return;
    hidden = true;
    hint.classList.add("is-hidden");
    hint.setAttribute("hidden", "");
    hint.setAttribute("aria-hidden", "true");
    window.removeEventListener("scroll", onScroll);
  }

  function onScroll() {
    if (window.scrollY > THRESHOLD_PX) hide();
  }

  // If already scrolled (e.g. restore / hash), hide immediately
  if (window.scrollY > THRESHOLD_PX) {
    hide();
    return;
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  // Clicking the hint also counts as "going down" — hide after navigation starts
  hint.addEventListener("click", () => {
    // allow hash jump first; hide on next frame after scroll
    requestAnimationFrame(() => {
      if (window.scrollY > THRESHOLD_PX) hide();
      else {
        // smooth scroll may lag; hide after short delay
        setTimeout(hide, 400);
      }
    });
  });
})();
