# Sri Tabemashou POS – Multi-page version

The existing UI and user flow are preserved. Each module remains a separate HTML/JS/CSS page.

## Added in this version

1. Staff attendance Firebase backup with localStorage fallback.
2. Correct monthly `Not Marked` attendance calculation.
3. Salary payment tracking for each staff member/month, including payment method and paid date.
4. Reports cost summary: salary paid, purchases, total expenses, and net profit.
5. Inventory deduction support during bill save. It works with existing `inventory` data and also supports optional `ingredients` arrays on menu items without changing the billing UI.

## Firebase setup

Keep/replace `firebase-config.js` with your Firebase Web App config. Firestore is used only when the Firebase SDK is available and a valid config is supplied. Without Firebase, the application continues using localStorage.

Firestore collections used by the additive sync are:

- `sriTabemashouStaff`
- `sriTabemashouStaffAttendance`
- `sriTabemashouSalaryPayments`

## Inventory support

Existing billing flow is unchanged. On saving a bill, if a matching inventory record exists, stock is reduced. Menu items can optionally contain:

```js
ingredients: [
  { name: "Chicken", qty: 0.18 },
  { name: "Rice", qty: 0.25 }
]
```

When no recipe exists, the system can fall back to an inventory key matching the sold menu item name.


## Production additions in this build
- Dashboard page
- Inventory, purchases and stock movement page
- Automatic stock deduction and reversal on bill void
- Bill void workflow with reason and audit entry
- Configurable GST used by billing
- Monthly operating-expense settings and profit calculation
- Audit log in Settings
- Expanded backup/restore for inventory, purchases, staff attendance, users and audit history
- Dashboard and Inventory permissions in Admin/Staff access control
