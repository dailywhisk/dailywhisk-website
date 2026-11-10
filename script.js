// ============================================================
// DAILYWHISK JAVASCRIPT
//
// FEATURES
// MENU
// NOT AVAILABLE STATUS
// DELIVERY AREAS
// DELIVERY FEES
// CART
// CHECKOUT
// PROMO CODE
// PAYMENT
// PAYMENT PROOF
// GOOGLE SHEETS
// ============================================================


// ============================================================
// GOOGLE APPS SCRIPT URL
// ============================================================

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxEG7zQD_rgJ_qnHuAeCSAu9gTE_BzhTc47TshzpiO3Zx-oyeLMdc0ssfzD7GswoX_g/exec";


// ============================================================
// PROMO
// ============================================================

let appliedPromoCode = "";
let appliedDiscount = 0;


// ============================================================
// DATA
// ============================================================

let websiteMenu = [];
let deliveryAreas = [];
let cart = [];

let deliveryFee = 0;
let selectedDeliveryArea = "";


// ============================================================
// ELEMENTS
// ============================================================

const cartItems =
    document.getElementById("cart-items");

const cartTotal =
    document.getElementById("cart-total");

const checkoutTotal =
    document.getElementById("checkout-total");

const checkoutSubtotal =
    document.getElementById("checkout-subtotal");

const checkoutDeliveryFee =
    document.getElementById("checkout-delivery-fee");

const checkoutDiscount =
    document.getElementById("checkout-discount");

const cartButton =
    document.getElementById("cart-button");

const closeCartButton =
    document.getElementById("close-cart");

const checkoutButton =
    document.getElementById("checkout-button");

const closeCheckoutButton =
    document.getElementById("close-checkout");

const cartPanel =
    document.querySelector(".cart");

const checkoutPanel =
    document.querySelector(".checkout");

const cartCount =
    document.getElementById("cart-count");

const deliverySection =
    document.getElementById("delivery-section");

const deliveryAreaSelect =
    document.getElementById("delivery-area");

const deliveryFeeMessage =
    document.getElementById("delivery-fee-message");

const addressField =
    document.getElementById("customer-address");

const addressLabel =
    document.getElementById("address-label");

const pickupLocation =
    document.getElementById("pickup-location");

const promoCodeInput =
    document.getElementById("promo-code");

const applyPromoButton =
    document.getElementById("apply-promo-button");

const promoMessage =
    document.getElementById("promo-message");

const discountRow =
    document.getElementById("discount-row");


// ============================================================
// LOAD WEBSITE MENU
// ============================================================

async function loadWebsiteMenu() {

    try {

        const response =
            await fetch(
                GOOGLE_SCRIPT_URL +
                "?action=getMenu"
            );

        const menu =
            await response.json();

        console.log(
            "DailyWhisk Website Menu:",
            menu
        );

        if (!Array.isArray(menu)) {

            console.error(
                "Invalid menu data:",
                menu
            );

            return;
        }

        websiteMenu = menu;

        updateWebsiteMenu();

    } catch (error) {

        console.error(
            "Could not load Website Menu:",
            error
        );

    }
}


// ============================================================
// LOAD DELIVERY AREAS
// ============================================================

async function loadDeliveryAreas() {

    try {

        const response =
            await fetch(
                GOOGLE_SCRIPT_URL +
                "?action=getDeliveryAreas"
            );

        const areas =
            await response.json();

        console.log(
            "DailyWhisk Delivery Areas:",
            areas
        );

        if (!Array.isArray(areas)) {

            console.error(
                "Invalid delivery area data:",
                areas
            );

            return;
        }

        deliveryAreas = areas;

        updateDeliveryDropdown();

    } catch (error) {

        console.error(
            "Could not load Delivery Areas:",
            error
        );

    }
}


// ============================================================
// UPDATE DELIVERY DROPDOWN
// ============================================================

