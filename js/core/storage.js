// Simple namespaced localStorage helpers
window.StorageUtil = (function() {
    const AUTH_KEY = 'dial-a-bakkie-auth';
    
    function getJSON(key, fallback = null) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function setJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    }
    
    function setAuth(userData) {
        return setJSON(AUTH_KEY, userData);
    }
    
    function getAuth() {
        return getJSON(AUTH_KEY);
    }
    
    function clearAuth() {
        localStorage.removeItem(AUTH_KEY);
    }
    
    function isAuthenticated() {
        return !!getAuth();
    }

    return { 
        getJSON, 
        setJSON, 
        setAuth, 
        getAuth, 
        clearAuth, 
        isAuthenticated 
    };
})();


