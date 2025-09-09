// Driver Dashboard JavaScript

// Global variables
let isOnline = false;
let currentRequest = null;
let currentTrip = null;
let requestTimer = null;
let map = null;
let customerMarker = null;
let driverMarker = null;
let routeLine = null;
let earnings = {
    today: 0,
    week: 0,
    month: 0,
    trips: []
};

// Initialize the driver dashboard
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    loadDriverData();
    initializeMap();
    updateStatusDisplay();
    
    // Simulate incoming requests when online
    setInterval(() => {
        if (isOnline && !currentRequest && !currentTrip) {
            simulateIncomingRequest();
        }
    }, 30000); // Check every 30 seconds
});

// Theme management
function initTheme() {
    const savedTheme = localStorage.getItem('dial-a-bakkie-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('dial-a-bakkie-theme', newTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-icon');
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    if (currentTheme === 'light') {
        themeIcon.innerHTML = `
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        `;
    } else {
        themeIcon.innerHTML = `
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        `;
    }
}

// Driver status management
function toggleStatus() {
    isOnline = !isOnline;
    updateStatusDisplay();
    
    if (isOnline) {
        showNotification('You are now online and ready to receive requests!', 'success');
    } else {
        showNotification('You are now offline', 'info');
        if (currentRequest) {
            declineRequest();
        }
    }
}

function updateStatusDisplay() {
    const statusToggle = document.getElementById('statusToggle');
    const statusText = statusToggle.querySelector('.status-text');
    const statusIndicator = statusToggle.querySelector('.status-indicator');
    
    if (isOnline) {
        statusToggle.classList.remove('offline');
        statusToggle.classList.add('online');
        statusText.textContent = 'Go Offline';
    } else {
        statusToggle.classList.remove('online');
        statusToggle.classList.add('offline');
        statusText.textContent = 'Go Online';
    }
}

// Request management
function simulateIncomingRequest() {
    const sampleRequests = [
        {
            id: 'REQ001',
            customer: {
                name: 'Sarah Johnson',
                phone: '+27 82 123 4567',
                rating: 4.9
            },
            pickup: {
                address: '123 Main Street, Johannesburg',
                coords: [-26.2041, 28.0473]
            },
            dropoff: {
                address: '456 Oak Avenue, Sandton',
                coords: [-26.1076, 28.0567]
            },
            distance: 12.5,
            duration: 25,
            vehicle: 'Bakkie',
            fare: 185
        },
        {
            id: 'REQ002',
            customer: {
                name: 'Mike Chen',
                phone: '+27 83 987 6543',
                rating: 4.7
            },
            pickup: {
                address: '789 Pine Road, Pretoria',
                coords: [-25.7479, 28.2293]
            },
            dropoff: {
                address: '321 Elm Street, Centurion',
                coords: [-25.8603, 28.1892]
            },
            distance: 8.2,
            duration: 18,
            vehicle: 'Van',
            fare: 220
        }
    ];
    
    const request = sampleRequests[Math.floor(Math.random() * sampleRequests.length)];
    showRequest(request);
}

function showRequest(request) {
    currentRequest = request;
    
    // Populate request details
    document.getElementById('customerName').textContent = request.customer.name;
    document.getElementById('customerPhone').textContent = request.customer.phone;
    document.getElementById('pickupAddress').textContent = request.pickup.address;
    document.getElementById('dropoffAddress').textContent = request.dropoff.address;
    document.getElementById('tripDistance').textContent = `${request.distance} km`;
    document.getElementById('tripDuration').textContent = `${request.duration} min`;
    document.getElementById('tripVehicle').textContent = request.vehicle;
    document.getElementById('tripFare').textContent = `R${request.fare}`;
    
    // Show request section
    showSection('requestSection');
    
    // Start countdown timer
    startRequestTimer();
    
    // Show notification
    showNotification('New trip request received!', 'info');
}

function startRequestTimer() {
    let timeLeft = 30;
    const timerElement = document.getElementById('requestTimer');
    
    requestTimer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `${timeLeft}s`;
        
        if (timeLeft <= 0) {
            clearInterval(requestTimer);
            declineRequest();
        }
    }, 1000);
}

function acceptRequest() {
    if (!currentRequest) return;
    
    clearInterval(requestTimer);
    currentTrip = {
        ...currentRequest,
        status: 'en-route',
        startTime: new Date()
    };
    
    currentRequest = null;
    showSection('tripSection');
    updateTripStatus('En Route to Pickup');
    updateMap();
    
    showNotification('Request accepted! Navigate to pickup location.', 'success');
}

function declineRequest() {
    if (currentRequest) {
        clearInterval(requestTimer);
        currentRequest = null;
        showSection('statusSection');
        showNotification('Request declined', 'info');
    }
}

// Trip management
function markPickup() {
    if (!currentTrip) return;
    
    currentTrip.status = 'picked-up';
    updateTripStatus('Customer Picked Up');
    
    // Enable start trip button
    document.getElementById('startTripBtn').disabled = false;
    document.getElementById('pickupBtn').disabled = true;
    
    showNotification('Customer picked up successfully!', 'success');
}

