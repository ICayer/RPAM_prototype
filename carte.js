let map;
let markersData = [];

export function carte() {
  Promise.all([
    d3.text("./data/rpam_tree_id.csv"),
  ]).then(function ([csvData]) {
    const data = d3.csvParse(csvData);

    const cityCoordinates = {
      "Cap-aux-Meules": [47.37831, -61.858386],
      Gesgapegiag: [48.1458, -66.2936],
      "Gaspé": [48.8334, -64.4819],
      Gascons: [48.7639, -65.0181],
      "Saint-Joachim-de-Tourelle": [49.0167, -66.0833],
      Pabok: [48.7, -64.9],
      "Anse-aux-Griffons": [48.9374, -64.3087],
      "Les Méchins": [48.999, -66.981],
      "Grosse-Île": [47.6167, -61.75],
      "Port-Daniel": [48.1833, -64.9833],
      "Mont-Louis": [49.2333, -65.8],
      "Grande-Rivière": [48.3833, -64.5],
      "Sainte-Thérèse-de-Gaspé": [48.4087, -64.4181],
      "Carleton-sur-Mer": [48.1, -66.1167],
      Carleton: [48.1, -66.1167],
      "Blanc-Sablon": [51.4167, -57.15],
      "Havre-aux-Maisons": [47.4167, -61.7667],
      "Cascapédia-St-Jules": [48.1667, -66.4],
      Chandler: [48.35, -64.6833],
      Fatima: [47.4167, -61.8333],
      "Saint-Godefroi": [48.0833, -65.9333],
      "Cap d'Espoir": [48.4333, -64.3167],
      Listuguj: [48.0, -66.2333],
      "Saint-Georges-de-Malbaie": [48.6167, -64.8167],
      "Saint-Omer": [48.0667, -65.9667],
      "Sainte-Anne-des-Monts": [49.124, -66.4924],
      "New Richmond": [48.25, -65.75],
      Paspébiac: [48.0333, -65.25],
      "Matane": [48.8497, -67.5317],
      "Rimouski": [48.4488, -68.5263],
      "Sept-Îles": [50.2001, -66.3821],
      "Havre-Saint-Pierre": [50.2333, -63.5833],
      "Natashquan": [50.1833, -61.8167],
      "Tadoussac": [48.1361, -69.7108],
      "Baie-Comeau": [49.2176, -68.1485],
      "Percé": [48.5245, -64.2132],
      "Bonaventure": [48.0499, -65.4928],
      "Maria": [48.17169888721023, -65.9860574900337],
      "Murdochville": [48.9667, -65.05],
      "Sainte-Madeleine-de-la-Rivière-Madeleine": [49.2333, -65.3333],
    };

    const etapeColors = {
      "1-Prélèvement": "#ef4444",
      "2-Transformation": "#f97316",
      "3-Distribution": "#22c55e",
    };

    const validData = data
      .filter((d) => d.organisation && d.ville && cityCoordinates[d.ville])
      .map((d) => ({
        ...d,
        coordinates: cityCoordinates[d.ville],
      }));

    if (!map) {
      map = L.map("map", {
        center: [48.5, -65.0],
        zoom: 7,
        zoomControl: true,
        attributionControl: false
      });

      L.control.attribution({
        position: 'bottomright',
        prefix: false
      }).addTo(map);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution: "© OpenStreetMap contributors © CARTO",
          maxZoom: 18,
          subdomains: "abcd",
        }
      ).addTo(map);
    }

    markersData.forEach(item => {
      if (item && item.marker && map.hasLayer(item.marker)) {
        map.removeLayer(item.marker);
      }
    });
    markersData = [];

    d3.selectAll("div.tooltip").remove();
    const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

    validData.forEach((d) => {
      const coords = d.coordinates;
      const color = etapeColors[d.etape] || "#666666";

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width: 16px;height: 16px;background-color: ${color};border: 2px solid #ffffff;border-radius: 50%;box-shadow: 0 2px 4px rgba(0,0,0,0.3);cursor: pointer;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([coords[0], coords[1]], { icon: customIcon }).addTo(map);
      markersData.push({ marker, data: d });

      marker.on("mouseover", function (e) {
        const markerElement = this.getElement().querySelector('div');
        if (markerElement) {
          markerElement.style.width = '24px';
          markerElement.style.height = '24px';
          markerElement.style.borderWidth = '3px';
          markerElement.style.transform = 'translate(-2px, -2px)';
        }
        markersData.forEach((item) => {
          if (item && item.marker && item.marker !== this) {
            const otherElement = item.marker.getElement().querySelector('div');
            if (otherElement) {
              otherElement.style.opacity = '0.3';
            }
          }
        });
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`<div class="tooltip-title">${d.organisation}</div><div><strong>Activité:</strong> ${d.activite || "-"}</div><div><strong>Étape:</strong> ${d.etape}</div><div><strong>Adresse:</strong> ${d.adresse || "-"}</div>`)
          .style("left", e.originalEvent.pageX + 10 + "px")
          .style("top", e.originalEvent.pageY - 10 + "px");
        window.dispatchEvent(new CustomEvent("highlight-organisation", { detail: { organisation: d.organisation } }));
      });

      marker.on("mouseout", function () {
        const markerElement = this.getElement().querySelector('div');
        if (markerElement) {
          markerElement.style.width = '16px';
          markerElement.style.height = '16px';
          markerElement.style.borderWidth = '2px';
          markerElement.style.transform = 'none';
        }
        markersData.forEach((item) => {
          if (item && item.marker) {
            const otherElement = item.marker.getElement().querySelector('div');
            if (otherElement) {
              otherElement.style.opacity = '1';
            }
          }
        });
        tooltip.transition().duration(200).style("opacity", 0);
        window.dispatchEvent(new CustomEvent("unhighlight-organisation", { detail: { organisation: d.organisation } }));
      });

      marker.on("mousemove", function (e) {
        tooltip.style("left", e.originalEvent.pageX + 10 + "px").style("top", e.originalEvent.pageY - 10 + "px");
      });
    });

    if (markersData.length > 0) {
      const group = new L.featureGroup(markersData.map(item => item.marker));
      map.fitBounds(group.getBounds().pad(0.1));
    }

    // 🔄 Écoute des événements venant de l’arbre
    window.addEventListener("highlight-organisation", (e) => {
      const org = e.detail.organisation;
      const item = markersData.find(m => m.data.organisation === org);
      if (item) {
        const el = item.marker.getElement().querySelector('div');
        if (el) {
          el.style.width = '24px';
          el.style.height = '24px';
          el.style.borderWidth = '3px';
          el.style.transform = 'translate(-2px, -2px)';
        }
        map.setView(item.marker.getLatLng(), 9, { animate: true });
      }
    });

    window.addEventListener("unhighlight-organisation", (e) => {
      const org = e.detail.organisation;
      const item = markersData.find(m => m.data.organisation === org);
      if (item) {
        const el = item.marker.getElement().querySelector('div');
        if (el) {
          el.style.width = '16px';
          el.style.height = '16px';
          el.style.borderWidth = '2px';
          el.style.transform = 'none';
        }
      }
    });
  })
  .catch(err => {
    console.error("❌ Erreur chargement données Carte:", err);
  });
}
