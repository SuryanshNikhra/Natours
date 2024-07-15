console.log('hello from client side');

// const locations = JSON.parse(document.getElementById('map').dataset.locations);


export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic3VyeWFuc2gtbmlraHJhIiwiYSI6ImNseTlqcWwxMDBvNWoya3FweHJ5ZXQ3NmUifQ.rTSathUudvDZQlAKoHjm2g';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/suryansh-nikhra/cly9qs6r000iy01pm5ot6haw8',
    scrollZoom: false,

    // center: [-118.113491, 34.111745],
    // zoom:10,
    // interactive:false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //add pop up
    new mapboxgl.Popup({ offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    //Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
