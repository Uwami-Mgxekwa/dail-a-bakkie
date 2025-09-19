// Authentication
function signOut() {
    // Clear authentication
    StorageUtil.clearAuth();

    // Redirect to login page
    window.location.href = '../index.html';
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('dial-a-bakkie-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('dial-a-bakkie-theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');

    if (theme === 'dark') {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
}

// Global Variables
let selectedService = 'bakkie-go';
let selectedPayment = 'cash';
let currentDriver = null;
let estimatedPrice = 0;
let tripStatus = 'idle';
let map = null;
let pickupMarker = null;
let dropoffMarker = null;
let routeLine = null;
let currentLocation = null;
let tripHistory = [];
let currentTripId = null;
let cargoDetails = {
    weight: 'light',
    type: 'furniture',
    helpNeeded: false
};
let favorites = [];
let trackingInterval = null;
let driverLocation = null;
let etaCountdown = null;
let progressInterval = null;

// Vehicle pricing configuration (delegated to Pricing module)
// Kept only as a fallback if Pricing is unavailable
const vehiclePricing = typeof Pricing !== 'undefined' ? {} : {
    bakkie: { base: 50, perKm: 15, name: 'Bakkie' },
    van: { base: 70, perKm: 18, name: 'Van' },
    truck: { base: 100, perKm: 22, name: 'Truck' }
};

// Mock location data for suggestions
const locationSuggestions = [
    { name: 'Hillbrow, Johannesburg', lat: -26.1934, lng: 28.0436, type: 'suburb' },
    { name: 'Berea, Johannesburg', lat: -26.2041, lng: 28.0473, type: 'suburb' },
    { name: 'Yeoville, Johannesburg', lat: -26.1884, lng: 28.0436, type: 'suburb' },
    { name: 'CBD, Johannesburg', lat: -26.2041, lng: 28.0473, type: 'area' },
    { name: 'Braamfontein, Johannesburg', lat: -26.1934, lng: 28.0436, type: 'suburb' },
    { name: 'Newtown, Johannesburg', lat: -26.2041, lng: 28.0473, type: 'area' },
    { name: 'Sandton, Johannesburg', lat: -26.1076, lng: 28.0567, type: 'area' },
    { name: 'Rosebank, Johannesburg', lat: -26.1467, lng: 28.0436, type: 'suburb' },
    { name: 'Melville, Johannesburg', lat: -26.1734, lng: 28.0436, type: 'suburb' },
    { name: 'Parktown, Johannesburg', lat: -26.1734, lng: 28.0436, type: 'suburb' }
];

// Mock drivers data
const mockDrivers = [
    {
        id: 1,
        name: 'Thabo Mthembu',
        rating: 4.8,
        vehicle: 'Toyota Hilux',
        plateNumber: 'GP 123 ABC',
        eta: '3-5 mins',
        phone: '+27 82 123 4567',
        lat: -26.1934,
        lng: 28.0436
    },
    {
        id: 2,
        name: 'Sarah Ndlovu',
        rating: 4.9,
        vehicle: 'Ford Ranger',
        plateNumber: 'GP 456 DEF',
        eta: '2-4 mins',
        phone: '+27 83 987 6543',
        lat: -26.2041,
        lng: 28.0473
    }
];

// DOM Elements
const pickupInput = document.getElementById('pickupLocation');
const dropoffInput = document.getElementById('dropoffLocation');
const priceEstimate = document.getElementById('priceEstimate');
const priceAmount = document.getElementById('priceAmount');
const requestBtn = document.getElementById('requestBtn');
const btnPrice = document.getElementById('btnPrice');
const selectedVehicleType = document.getElementById('selectedVehicleType');
const mapContainer = document.getElementById('mapContainer');
const mapToggleBtn = document.getElementById('mapToggleBtn');
const tripDetails = document.getElementById('tripDetails');

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initializeLocationInputs();
    initializeMap();
    loadTripHistory();
    loadFavorites();
    updatePrice();
});



// Payment Selection
function selectPayment(payment) {
    selectedPayment = payment;

    // Update UI
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`[data-payment="${payment}"]`).classList.add('active');

    // Update payment method display
    document.getElementById('paymentMethod').textContent = payment.charAt(0).toUpperCase() + payment.slice(1);
}

// Location Input Management
function initializeLocationInputs() {
    // Add event listeners for location inputs
    pickupInput.addEventListener('input', (e) => {
        handleLocationInput(e, 'pickup');
    });

    dropoffInput.addEventListener('input', (e) => {
        handleLocationInput(e, 'dropoff');
    });

    // Add event listeners for location selection
    pickupInput.addEventListener('blur', () => {
        setTimeout(() => hideSuggestions('pickup'), 200);
    });

    dropoffInput.addEventListener('blur', () => {
        setTimeout(() => hideSuggestions('dropoff'), 200);
    });
}

function handleLocationInput(event, type) {
    const query = event.target.value.trim();
    const suggestionsContainer = document.getElementById(`${type}Suggestions`);

    if (query.length < 2) {
        hideSuggestions(type);
        return;
    }

    const filteredSuggestions = locationSuggestions.filter(location =>
        location.name.toLowerCase().includes(query.toLowerCase())
    );

    showSuggestions(filteredSuggestions, type);
    updatePrice();
}

