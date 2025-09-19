/**
 * Simulated Driver Tracking System for Dial a Bakkie
 * Clean, predictable driver journey simulation
 */

class SimulatedTracking {
    constructor() {
        this.isActive = false;
        this.currentStep = 0;
        this.totalSteps = 100;
        this.updateInterval = null;
        this.subscribers = new Set();
        this.tripPhase = 'approaching'; // approaching, arrived, loading, traveling, arrived_destination
        
        // Predefined journey stages
        this.journeyStages = [
            { phase: 'approaching', duration: 30, message: 'Driver is on the way to pickup location' },
            { phase: 'arrived', duration: 5, message: 'Driver has arrived at pickup location' },
            { phase: 'loading', duration: 10, message: 'Loading your items' },
            { phase: 'traveling', duration: 45, message: 'En route to destination' },
            { phase: 'arrived_destination', duration: 10, message: 'Arrived at destination' }
        ];
        
        this.currentStage = 0;
        this.stageProgress = 0;
        
        this.init();
    }

    init() {
        console.log('Simulated tracking system initialized');
    }

    startTracking(pickupLocation, dropoffLocation) {
        if (this.isActive) {
            console.log('Tracking already active');
            return;
        }

        console.log('Starting simulated driver tracking...');
        
        this.isActive = true;
        this.currentStep = 0;
        this.currentStage = 0;
        this.stageProgress = 0;
        this.tripPhase = 'approaching';
        
        // Start the simulation
        this.updateInterval = setInterval(() => {
            this.updateSimulation();
        }, 2000); // Update every 2 seconds
        
        this.notifySubscribers('tracking_started', {
            pickup: pickupLocation,
            dropoff: dropoffLocation,
            timestamp: Date.now()
        });
    }

    stopTracking() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        this.isActive = false;
        console.log('Simulated tracking stopped');
        this.notifySubscribers('tracking_stopped', { timestamp: Date.now() });
    }

    updateSimulation() {
        if (!this.isActive) return;

        const currentStageData = this.journeyStages[this.currentStage];
        if (!currentStageData) {
            this.completeJourney();
            return;
        }

        // Update stage progress
        this.stageProgress++;
        
        // Calculate overall progress
        let totalProgress = 0;
        for (let i = 0; i < this.currentStage; i++) {
            totalProgress += this.journeyStages[i].duration;
        }
        totalProgress += this.stageProgress;
        
        const totalDuration = this.journeyStages.reduce((sum, stage) => sum + stage.duration, 0);
        const progressPercentage = Math.min(100, (totalProgress / totalDuration) * 100);

        // Generate realistic data based on current stage
        const simulatedData = this.generateStageData(currentStageData, progressPercentage);
        
        // Move to next stage if current one is complete
        if (this.stageProgress >= currentStageData.duration) {
            this.currentStage++;
            this.stageProgress = 0;
            
            if (this.currentStage < this.journeyStages.length) {
                this.tripPhase = this.journeyStages[this.currentStage].phase;
                this.notifySubscribers('stage_changed', {
                    stage: this.currentStage,
                    phase: this.tripPhase,
                    message: this.journeyStages[this.currentStage].message
                });
            }
        }

        // Notify subscribers with updated data
        this.notifySubscribers('position_update', simulatedData);
    }

    generateStageData(stageData, overallProgress) {
        const now = Date.now();
        
        // Base data that changes based on stage
        let speed = 0;
        let eta = 0;
        let distance = 0;
        let status = stageData.message;
        
        switch (stageData.phase) {
            case 'approaching':
                speed = 35 + Math.sin(now / 10000) * 10; // 25-45 km/h with variation
                eta = Math.max(1, Math.round(15 - (overallProgress * 0.15)));
                distance = eta * 0.5; // Rough distance calculation
                break;
                
            case 'arrived':
                speed = 0;
                eta = 0;
                distance = 0;
                status = 'Driver has arrived - please come outside';
                break;
                
            case 'loading':
                speed = 0;
                eta = 0;
                distance = 0;
                status = `Loading items... (${Math.round((this.stageProgress / stageData.duration) * 100)}% complete)`;
                break;
                
            case 'traveling':
                speed = 45 + Math.sin(now / 8000) * 15; // 30-60 km/h highway speeds
                const remainingProgress = 100 - overallProgress;
                eta = Math.max(1, Math.round(remainingProgress * 0.3));
                distance = eta * 0.7;
                break;
                
            case 'arrived_destination':
                speed = 0;
                eta = 0;
                distance = 0;
                status = 'Arrived at destination - unloading items';
                break;
        }

        return {
            phase: stageData.phase,
            speed: Math.round(speed),
            eta: eta,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal
            status: status,
            progress: Math.round(overallProgress),
            timestamp: now,
            accuracy: 'High', // Always show good accuracy for simulation
            lastUpdated: 'Just now'
        };
    }

    completeJourney() {
        this.notifySubscribers('journey_complete', {
            message: 'Trip completed successfully!',
            timestamp: Date.now()
        });
        
        setTimeout(() => {
            this.stopTracking();
        }, 3000);
    }

    // Subscribe to tracking updates
    subscribe(callback) {
        this.subscribers.add(callback);
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

    // Get current status
    getStatus() {
        if (!this.isActive) {
            return {
                isActive: false,
                message: 'Tracking not active'
            };
        }

        const currentStageData = this.journeyStages[this.currentStage];
        return {
            isActive: true,
            phase: this.tripPhase,
            stage: this.currentStage + 1,
            totalStages: this.journeyStages.length,
            message: currentStageData ? currentStageData.message : 'Journey complete',
            progress: Math.round((this.currentStep / this.totalSteps) * 100)
        };
    }

    // Manual control functions for testing
    skipToNextStage() {
        if (this.currentStage < this.journeyStages.length - 1) {
            this.currentStage++;
            this.stageProgress = 0;
            this.tripPhase = this.journeyStages[this.currentStage].phase;
            console.log(`Skipped to stage: ${this.tripPhase}`);
        }
    }

    setStage(stageIndex) {
        if (stageIndex >= 0 && stageIndex < this.journeyStages.length) {
            this.currentStage = stageIndex;
            this.stageProgress = 0;
            this.tripPhase = this.journeyStages[stageIndex].phase;
            console.log(`Set to stage: ${this.tripPhase}`);
        }
    }
}

// Create global instance
let simulatedTracking;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    simulatedTracking = new SimulatedTracking();
    console.log('Simulated tracking system ready');
});