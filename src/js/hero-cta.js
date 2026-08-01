/**
 * Hero CTA solid fill sticks to last hovered/focused button.
 * Requires: .hero__inner .btn-row[data-solid] > [data-cta="blog"|"github"]
 */
(function () {
  "use strict";

  const row = document.querySelector(".hero__inner .btn-row");
  if (!row) return;

  if (!row.dataset.solid) row.dataset.solid = "blog";

  row.querySelectorAll("[data-cta]").forEach((el) => {
    const key = el.getAttribute("data-cta");
    if (!key) return;
    const setSolid = () => {
      row.dataset.solid = key;
    };
    el.addEventListener("mouseenter", setSolid);
    el.addEventListener("focus", setSolid);
  });
})();
