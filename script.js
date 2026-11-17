
 // ============================================================
 // DAILYWHISK JAVASCRIPT - COMPLETE UPDATED VERSION
 // ============================================================

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxEG7zQD_rgJ_qnHuAeCSAu9gTE_BzhTc47TshzpiO3Zx-oyeLMdc0ssfzD7GswoX_g/exec";

let websiteMenu = [];
let deliveryAreas = [];
let cart = [];

let deliveryEnabled = false;
let deliverySettingsLoaded = false;

let deliveryFee = 0;
let selectedDeliveryArea = "";

let appliedPromoCode = "";
let appliedDiscount = 0;

const $ = (id) => document.getElementById(id);

const cartItemsElement = $("cart-items");
const cartTotal = $("cart-total");
const cartCount = $("cart-count");
const cartPanel = document.querySelector(".cart");
const checkoutPanel = document.querySelector(".checkout");

const checkoutSubtotal = $("checkout-subtotal");
const checkoutDeliveryFee = $("checkout-delivery-fee");
const checkoutDiscount = $("checkout-discount");
const checkoutTotal = $("checkout-total");

const deliverySection = $("delivery-section");
const deliveryAreaSelect = $("delivery-area");
const deliveryFeeMessage = $("delivery-fee-message");
const addressField = $("customer-address");
const addressLabel = $("address-label");
const pickupLocation = $("pickup-location");

const promoCodeInput = $("promo-code");
const applyPromoButton = $("apply-promo-button");
const promoMessage = $("promo-message");
const discountRow = $("discount-row");

const qrPayment = $("qr-payment");
const paymentProof = $("payment-proof");
const paymentScreenshot = $("payment-screenshot");


// ============================================================
// HELPERS
// ============================================================

function money(value) {
    return Number(value || 0).toFixed(2);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function isYes(value) {
    return [
        "yes",
        "true",
        "1"
    ].includes(
        String(value || "").trim().toLowerCase()
    );
}

function isUnavailable(value) {
    return [
        "sold out",
        "not available",
        "unavailable",
        "no",
        "false",
        "0"
    ].includes(
        String(value || "").trim().toLowerCase()
    );
}

function getCartSubtotal() {
    return cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );
}

function getCartQuantity() {
    return cart.reduce(
        (total, item) => total + item.quantity,
        0
    );
}


// ============================================================
// LOAD MENU FROM GOOGLE SHEETS
// ============================================================

async function loadWebsiteMenu() {
    try {
        const response = await fetch(
            GOOGLE_SCRIPT_URL + "?action=getMenu"
        );

        if (!response.ok) {
            throw new Error("Unable to retrieve menu.");
        }

        const menu = await response.json();

        if (!Array.isArray(menu)) {
            throw new Error("Invalid menu response.");
        }

        websiteMenu = menu;

        updateWebsiteMenu();

    } catch (error) {
        console.error("Menu loading error:", error);
    }
}


function updateWebsiteMenu() {
    document.querySelectorAll(".drink-card").forEach(card => {
        const nameElement = card.querySelector("h3");
        const priceElement = card.querySelector(".price");
        const button = card.querySelector("button");

        if (!nameElement) return;

        const drinkName = nameElement.textContent.trim();

        const item = websiteMenu.find(menuItem =>
            String(menuItem.drink).trim().toLowerCase() ===
            drinkName.toLowerCase()
        );

        if (!item) return;

        if (priceElement) {
            priceElement.textContent = "RM" + money(item.price);
        }

        if (!button) return;

        if (isUnavailable(item.available)) {
            button.disabled = true;
            button.textContent = "NOT AVAILABLE";
            button.classList.add("not-available");
        } else {
            button.disabled = false;
            button.textContent = "ADD TO CART";
            button.classList.remove("not-available");
        }
    });
}


