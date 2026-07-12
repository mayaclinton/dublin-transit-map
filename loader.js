/* global L */

(async function loadMapData() {
  const files = {
    hidingZoneData: 'data/HidingZone.geojson',
    railwayData: 'data/Railway.geojson',
    dartStationsData: 'data/DartStations.geojson',
    transferBufferData: 'data/TransferBuffer.geojson',
    boardingStopsData: 'data/ExportLinks.geojson',
    reachableStopsData: 'data/ReachableStops.geojson',
    busRoutesData: 'data/ClippedBusRoutes.geojson'
  };

  try {
    await Promise.all(Object.entries(files).map(async ([name, path]) => {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
      window[name] = await response.json();
    }));

    const script = document.createElement('script');
    script.src = 'script.js';
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
