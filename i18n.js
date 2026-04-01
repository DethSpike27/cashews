// ── Système de traduction FR / EN ─────────────────────────────────────────────
let langue = localStorage.getItem("cashewdollar_langue") || "fr";

function t(key) {
  return (LANG[langue] && LANG[langue][key]) ? LANG[langue][key] : (LANG["fr"][key] || key);
}

function setLangue(lang) {
  langue = lang;
  localStorage.setItem("cashewdollar_langue", langue);
  appliquerTraduction();
  majNavLabel();
  peuplerSelectsCategories();
  rafraichir();
  verifierRappels();
}

function toggleLangue() {
  setLangue(langue === "fr" ? "en" : "fr");
}

function appliquerTraduction() {
  const html = document.getElementById("html-root");
  if (html) html.lang = langue;

  // Mettre à jour les liens FR / EN
  const lienFr = document.getElementById("btn-langue-fr");
  const lienEn = document.getElementById("btn-langue-en");
  if (lienFr) lienFr.classList.toggle("active", langue === "fr");
  if (lienEn) lienEn.classList.toggle("active", langue === "en");

  // Éléments avec data-i18n (textContent)
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
  // Éléments avec data-i18n-ph (placeholder)
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    el.placeholder = t(el.getAttribute("data-i18n-ph"));
  });
  // Éléments avec data-i18n-html (innerHTML)
  document.querySelectorAll("[data-i18n-html]").forEach(el => {
    el.innerHTML = t(el.getAttribute("data-i18n-html"));
  });
}

// ── Traduction des catégories par défaut ──────────────────────────────────────
const CAT_LABELS = {
  fr: {
    "Salaire":       "Salaire",
    "Alimentation":  "Alimentation",
    "Loyer":         "Loyer",
    "Transport":     "Transport",
    "Loisirs":       "Loisirs",
    "Santé":         "Santé",
    "Épargne":       "Épargne",
    "Autre":         "Autre",
  },
  en: {
    "Salaire":       "Salary",
    "Alimentation":  "Groceries",
    "Loyer":         "Rent",
    "Transport":     "Transport",
    "Loisirs":       "Leisure",
    "Santé":         "Health",
    "Épargne":       "Savings",
    "Autre":         "Other",
  }
};

// Retourne le libellé traduit d'une catégorie (clé interne = FR)
function tCat(catKey) {
  return (CAT_LABELS[langue] && CAT_LABELS[langue][catKey]) ? CAT_LABELS[langue][catKey] : catKey;
}