// ============================================================
// LOAD DELIVERY SETTINGS FROM GOOGLE SHEETS
//
// MASTER SWITCH:
// Settings!B2
//
// INDIVIDUAL SWITCHES:
// Delivery Areas column C
//
// EXPECTED RESPONSE:
// {
//   success: true,
//   deliveryEnabled: "Yes",
//   areas: [
//     { area: "UA1", fee: 2, available: "Yes" }
//   ]
// }
// ============================================================

async function loadDeliveryAreas() {
    try {
        const response = await fetch(
            GOOGLE_SCRIPT_URL + "?action=getDeliveryAreas"
        );

        if (!response.ok) {
            throw new Error("Unable to retrieve delivery settings.");
        }

        const result = await response.json();

        console.log(
            "DailyWhisk Delivery Settings:",
            result
        );

        if (
            !result ||
            result.success !== true ||
            !Array.isArray(result.areas)
        ) {
            throw new Error(
                result?.error || "Invalid delivery settings response."
            );
        }

        // MASTER DELIVERY SWITCH

        deliveryEnabled = isYes(result.deliveryEnabled);

        // INDIVIDUAL DELIVERY AREAS

        deliveryAreas = result.areas;

        deliverySettingsLoaded = true;

        updateDeliveryAvailability();

        updateDeliveryDropdown();

    } catch (error) {
        console.error("Delivery settings loading error:", error);

        // SAFETY:
        // If settings cannot load, disable delivery.

        deliveryEnabled = false;
        deliveryAreas = [];
        deliverySettingsLoaded = false;

        updateDeliveryAvailability();
        updateDeliveryDropdown();
    }
}


// ============================================================
// MASTER DELIVERY SWITCH
// ============================================================

function updateDeliveryAvailability() {
    const deliveryRadio = document.querySelector(
        'input[name="order-type"][value="delivery"]'
    );

    const pickupRadio = document.querySelector(
        'input[name="order-type"][value="pickup"]'
    );

    if (!deliveryRadio) return;

    // Delivery is enabled only after settings load successfully.

    deliveryRadio.disabled =
        !deliverySettingsLoaded || !deliveryEnabled;

    const deliveryLabel = deliveryRadio.closest("label");

    if (deliveryLabel) {
        deliveryLabel.style.opacity =
            deliveryRadio.disabled ? "0.45" : "1";

        deliveryLabel.style.cursor =
            deliveryRadio.disabled ? "not-allowed" : "pointer";
    }

    // MASTER SWITCH OFF:
    // Automatically return customer to Pickup.

    if (!deliveryEnabled || !deliverySettingsLoaded) {
        if (deliveryRadio.checked && pickupRadio) {
            pickupRadio.checked = true;

            pickupRadio.dispatchEvent(
                new Event("change")
            );
        }

        selectedDeliveryArea = "";
        deliveryFee = 0;

        if (deliveryAreaSelect) {
            deliveryAreaSelect.value = "";
        }

        if (deliveryFeeMessage) {
            deliveryFeeMessage.textContent =
                "Delivery is currently unavailable. Please select Pickup.";
        }

        if (deliverySection) {
            deliverySection.classList.remove("is-visible");
        }

        updateCheckoutTotals();
    }
}


// ============================================================
// UPDATE DELIVERY DROPDOWN
// ============================================================

function updateDeliveryDropdown() {
    if (!deliveryAreaSelect) return;

    deliveryAreaSelect.innerHTML =
        '<option value="">Select your area</option>';

    if (!deliveryEnabled || !deliverySettingsLoaded) {
        deliveryAreaSelect.disabled = true;

        if (deliveryFeeMessage) {
            deliveryFeeMessage.textContent =
                "Delivery is currently unavailable. Please select Pickup.";
        }

        return;
    }

    deliveryAreaSelect.disabled = false;

    // ONLY SHOW AREAS WITH AVAILABLE = YES

    deliveryAreas.forEach(area => {
        if (!isYes(area.available)) return;

        const option = document.createElement("option");

        option.value = area.area;

        option.textContent =
            area.area + " — RM" + money(area.fee);

        option.dataset.fee = Number(area.fee) || 0;

        deliveryAreaSelect.appendChild(option);
    });

    if (deliveryAreaSelect.options.length === 1) {
        deliveryAreaSelect.disabled = true;

        if (deliveryFeeMessage) {
            deliveryFeeMessage.textContent =
                "No delivery areas are currently available. Please select Pickup.";
        }
    }

    // Clear an area that is no longer available.

    const selectedAreaStillAvailable = deliveryAreas.some(area =>
        String(area.area).trim().toLowerCase() ===
            selectedDeliveryArea.trim().toLowerCase() &&
        isYes(area.available)
    );

    if (
        selectedDeliveryArea &&
        !selectedAreaStillAvailable
    ) {
        selectedDeliveryArea = "";
        deliveryFee = 0;
        deliveryAreaSelect.value = "";

        updateCheckoutTotals();
    }
}


