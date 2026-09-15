/* Sri Tabemashou POS - billing.js */

/* =====================================================
   BILLING STATE
   These variables were originally in the monolithic script.
   They must remain available on the standalone Billing page.
===================================================== */
let cart = [];
let selectedCategory = "All";
let selectedPayment = "Cash";
let billCounter =
    parseInt(
        localStorage.getItem("sriTabemashouBillCounter") || "1",
        10
    ) || 1;

function generateBillNumber() {

    const settings =
        getPOSSettings();

    let counter =
        Number(
            localStorage.getItem(
                "sriTabemashouBillCounter"
            ) || 0
        );


    if (
        counter <
        Number(settings.billing.startingBill)
    ) {

        counter =
            Number(
                settings.billing.startingBill
            ) - 1;

    }


    counter++;


    localStorage.setItem(
        "sriTabemashouBillCounter",
        String(counter)
    );


    return (
        settings.billing.billPrefix +
        "-" +
        String(counter).padStart(5, "0")
    );

}


/* =====================================================
   CREATE BILLING CATEGORIES
===================================================== */

function createCategories() {

    const container =
        document.getElementById(
            "categories"
        );


    if (!container) return;


    const categories = [

        "All",

        ...new Set(

            menuItems
                .filter(
                    item =>
                        item.status ===
                        "Available"
                )
                .map(
                    item =>
                        item.category
                )

        )

    ];


    container.innerHTML = "";


    categories.forEach(
        category => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "category-btn";


            if (
                category ===
                selectedCategory
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.textContent =
                category;


            button.onclick =
                function () {

                    selectedCategory =
                        category;

                    createCategories();

                    displayMenu();

                };


            container.appendChild(
                button
            );

        }
    );

}


/* =====================================================
   DISPLAY BILLING MENU
===================================================== */

function displayMenu() {

    const grid =
        document.getElementById(
            "menuGrid"
        );


    if (!grid) return;


    const searchInput =
        document.getElementById(
            "searchMenu"
        );


    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
            : "";


    const filteredItems =
        menuItems.filter(
            item => {

                const categoryMatch =
                    selectedCategory ===
                    "All" ||
                    item.category ===
                    selectedCategory;


                const searchMatch =
                    item.name
                        .toLowerCase()
                        .includes(search);


                const available =
                    item.status ===
                    "Available";


                return (
                    categoryMatch &&
                    searchMatch &&
                    available
                );

            }
        );


    grid.innerHTML = "";


    if (
        filteredItems.length === 0
    ) {

        grid.innerHTML = `

            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:50px;
                color:#999;
            ">

                No food items found.

            </div>

        `;

        return;

    }


    filteredItems.forEach(
        item => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "menu-card";


            const typeClass =
                item.type === "Veg"
                    ? "veg-dot"
                    : "nonveg-dot";


            card.innerHTML = `

                <div class="
                    food-type-dot
                    ${typeClass}
                "></div>


                ${item.image
                    ? `<div class="food-icon"><img class="food-image" src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}"></div>`
                    : `<div class="food-icon">${escapeHTML(item.icon || "🍽️")}</div>`}


                <h3>
                    ${escapeHTML(
                        item.name
                    )}
                </h3>


                <div class="category">

                    ${escapeHTML(
                        item.category
                    )}

                </div>


                <div class="menu-price">

                    ₹${Number(
                        item.price
                    ).toFixed(2)}

                </div>

            `;


            card.onclick =
                function () {

                    addToCart(item);

                };


            grid.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   SEARCH
===================================================== */

function searchMenu() {

    displayMenu();

}


/* =====================================================
   ADD TO CART
===================================================== */

function addToCart(item) {

    const existing =
        cart.find(
            cartItem =>
                cartItem.id ===
                item.id
        );


    if (existing) {

        existing.quantity++;

    }

    else {

        cart.push({

            id: item.id,

            name: item.name,

            price: Number(
                item.price
            ),

            category:
                item.category,

            quantity: 1

        });

    }


    renderCart();

}


/* =====================================================
   RENDER CART
===================================================== */

function renderCart() {

    const container =
        document.getElementById(
            "cartItems"
        );


    if (!container) return;


    if (
        cart.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-cart">

                <div class="empty-icon">
                    🛒
                </div>

                <h3>
                    No items added
                </h3>

                <p>
                    Select food items
                    from the menu
                </p>

            </div>

        `;


        calculateTotal();

        return;

    }


    container.innerHTML = "";


    cart.forEach(
        item => {

            const total =
                item.price *
                item.quantity;


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "cart-item";


            element.innerHTML = `

                <div class="
                    cart-item-info
                ">

                    <h4>
                        ${escapeHTML(
                            item.name
                        )}
                    </h4>

                    <small>
                        ₹${item.price.toFixed(2)}
                        each
                    </small>

                </div>


                <div class="
                    cart-item-right
                ">

                    <div class="item-total">

                        ₹${total.toFixed(2)}

                    </div>


                    <div class="
                        quantity-controls
                    ">

                        <button
                            onclick="
                                changeQuantity(
                                    ${item.id},
                                    -1
                                )
                            ">

                            −

                        </button>


                        <span>
                            ${item.quantity}
                        </span>


                        <button
                            onclick="
                                changeQuantity(
                                    ${item.id},
                                    1
                                )
                            ">

                            +

                        </button>

                    </div>

                </div>

            `;


            container.appendChild(
                element
            );

        }
    );


    calculateTotal();

}


