// Enhanced Driver Dashboard JavaScript

// Authentication
function signOut() {
    // Clear authentication
    StorageUtil.clearAuth();

    // Stop any active timers
    stopOnlineTimer();

    // Redirect to login page
    window.location.href = '../index.html';
}

// Global variables
let isOnline = false;
let currentRequest = null;
let currentTrip = null;
let requestTimer = null;
let onlineTimer = null;
let hoursOnline = 0;
let minutesOnline = 0;
let earnings = {
    today: 0,
    week: 2450,
    month: 8750,
    total: 15420,
    trips: []
};

// Driver statistics
let driverStats = {
    todayTrips: 0,
    weeklyTrips: 12,
    totalTrips: 247,
    rating: 4.8,
    completionRate: 95
};

// Notifications system
let notifications = [
    {
        id: 1,
        title: 'Vehicle Maintenance Due',
        message: 'Your vehicle service is due in 2 weeks. Please schedule maintenance.',
        time: '2 hours ago',
        unread: true,
        type: 'warning'
    },
    {
        id: 2,
        title: 'Payment Processed',
        message: 'Your weekly earnings of R2,450 have been deposited.',
        time: '1 day ago',
        unread: true,
        type: 'success'
    },
    {
        id: 3,
        title: 'New Feature Available',
        message: 'Try our new navigation helper for better route optimization.',
        time: '3 days ago',
        unread: false,
        type: 'info'
    }
];

// Initialize the driver dashboard
document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    loadDriverData();
    updateDashboard();
    populateEarningsHistory();
    updateNotificationBadge();

    // Initialize chat system
    setTimeout(() => {
        if (typeof Chat !== 'undefined') {
            console.log('Chat system initialized successfully');
        } else {
            console.error('Chat system failed to initialize');
        }
    }, 1000);

    // Simulate incoming requests when online
    setInterval(() => {
        if (isOnline && !currentRequest && !currentTrip) {
            if (Math.random() < 0.2) { // 20% chance every 15 seconds
                simulateIncomingRequest();
            }
        }
    }, 15000);

    // Update current speed simulation
    setInterval(updateNavigationInfo, 5000);
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
        themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
    }
}

// Driver status management
function toggleStatus() {
    isOnline = !isOnline;
    updateStatusDisplay();

    if (isOnline) {
        showNotification('You are now online and ready to receive requests!', 'success');
        startOnlineTimer();
    } else {
        showNotification('You are now offline', 'info');
        stopOnlineTimer();
        if (currentRequest) {
            declineRequest();
        }
    }
}

