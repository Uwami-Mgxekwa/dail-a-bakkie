let selectedRole = 'customer';

// Authentication
function signOut() {
    // Clear authentication
    StorageUtil.clearAuth();
    
    // Redirect to login page
    window.location.href = '../index.html';
}

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

function selectRole(role) {
    selectedRole = role;
    document.querySelectorAll('.role-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`[data-role="${role}"]`).classList.add('active');
    
    // Show/hide driver-specific fields
    const driverFields = document.getElementById('driverFields');
    if (role === 'driver') {
        driverFields.classList.remove('hidden');
        // Make driver fields required
        document.getElementById('vehicleType').required = true;
        document.getElementById('licenseNumber').required = true;
    } else {
        driverFields.classList.add('hidden');
        // Make driver fields not required
        document.getElementById('vehicleType').required = false;
        document.getElementById('licenseNumber').required = false;
    }
}

function showMessage(type, message) {
    const errorEl = document.getElementById('errorMessage');
    const successEl = document.getElementById('successMessage');
    
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    
    if (type === 'error') {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    } else if (type === 'success') {
        successEl.textContent = message;
        successEl.style.display = 'block';
    }
    
    setTimeout(() => {
        errorEl.style.display = 'none';
        successEl.style.display = 'none';
    }, 5000);
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    // South African phone number validation (basic)
    const phoneRegex = /^(\+27|0)[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

function validatePassword(password) {
    // At least 6 characters, at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
    return passwordRegex.test(password);
}

function validateForm() {
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;
    
    // Check if email already exists (simulate with hardcoded values)
    const existingEmails = ['vint@example.com', 'owami@gmail.com'];
    
    if (!fullName) {
        showMessage('error', 'Please enter your full name');
        return false;
    }
    
    if (fullName.length < 2) {
        showMessage('error', 'Full name must be at least 2 characters long');
        return false;
    }
    
    if (!email) {
        showMessage('error', 'Please enter your email address');
        return false;
    }
    
    if (!validateEmail(email)) {
        showMessage('error', 'Please enter a valid email address');
        return false;
    }
    
    if (existingEmails.includes(email.toLowerCase())) {
        showMessage('error', 'An account with this email already exists. Please use a different email or sign in.');
        return false;
    }
    
    if (!phone) {
        showMessage('error', 'Please enter your phone number');
        return false;
    }
    
    if (!validatePhone(phone)) {
        showMessage('error', 'Please enter a valid South African phone number (e.g., 0123456789 or +27123456789)');
        return false;
    }
    
    if (!password) {
        showMessage('error', 'Please enter a password');
        return false;
    }
    
    if (!validatePassword(password)) {
        showMessage('error', 'Password must be at least 6 characters long and contain at least one letter and one number');
        return false;
    }
    
    if (password !== confirmPassword) {
        showMessage('error', 'Passwords do not match');
        return false;
    }
    
    if (!terms) {
        showMessage('error', 'Please accept the Terms and Conditions to continue');
        return false;
    }
    
    // Driver-specific validation
    if (selectedRole === 'driver') {
        const vehicleType = document.getElementById('vehicleType').value;
        const licenseNumber = document.getElementById('licenseNumber').value.trim();
        
        if (!vehicleType) {
            showMessage('error', 'Please select your vehicle type');
            return false;
        }
        
        if (!licenseNumber) {
            showMessage('error', 'Please enter your driver\'s license number');
            return false;
        }
        
        if (licenseNumber.length < 5) {
            showMessage('error', 'Please enter a valid driver\'s license number');
            return false;
        }
    }
    
    return true;
}

function handleSignup() {
    if (!validateForm()) return;
    
    const container = document.querySelector('.container');
    container.classList.add('loading');
    
    // Simulate API call
    setTimeout(() => {
        container.classList.remove('loading');
        
        const fullName = document.getElementById('fullName').value.trim();
        showMessage('success', `Welcome ${fullName}! Your ${selectedRole} account has been created successfully.`);
        
        setTimeout(() => {
            if (selectedRole === 'customer') {
                window.location.href = 'client.html';
            } else {
                // For drivers, redirect to a driver dashboard or back to login
                window.location.href = '../index.html';
            }
        }, 2000);
        
    }, 1500);
}

function goToLogin() {
    window.location.href = '../index.html';
}

function showTerms() {
    showMessage('success', 'Terms and Conditions: By using Dial a Bakkie, you agree to our terms of service. This is a demo application.');
}

function showPrivacy() {
    showMessage('success', 'Privacy Policy: We respect your privacy and protect your personal information. This is a demo application.');
}

// Real-time validation
function setupRealTimeValidation() {
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    emailInput.addEventListener('blur', function() {
        const email = this.value.trim();
        if (email && !validateEmail(email)) {
            this.style.borderColor = 'var(--button-danger)';
        } else {
            this.style.borderColor = 'var(--border-color)';
        }
    });
    
    phoneInput.addEventListener('blur', function() {
        const phone = this.value.trim();
        if (phone && !validatePhone(phone)) {
            this.style.borderColor = 'var(--button-danger)';
        } else {
            this.style.borderColor = 'var(--border-color)';
        }
    });
    
    passwordInput.addEventListener('blur', function() {
        const password = this.value;
        if (password && !validatePassword(password)) {
            this.style.borderColor = 'var(--button-danger)';
        } else {
            this.style.borderColor = 'var(--border-color)';
        }
    });
    
    confirmPasswordInput.addEventListener('blur', function() {
        const password = document.getElementById('password').value;
        const confirmPassword = this.value;
        if (confirmPassword && password !== confirmPassword) {
            this.style.borderColor = 'var(--button-danger)';
        } else {
            this.style.borderColor = 'var(--border-color)';
        }
    });
    
    // Reset border color on focus
    [emailInput, phoneInput, passwordInput, confirmPasswordInput].forEach(input => {
        input.addEventListener('focus', function() {
            this.style.borderColor = 'var(--border-focus)';
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    setupRealTimeValidation();
    
    // Auto-focus on first input
    document.getElementById('fullName').focus();
    
    // Enter key navigation
    document.getElementById('fullName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('email').focus();
        }
    });
    
    document.getElementById('email').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('phone').focus();
        }
    });
    
    document.getElementById('phone').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('password').focus();
        }
    });
    
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('confirmPassword').focus();
        }
    });
    
    document.getElementById('confirmPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSignup();
        }
    });
});