/* =====================================================
   CHANGE QUANTITY
===================================================== */

function changeQuantity(
    id,
    amount
) {

    const item =
        cart.find(
            cartItem =>
                cartItem.id === id
        );


    if (!item) return;


    item.quantity += amount;


    if (
        item.quantity <= 0
    ) {

        cart =
            cart.filter(
                cartItem =>
                    cartItem.id !== id
            );

    }


    renderCart();

}


/* =====================================================
   CLEAR CART
===================================================== */

function clearCart() {

    if (
        cart.length === 0
    ) return;


    if (
        !confirm(
            "Clear all items from this bill?"
        )
    ) {

        return;

    }


    cart = [];

    renderCart();

}


/* =====================================================
   CALCULATE TOTAL
===================================================== */

function calculateTotal() {

    let subtotal = 0;


    cart.forEach(
        item => {

            subtotal +=
                item.price *
                item.quantity;

        }
    );


    let discount =
        parseFloat(
            document.getElementById(
                "discount"
            )?.value
        ) || 0;


    if (
        discount > subtotal
    ) {

        discount =
            subtotal;


        document.getElementById(
            "discount"
        ).value =
            discount;

    }


    const taxable =
        subtotal -
        discount;


    /*
       Current demo GST:
       CGST = 2.5%
       SGST = 2.5%

       We will make GST configurable
       in the Settings step.
    */

    const taxSettings = typeof getPOSSettings === "function" ? getPOSSettings().tax : { gstEnabled: "yes", cgst: 2.5, sgst: 2.5 };
    const gstEnabled = String(taxSettings?.gstEnabled ?? "yes").toLowerCase() !== "no";
    const cgst = gstEnabled ? taxable * (Number(taxSettings?.cgst ?? 2.5) / 100) : 0;
    const sgst = gstEnabled ? taxable * (Number(taxSettings?.sgst ?? 2.5) / 100) : 0;


    const total =
        taxable +
        cgst +
        sgst;


    setText(
        "subtotal",
        subtotal.toFixed(2)
    );


    setText(
        "cgst",
        cgst.toFixed(2)
    );


    setText(
        "sgst",
        sgst.toFixed(2)
    );


    setText(
        "grandTotal",
        total.toFixed(2)
    );


    calculateChange();

}


/* =====================================================
   PAYMENT
===================================================== */

function selectPayment(
    method
) {

    selectedPayment =
        method;


    document
        .querySelectorAll(
            ".payment-btn"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );


                if (
                    button.dataset.method
                    === method
                ) {

                    button.classList.add(
                        "active"
                    );

                }

            }
        );


    const cashDetails =
        document.getElementById(
            "cashDetails"
        );


    if (
        method === "Cash"
    ) {

        cashDetails.style.display =
            "grid";

    }

    else {

        cashDetails.style.display =
            "none";

    }

}


/* =====================================================
   CHANGE
===================================================== */

function calculateChange() {

    const total =
        parseFloat(
            document.getElementById(
                "grandTotal"
            )?.textContent
        ) || 0;


    const received =
        parseFloat(
            document.getElementById(
                "amountReceived"
            )?.value
        ) || 0;


    const change =
        Math.max(
            received - total,
            0
        );


    setText(
        "changeAmount",
        change.toFixed(2)
    );

}


/* =====================================================
   ORDER TYPE
===================================================== */