// ============================================================
// DELIVERY AREA CHANGE
// ============================================================

if (deliveryAreaSelect) {
    deliveryAreaSelect.addEventListener("change", function() {

        if (!deliveryEnabled || !deliverySettingsLoaded) {
            this.value = "";

            selectedDeliveryArea = "";
            deliveryFee = 0;

            updateCheckoutTotals();

            return;
        }

        const option = this.options[this.selectedIndex];

        selectedDeliveryArea = this.value;

        deliveryFee = option
            ? Number(option.dataset.fee) || 0
            : 0;

        if (deliveryFeeMessage) {
            deliveryFeeMessage.textContent = this.value
                ? "Delivery fee: RM" + money(deliveryFee)
                : "Please select your delivery area.";
        }

        updateCheckoutTotals();
    });
}


// ============================================================
// CART OPEN / CLOSE
// ============================================================

if ($("cart-button")) {
    $("cart-button").addEventListener("click", () => {
        cartPanel?.classList.add("is-open");
    });
}

if ($("close-cart")) {
    $("close-cart").addEventListener("click", () => {
        cartPanel?.classList.remove("is-open");
    });
}

if ($("close-checkout")) {
    $("close-checkout").addEventListener("click", () => {
        checkoutPanel?.classList.remove("is-open");
    });
}


// ============================================================
// ADD DRINKS TO CART
// ============================================================

function addToCart(name, price) {
    const menuItem = websiteMenu.find(item =>
        String(item.drink).trim().toLowerCase() ===
        name.trim().toLowerCase()
    );

    if (!menuItem || isUnavailable(menuItem.available)) {
        alert(name + " is currently not available.");
        return;
    }

    const existing = cart.find(item => item.name === name);

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            name,
            price: Number(price),
            quantity: 1
        });
    }

    updateCart();
}


function connectDrinkButtons() {
    document.querySelectorAll(".drink-card button").forEach(button => {
        if (button.dataset.dailywhiskConnected === "true") return;

        button.dataset.dailywhiskConnected = "true";

        button.addEventListener("click", () => {
            if (button.disabled) return;

            const card = button.closest(".drink-card");
            if (!card) return;

            const name = card.querySelector("h3")?.textContent.trim();

            const priceText =
                card.querySelector(".price")?.textContent || "";

            const price = parseFloat(
                priceText.replace(/[^\d.]/g, "")
            );

            if (name && Number.isFinite(price)) {
                addToCart(name, price);
            }
        });
    });
}


// ============================================================
// UPDATE CART
// ============================================================

function updateCart() {
    if (!cartItemsElement) return;

    cartItemsElement.innerHTML = "";

    cart.forEach((item, index) => {
        const element = document.createElement("div");

        element.className = "cart-item";

        element.innerHTML = `
            <div>
                <strong>${escapeHTML(item.name)}</strong>
                <p>RM${money(item.price * item.quantity)}</p>

                <button type="button"
                    class="remove-item"
                    data-index="${index}">
                    Remove
                </button>
            </div>

            <div class="quantity-controls">
                <button type="button"
                    data-action="decrease"
                    data-index="${index}">−</button>

                <span>${item.quantity}</span>

                <button type="button"
                    data-action="increase"
                    data-index="${index}">+</button>
            </div>
        `;

        cartItemsElement.appendChild(element);
    });

    if (cart.length === 0) {
        cartItemsElement.innerHTML =
            "<p>Your cart is empty.</p>";

        resetPromo();
    }

    if (cartTotal) {
        cartTotal.textContent = money(getCartSubtotal());
    }

    if (cartCount) {
        cartCount.textContent = getCartQuantity();
    }

    updateCheckoutTotals();
}


