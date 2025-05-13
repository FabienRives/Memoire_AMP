document.addEventListener('DOMContentLoaded', function () {
  const overlay = document.getElementById('loading-overlay');
  const map = L.map('map', { center: [43.3, 5.4], zoom: 10 }); // Centré sur Marseille
  
  // Liste des communes et leurs géométries
  let communesList = [];

  // Définition des fonds de carte
  const basemaps = {
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }),
    topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors, SRTM | Style: &copy; OpenTopoMap (CC-BY-SA)'
    }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community'
    })
  };

  // Ajout du fond de carte OpenStreetMap par défaut
  basemaps.osm.addTo(map);
  
  // Gestionnaire d'événements pour les boutons radio de fond de carte
  document.querySelectorAll('input[name="basemap"]').forEach(input => {
    input.addEventListener('change', function() {
      // Suppression de tous les fonds de carte
      Object.values(basemaps).forEach(layer => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
      
      // Ajout du fond de carte sélectionné
      basemaps[this.value].addTo(map);
    });
  });

  // Fonction réutilisable pour ajouter des popups à n'importe quelle couche
  function addPopupToLayer(layer) {
    return layer.options.onEachFeature = function(feature, layer) {
      if (feature.properties) {
        // Créer le contenu HTML
        let content = '<div class="popup">';
        
        // Ajouter un titre si disponible
        if (feature.properties.nom || feature.properties.name || feature.properties.NOM || feature.properties.NAME) {
          content += `<h4>${feature.properties.nom || feature.properties.name || feature.properties.NOM || feature.properties.NAME}</h4>`;
        }
        
        // Ajouter toutes les propriétés
        content += '<table>';
        for (const prop in feature.properties) {
          // Ignorer les propriétés techniques
          if (!prop.startsWith('_') && prop !== 'centroid') {
            content += `<tr><th>${prop}</th><td>${feature.properties[prop]}</td></tr>`;
          }
        }
        content += '</table></div>';
        
        // Ajouter la popup
        layer.bindPopup(content, {
          maxHeight: 300,
          maxWidth: 300
        });
      }
    };
  }
  
  // Préparation des couches GeoJSON avec style par défaut et popups
  const layers = {
    epci:     L.geoJSON(null, { 
      style: { color: '#0078ff', weight: 2 },
      onEachFeature: function(feature, layer) {
        if (feature.properties) {
          // Créer le contenu HTML
          let content = '<div class="popup">';
          if (feature.properties.nom || feature.properties.NOM) {
            content += `<h4>${feature.properties.nom || feature.properties.NOM}</h4>`;
          }
          content += '<table>';
          for (const prop in feature.properties) {
            content += `<tr><th>${prop}</th><td>${feature.properties[prop]}</td></tr>`;
          }
          content += '</table></div>';
          layer.bindPopup(content, { maxHeight: 300, maxWidth: 300 });
        }
      }
    }),
    communes: L.geoJSON(null, { 
      style: { color: '#28a745', weight: 2 },
      onEachFeature: function(feature, layer) {
        if (feature.properties) {
          let content = '<div class="popup">';
          if (feature.properties.nom || feature.properties.NOM) {
            content += `<h4>${feature.properties.nom || feature.properties.NOM}</h4>`;
          }
          content += '<table>';
          for (const prop in feature.properties) {
            content += `<tr><th>${prop}</th><td>${feature.properties[prop]}</td></tr>`;
          }
          content += '</table></div>';
          layer.bindPopup(content, { maxHeight: 300, maxWidth: 300 });
        }
      }
    }),
    moraux: L.geoJSON(null, {
      style: { color: '#000000', weight: 2 },
      onEachFeature: function(feature, layer) {
        if (feature.properties) {
          // Champs et couleurs pour le diagramme secteur
          const fields = [
            'PourcentageComm',
            'PourcentageCopro',
            'PourcentageDepart',
            'PourcentageHLM',
            'PourcentagePMNR',
            'PourcentageRegion',
            'PourcentageSEM',
            'PourcentageEP',
            'PourcentageEtat',
            'PourcentageAssocies',
          ];
          
          // Correspondance entre les champs de pourcentage et de surface
          const surfaceFields = [
            'SurfComm',
            'SurfCopro',
            'SurfDepart',
            'SurfHLM',
            'SurfPMNR',
            'SurfRegion',
            'SurfSEM',
            'SurfEP',
            'SurfEtat',
            'SurfAssocies',
          ];
          const labels = [
            'Commune',
            'Copropriétaires',
            'Département',
            'Office HLM',
            'Personnes morales non remarquables',
            'Région',
            'Société d\'économie mixte',
            'Établissements publics',
            'État',
            'Associés',
          ];
          const colors = [
            '#F28E2B', // orange Commune
            '#9C755F', // brun Copropriétaires
            '#76B7B2', // turquoise Département
            '#EDC948', // jaune doré Office HLM
            '#4E79A7', // bleu PMNR (Personnes morales non remarquables)
            '#B07AA1', // violet Région
            '#FF9DA7', // rose clair SEM
            '#59A14F', // vert Établissements publics
            '#E15759', // rouge État
            '#BAB0AC', // gris clair Associés
          ];
          // Extraire les valeurs (en pourcentage) et de surface, puis préparer tri
          let rawData = fields.map((f, i) => ({
            value: Number(feature.properties[f]) || 0,
            label: labels[i],
            color: colors[i],
            surface: Number(feature.properties[surfaceFields[i]]) || 0
          }));
          // Trier par ordre décroissant selon la surface
          rawData.sort((a, b) => b.surface - a.surface);
          // Décomposer pour Chart.js
          const data = rawData.map(d => d.value);
          const sortedLabels = rawData.map(d => d.label);
          const sortedColors = rawData.map(d => d.color);
          // Générer un ID unique pour le canvas
          const canvasId = 'pie-moraux-' + (feature.properties.code_insee || feature.properties.insee || Math.random().toString(36).substr(2, 6));
          let content = '<div class="popup">';
          if (feature.properties.nom || feature.properties.NOM) {
            content += `<h4>${feature.properties.nom || feature.properties.NOM}</h4>`;
          }
          content += '<table>';
          if (feature.properties.NOM_M) {
            content += `<tr><th>NOM_M</th><td>${feature.properties.NOM_M}</td></tr>`;
          }
          if (feature.properties.INSEE_COM) {
            content += `<tr><th>INSEE_COM</th><td>${feature.properties.INSEE_COM}</td></tr>`;
          }
          content += '</table>';
          content += `<div style=\"margin-top:10px;text-align:center\"><canvas id=\"${canvasId}\" width=\"450\" height=\"350\"></canvas></div>`;
          content += `<div style=\"text-align:center;margin-top:8px;\"><button id=\"open-diag-${canvasId}\" style=\"margin:0 auto;display:inline-block;padding:6px 16px;font-size:15px;cursor:pointer;\">Ouvrir le diagramme dans une nouvelle fenêtre</button></div>`;
          content += '</div>';
          layer.bindPopup(content, {
            maxHeight: 600, maxWidth: 500,
            autoPan: true
          });
          layer.on('popupopen', function() {
            // Crée le diagramme secteur Chart.js
            const ctx = document.getElementById(canvasId).getContext('2d');
            new Chart(ctx, {
              type: 'pie',
              data: {
                labels: sortedLabels,
                datasets: [{
                  data: data,
                  backgroundColor: sortedColors,
                  borderWidth: 1
                }]
              },
              options: {
                responsive: false,
                plugins: {
                  legend: { position: 'bottom', labels: { font: { size: 12 } } },
                  title: { display: true, text: 'Répartition de la surface appartenant à des propriétaires moraux (%)', font: { size: 15 } }
                }
              }
            });
            // Ajout du listener sur le bouton d'ouverture
            const btn = document.getElementById('open-diag-' + canvasId);
            if (btn) {
              btn.addEventListener('click', function() {
                const win = window.open('', '_blank', 'width=600,height=800');
                win.document.write(`
                  <html><head>
                  <title>Diagramme secteur - Répartition de la surface appartenant à des propriétaires moraux</title>
                  <script src=\"https://cdn.jsdelivr.net/npm/chart.js\"></script>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 30px; }
                    h2 { text-align:center; }
                    .diag-container { text-align:center; margin-bottom:30px; }
                    table { margin: 0 auto 30px auto; border-collapse: collapse; }
                    th,td { border:1px solid #ccc; padding:8px 16px; }
                    th { background:#f0f0f0; }
                  </style>
                  </head><body>
                  <h2>Répartition de la surface appartenant à des propriétaires moraux (%)</h2>
                  <div class=\"diag-container\"><canvas id=\"diag-canvas\" width=\"500\" height=\"500\"></canvas></div>
                  <table><thead><tr><th>Catégorie</th><th>Surface (ha)</th><th>Pourcentage de surface (%)</th></tr></thead><tbody>
                  ${rawData.map(d => `<tr><td>${d.label}</td><td>${d.surface.toLocaleString('fr-FR')}</td><td>${d.value}</td></tr>`).join('')}
                  </tbody></table>
                  <script>
                    new Chart(document.getElementById('diag-canvas').getContext('2d'), {
                      type: 'pie',
                      data: {
                        labels: ${JSON.stringify(sortedLabels)},
                        datasets: [{
                          data: ${JSON.stringify(data)},
                          backgroundColor: ${JSON.stringify(sortedColors)},
                          borderWidth: 1
                        }]
                      },
                      options: {
                        responsive: false,
                        plugins: {
                          legend: { position: 'bottom', labels: { font: { size: 15 } } },
                          title: { display: false }
                        }
                      }
                    });
                  <\/script>
                  </body></html>
                `);
                win.document.close();
              });
            }
          });
          layer.bindPopup(content, {
            maxHeight: 600, maxWidth: 500,
            autoPan: true
          });
          layer.on('popupopen', function() {
            // Crée le diagramme secteur Chart.js
            const ctx = document.getElementById(canvasId).getContext('2d');
            new Chart(ctx, {
              type: 'pie',
              data: {
                labels: sortedLabels,
                datasets: [{
                  data: data,
                  backgroundColor: sortedColors,
                  borderWidth: 1
                }]
              },
              options: {
                responsive: false,
                plugins: {
                  legend: { position: 'bottom', labels: { font: { size: 12 } } },
                  title: { display: true, text: 'Répartition de la surface appartenant à des propriétaires moraux (%)', font: { size: 15 } }
                }
              }
            });
          });
        }
      }
    }),
    // Pour simplifier l'accès aux couches spéciales
    getCluster: function() { return window.clustersLayer; },
    getPolygons: function() { return window.polygonsLayer; }
  };

  // Variables globales
  let gisementData = null;
  window.clustersLayer = null;     // Couche pour les cercles (vue éloignée)
  window.polygonsLayer = null;   // Couche pour les vraies géométries (vue rapprochée)
  let currentZoom = map.getZoom();
  
  // Log de débogage avec style
  function log(title, ...args) {
    console.log(`%c${title}`, 'background: #222; color: #bada55; padding: 3px;', ...args);
  }

  // Fonction de recherche de communes
  function setupCommuneSearch() {
    const searchInput = document.getElementById('commune-search');
    const searchResults = document.getElementById('search-results');
    const searchBox = document.getElementById('search-box');
    let debounceTimer;

    // Animation lors du focus sur le champ de recherche
    searchInput.addEventListener('focus', function() {
      searchBox.classList.add('focused');
      if (this.value.trim().length >= 2) {
        updateSearchResults(this.value.trim());
      }
    });

    // Filtrer les communes avec debounce pour améliorer les performances
    searchInput.addEventListener('input', function() {
      const searchText = this.value.trim();
      
      // Effacer le timer existant
      clearTimeout(debounceTimer);
      
      if (searchText.length < 2) {
        searchResults.style.display = 'none';
        return;
      }
      
      // Attendez un court délai avant de mettre à jour les résultats (debounce)
      debounceTimer = setTimeout(() => {
        updateSearchResults(searchText);
      }, 150);
    });
    
    // Fonction pour mettre à jour les résultats de recherche
    function updateSearchResults(searchText) {
      const searchLower = searchText.toLowerCase();
      
      // Tri des communes : d'abord les correspondances exactes au début, puis triées par ordre alphabétique
      const exactMatches = [];
      const partialMatches = [];
      
      communesList.forEach(commune => {
        const nom = commune.nom.toLowerCase();
        if (nom === searchLower) {
          exactMatches.push(commune);
        } else if (nom.includes(searchLower)) {
          partialMatches.push(commune);
        }
      });
      
      // Combiner et limiter les résultats
      const matches = [...exactMatches, ...partialMatches].slice(0, 10);
      
      // Afficher les résultats
      searchResults.innerHTML = '';
      if (matches.length > 0) {
        matches.forEach(commune => {
          const div = document.createElement('div');
          
          // Mettre en surbrillance la partie correspondante
          const nomLower = commune.nom.toLowerCase();
          const index = nomLower.indexOf(searchLower);
          if (index >= 0) {
            const before = commune.nom.substring(0, index);
            const match = commune.nom.substring(index, index + searchLower.length);
            const after = commune.nom.substring(index + searchLower.length);
            div.innerHTML = `${before}<strong>${match}</strong>${after}`;
          } else {
            div.textContent = commune.nom;
          }
          
          div.addEventListener('click', function() {
            // Zoom sur la commune sélectionnée avec une animation fluide
            if (commune.bounds) {
              map.flyToBounds(commune.bounds, {
                padding: [50, 50],
                duration: 1.5
              });
            }
            searchInput.value = commune.nom;
            searchResults.style.display = 'none';
            searchInput.blur(); // Retirer le focus du champ de recherche
          });
          searchResults.appendChild(div);
        });
        searchResults.style.display = 'block';
      } else {
        // Afficher un message si aucun résultat n'est trouvé
        const noResult = document.createElement('div');
        noResult.textContent = 'Aucune commune trouvée';
        noResult.className = 'no-results';
        searchResults.appendChild(noResult);
        searchResults.style.display = 'block';
      }
    }
    
    // Cacher les résultats quand on clique en dehors
    document.addEventListener('click', function(e) {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
        searchBox.classList.remove('focused');
      }
    });
    
    // Placer le curseur à la fin du texte lors du focus
    searchInput.addEventListener('focus', function() {
      const length = this.value.length;
      this.setSelectionRange(length, length);
    });
    
    // Navigation au clavier améliorée
    searchInput.addEventListener('keydown', function(e) {
      if (searchResults.style.display === 'block') {
        const items = searchResults.querySelectorAll('div:not(.no-results)');
        if (items.length === 0) return;
        
        let activeItem = searchResults.querySelector('.active');
        let activeIndex = -1;
        
        if (activeItem) {
          activeIndex = Array.from(items).indexOf(activeItem);
        }
        
        // Touche flèche bas
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (activeItem) activeItem.classList.remove('active');
          activeIndex = (activeIndex + 1) % items.length;
          items[activeIndex].classList.add('active');
          items[activeIndex].scrollIntoView({block: 'nearest', behavior: 'smooth'});
        }
        
        // Touche flèche haut
        else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (activeItem) activeItem.classList.remove('active');
          activeIndex = (activeIndex - 1 + items.length) % items.length;
          items[activeIndex].classList.add('active');
          items[activeIndex].scrollIntoView({block: 'nearest', behavior: 'smooth'});
        }
        
        // Touche Entrée
        else if (e.key === 'Enter') {
          e.preventDefault();
          if (activeItem) {
            activeItem.click();
          } else if (items.length > 0) {
            items[0].click();
          }
        }
        
        // Touche Echap
        else if (e.key === 'Escape') {
          searchResults.style.display = 'none';
          searchBox.classList.remove('focused');
          searchInput.blur();
        }
      }
    });
  }

  // Standardiser toutes les popups pour avoir un style cohérent
  function standardizeAllPopups() {
    // On ne modifie que les couches standard, pas celle des moraux qui a des diagrammes spécifiques
    // et pas les clusters qui ont une structure différente
    const standardLayers = ['epci', 'communes', 'gisement'];
    
    for (const layerName of standardLayers) {
      if (layers[layerName] && layers[layerName] instanceof L.GeoJSON) {
        const layer = layers[layerName];
        
        // Conserver la référence à la fonction originale si elle existe
        const originalOnEachFeature = layer.options.onEachFeature;
        
        // Définir la nouvelle fonction qui ajoute juste le style de la popup
        layer.options.onEachFeature = function(feature, layer) {
          if (feature.properties) {
            // Créer le contenu HTML uniforme
            let content = '<div class="popup">';
            
            // Ajouter un titre si disponible
            const name = feature.properties.nom || feature.properties.name || 
                      feature.properties.NOM || feature.properties.NAME || 
                      feature.properties.NOM_M;
            
            if (name) {
              content += `<h4>${name}</h4>`;
            } else if (layerName) {
              // Utiliser le nom de la couche si pas de nom dans les propriétés
              content += `<h4>${layerName.charAt(0).toUpperCase() + layerName.slice(1)}</h4>`;
            }
            
            // Ajouter toutes les propriétés dans un tableau
            content += '<table>';
            for (const prop in feature.properties) {
              // Ignorer les propriétés techniques
              if (!prop.startsWith('_') && prop !== 'centroid') {
                content += `<tr><th>${prop}</th><td>${feature.properties[prop]}</td></tr>`;
              }
            }
            content += '</table></div>';
            
            // Ajouter la popup
            layer.bindPopup(content, {
              maxHeight: 300,
              maxWidth: 300
            });
          }
        };
        
        // Réappliquer onEachFeature à toutes les features existantes
        if (layer.getLayers && layer.getLayers().length > 0) {
          layer.getLayers().forEach(l => {
            if (l.feature && l.feature.properties) {
              layer.options.onEachFeature(l.feature, l);
            }
          });
        }
      }
    }
    
    // Standardiser les popups pour les clusters standards uniquement
    if (window.clustersLayer && window.clustersLayer.getLayers) {
      window.clustersLayer.getLayers().forEach(circle => {
        if (!circle._customDiagram) { // Ne modifie pas les cercles avec des diagrammes personnalisés
          circle.off('click');
          circle.on('click', function() {
            const count = circle.count || 'plusieurs';
            const popupContent = `
              <div class="popup">
                <h4>Groupe d'entités</h4>
                <table>
                  <tr><th>Nombre d'entités</th><td>${count}</td></tr>
                  <tr><th>Action</th><td>Zoomez davantage pour voir les entités individuelles</td></tr>
                </table>
              </div>
            `;
            
            L.popup({ maxHeight: 300, maxWidth: 300 })
              .setLatLng(circle.getLatLng())
              .setContent(popupContent)
              .openOn(map);
          });
        }
      });
    }
    
    console.log('Popups standardisées pour les couches de base');
  }
  
  // Chargement des données GeoJSON
  const p1 = fetch('GisementFoncier.geojson')
  .then(r => r.json())
  .then(data => {
    gisementData = data;
    log('GisementFoncier chargé:', data.features.length, 'features');
    return 'OK';
  })
  .catch(err => log('Erreur chargement GisementFoncier:', err));
  
  // Chargement du fichier des communes
  const p2 = fetch('Communes_AMP.geojson')
  .then(r => r.json())
  .then(data => {
    log('Communes_AMP chargé:', data.features.length, 'communes');
    
    // Ajouter les données à la couche des communes
    layers.communes.addData(data);
    
    // Extraire et stocker les noms et géométries des communes
    data.features.forEach(feature => {
      if (feature.properties && feature.properties.NOM_M) {
        // Calculer les limites (bounds) de la commune pour le zoom
        const layer = L.geoJSON(feature);
        const bounds = layer.getBounds();
        
        communesList.push({
          nom: feature.properties.NOM_M,
          bounds: bounds,
          feature: feature
        });
      }
    });
    
    // Trier les communes par ordre alphabétique
    communesList.sort((a, b) => a.nom.localeCompare(b.nom));
    log('Liste des communes créée:', communesList.length, 'communes');
    
    // Initialiser la recherche de communes
    setupCommuneSearch();
    
    return 'OK';
  })
  .catch(err => log('Erreur chargement Communes_AMP:', err));

  // Chargement des autres couches
  const p3 = fetch('EPCI_AMP.geojson')
    .then(r => r.json())
    .then(data => layers.epci.addData(data));

  const p4 = fetch('ComPourcPropMoraux.geojson')
    .then(r => r.json())
    .then(data => layers.moraux.addData(data));

  // On attend que toutes les données soient chargées
  Promise.all([p1, p2, p3, p4]).then(() => {
    // Calculer les centroïdes des features pour optimiser les performances
    function calculateCentroids() {
      log('Calcul des centroïdes', 'Démarrage...');
      if (!gisementData || !gisementData.features) return;
      
      gisementData.features.forEach(feature => {
        let lat, lng;
        
        if (feature.geometry.type === 'Point') {
          [lng, lat] = feature.geometry.coordinates;
        } else if (feature.geometry.type === 'Polygon') {
          const coords = feature.geometry.coordinates[0];
          lng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
          lat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
        } else if (feature.geometry.type === 'MultiPolygon') {
          const coords = feature.geometry.coordinates[0][0];
          lng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
          lat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
        }
        
        feature.properties.centroid = [lat, lng]; // Stocker les coordonnées du centroide
      });
      log('Calcul des centroïdes', 'Terminé');
    }
    
    // Nettoyer les couches gisement existantes
    function cleanLayers() {
      // Supprimer l'ancienne couche de clusters si elle existe
      if (window.clustersLayer) {
        if (map.hasLayer(window.clustersLayer)) {
          map.removeLayer(window.clustersLayer);
        }
        window.clustersLayer = null;
      }
      
      // Supprimer l'ancienne couche de polygones si elle existe
      if (window.polygonsLayer) {
        if (map.hasLayer(window.polygonsLayer)) {
          map.removeLayer(window.polygonsLayer);
        }
        window.polygonsLayer = null;
      }
    }
    
    // Afficher les polygones avec leur géométrie réelle
    function displayPolygons(features) {
      cleanLayers(); // Nettoyer les couches existantes
      
      log('MODE POLYGONES', `Affichage de ${features.length} polygones`);
      
      // Montrer TOUTES les entités sans limitation
      log('INFO', `Affichage de TOUTES les ${features.length} entités visibles`);
      // Aucune limitation
      
      // Créer la couche GeoJSON avec la géométrie complète
      const color = document.getElementById('color-gisement').value;
      window.polygonsLayer = L.geoJSON({ 
        type: 'FeatureCollection', 
        features: features 
      }, {
        style: function() {
          return {
            color: color,
            fillColor: color,
            weight: currentZoom > 14 ? 1 : 2,
            opacity: 0.8,
            fillOpacity: 0.3
          };
        },
        // Rendre chaque entité cliquable
        onEachFeature: function(feature, layer) {
          if (feature.properties) {
            // Créer le contenu HTML
            let content = '<div class="popup">';
            
            // Ajouter un titre si disponible
            if (feature.properties.nom || feature.properties.name) {
              content += `<h4>${feature.properties.nom || feature.properties.name}</h4>`;
            }
            
            // Ajouter toutes les propriétés
            content += '<table>';
            for (const prop in feature.properties) {
              // Ignorer les propriétés techniques
              if (!prop.startsWith('_') && prop !== 'centroid') {
                content += `<tr><th>${prop}</th><td>${feature.properties[prop]}</td></tr>`;
              }
            }
            content += '</table></div>';
            
            // Ajouter la popup
            layer.bindPopup(content, {
              maxHeight: 300,
              maxWidth: 300
            });
          }
        }
      });
      
      // Ajouter la couche à la carte
      window.polygonsLayer.addTo(map);
    }
    
    // Afficher les clusters (points) pour les vues éloignées
    function displayClusters(features) {
      cleanLayers(); // Nettoyer les couches existantes
      
      log('MODE CLUSTERS', `Clustering de ${features.length} éléments`);
      
      // Créer une nouvelle couche pour les clusters
      window.clustersLayer = L.layerGroup();
      
      // Définir la taille de la grille en fonction du zoom
      const gridSize = currentZoom < 6 ? 50 : 
                      currentZoom < 8 ? 100 : 
                      currentZoom < 10 ? 200 : 300;
      
      // Regrouper les entités par position sur la grille
      const clusters = {};
      features.forEach(feature => {
        if (!feature.properties.centroid) return;
        
        const [lat, lng] = feature.properties.centroid;
        const gridLat = Math.floor(lat * gridSize) / gridSize;
        const gridLng = Math.floor(lng * gridSize) / gridSize;
        const key = `${gridLat},${gridLng}`;
        
        if (!clusters[key]) {
          clusters[key] = {
            lat: 0,
            lng: 0,
            count: 0
          };
        }
        
        clusters[key].lat += lat;
        clusters[key].lng += lng;
        clusters[key].count++;
      });
      
      // Créer un marqueur pour chaque cluster
      const color = document.getElementById('color-gisement').value;
      Object.values(clusters).forEach(cluster => {
        if (cluster.count > 0) {
          const position = [cluster.lat / cluster.count, cluster.lng / cluster.count];
          
          // Taille proportionnelle au nombre d'entités, mais plus petite qu'avant
          const radius = Math.min(20, Math.max(5, 3 + Math.sqrt(cluster.count)));
          
          const circle = L.circleMarker(position, {
            radius: radius,
            color: color,
            fillColor: color,
            weight: 1,
            opacity: 0.9,
            fillOpacity: 0.6
          });
          
          // Infobulle au survol
          circle.bindTooltip(`${cluster.count} entités`, { 
            permanent: false, 
            direction: 'top' 
          });
          
          // Rendre le cluster cliquable
          circle.on('click', function() {
            // Afficher des informations sur le cluster
            const popupContent = `
              <div class="popup">
                <h4>Groupe d'entités</h4>
                <p>Ce groupe contient <strong>${cluster.count}</strong> entités.</p>
                <p>Zoomez davantage pour voir les entités individuelles.</p>
              </div>
            `;
            
            L.popup({ maxHeight: 300, maxWidth: 300 })
              .setLatLng(position)
              .setContent(popupContent)
              .openOn(map);
          });
          
          window.clustersLayer.addLayer(circle);
        }
      });
      
      // Ajouter la couche à la carte
      window.clustersLayer.addTo(map);
    }
    
    // Fonction principale pour décider quel mode d'affichage utiliser
    function updateGisementLayer() {
      if (!gisementData || !gisementData.features) {
        log('ERREUR', 'Aucune donnée GeoJSON disponible');
        return;
      }
      
      // Vérifier si la couche est active
      const checkboxGisement = document.getElementById('layer-gisement');
      if (!checkboxGisement || !checkboxGisement.checked) {
        cleanLayers();
        return;
      }
      
      // Filtrer les entités visibles dans la vue actuelle
      const bounds = map.getBounds();
      const visibleFeatures = gisementData.features.filter(feature => {
        const centroid = feature.properties.centroid;
        return centroid && bounds.contains(centroid);
      });
      
      // Calculer le pourcentage d'entités visibles
      const totalFeatures = gisementData.features.length;
      const percentVisible = (visibleFeatures.length / totalFeatures) * 100;
      
      log('Statistiques', 
          `Zoom: ${currentZoom}`, 
          `Visibles: ${visibleFeatures.length}/${totalFeatures}`, 
          `${percentVisible.toFixed(1)}%`);
      
      // Décider du mode d'affichage en fonction du pourcentage visible et du zoom
      // Modifier la logique pour que les polygones s'affichent à TOUS les niveaux de zoom élevés
      // Mode polygones si zoom > 25 (ZOOM TRÈS ÉLEVÉ) OU peu d'entités visibles (<8%)
      if (currentZoom > 25 || percentVisible < 8) {
        log('Décision', 'FORCE MODE POLYGONES', `Zoom ${currentZoom} ou ${percentVisible.toFixed(1)}% visible`);
        displayPolygons(visibleFeatures);
      } else {
        log('Décision', 'MODE CLUSTERS', `Zoom trop faible ${currentZoom}`);
        displayClusters(visibleFeatures);
      }
    }

    // Calculer les centroïdes une seule fois au chargement
    calculateCentroids();
    
    // Fonction pour nettoyer les couches accessibles dans tout le code
    window.cleanLayers = cleanLayers;
    
    // Fonction pour mettre à jour la couche gisement accessible dans tout le code
    window.updateGisementLayer = updateGisementLayer;
    
    // Ajoute la couche Communes AMP par défaut
    layers.communes.addTo(map);

    // Vérifie si les autres couches sont cochées et les ajoute si nécessaire
    const epciCheckbox = document.getElementById('layer-epci');
    if (epciCheckbox && epciCheckbox.checked) {
      layers.epci.addTo(map);
    }
    
    const gisementCheckbox = document.getElementById('layer-gisement');
    if (gisementCheckbox && gisementCheckbox.checked) {
      updateGisementLayer();
    }

    // Ajuste l'emprise sur toutes les couches chargées (en utilisant les données brutes pour gisement)
    let allBounds = layers.epci.getBounds().extend(layers.communes.getBounds());
    if (gisementData && gisementData.features.length > 0) {
      let gisementBounds = L.geoJSON(gisementData).getBounds();
      allBounds = allBounds.extend(gisementBounds);
    }

    // On prépare les listeners mais on ne les active qu'après fitBounds
    let listenersActive = false;
    const moveZoomHandler = () => {
      if (listenersActive && document.getElementById('layer-gisement').checked) {
        window.updateGisementLayer();
      }
    };
    map.on('moveend zoomend', moveZoomHandler);

    // fitBounds sans déclencher updateGisementLayer
    listenersActive = false;
    map.fitBounds(allBounds);
    
    // Activer à nouveau les écouteurs d'événements et terminer l'initialisation
    setTimeout(() => {
      listenersActive = true;
      
      // Standardiser toutes les popups une fois que toutes les couches sont chargées
      standardizeAllPopups();
      
      // Masquer l'overlay de chargement
      overlay.classList.add('hidden');
      setTimeout(() => overlay.style.display = 'none', 500);
      
      log('Application chargée', 'Toutes les données ont été chargées avec succès');
    }, 500);
    
    // Ajouter des styles CSS pour les popups
    const style = document.createElement('style');
    style.textContent = `
      .popup h4 {
        margin: 0 0 8px 0;
        color: #ff7800;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
      }
      .popup table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 5px;
      }
      .popup th, .popup td {
        padding: 3px;
        text-align: left;
        border-bottom: 1px solid #f0f0f0;
        font-size: 12px;
      }
      .popup th {
        width: 40%;
        color: #666;
        font-weight: bold;
      }
      .popup p {
        margin: 5px 0;
        font-size: 13px;
      }
      .leaflet-popup-content {
        margin: 10px;
      }
    `;
    document.head.appendChild(style);
  });

  // Gestion de la visibilité via checkbox
  // Gérer les changements de couches (checkboxes)
  document.querySelectorAll('#layer-list input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', e => {
      const name = e.target.id.replace('layer-', '');
      
      if (name === 'gisement') {
        if (e.target.checked) {
          // Réactiver la couche gisement
          window.updateGisementLayer();
        } else {
          // Désactiver les couches gisement
          window.cleanLayers();
        }
      } else {
        // Autres couches (EPCI, communes, moraux...)
        if (e.target.checked) {
          layers[name].addTo(map);
        } else {
          map.removeLayer(layers[name]);
        }
      }
    });
  });

  // Gestion du color picker pour la couche moraux
  const colorMoraux = document.getElementById('color-moraux');
  if (colorMoraux) {
    colorMoraux.addEventListener('input', function(e) {
      layers.moraux.setStyle({ color: e.target.value });
    });
  }

  // Gérer les changements de couleur
  document.getElementById('color-gisement').addEventListener('input', function() {
    // Si la couche gisement est active, la mettre à jour avec la nouvelle couleur
    if (document.getElementById('layer-gisement').checked) {
      window.updateGisementLayer();
    }
  });

  document.getElementById('color-epci').addEventListener('input', function(e) {
    layers.epci.setStyle({ color: e.target.value });
  });

  document.getElementById('color-communes').addEventListener('input', function(e) {
    layers.communes.setStyle({ color: e.target.value });
  });

  // Rendre la liste triable et gérer l'ordre z-index
  $('#layer-list').sortable({
    handle: '.drag-handle',
    helper: 'clone',
    scroll: false,
    animation: 0,
    start: function(e, ui) {
      ui.item.addClass('dragging');
    },
    stop: function(e, ui) {
      ui.item.removeClass('dragging');
    },
    update() {
      const order = $(this).sortable('toArray', { attribute: 'data-layer' }).reverse();
      order.forEach(name => {
        if (map.hasLayer(layers[name])) {
          layers[name].bringToFront();
        }
      });
    }
  });

  // Gestion du bouton du footer
  const footerToggle = document.getElementById('footer-toggle');
  const footer = document.getElementById('footer');
  
  if (footerToggle && footer) {
    footerToggle.addEventListener('click', function() {
      footer.classList.toggle('collapsed');
      footerToggle.classList.toggle('raised'); // Simplement basculer la classe raised
    });

    // S'assurer que le bouton a la bonne classe au chargement
    if (footer.classList.contains('collapsed')) {
      footerToggle.classList.remove('raised');
    } else {
      footerToggle.classList.add('raised');
    }
  }
});
