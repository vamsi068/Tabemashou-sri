# Sri Tabemashou POS - Admin / Staff Login & Access Control

## What was added
- `login.html`, `login.css`, `login.js` for first-run admin setup and login.
- `auth.js` for session, role, permission and route protection.
- Admin can create/disable/delete/edit staff login accounts in Settings -> Users & Access.
- Per-user page permissions: Billing, Bills, Menu, Reports, Staff, Settings.
- Management permissions: Manage Menu, Manage Staff, Delete Bills.
- Sidebar automatically hides pages the logged-in user cannot access.
- Existing POS pages and UI remain in place.

## First use
1. Open `login.html`.
2. On first launch, create the Admin account.
3. Login as Admin.
4. Open Settings -> Users & Access.
5. Add staff usernames/passwords and choose their permissions.

## Important security note
This version provides client-side login and permission control using localStorage so it can work with the current static HTML/JS POS. It is suitable as a local/demo access layer, but it is **not a secure server-side authentication system**. For a multi-device or internet-facing production deployment, use Firebase Authentication (or another real authentication backend) and enforce permissions server-side / in Firestore Security Rules.