function updateDeliveryDropdown() {

    if (!deliveryAreaSelect) {
        return;
    }

    deliveryAreaSelect.innerHTML = `
        <option value="">
            Select your area
        </option>
    `;

    deliveryAreas.forEach(
        function(area) {

            const available =
                String(
                    area.available
                )
                .trim()
                .toLowerCase();

            // REMOVE UCA2

            if (
                String(area.area || "")
                    .trim()
                    .toUpperCase() === "UCA2"
            ) {
                return;
            }

            if (available !== "yes") {
                return;
            }

            const option =
                document.createElement("option");

            option.value =
                area.area;

            option.textContent =
                area.area +
                " — RM" +
                Number(area.fee).toFixed(2);

            option.dataset.fee =
                Number(area.fee) || 0;

            deliveryAreaSelect.appendChild(
                option
            );

        }
    );

}


// ============================================================
// DELIVERY AREA CHANGE
// ============================================================

if (deliveryAreaSelect) {

    deliveryAreaSelect.addEventListener(
        "change",
        function() {

            const selectedOption =
                this.options[
                    this.selectedIndex
                ];

            if (
                !this.value ||
                !selectedOption
            ) {

                selectedDeliveryArea = "";
                deliveryFee = 0;

                if (deliveryFeeMessage) {

                    deliveryFeeMessage.textContent =
                        "Please select your delivery area.";

                }

                updateCheckoutTotals();

                return;
            }

            selectedDeliveryArea =
                this.value;

            deliveryFee =
                Number(
                    selectedOption.dataset.fee
                ) || 0;

            if (deliveryFeeMessage) {

                deliveryFeeMessage.textContent =
                    "Delivery fee: RM" +
                    deliveryFee.toFixed(2);

            }

            updateCheckoutTotals();

        }
    );

}


// ============================================================
// UPDATE WEBSITE MENU
// ============================================================

function updateWebsiteMenu() {

    const drinkCards =
        document.querySelectorAll(
            ".drink-card"
        );

    drinkCards.forEach(
        function(card) {

            const nameElement =
                card.querySelector("h3");

            if (!nameElement) {
                return;
            }

            const drinkName =
                nameElement
                    .textContent
                    .trim();

            const menuItem =
                websiteMenu.find(
                    function(item) {

                        return (
                            String(item.drink)
                                .trim()
                                .toLowerCase() ===
                            drinkName.toLowerCase()
                        );

                    }
                );

            if (!menuItem) {
                return;
            }


            // UPDATE PRICE

            const priceElement =
                card.querySelector(".price");

            if (priceElement) {

                priceElement.textContent =
                    "RM" +
                    Number(
                        menuItem.price
                    ).toFixed(2);

            }


            // CHECK AVAILABILITY

            const availability =
                String(
                    menuItem.available || ""
                )
                .trim()
                .toLowerCase();

            const isSoldOut = [
                "sold out",
                "not available",
                "unavailable",
                "no",
                "false",
                "0"
            ].includes(availability);


            // UPDATE CARD STYLE

            if (isSoldOut) {

                card.classList.add(
                    "sold-out"
                );

            } else {

                card.classList.remove(
                    "sold-out"
                );

            }


            // UPDATE BUTTON

            const button =
                card.querySelector("button");

            if (!button) {
                return;
            }

            if (isSoldOut) {

                button.disabled = true;

                button.textContent =
                    "NOT AVAILABLE";

                button.classList.add(
                    "sold-out-button",
                    "not-available-button"
                );

            } else {

                button.disabled = false;

                button.textContent =
                    "ADD TO CART";

                button.classList.remove(
                    "sold-out-button",
                    "not-available-button"
                );

            }

        }
    );

}


// ============================================================
// CART OPEN
// ============================================================

if (cartButton) {

    cartButton.addEventListener(
        "click",
        function() {

            if (!cartPanel) {
                return;
            }

            cartPanel.classList.add(
                "is-open"
            );

        }
    );

}


// ============================================================
// CART CLOSE
// ============================================================

if (closeCartButton) {

    closeCartButton.addEventListener(
        "click",
        function() {

            if (!cartPanel) {
                return;
            }

            cartPanel.classList.remove(
                "is-open"
            );

        }
    );

}


// ============================================================
// ADD TO CART
// ============================================================

