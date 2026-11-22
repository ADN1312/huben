/*
  Menu principal accessible (motif « bouton qui déplie une liste »).
  - Le bouton « Menu » annonce s'il est replié ou déplié.
  - À l'ouverture, le curseur va directement sur le premier lien du menu.
  - Échap referme le menu et ramène le curseur sur le bouton.
  Sans JavaScript, le menu reste simplement affiché en liste.
*/
{
  const bouton = document.getElementById("bouton-menu");
  const liste = document.getElementById("liste-menu");
  if (bouton && liste) {
    const son = (nom) => window.HUBEN_SONS && window.HUBEN_SONS.jouer(nom);

    const ouvrir = (ouvert) => {
      bouton.setAttribute("aria-expanded", ouvert ? "true" : "false");
      liste.hidden = !ouvert;
    };

    bouton.hidden = false;
    ouvrir(false);

    bouton.addEventListener("click", () => {
      const ouvert = bouton.getAttribute("aria-expanded") !== "true";
      ouvrir(ouvert);
      son("clic");
      if (ouvert) liste.querySelector("a").focus();
    });

    liste.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        ouvrir(false);
        bouton.focus();
      }
    });
  }
}
