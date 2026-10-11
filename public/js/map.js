const mapElement = document.getElementById("map")
const mapToken = mapElement.dataset.mapToken
const coordinates = JSON.parse(mapElement.dataset.coordinates)

const map = new mapboxgl.Map({
        accessToken: mapToken,
        container: 'map', // container ID
        center: coordinates, // starting position [lng, lat]. Note that lat must be set between -90 and 90
        zoom: 9 // starting zoom
    });

    // Create a new marker.
const marker = new mapboxgl.Marker({color: 'red'})
    .setLngLat(coordinates) //Listing.geometry.coordinates
    .setPopup(new mapboxgl.Popup({offset: 25})
    .setHTML("<h3>Exact Location will be provided after booking</h3>"))
    .addTo(map);
