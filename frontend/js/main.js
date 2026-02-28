const API_URL = 'http://localhost:5000/api';

const getToken = () => {
    return localStorage.getItem('token');
};

const decodeToken = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

const setupNav = () => {
    const token = getToken();
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) return;

    if (token) {
        const decoded = decodeToken(token);
        // Use user string from localstorage for name, but token for role logic
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : { name: "User" };
        const role = decoded ? decoded.role : user.role;

        let dashboardLink = 'customer-dashboard.html';
        if (role === 'artisan') dashboardLink = 'artisan-dashboard.html';
        if (role === 'admin') dashboardLink = 'admin-dashboard.html';

        if (role === 'customer') {
            navLinks.innerHTML = `
                <li class="nav-item"><a class="nav-link" href="index.html" data-i18n="nav.home">Home</a></li>
                <li class="nav-item"><a class="nav-link" href="${dashboardLink}" data-i18n="nav.dashboard">Dashboard</a></li>
                <li class="nav-item"><a class="nav-link" href="cart.html" data-i18n="nav.cart">Cart</a></li>
                <li class="nav-item"><a class="nav-link" href="orders.html" data-i18n="nav.orders">Orders</a></li>
                <li class="nav-item">
                    <button class="btn btn-outline-danger ms-2" onclick="logout()"> <span data-i18n="nav.logout">Logout</span> (${user.name})</button>
                </li>
            `;
        } else if (role === 'artisan') {
            navLinks.innerHTML = `
                <li class="nav-item"><a class="nav-link" href="index.html" data-i18n="nav.home">Home</a></li>
                <li class="nav-item"><a class="nav-link" href="${dashboardLink}" data-i18n="nav.dashboard">Dashboard</a></li>
                <li class="nav-item"><a class="nav-link" href="artisan-dashboard.html#myProductsGrid" data-i18n="nav.myProducts">My Products</a></li>
                <li class="nav-item">
                    <button class="btn btn-outline-danger ms-2" onclick="logout()"> <span data-i18n="nav.logout">Logout</span> (${user.name})</button>
                </li>
            `;
        } else if (role === 'admin') {
            navLinks.innerHTML = `
                <li class="nav-item"><a class="nav-link" href="${dashboardLink}" data-i18n="nav.dashboard">Admin Dashboard</a></li>
                <li class="nav-item">
                    <button class="btn btn-outline-danger ms-2" onclick="logout()"> <span data-i18n="nav.logout">Logout</span> (${user.name})</button>
                </li>
            `;
        }
    } else {
        navLinks.innerHTML = `
            <li class="nav-item"><a class="nav-link" href="index.html" data-i18n="nav.home">Home</a></li>
            <li class="nav-item"><a class="nav-link" href="login.html" data-i18n="nav.login">Login</a></li>
            <li class="nav-item"><a class="btn btn-primary ms-2" href="register.html" data-i18n="nav.register">Register</a></li>
        `;
    }

    // Append standard language switcher
    navLinks.innerHTML += `
        <li class="nav-item ms-lg-3 mt-2 mt-lg-0 border-start ps-lg-3 d-flex align-items-center">
            <span class="text-muted small me-2">🌐</span>
            <select class="form-select form-select-sm shadow-none border-0 bg-light" style="width: auto; cursor:pointer;" onchange="changeLanguage(this.value)">
                <option value="en" ${localStorage.getItem('kala_lang') === 'en' ? 'selected' : ''}>English</option>
                <option value="hi" ${localStorage.getItem('kala_lang') === 'hi' ? 'selected' : ''}>हिंदी</option>
                <option value="te" ${localStorage.getItem('kala_lang') === 'te' ? 'selected' : ''}>తెలుగు</option>
            </select>
        </li>
    `;
};

const protectPage = (requiredRole) => {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    const decoded = decodeToken(token);
    if (!decoded || !decoded.role) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        return null;
    }

    if (requiredRole && decoded.role !== requiredRole) {
        window.location.href = 'login.html';
        return null;
    }

    return decoded;
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};

const fetchAPI = async (endpoint, method = 'GET', body = null, isFormData = false) => {
    const token = getToken();
    const headers = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = isFormData ? body : JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.status === 401) {
        logout();
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
};

window.setupNav = setupNav;
window.logout = logout;
window.fetchAPI = fetchAPI;
window.API_URL = API_URL;
window.getToken = getToken;
window.decodeToken = decodeToken;
window.protectPage = protectPage;

// --- i18n Vanilla Implementation ---
const I18N_STORAGE_KEY = 'kala_lang';
let currentDict = {};

async function loadLanguage(lang) {
    try {
        const res = await fetch(`locales/${lang}/translation.json`);
        if (!res.ok) throw new Error("Locale not found");
        currentDict = await res.json();
        localStorage.setItem(I18N_STORAGE_KEY, lang);
        document.documentElement.lang = lang;
        applyTranslations();
    } catch (e) {
        console.warn(`Could not load language: ${lang}`, e);
        if (lang !== 'en') loadLanguage('en');
    }
}

function t(keyPath) {
    const keys = keyPath.split('.');
    let result = currentDict;
    for (let k of keys) {
        if (result && result[k]) {
            result = result[k];
        } else {
            return keyPath; // fallback to key
        }
    }
    return typeof result === 'string' ? result : keyPath;
}

function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        // Handle placeholders inside text nodes safely
        if (el.tagName === 'INPUT' && el.type === 'button') {
            el.value = t(key);
        } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = t(key);
        } else {
            // only touch innerText to not overwrite HTML unless needed.
            // But sometimes we need basic HTML replacement if there's no complex children.
            if (el.children.length === 0) {
                el.innerText = t(key);
            } else {
                // Update only the first text node, keep icons intact if properly structured
                for (let i = 0; i < el.childNodes.length; i++) {
                    if (el.childNodes[i].nodeType === 3 && el.childNodes[i].nodeValue.trim() !== "") {
                        el.childNodes[i].nodeValue = t(key);
                        break;
                    }
                }
            }
        }
    });
}

function changeLanguage(lang) {
    loadLanguage(lang);
}

window.t = t;
window.changeLanguage = changeLanguage;

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem(I18N_STORAGE_KEY) || 'en';
    loadLanguage(savedLang);
    setupNav();
});
