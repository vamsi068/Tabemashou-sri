/* Sri Tabemashou POS - settings.js */
const defaultPOSSettings = {

    restaurant: {

        name: "Sri Tabemashou",

        phone: "",

        email: "",

        address: "",

        gstin: "",

        fssai: "",

        logo: ""

    },


    billing: {

        billPrefix: "ST",

        startingBill: 1,

        defaultOrderType: "Dine In",

        defaultPayment: "Cash",

        autoPrint: false,

        showCustomer: true,

        showTable: true

    },


    tax: {

        gstEnabled: "yes",

        cgst: 2.5,

        sgst: 2.5,

        igst: 5

    },


    receipt: {
        header: "Welcome to Sri Tabemashou",
        footer: "Thank you! Visit again.",
        paperWidth: "80"
    },

    expenses: {
        rent: 0,
        electricity: 0,
        gas: 0,
        water: 0,
        internet: 0,
        other: 0
    }

};


/* ---------------------------------------------------------
   GET SETTINGS
--------------------------------------------------------- */

function getPOSSettings() {

    try {

        const saved =
            localStorage.getItem(
                "sriTabemashouSettings"
            );


        if (!saved) {

            return defaultPOSSettings;

        }


        const parsed =
            JSON.parse(saved);


        return {

            ...defaultPOSSettings,

            ...parsed,

            restaurant: {
                ...defaultPOSSettings.restaurant,
                ...(parsed.restaurant || {})
            },

            billing: {
                ...defaultPOSSettings.billing,
                ...(parsed.billing || {})
            },

            tax: {
                ...defaultPOSSettings.tax,
                ...(parsed.tax || {})
            },

            receipt: {
                ...defaultPOSSettings.receipt,
                ...(parsed.receipt || {})
            },

            expenses: {
                ...defaultPOSSettings.expenses,
                ...(parsed.expenses || {})
            }

        };

    }

    catch (error) {

        console.error(
            "Unable to load settings:",
            error
        );

        return defaultPOSSettings;

    }

}


/* ---------------------------------------------------------
   SAVE SETTINGS
--------------------------------------------------------- */

function savePOSSettings(settings) {

    localStorage.setItem(
        "sriTabemashouSettings",
        JSON.stringify(settings)
    );

    if (typeof window.syncSettingsToFirebase === "function") {
        window.syncSettingsToFirebase(settings);
    }

}

/* ---------------------------------------------------------
   OPEN SETTINGS TAB
--------------------------------------------------------- */

function openSettingsTab(tab, button) {

    document
        .querySelectorAll(".settings-tab")
        .forEach(item => {

            item.classList.remove("active");

        });


    document
        .querySelectorAll(".settings-section")
        .forEach(section => {

            section.classList.remove("active");

        });


    if (button) {

        button.classList.add("active");

    }


    const section =
        document.getElementById(
            "settings" +
            tab.charAt(0).toUpperCase() +
            tab.slice(1)
        );


    if (section) {

        section.classList.add("active");

    }


    loadSettingsIntoForm();

}


/* ---------------------------------------------------------
   LOAD SETTINGS INTO FORM
--------------------------------------------------------- */

function loadSettingsIntoForm() {

    const settings =
        getPOSSettings();


    /* RESTAURANT */

    setInputValue(
        "settingRestaurantName",
        settings.restaurant.name
    );

    setInputValue(
        "settingRestaurantPhone",
        settings.restaurant.phone
    );

    setInputValue(
        "settingRestaurantEmail",
        settings.restaurant.email
    );

    setInputValue(
        "settingRestaurantAddress",
        settings.restaurant.address
    );

    setInputValue(
        "settingGSTIN",
        settings.restaurant.gstin
    );

    setInputValue(
        "settingFSSAI",
        settings.restaurant.fssai
    );

    pendingRestaurantLogo = settings.restaurant.logo || "";
    updateLogoPreview(pendingRestaurantLogo);


    /* BILLING */

    setInputValue(
        "settingBillPrefix",
        settings.billing.billPrefix
    );

    setInputValue(
        "settingStartingBill",
        settings.billing.startingBill
    );

    setInputValue(
        "settingDefaultOrderType",
        settings.billing.defaultOrderType
    );

    setInputValue(
        "settingDefaultPayment",
        settings.billing.defaultPayment
    );


    setCheckboxValue(
        "settingAutoPrint",
        settings.billing.autoPrint
    );

    setCheckboxValue(
        "settingShowCustomer",
        settings.billing.showCustomer
    );

    setCheckboxValue(
        "settingShowTable",
        settings.billing.showTable
    );


    /* TAX */

    setInputValue(
        "settingGSTEnabled",
        settings.tax.gstEnabled
    );

    setInputValue(
        "settingCGST",
        settings.tax.cgst
    );

    setInputValue(
        "settingSGST",
        settings.tax.sgst
    );

    setInputValue(
        "settingIGST",
        settings.tax.igst
    );


    /* RECEIPT */

    setInputValue(
        "settingReceiptHeader",
        settings.receipt.header
    );

    setInputValue(
        "settingReceiptFooter",
        settings.receipt.footer
    );

    setInputValue(
        "settingPaperWidth",
        settings.receipt.paperWidth
    );

    loadExpenseSettings();

}


