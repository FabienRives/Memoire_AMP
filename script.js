document.addEventListener('DOMContentLoaded', function () {
  const overlay = document.getElementById('loading-overlay');
  const map = L.map('map', { center: [43.3, 5.4], zoom: 10 }); // Centré sur Marseille

  // Fond de carte OSM
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

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

  // Chargement des données GeoJSON
  // Chargement des données GeoJSON
  const p1 = fetch('GisementFoncier.geojson')
    .then(r => r.json()).then(data => {
      log('GeoJSON gisement chargé', `${data.features.length} entités`);
      gisementData = data;
    });
  const p2 = fetch('EPCI_AMP.geojson')
    .then(r => r.json()).then(data => layers.epci.addData(data));
  const p3 = fetch('Communes_AMP.geojson')
    .then(r => r.json()).then(data => layers.communes.addData(data));

  Promise.all([p1, p2, p3]).then(() => {
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
            
            L.popup()
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
    
    // Ajoute la couche EPCI par défaut
    layers.epci.addTo(map);

    // Ajoute la couche gisement si la checkbox est cochée au démarrage
    const gisementCheckbox = document.getElementById('layer-gisement');
    if (gisementCheckbox && gisementCheckbox.checked) {
      updateGisementLayer();
    }

    // Ajuste l’emprise sur toutes les couches chargées (en utilisant les données brutes pour gisement)
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
    setTimeout(() => { listenersActive = true; }, 500); // active après l'animation fitBounds


    // Masquer l’overlay en douceur
    overlay.classList.add('hidden');
    setTimeout(() => overlay.style.display = 'none', 500);
    
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
        // Autres couches (EPCI, communes...)
        if (e.target.checked) {
          layers[name].addTo(map);
        } else {
          map.removeLayer(layers[name]);
        }
      }
    });
  });

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
    update() {
      const order = $(this).sortable('toArray', { attribute: 'data-layer' }).reverse();
      order.forEach(name => {
        if (map.hasLayer(layers[name])) {
          layers[name].bringToFront();
        }
      });
    }
  });

  // Bouton pour réduire/agrandir le menu
  const btn = document.createElement('button');
  btn.className = 'toggle-button';
  btn.innerHTML = '<i class="fas fa-bars"></i>';
  document.body.appendChild(btn);
  btn.addEventListener('click', () => {
    document.getElementById('menu').classList.toggle('collapsed');
  });
});
