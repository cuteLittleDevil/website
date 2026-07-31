/**
 * Sagittarius poles → detail dialog.
 * Requires: [data-doing-pole] + <dialog id="doing-dialog">
 */
(function () {
  const dialog = document.getElementById("doing-dialog");
  if (!dialog || typeof dialog.showModal !== "function") return;

  const roleEl = document.getElementById("doing-dialog-role");
  const titleEl = document.getElementById("doing-dialog-title");
  const descEl = document.getElementById("doing-dialog-desc");
  const poles = document.querySelectorAll("[data-doing-pole]");
  if (!poles.length || !titleEl) return;

  function openPole(pole) {
    const role = pole.getAttribute("data-role") || "";
    const title = pole.getAttribute("data-title") || "";
    const description = pole.getAttribute("data-description") || "";

    if (roleEl) {
      roleEl.textContent = role;
      roleEl.hidden = !role;
    }
    titleEl.textContent = title;
    if (descEl) {
      descEl.textContent = description;
      descEl.hidden = !description;
    }

    if (!dialog.open) dialog.showModal();
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
  }

  poles.forEach((pole) => {
    pole.addEventListener("click", (e) => {
      e.preventDefault();
      openPole(pole);
    });
    pole.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPole(pole);
      }
    });
  });

  dialog.querySelectorAll("[data-doing-dialog-close]").forEach((btn) => {
    btn.addEventListener("click", closeDialog);
  });

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeDialog();
  });
})();
