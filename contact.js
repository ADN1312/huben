/*
  Formulaire de contact accessible.
  - Vérifie les champs avant l'envoi.
  - En cas d'erreur : chaque champ fautif est marqué comme invalide, son message
    d'erreur est lu avec lui, et le curseur est placé sur le premier champ à corriger.
  - Pendant l'envoi : « Envoi en cours » est annoncé.
  - Après l'envoi : le formulaire est remplacé par un message de confirmation,
    et le curseur est placé dessus.
  Envoi par EmailJS. Sans JavaScript, un message explique qu'il faut l'activer.
*/
{
  const formulaire = document.getElementById("formulaire");
  const zone = document.getElementById("zone-formulaire");
  const boiteErreurs = document.getElementById("erreurs");
  const etat = document.getElementById("etat");
  const bouton = formulaire.querySelector('button[type="submit"]');
  let envoiEnCours = false;
  const son = (nom) => window.HUBEN_SONS && window.HUBEN_SONS.jouer(nom);

  const regles = [
    { id: "nom", libelle: "Nom ou structure",
      verifier: (v) => v.trim() !== "",
      message: "Indiquez votre nom ou celui de votre structure." },
    { id: "email", libelle: "Adresse e-mail",
      verifier: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      message: "Indiquez une adresse e-mail valide, par exemple nom@exemple.fr." },
    { id: "message", libelle: "Message",
      verifier: (v) => v.trim() !== "",
      message: "Écrivez votre message." },
  ];

  function marquer(regle, valide) {
    const champ = document.getElementById(regle.id);
    const erreur = document.getElementById("erreur-" + regle.id);
    if (valide) {
      champ.removeAttribute("aria-invalid");
      erreur.textContent = "";
      erreur.hidden = true;
    } else {
      champ.setAttribute("aria-invalid", "true");
      erreur.textContent = regle.message;
      erreur.hidden = false;
    }
  }

  function afficherBoite(html) {
    boiteErreurs.innerHTML = html;
    boiteErreurs.hidden = false;
  }

  function cacherBoite() {
    boiteErreurs.hidden = true;
    boiteErreurs.innerHTML = "";
  }

  // Une erreur corrigée disparaît dès que le champ devient valide.
  for (const regle of regles) {
    document.getElementById(regle.id).addEventListener("input", (e) => {
      if (e.target.getAttribute("aria-invalid") === "true" && regle.verifier(e.target.value)) {
        marquer(regle, true);
      }
    });
  }

  formulaire.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (envoiEnCours) return;

    const fautes = [];
    for (const regle of regles) {
      const valide = regle.verifier(document.getElementById(regle.id).value);
      marquer(regle, valide);
      if (!valide) fautes.push(regle);
    }

    if (fautes.length > 0) {
      const titre = fautes.length === 1
        ? "Le formulaire contient 1 erreur :"
        : `Le formulaire contient ${fautes.length} erreurs :`;
      const liste = fautes
        .map((r) => `<li><a href="#${r.id}">${r.libelle} : ${r.message}</a></li>`)
        .join("");
      afficherBoite(`<p><strong>${titre}</strong></p><ul>${liste}</ul>`);
      etat.textContent = "";
      son("erreur");
      // Le curseur va directement sur le premier champ à corriger ;
      // le lecteur d'écran annonce alors le champ et son erreur.
      document.getElementById(fautes[0].id).focus();
      return;
    }

    cacherBoite();

    // Champ piège rempli : c'est un robot. On fait semblant d'envoyer.
    if (formulaire.elements.botcheck.checked) {
      confirmer();
      return;
    }

    const { service, modele, cle } = formulaire.dataset;
    if (!service || !modele || !cle) {
      echec("Le formulaire n'est pas encore activé. Merci de réessayer un peu plus tard.");
      return;
    }

    envoiEnCours = true;
    bouton.setAttribute("aria-disabled", "true");
    etat.textContent = "Envoi en cours…";
    son("envoi");

    try {
      // Envoi par EmailJS : les champs du formulaire remplissent le modèle d'email.
      const reponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: service,
          template_id: modele,
          user_id: cle,
          template_params: {
            name: formulaire.elements.name.value.trim(),
            email: formulaire.elements.email.value.trim(),
            profil: formulaire.elements.profil.value || "Non précisé",
            message: formulaire.elements.message.value.trim(),
          },
        }),
      });
      if (reponse.ok) {
        confirmer();
      } else {
        echec("Le message n'a pas pu être envoyé. Merci de réessayer dans quelques instants.");
      }
    } catch {
      echec("Le message n'a pas pu être envoyé. Vérifiez votre connexion à Internet, puis réessayez.");
    } finally {
      envoiEnCours = false;
      bouton.removeAttribute("aria-disabled");
    }
  });

  function echec(texte) {
    etat.textContent = "";
    son("erreur");
    afficherBoite(`<p><strong>${texte}</strong></p>`);
    boiteErreurs.focus();
  }

  function confirmer() {
    son("succes");
    zone.innerHTML =
      '<h3 id="confirmation" tabindex="-1">Message envoyé. Merci !</h3>' +
      "<p>Votre message a bien été transmis. Une réponse vous sera adressée " +
      "à l'adresse e-mail que vous avez indiquée.</p>";
    document.getElementById("confirmation").focus();
  }
}
