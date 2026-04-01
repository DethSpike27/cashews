// ── Données ──────────────────────────────────────────────────────────────────
const MOIS_NOMS = ["Janvier","Février","Mars","Avril","Mai","Juin",
                   "Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const CATEGORIES_DEFAULT = ["Salaire","Alimentation","Loyer","Transport","Loisirs","Santé","Épargne","Autre"];

let transactions  = JSON.parse(localStorage.getItem("cashewdollar_tx")   || "[]");
let budgets       = JSON.parse(localStorage.getItem("cashewdollar_budgets") || "{}");
let categoriesPerso = JSON.parse(localStorage.getItem("cashewdollar_cats") || "null");
if (!categoriesPerso) categoriesPerso = [...CATEGORIES_DEFAULT];

let moisCourant   = new Date().getMonth() + 1;
let anneeCourante = new Date().getFullYear();

function sauvegarder() {
  localStorage.setItem("cashewdollar_tx", JSON.stringify(transactions));
}
function sauvegarderBudgets() {
  localStorage.setItem("cashewdollar_budgets", JSON.stringify(budgets));
}
function sauvegarderCategories() {
  localStorage.setItem("cashewdollar_cats", JSON.stringify(categoriesPerso));
}

// Toutes les catégories (défaut + perso)
function toutesCategories() {
  return categoriesPerso;
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("f-date").value = new Date().toISOString().slice(0,10);

  // Navigation mois / année
  document.getElementById("btn-prev").addEventListener("click", moisPrecedent);
  document.getElementById("btn-next").addEventListener("click", moisSuivant);
  document.getElementById("btn-annee-prev").addEventListener("click", anneePrecedente);
  document.getElementById("btn-annee-next").addEventListener("click", anneeSuivante);

  // Boutons header
  document.getElementById("btn-importer").addEventListener("click", importerFichier);
  document.getElementById("file-input").addEventListener("change", lireFichier);
  document.getElementById("btn-theme").addEventListener("click", toggleTheme);
  document.getElementById("btn-langue-fr").addEventListener("click", e => { e.preventDefault(); setLangue("fr"); });
  document.getElementById("btn-langue-en").addEventListener("click", e => { e.preventDefault(); setLangue("en"); });

  // Dropdown Export
  const exportToggle = document.getElementById("btn-export-toggle");
  const exportMenu   = document.getElementById("export-menu");
  exportToggle.addEventListener("click", e => {
    e.stopPropagation();
    const open = exportMenu.classList.toggle("open");
    exportToggle.setAttribute("aria-expanded", open);
  });
  document.addEventListener("click", () => {
    exportMenu.classList.remove("open");
    exportToggle.setAttribute("aria-expanded", "false");
  });
  exportMenu.addEventListener("click", e => e.stopPropagation());

  document.getElementById("btn-export-csv").addEventListener("click", () => { exporterCSV(); exportMenu.classList.remove("open"); });
  document.getElementById("btn-export-json").addEventListener("click", () => { exporterJSON(); exportMenu.classList.remove("open"); });
  document.getElementById("btn-export-csv-all").addEventListener("click", () => { exporterCSVAll(); exportMenu.classList.remove("open"); });
  document.getElementById("btn-export-json-all").addEventListener("click", () => { exporterJSONAll(); exportMenu.classList.remove("open"); });

  // Formulaire principal
  document.getElementById("form-transaction").addEventListener("submit", e => {
    e.preventDefault();
    ajouterTransaction();
  });

  // Bouton analyser
  document.getElementById("btn-analyser").addEventListener("click", analyserDepenses);

  // Nouveaux boutons outils
  document.getElementById("btn-annuelle").addEventListener("click", ouvrirVueAnnuelle);
  document.getElementById("btn-graphique").addEventListener("click", ouvrirGraphique);
  document.getElementById("btn-categories").addEventListener("click", ouvrirCategories);
  document.getElementById("btn-budget-edit").addEventListener("click", ouvrirBudget);

  // Fermeture modals par clic sur l'overlay
  document.getElementById("analyse-overlay").addEventListener("click", fermerAnalyse);
  document.getElementById("recurrence-overlay").addEventListener("click", fermerRecurrence);
  document.getElementById("modal-overlay").addEventListener("click", fermerModal);
  document.getElementById("annuelle-overlay").addEventListener("click", e => {
    if (e.target === document.getElementById("annuelle-overlay")) document.getElementById("annuelle-overlay").style.display = "none";
  });
  document.getElementById("graphique-overlay").addEventListener("click", e => {
    if (e.target === document.getElementById("graphique-overlay")) document.getElementById("graphique-overlay").style.display = "none";
  });
  document.getElementById("budget-overlay").addEventListener("click", e => {
    if (e.target === document.getElementById("budget-overlay")) document.getElementById("budget-overlay").style.display = "none";
  });
  document.getElementById("categories-overlay").addEventListener("click", e => {
    if (e.target === document.getElementById("categories-overlay")) document.getElementById("categories-overlay").style.display = "none";
  });

  // Rappels modal
  document.getElementById("btn-close-rappels").addEventListener("click", () => document.getElementById("rappels-overlay").style.display = "none");
  document.getElementById("rappels-overlay").addEventListener("click", e => {
    if (e.target === document.getElementById("rappels-overlay")) document.getElementById("rappels-overlay").style.display = "none";
  });
  document.getElementById("btn-rappels-ajouter").addEventListener("click", traiterRappelsAjouter);
  document.getElementById("btn-rappels-supprimer").addEventListener("click", traiterRappelsSupprimer);
  document.getElementById("btn-rappels-cocher-tout").addEventListener("click", () => {
    document.querySelectorAll(".rappel-cb").forEach(cb => cb.checked = true);
  });
  document.getElementById("btn-rappels-decocher-tout").addEventListener("click", () => {
    document.querySelectorAll(".rappel-cb").forEach(cb => cb.checked = false);
  });

  // Boutons fermer modals
  document.getElementById("btn-close-analyse").addEventListener("click", () => document.getElementById("analyse-overlay").style.display = "none");
  document.getElementById("btn-close-annuelle").addEventListener("click", () => document.getElementById("annuelle-overlay").style.display = "none");
  document.getElementById("btn-close-graphique").addEventListener("click", () => { document.getElementById("graphique-overlay").style.display = "none"; if(_chart){_chart.destroy();_chart=null;} });
  document.getElementById("btn-close-budget").addEventListener("click", () => document.getElementById("budget-overlay").style.display = "none");
  document.getElementById("btn-close-categories").addEventListener("click", () => document.getElementById("categories-overlay").style.display = "none");

  // Boutons récurrence
  document.getElementById("btn-rec-non").addEventListener("click", () => confirmerAjout("non"));
  document.getElementById("btn-rec-1x").addEventListener("click",  () => confirmerAjout("1x"));
  document.getElementById("btn-rec-2x").addEventListener("click",  () => confirmerAjout("2x"));
  document.getElementById("btn-cancel-recurrence").addEventListener("click", () => fermerRecurrence());

  // Boutons modal édition
  document.getElementById("btn-cancel-modal").addEventListener("click", () => fermerModal());
  document.getElementById("btn-save-modal").addEventListener("click", sauvegarderModif);

  // Budget
  document.getElementById("btn-save-budget").addEventListener("click", sauvegarderBudgetForm);

  // Catégories
  document.getElementById("btn-cat-add").addEventListener("click", ajouterCategorie);
  document.getElementById("cat-new-input").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); ajouterCategorie(); } });

  // Recherche
  document.getElementById("search-input").addEventListener("input", rafraichir);

  // Filtres liste
  document.querySelectorAll('input[name="filtre"]').forEach(r =>
    r.addEventListener("change", rafraichir)
  );

  // Thème sauvegardé
  if (localStorage.getItem("cashewdollar_theme") === "dark") {
    document.body.classList.add("dark");
    document.getElementById("btn-theme").textContent = "☀️";
  }

  // Peupler les selects de catégories
  peuplerSelectsCategories();

  appliquerTraduction();
  majNavLabel();
  rafraichir();
  verifierRappels();
  initAutocomplete();
});