function showSuggestions(suggestions, type) {
    const container = document.getElementById(`${type}Suggestions`);

    if (suggestions.length === 0) {
        hideSuggestions(type);
        return;
    }

    container.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item" onclick="selectLocation('${suggestion.name}', '${type}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
            </svg>
            <div class="suggestion-text">
                <div class="suggestion-primary">${suggestion.name}</div>
                <div class="suggestion-secondary">${suggestion.type}</div>
            </div>
        </div>
    `).join('');

    container.style.display = 'block';
}

function hideSuggestions(type) {
    const container = document.getElementById(`${type}Suggestions`);
    container.style.display = 'none';
}

function selectLocation(locationName, type) {
    const input = document.getElementById(`${type}Location`);
    input.value = locationName;
    hideSuggestions(type);
    updatePrice();
    updateMap();
}

// Current Location
function getCurrentLocation(type) {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
        return;
    }

    const button = event.target.closest('.location-btn');
    const originalContent = button.innerHTML;
    button.innerHTML = '<div class="spinner-small"></div>';
    button.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            currentLocation = { lat, lng };

            // Reverse geocoding (simplified)
            const locationName = `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            document.getElementById(`${type}Location`).value = locationName;

            button.innerHTML = originalContent;
            button.disabled = false;

            updatePrice();
            updateMap();
        },
        (error) => {
            alert('Unable to retrieve your location. Please enter it manually.');
            button.innerHTML = originalContent;
            button.disabled = false;
        }
    );
}

// Map Management
function initializeMap() {
    if (typeof AppMap !== 'undefined') {
        map = AppMap.initMap();
    }
}

function toggleMap() {
    const isHidden = mapContainer.classList.contains('hidden');

    if (isHidden) {
        mapContainer.classList.remove('hidden');
        mapToggleBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/>
            </svg>
            Hide Map
        `;

        // Resize map after showing
        setTimeout(() => {
            if (typeof AppMap !== 'undefined') AppMap.invalidate();
            updateMap();
        }, 100);
    } else {
        mapContainer.classList.add('hidden');
        mapToggleBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/>
            </svg>
            Show Map
        `;
    }
}

function updateMap() {
    if (!map) return;

    const pickup = pickupInput.value.trim();
    const dropoff = dropoffInput.value.trim();

    if (pickup && dropoff) {
        // Find coordinates for locations
        const pickupCoords = findLocationCoords(pickup);
        const dropoffCoords = findLocationCoords(dropoff);

        if (pickupCoords && dropoffCoords) {
            if (typeof AppMap !== 'undefined') {
                AppMap.setRoute(pickupCoords, dropoffCoords);
            }
        }
    }
}

function findLocationCoords(locationName) {
    // Check if it's current location
    if (locationName.includes('Current Location') && currentLocation) {
        return [currentLocation.lat, currentLocation.lng];
    }

    // Find in suggestions
    const location = locationSuggestions.find(loc =>
        loc.name.toLowerCase() === locationName.toLowerCase()
    );

    return location ? [location.lat, location.lng] : null;
}

// Price Calculation
function calculatePrice(pickup, dropoff) {
    if (!pickup || !dropoff) return 0;
    // Mock distance calculation (in real app, use routing service)
    const mockDistance = Math.floor(Math.random() * 20) + 2;
    if (typeof Pricing !== 'undefined') {
        const res = Pricing.calculate(selectedService, mockDistance);
        return { base: res.base, distance: res.distance, total: res.total, distanceKm: mockDistance };
    }
    // Fallback to new service pricing
    const config = serviceConfig[selectedService];
    const distancePrice = mockDistance * config.pricePerKm;
    return { base: config.basePrice, distance: distancePrice, total: config.basePrice + distancePrice, distanceKm: mockDistance };
}

function updatePrice() {
    const pickup = pickupInput.value.trim();
    const dropoff = dropoffInput.value.trim();

    if (pickup && dropoff) {
        const pricing = calculatePrice(pickup, dropoff);
        estimatedPrice = pricing.total;

        // Update price display
        document.getElementById('baseFare').textContent = `R${pricing.base}`;
        document.getElementById('distanceFare').textContent = `R${pricing.distance}`;
        priceAmount.textContent = `R${pricing.total}`;
        btnPrice.textContent = pricing.total;

        // Update trip details
        document.getElementById('tripDistance').textContent = `${pricing.distanceKm} km`;
        document.getElementById('tripDuration').textContent = `${Math.ceil(pricing.distanceKm * 2)} mins`;

        // Show price estimate, trip details, and payment methods
        priceEstimate.classList.remove('hidden');
        tripDetails.classList.remove('hidden');
        document.getElementById('paymentMethods').classList.remove('hidden');

        // Enable request button
        requestBtn.disabled = false;
    } else {
        priceEstimate.classList.add('hidden');
        tripDetails.classList.add('hidden');
        requestBtn.disabled = true;
        btnPrice.textContent = '0';
    }
}

// Trip Management
function requestBakkie() {
    if (!pickupInput.value || !dropoffInput.value) {
        alert('Please enter both pickup and drop-off locations');
        return;
    }

    tripStatus = 'searching';
    showSection('searching');

    // Simulate finding driver
    setTimeout(() => {
        const randomDriver = mockDrivers[Math.floor(Math.random() * mockDrivers.length)];
        currentDriver = randomDriver;
        tripStatus = 'matched';
        showSection('matched');
        populateDriverCard('driverCard', currentDriver);
        startRealTimeTracking();
    }, 3000);
}

function cancelRequest() {
    tripStatus = 'idle';
    currentDriver = null;
    stopRealTimeTracking();

    // Deactivate chat when request is cancelled
    deactivateChat();

    showSection('idle');
}

