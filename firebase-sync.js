/* Sri Tabemashou POS - optional Firebase sync
   Requires firebase-config.js to define firebaseConfig (or window.firebaseConfig).
   Works as an additive backup; localStorage remains the immediate source for UI.
*/
(function () {
    const COLLECTIONS = {
        staff: "sriTabemashouStaff",
        attendance: "sriTabemashouStaffAttendance",
        salary: "sriTabemashouSalaryPayments",
        users: "sriTabemashouUsers", // login accounts created via auth.js
        settings: "sriTabemashouSettings" // restaurant/billing/tax/receipt/expenses settings
    };

    const SETTINGS_DOC_ID = "main";

    let db = null;
    let ready = false;

    function getConfig() {
        try {
            if (typeof firebaseConfig !== "undefined") return firebaseConfig;
        } catch (_) {}
        return window.firebaseConfig || window.FIREBASE_CONFIG || null;
    }

    function init() {
        try {
            if (!window.firebase || !firebase.firestore) {
                console.info("Firebase SDK/config not available. Local storage will continue to be used.");
                return false;
            }

            if (!firebase.apps.length) {
                const config = getConfig();
                if (!config) {
                    console.info("firebase-config.js is not configured. Firebase sync skipped.");
                    return false;
                }
                firebase.initializeApp(config);
            }

            db = firebase.firestore();
            ready = true;
            return true;
        } catch (error) {
            console.warn("Firebase initialization failed:", error);
            ready = false;
            return false;
        }
    }

    async function replaceCollection(collectionName, records, idGetter) {
        if (!ready || !db) return;
        const safeRecords = Array.isArray(records) ? records : [];
        const snapshot = await db.collection(collectionName).get();
        const localIds = new Set();
        let batch = db.batch();
        let operations = 0;
        const commits = [];

        for (const record of safeRecords) {
            const id = String(idGetter(record));
            if (!id) continue;
            localIds.add(id);
            batch.set(
                db.collection(collectionName).doc(id),
                { ...record, _syncedAt: firebase.firestore.FieldValue.serverTimestamp() },
                { merge: true }
            );
            operations++;
            if (operations >= 450) {
                commits.push(batch.commit());
                batch = db.batch();
                operations = 0;
            }
        }

        snapshot.forEach(doc => {
            if (!localIds.has(doc.id)) {
                batch.delete(db.collection(collectionName).doc(doc.id));
                operations++;
                if (operations >= 450) {
                    commits.push(batch.commit());
                    batch = db.batch();
                    operations = 0;
                }
            }
        });

        if (operations) commits.push(batch.commit());
        if (commits.length) await Promise.all(commits);
    }

    async function loadCollection(collectionName, idGetter) {
        if (!ready || !db) return null;
        const snapshot = await db.collection(collectionName).get();
        const records = [];
        snapshot.forEach(doc => {
            const data = doc.data() || {};
            delete data._syncedAt;
            records.push({ ...data, [idGetter.field || "id"]: data[idGetter.field || "id"] ?? doc.id });
        });
        return records;
    }

    // --- Single-document helpers, used for settings (not a list of records) ---

    async function saveSingleDoc(collectionName, docId, data) {
        if (!ready || !db) return;
        await db.collection(collectionName).doc(docId).set(
            { ...data, _syncedAt: firebase.firestore.FieldValue.serverTimestamp() },
            { merge: true }
        );
    }

    async function loadSingleDoc(collectionName, docId) {
        if (!ready || !db) return null;
        const doc = await db.collection(collectionName).doc(docId).get();
        if (!doc.exists) return null;
        const data = doc.data() || {};
        delete data._syncedAt;
        return data;
    }

    window.syncStaffToFirebase = function (records) {
        if (!ready) return;
        replaceCollection(COLLECTIONS.staff, records, record => record.id).catch(error => {
            console.warn("Staff Firebase sync failed:", error);
        });
    };

    window.syncStaffAttendanceToFirebase = function (records) {
        if (!ready) return;
        replaceCollection(COLLECTIONS.attendance, records, record => record.id).catch(error => {
            console.warn("Attendance Firebase sync failed:", error);
        });
    };

    window.syncSalaryPaymentsToFirebase = function (records) {
        if (!ready) return;
        replaceCollection(COLLECTIONS.salary, records, record => record.id).catch(error => {
            console.warn("Salary payment Firebase sync failed:", error);
        });
    };

    // Login accounts (username/password hash/role/permissions) created in auth.js.
    // auth.js calls this every time authSaveUsers() runs, so any admin/staff
    // account created on one device gets pushed up for other devices to pick up.
    window.syncUsersToFirebase = function (records) {
        if (!ready) return;
        replaceCollection(COLLECTIONS.users, records, record => record.id).catch(error => {
            console.warn("User account Firebase sync failed:", error);
        });
    };

    // Restaurant/billing/tax/receipt/expenses settings (single object, single doc).
    // settings.js calls this every time savePOSSettings() runs, so any change made
    // on one device (restaurant info, tax rates, receipt text, expenses, etc.)
    // gets pushed up for other devices to pick up.
   window.syncSettingsToFirebase = function (settings) {
    if (!ready || !settings) return Promise.resolve();
    return saveSingleDoc(COLLECTIONS.settings, SETTINGS_DOC_ID, settings).catch(error => {
        console.warn("Settings Firebase sync failed:", error);
        window.dispatchEvent(new CustomEvent("sriTabemashouSyncError", { detail: { collection: "settings", error } }));
    });
};

    window.deleteStaffFromFirebase = async function (staffId) {
        if (!ready || !db) return;
        try {
            await db.collection(COLLECTIONS.staff).doc(String(staffId)).delete();
            const attendance = await db.collection(COLLECTIONS.attendance)
                .where("staffId", "==", staffId)
                .get();
            const salary = await db.collection(COLLECTIONS.salary)
                .where("staffId", "==", staffId)
                .get();
            const batch = db.batch();
            attendance.forEach(doc => batch.delete(doc.ref));
            salary.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        } catch (error) {
            console.warn("Firebase staff delete failed:", error);
        }
    };

    async function hydrateFromFirebase() {
        if (!ready) return;

        try {
            const remoteStaff = await loadCollection(COLLECTIONS.staff, { field: "id" });
            const localStaff = Array.isArray(window.staffList) ? window.staffList : null;
            if (remoteStaff && remoteStaff.length) {
                localStorage.setItem("sriTabemashouStaff", JSON.stringify(remoteStaff));
                if (Array.isArray(window.staffList)) window.staffList.splice(0, window.staffList.length, ...remoteStaff);
            } else if (localStaff && localStaff.length) {
                window.syncStaffToFirebase(localStaff);
            }

            const remoteAttendance = await loadCollection(COLLECTIONS.attendance, { field: "id" });
            if (remoteAttendance && remoteAttendance.length) {
                localStorage.setItem("sriTabemashouStaffAttendance", JSON.stringify(remoteAttendance));
                if (Array.isArray(window.staffAttendanceList)) {
                    window.staffAttendanceList.splice(0, window.staffAttendanceList.length, ...remoteAttendance);
                }
            } else if (Array.isArray(window.staffAttendanceList) && window.staffAttendanceList.length) {
                window.syncStaffAttendanceToFirebase(window.staffAttendanceList);
            }

            const remoteSalary = await loadCollection(COLLECTIONS.salary, { field: "id" });
            if (remoteSalary && remoteSalary.length) {
                localStorage.setItem("sriTabemashouSalaryPayments", JSON.stringify(remoteSalary));
                if (Array.isArray(window.salaryPaymentsList)) window.salaryPaymentsList.splice(0, window.salaryPaymentsList.length, ...remoteSalary);
            } else if (Array.isArray(window.salaryPaymentsList) && window.salaryPaymentsList.length) {
                window.syncSalaryPaymentsToFirebase(window.salaryPaymentsList);
            }

            // Login accounts: pull remote down if present, otherwise push whatever
            // this device already has (e.g. right after first-admin setup) up.
            const remoteUsers = await loadCollection(COLLECTIONS.users, { field: "id" });
            const localUsers = (() => {
                try {
                    const value = JSON.parse(localStorage.getItem("sriTabemashouUsers") || "[]");
                    return Array.isArray(value) ? value : [];
                } catch (_) {
                    return [];
                }
            })();
            if (remoteUsers && remoteUsers.length) {
                localStorage.setItem("sriTabemashouUsers", JSON.stringify(remoteUsers));
            } else if (localUsers.length) {
                window.syncUsersToFirebase(localUsers);
            }

            // Settings: pull remote down if present, otherwise push whatever this
            // device already has (e.g. first run on a brand-new device) up.
            const remoteSettings = await loadSingleDoc(COLLECTIONS.settings, SETTINGS_DOC_ID);
            const localSettingsRaw = localStorage.getItem("sriTabemashouSettings");
            if (remoteSettings && Object.keys(remoteSettings).length) {
                localStorage.setItem("sriTabemashouSettings", JSON.stringify(remoteSettings));
            } else if (localSettingsRaw) {
                try {
                    const parsedSettings = JSON.parse(localSettingsRaw);
                    window.syncSettingsToFirebase(parsedSettings);
                } catch (_) {
                    // ignore malformed local settings
                }
            }

            if (typeof window.renderStaff === "function") window.renderStaff();
            if (typeof window.updateStaffStatistics === "function") window.updateStaffStatistics();
            if (typeof window.renderStaffAttendance === "function") window.renderStaffAttendance();
            if (typeof window.renderStaffMonthlySummary === "function") window.renderStaffMonthlySummary();
            if (typeof window.renderStaffSalaryDashboard === "function") window.renderStaffSalaryDashboard();
            if (typeof window.loadSettingsIntoForm === "function") window.loadSettingsIntoForm();
            if (typeof window.applyRestaurantBranding === "function") window.applyRestaurantBranding();
        } catch (error) {
            console.warn("Firebase hydration skipped:", error);
        }
    }

    window.addEventListener("load", async function () {
        if (!init()) {
            // No Firebase configured on this device/page: unblock anything
            // (like login.js) that's waiting to hear whether sync happened.
            window.__sriTabemashouSyncDone = true;
            window.dispatchEvent(new CustomEvent("sriTabemashouSyncReady", { detail: { synced: false } }));
            return;
        }

        try {
            await hydrateFromFirebase();
        } finally {
            window.__sriTabemashouSyncDone = true;
            window.dispatchEvent(new CustomEvent("sriTabemashouSyncReady", { detail: { synced: true } }));
        }
    });
})();