/* ---------------------------------------------------------
   INPUT HELPERS
--------------------------------------------------------- */

function setInputValue(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.value =
            value ?? "";

    }

}

function setCheckboxValue(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.checked =
            Boolean(value);

    }

}


let pendingRestaurantLogo = "";

function updateLogoPreview(src) {
    const box = document.getElementById("restaurantLogoPreview");
    if (!box) return;
    box.innerHTML = src
        ? `<img src="${escapeHTML(src)}" alt="Restaurant Logo Preview">`
        : "श्री";
}

function handleLogoFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        event.target.value = "";
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        alert("Please choose an image smaller than 2 MB.");
        event.target.value = "";
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        pendingRestaurantLogo = reader.result;
        updateLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
}

function removeRestaurantLogo() {
    const settings = getPOSSettings();
    settings.restaurant.logo = "";
    pendingRestaurantLogo = "";
    savePOSSettings(settings);
    const input = document.getElementById("settingRestaurantLogo");
    if (input) input.value = "";
    updateLogoPreview("");
    if (typeof applyRestaurantBranding === "function") applyRestaurantBranding();
    alert("Restaurant logo removed.");
}

function saveRestaurantLogoOnly() {
    const input = document.getElementById("settingRestaurantLogo");
    if (!input || !input.files?.[0]) {
        alert("Please select a logo image first.");
        return;
    }
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
        const settings = getPOSSettings();
        settings.restaurant.logo = reader.result;
        pendingRestaurantLogo = reader.result;
        savePOSSettings(settings);
        updateLogoPreview(reader.result);
        if (typeof applyRestaurantBranding === "function") applyRestaurantBranding();
        alert("Restaurant logo saved successfully.");
    };
    reader.readAsDataURL(file);
}

/* ---------------------------------------------------------
   SAVE RESTAURANT SETTINGS
--------------------------------------------------------- */

function saveRestaurantSettings() {

    const settings =
        getPOSSettings();


    settings.restaurant = {

        name:
            getInputValue(
                "settingRestaurantName"
            ) || "Sri Tabemashou",

        phone:
            getInputValue(
                "settingRestaurantPhone"
            ),

        email:
            getInputValue(
                "settingRestaurantEmail"
            ),

        address:
            getInputValue(
                "settingRestaurantAddress"
            ),

        gstin:
            getInputValue(
                "settingGSTIN"
            ),

        fssai:
            getInputValue(
                "settingFSSAI"
            ),

        logo: pendingRestaurantLogo || settings.restaurant.logo || ""

    };


    savePOSSettings(settings);


    alert(
        "Restaurant settings saved successfully."
    );

}


/* ---------------------------------------------------------
   SAVE BILLING SETTINGS
--------------------------------------------------------- */

function saveBillingSettings() {

    const settings =
        getPOSSettings();


    settings.billing = {

        billPrefix:
            getInputValue(
                "settingBillPrefix"
            ) || "ST",

        startingBill:
            Number(
                getInputValue(
                    "settingStartingBill"
                )
            ) || 1,

        defaultOrderType:
            getInputValue(
                "settingDefaultOrderType"
            ) || "Dine In",

        defaultPayment:
            getInputValue(
                "settingDefaultPayment"
            ) || "Cash",

        autoPrint:
            getCheckboxValue(
                "settingAutoPrint"
            ),

        showCustomer:
            getCheckboxValue(
                "settingShowCustomer"
            ),

        showTable:
            getCheckboxValue(
                "settingShowTable"
            )

    };


    savePOSSettings(settings);


    alert(
        "Billing settings saved successfully."
    );

}


/* ---------------------------------------------------------
   SAVE TAX SETTINGS
--------------------------------------------------------- */