function startTrip() {
    tripStatus = 'in-progress';
    stopRealTimeTracking(); // Stop tracking when trip starts
    showSection('in-progress');
    populateDriverCard('progressDriverCard', currentDriver);

    // Activate chat when trip starts
    activateChat();

    // Start chat when trip begins
    if (currentDriver && typeof Chat !== 'undefined') {
        currentTripId = 'trip_' + Date.now();
        Chat.setChatId(currentTripId);
    }

    // Start journey tracking when trip begins
    if (typeof startJourneyTracking === 'function') {
        startJourneyTracking();
    }

    // Update trip details
    document.getElementById('tripFrom').textContent = pickupInput.value;
    document.getElementById('tripTo').textContent = dropoffInput.value;
    document.getElementById('tripPrice').textContent = `R${estimatedPrice}`;

    // Simulate trip completion after 10 seconds
    setTimeout(() => {
        addToTripHistory(
            pickupInput.value,
            dropoffInput.value,
            estimatedPrice,
            serviceConfig[selectedService].name,
            currentDriver.name
        );

        // Show completion message
        alert(`Trip completed! R${estimatedPrice} paid via ${selectedPayment}. Thank you for using Dial a Bakkie!`);

        // Reset to idle state
        tripStatus = 'idle';
        currentDriver = null;
        showSection('idle');
    }, 10000);
}

function showSection(section) {
    // Hide all sections
    document.getElementById('locationCard').style.display = section === 'idle' ? 'block' : 'none';
    document.querySelector('.action-buttons').style.display = section === 'idle' ? 'flex' : 'none';
    document.getElementById('searchingCard').classList.toggle('hidden', section !== 'searching');
    document.getElementById('matchedSection').classList.toggle('hidden', section !== 'matched');
    document.getElementById('progressSection').classList.toggle('hidden', section !== 'in-progress');
    document.getElementById('supportInfo').classList.toggle('hidden', !['matched', 'in-progress'].includes(section));

    // Handle chat activation based on section
    if (section === 'matched') {
        activateChat();
        // Start journey tracking when driver is matched
        setTimeout(() => {
            if (typeof startJourneyTracking === 'function') {
                startJourneyTracking();
            }
        }, 2000);
    } else if (section === 'idle') {
        setTimeout(() => {
            deactivateChat();
            // Stop journey tracking when trip ends
            if (typeof stopJourneyTracking === 'function') {
                stopJourneyTracking();
            }
        }, 2000);
    }
}

function populateDriverCard(cardId, driver) {
    const card = document.getElementById(cardId);
    card.innerHTML = `
        <div class="driver-header">
            <div class="driver-info">
                <div class="driver-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                </div>
                <div class="driver-details">
                    <h3>${driver.name}</h3>
                    <div class="rating">
                        <svg class="star" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                        </svg>
                        <span>${driver.rating}</span>
                    </div>
                </div>
            </div>
            <button class="call-btn" onclick="window.open('tel:${driver.phone}')">
                <svg style="width: 16px; height: 16px; fill: white;" viewBox="0 0 24 24">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
            </button>
        </div>
        
        <div class="driver-specs">
            <div class="spec-row">
                <span>Vehicle:</span>
                <span>${driver.vehicle}</span>
            </div>
            <div class="spec-row">
                <span>Plate:</span>
                <span>${driver.plateNumber}</span>
            </div>
            <div class="spec-row">
                <span>ETA:</span>
                <span class="eta">${driver.eta}</span>
            </div>
        </div>
    `;
}

// Trip History Management
function loadTripHistory() {
    const saved = localStorage.getItem('dial-a-bakkie-trip-history');
    tripHistory = saved ? JSON.parse(saved) : [
        {
            id: 1,
            date: '2024-01-15',
            pickup: 'Hillbrow, Johannesburg',
            dropoff: 'Sandton, Johannesburg',
            price: 120,
            vehicle: 'Bakkie',
            driver: 'Thabo Mthembu',
            status: 'completed'
        },
        {
            id: 2,
            date: '2024-01-12',
            pickup: 'Berea, Johannesburg',
            dropoff: 'Rosebank, Johannesburg',
            price: 85,
            vehicle: 'Van',
            driver: 'Sarah Ndlovu',
            status: 'completed'
        }
    ];
}

function saveTripHistory() {
    localStorage.setItem('dial-a-bakkie-trip-history', JSON.stringify(tripHistory));
}

function addToTripHistory(pickup, dropoff, price, vehicle, driver) {
    const trip = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        pickup: pickup,
        dropoff: dropoff,
        price: price,
        vehicle: vehicle,
        driver: driver,
        status: 'completed'
    };

    tripHistory.unshift(trip);
    if (tripHistory.length > 20) {
        tripHistory = tripHistory.slice(0, 20); // Keep only last 20 trips
    }
    saveTripHistory();
}

