/*
  Fonctions communes à toutes les pages de HUBEN.
  1. Les liens annoncés « bouton » (role="button") réagissent aussi à la barre
     d'espace, comme de vrais boutons.
  2. Bouton « Copier l'adresse du flux » : copie l'adresse et l'annonce.
  3. Formulaire « Être prévenu des prochaines sorties » et page « Se désinscrire ».
*/
{
  const son = (nom) => window.HUBEN_SONS && window.HUBEN_SONS.jouer(nom);

  // 1. Barre d'espace sur les liens-boutons
  document.addEventListener("keydown", (e) => {
    const lien = e.target.closest && e.target.closest('a[role="button"]');
    if (lien && (e.key === " " || e.key === "Spacebar")) {
      e.preventDefault();
      lien.click();
    }
  });

  // 2. Copie de l'adresse du flux RSS
  const boutonCopie = document.querySelector("[data-copier]");
  const etatCopie = document.querySelector("[data-etat-copie]");
  if (boutonCopie && etatCopie) {
    boutonCopie.addEventListener("click", async () => {
      const adresse = boutonCopie.dataset.copier;
      try {
        await navigator.clipboard.writeText(adresse);
        etatCopie.textContent = "Adresse du flux copiée dans le presse-papiers.";
        son("succes");
      } catch {
        etatCopie.textContent = "La copie automatique n'a pas fonctionné. L'adresse est écrite juste au-dessus : " + adresse;
        son("erreur");
      }
    });
  }

  // 3. Formulaires d'inscription et de désinscription (liste des sorties).
  //    Ils sont envoyés au programme Google Apps Script du compte Huben,
  //    qui met à jour la feuille Google Sheets.
  const MESSAGES = {
    inscription: {
      enCours: "Inscription en cours…",
      ok: "Merci ! Votre inscription est enregistrée. Vous serez prévenu par e-mail des prochaines sorties.",
      deja: "Cette adresse était déjà inscrite. Votre choix est mis à jour, merci !",
    },
    desinscription: {
      enCours: "Désinscription en cours…",
      ok: "C'est fait : votre adresse a été supprimée de la liste. Vous ne recevrez plus d'e-mails.",
      absent: "Cette adresse ne figurait pas dans la liste. Vous ne recevrez pas d'e-mails.",
    },
  };
  const valide = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  document.querySelectorAll("form.liste").forEach((form) => {
    const action = form.dataset.action;
    const textes = MESSAGES[action];
    const email = form.querySelector('input[type="email"]');
    const erreur = document.getElementById(email.getAttribute("aria-describedby"));
    const etat = form.querySelector('[role="status"]');
    let envoiEnCours = false;

    const montrerErreur = (texte) => {
      email.setAttribute("aria-invalid", "true");
      erreur.textContent = texte;
      erreur.hidden = false;
    };
    const effacerErreur = () => {
      email.removeAttribute("aria-invalid");
      erreur.textContent = "";
      erreur.hidden = true;
    };
    email.addEventListener("input", () => {
      if (email.getAttribute("aria-invalid") === "true" && valide(email.value)) effacerErreur();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (envoiEnCours) return;
      if (!valide(email.value)) {
        montrerErreur("Indiquez une adresse e-mail valide, par exemple nom@exemple.fr.");
        son("erreur");
        email.focus();
        return;
      }
      effacerErreur();

      if (!form.dataset.url) {
        etat.textContent = "Ce service n'est pas encore ouvert. Merci de revenir un peu plus tard.";
        son("erreur");
        return;
      }

      const donnees = new URLSearchParams();
      donnees.append("action", action);
      donnees.append("adresse", email.value.trim());
      const beta = form.querySelector('input[name="beta"]');
      donnees.append("beta", beta && beta.checked ? "oui" : "non");
      donnees.append("piege", form.querySelector('input[name="piege"]').value);

      envoiEnCours = true;
      etat.textContent = textes.enCours;
      son("envoi");
      try {
        const reponse = await fetch(form.dataset.url, { method: "POST", body: donnees });
        const resultat = await reponse.json();
        if (!resultat.ok) throw new Error(resultat.erreur || "refus");
        form.reset();
        if (resultat.deja) etat.textContent = textes.deja;
        else if (resultat.trouve === false) etat.textContent = textes.absent;
        else etat.textContent = textes.ok;
        son("succes");
      } catch {
        etat.textContent = "L'envoi n'a pas pu se faire. Vérifiez votre connexion à Internet, puis réessayez dans quelques instants.";
        son("erreur");
      } finally {
        envoiEnCours = false;
      }
    });
  });
}
