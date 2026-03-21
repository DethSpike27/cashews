// ── Données ──────────────────────────────────────────────────────────────────
const MOIS_NOMS = ["Janvier","Février","Mars","Avril","Mai","Juin",
                   "Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

let transactions = JSON.parse(localStorage.getItem("cashewdollar_tx") || "[]");
let moisCourant  = new Date().getMonth() + 1;
let anneeCourante = new Date().getFullYear();

function sauvegarder() {
  localStorage.setItem("cashewdollar_tx", JSON.stringify(transactions));
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("f-date").value = new Date().toISOString().slice(0,10);

  // Navigation mois / année
  document.getElementById("btn-prev").addEventListener("click", moisPrecedent);
  document.getElementById("btn-next").addEventListener("click", moisSuivant);
  document.getElementById("btn-annee-prev").addEventListener("click", anneePrecedente);
  document.getElementById("btn-annee-next").addEventListener("click", anneeSuivante);

  // Boutons header (remplace les onclick inline)
  document.getElementById("btn-importer").addEventListener("click", importerFichier);
  document.getElementById("btn-export-csv").addEventListener("click", exporterCSV);
  document.getElementById("btn-export-json").addEventListener("click", exporterJSON);
  document.getElementById("file-input").addEventListener("change", lireFichier);

  // Formulaire principal (remplace onclick inline sur btn-add)
  document.getElementById("form-transaction").addEventListener("submit", e => {
    e.preventDefault();
    ajouterTransaction();
  });

  // Bouton analyser (remplace onclick inline)
  document.getElementById("btn-analyser").addEventListener("click", analyserDepenses);

  // Fermeture modals par clic sur l'overlay
  document.getElementById("analyse-overlay").addEventListener("click", fermerAnalyse);
  document.getElementById("recurrence-overlay").addEventListener("click", fermerRecurrence);
  document.getElementById("modal-overlay").addEventListener("click", fermerModal);

  // Bouton fermer analyse
  document.getElementById("btn-close-analyse").addEventListener("click", () => {
    document.getElementById("analyse-overlay").style.display = "none";
  });

  // Boutons récurrence (remplace onclick inline)
  document.getElementById("btn-rec-non").addEventListener("click", () => confirmerAjout("non"));
  document.getElementById("btn-rec-1x").addEventListener("click",  () => confirmerAjout("1x"));
  document.getElementById("btn-rec-2x").addEventListener("click",  () => confirmerAjout("2x"));
  document.getElementById("btn-cancel-recurrence").addEventListener("click", () => fermerRecurrence());

  // Boutons modal édition (remplace onclick inline)
  document.getElementById("btn-cancel-modal").addEventListener("click", () => fermerModal());
  document.getElementById("btn-save-modal").addEventListener("click", sauvegarderModif);

  // Filtres liste
  document.querySelectorAll('input[name="filtre"]').forEach(r =>
    r.addEventListener("change", rafraichir)
  );

  majNavLabel();
  rafraichir();
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
  majNavLabel(); rafraichir();
}
function moisSuivant() {
  if (moisCourant === 12) { moisCourant = 1; anneeCourante++; }
  else moisCourant++;
  majNavLabel(); rafraichir();
}

// ── Navigation année ──────────────────────────────────────────────────────────
function anneePrecedente() {
  anneeCourante--;
  majNavLabel(); rafraichir();
}
function anneeSuivante() {
  anneeCourante++;
  majNavLabel(); rafraichir();
}

// ── Rafraîchir ────────────────────────────────────────────────────────────────
function rafraichir() {
  const prefix  = `${anneeCourante}-${String(moisCourant).padStart(2,"0")}`;
  const filtre  = document.querySelector('input[name="filtre"]:checked').value;
  const duMois  = transactions.filter(t => t.date.startsWith(prefix));
  const visible = duMois.filter(t => filtre === "tous" || t.type === filtre);

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
  const recCls   = (t.type === "sortie" && t.recurrence && t.recurrence !== "non") ? " tr-recurrent" : "";
  const tr = document.createElement("tr");
  tr.className = recCls;

  const tdDate = document.createElement("td");
  tdDate.textContent = t.date;

  const tdDesc = document.createElement("td");
  tdDesc.innerHTML = `${t.description} ${recBadge}`;

  const tdCat = document.createElement("td");
  tdCat.textContent = t.categorie;

  const tdType = document.createElement("td");
  tdType.className = cls;
  tdType.textContent = t.type.charAt(0).toUpperCase() + t.type.slice(1);

  const tdMontant = document.createElement("td");
  tdMontant.className = cls;
  tdMontant.textContent = `${signe}${parseFloat(t.montant).toFixed(2)} $`;

  const tdActions = document.createElement("td");
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

  if (!desc)            return alert("Veuillez entrer une description.");
  if (!montant || montant <= 0) return alert("Veuillez entrer un montant positif.");
  if (!date)            return alert("Veuillez entrer une date.");

  if (type === "sortie") {
    // Ouvrir le popup de récurrence
    _pendingTx = { date, description: desc, categorie: cat, type, montant };
    document.getElementById("recurrence-overlay").style.display = "flex";
  } else {
    // Entrée : pas de récurrence
    transactions.push({ date, description: desc, categorie: cat, type, montant, recurrence: "non" });
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
  cacherSuggestions();
}

// ── Supprimer ─────────────────────────────────────────────────────────────────
function supprimer(idx) {
  const t = transactions[idx];
  if (confirm(`Supprimer « ${t.description} » ?`)) {
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

  if (!desc)             return alert("Veuillez entrer une description.");
  if (!montant || montant <= 0) return alert("Veuillez entrer un montant positif.");
  if (!date)             return alert("Veuillez entrer une date.");

  let recurrence = "non";
  if (type === "sortie") {
    const recChecked = document.querySelector('input[name="m-rec"]:checked');
    recurrence = recChecked ? recChecked.value : "non";
  }
  transactions[idxEnEdition] = { date, description: desc, categorie: cat, type, montant, recurrence };
  sauvegarder();
  document.getElementById("modal-overlay").style.display = "none";
  idxEnEdition = -1;
  rafraichir();
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exporterCSV() {
  const prefix = `${anneeCourante}-${String(moisCourant).padStart(2,"0")}`;
  const data   = transactions.filter(t => t.date.startsWith(prefix));
  if (!data.length) return alert("Aucune transaction ce mois-ci.");
  const header = "date,description,categorie,type,montant\n";
  const rows   = data.map(t =>
    `${t.date},"${t.description}","${t.categorie}",${t.type},${t.montant}`).join("\n");
  telecharger(header+rows, `cashews_${anneeCourante}_${String(moisCourant).padStart(2,"0")}.csv`, "text/csv");
}

// ── Export JSON ───────────────────────────────────────────────────────────────
function exporterJSON() {
  const prefix = `${anneeCourante}-${String(moisCourant).padStart(2,"0")}`;
  const data   = transactions.filter(t => t.date.startsWith(prefix));
  if (!data.length) return alert("Aucune transaction ce mois-ci.");
  telecharger(JSON.stringify(data, null, 2),
    `cashews_${anneeCourante}_${String(moisCourant).padStart(2,"0")}.json`, "application/json");
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
        html += `<li><span>${t.description}</span><span>${t.montant.toFixed(2)} $</span></li>`;
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
        html += `<li><span>${t.description}</span><span>${t.montant.toFixed(2)} $</span></li>`;
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
      } else {
        const lines = e.target.result.trim().split("\n");
        const headers = lines[0].split(",");
        nouvelles = lines.slice(1).map(line => {
          const vals = line.match(/(".*?"|[^,]+)/g) || [];
          const obj  = {};
          headers.forEach((h,i) => obj[h.trim()] = (vals[i]||"").replace(/^"|"$/g,"").trim());
          obj.montant = parseFloat(obj.montant);
          return obj;
        });
      }
      if (!confirm(`Importer ${nouvelles.length} transaction(s) ?\n⚠️ Cela remplacera toutes vos données actuelles.`)) return;
      transactions.length = 0;
      nouvelles.forEach(n => transactions.push(n));
      sauvegarder();
      rafraichir();
      alert(`✅ ${nouvelles.length} transaction(s) importée(s) avec succès.`);
    } catch(err) {
      alert("Erreur lors de l'import : " + err.message);
    }
    event.target.value = "";
  };
  reader.readAsText(file);
}
