/**
 * Live GPS Tracking System for Dial a Bakkie
 * Uses browser's Geolocation API - completely free!
 */

class LiveTracking {
    constructor() {
        this.watchId = null;
        this.isTracking = false;
        this.currentPosition = null;
        this.trackingInterval = null;
        this.subscribers = new Set();
        this.trackingHistory = [];
        this.maxHistoryPoints = 50;
        
        // Tracking options
        this.options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000 // 5 seconds
        };
        
        this.init();
    }

    init() {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by this browser');
            return;
        }
        
        console.log('Live tracking system initialized');
    }

    // Start tracking for drivers
    startDriverTracking() {
        if (this.isTracking) {
            console.log('Tracking already active');
            return;
        }

        console.log('Starting driver GPS tracking...');
        
        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.onPositionUpdate(position),
            (error) => this.onPositionError(error),
            this.options
        );
        
        this.isTracking = true;
        this.notifySubscribers('tracking_started', { timestamp: Date.now() });
        
        // Also update position every 10 seconds as backup
        this.trackingInterval = setInterval(() => {
            this.getCurrentPosition();
        }, 10000);
    }

    // Stop tracking
    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }
        
        this.isTracking = false;
        console.log('GPS tracking stopped');
        this.notifySubscribers('tracking_stopped', { timestamp: Date.now() });
    }

    // Get current position once
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.onPositionUpdate(position);
                    resolve(position);
                },
                (error) => {
                    this.onPositionError(error);
                    reject(error);
                },
                this.options
            );
        });
    }

    // Handle position updates
    onPositionUpdate(position) {
        const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp,
            altitude: position.coords.altitude
        };

        this.currentPosition = locationData;
        
        // Add to history
        this.trackingHistory.push(locationData);
        if (this.trackingHistory.length > this.maxHistoryPoints) {
            this.trackingHistory.shift();
        }

        // Calculate additional metrics
        const metrics = this.calculateMetrics(locationData);
        
        console.log('Position updated:', {
            lat: locationData.latitude.toFixed(6),
            lng: locationData.longitude.toFixed(6),
            accuracy: Math.round(locationData.accuracy) + 'm',
            speed: metrics.speedKmh ? Math.round(metrics.speedKmh) + ' km/h' : 'Unknown'
        });

        // Notify all subscribers
        this.notifySubscribers('position_update', {
            ...locationData,
            ...metrics
        });

        // Store in localStorage for persistence
        this.savePosition(locationData);
    }

    // Handle position errors
    onPositionError(error) {
        let message = 'Unknown location error';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location access denied by user';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location information unavailable';
                break;
            case error.TIMEOUT:
                message = 'Location request timed out';
                break;
        }

        console.error('GPS Error:', message);
        this.notifySubscribers('tracking_error', { 
            error: message, 
            code: error.code,
            timestamp: Date.now()
        });
    }

    // Calculate speed, distance, etc.
    calculateMetrics(currentPos) {
        const metrics = {};
        
        // Convert speed from m/s to km/h
        if (currentPos.speed !== null && currentPos.speed !== undefined) {
            metrics.speedKmh = currentPos.speed * 3.6;
        }
        
        // Calculate distance from last position
        if (this.trackingHistory.length > 1) {
            const lastPos = this.trackingHistory[this.trackingHistory.length - 2];
            metrics.distanceFromLast = this.calculateDistance(
                lastPos.latitude, lastPos.longitude,
                currentPos.latitude, currentPos.longitude
            );
            
            // Calculate time difference
            const timeDiff = (currentPos.timestamp - lastPos.timestamp) / 1000; // seconds
            if (timeDiff > 0 && metrics.distanceFromLast > 0) {
                metrics.calculatedSpeed = (metrics.distanceFromLast / timeDiff) * 3.6; // km/h
            }
        }
        
        return metrics;
    }

    // Calculate distance between two points (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // Distance in meters
    }

    // Calculate ETA to destination
    calculateETA(destinationLat, destinationLng) {
        if (!this.currentPosition) return null;
        
        const distance = this.calculateDistance(
            this.currentPosition.latitude,
            this.currentPosition.longitude,
            destinationLat,
            destinationLng
        );
        
        // Use current speed or average city speed (30 km/h)
        const speedKmh = this.currentPosition.speedKmh || 30;
        const speedMs = speedKmh / 3.6;
        
        const etaSeconds = distance / speedMs;
        
        return {
            distanceMeters: distance,
            distanceKm: distance / 1000,
            etaSeconds: etaSeconds,
            etaMinutes: etaSeconds / 60,
            estimatedArrival: new Date(Date.now() + etaSeconds * 1000)
        };
    }

    // Subscribe to tracking updates
    subscribe(callback) {
        this.subscribers.add(callback);
        
        // Send current position if available
        if (this.currentPosition) {
            callback('position_update', this.currentPosition);
        }
        
        return () => this.subscribers.delete(callback);
    }

    // Notify all subscribers
    notifySubscribers(event, data) {
        this.subscribers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Error in tracking subscriber:', error);
            }
        });
    }

    // Save position to localStorage
    savePosition(position) {
        try {
            const trackingData = {
                position: position,
                timestamp: Date.now(),
                isTracking: this.isTracking
            };
            localStorage.setItem('dial-a-bakkie-tracking', JSON.stringify(trackingData));
        } catch (error) {
            console.error('Error saving position:', error);
        }
    }

    // Load last known position
    loadLastPosition() {
        try {
            const saved = localStorage.getItem('dial-a-bakkie-tracking');
            if (saved) {
                const data = JSON.parse(saved);
                // Only use if less than 5 minutes old
                if (Date.now() - data.timestamp < 300000) {
                    this.currentPosition = data.position;
                    return data.position;
                }
            }
        } catch (error) {
            console.error('Error loading position:', error);
        }
        return null;
    }

    // Get tracking status
    getStatus() {
        return {
            isTracking: this.isTracking,
            currentPosition: this.currentPosition,
            accuracy: this.currentPosition?.accuracy,
            lastUpdate: this.currentPosition?.timestamp,
            historyPoints: this.trackingHistory.length,
            subscribers: this.subscribers.size
        };
    }

    // Share live location (generate shareable link)
    generateShareLink(tripId) {
        if (!this.currentPosition) return null;
        
        const shareData = {
            tripId: tripId,
            lat: this.currentPosition.latitude,
            lng: this.currentPosition.longitude,
            timestamp: Date.now(),
            accuracy: this.currentPosition.accuracy
        };
        
        // In a real app, you'd send this to your server and return a shareable URL
        // For demo, we'll create a local URL
        const encodedData = btoa(JSON.stringify(shareData));
        return `${window.location.origin}/track/${encodedData}`;
    }

    // Simulate real-time updates for demo (when no real movement)
    startDemoMode(centerLat = -26.2041, centerLng = 28.0473) {
        console.log('Starting demo tracking mode...');
        
        let angle = 0;
        const radius = 0.01; // ~1km radius
        
        this.demoInterval = setInterval(() => {
            // Simulate movement in a circle
            const lat = centerLat + Math.cos(angle) * radius;
            const lng = centerLng + Math.sin(angle) * radius;
            
            const mockPosition = {
                coords: {
                    latitude: lat,
                    longitude: lng,
                    accuracy: Math.random() * 10 + 5, // 5-15m accuracy
                    speed: Math.random() * 20 + 10, // 10-30 km/h
                    heading: (angle * 180 / Math.PI) % 360,
                    altitude: 1600 + Math.random() * 100
                },
                timestamp: Date.now()
            };
            
            this.onPositionUpdate(mockPosition);
            angle += 0.1; // Move along circle
            
        }, 3000); // Update every 3 seconds
        
        this.isTracking = true;
    }

    stopDemoMode() {
        if (this.demoInterval) {
            clearInterval(this.demoInterval);
            this.demoInterval = null;
        }
    }
}

// Create global instance
let liveTracking;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    liveTracking = new LiveTracking();
    console.log('Live tracking system ready');
});