document.addEventListener(
    "change",
    function(event) {

        if (
            event.target.id ===
            "orderType"
        ) {

            updateOrderType();

        }

    }
);

function updateOrderType() {

    const orderType =
        document.getElementById(
            "orderType"
        )?.value;


    if (!orderType) return;


    setText(
        "orderTypeDisplay",
        orderType
    );


    const table =
        document.getElementById(
            "tableNumber"
        );


    if (!table) return;


    if (
        orderType ===
        "Dine In"
    ) {

        table.disabled =
            false;

    }

    else {

        table.disabled =
            true;

        table.value =
            "";

    }

}


/* =====================================================
   SAVE BILL
===================================================== */

function saveBill() {

    if (
        cart.length === 0
    ) {

        alert(
            "Please add at least one item."
        );

        return;

    }


    const total =
        parseFloat(
            document.getElementById(
                "grandTotal"
            ).textContent
        );


    if (
        selectedPayment ===
        "Cash"
    ) {

        const received =
            parseFloat(
                document.getElementById(
                    "amountReceived"
                ).value
            ) || 0;


        if (
            received < total
        ) {

            alert(
                "Amount received is less than the bill total."
            );

            return;

        }

    }


    const bill = {

        billNumber:
            document.getElementById(
                "billNumber"
            ).textContent,

        date:
            new Date().toISOString(),

        customerName:
            document.getElementById(
                "customerName"
            ).value,

        customerPhone:
            document.getElementById(
                "customerPhone"
            ).value,

        orderType:
            document.getElementById(
                "orderType"
            ).value,

        tableNumber:
            document.getElementById(
                "tableNumber"
            ).value,

        paymentMethod:
            selectedPayment,

        items:
            JSON.parse(
                JSON.stringify(cart)
            ),

        subtotal:
            parseFloat(
                document.getElementById(
                    "subtotal"
                ).textContent
            ),

        discount:
            parseFloat(
                document.getElementById(
                    "discount"
                ).value
            ) || 0,

        cgst:
            parseFloat(
                document.getElementById(
                    "cgst"
                ).textContent
            ),

        sgst:
            parseFloat(
                document.getElementById(
                    "sgst"
                ).textContent
            ),

        grandTotal:
            total

    };


    let bills =
        JSON.parse(
            localStorage.getItem(
                "sriTabemashouBills"
            )
        ) || [];


    // Additive inventory deduction: store the exact deduction ledger on the bill so a void/refund can reverse it.
    try {
        if (typeof window.deductInventoryForBill === "function") {
            const result = window.deductInventoryForBill(bill);
            bill.inventoryDeductions = result?.deductions || [];
        }
    } catch (inventoryError) {
        console.warn("Inventory deduction skipped:", inventoryError);
        bill.inventoryDeductions = [];
    }

    bill.cashReceived = selectedPayment === "Cash" ? (parseFloat(document.getElementById("amountReceived")?.value) || 0) : total;
    bill.changeAmount = Math.max(0, bill.cashReceived - total);
    bill.status = "completed";

    bills.push(bill);
    localStorage.setItem(
        "sriTabemashouBills",
        JSON.stringify(bills)
    );
    if (typeof addAuditLog === "function") addAuditLog("Bill Created", `${bill.billNumber} • ${selectedPayment} • ₹${total.toFixed(2)}`);



    alert(
        `Bill ${bill.billNumber} saved successfully!`
    );

    try {
        if (typeof getPOSSettings === "function" && getPOSSettings().billing.autoPrint) {
            /* Use the same print path as the manual Print Bill button so the
               print-only body state is always applied before Chrome opens
               the print dialog. */
            printBill();
            return;
        }
    } catch (error) {
        console.warn("Automatic bill printing skipped:", error);
    }

    newBill();
    return;

}


/* =====================================================
   NEW BILL
===================================================== */

function newBill() {

    cart = [];


    document.getElementById(
        "customerName"
    ).value = "";


    document.getElementById(
        "customerPhone"
    ).value = "";


    document.getElementById(
        "tableNumber"
    ).value = "";


    document.getElementById(
        "discount"
    ).value = "0";


    document.getElementById(
        "amountReceived"
    ).value = "";


    selectedPayment =
        "Cash";


    document
        .querySelectorAll(
            ".payment-btn"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );


                if (
                    button.dataset.method
                    === "Cash"
                ) {

                    button.classList.add(
                        "active"
                    );

                }

            }
        );


    document.getElementById(
        "cashDetails"
    ).style.display =
        "grid";


    generateBillNumber();

    renderCart();

}


