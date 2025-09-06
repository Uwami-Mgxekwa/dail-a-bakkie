let selectedRole = 'customer';

// Initialize theme
function initTheme() {
    const savedTheme = localStorage.getItem('dial-a-bakkie-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('dial-a-bakkie-theme', newTheme);
    updateThemeIcon(newTheme);
}

// Update theme icon
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

// Select user role
function selectRole(role) {
    selectedRole = role;
    document.querySelectorAll('.role-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`[data-role="${role}"]`).classList.add('active');
}

// Show/hide messages
function showMessage(type, message) {
    const errorEl = document.getElementById('errorMessage');
    const successEl = document.getElementById('successMessage');
    
    // Hide both first
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    
    if (type === 'error') {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    } else if (type === 'success') {
        successEl.textContent = message;
        successEl.style.display = 'block';
    }
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        errorEl.style.display = 'none';
        successEl.style.display = 'none';
    }, 5000);
}

// Validate form
function validateForm() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    const validEmails = ['vint@example.com', 'owami@gmail.com']; 
    const validPasswords = ['123', '123'];

    if (!email) {
        showMessage('error', 'Please enter your email address');
        return false;
    }
    
    if (!validEmails.includes(email.toLowerCase())) {
        showMessage('error', 'Email address not recognized.');
        return false;
    }

    if (!password) {
        showMessage('error', 'Please enter your password');
        return false;
    }
    
    if (!validPasswords.includes(password)) {
        showMessage('error', 'Incorrect password. Please try again.');
        return false;
    }
    
    return true;
}

// Handle login
function handleLogin() {
    if (!validateForm()) return;
    
    const container = document.querySelector('.container');
    container.classList.add('loading');
    
    // Simulate API call
    setTimeout(() => {
        container.classList.remove('loading');
        
        showMessage('success', `Welcome back! Logging you in as ${selectedRole}...`);
        
        setTimeout(() => {
            if (selectedRole === 'customer') {
                window.location.href = 'pages/client.html';
            } else {
                window.location.href = 'index.html'; // Driver interface
            }
        }, 2000);
        
    }, 1500);
}

// Show forgot password
function showForgotPassword() {
    showMessage('success', 'Password reset link will be sent to your email address');
}

// Show signup
function showSignup() {
    // This would typically redirect to a signup page
    window.location.href = 'signup.html';
}

// Handle form submission on Enter key
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    
    document.getElementById('email').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('password').focus();
        }
    });
    
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
});