function startTrip() {
    if (!currentTrip) return;
    
    currentTrip.status = 'in-progress';
    updateTripStatus('Trip in Progress');
    
    // Enable complete trip button
    document.getElementById('completeTripBtn').disabled = false;
    document.getElementById('startTripBtn').disabled = true;
    
    showNotification('Trip started! Drive safely to destination.', 'success');
}

function completeTrip() {
    if (!currentTrip) return;
    
    // Add to earnings
    earnings.today += currentTrip.fare;
    earnings.week += currentTrip.fare;
    earnings.month += currentTrip.fare;
    
    // Add to trip history
    earnings.trips.unshift({
        id: currentTrip.id,
        route: `${currentTrip.pickup.address} → ${currentTrip.dropoff.address}`,
        date: new Date().toLocaleDateString(),
        earnings: currentTrip.fare
    });
    
    // Save earnings
    localStorage.setItem('dial-a-bakkie-driver-earnings', JSON.stringify(earnings));
    
    // Reset trip
    currentTrip = null;
    showSection('statusSection');
    updateStatusDisplay();
    
    showNotification(`Trip completed! You earned R${currentTrip.fare}`, 'success');
}

function updateTripStatus(status) {
    document.getElementById('tripStatus').textContent = status;
}

// Map management
function initializeMap() {
    if (typeof AppMap !== 'undefined') {
        map = AppMap.initMap('map', [-26.2041, 28.0473], 12);
    }
}

function updateMap() {
    if (!map || !currentTrip) return;
    
    // Clear existing markers
    if (customerMarker) map.removeLayer(customerMarker);
    if (driverMarker) map.removeLayer(driverMarker);
    if (routeLine) map.removeLayer(routeLine);
    
    // Add customer location marker
    customerMarker = AppMap.addMarker(currentTrip.pickup.coords, 'C', 'customer');
    
    // Add route
    AppMap.updateRoute(currentTrip.pickup.coords, currentTrip.dropoff.coords);
    
    // Fit bounds to show entire route
    AppMap.fitBounds([
        [currentTrip.pickup.coords[0], currentTrip.pickup.coords[1]],
        [currentTrip.dropoff.coords[0], currentTrip.dropoff.coords[1]]
    ]);
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = [position.coords.latitude, position.coords.longitude];
                
                // Add driver marker
                if (driverMarker) map.removeLayer(driverMarker);
                driverMarker = AppMap.addMarker(coords, 'D', 'driver');
                
                showNotification('Your location updated on map', 'success');
            },
            (error) => {
                showNotification('Unable to get your location', 'error');
            }
        );
    } else {
        showNotification('Geolocation not supported', 'error');
    }
}

// Earnings management
function showEarnings() {
    loadEarnings();
    populateEarningsModal();
    document.getElementById('earningsModal').classList.remove('hidden');
}

function loadEarnings() {
    const savedEarnings = localStorage.getItem('dial-a-bakkie-driver-earnings');
    if (savedEarnings) {
        earnings = JSON.parse(savedEarnings);
    }
}

function populateEarningsModal() {
    document.getElementById('earningsToday').textContent = `R${earnings.today}`;
    document.getElementById('earningsWeek').textContent = `R${earnings.week}`;
    document.getElementById('earningsMonth').textContent = `R${earnings.month}`;
    
    const tripList = document.getElementById('earningsTripList');
    tripList.innerHTML = '';
    
    earnings.trips.slice(0, 10).forEach(trip => {
        const tripItem = document.createElement('div');
        tripItem.className = 'trip-item';
        tripItem.innerHTML = `
            <div class="trip-item-info">
                <div class="trip-item-route">${trip.route}</div>
                <div class="trip-item-date">${trip.date}</div>
            </div>
            <div class="trip-item-earnings">R${trip.earnings}</div>
        `;
        tripList.appendChild(tripItem);
    });
}

// Profile management
function showProfile() {
    loadDriverData();
    populateProfileModal();
    document.getElementById('profileModal').classList.remove('hidden');
}

function loadDriverData() {
    const driverData = localStorage.getItem('dial-a-bakkie-driver-data');
    if (driverData) {
        const data = JSON.parse(driverData);
        document.getElementById('driverName').textContent = data.name || 'Driver Name';
        document.getElementById('driverPhone').textContent = data.phone || '+27 82 123 4567';
        document.getElementById('driverEmail').textContent = data.email || 'driver@example.com';
    }
}

function populateProfileModal() {
    const totalTrips = earnings.trips.length;
    document.getElementById('totalTrips').textContent = totalTrips;
    document.getElementById('profileRating').textContent = '4.8 ⭐';
    document.getElementById('memberSince').textContent = 'Jan 2024';
}

// Utility functions
function showSection(sectionId) {
    const sections = ['statusSection', 'requestSection', 'tripSection'];
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (id === sectionId) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideInFromRight 0.3s ease;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutToRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInFromRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutToRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(notificationStyles);