/* =====================================================
   MENU MANAGEMENT
===================================================== */

function preparePrintBill() {

    const printLogo = document.getElementById("printRestaurantLogo");
    const printLogoImage = printLogo?.querySelector("img");
    const restaurantLogo = typeof getRestaurantLogo === "function" ? getRestaurantLogo() : "";
    if (printLogo && printLogoImage) {
        if (restaurantLogo) {
            printLogo.style.display = "block";
            printLogoImage.src = restaurantLogo;
        } else {
            printLogo.style.display = "none";
            printLogoImage.removeAttribute("src");
        }
    }

    setText(
        "printBillNumber",
        document.getElementById(
            "billNumber"
        ).textContent
    );


    setText(
        "printDate",
        new Date().toLocaleString(
            "en-IN"
        )
    );


    setText(
        "printCustomer",
        document.getElementById(
            "customerName"
        ).value ||
        "Walk-in Customer"
    );


    setText(
        "printOrderType",
        document.getElementById(
            "orderType"
        ).value
    );


    setText(
        "printTable",
        document.getElementById(
            "tableNumber"
        ).value ||
        "-"
    );


    setText(
        "printSubtotal",
        document.getElementById(
            "subtotal"
        ).textContent
    );


    setText(
        "printDiscount",
        document.getElementById(
            "discount"
        ).value
    );


    setText(
        "printCGST",
        document.getElementById(
            "cgst"
        ).textContent
    );


    setText(
        "printSGST",
        document.getElementById(
            "sgst"
        ).textContent
    );


    setText(
        "printGrandTotal",
        document.getElementById(
            "grandTotal"
        ).textContent
    );


    setText(
        "printPayment",
        selectedPayment
    );


    const printItems =
        document.getElementById(
            "printItems"
        );


    printItems.innerHTML = "";


    cart.forEach(
        item => {

            const row =
                document.createElement(
                    "tr"
                );


            const total =
                item.price *
                item.quantity;


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        item.name
                    )}
                </td>

                <td>
                    ${item.quantity}
                </td>

                <td>
                    ₹${item.price.toFixed(2)}
                </td>

                <td>
                    ₹${total.toFixed(2)}
                </td>

            `;


            printItems.appendChild(
                row
            );

        }
    );

}

function printBill() {
    if (!Array.isArray(cart) || cart.length === 0) {
        alert("Please add items before printing.");
        return;
    }

    preparePrintBill();
    document.body.classList.remove("printing-kot");
    document.body.classList.add("printing-bill");

    const cleanup = () => {
        document.body.classList.remove("printing-bill");
        window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    setTimeout(() => window.print(), 50);
}

function generateKOTNumber() {
    const key = "sriTabemashouKOTCounter";
    let counter = Number(localStorage.getItem(key) || 0);
    counter += 1;
    localStorage.setItem(key, String(counter));
    return `KOT-${String(counter).padStart(4, "0")}`;
}

function preparePrintKOT() {
    setText("printKOTNumber", generateKOTNumber());
    setText("printKOTDate", new Date().toLocaleString("en-IN"));
    setText("printKOTOrderType", document.getElementById("orderType")?.value || "Dine In");
    setText("printKOTTable", document.getElementById("tableNumber")?.value || "-");
    setText("printKOTCustomer", document.getElementById("customerName")?.value || "Walk-in Customer");

    const tbody = document.getElementById("printKOTItems");
    if (!tbody) return;
    tbody.innerHTML = "";

    cart.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${escapeHTML(item.name)}</td><td>${Number(item.quantity) || 0}</td>`;
        tbody.appendChild(row);
    });
}

function printKOT() {
    if (!Array.isArray(cart) || cart.length === 0) {
        alert("Please add items before printing KOT.");
        return;
    }

    preparePrintKOT();
    document.body.classList.remove("printing-bill");
    document.body.classList.add("printing-kot");

    const cleanup = () => {
        document.body.classList.remove("printing-kot");
        window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    setTimeout(() => window.print(), 50);
}


/* =====================================================
   UTILITY
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    generateBillNumber();
    createCategories();
    displayMenu();
    updateOrderType();
    renderCart();

    const defaultPayment = getPOSSettings().billing.defaultPayment || "Cash";
    selectPayment(defaultPayment);
});