// ── Dictionnaire ──────────────────────────────────────────────────────────────
const LANG = {
  fr: {
    // Header
    "btn-importer":           "📥 Importer",
    "btn-export-toggle":      "📤 Exporter ▾",
    "btn-export-csv":         "📤 CSV (mois)",
    "btn-export-json":        "💾 JSON (mois)",
    "btn-export-csv-all":     "📤 CSV (tout)",
    "btn-export-json-all":    "💾 JSON (tout)",

    // Cartes résumé
    "card-solde":             "Solde",
    "card-entrees":           "Entrées",
    "card-sorties":           "Sorties",

    // Formulaire
    "h2-nouvelle-tx":         "Nouvelle transaction",
    "lbl-desc":               "Description",
    "ph-desc":                "Ex: Épicerie…",
    "lbl-montant":            "Montant ($)",
    "lbl-date":               "Date",
    "legend-type":            "Type",
    "radio-entree":           "Entrée",
    "radio-sortie":           "Sortie",
    "lbl-cat":                "Catégorie",
    "lbl-note":               "Note (optionnel)",
    "ph-note":                "Ex: remboursement partiel…",
    "btn-ajouter":            "➕ Ajouter",

    // Relevé
    "h2-releve":              "📊 Relevé du mois",
    "r-entrees-lbl":          "Entrées du mois",
    "r-sorties-lbl":          "Sorties du mois",
    "r-solde-lbl":            "Solde du mois",
    "r-bilan-lbl":            "Bilan",
    "r-epargne-lbl":          "Épargne du mois",
    "r-bilan-epargne-lbl":    "Bilan avec Épargne",

    // Budget
    "h2-budget":              "🎯 Budget par catégorie",
    "btn-budget-edit":        "⚙️ Gérer les budgets",

    // Analyse
    "h2-analyse":             "🔍 Analyse Loisirs & Autre",
    "btn-analyser":           "📊 Analyser",

    // Vue & Outils
    "h2-outils":              "📅 Vue & Outils",
    "btn-annuelle":           "📅 Vue annuelle",
    "btn-graphique":          "📈 Graphique",
    "btn-categories":         "🏷️ Catégories",

    // Liste / tableau
    "search-ph":              "🔍 Rechercher une transaction…",
    "filter-legend":          "Filtrer :",
    "filter-tous":            "Tous",
    "filter-entrees":         "Entrées",
    "filter-sorties":         "Sorties",
    "th-date":                "Date",
    "th-desc":                "Description",
    "th-cat":                 "Catégorie",
    "th-type":                "Type",
    "th-montant":             "Montant",

    // Modal rappels
    "rappels-titre":          "🔔 Dépenses récurrentes non saisies",
    "rappels-intro":          "Cochez les dépenses à traiter pour ce mois-ci :",
    "btn-cocher-tout":        "☑ Tout cocher",
    "btn-decocher-tout":      "☐ Tout décocher",
    "btn-rappels-ajouter":    "✅ Ajouter les cochées",
    "btn-rappels-supprimer":  "🗑 Payée au total (retirer récurrence)",

    // Modal analyse
    "analyse-titre":          "🔍 Analyse Loisirs & Autre",

    // Modal récurrence
    "recurrence-titre":       "🔁 Récurrence de la sortie",
    "recurrence-desc":        "Cette sortie est-elle récurrente ?",
    "btn-rec-non":            "❌ Non récurrent",
    "btn-rec-1x":             "🔁 1 fois par mois",
    "btn-rec-2x":             "🔁🔁 2 fois par mois",
    "btn-cancel-recurrence":  "Annuler",

    // Modal édition
    "modal-edition-titre":    "✏️ Modifier la transaction",
    "lbl-m-desc":             "Description",
    "lbl-m-montant":          "Montant ($)",
    "lbl-m-date":             "Date",
    "legend-m-type":          "Type",
    "radio-m-entree":         "Entrée",
    "radio-m-sortie":         "Sortie",
    "lbl-m-cat":              "Catégorie",
    "lbl-m-note":             "Note (optionnel)",
    "ph-m-note":              "Ex: remboursement partiel…",
    "rec-edit-label":         "Récurrence",
    "radio-m-rec-non":        "❌ Non récurrent",
    "radio-m-rec-1x":         "🔁 1×/mois",
    "radio-m-rec-2x":         "🔁🔁 2×/mois",
    "btn-cancel-modal":       "Annuler",
    "btn-save-modal":         "💾 Sauvegarder",

    // Modal vue annuelle
    "annuelle-titre":         "📅 Vue annuelle",

    // Modal graphique
    "graphique-titre":        "📈 Graphique des dépenses",

    // Modal budget
    "budget-titre":           "🎯 Gérer les budgets par catégorie",
    "btn-save-budget":        "💾 Sauvegarder les budgets",

    // Modal catégories
    "categories-titre":       "🏷️ Gérer les catégories",
    "ph-cat-new":             "Nouvelle catégorie…",
    "btn-cat-add":            "➕ Ajouter",
    "cat-note":               "⚠️ Les catégories par défaut ne peuvent pas être supprimées.",

    // Alertes & confirmations
    "alert-desc":             "Veuillez entrer une description.",
    "alert-montant":          "Veuillez entrer un montant positif.",
    "alert-date":             "Veuillez entrer une date.",
    "confirm-supprimer":      "Supprimer",
    "confirm-supprimer-fin":  "?",
    "alert-no-tx-mois":       "Aucune transaction ce mois-ci.",
    "alert-no-tx-export":     "Aucune transaction à exporter.",
    "confirm-import":         "transaction(s) ?\n⚠️ Cela remplacera toutes vos données actuelles.",
    "alert-import-ok":        "transaction(s) importée(s) avec succès.",
    "alert-import-err":       "Erreur lors de l'import : ",
    "alert-rappel-cocher":    "Cochez au moins une dépense.",
    "confirm-retirer-rec":    "Retirer la récurrence des dépenses cochées ? (elles ne seront plus rappelées)",
    "alert-cat-existe":       "Cette catégorie existe déjà.",
    "confirm-suppr-cat":      "Supprimer la catégorie",
    "alert-no-depense":       "Aucune dépense ce mois-ci.",

    // Noscript
    "noscript-msg":           "Cashew$ nécessite JavaScript pour fonctionner. Veuillez l'activer dans votre navigateur.",
  },

  en: {
    // Header
    "btn-importer":           "📥 Import",
    "btn-export-toggle":      "📤 Export ▾",
    "btn-export-csv":         "📤 CSV (month)",
    "btn-export-json":        "💾 JSON (month)",
    "btn-export-csv-all":     "📤 CSV (all)",
    "btn-export-json-all":    "💾 JSON (all)",

    // Summary cards
    "card-solde":             "Balance",
    "card-entrees":           "Income",
    "card-sorties":           "Expenses",

    // Form
    "h2-nouvelle-tx":         "New transaction",
    "lbl-desc":               "Description",
    "ph-desc":                "E.g. Groceries…",
    "lbl-montant":            "Amount ($)",
    "lbl-date":               "Date",
    "legend-type":            "Type",
    "radio-entree":           "Income",
    "radio-sortie":           "Expense",
    "lbl-cat":                "Category",
    "lbl-note":               "Note (optional)",
    "ph-note":                "E.g. partial refund…",
    "btn-ajouter":            "➕ Add",

    // Statement
    "h2-releve":              "📊 Monthly statement",
    "r-entrees-lbl":          "Monthly income",
    "r-sorties-lbl":          "Monthly expenses",
    "r-solde-lbl":            "Monthly balance",
    "r-bilan-lbl":            "Summary",
    "r-epargne-lbl":          "Monthly savings",
    "r-bilan-epargne-lbl":    "Summary with savings",

    // Budget
    "h2-budget":              "🎯 Budget by category",
    "btn-budget-edit":        "⚙️ Manage budgets",

    // Analysis
    "h2-analyse":             "🔍 Leisure & Other analysis",
    "btn-analyser":           "📊 Analyse",

    // View & Tools
    "h2-outils":              "📅 View & Tools",
    "btn-annuelle":           "📅 Yearly view",
    "btn-graphique":          "📈 Chart",
    "btn-categories":         "🏷️ Categories",

    // List / table
    "search-ph":              "🔍 Search a transaction…",
    "filter-legend":          "Filter:",
    "filter-tous":            "All",
    "filter-entrees":         "Income",
    "filter-sorties":         "Expenses",
    "th-date":                "Date",
    "th-desc":                "Description",
    "th-cat":                 "Category",
    "th-type":                "Type",
    "th-montant":             "Amount",

    // Reminders modal
    "rappels-titre":          "🔔 Recurring expenses not entered",
    "rappels-intro":          "Check the expenses to process this month:",
    "btn-cocher-tout":        "☑ Check all",
    "btn-decocher-tout":      "☐ Uncheck all",
    "btn-rappels-ajouter":    "✅ Add checked",
    "btn-rappels-supprimer":  "🗑 Paid in full (remove recurrence)",

    // Analysis modal
    "analyse-titre":          "🔍 Leisure & Other analysis",

    // Recurrence modal
    "recurrence-titre":       "🔁 Expense recurrence",
    "recurrence-desc":        "Is this expense recurring?",
    "btn-rec-non":            "❌ Not recurring",
    "btn-rec-1x":             "🔁 Once a month",
    "btn-rec-2x":             "🔁🔁 Twice a month",
    "btn-cancel-recurrence":  "Cancel",

    // Edit modal
    "modal-edition-titre":    "✏️ Edit transaction",
    "lbl-m-desc":             "Description",
    "lbl-m-montant":          "Amount ($)",
    "lbl-m-date":             "Date",
    "legend-m-type":          "Type",
    "radio-m-entree":         "Income",
    "radio-m-sortie":         "Expense",
    "lbl-m-cat":              "Category",
    "lbl-m-note":             "Note (optional)",
    "ph-m-note":              "E.g. partial refund…",
    "rec-edit-label":         "Recurrence",
    "radio-m-rec-non":        "❌ Not recurring",
    "radio-m-rec-1x":         "🔁 1×/month",
    "radio-m-rec-2x":         "🔁🔁 2×/month",
    "btn-cancel-modal":       "Cancel",
    "btn-save-modal":         "💾 Save",

    // Yearly view modal
    "annuelle-titre":         "📅 Yearly view",

    // Chart modal
    "graphique-titre":        "📈 Expense chart",

    // Budget modal
    "budget-titre":           "🎯 Manage budgets by category",
    "btn-save-budget":        "💾 Save budgets",

    // Categories modal
    "categories-titre":       "🏷️ Manage categories",
    "ph-cat-new":             "New category…",
    "btn-cat-add":            "➕ Add",
    "cat-note":               "⚠️ Default categories cannot be deleted.",

    // Alerts & confirmations
    "alert-desc":             "Please enter a description.",
    "alert-montant":          "Please enter a positive amount.",
    "alert-date":             "Please enter a date.",
    "confirm-supprimer":      "Delete",
    "confirm-supprimer-fin":  "?",
    "alert-no-tx-mois":       "No transactions this month.",
    "alert-no-tx-export":     "No transactions to export.",
    "confirm-import":         "transaction(s)?\n⚠️ This will replace all your current data.",
    "alert-import-ok":        "transaction(s) imported successfully.",
    "alert-import-err":       "Import error: ",
    "alert-rappel-cocher":    "Please check at least one expense.",
    "confirm-retirer-rec":    "Remove recurrence from checked expenses? (they will no longer be reminded)",
    "alert-cat-existe":       "This category already exists.",
    "confirm-suppr-cat":      "Delete category",
    "alert-no-depense":       "No expenses this month.",

    // Noscript
    "noscript-msg":           "Cashew$ requires JavaScript to work. Please enable it in your browser.",
  }
};
