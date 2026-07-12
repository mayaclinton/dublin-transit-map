/* global L, hidingZoneData, railwayData, dartStationsData, transferBufferData, boardingStopsData, reachableStopsData, busRoutesData */

// Use SVG rather than Leaflet's shared canvas renderer. Separate SVG panes preserve
// marker hit-testing, so bus stops remain hoverable and clickable.
const map = L.map('map', { zoomControl: true, preferCanvas: false, tap: true });

// A cleaner, no-token basemap. Swap "voyager" for "light_all" below for a quieter map.
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  subdomains: 'abcd',
  maxZoom: 20,
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
}).addTo(map);

// Fixed drawing order: routes at the bottom, boarding stops as a larger blue halo, then clickable final stops above them.
map.createPane('zonesPane').style.zIndex = 310;
map.createPane('routesPane').style.zIndex = 360;
map.createPane('railPane').style.zIndex = 390;
map.createPane('boardingStopsPane').style.zIndex = 620;
map.createPane('finalStopsPane').style.zIndex = 640;
map.createPane('stationsPane').style.zIndex = 660;

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const formatMinutes = (value) => Number.isFinite(Number(value)) ? `${Math.round(Number(value))} min` : 'Not available';
const formatDistance = (value) => Number.isFinite(Number(value)) ? `${Math.round(Number(value))} m` : 'Not available';

const popupHtml = (p) => `
  <article class="transit-popup">
    <header class="transit-popup__head">
      <div class="transit-popup__eyebrow">📍 Final transit stop</div>
      <div class="transit-popup__title">${escapeHtml(p.destination_stop_name || 'Unnamed stop')}</div>
    </header>
    <div class="transit-popup__body">
      <div class="transit-row"><span class="icon">🚆</span><div><small>From DART</small><strong>${escapeHtml(p.nearest_dart || 'Not available')}</strong></div></div>
      <div class="transit-row"><span class="icon">🚶</span><div><small>Transfer walk</small><strong>${formatDistance(p.source_distance_to_dart_m)}</strong></div></div>
      <div class="transit-row"><span class="icon">🚌</span><div><small>Route</small><strong>${escapeHtml(p.route_short_name || 'Not available')}</strong></div></div>
      <div class="transit-row"><span class="icon">➡️</span><div><small>Towards</small><strong>${escapeHtml(p.trip_headsign || 'Not available')}</strong></div></div>
      <div class="transit-row"><span class="icon">⏱</span><div><small>Bus ride</small><strong>${formatMinutes(p.ride_time_min)}</strong></div></div>
    </div>
    <footer class="transit-popup__foot">🚶 Final walking starts here</footer>
  </article>`;

