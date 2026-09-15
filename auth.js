/* Sri Tabemashou POS - Authentication & Access Control */

const AUTH_USERS_KEY = "sriTabemashouUsers";
const AUTH_SESSION_KEY = "sriTabemashouSession";

const PAGE_PERMISSIONS = {
    dashboard: "dashboard.view",
    billing: "billing.view",
    bills: "bills.view",
    menu: "menu.view",
    reports: "reports.view",
    staff: "staff.view",
    settings: "settings.view",
    inventory: "inventory.view"
};

const DEFAULT_ROLE_PERMISSIONS = {
    Admin: [
        "dashboard.view", "inventory.view", "inventory.manage",
        "billing.view", "bills.view", "bills.delete", "bills.void", "menu.view", "menu.manage",
        "reports.view", "staff.view", "staff.manage", "settings.view",
        "users.manage"
    ],
    Manager: [
        "dashboard.view", "inventory.view", "inventory.manage",
        "billing.view", "bills.view", "bills.delete", "bills.void", "menu.view", "menu.manage",
        "reports.view", "staff.view", "staff.manage", "settings.view"
    ],
    Cashier: ["dashboard.view", "billing.view", "bills.view"],
    Chef: ["dashboard.view", "billing.view", "bills.view", "menu.view", "inventory.view"],
    Staff: ["dashboard.view", "billing.view", "bills.view"]
};

function authGetUsers() {
    try {
        const value = JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || "[]");
        return Array.isArray(value) ? value : [];
    } catch (error) {
        console.error("Unable to load users:", error);
        return [];
    }
}

function authSaveUsers(users) {
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function authGetSession() {
    try {
        const session = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || "null");
        return session && session.userId ? session : null;
    } catch (error) {
        return null;
    }
}

function authSetSession(user) {
    const session = {
        userId: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        permissions: user.permissions || [],
        loginAt: new Date().toISOString()
    };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

function authClearSession() {
    localStorage.removeItem(AUTH_SESSION_KEY);
}

function getCurrentUser() {
    const session = authGetSession();
    if (!session) return null;

    const user = authGetUsers().find(item => String(item.id) === String(session.userId));
    if (!user || user.active === false) {
        authClearSession();
        return null;
    }

    return {
        ...user,
        permissions: Array.isArray(user.permissions) ? user.permissions : []
    };
}

function hasPermission(permission) {
    const user = getCurrentUser();
    if (!user) return false;
    if (user.role === "Admin") return true;
    return Array.isArray(user.permissions) && user.permissions.includes(permission);
}

function canAccessPage(page) {
    const permission = PAGE_PERMISSIONS[page];
    return !!permission && hasPermission(permission);
}

function getDefaultPermissions(role) {
    return [...(DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.Staff)];
}

function navigateAfterLogin() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const order = ["dashboard", "billing", "bills", "menu", "inventory", "reports", "staff", "settings"];
    const page = order.find(canAccessPage) || "billing";
    window.location.href = `${page}.html`;
}

function logout() {
    authClearSession();
    window.location.href = "login.html";
}

function guardCurrentPage() {
    const page = document.body?.dataset?.page || "";
    if (!page || page === "login") return true;

    const user = getCurrentUser();
    if (!user) {
        window.location.href = `login.html?redirect=${encodeURIComponent(`${page}.html`)}`;
        return false;
    }

    if (!canAccessPage(page)) {
        alert("You do not have permission to access this page.");
        navigateAfterLogin();
        return false;
    }

    return true;
}

function applyAccessControl() {
    const currentPage = document.body?.dataset?.page || "";
    const user = getCurrentUser();
    if (!user || currentPage === "login") return;

    document.querySelectorAll(".nav-item[data-page]").forEach(button => {
        const page = button.dataset.page;
        button.style.display = canAccessPage(page) ? "flex" : "none";
    });

    document.querySelectorAll("[data-permission]").forEach(element => {
        const permission = element.dataset.permission;
        element.style.display = hasPermission(permission) ? "" : "none";
    });

    const nameElement = document.getElementById("currentUserName");
    const roleElement = document.getElementById("currentUserRole");
    if (nameElement) nameElement.textContent = user.name || user.username;
    if (roleElement) roleElement.textContent = user.role || "Staff";
}

async function hashPassword(password) {
    const value = String(password || "");

    if (window.crypto?.subtle) {
        const buffer = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(value)
        );
        return Array.from(new Uint8Array(buffer))
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");
    }

    // Fallback for environments where SubtleCrypto is unavailable.
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return `fallback-${(hash >>> 0).toString(16)}`;
}

function createUserRecord({ name, username, role, permissions, passwordHash }) {
    return {
        id: `USR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: String(name || "").trim(),
        username: String(username || "").trim().toLowerCase(),
        role: role || "Staff",
        permissions: Array.isArray(permissions) ? [...new Set(permissions)] : [],
        passwordHash,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function escapeAuthHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

window.authGetUsers = authGetUsers;
window.authSaveUsers = authSaveUsers;
window.authGetSession = authGetSession;
window.authSetSession = authSetSession;
window.authClearSession = authClearSession;
window.getCurrentUser = getCurrentUser;
window.hasPermission = hasPermission;
window.canAccessPage = canAccessPage;
window.getDefaultPermissions = getDefaultPermissions;
window.navigateAfterLogin = navigateAfterLogin;
window.logout = logout;
window.guardCurrentPage = guardCurrentPage;
window.applyAccessControl = applyAccessControl;
window.hashPassword = hashPassword;
window.createUserRecord = createUserRecord;
window.escapeAuthHTML = escapeAuthHTML;
window.DEFAULT_ROLE_PERMISSIONS = DEFAULT_ROLE_PERMISSIONS;

// Run as soon as this script is loaded. All app pages place auth.js before page modules.
if (document.body?.dataset?.page !== "login") {
    guardCurrentPage();
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.body?.dataset?.page !== "login") {
        if (!guardCurrentPage()) return;
        applyAccessControl();
    }
});