if (cartItemsElement) {
    cartItemsElement.addEventListener("click", event => {
        const button = event.target.closest("button");

        if (!button) return;

        const index = Number(button.dataset.index);

        if (!cart[index]) return;

        if (button.classList.contains("remove-item")) {
            cart.splice(index, 1);

        } else if (button.dataset.action === "increase") {
            cart[index].quantity++;

        } else if (button.dataset.action === "decrease") {
            cart[index].quantity--;

            if (cart[index].quantity <= 0) {
                cart.splice(index, 1);
            }
        }

        updateCart();
    });
}


// ============================================================
// CHECKOUT TOTALS
// ============================================================

function updateCheckoutTotals() {
    const subtotal = getCartSubtotal();

    const total = Math.max(
        0,
        subtotal - appliedDiscount + deliveryFee
    );

    if (checkoutSubtotal) {
        checkoutSubtotal.textContent = money(subtotal);
    }

    if (checkoutDeliveryFee) {
        checkoutDeliveryFee.textContent = money(deliveryFee);
    }

    if (checkoutDiscount) {
        checkoutDiscount.textContent = money(appliedDiscount);
    }

    if (checkoutTotal) {
        checkoutTotal.textContent = money(total);
    }

    if (discountRow) {
        discountRow.style.display =
            appliedDiscount > 0 ? "flex" : "none";
    }
}


// ============================================================
// PROMO CODE
// ============================================================

function resetPromo() {
    appliedPromoCode = "";
    appliedDiscount = 0;

    if (promoCodeInput) promoCodeInput.value = "";

    if (promoMessage) promoMessage.textContent = "";

    updateCheckoutTotals();
}


