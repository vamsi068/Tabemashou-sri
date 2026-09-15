/* Sri Tabemashou POS - Login */

const loginForm = document.getElementById("loginForm");
const adminSetupForm = document.getElementById("adminSetupForm");
const loginError = document.getElementById("loginError");
const setupNotice = document.getElementById("setupNotice");
const loginTitle = document.getElementById("loginTitle");
const loginSubtitle = document.getElementById("loginSubtitle");

function showLoginError(message) {
    loginError.textContent = message;
    loginError.hidden = false;
}

function clearLoginError() {
    loginError.textContent = "";
    loginError.hidden = true;
}

function showFirstAdminSetup() {
    loginTitle.textContent = "Create Admin Account";
    loginSubtitle.textContent = "Create the first administrator for this POS.";
    loginForm.hidden = true;
    adminSetupForm.hidden = false;
    setupNotice.hidden = false;
    setupNotice.textContent = "First-time setup: create your administrator account. The admin can later create staff accounts and limit their page access.";
}

function showNormalLogin() {
    loginTitle.textContent = "Sign in";
    loginSubtitle.textContent = "Enter your staff account to continue.";
    loginForm.hidden = false;
    adminSetupForm.hidden = true;
    setupNotice.hidden = true;
}

async function createFirstAdmin(event) {
    event.preventDefault();
    clearLoginError();

    const name = document.getElementById("adminName").value.trim();
    const username = document.getElementById("adminUsername").value.trim().toLowerCase();
    const password = document.getElementById("adminPassword").value;
    const confirm = document.getElementById("adminPasswordConfirm").value;

    if (!name || !username || !password) {
        showLoginError("Please fill in all admin fields.");
        return;
    }
    if (password.length < 6) {
        showLoginError("Password must contain at least 6 characters.");
        return;
    }
    if (password !== confirm) {
        showLoginError("Passwords do not match.");
        return;
    }

    const users = authGetUsers();
    if (users.length > 0) {
        showNormalLogin();
        showLoginError("An admin account already exists. Please sign in.");
        return;
    }

    const passwordHash = await hashPassword(password);
    const admin = createUserRecord({
        name,
        username,
        role: "Admin",
        permissions: getDefaultPermissions("Admin"),
        passwordHash
    });

    authSaveUsers([admin]);
    authSetSession(admin);
    navigateAfterLogin();
}

async function loginUser(event) {
    event.preventDefault();
    clearLoginError();

    const username = document.getElementById("username").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    if (!username || !password) {
        showLoginError("Enter your username and password.");
        return;
    }

    const user = authGetUsers().find(item =>
        item.username === username && item.active !== false
    );

    if (!user) {
        showLoginError("Invalid username or password.");
        return;
    }

    const passwordHash = await hashPassword(password);
    if (passwordHash !== user.passwordHash) {
        showLoginError("Invalid username or password.");
        return;
    }

    authSetSession(user);
    navigateAfterLogin();
}

loginForm?.addEventListener("submit", loginUser);
adminSetupForm?.addEventListener("submit", createFirstAdmin);

if (authGetSession()) {
    navigateAfterLogin();
} else if (authGetUsers().length === 0) {
    showFirstAdminSetup();
} else {
    showNormalLogin();
}