function addToCart(
    drinkName,
    drinkPrice
) {

    const menuItem =
        websiteMenu.find(
            function(item) {

                return (
                    String(item.drink)
                        .trim()
                        .toLowerCase() ===
                    drinkName
                        .trim()
                        .toLowerCase()
                );

            }
        );

    // PREVENT UNAVAILABLE DRINKS

    if (
        menuItem &&
        [
            "sold out",
            "not available",
            "unavailable",
            "no",
            "false",
            "0"
        ].includes(
            String(menuItem.available || "")
                .trim()
                .toLowerCase()
        )
    ) {

        alert(
            drinkName +
            " is currently not available."
        );

        return;
    }


    // CHECK EXISTING CART ITEM

    const existingItem =
        cart.find(
            function(item) {

                return (
                    item.name === drinkName
                );

            }
        );


    if (existingItem) {

        existingItem.quantity++;

    } else {

        cart.push({

            name:
                drinkName,

            price:
                Number(drinkPrice),

            quantity:
                1

        });

    }

    updateCart();

}


// ============================================================
// CONNECT DRINK BUTTONS
// ============================================================

function connectDrinkButtons() {

    const buttons =
        document.querySelectorAll(
            ".drink-card button"
        );

    buttons.forEach(
        function(button) {

            if (
                button.dataset
                    .dailywhiskConnected === "true"
            ) {
                return;
            }

            button.dataset
                .dailywhiskConnected = "true";

            button.addEventListener(
                "click",
                function() {

                    if (button.disabled) {
                        return;
                    }

                    const card =
                        button.closest(
                            ".drink-card"
                        );

                    if (!card) {
                        return;
                    }

                    const nameElement =
                        card.querySelector("h3");

                    const priceElement =
                        card.querySelector(".price");

                    if (
                        !nameElement ||
                        !priceElement
                    ) {
                        return;
                    }

                    const drinkName =
                        nameElement
                            .textContent
                            .trim();

                    const drinkPrice =
                        parseFloat(
                            priceElement
                                .textContent
                                .replace(
                                    /[^\d.]/g,
                                    ""
                                )
                        );

                    addToCart(
                        drinkName,
                        drinkPrice
                    );

                }
            );

        }
    );

}


// ============================================================
// UPDATE CART
// ============================================================

function updateCart() {

    if (!cartItems) {
        return;
    }

    cartItems.innerHTML = "";

    let total = 0;
    let totalQuantity = 0;

    cart.forEach(
        function(item, index) {

            const itemTotal =
                item.price *
                item.quantity;

            const itemElement =
                document.createElement("div");

            itemElement.className =
                "cart-item";

            itemElement.innerHTML = `

                <div>

                    <strong>
                        ${escapeHTML(item.name)}
                    </strong>

                    <p>
                        RM${itemTotal.toFixed(2)}
                    </p>

                    <button
                        type="button"
                        class="remove-item"
                        data-index="${index}"
                    >
                        Remove
                    </button>

                </div>

                <div class="quantity-controls">

                    <button
                        type="button"
                        data-action="decrease"
                        data-index="${index}"
                    >
                        −
                    </button>

                    <span>
                        ${item.quantity}
                    </span>

                    <button
                        type="button"
                        data-action="increase"
                        data-index="${index}"
                    >
                        +
                    </button>

                </div>

            `;

            cartItems.appendChild(
                itemElement
            );

            total += itemTotal;

            totalQuantity +=
                item.quantity;

        }
    );


    // EMPTY CART MESSAGE

    if (cart.length === 0) {

        cartItems.innerHTML =
            "<p>Your cart is empty.</p>";

        resetPromo();

    }


    // CART TOTAL

    if (cartTotal) {

        cartTotal.textContent =
            total.toFixed(2);

    }


    // CART COUNT

    if (cartCount) {

        cartCount.textContent =
            totalQuantity;

    }

    updateCheckoutTotals();

}


// ============================================================
// CART ITEM BUTTONS
// ============================================================