// ── Navigation mois ───────────────────────────────────────────────────────────
function majNavLabel() {
  document.getElementById("lbl-mois").textContent = MOIS_NOMS[moisCourant - 1];
  document.getElementById("lbl-annee").textContent = anneeCourante;
}
function moisPrecedent() {
  if (moisCourant === 1) { moisCourant = 12; anneeCourante--; }
  else moisCourant--;
  majNavLabel(); rafraichir(); verifierRappels();
}
function moisSuivant() {
  if (moisCourant === 12) { moisCourant = 1; anneeCourante++; }
  else moisCourant++;
  majNavLabel(); rafraichir(); verifierRappels();
}

// ── Navigation année ──────────────────────────────────────────────────────────
function anneePrecedente() {
  anneeCourante--;
  majNavLabel(); rafraichir(); verifierRappels();
}
function anneeSuivante() {
  anneeCourante++;
  majNavLabel(); rafraichir(); verifierRappels();
}

// ── Rafraîchir ────────────────────────────────────────────────────────────────
function rafraichir() {
  const prefix  = `${anneeCourante}-${String(moisCourant).padStart(2,"0")}`;
  const filtre  = document.querySelector('input[name="filtre"]:checked').value;
  const recherche = (document.getElementById("search-input")?.value || "").trim().toLowerCase();
  const duMois  = transactions.filter(t => t.date.startsWith(prefix));
  let visible = duMois.filter(t => filtre === "tous" || t.type === filtre);
  if (recherche) {
    visible = visible.filter(t =>
      t.description.toLowerCase().includes(recherche) ||
      t.categorie.toLowerCase().includes(recherche) ||
      (t.note && t.note.toLowerCase().includes(recherche)) ||
      String(t.montant).includes(recherche)
    );
  }

  // Tableau
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = "";
  const sorted = [...visible].sort((a,b) => b.date.localeCompare(a.date));
  sorted.forEach(t => tbody.appendChild(_creerLigne(t)));

  // Cartes & relevé
  const entrees = duMois.filter(t=>t.type==="entrée").reduce((s,t)=>s+t.montant,0);
  const sorties = duMois.filter(t=>t.type==="sortie").reduce((s,t)=>s+t.montant,0);
  const solde   = entrees - sorties;

  document.getElementById("c-entrees").textContent = `+${entrees.toFixed(2)} $`;
  document.getElementById("c-sorties").textContent = `-${sorties.toFixed(2)} $`;

  const cSolde = document.getElementById("c-solde");
  cSolde.textContent = (solde>=0?"+":"")+solde.toFixed(2)+" $";
  const cardSolde = cSolde.closest(".card");
  if (solde < 0) {
    cardSolde.style.background = "var(--red)";
  } else {
    cardSolde.style.background = "var(--green)";
  }

  document.getElementById("r-entrees").textContent = `+${entrees.toFixed(2)} $`;
  document.getElementById("r-sorties").textContent = `-${sorties.toFixed(2)} $`;
  const rSolde = document.getElementById("r-solde");
  rSolde.textContent = (solde>=0?"+":"")+solde.toFixed(2)+" $";
  rSolde.style.color = solde >= 0 ? "var(--green)" : "var(--red)";

  const bilan = document.getElementById("r-bilan");
  if (entrees===0 && sorties===0) {
    bilan.textContent = "Aucune transaction";
    bilan.style.color = "var(--sub)";
  } else if (solde >= 0) {
    bilan.textContent = `✅ Excédent de ${solde.toFixed(2)} $`;
    bilan.style.color = "var(--green)";
  } else {
    bilan.textContent = `⚠️ Déficit de ${Math.abs(solde).toFixed(2)} $`;
    bilan.style.color = "var(--red)";
  }

  const epargne = duMois
    .filter(t => t.type === "sortie" && t.categorie === "Épargne")
    .reduce((s,t) => s + t.montant, 0);
  const soldeAvecEpargne = solde + epargne;

  const rEpargne = document.getElementById("r-epargne");
  rEpargne.textContent = epargne > 0 ? `-${epargne.toFixed(2)} $` : "0.00 $";

  const rBilanEpargne = document.getElementById("r-bilan-epargne");
  if (entrees===0 && sorties===0) {
    rBilanEpargne.textContent = "Aucune transaction";
    rBilanEpargne.style.color = "var(--sub)";
  } else if (soldeAvecEpargne >= 0) {
    rBilanEpargne.textContent = `✅ Excédent de ${soldeAvecEpargne.toFixed(2)} $`;
    rBilanEpargne.style.color = "var(--green)";
  } else {
    rBilanEpargne.textContent = `⚠️ Déficit de ${Math.abs(soldeAvecEpargne).toFixed(2)} $`;
    rBilanEpargne.style.color = "var(--red)";
  }

  // Budget par catégorie
  afficherBudgets(duMois);
}

function _recBadge(t) {
  if (t.type !== "sortie" || !t.recurrence || t.recurrence === "non") return "";
  if (t.recurrence === "1x") return `<span class="badge-rec badge-rec-1x" title="Récurrent 1×/mois">🔁</span>`;
  if (t.recurrence === "2x") return `<span class="badge-rec badge-rec-2x" title="Récurrent 2×/mois">🔁🔁</span>`;
  return "";
}