function showTripHistory() {
    const modal = document.getElementById('tripHistoryModal');
    const tripList = document.getElementById('tripList');

    if (tripHistory.length === 0) {
        tripList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <svg style="width: 48px; height: 48px; margin: 0 auto 16px; stroke: var(--text-secondary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3v18h18"/>
                    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                </svg>
                <p>No trip history yet</p>
                <p style="font-size: 14px;">Your completed trips will appear here</p>
            </div>
        `;
    } else {
        tripList.innerHTML = tripHistory.map(trip => `
            <div class="trip-item" onclick="selectTripFromHistory('${trip.pickup}', '${trip.dropoff}')">
                <div class="trip-item-header">
                    <span class="trip-date">${formatDate(trip.date)}</span>
                    <span class="trip-price">R${trip.price}</span>
                </div>
                <div class="trip-route">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <div class="trip-locations">
                        <div class="trip-location pickup">${trip.pickup}</div>
                        <div class="trip-location dropoff">${trip.dropoff}</div>
                    </div>
                </div>
                <div class="trip-details-row">
                    <span>${trip.vehicle} • ${trip.driver}</span>
                    <span>${trip.status}</span>
                </div>
            </div>
        `).join('');
    }

    modal.classList.remove('hidden');
}

// Favorites Management
function loadFavorites() {
    const saved = localStorage.getItem('dial-a-bakkie-favorites');
    favorites = saved ? JSON.parse(saved) : [
        {
            id: 1,
            name: 'Home',
            address: 'Hillbrow, Johannesburg',
            type: 'home'
        },
        {
            id: 2,
            name: 'Work',
            address: 'Sandton, Johannesburg',
            type: 'work'
        }
    ];
}

function saveFavorites() {
    localStorage.setItem('dial-a-bakkie-favorites', JSON.stringify(favorites));
}

function showFavorites() {
    const modal = document.getElementById('favoritesModal');
    const favoritesList = document.getElementById('favoritesList');

    if (favorites.length === 0) {
        favoritesList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <svg style="width: 48px; height: 48px; margin: 0 auto 16px; stroke: var(--text-secondary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <p>No favorite locations</p>
                <p style="font-size: 14px;">Add locations to your favorites for quick access</p>
            </div>
        `;
    } else {
        favoritesList.innerHTML = favorites.map(favorite => `
            <div class="favorite-item">
                <div class="favorite-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                </div>
                <div class="favorite-info">
                    <div class="favorite-name">${favorite.name}</div>
                    <div class="favorite-address">${favorite.address}</div>
                </div>
                <div class="favorite-actions">
                    <button class="favorite-btn" onclick="useFavoriteLocation('${favorite.address}')" title="Use this location">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </button>
                    <button class="favorite-btn delete" onclick="removeFavorite(${favorite.id})" title="Remove from favorites">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    modal.classList.remove('hidden');
}

function useFavoriteLocation(address) {
    // Check which input is focused or use pickup by default
    const activeElement = document.activeElement;
    if (activeElement.id === 'dropoffLocation') {
        dropoffInput.value = address;
    } else {
        pickupInput.value = address;
    }

    updatePrice();
    updateMap();
    closeModal('favoritesModal');
}

function removeFavorite(id) {
    favorites = favorites.filter(fav => fav.id !== id);
    saveFavorites();
    showFavorites(); // Refresh the modal
}

function selectTripFromHistory(pickup, dropoff) {
    pickupInput.value = pickup;
    dropoffInput.value = dropoff;
    updatePrice();
    updateMap();
    closeModal('tripHistoryModal');
}

// Modal Management
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-ZA', {
            day: 'numeric',
            month: 'short'
        });
    }
}

// Real-time Tracking Functions
function startRealTimeTracking() {
    if (!currentDriver) return;

    // Initialize driver location (start from driver's current position)
    driverLocation = {
        lat: currentDriver.lat,
        lng: currentDriver.lng,
        progress: 0
    };

    // Start ETA countdown (3-5 minutes)
    const initialEta = Math.floor(Math.random() * 3) + 3; // 3-5 minutes
    etaCountdown = initialEta * 60; // Convert to seconds

    // Update ETA display
    updateETADisplay();

    // Start tracking interval (update every 2 seconds)
    trackingInterval = setInterval(() => {
        updateDriverLocation();
        updateETADisplay();
        updateProgressBar();
        updateLastUpdated();
    }, 2000);

    // Start progress bar animation
    startProgressAnimation();
}

function stopRealTimeTracking() {
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    etaCountdown = null;
    driverLocation = null;
}

function updateDriverLocation() {
    if (!driverLocation) return;

    // Simulate driver movement towards pickup location
    const pickupCoords = findLocationCoords(pickupInput.value);
    if (!pickupCoords) return;

    // Calculate distance to pickup
    const distance = calculateDistance(
        driverLocation.lat, driverLocation.lng,
        pickupCoords[0], pickupCoords[1]
    );

    // Move driver closer to pickup (simulate movement)
    if (distance > 0.1) { // 0.1 km = 100m
        const moveFactor = 0.02; // Move 20m closer each update
        const latDiff = pickupCoords[0] - driverLocation.lat;
        const lngDiff = pickupCoords[1] - driverLocation.lng;

        driverLocation.lat += latDiff * moveFactor;
        driverLocation.lng += lngDiff * moveFactor;
        driverLocation.progress = Math.min(95, driverLocation.progress + 2);
    } else {
        // Driver has arrived
        driverLocation.progress = 100;
        showStatusUpdate('Driver has arrived at pickup location!', 'success');
    }

    // Update driver location text
    updateDriverLocationText();
}

function updateETADisplay() {
    if (etaCountdown === null) return;

    const minutes = Math.floor(etaCountdown / 60);
    const seconds = etaCountdown % 60;

    if (etaCountdown <= 0) {
        document.getElementById('etaTime').textContent = 'Arrived';
        showStatusUpdate('Your driver has arrived!', 'success');
    } else if (minutes > 0) {
        document.getElementById('etaTime').textContent = `${minutes} min${minutes > 1 ? 's' : ''}`;
    } else {
        document.getElementById('etaTime').textContent = `${seconds}s`;
    }

    etaCountdown--;
}

function updateProgressBar() {
    if (!driverLocation) return;

    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = `${driverLocation.progress}%`;
    }
}

function updateDriverLocationText() {
    if (!driverLocation) return;

    const locationText = document.getElementById('driverLocation');
    if (!locationText) return;

    const distance = calculateDistance(
        driverLocation.lat, driverLocation.lng,
        findLocationCoords(pickupInput.value)[0],
        findLocationCoords(pickupInput.value)[1]
    );

    if (distance < 0.1) {
        locationText.textContent = 'At pickup location';
    } else if (distance < 0.5) {
        locationText.textContent = 'Approaching pickup point';
    } else if (distance < 1) {
        locationText.textContent = 'Near pickup area';
    } else {
        locationText.textContent = 'En route to pickup';
    }
}

function updateLastUpdated() {
    const lastUpdated = document.getElementById('lastUpdated');
    if (lastUpdated) {
        lastUpdated.textContent = 'Just now';
    }
}

function startProgressAnimation() {
    // Animate progress bar from 0 to current progress
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = '0%';
        setTimeout(() => {
            progressFill.style.width = `${driverLocation.progress}%`;
        }, 100);
    }
}

function showStatusUpdate(message, type = 'info') {
    // Create status update element
    const statusUpdate = document.createElement('div');
    statusUpdate.className = `status-update ${type}`;
    statusUpdate.textContent = message;

    // Insert after tracking card
    const trackingCard = document.getElementById('trackingCard');
    if (trackingCard && trackingCard.parentNode) {
        trackingCard.parentNode.insertBefore(statusUpdate, trackingCard.nextSibling);

        // Remove after 5 seconds
        setTimeout(() => {
            if (statusUpdate.parentNode) {
                statusUpdate.parentNode.removeChild(statusUpdate);
            }
        }, 5000);
    }
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    // Simple distance calculation (not perfectly accurate but good for demo)
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Chat Functions
function startChat() {
    if (currentDriver && typeof Chat !== 'undefined') {
        currentTripId = 'trip_' + Date.now(); // Generate trip ID
        Chat.setChatId(currentTripId);

        // Open the chat by triggering the toggle
        const chatToggleBtn = document.getElementById('chat-toggle-btn');
        if (chatToggleBtn) {
            chatToggleBtn.click();
        }
    }
}

function endChat() {
    if (typeof Chat !== 'undefined') {
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer && chatContainer.classList.contains('visible')) {
            chatContainer.classList.remove('visible');
        }
    }
}

// Service Selection Functions
const serviceConfig = {
    'bakkie-go': {
        name: 'Bakkie Go',
        basePrice: 45,
        pricePerKm: 8,
        maxWeight: 500,
        vehicle: 'Small Bakkie',
        description: 'Perfect for small furniture and household items'
    },
    'bakkie-xl': {
        name: 'Bakkie XL',
        basePrice: 75,
        pricePerKm: 12,
        maxWeight: 1000,
        vehicle: 'Large Bakkie',
        description: 'Ideal for large furniture and appliances'
    },
    'truck': {
        name: 'Truck',
        basePrice: 120,
        pricePerKm: 18,
        maxWeight: 3000,
        vehicle: 'Truck',
        description: 'Heavy cargo and full house moves'
    },
    'moto': {
        name: 'Moto',
        basePrice: 25,
        pricePerKm: 5,
        maxWeight: 20,
        vehicle: 'Motorcycle',
        description: 'Quick delivery for small items'
    },
    'courier': {
        name: 'Courier',
        basePrice: 15,
        pricePerKm: 3,
        maxWeight: 5,
        vehicle: 'Car',
        description: 'Documents and small parcels'
    },
    'assist': {
        name: 'Assist',
        basePrice: 95,
        pricePerKm: 15,
        maxWeight: 800,
        vehicle: 'Bakkie + Helper',
        description: 'Includes loading and unloading assistance'
    }
};

function selectService(serviceType) {
    selectedService = serviceType;

    // Update UI
    document.querySelectorAll('.service-card').forEach(card => {
        card.classList.remove('active');
    });
    document.querySelector(`[data-service="${serviceType}"]`).classList.add('active');

    // Show cargo details for relevant services
    const cargoDetails = document.getElementById('cargoDetails');
    if (['bakkie-go', 'bakkie-xl', 'truck', 'assist'].includes(serviceType)) {
        cargoDetails.classList.remove('hidden');
    } else {
        cargoDetails.classList.add('hidden');
    }

    // Update price estimate
    updatePriceEstimate();

    // Show service recommendation if needed
    showServiceRecommendation();

    // Update button text
    updateRequestButton();
}

function updateCargoWeight() {
    const weight = document.getElementById('cargoWeight').value;
    cargoDetails.weight = weight;

    // Recommend appropriate service based on weight
    recommendServiceByWeight(weight);
    updatePriceEstimate();
}

function updateCargoType() {
    const type = document.getElementById('cargoType').value;
    cargoDetails.type = type;

    // Recommend service based on cargo type
    recommendServiceByType(type);
}

function updateHelpNeeded() {
    const helpNeeded = document.getElementById('helpNeeded').checked;
    cargoDetails.helpNeeded = helpNeeded;

    // Recommend assist service if help is needed
    if (helpNeeded && selectedService !== 'assist') {
        showServiceRecommendation('Consider "Assist" service for loading/unloading help');
    }

    updatePriceEstimate();
}

function recommendServiceByWeight(weight) {
    let recommendedService = selectedService;
    let message = '';

    switch (weight) {
        case 'light':
            if (['truck', 'bakkie-xl'].includes(selectedService)) {
                recommendedService = 'bakkie-go';
                message = 'For light items, "Bakkie Go" is more cost-effective';
            }
            break;
        case 'medium':
            if (selectedService === 'truck') {
                recommendedService = 'bakkie-xl';
                message = 'For medium weight, "Bakkie XL" is sufficient and cheaper';
            } else if (selectedService === 'bakkie-go') {
                recommendedService = 'bakkie-xl';
                message = 'For medium weight, consider "Bakkie XL" for better capacity';
            }
            break;
        case 'heavy':
            if (['bakkie-go', 'moto', 'courier'].includes(selectedService)) {
                recommendedService = 'bakkie-xl';
                message = 'For heavy items, "Bakkie XL" or "Truck" is recommended';
            }
            break;
        case 'very-heavy':
            if (selectedService !== 'truck') {
                recommendedService = 'truck';
                message = 'For very heavy items, "Truck" service is required';
            }
            break;
    }

    if (message) {
        showServiceRecommendation(message, recommendedService);
    }
}

function recommendServiceByType(type) {
    let message = '';
    let recommendedService = selectedService;

    switch (type) {
        case 'documents':
            if (!['courier', 'moto'].includes(selectedService)) {
                recommendedService = 'courier';
                message = 'For documents, "Courier" service is most efficient';
            }
            break;
        case 'food':
            if (selectedService !== 'moto') {
                recommendedService = 'moto';
                message = 'For food delivery, "Moto" service is fastest';
            }
            break;
        case 'appliances':
            if (['courier', 'moto'].includes(selectedService)) {
                recommendedService = 'bakkie-xl';
                message = 'For appliances, "Bakkie XL" or "Truck" is recommended';
            }
            break;
    }

    if (message) {
        showServiceRecommendation(message, recommendedService);
    }
}

function showServiceRecommendation(message, recommendedService = null) {
    // Remove existing recommendation
    const existingRec = document.querySelector('.service-recommendation');
    if (existingRec) {
        existingRec.remove();
    }

    if (!message) return;

    const recommendation = document.createElement('div');
    recommendation.className = 'service-recommendation';
    recommendation.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
        </svg>
        <p>${message}</p>
        ${recommendedService ? `<button onclick="selectService('${recommendedService}')" class="btn btn-sm btn-primary">Switch</button>` : ''}
    `;

    document.querySelector('.service-selector').appendChild(recommendation);
}

function updateRequestButton() {
    const config = serviceConfig[selectedService];
    const btn = document.getElementById('requestBtn');
    const priceSpan = document.getElementById('btnPrice');
    const serviceSpan = document.getElementById('selectedVehicleType');

    if (btn && priceSpan && serviceSpan) {
        serviceSpan.textContent = config.name;
        priceSpan.textContent = estimatedPrice || config.basePrice;
    }
}

function updatePriceEstimate() {
    const config = serviceConfig[selectedService];
    let price = config.basePrice;

    // Add distance-based pricing (mock calculation)
    const distance = 5; // Mock distance
    price += distance * config.pricePerKm;

    // Add help fee if needed
    if (cargoDetails.helpNeeded && selectedService !== 'assist') {
        price += 30; // Helper fee
    }

    // Weight-based surcharge
    const weightSurcharges = {
        'light': 0,
        'medium': 10,
        'heavy': 25,
        'very-heavy': 50
    };
    price += weightSurcharges[cargoDetails.weight] || 0;

    estimatedPrice = price;

    // Update UI
    document.getElementById('priceAmount').textContent = `R${price}`;
    document.getElementById('baseFare').textContent = `R${config.basePrice}`;
    document.getElementById('selectedVehicle').textContent = config.name;

    updateRequestButton();
}

// Smart Chat Activation
function activateChat() {
    console.log('Activating chat...');
    const chatContainer = document.getElementById('chat-container');
    const chatToggleBtn = document.getElementById('chat-toggle-btn');

    if (chatContainer) {
        chatContainer.classList.add('driver-connected');
        console.log('Chat container activated');
    }
    if (chatToggleBtn) {
        chatToggleBtn.classList.add('driver-connected');
        console.log('Chat toggle button activated');
    }
}

function deactivateChat() {
    console.log('Deactivating chat...');
    const chatContainer = document.getElementById('chat-container');
    const chatToggleBtn = document.getElementById('chat-toggle-btn');

    if (chatContainer) {
        chatContainer.classList.remove('driver-connected');
        chatContainer.classList.remove('visible');
        chatContainer.style.display = 'none';
        console.log('Chat container deactivated');
    }
    if (chatToggleBtn) {
        chatToggleBtn.classList.remove('driver-connected');
        console.log('Chat toggle button deactivated');
    }
}



// Initialize service selection on page load
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing client...');

    // Check if required elements exist
    const serviceSelector = document.querySelector('.service-selector');
    const cargoDetails = document.getElementById('cargoDetails');
    const requestBtn = document.getElementById('requestBtn');

    console.log('Service selector exists:', !!serviceSelector);
    console.log('Cargo details exists:', !!cargoDetails);
    console.log('Request button exists:', !!requestBtn);

    // Test if basic functions exist
    console.log('selectService function exists:', typeof selectService === 'function');
    console.log('requestBakkie function exists:', typeof requestBakkie === 'function');

    // Set default service
    if (serviceSelector && typeof selectService === 'function') {
        try {
            selectService('bakkie-go');
        } catch (error) {
            console.error('Error selecting default service:', error);
        }
    }

    // Initialize cargo details
    if (document.getElementById('cargoWeight') && typeof updateCargoWeight === 'function') {
        try {
            updateCargoWeight();
        } catch (error) {
            console.error('Error updating cargo weight:', error);
        }
    }
    if (document.getElementById('cargoType') && typeof updateCargoType === 'function') {
        try {
            updateCargoType();
        } catch (error) {
            console.error('Error updating cargo type:', error);
        }
    }
    if (document.getElementById('helpNeeded') && typeof updateHelpNeeded === 'function') {
        try {
            updateHelpNeeded();
        } catch (error) {
            console.error('Error updating help needed:', error);
        }
    }

    console.log('Client initialization complete');
});// Live GPS Tracking Integration
let trackingSubscription = null;
let driverMarker = null;
let liveMapInitialized = false;