// Stable route colours: every route name always receives the same colour.
const routePalette = ['#7b61a8', '#c65373', '#cb7936', '#359188', '#486fb2', '#9b6b3d', '#5c8a45', '#b04b47', '#4d8193', '#8d5b9f', '#b58a2d', '#3178a5'];
const routeNames = [...new Set(busRoutesData.features.map(f => f.properties?.route_short_name).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
const routeColours = new Map(routeNames.map((name, index) => [String(name), routePalette[index % routePalette.length]]));
const routeColour = (feature) => routeColours.get(String(feature.properties?.route_short_name || '')) || '#7a817e';

const hidingZone = L.geoJSON(hidingZoneData, {
  pane: 'zonesPane',
  interactive: false,
  style: { color: '#8b918d', weight: 1, fillColor: '#c9ccc9', fillOpacity: 0.18 }
});

const transferBuffers = L.geoJSON(transferBufferData, {
  pane: 'zonesPane',
  interactive: false,
  style: { color: '#4f9d74', weight: 1, fillColor: '#71b58f', fillOpacity: 0.10 }
});

const busRoutes = L.geoJSON(busRoutesData, {
  pane: 'routesPane',
  interactive: false,
  style: feature => ({ color: routeColour(feature), weight: 2.3, opacity: 0.72 }),
});

const railway = L.geoJSON(railwayData, {
  pane: 'railPane',
  interactive: false,
  style: { color: '#006b57', weight: 4, opacity: 0.9 }
});

const dartStations = L.geoJSON(dartStationsData, {
  pane: 'stationsPane',
  pointToLayer: (_, latlng) => L.circleMarker(latlng, {
    pane: 'stationsPane', radius: 6.5, color: '#006b57', weight: 3, fillColor: '#ffffff', fillOpacity: 1
  }),
  onEachFeature: (feature, layer) => {
    const p = feature.properties || {};
    layer.bindTooltip(escapeHtml(p.name || p['name:en'] || 'DART station'), { direction: 'top', className: 'stop-tooltip' });
  }
});

let selectedStation = '';
const reachableStops = L.geoJSON(reachableStopsData, {
  pane: 'finalStopsPane',
  pointToLayer: (_, latlng) => L.circleMarker(latlng, {
    pane: 'finalStopsPane', interactive: true, radius: 5.6, color: '#fff', weight: 1.6, fillColor: '#ef7f35', fillOpacity: 0.96, bubblingMouseEvents: false
  }),
  onEachFeature: (feature, layer) => {
    const p = feature.properties || {};
    layer.bindPopup(popupHtml(p), { maxWidth: 310, className: 'custom-popup' });
    layer.bindTooltip(escapeHtml(p.destination_stop_name || 'Reachable stop'), { direction: 'top', className: 'stop-tooltip' });
    layer.on({
      mouseover: () => layer.setStyle({ radius: 7.2, weight: 2, fillOpacity: 1 }),
      mouseout: () => applyReachableStyle(layer, p)
    });
  }
});

const boardingStops = L.geoJSON(boardingStopsData, {
  pane: 'boardingStopsPane',
  pointToLayer: (_, latlng) => L.circleMarker(latlng, {
    pane: 'boardingStopsPane', interactive: true, radius: 7.4, color: '#ffffff', weight: 1.4, fillColor: '#1877b9', fillOpacity: 0.95, bubblingMouseEvents: false
  }),
  onEachFeature: (feature, layer) => {
    const p = feature.properties || {};
    layer.bindPopup(`<strong>${escapeHtml(p.stop_name || 'Boarding stop')}</strong><br>Route ${escapeHtml(p.route_short_name || '')}<br>Nearest DART: ${escapeHtml(p.nearest_dart || '')}`);
    layer.bindTooltip(escapeHtml(p.stop_name || 'Frequent boarding stop'), { direction: 'top', className: 'stop-tooltip' });
  }
});

function applyReachableStyle(layer, properties) {
  const match = !selectedStation || properties.nearest_dart === selectedStation;
  layer.setStyle({
    radius: match ? 5.6 : 3.2,
    color: '#fff',
    weight: match ? 1.5 : 0.7,
    fillColor: '#ef7f35',
    fillOpacity: match ? 0.92 : 0.10
  });
}

// Add from bottom to top. The blue boarding markers are larger, so their ring remains visible beneath orange final stops.
[hidingZone, transferBuffers, busRoutes, railway, boardingStops, reachableStops, dartStations].forEach(layer => layer.addTo(map));

const overlays = {
  'Frequent bus routes': busRoutes,
  'DART railway': railway,
  'Reachable final stops': reachableStops,
  'Frequent boarding stops': boardingStops,
  'DART stations': dartStations,
  '400 m transfer buffers': transferBuffers,
  'Hiding zone': hidingZone
};
L.control.layers(null, overlays, { collapsed: true, position: 'topright' }).addTo(map);
function restoreStopOrder() {
  if (map.hasLayer(boardingStops)) boardingStops.bringToFront();
  if (map.hasLayer(reachableStops)) reachableStops.bringToFront();
  if (map.hasLayer(dartStations)) dartStations.bringToFront();
}
map.on('overlayadd', restoreStopOrder);
restoreStopOrder();


const allBounds = L.featureGroup([railway, dartStations, reachableStops, boardingStops]).getBounds();
const resetMap = () => allBounds.isValid() ? map.fitBounds(allBounds.pad(0.06)) : map.setView([53.3, -6.15], 10);
resetMap();

document.getElementById('fitMap').addEventListener('click', resetMap);
document.getElementById('reachableCount').textContent = reachableStopsData.features.length.toLocaleString();

const stationSelect = document.getElementById('stationFilter');
const stationNames = [...new Set(reachableStopsData.features.map(f => f.properties?.nearest_dart).filter(Boolean))].sort();
for (const station of stationNames) {
  const option = document.createElement('option');
  option.value = station;
  option.textContent = station;
  stationSelect.appendChild(option);
}
stationSelect.addEventListener('change', (event) => {
  selectedStation = event.target.value;
  reachableStops.eachLayer(layer => applyReachableStyle(layer, layer.feature.properties || {}));
  if (selectedStation) {
    const layers = reachableStops.getLayers().filter(layer => layer.feature.properties?.nearest_dart === selectedStation);
    const bounds = L.featureGroup(layers).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.25), { maxZoom: 14 });
  } else resetMap();
});

// Mobile bottom sheet.
const panel = document.getElementById('infoPanel');
const panelToggle = document.getElementById('panelToggle');
panelToggle.addEventListener('click', () => {
  const open = panel.classList.toggle('is-open');
  panelToggle.setAttribute('aria-expanded', String(open));
  panelToggle.textContent = open ? 'Close guide' : 'Map guide';
  setTimeout(() => map.invalidateSize(), 260);
});
map.on('click', () => {
  if (window.matchMedia('(max-width: 760px)').matches && panel.classList.contains('is-open')) {
    panel.classList.remove('is-open');
    panelToggle.setAttribute('aria-expanded', 'false');
    panelToggle.textContent = 'Map guide';
  }
});