function saveTaxSettings() {

    const settings =
        getPOSSettings();


    settings.tax = {

        gstEnabled:
            getInputValue(
                "settingGSTEnabled"
            ),

        cgst:
            Number(
                getInputValue(
                    "settingCGST"
                )
            ) || 0,

        sgst:
            Number(
                getInputValue(
                    "settingSGST"
                )
            ) || 0,

        igst:
            Number(
                getInputValue(
                    "settingIGST"
                )
            ) || 0

    };


    savePOSSettings(settings);


    alert(
        "Tax settings saved successfully."
    );

}


/* ---------------------------------------------------------
   SAVE RECEIPT SETTINGS
--------------------------------------------------------- */

function saveReceiptSettings() {

    const settings =
        getPOSSettings();


    settings.receipt = {

        header:
            getInputValue(
                "settingReceiptHeader"
            ),

        footer:
            getInputValue(
                "settingReceiptFooter"
            ),

        paperWidth:
            getInputValue(
                "settingPaperWidth"
            ) || "80"

    };


    savePOSSettings(settings);


    alert(
        "Receipt settings saved successfully."
    );

}


/* ---------------------------------------------------------
   INPUT GETTERS
--------------------------------------------------------- */

function getInputValue(id) {

    const element =
        document.getElementById(id);


    return element
        ? element.value
        : "";

}

function getCheckboxValue(id) {

    const element =
        document.getElementById(id);


    return element
        ? element.checked
        : false;

}


/* =========================================================
   BACKUP
========================================================= */


/* ---------------------------------------------------------
   CREATE COMPLETE BACKUP
--------------------------------------------------------- */

function createPOSBackup() {

    return {

        app: "Sri Tabemashou POS",

        version: "1.0",

        backupDate:
            new Date().toISOString(),


        menu:
            JSON.parse(
                localStorage.getItem(
                    "sriTabemashouMenu"
                ) || "[]"
            ),


        bills:
            JSON.parse(
                localStorage.getItem(
                    "sriTabemashouBills"
                ) || "[]"
            ),


        billCounter:
            localStorage.getItem(
                "sriTabemashouBillCounter"
            ) || "0",


        settings: getPOSSettings(),
        inventory: JSON.parse(localStorage.getItem("inventory") || "{}"),
        inventoryLedger: JSON.parse(localStorage.getItem("sriTabemashouInventoryLedger") || "[]"),
        purchases: JSON.parse(localStorage.getItem("sriTabemashouPurchases") || "[]"),
        staff: JSON.parse(localStorage.getItem("sriTabemashouStaff") || "[]"),
        staffAttendance: JSON.parse(localStorage.getItem("sriTabemashouStaffAttendance") || "[]"),
        salaryPayments: JSON.parse(localStorage.getItem("sriTabemashouStaffSalaryPayments") || "[]"),
        users: JSON.parse(localStorage.getItem("sriTabemashouUsers") || "[]"),
        auditLog: JSON.parse(localStorage.getItem("sriTabemashouAuditLog") || "[]")

    };

}


/* ---------------------------------------------------------
   DOWNLOAD BACKUP
--------------------------------------------------------- */

function backupPOSData() {

    const backup =
        createPOSBackup();


    const json =
        JSON.stringify(
            backup,
            null,
            2
        );


    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    const date =
        getLocalDateString(
            new Date()
        );


    link.href = url;


    link.download =
        `Sri-Tabemashou-POS-Backup-${date}.json`;


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);


    URL.revokeObjectURL(url);


    alert(
        "Backup downloaded successfully."
    );

}


/* =========================================================
   RESTORE
========================================================= */


/* ---------------------------------------------------------
   RESTORE POS DATA
--------------------------------------------------------- */