function _creerLigne(t) {
  const signe = t.type === "entrée" ? "+" : "-";
  const cls   = t.type === "entrée" ? "entree" : "sortie";
  const idx   = transactions.indexOf(t);
  const recBadge = _recBadge(t);
  const estEstime = t.statut === "estimé";
  const isRec = t.type === "sortie" && t.recurrence && t.recurrence !== "non";
  let recCls = isRec ? " tr-recurrent" : "";
  if (estEstime) recCls += " tr-estime";
  const tr = document.createElement("tr");
  tr.className = recCls.trim();

  const tdDate = document.createElement("td");
  tdDate.textContent = t.date;

  const tdDesc = document.createElement("td");
  const estimeBadge = estEstime ? `<span class="badge-estime" title="Dépense estimée — non confirmée">Est.</span>` : "";
  tdDesc.innerHTML = `${t.description} ${recBadge}${estimeBadge}${t.note ? `<span class="tx-note">${t.note}</span>` : ""}`;

  const tdCat = document.createElement("td");
  tdCat.textContent = tCat(t.categorie);

  const tdType = document.createElement("td");
  tdType.className = cls;
  tdType.textContent = window.t(t.type === "entrée" ? "radio-entree" : "radio-sortie");

  const tdMontant = document.createElement("td");
  tdMontant.className = cls + (estEstime ? " montant-estime" : "");
  tdMontant.textContent = `${signe}${parseFloat(t.montant).toFixed(2)} $`;

  const tdActions = document.createElement("td");

  // Bouton payé/estimé (seulement pour les sorties récurrentes)
  if (isRec) {
    const btnStatut = document.createElement("button");
    if (estEstime) {
      btnStatut.className = "btn-statut btn-statut-estime";
      btnStatut.title = "Marquer comme payé";
      btnStatut.setAttribute("aria-label", `Marquer ${t.description} comme payé`);
      btnStatut.textContent = "💳";
    } else {
      btnStatut.className = "btn-statut btn-statut-paye";
      btnStatut.title = "Marquer comme estimé";
      btnStatut.setAttribute("aria-label", `Marquer ${t.description} comme estimé`);
      btnStatut.textContent = "✅";
    }
    btnStatut.addEventListener("click", () => {
      if (estEstime) {
        // Marquer comme payé → mettre la date du jour
        transactions[idx].statut = "payé";
        transactions[idx].date   = new Date().toISOString().slice(0, 10);
      } else {
        // Marquer comme estimé → remettre en estimé
        transactions[idx].statut = "estimé";
      }
      sauvegarder();
      rafraichir();
    });
    tdActions.appendChild(btnStatut);
  }


  const btnEdit = document.createElement("button");
  btnEdit.className = "btn-edit";
  btnEdit.title = "Modifier";
  btnEdit.setAttribute("aria-label", `Modifier ${t.description}`);
  btnEdit.textContent = "✏️";
  btnEdit.addEventListener("click", () => ouvrirModal(idx));

  const btnDel = document.createElement("button");
  btnDel.className = "btn-del";
  btnDel.title = "Supprimer";
  btnDel.setAttribute("aria-label", `Supprimer ${t.description}`);
  btnDel.textContent = "🗑";
  btnDel.addEventListener("click", () => supprimer(idx));

  tdActions.appendChild(btnEdit);
  tdActions.appendChild(btnDel);

  tr.appendChild(tdDate);
  tr.appendChild(tdDesc);
  tr.appendChild(tdCat);
  tr.appendChild(tdType);
  tr.appendChild(tdMontant);
  tr.appendChild(tdActions);

  return tr;
}

// ── Ajouter ───────────────────────────────────────────────────────────────────
// Données temporaires en attente de confirmation de récurrence
let _pendingTx = null;

function ajouterTransaction() {
  const desc    = document.getElementById("f-desc").value.trim();
  const montant = parseFloat(document.getElementById("f-montant").value);
  const date    = document.getElementById("f-date").value;
  const type    = document.querySelector('input[name="type"]:checked').value;
  const cat     = document.getElementById("f-cat").value;

  if (!desc)            return alert(t("alert-desc"));
  if (!montant || montant <= 0) return alert(t("alert-montant"));
  if (!date)            return alert(t("alert-date"));

  const note = (document.getElementById("f-note")?.value || "").trim();
  if (type === "sortie") {
    _pendingTx = { date, description: desc, categorie: cat, type, montant, note };
    document.getElementById("recurrence-overlay").style.display = "flex";
  } else {
    transactions.push({ date, description: desc, categorie: cat, type, montant, recurrence: "non", note });
    sauvegarder();
    _resetFormulaire();
    rafraichir();
  }
}

function confirmerAjout(recurrence) {
  if (!_pendingTx) return;
  _pendingTx.recurrence = recurrence;
  transactions.push(_pendingTx);
  _pendingTx = null;
  sauvegarder();
  document.getElementById("recurrence-overlay").style.display = "none";
  _resetFormulaire();
  rafraichir();
}

function fermerRecurrence(event) {
  if (event && event.target !== document.getElementById("recurrence-overlay")) return;
  document.getElementById("recurrence-overlay").style.display = "none";
  _pendingTx = null;
}

function _resetFormulaire() {
  document.getElementById("f-desc").value    = "";
  document.getElementById("f-montant").value = "";
  document.getElementById("f-date").value    = new Date().toISOString().slice(0,10);
  const fNote = document.getElementById("f-note");
  if (fNote) fNote.value = "";
  cacherSuggestions();
}

// ── Supprimer ─────────────────────────────────────────────────────────────────
function supprimer(idx) {
  const tx = transactions[idx];
  if (confirm(`${window.t("confirm-supprimer")} « ${tx.description} » ${window.t("confirm-supprimer-fin")}`)) {
    transactions.splice(idx, 1);
    sauvegarder();
    rafraichir();
  }
}

// ── Autocomplétion ────────────────────────────────────────────────────────────
function initAutocomplete() {
  const input = document.getElementById("f-desc");
  const list  = document.getElementById("suggestions");
  let activeIdx = -1;

  input.addEventListener("input", () => {
    const val = input.value.trim().toLowerCase();
    list.innerHTML = "";
    activeIdx = -1;
    if (!val) { cacherSuggestions(); return; }

    const uniques = [...new Set(transactions.map(t=>t.description))];
    const matches = uniques.filter(d => d.toLowerCase().includes(val));
    if (!matches.length) { cacherSuggestions(); return; }

    matches.forEach(m => {
      const li = document.createElement("li");
      li.textContent = m;
      li.addEventListener("mousedown", () => {
        input.value = m;
        cacherSuggestions();
      });
      list.appendChild(li);
    });
    list.style.display = "block";
  });

  input.addEventListener("keydown", e => {
    const items = list.querySelectorAll("li");
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      activeIdx = Math.min(activeIdx+1, items.length-1);
      items.forEach((li,i) => li.classList.toggle("active", i===activeIdx));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      activeIdx = Math.max(activeIdx-1, -1);
      items.forEach((li,i) => li.classList.toggle("active", i===activeIdx));
      e.preventDefault();
    } else if (e.key === "Enter" && activeIdx >= 0) {
      input.value = items[activeIdx].textContent;
      cacherSuggestions();
      e.preventDefault();
    } else if (e.key === "Escape") {
      cacherSuggestions();
    }
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".autocomplete-wrap")) cacherSuggestions();
  });
}