if (applyPromoButton) {
    applyPromoButton.addEventListener("click", async () => {
        const code =
            promoCodeInput?.value.trim().toUpperCase() || "";

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
        applyPromoButton.textContent = "CHECKING...";

        try {
            const params = new URLSearchParams({
                action: "validatePromo",
                code,
                subtotal: String(getCartSubtotal()),
                quantity: String(getCartQuantity())
            });

            const response = await fetch(
                GOOGLE_SCRIPT_URL + "?" + params.toString()
            );

            const result = await response.json();

            if (result.valid) {
                appliedPromoCode =
                    result.appliedCode || code;

                appliedDiscount =
                    Number(result.discount) || 0;

                if (promoMessage) {
                    promoMessage.textContent =
                        result.message ||
                        "Promo applied! You saved RM" +
                        money(appliedDiscount) + ".";

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
            console.error("Promo validation error:", error);

            if (promoMessage) {
                promoMessage.textContent =
                    "Unable to check promo code. Please try again.";

                promoMessage.className =
                    "promo-message error";
            }
        }

        applyPromoButton.disabled = false;
        applyPromoButton.textContent = "APPLY";
    });
}


// ============================================================
// ORDER TYPE: PICKUP / DELIVERY
// ============================================================

document.querySelectorAll('input[name="order-type"]').forEach(radio => {

    radio.addEventListener("change", function() {

        const isDelivery = this.value === "delivery";

        // PREVENT DELIVERY IF MASTER SWITCH IS OFF

        if (isDelivery && (!deliveryEnabled || !deliverySettingsLoaded)) {

            alert(
                "Delivery is currently unavailable. Please select Pickup."
            );

            const pickupRadio = document.querySelector(
                'input[name="order-type"][value="pickup"]'
            );

            if (pickupRadio) {
                pickupRadio.checked = true;

                pickupRadio.dispatchEvent(
                    new Event("change")
                );
            }

            return;
        }

        if (deliverySection) {
            deliverySection.classList.toggle(
                "is-visible",
                isDelivery
            );
        }

        if (pickupLocation) {
            pickupLocation.classList.toggle(
                "is-visible",
                !isDelivery
            );
        }

        if (addressField) {
            addressField.style.display =
                isDelivery ? "block" : "none";

            addressField.required = isDelivery;

            if (!isDelivery) {
                addressField.value = "";
            }
        }

        if (addressLabel) {
            addressLabel.style.display =
                isDelivery ? "block" : "none";
        }

        if (!isDelivery) {
            selectedDeliveryArea = "";
            deliveryFee = 0;

            if (deliveryAreaSelect) {
                deliveryAreaSelect.value = "";
            }

            if (deliveryFeeMessage) {
                deliveryFeeMessage.textContent =
                    !deliveryEnabled
                        ? "Delivery is currently unavailable. Pickup is still available."
                        : "Please select your delivery area.";
            }
        }

        updateCheckoutTotals();
    });
});


// ============================================================
// OPEN CHECKOUT
// ============================================================

if ($("checkout-button")) {
    $("checkout-button").addEventListener("click", () => {

        if (cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        cartPanel?.classList.remove("is-open");

        checkoutPanel?.classList.add("is-open");

        updateCheckoutTotals();
    });
}


// ============================================================
// PAYMENT METHOD: QR / CASH
// ============================================================

document.querySelectorAll('input[name="payment-method"]').forEach(radio => {

    radio.addEventListener("change", function() {

        const isQR = this.value === "qr";

        if (qrPayment) {
            qrPayment.style.display =
                isQR ? "block" : "none";
        }

        if (paymentProof) {
            paymentProof.style.display =
                isQR ? "block" : "none";
        }

        if (paymentScreenshot) {
            paymentScreenshot.required = isQR;

            if (!isQR) {
                paymentScreenshot.value = "";
            }
        }
    });
});


// ============================================================
// READ PAYMENT PROOF FILE
// ============================================================

function fileToBase64(file) {
    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => {
            const result = String(reader.result || "");

            resolve(result.split(",")[1] || "");
        };

        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}


// ============================================================
// SEND ORDER TO GOOGLE SHEETS
// ============================================================

async function sendOrderToGoogleSheets(orderData) {
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",

            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },

            body: JSON.stringify(orderData)
        });

        return true;

    } catch (error) {
        console.error(
            "Google Sheets submission error:",
            error
        );

        return false;
    }
}


// ============================================================
// PLACE ORDER
// ============================================================

const checkoutForm = $("checkout-form");

