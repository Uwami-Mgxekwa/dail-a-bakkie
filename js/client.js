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
let selectedVehicle = 'bakkie';
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
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initializeLocationInputs();
    initializeMap();
    loadTripHistory();
    loadFavorites();
    updatePrice();
});

// Vehicle Selection
function selectVehicle(vehicle) {
    selectedVehicle = vehicle;
    
    // Update UI
    document.querySelectorAll('.vehicle-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`[data-vehicle="${vehicle}"]`).classList.add('active');
    
    // Resolve vehicle config from Pricing module
    const cfg = (typeof Pricing !== 'undefined') ? Pricing.getVehicleConfig(vehicle) : vehiclePricing[vehicle];
    
    // Update button text
    selectedVehicleType.textContent = cfg.name;
    
    // Update base fare display
    document.getElementById('baseFare').textContent = `R${cfg.base}`;
    
    // Update selected vehicle in trip details
    document.getElementById('selectedVehicle').textContent = cfg.name;
    
    updatePrice();
}

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
        const res = Pricing.calculate(selectedVehicle, mockDistance);
        return { base: res.base, distance: res.distance, total: res.total, distanceKm: mockDistance };
    }
    // Fallback to legacy inline pricing
    const legacyCfg = vehiclePricing[selectedVehicle];
    const distancePrice = mockDistance * legacyCfg.perKm;
    return { base: legacyCfg.base, distance: distancePrice, total: legacyCfg.base + distancePrice, distanceKm: mockDistance };
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
    showSection('idle');
}

function startTrip() {
    tripStatus = 'in-progress';
    stopRealTimeTracking(); // Stop tracking when trip starts
    showSection('in-progress');
    populateDriverCard('progressDriverCard', currentDriver);
    
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
            vehiclePricing[selectedVehicle].name,
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
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}