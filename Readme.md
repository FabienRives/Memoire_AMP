# Impact des profils de propriétaires fonciers sur l'urbanisation et l'étalement urbain dans la Métropole d'Aix-Marseille-Provence

[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=flat&logo=github)](https://github.com/FabienRives/Memoire_AMP)
[![Application Cartographique](https://img.shields.io/badge/Application-Cartographique_Interactive-blue?style=flat&logo=mapbox)](https://fabienrives.github.io/Memoire_AMP/)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC_BY_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

## 📋 À propos

Cette plateforme de webmapping interactive accompagne le mémoire de Master GEOTER sur l'analyse de la propriété foncière et son impact sur l'urbanisation dans la Métropole d'Aix-Marseille-Provence. L'outil permet d'explorer visuellement les données foncières et de comprendre les dynamiques territoriales à travers différentes couches d'information géographique.

**Auteur :** Fabien RIVES  
**Formation :** Master Géographie, Aménagement, Environnement et Développement - Géomatique et Conduite de Projets Territoriaux  
**Établissement :** Avignon Université - Chaire GIF  
**Année universitaire :** 2024-2025

## 🚀 Démonstration

🌐 **Accéder à l'application :** [https://fabienrives.github.io/Memoire_AMP/](https://fabienrives.github.io/Memoire_AMP/)

## ✨ Fonctionnalités principales

### 🗺️ Cartographie interactive
- **Fonds de carte multiples** : Basculez entre vue standard (OpenStreetMap) et vue satellite (ESRI)
- **Navigation fluide** : Zoom et déplacement intuitifs avec animations
- **Popups informatifs** : Cliquez sur les éléments pour obtenir des informations détaillées

### 📊 Couches de données
1. **Communes AMP** : Limites administratives des 92 communes de la métropole
2. **EPCI AMP** : Limite administrative de la métropole
3. **Zonage PLU** : Zones urbaines (U), à urbaniser (AU), agricoles (A), naturelles (N)
4. **Gisement Foncier** : Parcelles identifiées selon des critères
5. **Propriétaires Moraux** : Répartition par type de propriétaire moraux avec diagrammes interactifs

### 🔍 Recherche intelligente
- Recherche de communes avec auto-complétion
- Navigation rapide vers la commune sélectionnée
- Résultats filtrés en temps réel

### ⚙️ Personnalisation
- Réorganisation des couches par glisser-déposer
- Modification des couleurs d'affichage
- Contrôle de l'opacité pour le zonage PLU

### 📈 Visualisation des données
- Diagrammes circulaires dynamiques pour les propriétaires moraux
- Clustering automatique des parcelles pour les vues éloignées
- Export des visualisations dans de nouvelles fenêtres

## 🛠️ Technologies utilisées

### Langages de programmation
- **HTML** / **CSS** : Structure et styles modernes
- **JavaScript** : Logique applicative et interactions

### Bibliothèques
- **[Leaflet.js](https://leafletjs.com/)** : Cartographie interactive
- **[Chart.js](https://www.chartjs.org/)** : Visualisations graphiques
- **[jQuery](https://jquery.com/)** : Manipulation DOM et AJAX
- **[jQuery UI](https://jqueryui.com/)** : Interface utilisateur
- **[Turf.js](https://turfjs.org/)** : Analyse spatiale côté client
- **[Font Awesome](https://fontawesome.com/)** : Icônes

### Données
- Format **GeoJSON** pour toutes les couches géographiques
- Hébergement sur **GitHub Pages**
- Données open source issues de sources officielles

## 💻 Installation locale

### Prérequis
- Un navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Un serveur web local (optionnel mais recommandé)

### Instructions

1. **Cloner le repository**
```bash
git clone https://github.com/FabienRives/Memoire_AMP.git
cd Memoire_AMP
```

2. **Lancer un serveur local** (plusieurs options)

Option A - Python :
```bash
# Python 3
python -m http.server 8000

Option B - Node.js :
```bash
# Installer http-server globalement
npm install -g http-server

# Lancer le serveur
http-server
```

Option C - Visual Studio Code :
- Installer l'extension "Live Server"
- Clic droit sur `index.html` → "Open with Live Server"

3. **Accéder à l'application**
```
http://localhost:8000
```

## 📁 Structure du projet

```
Memoire_AMP/
│
├── index.html              # Page principale
├── styles.css              # Styles de l'application
├── script.js               # Logique JavaScript
├── README.md               # Documentation
│
├── medias/                 # Ressources multimédia
│   ├── icon.png           # Favicon
│   ├── Logo GIF.png       # Logo Chaire GIF
│   ├── Logo UA.png        # Logo Université Avignon
│   ├── Logo GEOTER.png    # Logo Master GEOTER
│   └── Fabien_RIVES_Memoire.pdf  # Mémoire complet
│
└── *.geojson              # Fichiers de données géographiques
    ├── Communes_AMP.geojson
    ├── EPCI_AMP.geojson
    ├── ZonagePCI.geojson
    ├── GisementFoncier.geojson
    └── ComPourcPropMoraux.geojson
```

## 📊 Sources des données

- **Données cadastrales** : Plan Cadastral Informatisé (PCI)
- **Zonage PLU** : Géoportail de l'Urbanisme (GPU)
- **Limites administratives** : BD TOPO (IGN)
- **Modèle d'Occupation du Sol** : MOS 2017 - Métropole AMP
- **Propriétaires** : Fichiers des parcelles des personnes morales (data.gouv.fr)

## 🎯 Critères du gisement foncier

### Critères d'inclusion
- Zone U ou AU du PLU
- Largeur >  5m
- Surface > 50 m²
- Pente < 15 %

### Critères d'exclusion
- Intersection avec des routes / des voies ferrés
- Voirie cadastrée (indice MERI)
- Parcelles bâties
- Cimetières
- Terrains de sports
- Aérodromes

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Dupliquer le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit vos changements (`git commit -m 'Ajout de fonctionnalité'`)
4. Push sur la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

## 📧 Contact

**Fabien RIVES**  
- GitHub : [@FabienRives](https://github.com/FabienRives)
- Établissement : Avignon Université

## 📄 Licence

Ce projet est distribué sous licence Creative Commons Attribution 4.0 International (CC BY 4.0). Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **Laure CASANOVA ENAULT** - Encadrante de mémoire
- **Rémi DELATTRE** - Co-encadrant
- **Chaire GIF** - Geodata Immobilier Foncier
- **Master GEOTER** - Avignon Université
- La communauté open source pour les outils utilisés

---

<p align="center">
  Développé par Fabien RIVES | 2024-2025
</p>