if (cartItems) {

    cartItems.addEventListener(
        "click",
        function(event) {

            const button =
                event.target.closest("button");

            if (!button) {
                return;
            }

            const index =
                Number(button.dataset.index);

            if (
                !Number.isInteger(index) ||
                !cart[index]
            ) {
                return;
            }


            // REMOVE ITEM

            if (
                button.classList.contains(
                    "remove-item"
                )
            ) {

                cart.splice(index, 1);

            }


            // INCREASE QUANTITY

            else if (
                button.dataset.action === "increase"
            ) {

                cart[index].quantity++;

            }


            // DECREASE QUANTITY

            else if (
                button.dataset.action === "decrease"
            ) {

                cart[index].quantity--;

                if (cart[index].quantity <= 0) {

                    cart.splice(index, 1);

                }

            }

            updateCart();

        }
    );

}


// ============================================================
// CALCULATE SUBTOTAL
// ============================================================

function getCartSubtotal() {

    return cart.reduce(
        function(total, item) {

            return (
                total +
                (
                    item.price *
                    item.quantity
                )
            );

        },
        0
    );

}


// ============================================================
// CALCULATE TOTAL QUANTITY
// ============================================================

function getCartQuantity() {

    return cart.reduce(
        function(total, item) {

            return total + item.quantity;

        },
        0
    );

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value).replace(
        /[&<>"']/g,
        function(character) {

            const replacements = {

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            };

            return replacements[character];

        }
    );

}


// ============================================================
// UPDATE CHECKOUT TOTALS
// ============================================================

function updateCheckoutTotals() {

    const subtotal =
        getCartSubtotal();

    const total =
        Math.max(
            0,
            subtotal -
            appliedDiscount +
            deliveryFee
        );


    if (checkoutSubtotal) {

        checkoutSubtotal.textContent =
            subtotal.toFixed(2);

    }


    if (checkoutDiscount) {

        checkoutDiscount.textContent =
            appliedDiscount.toFixed(2);

    }


    if (checkoutDeliveryFee) {

        checkoutDeliveryFee.textContent =
            deliveryFee.toFixed(2);

    }


    if (checkoutTotal) {

        checkoutTotal.textContent =
            total.toFixed(2);

    }


    if (discountRow) {

        discountRow.style.display =
            appliedDiscount > 0
                ? "flex"
                : "none";

    }

}


// ============================================================
// RESET PROMO
// ============================================================

function resetPromo() {

    appliedPromoCode = "";
    appliedDiscount = 0;

    if (promoCodeInput) {

        promoCodeInput.value = "";

    }

    if (promoMessage) {

        promoMessage.textContent = "";

    }

    updateCheckoutTotals();

}


// ============================================================
// APPLY PROMO CODE
// ============================================================

if (applyPromoButton) {

    applyPromoButton.addEventListener(
        "click",
        async function() {

            const code =
                promoCodeInput
                    ? promoCodeInput.value
                        .trim()
                        .toUpperCase()
                    : "";


            if (!code) {

                if (promoMessage) {

                    promoMessage.textContent =
                        "Please enter a promo code.";

                    promoMessage.className =
                        "promo-message error";

                }

                return;
            }


            if (cart.length === 0) {

                if (promoMessage) {

                    promoMessage.textContent =
                        "Please add a drink first.";

                    promoMessage.className =
                        "promo-message error";

                }

                return;
            }


            applyPromoButton.disabled = true;

            applyPromoButton.textContent =
                "CHECKING...";


            try {

                const subtotal =
                    getCartSubtotal();

                const quantity =
                    getCartQuantity();

                const url =
                    GOOGLE_SCRIPT_URL +
                    "?action=validatePromo" +
                    "&code=" +
                    encodeURIComponent(code) +
                    "&subtotal=" +
                    encodeURIComponent(subtotal) +
                    "&quantity=" +
                    encodeURIComponent(quantity);


                const response =
                    await fetch(url);

                const result =
                    await response.json();


                console.log(
                    "Promo result:",
                    result
                );


                if (
                    result &&
                    result.valid
                ) {

                    appliedPromoCode =
                        code;

                    appliedDiscount =
                        Number(
                            result.discount
                        ) || 0;


                    if (promoMessage) {

                        promoMessage.textContent =
                            result.message ||
                            (
                                "Promo applied! You saved RM" +
                                appliedDiscount.toFixed(2) +
                                "."
                            );

                        promoMessage.className =
                            "promo-message success";

                    }

                } else {

                    appliedPromoCode = "";
                    appliedDiscount = 0;


                    if (promoMessage) {

                        promoMessage.textContent =
                            result.message ||
                            "This promo code is invalid or unavailable.";

                        promoMessage.className =
                            "promo-message error";

                    }

                }

                updateCheckoutTotals();

            } catch (error) {

                console.error(
                    "Promo error:",
                    error
                );

                appliedPromoCode = "";
                appliedDiscount = 0;


                if (promoMessage) {

                    promoMessage.textContent =
                        "Unable to check promo code. Please try again.";

                    promoMessage.className =
                        "promo-message error";

                }

                updateCheckoutTotals();

            }


            applyPromoButton.disabled = false;

            applyPromoButton.textContent =
                "APPLY";

        }
    );

}