function initializeLiveTracking() {
    if (!liveTracking) {
        console.error('Live tracking system not available');
        return;
    }

    // Subscribe to driver location updates
    trackingSubscription = liveTracking.subscribe((event, data) => {
        handleTrackingUpdate(event, data);
    });

    console.log('Live tracking initialized for customer');
}

function handleTrackingUpdate(event, data) {
    switch (event) {
        case 'position_update':
            updateDriverPosition(data);
            break;
        case 'tracking_started':
            showTrackingStatus('Driver tracking started', 'success');
            break;
        case 'tracking_stopped':
            showTrackingStatus('Driver tracking stopped', 'info');
            break;
        case 'tracking_error':
            showTrackingStatus(`GPS Error: ${data.error}`, 'error');
            break;
    }
}

function updateDriverPosition(positionData) {
    // Update UI elements
    updateTrackingUI(positionData);

    // Update map if visible
    if (document.getElementById('liveMap')) {
        updateLiveMap(positionData);
    }

    // Calculate ETA if we have pickup location
    if (pickupInput.value) {
        calculateAndUpdateETA(positionData);
    }
}

function updateTrackingUI(data) {
    // Update location text
    const locationEl = document.getElementById('driverLocation');
    if (locationEl) {
        locationEl.textContent = `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`;
    }

    // Update speed
    const speedEl = document.getElementById('driverSpeed');
    if (speedEl && data.speedKmh !== undefined) {
        speedEl.textContent = `${Math.round(data.speedKmh)} km/h`;
    }

    // Update accuracy
    const accuracyEl = document.getElementById('gpsAccuracy');
    if (accuracyEl && data.accuracy) {
        accuracyEl.textContent = `${Math.round(data.accuracy)}m`;

        // Add accuracy status
        const status = getAccuracyStatus(data.accuracy);
        accuracyEl.className = `tracking-value gps-status ${status}`;
    }

    // Update last updated time
    const lastUpdatedEl = document.getElementById('lastUpdated');
    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = new Date().toLocaleTimeString();
    }
}

