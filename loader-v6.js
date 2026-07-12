/* global L */

(async function loadMapData() {
  const requiredFiles = {
    hidingZoneData: './HidingZone.geojson',
    railwayData: './Railway.geojson',
    dartStationsData: './DartStations.geojson',
    transferBufferData: './TransferBuffer.geojson',
    boardingStopsData: './ExportLinks.geojson',
    reachableStopsData: './ReachableStops.geojson'
  };

  try {
    await Promise.all(Object.entries(requiredFiles).map(async ([name, path]) => {
      const response = await fetch(`${path}?v=7`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
      window[name] = await response.json();
    }));

    // Bus routes are useful but not required for the rest of the map.
    // Keep the application working if this large file has not been uploaded yet.
    try {
      const routeResponse = await fetch('./ClippedBusRoutes.geojson?v=7', { cache: 'no-store' });
      window.busRoutesData = routeResponse.ok
        ? await routeResponse.json()
        : { type: 'FeatureCollection', features: [] };
    } catch {
      window.busRoutesData = { type: 'FeatureCollection', features: [] };
    }

    const script = document.createElement('script');
    script.src = './script.js?v=7';
    script.onerror = () => showError('The map script could not be loaded.');
    document.body.appendChild(script);
  } catch (error) {
    console.error(error);
    showError(`Map data could not be loaded: ${error.message}`);
  }

  function showError(message) {
    const map = document.getElementById('map');
    map.textContent = message;
    map.style.padding = '2rem';
    map.style.fontFamily = 'sans-serif';
  }
})();