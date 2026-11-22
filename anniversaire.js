/*
  Easter egg : le 29 juillet, anniversaire de Haben Girma, l'accueil affiche
  un petit message et joue une mélodie au premier clic du visiteur
  (jamais toute seule au chargement de la page).
  Aperçu à tout moment : index.html#test-anniversaire
*/
{
  const bloc = document.getElementById("anniversaire");
  const aujourdhui = new Date();
  const cestLeJour = aujourdhui.getMonth() === 6 && aujourdhui.getDate() === 29;
  if (bloc && (cestLeJour || location.hash === "#test-anniversaire")) {
    bloc.hidden = false;
    document.addEventListener("click", () => {
      if (window.HUBEN_SONS) window.HUBEN_SONS.jouer("anniversaire");
    }, { once: true, capture: true });
  }
}
