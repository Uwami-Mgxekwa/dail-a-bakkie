// Map module wrapping Leaflet interactions
window.AppMap = (function(){
    let map;
    let pickupMarker;
    let dropoffMarker;
    let routeLine;

    function initMap() {
        if (map) return map;
        map = L.map('map').setView([-26.2041, 28.0473], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        return map;
    }

    function clear() {
        if (!map) return;
        if (pickupMarker) map.removeLayer(pickupMarker);
        if (dropoffMarker) map.removeLayer(dropoffMarker);
        if (routeLine) map.removeLayer(routeLine);
        pickupMarker = null;
        dropoffMarker = null;
        routeLine = null;
    }

    function setRoute(pickupCoords, dropoffCoords) {
        initMap();
        clear();
        if (!pickupCoords || !dropoffCoords) return;
        pickupMarker = L.marker(pickupCoords, {
            icon: L.divIcon({
                className: 'custom-marker pickup-marker',
                html: '<div class="marker-icon pickup">P</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(map);
        dropoffMarker = L.marker(dropoffCoords, {
            icon: L.divIcon({
                className: 'custom-marker dropoff-marker',
                html: '<div class="marker-icon dropoff">D</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(map);
        routeLine = L.polyline([pickupCoords, dropoffCoords], {
            color: '#2563eb',
            weight: 4,
            opacity: 0.7
        }).addTo(map);
        const group = new L.featureGroup([pickupMarker, dropoffMarker]);
        map.fitBounds(group.getBounds().pad(0.1));
    }

    function invalidate() {
        if (map) map.invalidateSize();
    }

    return { initMap, setRoute, invalidate, clear };
})();