// ============================================================
// INCREASE QUANTITY
// ============================================================

function increaseQuantity(index) {

    if (!cart[index]) {
        return;
    }

    cart[index].quantity++;

    updateCart();

}


// ============================================================
// DECREASE QUANTITY
// ============================================================

function decreaseQuantity(index) {

    if (!cart[index]) {
        return;
    }

    cart[index].quantity--;

    if (cart[index].quantity <= 0) {

        cart.splice(index, 1);

    }

    updateCart();

}


// ============================================================
// ORDER TYPE
// ============================================================

const orderTypeButtons =
    document.querySelectorAll(
        'input[name="order-type"]'
    );


orderTypeButtons.forEach(
    function(radio) {

        radio.addEventListener(
            "change",
            function() {

                if (this.value === "delivery") {

                    if (pickupLocation) {

                        pickupLocation.classList.remove(
                            "is-visible"
                        );

                    }

                    if (deliverySection) {

                        deliverySection.classList.add(
                            "is-visible"
                        );

                    }

                    if (addressField) {

                        addressField.style.display =
                            "block";

                        addressField.required =
                            true;

                    }

                    if (addressLabel) {

                        addressLabel.style.display =
                            "block";

                    }

                }


                if (this.value === "pickup") {

                    if (pickupLocation) {

                        pickupLocation.classList.add(
                            "is-visible"
                        );

                    }

                    if (deliverySection) {

                        deliverySection.classList.remove(
                            "is-visible"
                        );

                    }

                    selectedDeliveryArea = "";
                    deliveryFee = 0;


                    if (deliveryAreaSelect) {

                        deliveryAreaSelect.value = "";

                    }


                    if (deliveryFeeMessage) {

                        deliveryFeeMessage.textContent =
                            "Please select your delivery area.";

                    }


                    if (addressField) {

                        addressField.style.display =
                            "none";

                        addressField.required =
                            false;

                        addressField.value = "";

                    }


                    if (addressLabel) {

                        addressLabel.style.display =
                            "none";

                    }

                    updateCheckoutTotals();

                }

            }
        );

    }
);


// ============================================================
// CHECKOUT OPEN
// ============================================================

if (checkoutButton) {

    checkoutButton.addEventListener(
        "click",
        function() {

            if (cart.length === 0) {

                alert(
                    "Your cart is empty."
                );

                return;

            }

            if (cartPanel) {

                cartPanel.classList.remove(
                    "is-open"
                );

            }

            if (checkoutPanel) {

                checkoutPanel.classList.add(
                    "is-open"
                );

            }

            updateCheckoutTotals();

        }
    );

}


// ============================================================
// CHECKOUT CLOSE
// ============================================================

if (closeCheckoutButton) {

    closeCheckoutButton.addEventListener(
        "click",
        function() {

            if (!checkoutPanel) {
                return;
            }

            checkoutPanel.classList.remove(
                "is-open"
            );

        }
    );

}


// ============================================================
// PAYMENT METHOD
// ============================================================

const paymentButtons =
    document.querySelectorAll(
        'input[name="payment-method"]'
    );

const qrPayment =
    document.getElementById("qr-payment");

const paymentProof =
    document.getElementById("payment-proof");