function cacherSuggestions() {
  const list = document.getElementById("suggestions");
  list.innerHTML = "";
  list.style.display = "none";
}

// ── Modal Édition ─────────────────────────────────────────────────────────────
let idxEnEdition = -1;

function ouvrirModal(idx) {
  idxEnEdition = idx;
  const t = transactions[idx];
  document.getElementById("m-desc").value    = t.description;
  document.getElementById("m-montant").value = t.montant;
  document.getElementById("m-date").value    = t.date;
  document.getElementById("m-cat").value     = t.categorie;
  const mNote = document.getElementById("m-note");
  if (mNote) mNote.value = t.note || "";
  document.querySelectorAll('input[name="m-type"]').forEach(r => {
    r.checked = r.value === t.type;
  });
  // Afficher/masquer le champ récurrence selon le type
  const recWrap = document.getElementById("m-recurrence-wrap");
  if (t.type === "sortie") {
    recWrap.style.display = "block";
    const rec = t.recurrence || "non";
    document.querySelectorAll('input[name="m-rec"]').forEach(r => {
      r.checked = r.value === rec;
    });
  } else {
    recWrap.style.display = "none";
  }
  // Mettre à jour la visibilité si l'utilisateur change le type
  document.querySelectorAll('input[name="m-type"]').forEach(r => {
    r.addEventListener("change", () => {
      const isSortie = document.querySelector('input[name="m-type"]:checked').value === "sortie";
      recWrap.style.display = isSortie ? "block" : "none";
      if (isSortie) {
        const firstRec = document.querySelector('input[name="m-rec"]');
        if (firstRec && !document.querySelector('input[name="m-rec"]:checked')) firstRec.checked = true;
      }
    });
  });
  document.getElementById("modal-overlay").style.display = "flex";
}

function fermerModal(event) {
  if (event && event.target !== document.getElementById("modal-overlay")) return;
  document.getElementById("modal-overlay").style.display = "none";
  idxEnEdition = -1;
}

function sauvegarderModif() {
  if (idxEnEdition < 0) return;
  const desc    = document.getElementById("m-desc").value.trim();
  const montant = parseFloat(document.getElementById("m-montant").value);
  const date    = document.getElementById("m-date").value;
  const type    = document.querySelector('input[name="m-type"]:checked').value;
  const cat     = document.getElementById("m-cat").value;

  if (!desc)             return alert(t("alert-desc"));
  if (!montant || montant <= 0) return alert(t("alert-montant"));
  if (!date)             return alert(t("alert-date"));

  let recurrence = "non";
  if (type === "sortie") {
    const recChecked = document.querySelector('input[name="m-rec"]:checked');
    recurrence = recChecked ? recChecked.value : "non";
  }
  const note = (document.getElementById("m-note")?.value || "").trim();
  transactions[idxEnEdition] = { date, description: desc, categorie: cat, type, montant, recurrence, note };
  sauvegarder();
  document.getElementById("modal-overlay").style.display = "none";
  idxEnEdition = -1;
  rafraichir();
}

// ── Helpers export ────────────────────────────────────────────────────────────
function _csvRows(data) {
  const header = "date,description,categorie,type,montant,recurrence,statut,note\n";
  const rows = data.map(t =>
    `${t.date},"${(t.description||"").replace(/"/g,'""')}","${(t.categorie||"").replace(/"/g,'""')}",${t.type},${t.montant},${t.recurrence||"non"},${t.statut||"payé"},"${(t.note||"").replace(/"/g,'""')}"`
  ).join("\n");
  return header + rows;
}

// ── Export CSV — mois courant ─────────────────────────────────────────────────
function exporterCSV() {
  const prefix = `${anneeCourante}-${String(moisCourant).padStart(2,"0")}`;
  const data = transactions.filter(t => t.date.startsWith(prefix));
  if (!data.length) return alert(t("alert-no-tx-mois"));
  const moisLabel = `${anneeCourante}_${String(moisCourant).padStart(2,"0")}`;
  telecharger(_csvRows(data), `cashews_${moisLabel}.csv`, "text/csv");
}

// ── Export JSON — mois courant ────────────────────────────────────────────────
function exporterJSON() {
  const prefix = `${anneeCourante}-${String(moisCourant).padStart(2,"0")}`;
  const data = transactions.filter(t => t.date.startsWith(prefix));
  if (!data.length) return alert(t("alert-no-tx-mois"));
  const moisLabel = `${anneeCourante}_${String(moisCourant).padStart(2,"0")}`;
  telecharger(JSON.stringify(data, null, 2), `cashews_${moisLabel}.json`, "application/json");
}

// ── Export CSV All — toutes les données ───────────────────────────────────────
function exporterCSVAll() {
  if (!transactions.length) return alert(t("alert-no-tx-export"));
  const today = new Date().toISOString().slice(0,10).replace(/-/g,"_");
  telecharger(_csvRows(transactions), `cashews_tout_${today}.csv`, "text/csv");
}

// ── Export JSON All — toutes les données ──────────────────────────────────────
function exporterJSONAll() {
  if (!transactions.length) return alert(t("alert-no-tx-export"));
  const today = new Date().toISOString().slice(0,10).replace(/-/g,"_");
  telecharger(JSON.stringify(transactions, null, 2), `cashews_tout_${today}.json`, "application/json");
}

function telecharger(contenu, nom, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([contenu], {type}));
  a.download = nom;
  a.click();
}

// ── Analyse Loisirs & Autre ───────────────────────────────────────────────────
function getMoisData(annee, mois) {
  const prefix = `${annee}-${String(mois).padStart(2,"0")}`;
  const duMois = transactions.filter(t => t.date.startsWith(prefix));
  const loisirs = duMois.filter(t => t.type === "sortie" && t.categorie === "Loisirs").reduce((s,t)=>s+t.montant,0);
  const autre   = duMois.filter(t => t.type === "sortie" && t.categorie === "Autre").reduce((s,t)=>s+t.montant,0);
  const entrees = duMois.filter(t => t.type === "entrée").reduce((s,t)=>s+t.montant,0);
  return { loisirs, autre, entrees };
}

