// ============================================================
// DAILYWHISK JAVASCRIPT
// ============================================================

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxEG7zQD_rgJ_qnHuAeCSAu9gTE_BzhTc47TshzpiO3Zx-oyeLMdc0ssfzD7GswoX_g/exec";

let appliedPromoCode = "";
let appliedDiscount = 0;

let websiteMenu = [];
let deliveryAreas = [];
let cart = [];

let deliveryFee = 0;
let selectedDeliveryArea = "";

const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const checkoutTotal = document.getElementById("checkout-total");
const checkoutSubtotal = document.getElementById("checkout-subtotal");
const checkoutDeliveryFee = document.getElementById("checkout-delivery-fee");
const checkoutDiscount = document.getElementById("checkout-discount");
const cartButton = document.getElementById("cart-button");
const closeCartButton = document.getElementById("close-cart");
const checkoutButton = document.getElementById("checkout-button");
const closeCheckoutButton = document.getElementById("close-checkout");
const cartPanel = document.querySelector(".cart");
const checkoutPanel = document.querySelector(".checkout");
const cartCount = document.getElementById("cart-count");
const deliverySection = document.getElementById("delivery-section");
const deliveryAreaSelect = document.getElementById("delivery-area");
const deliveryFeeMessage = document.getElementById("delivery-fee-message");
const addressField = document.getElementById("customer-address");
const addressLabel = document.getElementById("address-label");
const pickupLocation = document.getElementById("pickup-location");
const promoCodeInput = document.getElementById("promo-code");
const applyPromoButton = document.getElementById("apply-promo-button");
const promoMessage = document.getElementById("promo-message");
const discountRow = document.getElementById("discount-row");

// ============================================================
// LOAD WEBSITE MENU
// ============================================================

async function loadWebsiteMenu() {
    try {
        const response = await fetch(
            GOOGLE_SCRIPT_URL + "?action=getMenu"
        );

        const menu = await response.json();

        console.log("DailyWhisk Website Menu:", menu);

        if (!Array.isArray(menu)) {
            console.error("Invalid menu data:", menu);
            return;
        }

        websiteMenu = menu;
        updateWebsiteMenu();

    } catch (error) {
        console.error("Could not load Website Menu:", error);
    }
}

// ============================================================
// LOAD DELIVERY AREAS
// ============================================================

async function loadDeliveryAreas() {
    try {
        const response = await fetch(
            GOOGLE_SCRIPT_URL + "?action=getDeliveryAreas"
        );

        const areas = await response.json();

        console.log("DailyWhisk Delivery Areas:", areas);

        if (!Array.isArray(areas)) {
            console.error("Invalid delivery area data:", areas);
            return;
        }

        deliveryAreas = areas;
        updateDeliveryDropdown();

    } catch (error) {
        console.error("Could not load Delivery Areas:", error);
    }
}

// ============================================================
// UPDATE DELIVERY DROPDOWN
// ============================================================

function updateDeliveryDropdown() {
    if (!deliveryAreaSelect) return;

    deliveryAreaSelect.innerHTML = `
        <option value="">Select your area</option>
    `;

    deliveryAreas.forEach(function(area) {
        const available = String(area.available)
            .trim()
            .toLowerCase();

        if (String(area.area || "").trim().toUpperCase() === "UCA2") {
            return;
        }

        if (available !== "yes") return;

        const option = document.createElement("option");

        option.value = area.area;
        option.textContent =
            area.area + " — RM" + Number(area.fee).toFixed(2);

        option.dataset.fee = Number(area.fee) || 0;

        deliveryAreaSelect.appendChild(option);
    });
}

// ============================================================
// DELIVERY AREA CHANGE
// ============================================================

if (deliveryAreaSelect) {
    deliveryAreaSelect.addEventListener("change", function() {
        const selectedOption = this.options[this.selectedIndex];

        if (!this.value || !selectedOption) {
            selectedDeliveryArea = "";
            deliveryFee = 0;

            if (deliveryFeeMessage) {
                deliveryFeeMessage.textContent =
                    "Please select your delivery area.";
            }

            updateCheckoutTotals();
            return;
        }

        selectedDeliveryArea = this.value;
        deliveryFee = Number(selectedOption.dataset.fee) || 0;

        if (deliveryFeeMessage) {
            deliveryFeeMessage.textContent =
                "Delivery fee: RM" + deliveryFee.toFixed(2);
        }

        updateCheckoutTotals();
    });
}

// ============================================================
// UPDATE WEBSITE MENU
// ============================================================