const paymentScreenshot =
    document.getElementById("payment-screenshot");


paymentButtons.forEach(
    function(radio) {

        radio.addEventListener(
            "change",
            function() {

                if (this.value === "qr") {

                    if (qrPayment) {

                        qrPayment.style.display =
                            "block";

                    }

                    if (paymentProof) {

                        paymentProof.style.display =
                            "block";

                    }

                    if (paymentScreenshot) {

                        paymentScreenshot.required =
                            true;

                    }

                }


                if (this.value === "cash") {

                    if (qrPayment) {

                        qrPayment.style.display =
                            "none";

                    }

                    if (paymentProof) {

                        paymentProof.style.display =
                            "none";

                    }

                    if (paymentScreenshot) {

                        paymentScreenshot.required =
                            false;

                        paymentScreenshot.value = "";

                    }

                }

            }
        );

    }
);


// ============================================================
// CONVERT PAYMENT PROOF TO BASE64
// ============================================================

function fileToBase64(file) {

    return new Promise(
        function(resolve, reject) {

            const reader =
                new FileReader();

            reader.onload = function() {

                const result =
                    reader.result;

                const base64 =
                    result.split(",")[1];

                resolve(base64);

            };

            reader.onerror = function(error) {

                reject(error);

            };

            reader.readAsDataURL(file);

        }
    );

}


// ============================================================
// SEND ORDER TO GOOGLE SHEETS
// ============================================================

async function sendOrderToGoogleSheets(orderData) {

    try {

        await fetch(
            GOOGLE_SCRIPT_URL,
            {
                method: "POST",

                mode: "no-cors",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body:
                    JSON.stringify(orderData)
            }
        );

        return true;

    } catch (error) {

        console.error(
            "Google Sheets error:",
            error
        );

        return false;

    }

}


// ============================================================
// PLACE ORDER
// ============================================================

const checkoutForm =
    document.getElementById("checkout-form");