function analyserDepenses() {
  const prefix = `${anneeCourante}-${String(moisCourant).padStart(2,"0")}`;
  const duMois = transactions.filter(t => t.date.startsWith(prefix));

  const loisirs = duMois.filter(t => t.type === "sortie" && t.categorie === "Loisirs");
  const autre   = duMois.filter(t => t.type === "sortie" && t.categorie === "Autre");

  const totalLoisirs = loisirs.reduce((s, t) => s + t.montant, 0);
  const totalAutre   = autre.reduce((s, t) => s + t.montant, 0);
  const totalEntrees = duMois.filter(t => t.type === "entrée").reduce((s, t) => s + t.montant, 0);

  const pctLoisirs = totalEntrees > 0 ? (totalLoisirs / totalEntrees * 100) : 0;
  const pctAutre   = totalEntrees > 0 ? (totalAutre   / totalEntrees * 100) : 0;

  // ── Historique 3 mois précédents ──
  const historique = [];
  for (let i = 1; i <= 3; i++) {
    let m = moisCourant - i;
    let a = anneeCourante;
    if (m <= 0) { m += 12; a--; }
    const data = getMoisData(a, m);
    if (data.loisirs > 0 || data.autre > 0 || data.entrees > 0) {
      historique.push({ mois: m, annee: a, ...data });
    }
  }

  const div = document.getElementById("analyse-result");

  if (totalLoisirs === 0 && totalAutre === 0) {
    div.innerHTML = `<p class="analyse-vide">✅ Aucune dépense en <strong>Loisirs</strong> ou <strong>Autre</strong> ce mois-ci !</p>`;
    document.getElementById("analyse-overlay").style.display = "flex";
    return;
  }

  // ── Résumé ──
  let html = `<div class="analyse-section">`;
  html += `<div class="analyse-titre">📋 Résumé du mois</div>`;

  if (totalLoisirs > 0) {
    const badge = pctLoisirs > 15 ? "analyse-badge-rouge" : pctLoisirs > 8 ? "analyse-badge-orange" : "analyse-badge-vert";
    html += `
      <div class="analyse-ligne">
        <span>🎮 Loisirs</span>
        <span class="analyse-montant">${totalLoisirs.toFixed(2)} $</span>
      </div>
      <div class="analyse-pct ${badge}">${pctLoisirs.toFixed(1)} % des entrées</div>`;
    if (loisirs.length > 0) {
      html += `<ul class="analyse-liste">`;
      loisirs.forEach(t => {
        html += `<li><span>${t.description} ${_recBadge(t)}</span><span>${t.montant.toFixed(2)} $</span></li>`;
      });
      html += `</ul>`;
    }
  }

  if (totalAutre > 0) {
    const badge = pctAutre > 10 ? "analyse-badge-rouge" : pctAutre > 5 ? "analyse-badge-orange" : "analyse-badge-vert";
    html += `
      <div class="analyse-ligne">
        <span>📦 Autre</span>
        <span class="analyse-montant">${totalAutre.toFixed(2)} $</span>
      </div>
      <div class="analyse-pct ${badge}">${pctAutre.toFixed(1)} % des entrées</div>`;
    if (autre.length > 0) {
      html += `<ul class="analyse-liste">`;
      autre.forEach(t => {
        html += `<li><span>${t.description} ${_recBadge(t)}</span><span>${t.montant.toFixed(2)} $</span></li>`;
      });
      html += `</ul>`;
    }
  }

  html += `</div>`;

  // ── Comparatif mois précédents ──
  if (historique.length > 0) {
    html += `<div class="analyse-section">`;
    html += `<div class="analyse-titre">📅 Comparatif mois précédents</div>`;
    html += `<table class="compare-table">`;
    html += `<thead><tr><th>Mois</th><th>🎮 Loisirs</th><th>📦 Autre</th><th>Total</th></tr></thead><tbody>`;

    // Ligne mois courant
    const totalCourant = totalLoisirs + totalAutre;
    html += `<tr class="compare-row-current">
      <td><strong>${MOIS_NOMS[moisCourant-1]}</strong></td>
      <td>${totalLoisirs > 0 ? totalLoisirs.toFixed(2)+" $" : "—"}</td>
      <td>${totalAutre > 0 ? totalAutre.toFixed(2)+" $" : "—"}</td>
      <td><strong>${totalCourant.toFixed(2)} $</strong></td>
    </tr>`;

    historique.forEach(h => {
      const totalH = h.loisirs + h.autre;
      const diff   = totalCourant - totalH;
      const diffTxt = diff === 0 ? "" : (diff > 0 ? `<span class="cmp-hausse">▲ ${diff.toFixed(2)} $</span>` : `<span class="cmp-baisse">▼ ${Math.abs(diff).toFixed(2)} $</span>`);
      const label  = h.annee !== anneeCourante ? `${MOIS_NOMS[h.mois-1]} ${h.annee}` : MOIS_NOMS[h.mois-1];
      html += `<tr>
        <td>${label}</td>
        <td>${h.loisirs > 0 ? h.loisirs.toFixed(2)+" $" : "—"}</td>
        <td>${h.autre > 0 ? h.autre.toFixed(2)+" $" : "—"}</td>
        <td>${totalH.toFixed(2)} $ ${diffTxt}</td>
      </tr>`;
    });

    html += `</tbody></table>`;

    // Tendance
    if (historique.length >= 1) {
      const prevTotal = historique[0].loisirs + historique[0].autre;
      const diffPct   = prevTotal > 0 ? ((totalCourant - prevTotal) / prevTotal * 100) : null;
      if (diffPct !== null) {
        if (diffPct > 10) {
          html += `<p class="compare-tendance rouge">📈 Vos dépenses Loisirs & Autre ont <strong>augmenté de ${diffPct.toFixed(1)} %</strong> par rapport au mois dernier.</p>`;
        } else if (diffPct < -10) {
          html += `<p class="compare-tendance vert">📉 Vos dépenses Loisirs & Autre ont <strong>diminué de ${Math.abs(diffPct).toFixed(1)} %</strong> par rapport au mois dernier. Bravo !</p>`;
        } else {
          html += `<p class="compare-tendance neutre">➡️ Vos dépenses Loisirs & Autre sont <strong>stables</strong> par rapport au mois dernier (${diffPct > 0 ? "+" : ""}${diffPct.toFixed(1)} %).</p>`;
        }
      }
    }

    html += `</div>`;
  }

  // ── Conseils ──
  html += `<div class="analyse-section">`;
  html += `<div class="analyse-titre">💡 Conseils</div>`;
  html += `<ul class="analyse-conseils">`;

  // Conseils Loisirs
  if (totalLoisirs > 0) {
    if (pctLoisirs > 15) {
      html += `<li>⚠️ Vos <strong>Loisirs</strong> représentent <strong>${pctLoisirs.toFixed(1)} %</strong> de vos entrées — c'est élevé. Essayez de viser moins de 10 %.</li>`;
      html += `<li>🎯 Fixez-vous un budget mensuel Loisirs de <strong>${(totalEntrees * 0.10).toFixed(2)} $</strong> (10 % de vos entrées).</li>`;
      html += `<li>📅 Planifiez vos sorties à l'avance pour éviter les dépenses impulsives.</li>`;
    } else if (pctLoisirs > 8) {
      html += `<li>🟡 Vos <strong>Loisirs</strong> (${pctLoisirs.toFixed(1)} %) sont dans la moyenne — quelques ajustements pourraient aider.</li>`;
      html += `<li>🔄 Cherchez des alternatives gratuites ou moins coûteuses pour certaines activités.</li>`;
    } else {
      html += `<li>✅ Vos <strong>Loisirs</strong> (${pctLoisirs.toFixed(1)} %) sont bien maîtrisés. Continuez ainsi !</li>`;
    }
    if (loisirs.length >= 3) {
      const maxLoisir = loisirs.reduce((a, b) => a.montant > b.montant ? a : b);
      html += `<li>💸 Votre plus grosse dépense Loisirs : <strong>${maxLoisir.description}</strong> (${maxLoisir.montant.toFixed(2)} $). Peut-elle être réduite ?</li>`;
    }
    html += `<li>📱 Vérifiez vos abonnements (streaming, jeux…) et annulez ceux que vous utilisez peu.</li>`;
  }

  // Conseils Autre
  if (totalAutre > 0) {
    if (pctAutre > 10) {
      html += `<li>⚠️ La catégorie <strong>Autre</strong> représente <strong>${pctAutre.toFixed(1)} %</strong> de vos entrées. Essayez de recatégoriser ces dépenses pour mieux les contrôler.</li>`;
      html += `<li>🏷️ Recatégorisez vos dépenses « Autre » pour identifier les postes à réduire.</li>`;
    } else if (pctAutre > 5) {
      html += `<li>🟡 La catégorie <strong>Autre</strong> (${pctAutre.toFixed(1)} %) mérite attention. Essayez de mieux catégoriser ces achats.</li>`;
    } else {
      html += `<li>✅ La catégorie <strong>Autre</strong> (${pctAutre.toFixed(1)} %) est bien contrôlée.</li>`;
    }
    if (autre.length >= 2) {
      const maxAutre = autre.reduce((a, b) => a.montant > b.montant ? a : b);
      html += `<li>💸 Plus grosse dépense « Autre » : <strong>${maxAutre.description}</strong> (${maxAutre.montant.toFixed(2)} $). Est-elle vraiment nécessaire ?</li>`;
    }
    html += `<li>📝 Avant chaque achat « Autre », demandez-vous : est-ce un besoin ou une envie ?</li>`;
  }

  // Conseils récurrence
  const toutesDepenses = [...loisirs, ...autre];
  const recurrentes1x = toutesDepenses.filter(t => t.recurrence === "1x");
  const recurrentes2x = toutesDepenses.filter(t => t.recurrence === "2x");
  const totalRec1x = recurrentes1x.reduce((s,t)=>s+t.montant,0);
  const totalRec2x = recurrentes2x.reduce((s,t)=>s+t.montant,0);
  const totalRec = totalRec1x + totalRec2x;
  const totalPonctuel = (totalLoisirs + totalAutre) - totalRec;

  if (totalRec > 0) {
    const pctRec = totalEntrees > 0 ? (totalRec / totalEntrees * 100) : 0;
    html += `<li>🔁 Vous avez <strong>${totalRec.toFixed(2)} $</strong> de dépenses récurrentes en Loisirs & Autre`;
    if (recurrentes1x.length > 0 && recurrentes2x.length > 0) {
      html += ` (${recurrentes1x.length} à 1×/mois, ${recurrentes2x.length} à 2×/mois)`;
    } else if (recurrentes1x.length > 0) {
      html += ` (${recurrentes1x.length} à 1×/mois)`;
    } else {
      html += ` (${recurrentes2x.length} à 2×/mois)`;
    }
    html += ` — soit <strong>${pctRec.toFixed(1)} %</strong> de vos entrées.</li>`;
    if (pctRec > 10) {
      html += `<li>⚠️ Vos dépenses récurrentes sont élevées. Passez en revue chaque abonnement et demandez-vous si vous en avez vraiment besoin.</li>`;
    } else {
      html += `<li>✅ Vos dépenses récurrentes sont sous contrôle. Continuez à les surveiller chaque mois.</li>`;
    }
    if (totalPonctuel > 0) {
      html += `<li>📌 Vos dépenses ponctuelles s'élèvent à <strong>${totalPonctuel.toFixed(2)} $</strong> — ce sont les plus faciles à réduire rapidement.</li>`;
    }
  }

  // Conseil général
  const totalFlexible = totalLoisirs + totalAutre;
  if (totalFlexible > 0 && totalEntrees > 0) {
    const economie = totalFlexible * 0.20;
    html += `<li>💰 En réduisant vos dépenses Loisirs & Autre de 20 %, vous pourriez économiser <strong>${economie.toFixed(2)} $</strong> ce mois-ci.</li>`;
  }

  html += `</ul></div>`;

  div.innerHTML = html;
  document.getElementById("analyse-overlay").style.display = "flex";
}