if (checkoutForm) {

    checkoutForm.addEventListener("submit", async event => {

        event.preventDefault();

        const customerName =
            $("customer-name")?.value.trim() || "";

        const phone =
            $("customer-phone")?.value.trim() || "";

        const selectedOrderType =
            document.querySelector(
                'input[name="order-type"]:checked'
            );

        if (!selectedOrderType) {
            alert("Please select Pickup or Delivery.");
            return;
        }

        const orderType = selectedOrderType.value;


        // MASTER DELIVERY SWITCH VALIDATION

        if (orderType === "delivery") {

            if (!deliverySettingsLoaded || !deliveryEnabled) {
                alert(
                    "Delivery is currently unavailable. Please select Pickup."
                );

                return;
            }

            if (!selectedDeliveryArea) {
                alert("Please select your delivery area.");
                return;
            }


            // INDIVIDUAL AREA VALIDATION

            const selectedArea = deliveryAreas.find(area =>
                String(area.area).trim().toLowerCase() ===
                selectedDeliveryArea.trim().toLowerCase()
            );

            if (!selectedArea || !isYes(selectedArea.available)) {

                alert(
                    "This delivery area is currently unavailable. Please select another area."
                );

                selectedDeliveryArea = "";
                deliveryFee = 0;

                updateDeliveryDropdown();
                updateCheckoutTotals();

                return;
            }

            // REFRESH THE FEE FROM THE LATEST LOADED AREA DATA

            deliveryFee = Number(selectedArea.fee) || 0;
        }


        const address =
            addressField?.value.trim() || "";

        if (orderType === "delivery" && !address) {
            alert("Please enter your delivery address.");
            return;
        }


        const selectedPayment =
            document.querySelector(
                'input[name="payment-method"]:checked'
            );

        if (!selectedPayment) {
            alert("Please select a payment method.");
            return;
        }

        if (cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }


        // CHECK CURRENT DRINK AVAILABILITY

        for (const item of cart) {

            const menuItem = websiteMenu.find(menu =>
                String(menu.drink).trim().toLowerCase() ===
                item.name.trim().toLowerCase()
            );

            if (!menuItem || isUnavailable(menuItem.available)) {
                alert(
                    item.name +
                    " is currently not available. Please update your cart."
                );

                return;
            }
        }


        const paymentMethod = selectedPayment.value;

        let paymentProofData = null;


        // QR PAYMENT PROOF

        if (paymentMethod === "qr") {

            if (
                !paymentScreenshot ||
                !paymentScreenshot.files.length
            ) {
                alert("Please upload your payment proof.");
                return;
            }

            const file = paymentScreenshot.files[0];

            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/jpg",
                "image/webp"
            ];

            if (!allowedTypes.includes(file.type)) {
                alert(
                    "Please upload a JPG, JPEG, PNG or WEBP image."
                );

                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert(
                    "Payment proof must be smaller than 5MB."
                );

                return;
            }

            try {
                const base64 = await fileToBase64(file);

                if (!base64) {
                    throw new Error("The selected file has no data.");
                }

                paymentProofData = {
                    fileName: file.name,
                    mimeType: file.type,
                    base64
                };

            } catch (error) {
                console.error(
                    "Payment proof read error:",
                    error
                );

                alert(
                    "Unable to read your payment proof. Please try again."
                );

                return;
            }
        }


        // ORDER TOTALS

        const subtotal = getCartSubtotal();

        const finalDeliveryFee =
            orderType === "delivery" ? deliveryFee : 0;


        // ORDER DATA

        const orderData = {

            customerName,

            phone,

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
                $("customer-notes")?.value.trim() || "",

            items: cart.map(item => ({
                drink: item.name,
                quantity: Number(item.quantity),
                price: Number(item.price)
            })),

            paymentMethod:
                paymentMethod === "qr"
                    ? "QR Payment"
                    : "Cash",

            paymentStatus:
                paymentMethod === "qr"
                    ? "Proof Uploaded"
                    : "Cash",

            paymentProof: paymentProofData,

            promoCode: appliedPromoCode,

            drinksSubtotal: subtotal,

            deliveryFee: finalDeliveryFee,

            discount: appliedDiscount,

            total: Math.max(
                0,
                subtotal - appliedDiscount + finalDeliveryFee
            ),

            totalQuantity: getCartQuantity()
        };


        // PLACE ORDER BUTTON

        const placeOrderButton =
            $("place-order-button");

        if (placeOrderButton) {
            placeOrderButton.disabled = true;

            placeOrderButton.textContent =
                "PLACING ORDER...";
        }


        const success =
            await sendOrderToGoogleSheets(orderData);


        if (!success) {

            alert(
                "There was a problem submitting your order. Please try again."
            );

            if (placeOrderButton) {
                placeOrderButton.disabled = false;

                placeOrderButton.textContent =
                    "PLACE ORDER";
            }

            return;
        }


        // SHOW CONFIRMATION

        showOrderConfirmation(orderData);


        // RESET CART AND PROMO

        cart = [];

        appliedPromoCode = "";
        appliedDiscount = 0;

        selectedDeliveryArea = "";
        deliveryFee = 0;

        checkoutForm.reset();


        // RESET DELIVERY DISPLAY

        if (deliveryAreaSelect) {
            deliveryAreaSelect.value = "";
        }

        if (promoMessage) {
            promoMessage.textContent = "";
        }

        if (deliverySection) {
            deliverySection.classList.remove("is-visible");
        }

        if (pickupLocation) {
            pickupLocation.classList.add("is-visible");
        }

        if (addressField) {
            addressField.style.display = "none";
            addressField.required = false;
        }

        if (addressLabel) {
            addressLabel.style.display = "none";
        }

        if (qrPayment) {
            qrPayment.style.display = "none";
        }

        if (paymentProof) {
            paymentProof.style.display = "none";
        }

        if (paymentScreenshot) {
            paymentScreenshot.required = false;
        }

        if (deliveryFeeMessage) {
            deliveryFeeMessage.textContent =
                deliveryEnabled
                    ? "Please select your delivery area."
                    : "Delivery is currently unavailable. Pickup is still available.";
        }

        if (placeOrderButton) {
            placeOrderButton.disabled = false;

            placeOrderButton.textContent =
                "PLACE ORDER";
        }

        updateCart();

    });
}