if (checkoutForm) {

    checkoutForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            // CUSTOMER DETAILS

            const customerName =
                document.getElementById(
                    "customer-name"
                ).value.trim();

            const phone =
                document.getElementById(
                    "customer-phone"
                ).value.trim();


            // ORDER TYPE

            const selectedOrderType =
                document.querySelector(
                    'input[name="order-type"]:checked'
                );


            if (!selectedOrderType) {

                alert(
                    "Please select Pickup or Delivery."
                );

                return;

            }

            const orderType =
                selectedOrderType.value;


            // DELIVERY VALIDATION

            if (
                orderType === "delivery" &&
                !selectedDeliveryArea
            ) {

                alert(
                    "Please select your delivery area."
                );

                return;

            }


            // ADDRESS

            const address =
                addressField
                    ? addressField.value.trim()
                    : "";


            if (
                orderType === "delivery" &&
                !address
            ) {

                alert(
                    "Please enter your delivery address."
                );

                return;

            }


            // NOTES

            const notes =
                document.getElementById(
                    "customer-notes"
                ).value.trim();


            // PAYMENT METHOD

            const selectedPayment =
                document.querySelector(
                    'input[name="payment-method"]:checked'
                );


            if (!selectedPayment) {

                alert(
                    "Please select a payment method."
                );

                return;

            }

            const paymentMethod =
                selectedPayment.value;


            // CHECK CART

            if (cart.length === 0) {

                alert(
                    "Your cart is empty."
                );

                return;

            }


            // PAYMENT PROOF

            let paymentProofData = null;


            if (paymentMethod === "qr") {

                if (
                    !paymentScreenshot ||
                    paymentScreenshot.files.length === 0
                ) {

                    alert(
                        "Please upload your payment proof."
                    );

                    return;

                }


                const file =
                    paymentScreenshot.files[0];


                const allowedTypes = [
                    "image/jpeg",
                    "image/png",
                    "image/jpg",
                    "image/webp"
                ];


                if (
                    !allowedTypes.includes(file.type)
                ) {

                    alert(
                        "Please upload a JPG, JPEG, PNG or WEBP image."
                    );

                    return;

                }


                if (
                    file.size > 5 * 1024 * 1024
                ) {

                    alert(
                        "Payment proof must be smaller than 5MB."
                    );

                    return;

                }


                try {

                    const base64 =
                        await fileToBase64(file);


                    paymentProofData = {

                        fileName:
                            file.name,

                        mimeType:
                            file.type,

                        base64:
                            base64

                    };

                } catch (error) {

                    console.error(
                        "Payment proof error:",
                        error
                    );

                    alert(
                        "Unable to read your payment proof. Please try again."
                    );

                    return;

                }

            }


            // CART ITEMS

            const orderItems =
                cart.map(
                    function(item) {

                        return {

                            drink:
                                item.name,

                            quantity:
                                item.quantity,

                            price:
                                item.price

                        };

                    }
                );


            // TOTALS

            const subtotal =
                getCartSubtotal();

            const totalQuantity =
                getCartQuantity();

            const finalDeliveryFee =
                orderType === "delivery"
                    ? deliveryFee
                    : 0;

            const finalTotal =
                Math.max(
                    0,
                    subtotal -
                    appliedDiscount +
                    finalDeliveryFee
                );


            // ORDER DATA

            const orderData = {

                customerName:
                    customerName,

                phone:
                    phone,

                orderType:
                    orderType,

                deliveryArea:
                    orderType === "delivery"
                        ? selectedDeliveryArea
                        : "",

                address:
                    orderType === "delivery"
                        ? address
                        : "",

                notes:
                    notes,

                items:
                    orderItems,

                paymentMethod:
                    paymentMethod === "qr"
                        ? "QR Payment"
                        : "Cash",

                paymentProof:
                    paymentProofData,

                promoCode:
                    appliedPromoCode,

                drinksSubtotal:
                    subtotal,

                deliveryFee:
                    finalDeliveryFee,

                discount:
                    appliedDiscount,

                total:
                    finalTotal,

                totalQuantity:
                    totalQuantity

            };


            // BUTTON

            const placeOrderButton =
                document.getElementById(
                    "place-order-button"
                );


            if (placeOrderButton) {

                placeOrderButton.disabled =
                    true;

                placeOrderButton.textContent =
                    "PLACING ORDER...";

            }


            // SUBMIT ORDER

            const success =
                await sendOrderToGoogleSheets(
                    orderData
                );


            if (!success) {

                alert(
                    "There was a problem submitting your order. Please try again."
                );


                if (placeOrderButton) {

                    placeOrderButton.disabled =
                        false;

                    placeOrderButton.textContent =
                        "PLACE ORDER";

                }

                return;

            }


            // SHOW CONFIRMATION

            showOrderConfirmation(
                orderData
            );


            // RESET CART

            cart = [];

            updateCart();


            // RESET PROMO

            appliedPromoCode = "";
            appliedDiscount = 0;


            if (promoCodeInput) {

                promoCodeInput.value = "";

            }

            if (promoMessage) {

                promoMessage.textContent = "";

            }


            // RESET DELIVERY

            selectedDeliveryArea = "";
            deliveryFee = 0;


            if (deliveryAreaSelect) {

                deliveryAreaSelect.value = "";

            }


            if (deliverySection) {

                deliverySection.classList.remove(
                    "is-visible"
                );

            }


            if (pickupLocation) {

                pickupLocation.classList.add(
                    "is-visible"
                );

            }


            if (deliveryFeeMessage) {

                deliveryFeeMessage.textContent =
                    "Please select your delivery area.";

            }


            // RESET FORM

            checkoutForm.reset();


            if (addressField) {

                addressField.style.display =
                    "none";

                addressField.required =
                    false;

            }


            if (addressLabel) {

                addressLabel.style.display =
                    "none";

            }


            // RESET PAYMENT DISPLAY

            if (qrPayment) {

                qrPayment.style.display =
                    "block";

            }

            if (paymentProof) {

                paymentProof.style.display =
                    "block";

            }

            if (paymentScreenshot) {

                paymentScreenshot.required =
                    true;

            }


            // RESET BUTTON

            if (placeOrderButton) {

                placeOrderButton.disabled =
                    false;

                placeOrderButton.textContent =
                    "PLACE ORDER";

            }

        }
    );

}