function fermerAnalyse(event) {
  if (event && event.target !== document.getElementById("analyse-overlay")) return;
  document.getElementById("analyse-overlay").style.display = "none";
}

// ── Import ────────────────────────────────────────────────────────────────────
function importerFichier() {
  document.getElementById("file-input").click();
}

function lireFichier(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      let nouvelles = [];
      if (file.name.endsWith(".json")) {
        nouvelles = JSON.parse(e.target.result);
        // Normaliser le champ statut si absent
        nouvelles = nouvelles.map(n => ({ ...n, statut: n.statut || "payé" }));
      } else {
        const lines = e.target.result.trim().split("\n");
        const headers = lines[0].split(",");
        nouvelles = lines.slice(1).map(line => {
          const vals = line.match(/(".*?"|[^,]+)/g) || [];
          const obj  = {};
          headers.forEach((h,i) => obj[h.trim()] = (vals[i]||"").replace(/^"|"$/g,"").trim());
          obj.montant    = parseFloat(obj.montant) || 0;
          obj.recurrence = obj.recurrence || "non";
          obj.statut     = obj.statut || "payé";
          obj.note       = obj.note || "";
          return obj;
        });
      }
      if (!confirm(`Importer ${nouvelles.length} ${t("confirm-import")}`)) return;
      transactions.length = 0;
      nouvelles.forEach(n => transactions.push(n));
      sauvegarder();
      rafraichir();
      verifierRappels();
      alert(`✅ ${nouvelles.length} ${t("alert-import-ok")}`);
    } catch(err) {
      alert(t("alert-import-err") + err.message);
    }
    event.target.value = "";
  };
  reader.readAsText(file);
}