function updateStatusDisplay() {
    const statusToggle = document.getElementById('statusToggle');
    const statusText = statusToggle.querySelector('.status-text');

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

function startOnlineTimer() {
    onlineTimer = setInterval(() => {
        minutesOnline++;
        if (minutesOnline >= 60) {
            hoursOnline++;
            minutesOnline = 0;
        }
        updateOnlineTime();
    }, 60000); // Update every minute
}

function stopOnlineTimer() {
    if (onlineTimer) {
        clearInterval(onlineTimer);
    }
}

function updateOnlineTime() {
    const hoursOnlineEl = document.getElementById('hoursOnline');
    if (hoursOnlineEl) {
        hoursOnlineEl.textContent = `${hoursOnline}h ${minutesOnline}m`;
    }
}

// Request management
function simulateIncomingRequest() {
    const sampleRequests = [
        {
            id: 'REQ' + Date.now(),
            customer: {
                name: 'Sarah Johnson',
                phone: '+27 82 123 4567',
                rating: 4.9
            },
            pickup: {
                address: '123 Main Street, Johannesburg',
                coords: [-26.2041, 28.0473],
                time: 'Now'
            },
            dropoff: {
                address: '456 Oak Avenue, Sandton',
                coords: [-26.1076, 28.0567],
                time: '+25 min'
            },
            distance: 12.5,
            duration: 25,
            vehicle: 'Bakkie',
            fare: 185
        },
        {
            id: 'REQ' + Date.now(),
            customer: {
                name: 'Mike Chen',
                phone: '+27 83 987 6543',
                rating: 4.7
            },
            pickup: {
                address: '789 Pine Road, Pretoria',
                coords: [-25.7479, 28.2293],
                time: 'Now'
            },
            dropoff: {
                address: '321 Elm Street, Centurion',
                coords: [-25.8603, 28.1892],
                time: '+18 min'
            },
            distance: 8.2,
            duration: 18,
            vehicle: 'Van',
            fare: 220
        },
        {
            id: 'REQ' + Date.now(),
            customer: {
                name: 'Nomsa Dlamini',
                phone: '+27 84 555 7890',
                rating: 4.8
            },
            pickup: {
                address: '15 Long Street, Cape Town',
                coords: [-33.9249, 18.4241],
                time: 'Now'
            },
            dropoff: {
                address: '88 Kloof Street, Gardens',
                coords: [-33.9308, 18.4194],
                time: '+15 min'
            },
            distance: 6.3,
            duration: 15,
            vehicle: 'Bakkie',
            fare: 145
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
    document.getElementById('customerRating').textContent = `${request.customer.rating} ⭐`;
    document.getElementById('pickupAddress').textContent = request.pickup.address;
    document.getElementById('pickupTime').textContent = request.pickup.time;
    document.getElementById('dropoffAddress').textContent = request.dropoff.address;
    document.getElementById('dropoffTime').textContent = request.dropoff.time;
    document.getElementById('tripDistance').textContent = `${request.distance} km`;
    document.getElementById('tripDuration').textContent = `${request.duration} min`;
    document.getElementById('tripVehicle').textContent = request.vehicle;
    document.getElementById('tripFare').textContent = `R${request.fare}`;

    // Show request section
    showSection('requestSection');

    // Start countdown timer
    startRequestTimer();

    // Show notification and play sound if available
    showNotification('New trip request received!', 'info');
    playNotificationSound();
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

    // Store fare before creating trip
    const fareAmount = currentRequest.fare;

    currentTrip = {
        ...currentRequest,
        status: 'en-route',
        startTime: new Date()
    };

    // Enable chat after accepting request
    if (typeof Chat !== 'undefined') {
        const tripId = 'trip_' + Date.now();
        Chat.setChatId(tripId);
    }

    currentRequest = null;
    showSection('tripSection');
    updateTripStatus('En Route to Pickup');

    // Update trip counter
    driverStats.todayTrips++;
    updateDashboard();

    showNotification('Request accepted! Navigate to pickup location.', 'success');
}

function declineRequest() {
    if (currentRequest) {
        clearInterval(requestTimer);
        currentRequest = null;
        showSection('dashboardSection');
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

    // Update current location title
    document.getElementById('currentLocationTitle').textContent = 'Destination';

    showNotification('Trip started! Drive safely to destination.', 'success');
}

function completeTrip() {
    if (!currentTrip) return;

    const fareAmount = currentTrip.fare;

    // Add to earnings
    earnings.today += fareAmount;
    earnings.week += fareAmount;
    earnings.month += fareAmount;
    earnings.total += fareAmount;

    // Add to trip history
    earnings.trips.unshift({
        id: currentTrip.id,
        route: `${currentTrip.pickup.address.substring(0, 20)}... → ${currentTrip.dropoff.address.substring(0, 20)}...`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        earnings: fareAmount
    });

    // Keep only last 20 trips
    if (earnings.trips.length > 20) {
        earnings.trips = earnings.trips.slice(0, 20);
    }

    // Save earnings
    localStorage.setItem('dial-a-bakkie-driver-earnings', JSON.stringify(earnings));

    // Update dashboard
    updateDashboard();

    // Close chat when trip is completed
    if (typeof Chat !== 'undefined') {
        setTimeout(() => {
            const chatContainer = document.getElementById('chat-container');
            if (chatContainer && chatContainer.classList.contains('visible')) {
                chatContainer.classList.remove('visible');
            }
        }, 3000); // Allow time for completion messages
    }

    // Reset trip state
    currentTrip = null;

    // Reset button states
    document.getElementById('pickupBtn').disabled = false;
    document.getElementById('startTripBtn').disabled = true;
    document.getElementById('completeTripBtn').disabled = true;
    document.getElementById('currentLocationTitle').textContent = 'Customer Location';

    showSection('dashboardSection');
    showNotification(`Trip completed! You earned R${fareAmount}`, 'success');
}

function updateTripStatus(status) {
    const statusEl = document.getElementById('tripStatus');
    if (statusEl) {
        statusEl.textContent = status;
    }
}

// Emergency and customer contact functions
function emergencyAlert() {
    if (confirm('Are you sure you want to send an emergency alert? This will notify emergency services and Dial-a-Bakkie support.')) {
        showNotification('Emergency alert sent! Help is on the way.', 'success');
        // In a real app, this would contact emergency services
    }
}

function callCustomer() {
    if (currentRequest) {
        showNotification(`Calling ${currentRequest.customer.name}...`, 'info');
        // In a real app, this would initiate a phone call
    }
}

function messageCustomer() {
    if (currentRequest) {
        showNotification(`Opening message to ${currentRequest.customer.name}...`, 'info');
        // In a real app, this would open a messaging interface
    }
}

// Navigation functions
function getCurrentLocation() {
    if (navigator.geolocation) {
        showNotification('Getting your location...', 'info');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Store coordinates for potential future use
                const coords = [position.coords.latitude, position.coords.longitude];
                console.log('Location updated:', coords);
                showNotification('Location updated successfully!', 'success');

                // Update navigation info
                updateNavigationInfo();
            },
            (error) => {
                console.error('Geolocation error:', error);
                showNotification('Unable to get your location. Please check GPS settings.', 'error');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    } else {
        showNotification('Geolocation not supported by your browser', 'error');
    }
}

function openGoogleMaps() {
    if (currentTrip) {
        const destination = encodeURIComponent(currentTrip.dropoff.address);
        const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
        showNotification('Opening Google Maps...', 'info');
        window.open(url, '_blank');
    } else {
        showNotification('No active trip to navigate to', 'info');
    }
}

function openWaze() {
    if (currentTrip) {
        const coords = currentTrip.dropoff.coords;
        const url = `https://waze.com/ul?ll=${coords[0]},${coords[1]}&navigate=yes`;
        showNotification('Opening Waze...', 'info');
        window.open(url, '_blank');
    } else {
        showNotification('No active trip to navigate to', 'info');
    }
}

function updateNavigationInfo() {
    // Simulate navigation data updates
    const speeds = [0, 25, 45, 60, 80, 120];
    const currentSpeed = isOnline ? speeds[Math.floor(Math.random() * speeds.length)] : 0;

    const speedEl = document.getElementById('currentSpeed');
    if (speedEl) {
        speedEl.textContent = currentSpeed;
    }

    const trafficConditions = ['Good', 'Moderate', 'Heavy', 'Excellent'];
    const trafficEl = document.getElementById('trafficStatus');
    if (trafficEl) {
        trafficEl.textContent = trafficConditions[Math.floor(Math.random() * trafficConditions.length)];
    }

    const weatherConditions = ['Sunny', 'Cloudy', 'Rainy', 'Clear'];
    const weatherEl = document.getElementById('weatherStatus');
    if (weatherEl) {
        weatherEl.textContent = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    }

    if (currentTrip) {
        const distanceEl = document.getElementById('distanceToNext');
        if (distanceEl) {
            const distance = (Math.random() * 10 + 0.5).toFixed(1);
            distanceEl.textContent = `${distance}km`;
        }
    }
}

// Dashboard and data management
function updateDashboard() {
    // Update today's stats
    document.getElementById('todayTrips').textContent = driverStats.todayTrips;
    document.getElementById('todayEarnings').textContent = `R${earnings.today}`;
    document.getElementById('driverRating').textContent = `${driverStats.rating} ⭐`;

    // Update quick stats
    document.getElementById('weeklyTrips').textContent = driverStats.weeklyTrips + driverStats.todayTrips;
    document.getElementById('avgRating').textContent = driverStats.rating;
    document.getElementById('completionRate').textContent = `${driverStats.completionRate}%`;
    document.getElementById('totalEarnings').textContent = `R${earnings.total.toLocaleString()}`;
}

function loadDriverData() {
    // Load saved earnings
    const savedEarnings = localStorage.getItem('dial-a-bakkie-driver-earnings');
    if (savedEarnings) {
        const loaded = JSON.parse(savedEarnings);
        earnings = { ...earnings, ...loaded };
    }

    // Load driver stats
    const savedStats = localStorage.getItem('dial-a-bakkie-driver-stats');
    if (savedStats) {
        const loaded = JSON.parse(savedStats);
        driverStats = { ...driverStats, ...loaded };
    }
}

function saveDriverData() {
    localStorage.setItem('dial-a-bakkie-driver-earnings', JSON.stringify(earnings));
    localStorage.setItem('dial-a-bakkie-driver-stats', JSON.stringify(driverStats));
}

// Modal management functions
function showEarnings() {
    populateEarningsModal();
    document.getElementById('earningsModal').classList.remove('hidden');
}

function populateEarningsModal() {
    document.getElementById('earningsToday').textContent = `R${earnings.today}`;
    document.getElementById('earningsWeek').textContent = `R${earnings.week}`;
    document.getElementById('earningsMonth').textContent = `R${earnings.month}`;

    const tripList = document.getElementById('earningsTripList');
    tripList.innerHTML = '';

    if (earnings.trips.length === 0) {
        tripList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">No recent trips</div>';
        return;
    }

    earnings.trips.slice(0, 10).forEach(trip => {
        const tripItem = document.createElement('div');
        tripItem.className = 'trip-item';
        tripItem.innerHTML = `
            <div class="trip-item-info">
                <div class="trip-item-route">${trip.route}</div>
                <div class="trip-item-date">${trip.date} ${trip.time || ''}</div>
            </div>
            <div class="trip-item-earnings">R${trip.earnings}</div>
        `;
        tripList.appendChild(tripItem);
    });
}

function populateEarningsHistory() {
    // Add some sample trip history if none exists
    if (earnings.trips.length === 0) {
        const sampleTrips = [
            { id: 'T001', route: 'Sandton → Rosebank', date: '2024-01-08', time: '14:30', earnings: 150 },
            { id: 'T002', route: 'Johannesburg CBD → Soweto', date: '2024-01-08', time: '12:45', earnings: 180 },
            { id: 'T003', route: 'Pretoria → Centurion', date: '2024-01-07', time: '16:20', earnings: 220 },
            { id: 'T004', route: 'Cape Town → Stellenbosch', date: '2024-01-07', time: '09:15', earnings: 280 },
            { id: 'T005', route: 'Durban → Pinetown', date: '2024-01-06', time: '11:30', earnings: 195 }
        ];
        earnings.trips = sampleTrips;
    }
}

function showProfile() {
    populateProfileModal();
    document.getElementById('profileModal').classList.remove('hidden');
}

function populateProfileModal() {
    document.getElementById('totalTrips').textContent = driverStats.totalTrips + driverStats.todayTrips;
    document.getElementById('profileRating').textContent = `${driverStats.rating} ⭐`;
}

function showNotifications() {
    populateNotificationsModal();
    document.getElementById('notificationsModal').classList.remove('hidden');

    // Mark all as read
    notifications.forEach(notif => notif.unread = false);
    updateNotificationBadge();
}

function populateNotificationsModal() {
    const notificationList = document.getElementById('notificationList');
    notificationList.innerHTML = '';

    notifications.forEach(notification => {
        const notifItem = document.createElement('div');
        notifItem.className = `notification-item ${notification.unread ? 'unread' : ''}`;
        notifItem.innerHTML = `
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${notification.time}</div>
        `;
        notificationList.appendChild(notifItem);
    });
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    const unreadCount = notifications.filter(n => n.unread).length;

    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function showSupport() {
    document.getElementById('supportModal').classList.remove('hidden');
}

function callSupport() {
    showNotification('Connecting to support... Please hold.', 'info');
    // In a real app, this would initiate a call to support
}

function reportIssue() {
    showNotification('Issue reporting form opened', 'info');
    // In a real app, this would open an issue reporting form
}

function showFAQ() {
    showNotification('Opening FAQ section...', 'info');
    // In a real app, this would navigate to FAQ page
}

// Utility functions
function showSection(sectionId) {
    const sections = ['dashboardSection', 'requestSection', 'tripSection'];
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            if (id === sectionId) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        }
    });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `toast-notification toast-${type}`;
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
        z-index: 2000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideInFromRight 0.3s ease;
        cursor: pointer;
    `;

    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    // Add click to dismiss
    notification.onclick = () => {
        notification.style.animation = 'slideOutToRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    };

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutToRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

function playNotificationSound() {
    // Create and play notification sound
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            const context = new AudioContextClass();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);

            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.3);
        }
    } catch (e) {
        // Silently fail if audio isn't supported
        console.log('Audio notification not supported');
    }
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
    
    .toast-notification {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
`;
document.head.appendChild(notificationStyles);

// Save data periodically
setInterval(() => {
    if (isOnline) {
        saveDriverData();
    }
}, 30000); // Save every 30 seconds when online

// Handle page unload
window.addEventListener('beforeunload', function () {
    saveDriverData();
});

// Handle offline/online events
window.addEventListener('online', function () {
    showNotification('Internet connection restored', 'success');
});

window.addEventListener('offline', function () {
    showNotification('No internet connection - working offline', 'warning');
});

// Chat Functions for Driver
function startDriverChat() {
    // Check if Chat system is available
    if (typeof Chat === 'undefined') {
        showNotification('Chat system not available', 'error');
        return;
    }

    let customerName = 'Customer';
    let tripId = 'trip_' + Date.now();

    // Get customer name from current request or trip
    if (currentRequest && currentRequest.customer) {
        customerName = currentRequest.customer.name;
    } else if (currentTrip && currentTrip.customer) {
        customerName = currentTrip.customer.name;
    }

    // Set chat ID and open chat
    Chat.setChatId(tripId);
    
    // Open the chat by triggering the toggle
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    if (chatToggleBtn) {
        chatToggleBtn.click();
    }
    
    showNotification(`Chat opened with ${customerName}`, 'success');
}

// Override the existing messageCustomer function to include chat
function messageCustomer() {
    startDriverChat();
}

// Debug function to check chat system status
// Debug function to check chat system status
function debugChatStatus() {
    console.log('=== Chat Debug Info ===');
    console.log('Chat available:', typeof Chat !== 'undefined');
    console.log('currentRequest:', currentRequest);
    console.log('currentTrip:', currentTrip);
    console.log('======================');
}
//Service Management Functions
let driverServices = {
    'bakkie-go': true,
    'bakkie-xl': true,
    'assist': false,
    'truck': false,
    'moto': false,
    'courier': false
};

function showServiceSettings() {
    document.getElementById('serviceSettingsModal').classList.remove('hidden');
}

function toggleService(serviceType) {
    driverServices[serviceType] = !driverServices[serviceType];
    updateServiceTags();
    saveDriverServices();
    
    showNotification(`${serviceType} service ${driverServices[serviceType] ? 'enabled' : 'disabled'}`, 'success');
}

function updateServiceTags() {
    const serviceTagsContainer = document.querySelector('.service-tags');
    serviceTagsContainer.innerHTML = '';
    
    const serviceNames = {
        'bakkie-go': 'Bakkie Go',
        'bakkie-xl': 'Bakkie XL',
        'assist': 'Assist',
        'truck': 'Truck',
        'moto': 'Moto',
        'courier': 'Courier'
    };
    
    Object.keys(driverServices).forEach(service => {
        if (serviceNames[service]) {
            const tag = document.createElement('span');
            tag.className = `service-tag ${driverServices[service] ? 'active' : 'inactive'}`;
            tag.textContent = serviceNames[service];
            serviceTagsContainer.appendChild(tag);
        }
    });
}

function saveDriverServices() {
    localStorage.setItem('dial-a-bakkie-driver-services', JSON.stringify(driverServices));
}

function loadDriverServices() {
    const saved = localStorage.getItem('dial-a-bakkie-driver-services');
    if (saved) {
        driverServices = { ...driverServices, ...JSON.parse(saved) };
    }
    updateServiceTags();
}

function applyForAssist() {
    showNotification('Application for Assist service submitted! We\'ll contact you within 24 hours.', 'success');
    closeModal('serviceSettingsModal');
}

// Enhanced request simulation with service matching
function simulateIncomingRequest() {
    // Only show requests for services the driver offers
    const availableServices = Object.keys(driverServices).filter(service => driverServices[service]);
    
    if (availableServices.length === 0) {
        return; // No services enabled
    }
    
    const randomService = availableServices[Math.floor(Math.random() * availableServices.length)];
    
    const serviceRequests = {
        'bakkie-go': [
            {
                id: 'REQ' + Date.now(),
                service: 'Bakkie Go',
                customer: { name: 'Sarah Johnson', phone: '+27 82 123 4567', rating: 4.9 },
                pickup: { address: '123 Main Street, Johannesburg', time: 'Now' },
                dropoff: { address: '456 Oak Avenue, Sandton', time: '+25 min' },
                distance: 12.5, duration: 25, fare: 85,
                cargo: { type: 'Furniture', weight: 'Medium', help: false }
            }
        ],
        'bakkie-xl': [
            {
                id: 'REQ' + Date.now(),
                service: 'Bakkie XL',
                customer: { name: 'Mike Chen', phone: '+27 83 987 6543', rating: 4.7 },
                pickup: { address: '789 Pine Road, Pretoria', time: 'Now' },
                dropoff: { address: '321 Elm Street, Centurion', time: '+30 min' },
                distance: 15.2, duration: 30, fare: 145,
                cargo: { type: 'Appliances', weight: 'Heavy', help: false }
            }
        ],
        'assist': [
            {
                id: 'REQ' + Date.now(),
                service: 'Assist',
                customer: { name: 'Nomsa Dlamini', phone: '+27 84 555 7890', rating: 4.8 },
                pickup: { address: '15 Long Street, Cape Town', time: 'Now' },
                dropoff: { address: '88 Kloof Street, Gardens', time: '+20 min' },
                distance: 8.3, duration: 20, fare: 125,
                cargo: { type: 'Furniture', weight: 'Heavy', help: true }
            }
        ]
    };
    
    const requests = serviceRequests[randomService];
    if (requests && requests.length > 0) {
        const request = requests[0];
        showEnhancedRequest(request);
    }
}

function showEnhancedRequest(request) {
    currentRequest = request;

    // Populate request details with enhanced information
    document.getElementById('customerName').textContent = request.customer.name;
    document.getElementById('customerPhone').textContent = request.customer.phone;
    document.getElementById('customerRating').textContent = `${request.customer.rating} ⭐`;
    document.getElementById('pickupAddress').textContent = request.pickup.address;
    document.getElementById('pickupTime').textContent = request.pickup.time;
    document.getElementById('dropoffAddress').textContent = request.dropoff.address;
    document.getElementById('dropoffTime').textContent = request.dropoff.time;
    document.getElementById('tripDistance').textContent = `${request.distance} km`;
    document.getElementById('tripDuration').textContent = `${request.duration} min`;
    document.getElementById('tripVehicle').textContent = request.service;
    document.getElementById('tripFare').textContent = `R${request.fare}`;

    // Add cargo information if available
    if (request.cargo) {
        const cargoInfo = document.createElement('div');
        cargoInfo.className = 'cargo-info';
        cargoInfo.innerHTML = `
            <div class="cargo-details">
                <h4>Cargo Details</h4>
                <div class="cargo-item">
                    <span>Type:</span>
                    <span>${request.cargo.type}</span>
                </div>
                <div class="cargo-item">
                    <span>Weight:</span>
                    <span>${request.cargo.weight}</span>
                </div>
                ${request.cargo.help ? '<div class="cargo-item help-needed"><span>⚠️ Loading help required</span></div>' : ''}
            </div>
        `;
        
        // Insert cargo info after trip summary
        const tripSummary = document.querySelector('.trip-summary');
        if (tripSummary) {
            tripSummary.appendChild(cargoInfo);
        }
    }

    // Show request section
    showSection('requestSection');

    // Start countdown timer
    startRequestTimer();

    // Show notification and play sound if available
    showNotification(`New ${request.service} request received!`, 'info');
    playNotificationSound();
}

// Initialize services on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load saved services
    loadDriverServices();
});// Driver GPS Tracking Functions
let driverTrackingActive = false;
let trackingSubscription = null;

function toggleDriverTracking() {
    if (!liveTracking) {
        showNotification('GPS tracking system not available', 'error');
        return;
    }

    if (driverTrackingActive) {
        stopDriverTracking();
    } else {
        startDriverTracking();
    }
}

function startDriverTracking() {
    if (!liveTracking) return;

    // Request permission first
    if (navigator.permissions) {
        navigator.permissions.query({name: 'geolocation'}).then(function(result) {
            if (result.state === 'denied') {
                showNotification('Location permission denied. Please enable location access.', 'error');
                return;
            }
            
            // Start actual tracking
            liveTracking.startDriverTracking();
            driverTrackingActive = true;
            updateTrackingUI();
            
            // Subscribe to tracking updates
            trackingSubscription = liveTracking.subscribe((event, data) => {
                handleDriverTrackingUpdate(event, data);
            });
            
            showNotification('GPS tracking started successfully!', 'success');
        });
    } else {
        // Fallback for browsers without permissions API
        liveTracking.startDriverTracking();
        driverTrackingActive = true;
        updateTrackingUI();
        
        trackingSubscription = liveTracking.subscribe((event, data) => {
            handleDriverTrackingUpdate(event, data);
        });
        
        showNotification('GPS tracking started!', 'success');
    }
}

function stopDriverTracking() {
    if (liveTracking) {
        liveTracking.stopTracking();
    }
    
    if (trackingSubscription) {
        trackingSubscription();
        trackingSubscription = null;
    }
    
    driverTrackingActive = false;
    updateTrackingUI();
    showNotification('GPS tracking stopped', 'info');
}

function updateTrackingUI() {
    const toggleBtn = document.getElementById('trackingToggle');
    const statusSpan = document.getElementById('trackingStatus');
    
    if (toggleBtn && statusSpan) {
        if (driverTrackingActive) {
            toggleBtn.classList.add('active');
            statusSpan.textContent = 'Stop GPS';
            toggleBtn.style.background = 'var(--success-color)';
        } else {
            toggleBtn.classList.remove('active');
            statusSpan.textContent = 'Start GPS';
            toggleBtn.style.background = '';
        }
    }
}

function handleDriverTrackingUpdate(event, data) {
    switch (event) {
        case 'position_update':
            updateDriverLocationDisplay(data);
            break;
        case 'tracking_started':
            console.log('Driver tracking started');
            break;
        case 'tracking_stopped':
            console.log('Driver tracking stopped');
            break;
        case 'tracking_error':
            showNotification(`GPS Error: ${data.error}`, 'error');
            if (data.code === 1) { // Permission denied
                driverTrackingActive = false;
                updateTrackingUI();
            }
            break;
    }
}

function updateDriverLocationDisplay(data) {
    // Update navigation info with real GPS data
    const speedEl = document.getElementById('currentSpeed');
    if (speedEl && data.speedKmh !== undefined) {
        speedEl.textContent = Math.round(data.speedKmh);
    }
    
    // Update location accuracy indicator
    updateLocationAccuracy(data.accuracy);
    
    // Log position for debugging
    console.log('Driver position updated:', {
        lat: data.latitude.toFixed(6),
        lng: data.longitude.toFixed(6),
        accuracy: Math.round(data.accuracy) + 'm',
        speed: data.speedKmh ? Math.round(data.speedKmh) + ' km/h' : 'Unknown'
    });
}

function updateLocationAccuracy(accuracy) {
    // Create or update accuracy indicator
    let accuracyEl = document.getElementById('locationAccuracy');
    if (!accuracyEl) {
        // Create accuracy indicator
        const navInfo = document.querySelector('.nav-info');
        if (navInfo) {
            const accuracyItem = document.createElement('div');
            accuracyItem.className = 'nav-item';
            accuracyItem.innerHTML = `
                <span class="nav-value" id="locationAccuracy">--</span>
                <span class="nav-label">GPS Accuracy</span>
            `;
            navInfo.appendChild(accuracyItem);
            accuracyEl = document.getElementById('locationAccuracy');
        }
    }
    
    if (accuracyEl && accuracy) {
        accuracyEl.textContent = Math.round(accuracy) + 'm';
        
        // Color code based on accuracy
        if (accuracy <= 5) {
            accuracyEl.style.color = 'var(--success-color)';
        } else if (accuracy <= 15) {
            accuracyEl.style.color = 'var(--primary-color)';
        } else if (accuracy <= 30) {
            accuracyEl.style.color = 'var(--warning-color)';
        } else {
            accuracyEl.style.color = 'var(--error-color)';
        }
    }
}

// Auto-start tracking when driver goes online
const originalToggleStatus = toggleStatus;
toggleStatus = function() {
    originalToggleStatus();
    
    // Auto-start GPS tracking when going online
    if (isOnline && !driverTrackingActive) {
        setTimeout(() => {
            startDriverTracking();
        }, 1000);
    } else if (!isOnline && driverTrackingActive) {
        stopDriverTracking();
    }
};

// Auto-start tracking when accepting a request
const originalAcceptRequestWithTracking = acceptRequest;
acceptRequest = function() {
    originalAcceptRequestWithTracking();
    
    // Ensure tracking is active during trips
    if (!driverTrackingActive) {
        startDriverTracking();
    }
};

// Enhanced getCurrentLocation function
const originalGetCurrentLocation = getCurrentLocation;
getCurrentLocation = function() {
    if (liveTracking) {
        liveTracking.getCurrentPosition()
            .then((position) => {
                showNotification('Location updated successfully!', 'success');
                updateNavigationInfo();
            })
            .catch((error) => {
                showNotification('Unable to get your location. Please check GPS settings.', 'error');
            });
    } else {
        originalGetCurrentLocation();
    }
};

// Initialize tracking on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add tracking initialization
    setTimeout(() => {
        if (typeof liveTracking !== 'undefined') {
            console.log('Driver GPS tracking system ready');
            
            // Load last known position
            const lastPosition = liveTracking.loadLastPosition();
            if (lastPosition) {
                console.log('Loaded last known position:', lastPosition);
            }
        }
    }, 1000);
});