function updateWebsiteMenu() {
    const drinkCards = document.querySelectorAll(".drink-card");

    drinkCards.forEach(function(card) {
        const nameElement = card.querySelector("h3");
        if (!nameElement) return;

        const drinkName = nameElement.textContent.trim();

        const menuItem = websiteMenu.find(function(item) {
            return String(item.drink).trim().toLowerCase() ===
                drinkName.toLowerCase();
        });

        if (!menuItem) return;

        const priceElement = card.querySelector(".price");

        if (priceElement) {
            priceElement.textContent =
                "RM" + Number(menuItem.price).toFixed(2);
        }

        const availability = String(menuItem.available || "")
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

        if (isSoldOut) {
            card.classList.add("sold-out");
        } else {
            card.classList.remove("sold-out");
        }

        const button = card.querySelector("button");
        if (!button) return;

        if (isSoldOut) {
            button.disabled = true;
            button.textContent = "NOT AVAILABLE";
            button.classList.add(
                "sold-out-button",
                "not-available-button"
            );
        } else {
            button.disabled = false;
            button.textContent = "ADD TO CART";
            button.classList.remove(
                "sold-out-button",
                "not-available-button"
            );
        }
    });
}

// ============================================================
// CART OPEN / CLOSE
// ============================================================

if (cartButton) {
    cartButton.addEventListener("click", function() {
        if (cartPanel) cartPanel.classList.add("is-open");
    });
}

if (closeCartButton) {
    closeCartButton.addEventListener("click", function() {
        if (cartPanel) cartPanel.classList.remove("is-open");
    });
}

// ============================================================
// ADD TO CART
// ============================================================

function addToCart(drinkName, drinkPrice) {
    const menuItem = websiteMenu.find(function(item) {
        return String(item.drink).trim().toLowerCase() ===
            drinkName.trim().toLowerCase();
    });

    if (
        menuItem &&
        [
            "sold out",
            "not available",
            "unavailable",
            "no",
            "false",
            "0"
        ].includes(String(menuItem.available || "").trim().toLowerCase())
    ) {
        alert(drinkName + " is currently not available.");
        return;
    }

    const existingItem = cart.find(function(item) {
        return item.name === drinkName;
    });

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            name: drinkName,
            price: Number(drinkPrice),
            quantity: 1
        });
    }

    updateCart();
}

// ============================================================
// CONNECT DRINK BUTTONS
// ============================================================

function connectDrinkButtons() {
    const buttons = document.querySelectorAll(".drink-card button");

    buttons.forEach(function(button) {
        if (button.dataset.dailywhiskConnected === "true") return;

        button.dataset.dailywhiskConnected = "true";

        button.addEventListener("click", function() {
            const card = button.closest(".drink-card");
            if (!card) return;

            const nameElement = card.querySelector("h3");
            const priceElement = card.querySelector(".price");

            if (!nameElement || !priceElement) return;

            if (button.disabled) return;

            const drinkName = nameElement.textContent.trim();
            const drinkPrice = parseFloat(
                priceElement.textContent.replace(/[^\d.]/g, "")
            );

            addToCart(drinkName, drinkPrice);
        });
    });
}

// ============================================================
// UPDATE CART
// ============================================================

function updateCart() {
    if (!cartItems) return;

    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML = "<p>Your cart is empty.</p>";
    }

    cart.forEach(function(item, index) {
        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";

        cartItem.innerHTML = `
            <div>
                <strong>${escapeHTML(item.name)}</strong>
                <p>RM${(item.price * item.quantity).toFixed(2)}</p>
                <button type="button" class="remove-item"
                    data-index="${index}">Remove</button>
            </div>
            <div class="quantity-controls">
                <button type="button" data-action="decrease"
                    data-index="${index}">−</button>
                <span>${item.quantity}</span>
                <button type="button" data-action="increase"
                    data-index="${index}">+</button>
            </div>
        `;

        cartItems.appendChild(cartItem);
    });

    const subtotal = calculateSubtotal();
    const quantity = calculateTotalQuantity();

    if (cartTotal) cartTotal.textContent = subtotal.toFixed(2);
    if (cartCount) cartCount.textContent = quantity;

    updateCheckoutTotals();
}

// ============================================================
// CART ITEM BUTTONS
// ============================================================

if (cartItems) {
    cartItems.addEventListener("click", function(event) {
        const button = event.target.closest("button");
        if (!button) return;

        const index = Number(button.dataset.index);
        if (!Number.isInteger(index) || !cart[index]) return;

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
// CALCULATE SUBTOTAL AND QUANTITY
// ============================================================

function calculateSubtotal() {
    return cart.reduce(function(total, item) {
        return total + (item.price * item.quantity);
    }, 0);
}

function calculateTotalQuantity() {
    return cart.reduce(function(total, item) {
        return total + item.quantity;
    }, 0);
}

// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function(character) {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return replacements[character];
    });
}