// ── Mode sombre/clair ─────────────────────────────────────────────────────────
function toggleTheme() {
  const dark = document.body.classList.toggle("dark");
  document.getElementById("btn-theme").textContent = dark ? "☀️" : "🌙";
  localStorage.setItem("cashewdollar_theme", dark ? "dark" : "light");
}

// ── Rappels récurrents ────────────────────────────────────────────────────────
let _rappelsManquantes = [];

function verifierRappels() {
  const moisPrec = moisCourant === 1 ? 12 : moisCourant - 1;
  const anneePrec = moisCourant === 1 ? anneeCourante - 1 : anneeCourante;
  const prefixPrec = `${anneePrec}-${String(moisPrec).padStart(2,"0")}`;
  const prefixCour = `${anneeCourante}-${String(moisCourant).padStart(2,"0")}`;

  const recPrec = transactions.filter(t =>
    t.date.startsWith(prefixPrec) && t.type === "sortie" &&
    t.recurrence && t.recurrence !== "non"
  );
  const descCour = new Set(
    transactions.filter(t => t.date.startsWith(prefixCour)).map(t => t.description.toLowerCase())
  );
  _rappelsManquantes = recPrec.filter(t => !descCour.has(t.description.toLowerCase()));

  const banner = document.getElementById("rappels-banner");
  if (_rappelsManquantes.length === 0) { banner.style.display = "none"; return; }

  banner.innerHTML = `🔔 <strong>${_rappelsManquantes.length}</strong> dépense(s) récurrente(s) non saisie(s) ce mois-ci &nbsp;<button id="btn-voir-rappels" class="btn-rappels-voir">Voir →</button>`;
  banner.style.display = "flex";
  document.getElementById("btn-voir-rappels").addEventListener("click", ouvrirRappels);
}

function ouvrirRappels() {
  const liste = document.getElementById("rappels-liste");
  liste.innerHTML = _rappelsManquantes.map((t, i) => `
    <div class="rappel-item">
      <input type="checkbox" class="rappel-cb" data-idx="${i}" checked>
      <span class="rappel-desc">${t.description}</span>
      <input type="number" class="rappel-montant-input" data-idx="${i}" value="${t.montant.toFixed(2)}" min="0.01" step="0.01" title="Modifier le montant">
      <span class="rappel-dollar">$</span>
      <span class="rappel-rec">${t.recurrence === "2x" ? "🔁🔁 2×/mois" : "🔁 1×/mois"}</span>
      <span class="rappel-cat">${t.categorie}</span>
    </div>
  `).join("");
  document.getElementById("rappels-overlay").style.display = "flex";
}

function traiterRappelsAjouter() {
  const cases = document.querySelectorAll(".rappel-cb:checked");
  if (cases.length === 0) { alert(t("alert-rappel-cocher")); return; }
  const prefixCour = `${anneeCourante}-${String(moisCourant).padStart(2,"0")}`;
  // Nombre de jours dans le mois courant
  const joursDansMoisCour = new Date(anneeCourante, moisCourant, 0).getDate();
  cases.forEach(cb => {
    const idx = parseInt(cb.dataset.idx);
    const t = _rappelsManquantes[idx];
    // Extraire le jour de la date originale (mois précédent)
    const jourOriginal = parseInt(t.date.slice(8, 10), 10);
    // Ajuster si le mois courant a moins de jours
    const jourAjuste = Math.min(jourOriginal, joursDansMoisCour);
    const dateAjout = `${prefixCour}-${String(jourAjuste).padStart(2,"0")}`;
    // Lire le montant modifié dans le champ input
    const inputMontant = document.querySelector(`.rappel-montant-input[data-idx="${idx}"]`);
    const montant = inputMontant ? (parseFloat(inputMontant.value) || t.montant) : t.montant;
    transactions.push({
      date: dateAjout,
      description: t.description,
      categorie: t.categorie,
      type: "sortie",
      montant: montant,
      recurrence: t.recurrence,
      note: t.note || "",
      statut: "estimé"
    });
  });
  sauvegarder();
  document.getElementById("rappels-overlay").style.display = "none";
  rafraichir();
  verifierRappels();
}

function traiterRappelsSupprimer() {
  const cases = document.querySelectorAll(".rappel-cb:checked");
  if (cases.length === 0) { alert(t("alert-rappel-cocher")); return; }
  if (!confirm(t("confirm-retirer-rec"))) return;
  cases.forEach(cb => {
    const t = _rappelsManquantes[parseInt(cb.dataset.idx)];
    // Trouver la transaction d'origine et retirer sa récurrence
    const orig = transactions.find(tx =>
      tx.description.toLowerCase() === t.description.toLowerCase() &&
      tx.type === "sortie" && tx.recurrence && tx.recurrence !== "non"
    );
    if (orig) orig.recurrence = "non";
  });
  sauvegarder();
  document.getElementById("rappels-overlay").style.display = "none";
  rafraichir();
  verifierRappels();
}

// ── Note dans ajout/édition ───────────────────────────────────────────────────
// (note déjà intégrée dans ajouterTransaction via _pendingTx.note)

// ── Peupler les selects de catégories ────────────────────────────────────────
function peuplerSelectsCategories() {
  const cats = toutesCategories();
  ["f-cat","m-cat"].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = "";
    cats.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c; opt.textContent = tCat(c);
      if (c === current) opt.selected = true;
      sel.appendChild(opt);
    });
  });
}

// ── Budget par catégorie ──────────────────────────────────────────────────────
function afficherBudgets(duMois) {
  const section = document.getElementById("budget-section");
  if (!section) return;
  const cats = toutesCategories().filter(c => budgets[c] && budgets[c] > 0);
  if (cats.length === 0) { section.innerHTML = `<p style="font-size:.78rem;color:var(--sub)">Aucun budget défini. Cliquez sur ⚙️ pour en ajouter.</p>`; return; }
  section.innerHTML = cats.map(cat => {
    const depense = duMois.filter(t => t.type === "sortie" && t.categorie === cat).reduce((s,t)=>s+t.montant,0);
    const budget = budgets[cat];
    const pct = Math.min((depense / budget) * 100, 100);
    const cls = pct >= 100 ? "danger" : pct >= 80 ? "warn" : "ok";
    return `<div class="budget-item">
      <div class="budget-item-header">
        <span class="budget-cat">${cat}</span>
        <span class="budget-amounts">${depense.toFixed(2)} $ / ${budget.toFixed(2)} $</span>
      </div>
      <div class="budget-bar-bg"><div class="budget-bar-fill ${cls}" style="width:${pct}%"></div></div>
    </div>`;
  }).join("");
}