// ============================================================
// ORDER CONFIRMATION
// ============================================================

function showOrderConfirmation(orderData) {

    const confirmation = $("confirmation");

    if ($("confirmation-message")) {
        $("confirmation-message").textContent =
            "Thank you, " + orderData.customerName +
            "! Your order has been received.";
    }

    if ($("confirmation-type")) {
        $("confirmation-type").textContent =
            orderData.orderType === "pickup"
                ? "Pickup"
                : "Delivery";
    }

    if ($("confirmation-area")) {
        $("confirmation-area").textContent =
            orderData.orderType === "delivery"
                ? orderData.deliveryArea
                : "Kingfisher 9C-56";
    }

    if ($("confirmation-payment")) {
        $("confirmation-payment").textContent =
            orderData.paymentMethod;
    }

    if ($("confirmation-proof")) {
        $("confirmation-proof").textContent =
            orderData.paymentMethod === "QR Payment"
                ? "Uploaded"
                : "Not required";
    }

    if ($("confirmation-promo")) {
        $("confirmation-promo").textContent =
            orderData.promoCode || "None";
    }

    if ($("confirmation-discount")) {
        $("confirmation-discount").textContent =
            money(orderData.discount);
    }

    if ($("confirmation-total")) {
        $("confirmation-total").textContent =
            money(orderData.total);
    }

    checkoutPanel?.classList.remove("is-open");

    confirmation?.classList.add("is-open");
}


// ============================================================
// CLOSE CONFIRMATION
// ============================================================

if ($("close-confirmation")) {
    $("close-confirmation").addEventListener("click", () => {
        $("confirmation")?.classList.remove("is-open");
    });
}

if ($("back-to-menu")) {
    $("back-to-menu").addEventListener("click", () => {

        $("confirmation")?.classList.remove("is-open");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}


// ============================================================
// INITIAL SETUP
// ============================================================

// CONNECT DRINK BUTTONS

connectDrinkButtons();


// PAYMENT

if (qrPayment) {
    qrPayment.style.display = "none";
}

if (paymentProof) {
    paymentProof.style.display = "none";
}

if (paymentScreenshot) {
    paymentScreenshot.required = false;
}


// ADDRESS

if (addressField) {
    addressField.style.display = "none";
    addressField.required = false;
}

if (addressLabel) {
    addressLabel.style.display = "none";
}


// PICKUP

if (pickupLocation) {
    pickupLocation.classList.add("is-visible");
}


// DELIVERY

if (deliverySection) {
    deliverySection.classList.remove("is-visible");
}

// Disable delivery until Google Sheets settings load.

const initialDeliveryRadio = document.querySelector(
    'input[name="order-type"][value="delivery"]'
);

if (initialDeliveryRadio) {
    initialDeliveryRadio.disabled = true;
}


// DISCOUNT

if (discountRow) {
    discountRow.style.display = "none";
}


// LOAD GOOGLE SHEETS DATA

loadWebsiteMenu();

loadDeliveryAreas();


// INITIAL CART

updateCart();
