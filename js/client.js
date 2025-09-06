// Mock data
const mockDrivers = [
    {
        id: 1,
        name: 'Thabo Mthembu',
        rating: 4.8,
        vehicle: 'Toyota Hilux',
        plateNumber: 'GP 123 ABC',
        eta: '3-5 mins',
        phone: '+27 82 123 4567'
    },
    {
        id: 2,
        name: 'Sarah Ndlovu',
        rating: 4.9,
        vehicle: 'Ford Ranger',
        plateNumber: 'GP 456 DEF',
        eta: '2-4 mins',
        phone: '+27 83 987 6543'
    }
];

let currentDriver = null;
let estimatedPrice = 0;
let tripStatus = 'idle'; // idle, searching, matched, in-progress

// DOM elements
const pickupInput = document.getElementById('pickupLocation');
const dropoffInput = document.getElementById('dropoffLocation');
const priceEstimate = document.getElementById('priceEstimate');
const priceAmount = document.getElementById('priceAmount');
const requestBtn = document.getElementById('requestBtn');
const btnPrice = document.getElementById('btnPrice');

// Event listeners
pickupInput.addEventListener('input', updatePrice);
dropoffInput.addEventListener('input', updatePrice);

function calculatePrice(pickup, dropoff) {
    if (!pickup || !dropoff) return 0;
    const basePrice = 50;
    const pricePerKm = 15;
    const mockDistance = Math.floor(Math.random() * 20) + 2;
    return basePrice + (mockDistance * pricePerKm);
}

function updatePrice() {
    const pickup = pickupInput.value.trim();
    const dropoff = dropoffInput.value.trim();
    
    if (pickup && dropoff) {
        estimatedPrice = calculatePrice(pickup, dropoff);
        priceAmount.textContent = `R${estimatedPrice}`;
        btnPrice.textContent = estimatedPrice;
        priceEstimate.classList.remove('hidden');
        requestBtn.disabled = false;
    } else {
        priceEstimate.classList.add('hidden');
        requestBtn.disabled = true;
        btnPrice.textContent = '0';
    }
}

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
    }, 3000);
}

function cancelRequest() {
    tripStatus = 'idle';
    currentDriver = null;
    showSection('idle');
}

function startTrip() {
    tripStatus = 'in-progress';
    showSection('in-progress');
    populateDriverCard('progressDriverCard', currentDriver);
    
    // Update trip details
    document.getElementById('tripFrom').textContent = pickupInput.value;
    document.getElementById('tripTo').textContent = dropoffInput.value;
    document.getElementById('tripPrice').textContent = `R${estimatedPrice}`;
}

function showSection(section) {
    // Hide all sections
    document.getElementById('locationCard').style.display = section === 'idle' ? 'block' : 'none';
    document.getElementById('requestBtn').style.display = section === 'idle' ? 'block' : 'none';
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