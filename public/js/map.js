(() => {
    const mapElement = document.getElementById("map")
    if (!mapElement) return

    if (!window.mapboxgl) {
        mapElement.textContent = "The map is temporarily unavailable."
        return
    }

    let coordinates
    try {
        coordinates = JSON.parse(mapElement.dataset.coordinates)
    } catch {
        mapElement.textContent = "A map location is not available for this listing."
        return
    }

    if (!Array.isArray(coordinates) || coordinates.length !== 2 || coordinates.some((value) => !Number.isFinite(Number(value)))) {
        mapElement.textContent = "A map location is not available for this listing."
        return
    }

    const map = new mapboxgl.Map({
        accessToken: mapElement.dataset.mapToken,
        container: mapElement,
        center: coordinates,
        zoom: 9
    })

    new mapboxgl.Marker({ color: "#fe424d" })
        .setLngLat(coordinates)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setText("Approximate listing location"))
        .addTo(map)
})()
