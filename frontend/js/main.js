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
                <li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>
                <li class="nav-item"><a class="nav-link" href="${dashboardLink}">Dashboard</a></li>
                <li class="nav-item"><a class="nav-link" href="cart.html">Cart</a></li>
                <li class="nav-item"><a class="nav-link" href="orders.html">Orders</a></li>
                <li class="nav-item">
                    <button class="btn btn-outline-danger ms-2" onclick="logout()">Logout (${user.name})</button>
                </li>
            `;
        } else if (role === 'artisan') {
            navLinks.innerHTML = `
                <li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>
                <li class="nav-item"><a class="nav-link" href="${dashboardLink}">Dashboard</a></li>
                <li class="nav-item"><a class="nav-link" href="artisan-dashboard.html#myProductsGrid">My Products</a></li>
                <li class="nav-item">
                    <button class="btn btn-outline-danger ms-2" onclick="logout()">Logout (${user.name})</button>
                </li>
            `;
        } else if (role === 'admin') {
            navLinks.innerHTML = `
                <li class="nav-item"><a class="nav-link" href="${dashboardLink}">Admin Dashboard</a></li>
                <li class="nav-item">
                    <button class="btn btn-outline-danger ms-2" onclick="logout()">Logout (${user.name})</button>
                </li>
            `;
        }
    } else {
        navLinks.innerHTML = `
            <li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>
            <li class="nav-item"><a class="nav-link" href="login.html">Login</a></li>
            <li class="nav-item"><a class="btn btn-primary ms-2" href="register.html">Register</a></li>
        `;
    }
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

document.addEventListener('DOMContentLoaded', setupNav);
