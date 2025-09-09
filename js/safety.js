// Safety Toolkit Handlers

function openSosModal() {
    document.getElementById('sosModal').classList.remove('hidden');
    const saved = localStorage.getItem('dial-a-bakkie-trusted');
    if (saved) {
        const phone = JSON.parse(saved).phone;
        const input = document.getElementById('trustedPhone');
        if (input && !input.value) input.value = phone;
    }
}

function saveTrustedContact() {
    const phone = document.getElementById('trustedPhone').value.trim();
    if (!phone) {
        alert('Please enter a phone number');
        return;
    }
    localStorage.setItem('dial-a-bakkie-trusted', JSON.stringify({ phone }));
    alert('Trusted contact saved');
}

function sosCall() {
    window.open('tel:112');
}

function sosTextTrusted() {
    const saved = localStorage.getItem('dial-a-bakkie-trusted');
    if (!saved) {
        alert('Please save a trusted contact number first');
        return;
    }
    const { phone } = JSON.parse(saved);
    const pickup = document.getElementById('tripFrom')?.textContent || document.getElementById('pickupLocation')?.value || '';
    const dropoff = document.getElementById('tripTo')?.textContent || document.getElementById('dropoffLocation')?.value || '';
    const text = encodeURIComponent(`Emergency. Trip from ${pickup} to ${dropoff}. Please check on me.`);
    window.open(`sms:${phone}?&body=${text}`);
}

function generateShareLink() {
    const tripId = Date.now();
    const pickup = document.getElementById('pickupLocation')?.value || '';
    const dropoff = document.getElementById('dropoffLocation')?.value || '';
    const base = window.location.origin || 'https://example.com';
    return `${base}/track?trip=${tripId}&from=${encodeURIComponent(pickup)}&to=${encodeURIComponent(dropoff)}`;
}

function openShareModal() {
    const link = generateShareLink();
    const input = document.getElementById('shareLink');
    if (input) input.value = link;
    document.getElementById('shareModal').classList.remove('hidden');
}

function copyShareLink() {
    const input = document.getElementById('shareLink');
    if (!input) return;
    input.select();
    input.setSelectionRange(0, 99999);
    document.execCommand('copy');
    alert('Link copied to clipboard');
}

function shareViaWhatsApp() {
    const input = document.getElementById('shareLink');
    if (!input) return;
    const url = encodeURIComponent(input.value);
    window.open(`https://wa.me/?text=${url}`, '_blank');
}

function openVerifyModal() {
    const nameEl = document.getElementById('verifyName');
    const vehicleEl = document.getElementById('verifyVehicle');
    const plateEl = document.getElementById('verifyPlate');
    const licenseEl = document.getElementById('verifyLicense');
    
    if (typeof currentDriver === 'object' && currentDriver) {
        nameEl.textContent = currentDriver.name || '-';
        vehicleEl.textContent = currentDriver.vehicle || '-';
        plateEl.textContent = currentDriver.plateNumber || '-';
        // Demo: mask license number
        licenseEl.textContent = (currentDriver.licenseNumber || 'DVL-****-****');
    }
    document.getElementById('verifyModal').classList.remove('hidden');
}

function confirmDriverMatch(matches) {
    if (matches) {
        alert('Thanks for confirming. Have a safe trip!');
    } else {
        alert("Details don't match. Please contact support or use SOS.");
    }
    closeModal('verifyModal');
}


