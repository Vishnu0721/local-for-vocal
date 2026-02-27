/* =========================================================================
   CORE JAVASCRIPT & UTILITIES
========================================================================= */

const API_BASE_URL = 'http://localhost:5000/api';

const Main = {
    init() {
        this.setupNavigation();
        this.checkAuthStatus();
        this.setupFooterYear();
    },

    setupNavigation() {
        const mobileBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');

        if (mobileBtn && navLinks) {
            mobileBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                const isExpanded = navLinks.classList.contains('active');
                mobileBtn.setAttribute('aria-expanded', isExpanded);
            });
        }

        // Close menu on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar') && navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
        });
    },

    setupFooterYear() {
        const yearEl = document.getElementById('current-year');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    },

    checkAuthStatus() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));

        const authLinks = document.getElementById('auth-links');
        const userLinks = document.getElementById('user-links');

        if (token && user) {
            if (authLinks) authLinks.classList.add('hide');
            if (userLinks) {
                userLinks.classList.remove('hide');
                userLinks.innerHTML = `
          <a href="/pages/dashboard.html" class="nav-link">Dashboard</a>
          <button onclick="Main.logout()" class="btn btn-secondary" style="padding:0.4rem 1rem;">Logout</button>
        `;
            }
        } else {
            if (authLinks) authLinks.classList.remove('hide');
            if (userLinks) userLinks.classList.add('hide');
        }
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/pages/login.html';
    },

    // UI Utilities
    showLoader(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
        <div class="loader-container">
          <span class="loader"></span>
        </div>
      `;
        }
    },

    showAlert(containerId, message, type = 'error') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const icon = type === 'error'
            ? '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
            : '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';

        container.innerHTML = `
      <div class="alert alert-${type}">
        ${icon}
        <span>${message}</span>
      </div>
    `;
        container.classList.remove('hide');
    },

    hideAlert(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.add('hide');
            container.innerHTML = '';
        }
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    }
};

// API Utilities
const API = {
    getHeaders(includeAuth = false) {
        const headers = { 'Content-Type': 'application/json' };

        if (includeAuth) {
            const token = localStorage.getItem('token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    },

    async handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    async post(endpoint, data, includeAuth = false) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(includeAuth),
                body: JSON.stringify(data)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    },

    async get(endpoint, includeAuth = false) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders(includeAuth)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Main.init();
});