// ============================================================
// ORDER CONFIRMATION
// ============================================================

function showOrderConfirmation(orderData) {

    const confirmation =
        document.getElementById(
            "confirmation"
        );


    const confirmationMessage =
        document.getElementById(
            "confirmation-message"
        );

    const confirmationType =
        document.getElementById(
            "confirmation-type"
        );

    const confirmationArea =
        document.getElementById(
            "confirmation-area"
        );

    const confirmationPayment =
        document.getElementById(
            "confirmation-payment"
        );

    const confirmationProof =
        document.getElementById(
            "confirmation-proof"
        );

    const confirmationPromo =
        document.getElementById(
            "confirmation-promo"
        );

    const confirmationDiscount =
        document.getElementById(
            "confirmation-discount"
        );

    const confirmationTotal =
        document.getElementById(
            "confirmation-total"
        );


    if (confirmationMessage) {

        confirmationMessage.textContent =
            "Thank you, " +
            orderData.customerName +
            "! Your order has been received.";

    }


    if (confirmationType) {

        confirmationType.textContent =
            orderData.orderType === "pickup"
                ? "Pickup"
                : "Delivery";

    }


    if (confirmationArea) {

        confirmationArea.textContent =
            orderData.orderType === "delivery"
                ? orderData.deliveryArea
                : "Kingfisher 9C-56";

    }


    if (confirmationPayment) {

        confirmationPayment.textContent =
            orderData.paymentMethod;

    }


    if (confirmationProof) {

        confirmationProof.textContent =
            orderData.paymentMethod === "QR Payment"
                ? "Uploaded"
                : "Not required";

    }


    if (confirmationPromo) {

        confirmationPromo.textContent =
            orderData.promoCode || "None";

    }


    if (confirmationDiscount) {

        confirmationDiscount.textContent =
            Number(
                orderData.discount
            ).toFixed(2);

    }


    if (confirmationTotal) {

        confirmationTotal.textContent =
            Number(
                orderData.total
            ).toFixed(2);

    }


    if (checkoutPanel) {

        checkoutPanel.classList.remove(
            "is-open"
        );

    }


    if (confirmation) {

        confirmation.classList.add(
            "is-open"
        );

    }

}


// ============================================================
// CLOSE CONFIRMATION
// ============================================================

const closeConfirmation =
    document.getElementById(
        "close-confirmation"
    );

const backToMenu =
    document.getElementById(
        "back-to-menu"
    );


if (closeConfirmation) {

    closeConfirmation.addEventListener(
        "click",
        function() {

            const confirmation =
                document.getElementById(
                    "confirmation"
                );

            if (confirmation) {

                confirmation.classList.remove(
                    "is-open"
                );

            }

        }
    );

}


if (backToMenu) {

    backToMenu.addEventListener(
        "click",
        function() {

            const confirmation =
                document.getElementById(
                    "confirmation"
                );

            if (confirmation) {

                confirmation.classList.remove(
                    "is-open"
                );

            }

            window.scrollTo({

                top: 0,
                behavior: "smooth"

            });

        }
    );

}


// ============================================================
// INITIAL SETUP
// ============================================================


// PAYMENT

if (qrPayment) {

    qrPayment.style.display =
        "block";

}

if (paymentProof) {

    paymentProof.style.display =
        "block";

}

if (paymentScreenshot) {

    paymentScreenshot.required =
        true;

}


// ADDRESS

if (addressField) {

    addressField.style.display =
        "none";

    addressField.required =
        false;

}

if (addressLabel) {

    addressLabel.style.display =
        "none";

}


// PICKUP

if (pickupLocation) {

    pickupLocation.classList.add(
        "is-visible"
    );

}


// DELIVERY

if (deliverySection) {

    deliverySection.classList.remove(
        "is-visible"
    );

}


// DISCOUNT

if (discountRow) {

    discountRow.style.display =
        "none";

}


// CONNECT BUTTONS

connectDrinkButtons();


// LOAD GOOGLE SHEETS DATA

loadWebsiteMenu();

loadDeliveryAreas();


// INITIAL CART

updateCart();