function restorePOSData(event) {

    const file =
        event.target.files[0];


    if (!file) {

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        function(e) {

            try {

                const backup =
                    JSON.parse(
                        e.target.result
                    );


                if (
                    !backup ||
                    backup.app !==
                    "Sri Tabemashou POS"
                ) {

                    alert(
                        "This is not a valid Sri Tabemashou POS backup."
                    );

                    return;

                }


                const confirmed =
                    confirm(
                        "Restoring this backup will replace the current POS data. Continue?"
                    );


                if (!confirmed) {

                    return;

                }


                /* MENU */

                if (
                    Array.isArray(
                        backup.menu
                    )
                ) {

                    localStorage.setItem(
                        "sriTabemashouMenu",
                        JSON.stringify(
                            backup.menu
                        )
                    );

                }


                /* BILLS */

                if (
                    Array.isArray(
                        backup.bills
                    )
                ) {

                    localStorage.setItem(
                        "sriTabemashouBills",
                        JSON.stringify(
                            backup.bills
                        )
                    );

                }


                /* BILL COUNTER */

                if (
                    backup.billCounter !==
                    undefined
                ) {

                    localStorage.setItem(
                        "sriTabemashouBillCounter",
                        String(
                            backup.billCounter
                        )
                    );

                }


                /* INVENTORY / PURCHASES / STAFF / USERS */
                const restoreMap = {
                    inventory: "inventory",
                    inventoryLedger: "sriTabemashouInventoryLedger",
                    purchases: "sriTabemashouPurchases",
                    staff: "sriTabemashouStaff",
                    staffAttendance: "sriTabemashouStaffAttendance",
                    salaryPayments: "sriTabemashouStaffSalaryPayments",
                    users: "sriTabemashouUsers",
                    auditLog: "sriTabemashouAuditLog"
                };
                Object.entries(restoreMap).forEach(([source, key]) => {
                    if (backup[source] !== undefined) localStorage.setItem(key, JSON.stringify(backup[source]));
                });


                /* SETTINGS */

                if (
                    backup.settings
                ) {

                    savePOSSettings(
                        backup.settings
                    );

                }


                alert(
                    "Backup restored successfully. The page will now reload."
                );


                window.location.reload();

            }

            catch(error) {

                console.error(error);


                alert(
                    "Unable to restore backup. The file may be damaged or invalid."
                );

            }

        };


    reader.readAsText(file);


    event.target.value = "";

}


/* =========================================================
   RESET POS
========================================================= */

function resetPOSData() {

    const firstConfirm =
        confirm(
            "WARNING: This will delete all bills, menu data and settings. Continue?"
        );


    if (!firstConfirm) {

        return;

    }


    const secondConfirm =
        confirm(
            "Are you absolutely sure? This action cannot be undone unless you have a backup."
        );


    if (!secondConfirm) {

        return;

    }


    localStorage.removeItem(
        "sriTabemashouMenu"
    );


    localStorage.removeItem(
        "sriTabemashouBills"
    );


    localStorage.removeItem(
        "sriTabemashouBillCounter"
    );


    localStorage.removeItem(
        "sriTabemashouSettings"
    );

    [
        "inventory",
        "sriTabemashouInventoryLedger",
        "sriTabemashouPurchases",
        "sriTabemashouStaff",
        "sriTabemashouStaffAttendance",
        "sriTabemashouStaffSalaryPayments",
        "sriTabemashouAuditLog"
    ].forEach(key => localStorage.removeItem(key));


    alert(
        "POS data has been reset."
    );


    window.location.reload();

}


/* =========================================================
   LOAD SETTINGS WHEN PAGE OPENS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadSettingsIntoForm();

    }
);   



/* =====================================================
   STAFF MANAGEMENT
===================================================== */

let staffList = JSON.parse(
    localStorage.getItem("sriTabemashouStaff")
) || [];


/* =====================================================
   STAFF ELEMENTS
===================================================== */

const staffModal =
    document.getElementById("staffModal");

const staffForm =
    document.getElementById("staffForm");

const addStaffBtn =
    document.getElementById("addStaffBtn");

const closeStaffModal =
    document.getElementById("closeStaffModal");

const cancelStaffBtn =
    document.getElementById("cancelStaffBtn");

const staffTableBody =
    document.getElementById("staffTableBody");

const noStaffMessage =
    document.getElementById("noStaffMessage");

const staffSearch =
    document.getElementById("staffSearch");

const staffRoleFilter =
    document.getElementById("staffRoleFilter");

const staffStatusFilter =
    document.getElementById("staffStatusFilter");


/* =====================================================
   OPEN STAFF FORM
===================================================== */


document.addEventListener("DOMContentLoaded", () => { loadSettingsIntoForm(); });



function saveExpenseSettings(){
    const settings=getPOSSettings();
    settings.expenses={
        rent:Number(document.getElementById("settingMonthlyRent")?.value)||0,
        electricity:Number(document.getElementById("settingMonthlyElectricity")?.value)||0,
        gas:Number(document.getElementById("settingMonthlyGas")?.value)||0,
        water:Number(document.getElementById("settingMonthlyWater")?.value)||0,
        internet:Number(document.getElementById("settingMonthlyInternet")?.value)||0,
        other:Number(document.getElementById("settingMonthlyOther")?.value)||0
    };
    savePOSSettings(settings);
    if(typeof addAuditLog==='function') addAuditLog("Expense Settings Updated", "Monthly fixed expenses updated");
    alert("Expense settings saved successfully!");
}

function loadExpenseSettings(){
    const e=getPOSSettings().expenses||{};
    setInputValue("settingMonthlyRent",e.rent);setInputValue("settingMonthlyElectricity",e.electricity);setInputValue("settingMonthlyGas",e.gas);setInputValue("settingMonthlyWater",e.water);setInputValue("settingMonthlyInternet",e.internet);setInputValue("settingMonthlyOther",e.other);
}

/* =====================================================
   USERS & ACCESS MANAGEMENT
===================================================== */

function renderAccessUsers() {
    const table = document.getElementById("accessUsersTable");
    if (!table || typeof authGetUsers !== "function") return;

    const users = authGetUsers();
    table.innerHTML = "";

    if (users.length === 0) {
        table.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:25px;color:#9ca3af;">No login accounts found.</td></tr>`;
        return;
    }

    users.forEach(user => {
        const pageAccess = [
            ["Billing", "billing.view"],
            ["Bills", "bills.view"],
            ["Menu", "menu.view"],
            ["Reports", "reports.view"],
            ["Staff", "staff.view"],
            ["Settings", "settings.view"]
        ].filter(([, permission]) => user.role === "Admin" || (user.permissions || []).includes(permission))
         .map(([label]) => label)
         .join(", ");

        const row = document.createElement("tr");
        row.innerHTML = `
            <td><strong>${escapeHTML(user.name || "")}</strong></td>
            <td>${escapeHTML(user.username || "")}</td>
            <td>${escapeHTML(user.role || "Staff")}</td>
            <td>${escapeHTML(pageAccess || "None")}</td>
            <td><span class="staff-status ${user.active === false ? "inactive" : "active"}">${user.active === false ? "● Inactive" : "● Active"}</span></td>
            <td>
                <div class="table-actions">
                    <button class="table-action" title="Edit" onclick="editAccessUser('${escapeJS(user.id)}')">✏️</button>
                    <button class="table-action toggle-action" title="Enable / Disable" onclick="toggleAccessUser('${escapeJS(user.id)}')">${user.active === false ? "▶️" : "⏸️"}</button>
                    <button class="table-action delete-action" title="Delete" onclick="deleteAccessUser('${escapeJS(user.id)}')">🗑️</button>
                </div>
            </td>
        `;
        table.appendChild(row);
    });
}

function openAccessUserModal(user = null) {
    if (!hasPermission("users.manage")) {
        alert("Only the admin can manage user access.");
        return;
    }

    const modal = document.getElementById("accessUserModal");
    const form = document.getElementById("accessUserForm");
    if (!modal || !form) return;

    form.reset();
    document.getElementById("accessUserId").value = "";
    document.getElementById("accessUserModalTitle").textContent = user ? "Edit Staff Login" : "Add Staff Login";
    document.getElementById("accessRole").value = user?.role || "Staff";
    document.getElementById("accessStatus").value = user?.active === false ? "Inactive" : "Active";

    document.querySelectorAll(".access-permission").forEach(cb => cb.checked = false);

    const permissions = user?.permissions || getDefaultPermissions("Staff");
    document.querySelectorAll(".access-permission").forEach(cb => {
        cb.checked = permissions.includes(cb.value) || user?.role === "Admin";
    });

    if (user) {
        document.getElementById("accessUserId").value = user.id;
        document.getElementById("accessName").value = user.name || "";
        document.getElementById("accessUsername").value = user.username || "";
        document.getElementById("accessRole").value = user.role || "Staff";
    }

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
}

function closeAccessUserModal() {
    const modal = document.getElementById("accessUserModal");
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
}

async function saveAccessUser(event) {
    event.preventDefault();
    if (!hasPermission("users.manage")) {
        alert("Only the admin can manage user access.");
        return;
    }

    const id = document.getElementById("accessUserId").value.trim();
    const name = document.getElementById("accessName").value.trim();
    const username = document.getElementById("accessUsername").value.trim().toLowerCase();
    const role = document.getElementById("accessRole").value;
    const status = document.getElementById("accessStatus").value;
    const password = document.getElementById("accessPassword").value;
    const permissions = Array.from(document.querySelectorAll(".access-permission:checked")).map(cb => cb.value);

    if (!name || !username) {
        alert("Please enter name and username.");
        return;
    }
    if (!id && password.length < 6) {
        alert("New user password must contain at least 6 characters.");
        return;
    }

    const users = authGetUsers();
    const duplicate = users.find(user =>
        user.username === username && String(user.id) !== String(id)
    );
    if (duplicate) {
        alert("That username is already in use.");
        return;
    }

    const currentSession = authGetSession();
    let target;

    if (id) {
        target = users.find(user => String(user.id) === String(id));
        if (!target) return;

        // Never allow an admin to remove the Admin role/access from the currently logged-in account.
        if (String(target.id) === String(currentSession?.userId)) {
            target.role = "Admin";
            target.active = true;
            target.permissions = getDefaultPermissions("Admin");
        } else {
            target.name = name;
            target.username = username;
            target.role = role;
            target.active = status === "Active";
            target.permissions = role === "Admin" ? getDefaultPermissions("Admin") : [...new Set(permissions)];
            if (password) target.passwordHash = await hashPassword(password);
            target.updatedAt = new Date().toISOString();
        }
    } else {
        target = createUserRecord({
            name,
            username,
            role,
            permissions: role === "Admin" ? getDefaultPermissions("Admin") : [...new Set(permissions)],
            passwordHash: await hashPassword(password)
        });
        target.active = status === "Active";
        users.push(target);
    }

    authSaveUsers(users);
    renderAccessUsers();
    closeAccessUserModal();
    alert(id ? "User access updated successfully." : "Staff login created successfully.");
}

function editAccessUser(id) {
    const user = authGetUsers().find(item => String(item.id) === String(id));
    if (user) openAccessUserModal(user);
}

function toggleAccessUser(id) {
    if (!hasPermission("users.manage")) return;
    const users = authGetUsers();
    const current = authGetSession();
    const user = users.find(item => String(item.id) === String(id));
    if (!user) return;

    if (String(user.id) === String(current?.userId)) {
        alert("You cannot disable your current admin account.");
        return;
    }

    user.active = user.active === false;
    user.updatedAt = new Date().toISOString();
    authSaveUsers(users);
    renderAccessUsers();
}

function deleteAccessUser(id) {
    if (!hasPermission("users.manage")) return;
    const current = authGetSession();
    if (String(id) === String(current?.userId)) {
        alert("You cannot delete your current admin account.");
        return;
    }

    const users = authGetUsers();
    const user = users.find(item => String(item.id) === String(id));
    if (!user) return;

    if (!confirm(`Delete login account for ${user.name}?`)) return;

    const admins = users.filter(item => item.role === "Admin" && item.active !== false);
    if (user.role === "Admin" && admins.length <= 1) {
        alert("At least one active admin account must remain.");
        return;
    }

    authSaveUsers(users.filter(item => String(item.id) !== String(id)));
    renderAccessUsers();
}

document.addEventListener("DOMContentLoaded", () => {
    const accessForm = document.getElementById("accessUserForm");
    if (accessForm) accessForm.addEventListener("submit", saveAccessUser);

    const roleSelect = document.getElementById("accessRole");
    if (roleSelect) {
        roleSelect.addEventListener("change", () => {
            const role = roleSelect.value;
            if (role === "Admin") {
                document.querySelectorAll(".access-permission").forEach(cb => cb.checked = true);
                return;
            }
            const defaults = getDefaultPermissions(role);
            document.querySelectorAll(".access-permission").forEach(cb => {
                cb.checked = defaults.includes(cb.value);
            });
        });
    }

    if (document.body?.dataset?.page === "settings" && hasPermission("users.manage")) {
        renderAccessUsers();
    }
});


function renderAuditLog(){
    const table=document.getElementById("auditLogTable");
    if(!table||typeof getAuditLogs!=="function")return;
    const logs=getAuditLogs().slice().reverse();
    table.innerHTML=logs.length?logs.slice(0,250).map(l=>`<tr><td>${new Date(l.date).toLocaleString("en-IN")}</td><td>${escapeHTML(l.user||"")}</td><td>${escapeHTML(l.role||"")}</td><td>${escapeHTML(l.action||"")}</td><td>${escapeHTML(l.details||"")}</td></tr>`).join(""):"<tr><td colspan=5 style=\"text-align:center;padding:30px;color:#999\">No audit records.</td></tr>";
}
const _openSettingsTab=openSettingsTab; openSettingsTab=function(tab,button){_openSettingsTab(tab,button); if(tab==="audit") renderAuditLog();}; window.openSettingsTab=openSettingsTab;
document.addEventListener("DOMContentLoaded",()=>setTimeout(renderAuditLog,0));
