/*
  Bruitages discrets du site HUBEN.
  Tous les sons sont fabriqués en direct par le navigateur (aucun fichier à charger).
  Ils ne jouent qu'après une action du visiteur, jamais tout seuls.
  Un bouton « Sons » dans l'en-tête permet de les couper ; le choix est mémorisé.
*/
{
  const CLE = "huben-sons";
  let actifs = true;
  try { actifs = localStorage.getItem(CLE) !== "non"; } catch {}

  let ctx = null;
  function contexte() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // Une note douce : attaque rapide, extinction progressive.
  function note(freq, debut, duree, volume = 0.12, forme = "sine") {
    const c = contexte();
    if (!c) return;
    const t = c.currentTime + debut;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = forme;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + duree + 0.05);
  }

  const SONS = {
    // Petit clic sobre : changement de page, lien interne, bouton.
    clic: () => note(1400, 0, 0.05, 0.06, "triangle"),
    // Bascule des sons activée.
    activation: () => { note(880, 0, 0.12, 0.08); note(1320, 0.07, 0.18, 0.07); },
    // Téléchargement lancé : trois notes montantes.
    telechargement: () => { note(523, 0, 0.18, 0.1); note(659, 0.09, 0.18, 0.1); note(784, 0.18, 0.35, 0.1); },
    // Envoi en cours : un tic léger.
    envoi: () => note(1000, 0, 0.06, 0.05, "triangle"),
    // Message envoyé : tintement de clochette.
    succes: () => {
      note(1047, 0, 0.9, 0.09); note(2094, 0, 0.5, 0.03);
      note(1319, 0.14, 1.1, 0.08); note(2638, 0.14, 0.6, 0.025);
    },
    // Anniversaire de Haben Girma (29 juillet) : petite mélodie joyeuse.
    anniversaire: () => {
      [[523, 0], [659, 0.14], [784, 0.28], [1047, 0.42], [784, 0.62], [1047, 0.76]]
        .forEach(([f, t], i) => note(f, t, i === 5 ? 0.9 : 0.22, 0.09));
      note(2094, 0.76, 0.7, 0.03);
    },
    // Erreur à corriger : deux notes descendantes, douces.
    erreur: () => { note(392, 0, 0.16, 0.09, "triangle"); note(311, 0.13, 0.26, 0.09, "triangle"); },
  };

  function jouer(nom) {
    if (!actifs || !SONS[nom]) return;
    try { SONS[nom](); } catch {}
  }
  window.HUBEN_SONS = { jouer };

  // Bouton « Sons » : visible seulement si JavaScript fonctionne.
  const bascule = document.getElementById("bascule-sons");
  if (bascule) {
    const majBouton = () => {
      bascule.setAttribute("aria-pressed", actifs ? "true" : "false");
      bascule.querySelector(".etat-sons").textContent = actifs ? "activés" : "coupés";
    };
    majBouton();
    bascule.hidden = false;
    bascule.addEventListener("click", () => {
      actifs = !actifs;
      try { localStorage.setItem(CLE, actifs ? "oui" : "non"); } catch {}
      majBouton();
      if (actifs) jouer("activation");
    });
  }

  // Clics et téléchargements.
  document.addEventListener("click", (e) => {
    const lien = e.target.closest("a");
    if (!lien) return;
    if (lien.classList.contains("telecharger")) {
      jouer("telechargement");
      return;
    }
    const href = lien.getAttribute("href") || "";
    jouer("clic");
    // Lien vers une autre page du site : on laisse au clic le temps d'être entendu.
    const autrePage = actifs && !href.startsWith("#") && !lien.target && !/^[a-z]+:/i.test(href)
      && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey;
    if (autrePage) {
      e.preventDefault();
      setTimeout(() => { window.location.href = lien.href; }, 90);
    }
  });
}