function getAccuracyStatus(accuracy) {
    if (accuracy <= 5) return 'excellent';
    if (accuracy <= 10) return 'good';
    if (accuracy <= 20) return 'fair';
    return 'poor';
}

function updateLiveMap(positionData) {
    const mapEl = document.getElementById('liveMap');
    if (!mapEl) return;

    // Initialize simple map visualization
    if (!liveMapInitialized) {
        initializeSimpleMap(mapEl);
        liveMapInitialized = true;
    }

    // Update driver marker position
    updateDriverMarker(positionData);
}

function initializeSimpleMap(mapEl) {
    // Create a simple map visualization without external dependencies
    mapEl.innerHTML = `
        <div class="connection-status connected">Live GPS</div>
        <div class="simple-map-grid"></div>
    `;

    // Add some styling to make it look like a map
    mapEl.style.background = 'linear-gradient(45deg, #f0f9ff 25%, transparent 25%), linear-gradient(-45deg, #f0f9ff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f9ff 75%), linear-gradient(-45deg, transparent 75%, #f0f9ff 75%)';
    mapEl.style.backgroundSize = '20px 20px';
    mapEl.style.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px';
}

function updateDriverMarker(positionData) {
    const mapEl = document.getElementById('liveMap');
    if (!mapEl) return;

    // Remove existing marker
    const existingMarker = mapEl.querySelector('.driver-marker');
    if (existingMarker) {
        existingMarker.remove();
    }

    // Create new marker
    const marker = document.createElement('div');
    marker.className = 'driver-marker';
    marker.title = `Driver Location\nLat: ${positionData.latitude.toFixed(6)}\nLng: ${positionData.longitude.toFixed(6)}\nAccuracy: ${Math.round(positionData.accuracy)}m`;

    // Position marker (simplified positioning for demo)
    const mapRect = mapEl.getBoundingClientRect();
    const x = (Math.sin(Date.now() / 10000) + 1) * 0.4 + 0.1; // Animated position
    const y = (Math.cos(Date.now() / 8000) + 1) * 0.4 + 0.1;

    marker.style.left = `${x * 100}%`;
    marker.style.top = `${y * 100}%`;

    mapEl.appendChild(marker);
}

