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
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    loadDriverData();
    updateDashboard();
    populateEarningsHistory();
    updateNotificationBadge();
    
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
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
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
                const coords = [position.coords.latitude, position.coords.longitude];
                showNotification('Location updated successfully!', 'success');
                
                // Update navigation info
                updateNavigationInfo();
            },
            (error) => {
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
    const audioContext = window.AudioContext || window.webkitAudioContext;
    if (audioContext) {
        try {
            const context = new audioContext();
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
        } catch (e) {
            // Silently fail if audio isn't supported
        }
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
window.addEventListener('beforeunload', function() {
    saveDriverData();
});

// Handle offline/online events
window.addEventListener('online', function() {
    showNotification('Internet connection restored', 'success');
});

window.addEventListener('offline', function() {
    showNotification('No internet connection - working offline', 'warning');
});// Ch
at Functions for Driver
function startDriverChat() {
    if (currentRequest && realtimeChat) {
        const tripId = 'trip_' + Date.now();
        const customerName = currentRequest.customerName || 'Customer';
        realtimeChat.startChat(tripId, customerName);
    }
}

function messageCustomer() {
    startDriverChat();
}

// Update acceptRequest function to include chat option
const originalAcceptRequest = typeof acceptRequest !== 'undefined' ? acceptRequest : function() {};
acceptRequest = function() {
    if (originalAcceptRequest) {
        originalAcceptRequest();
    }
    
    // Enable chat after accepting request
    if (currentRequest && realtimeChat) {
        const tripId = 'trip_' + Date.now();
        const customerName = currentRequest.customerName || 'Customer';
        realtimeChat.startChat(tripId, customerName);
    }
};

// Update completeTrip function to end chat
const originalCompleteTrip = typeof completeTrip !== 'undefined' ? completeTrip : function() {};
completeTrip = function() {
    if (originalCompleteTrip) {
        originalCompleteTrip();
    }
    
    // End chat when trip is completed
    if (realtimeChat) {
        setTimeout(() => {
            realtimeChat.endChat();
        }, 3000); // Allow time for completion messages
    }
};

// Mock current request for demo
if (!currentRequest) {
    currentRequest = {
        customerName: 'John Doe',
        customerPhone: '+27 82 123 4567',
        customerRating: 4.9
    };
}