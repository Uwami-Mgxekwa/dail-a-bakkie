let selectedRole = 'customer';

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

function handleLogin() {
    if (!validateForm()) return;
    
    const container = document.querySelector('.container');
    container.classList.add('loading');

    setTimeout(() => {
        container.classList.remove('loading');
        
        showMessage('success', `Welcome back! Logging you in as ${selectedRole}...`);
        
        setTimeout(() => {
            if (selectedRole === 'customer') {
                window.location.href = 'pages/client.html';
            } else {
                window.location.href = 'pages/driver.html';
            }
        }, 2000);
        
    }, 1500);
}

function showForgotPassword() {
    showMessage('success', 'Password reset link will be sent to your email address');
}

function showSignup() {
    window.location.href = 'pages/signup.html';
}

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