function ouvrirBudget() {
  const cats = toutesCategories().filter(c => c !== "Salaire" && c !== "Épargne");
  const div = document.getElementById("budget-form-list");
  div.innerHTML = cats.map(cat => `
    <div class="budget-form-row">
      <label>${cat}</label>
      <input type="number" min="0" step="1" placeholder="0" data-cat="${cat}" value="${budgets[cat] || ""}">
    </div>`).join("");
  document.getElementById("budget-overlay").style.display = "flex";
}

function sauvegarderBudgetForm() {
  document.querySelectorAll("#budget-form-list input[data-cat]").forEach(inp => {
    const cat = inp.dataset.cat;
    const val = parseFloat(inp.value);
    if (val > 0) budgets[cat] = val;
    else delete budgets[cat];
  });
  sauvegarderBudgets();
  document.getElementById("budget-overlay").style.display = "none";
  rafraichir();
}

// ── Catégories personnalisables ───────────────────────────────────────────────
function ouvrirCategories() {
  afficherListeCategories();
  document.getElementById("categories-overlay").style.display = "flex";
}

function afficherListeCategories() {
  const list = document.getElementById("categories-list");
  list.innerHTML = toutesCategories().map(cat => {
    const isDef = CATEGORIES_DEFAULT.includes(cat);
    return `<div class="cat-item${isDef?" default":""}">
      <span>${cat}</span>
      ${isDef ? "" : `<button class="btn-cat-del" data-cat="${cat}" title="Supprimer">🗑</button>`}
    </div>`;
  }).join("");
  list.querySelectorAll(".btn-cat-del").forEach(btn => {
    btn.addEventListener("click", () => supprimerCategorie(btn.dataset.cat));
  });
}

function ajouterCategorie() {
  const inp = document.getElementById("cat-new-input");
  const nom = inp.value.trim();
  if (!nom) return;
  if (categoriesPerso.map(c=>c.toLowerCase()).includes(nom.toLowerCase())) { alert(t("alert-cat-existe")); return; }
  categoriesPerso.push(nom);
  sauvegarderCategories();
  peuplerSelectsCategories();
  afficherListeCategories();
  inp.value = "";
}

function supprimerCategorie(cat) {
  if (CATEGORIES_DEFAULT.includes(cat)) return;
  if (!confirm(`${t("confirm-suppr-cat")} « ${cat} » ${t("confirm-supprimer-fin")}`)) return;
  categoriesPerso = categoriesPerso.filter(c => c !== cat);
  sauvegarderCategories();
  peuplerSelectsCategories();
  afficherListeCategories();
}

// ── Vue annuelle ──────────────────────────────────────────────────────────────
function ouvrirVueAnnuelle() {
  let html = `<table class="annuelle-table"><thead><tr><th>Mois</th><th>Entrées</th><th>Sorties</th><th>Solde</th></tr></thead><tbody>`;
  let totE=0, totS=0;
  const now = new Date();
  for (let m=1; m<=12; m++) {
    const prefix = `${anneeCourante}-${String(m).padStart(2,"0")}`;
    const du = transactions.filter(t=>t.date.startsWith(prefix));
    const e = du.filter(t=>t.type==="entrée").reduce((s,t)=>s+t.montant,0);
    const s = du.filter(t=>t.type==="sortie").reduce((s,t)=>s+t.montant,0);
    const sol = e - s;
    totE+=e; totS+=s;
    const isCur = m===moisCourant && anneeCourante===now.getFullYear();
    const solCls = sol>=0?"col-solde-pos":"col-solde-neg";
    html += `<tr${isCur?' class="mois-courant"':''}>
      <td>${MOIS_NOMS[m-1]}</td>
      <td class="col-entree">${e>0?"+"+e.toFixed(2)+" $":"—"}</td>
      <td class="col-sortie">${s>0?"-"+s.toFixed(2)+" $":"—"}</td>
      <td class="${solCls}">${(sol>=0?"+":"")+sol.toFixed(2)} $</td>
    </tr>`;
  }
  const totSol = totE-totS;
  html += `</tbody><tfoot><tr class="annuelle-total">
    <td><strong>Total ${anneeCourante}</strong></td>
    <td class="col-entree">+${totE.toFixed(2)} $</td>
    <td class="col-sortie">-${totS.toFixed(2)} $</td>
    <td class="${totSol>=0?"col-solde-pos":"col-solde-neg"}">${(totSol>=0?"+":"")+totSol.toFixed(2)} $</td>
  </tr></tfoot></table>`;
  document.getElementById("annuelle-result").innerHTML = html;
  document.getElementById("annuelle-overlay").style.display = "flex";
}

// ── Graphique camembert ───────────────────────────────────────────────────────
let _chart = null;
const CHART_COLORS = ["#1e3a5f","#3b82f6","#22c55e","#ef4444","#f59e0b","#8b5cf6","#ec4899","#14b8a6","#f97316","#64748b"];

function ouvrirGraphique() {
  const prefix = `${anneeCourante}-${String(moisCourant).padStart(2,"0")}`;
  const sorties = transactions.filter(t=>t.date.startsWith(prefix)&&t.type==="sortie");
  const parCat = {};
  sorties.forEach(t=>{ parCat[t.categorie]=(parCat[t.categorie]||0)+t.montant; });
  const labels = Object.keys(parCat);
  const data   = Object.values(parCat);
  if (!labels.length) { alert(t("alert-no-depense")); return; }

  document.getElementById("graphique-overlay").style.display = "flex";
  if (_chart) { _chart.destroy(); _chart = null; }

  const ctx = document.getElementById("chart-depenses").getContext("2d");
  _chart = new Chart(ctx, {
    type: "doughnut",
    data: { labels, datasets: [{ data, backgroundColor: CHART_COLORS.slice(0,labels.length), borderWidth: 2 }] },
    options: { plugins: { legend: { display: false } }, cutout: "55%" }
  });

  const total = data.reduce((s,v)=>s+v,0);
  document.getElementById("graphique-legende").innerHTML = labels.map((l,i)=>
    `<div class="legende-item"><div class="legende-dot" style="background:${CHART_COLORS[i%CHART_COLORS.length]}"></div>${l} — ${data[i].toFixed(2)} $ (${(data[i]/total*100).toFixed(1)} %)</div>`
  ).join("");
}
