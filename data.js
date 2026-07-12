/* Compatibility loader for older cached copies of index.html.
   Loads the GeoJSON files synchronously so script.js can run immediately afterwards. */
(function () {
  const sources = {
    hidingZoneData: ['data/HidingZone.geojson', 'HidingZone.geojson'],
    railwayData: ['data/Railway.geojson', 'Railway.geojson'],
    dartStationsData: ['data/DartStations.geojson', 'DartStations.geojson'],
    transferBufferData: ['data/TransferBuffer.geojson', 'TransferBuffer.geojson'],
    boardingStopsData: ['data/ExportLinks.geojson', 'ExportLinks.geojson'],
    reachableStopsData: ['data/ReachableStops.geojson', 'ReachableStops.geojson'],
    busRoutesData: ['data/ClippedBusRoutes.geojson', 'ClippedBusRoutes.geojson']
  };

  function loadJson(candidates) {
    for (const path of candidates) {
      try {
        const request = new XMLHttpRequest();
        request.open('GET', path + '?v=20260712-2', false);
        request.send(null);
        if (request.status >= 200 && request.status < 300) {
          return JSON.parse(request.responseText);
        }
      } catch (error) {
        console.warn('Could not load', path, error);
      }
    }
    return { type: 'FeatureCollection', features: [] };
  }

  for (const [name, candidates] of Object.entries(sources)) {
    window[name] = loadJson(candidates);
  }
})();