function calculateAndUpdateETA(driverPosition) {
    // Mock ETA calculation (in real app, use routing service)
    const mockETA = Math.floor(Math.random() * 10) + 2; // 2-12 minutes

    const etaEl = document.getElementById('etaTime');
    if (etaEl) {
        etaEl.textContent = `${mockETA} mins`;
    }

    // Update progress bar
    const progressEl = document.getElementById('progressFill');
    if (progressEl) {
        const progress = Math.max(0, Math.min(100, (15 - mockETA) * 6.67)); // Progress based on ETA
        progressEl.style.width = `${progress}%`;
    }
}

function centerOnDriver() {
    showTrackingStatus('Centering on driver location', 'info');
    // In a real map, this would center the view on the driver
}

function toggleMapView() {
    const mapEl = document.getElementById('liveMap');
    if (mapEl) {
        // Toggle between satellite and street view (visual effect only)
        const isSatellite = mapEl.classList.contains('satellite-view');
        if (isSatellite) {
            mapEl.classList.remove('satellite-view');
            mapEl.style.background = 'linear-gradient(45deg, #f0f9ff 25%, transparent 25%), linear-gradient(-45deg, #f0f9ff 25%, transparent 25%)';
        } else {
            mapEl.classList.add('satellite-view');
            mapEl.style.background = 'linear-gradient(45deg, #065f46 25%, transparent 25%), linear-gradient(-45deg, #065f46 25%, transparent 25%)';
        }
    }
}

function shareDriverLocation() {
    if (!liveTracking || !liveTracking.currentPosition) {
        showTrackingStatus('No location data available to share', 'error');
        return;
    }

    const shareLink = liveTracking.generateShareLink(currentTripId);

    if (navigator.share) {
        navigator.share({
            title: 'Live Driver Location - Dial a Bakkie',
            text: 'Track my driver in real-time',
            url: shareLink
        }).catch(console.error);
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareLink).then(() => {
            showTrackingStatus('Share link copied to clipboard!', 'success');
        }).catch(() => {
            // Show share link in a modal
            alert(`Share this link to track the driver:\n${shareLink}`);
        });
    }
}

function showTrackingStatus(message, type) {
    // Create a temporary status message
    const statusEl = document.createElement('div');
    statusEl.className = `tracking-status ${type}`;
    statusEl.textContent = message;
    statusEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 6px;
        color: white;
        font-weight: 600;
        z-index: 2000;
        font-size: 14px;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;

    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    statusEl.style.backgroundColor = colors[type] || colors.info;

    document.body.appendChild(statusEl);

    // Remove after 3 seconds
    setTimeout(() => {
        if (statusEl.parentNode) {
            statusEl.parentNode.removeChild(statusEl);
        }
    }, 3000);
}

