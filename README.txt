DART + Frequent Bus Reachability — improved Leaflet version

Open index.html while connected to the internet.

Key edits:
- CARTO Voyager basemap (no API key needed)
- frequent boarding stops always draw above reachable final stops
- bus routes are coloured consistently by route_short_name
- mobile layout uses a collapsible bottom-sheet guide
- cleaner desktop card, legend and popup styling

Easy local edits:
- Basemap: in script.js, replace "voyager" with "light_all" for CARTO Positron.
- Route colours: edit routePalette in script.js.
- Stop colours/sizes: search for reachableStops and boardingStops in script.js.
- Text/layout: edit index.html and style.css.

Mapbox note:
Mapbox works too, but requires a public access token and a Mapbox account. CARTO gives a polished basemap without that extra setup.

V3 click fix:
- Orange reachable stops are now in the upper clickable pane.
- Blue boarding stops are drawn as a larger halo underneath, so both categories remain visible.
- Click the centre/orange marker for the full journey popup; click the visible blue ring for the boarding-stop popup.

v4 click fix:
- Uses SVG rendering instead of the shared canvas renderer.
- Polygon, rail and bus-route layers are non-interactive so they cannot intercept stop clicks.
- Boarding, reachable and DART stop layers explicitly remain interactive and are restored to the front after toggling.
