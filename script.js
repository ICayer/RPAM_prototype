import { carte } from "./carte.js";
import { arbre } from "./arbre.js";

// Sélecteurs DOM
const toggleBtn = document.getElementById("toggle-view");
const mapSection = document.getElementById("map-section");
const treeSection = document.getElementById("tree-section");

// --- Initialisation selon largeur d’écran ---
if (window.innerWidth >= 768) {
  // Desktop : afficher les deux
  carte();
  arbre();
  toggleBtn.style.display = "none"; // pas besoin de bascule
} else {
  // Mobile : afficher uniquement carte par défaut
  mapSection.style.display = "block";
  treeSection.style.display = "none";
  toggleBtn.style.display = "inline-block";
  carte();
  toggleBtn.textContent = "Basculer vers Arbre";
}

// --- Toggle carte <-> arbre ---
let showingMap = true;

toggleBtn.addEventListener("click", () => {
  if (showingMap) {
    // -> Passer à ARBRE
    mapSection.style.display = "none";
    treeSection.style.display = "block";

    // si aucun arbre présent -> lancer arbre()
    if (!treeSection.querySelector("svg")) {
      arbre();
    }

    toggleBtn.textContent = "Basculer vers Carte";
  } else {
    // -> Passer à CARTE
    treeSection.style.display = "none";
    mapSection.style.display = "block";

    // si carte déjà initialisée, rien à faire (sinon relancer)
    if (!mapSection.querySelector(".leaflet-container")) {
      carte();
    }

    toggleBtn.textContent = "Basculer vers Arbre";
  }
  showingMap = !showingMap;
});

// --- Gestion responsive au resize ---
window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) {
    // Mode desktop large : montrer les deux
    mapSection.style.display = "block";
    treeSection.style.display = "block";
    toggleBtn.style.display = "none";

    if (!mapSection.querySelector(".leaflet-container")) {
      carte();
    }
    if (!treeSection.querySelector("svg")) {
      arbre();
    }
  } else {
    // Mode mobile : montrer seulement la section active
    toggleBtn.style.display = "inline-block";

    if (showingMap) {
      mapSection.style.display = "block";
      treeSection.style.display = "none";
      toggleBtn.textContent = "Basculer vers Arbre";
    } else {
      mapSection.style.display = "none";
      treeSection.style.display = "block";
      toggleBtn.textContent = "Basculer vers Carte";

      // relancer arbre si effacé au resize
      if (!treeSection.querySelector("svg")) {
        arbre();
      }
    }
  }
});