// Start demo tracking when driver is matched
// Start simulated tracking when driver is matched
function startJourneyTracking() {
    if (simulatedTracking) {
        const pickup = pickupInput.value || 'Pickup Location';
        const dropoff = dropoffInput.value || 'Drop-off Location';

        simulatedTracking.startTracking(pickup, dropoff);
        initializeJourneyTracking();
        console.log('Journey tracking started');
    }
}

function stopJourneyTracking() {
    if (trackingSubscription) {
        trackingSubscription();
        trackingSubscription = null;
    }

    if (simulatedTracking) {
        simulatedTracking.stopTracking();
    }
}

// Emergency chat close function (can be called from console if needed)
function forceCloseChat() {
    console.log('Force closing chat...');

    const chatContainer = document.getElementById('chat-container');
    const chatToggleBtn = document.getElementById('chat-toggle-btn');

    if (chatContainer) {
        chatContainer.classList.remove('visible', 'driver-connected');
        chatContainer.style.display = 'none';
        chatContainer.style.visibility = 'hidden';
    }

    if (chatToggleBtn) {
        chatToggleBtn.classList.remove('driver-connected');
        chatToggleBtn.style.display = 'none';
    }

    // Also try to close via the Chat module
    if (typeof Chat !== 'undefined' && Chat.closeChat) {
        Chat.closeChat();
    }

    console.log('Chat force closed');
}

// Add keyboard shortcut to close chat (Escape key)
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer && chatContainer.classList.contains('visible')) {
            forceCloseChat();
        }
    }
});
// Simulated Journey Tracking Integration
function initializeJourneyTracking() {
    if (!simulatedTracking) {
        console.error('Simulated tracking system not available');
        return;
    }

    // Subscribe to journey updates
    trackingSubscription = simulatedTracking.subscribe((event, data) => {
        handleJourneyUpdate(event, data);
    });

    console.log('Journey tracking initialized for customer');
}

function handleJourneyUpdate(event, data) {
    switch (event) {
        case 'position_update':
            updateJourneyDisplay(data);
            break;
        case 'stage_changed':
            updateJourneyStage(data);
            break;
        case 'tracking_started':
            console.log('Journey tracking started');
            break;
        case 'tracking_stopped':
            console.log('Journey tracking stopped');
            break;
        case 'journey_complete':
            handleJourneyComplete(data);
            break;
    }
}

function updateJourneyDisplay(data) {
    // Update ETA
    const etaEl = document.getElementById('etaTime');
    if (etaEl) {
        etaEl.textContent = data.eta > 0 ? `${data.eta} mins` : 'Arrived';
    }

    // Update progress bar
    const progressEl = document.getElementById('progressFill');
    const progressPercentageEl = document.getElementById('progressPercentage');
    if (progressEl && progressPercentageEl) {
        progressEl.style.width = `${data.progress}%`;
        progressPercentageEl.textContent = `${data.progress}%`;
    }

    // Update journey status
    const journeyStatusEl = document.getElementById('journeyStatus');
    if (journeyStatusEl) {
        journeyStatusEl.textContent = data.status;
    }

    // Update details
    const speedEl = document.getElementById('currentSpeed');
    if (speedEl) {
        speedEl.textContent = data.speed > 0 ? `${data.speed} km/h` : 'Stationary';
    }

    const distanceEl = document.getElementById('distanceRemaining');
    if (distanceEl) {
        distanceEl.textContent = data.distance > 0 ? `${data.distance} km` : 'Arrived';
    }
}

function updateJourneyStage(data) {
    // Update journey phase
    const journeyPhaseEl = document.getElementById('journeyPhase');
    if (journeyPhaseEl) {
        const phaseNames = {
            'approaching': 'Driver Approaching',
            'arrived': 'Driver Arrived',
            'loading': 'Loading Items',
            'traveling': 'En Route',
            'arrived_destination': 'Delivered'
        };
        journeyPhaseEl.textContent = phaseNames[data.phase] || 'In Progress';
    }

    // Update journey stage indicator
    const journeyStageEl = document.getElementById('journeyStage');
    if (journeyStageEl) {
        journeyStageEl.textContent = `${data.stage} of 5`;
    }

    // Update stage indicators
    updateStageIndicators(data.stage - 1);

    // Update status icon based on phase
    updateStatusIcon(data.phase);
}

function updateStageIndicators(activeStage) {
    for (let i = 0; i < 5; i++) {
        const stageEl = document.getElementById(`stage-${i}`);
        if (stageEl) {
            stageEl.classList.remove('active', 'completed');

            if (i < activeStage) {
                stageEl.classList.add('completed');
            } else if (i === activeStage) {
                stageEl.classList.add('active');
            }
        }
    }
}

function updateStatusIcon(phase) {
    const statusIconEl = document.getElementById('statusIcon');
    if (!statusIconEl) return;

    const icons = {
        'approaching': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
        </svg>`,
        'arrived': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"/>
        </svg>`,
        'loading': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="3" width="15" height="13"/>
            <polygon points="16,8 20,8 23,11 23,16 16,16"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>`,
        'traveling': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
            <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
            <path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2"/>
            <path d="M9 17v-6h8"/>
        </svg>`,
        'arrived_destination': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>`
    };

    statusIconEl.innerHTML = icons[phase] || icons['approaching'];
}

function handleJourneyComplete(data) {
    // Show completion message
    setTimeout(() => {
        alert('Trip completed successfully! Thank you for using Dial a Bakkie!');

        // Reset to idle state
        tripStatus = 'idle';
        currentDriver = null;
        showSection('idle');
    }, 1000);
}