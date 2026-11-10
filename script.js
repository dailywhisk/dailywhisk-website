// ============================================================
// DAILYWHISK JAVASCRIPT ENGINE
// FULL COMPREHENSIVE PRODUCTION DEPLOYMENT
// ============================================================

// GOOGLE APPS SCRIPT TARGET CONNECTION LINK
const GOOGLE_SCRIPT_URL =
    "https://google.com";

// APPLICATION STATE INITIALIZATION MAPPINGS
let appliedPromoCode = "";
let appliedDiscount = 0;
let websiteMenu = [];
let deliveryAreas = [];
let cart = [];
let deliveryFee = 0;
let selectedDeliveryArea = "";

// DOM RUNTIME COMPONENT SELECTIONS
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

// TRIGGER RECOVERY SYSTEM ON WINDOW INGESTION BOOT
document.addEventListener("DOMContentLoaded", () => {
    loadWebsiteMenu();
    loadDeliveryAreas();
});

// ============================================================
// LOAD WEBSITE MENU
// ============================================================
async function loadWebsiteMenu() {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL + "?action=getMenu");
        const menu = await response.json();
        console.log("DailyWhisk Website Menu:", menu);

        if (!Array.isArray(menu)) {
            console.error("Invalid menu data received:", menu);
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
        const response = await fetch(GOOGLE_SCRIPT_URL + "?action=getDeliveryAreas");
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

    deliveryAreaSelect.innerHTML = `<option value="">Select your area</option>`;

    deliveryAreas.forEach(function(area) {
        const available = String(area.available).trim().toLowerCase();

        // FILTER SPECIFIC PIPELINE CRITERIA
        if (String(area.area || "").trim().toUpperCase() === "UCA2") return;
        if (available !== "yes") return;

        const option = document.createElement("option");
        option.value = area.area;
        option.textContent = area.area + " — RM" + Number(area.fee).toFixed(2);
        option.dataset.fee = Number(area.fee) || 0;

        deliveryAreaSelect.appendChild(option);
    });
}

// ============================================================
// DELIVERY AREA CHANGE ROUTER
// ============================================================
if (deliveryAreaSelect) {
    deliveryAreaSelect.addEventListener("change", function() {
        const selectedOption = this.options[this.selectedIndex];

        if (!this.value || !selectedOption) {
            selectedDeliveryArea = "";
            deliveryFee = 0;
            if (deliveryFeeMessage) {
                deliveryFeeMessage.textContent = "Please select your delivery area.";
            }
            updateCheckoutTotals();
            return;
        }

        selectedDeliveryArea = this.value;
        deliveryFee = Number(selectedOption.dataset.fee) || 0;

        if (deliveryFeeMessage) {
            deliveryFeeMessage.textContent = "Delivery fee: RM" + deliveryFee.toFixed(2);
        }
        updateCheckoutTotals();
    });
}

// ============================================================
// FIX: DYNAMIC EVALUATION ENGINE FOR MENU OBJECTS
// ============================================================
function updateWebsiteMenu() {
    const drinkCards = document.querySelectorAll(".drink-card");

    drinkCards.forEach(function(card) {
        const nameElement = card.querySelector("h3");
        if (!nameElement) return;

        const drinkName = nameElement.textContent.trim();

        // Search spreadsheet rows for match
        const menuItem = websiteMenu.find(function(item) {
            return (
                String(item.drink || item.name || "")
                    .trim()
                    .toLowerCase() === drinkName.toLowerCase()
            );
        });

        const actionButton = card.querySelector("button");

        if (menuItem && actionButton) {
            const status = String(menuItem.status || "").toLowerCase().trim();
            const available = String(menuItem.available || "").toLowerCase().trim();

            // Intercept stock flags explicitly
            if (status === "sold out" || status === "unavailable" || available === "no") {
                actionButton.textContent = "UNAVAILABLE";
                actionButton.disabled = true;
                actionButton.className = "btn-unavailable";
            } else {
                actionButton.textContent = "ADD TO CART";
                actionButton.disabled = false;
                actionButton.className = "btn-add-to-cart";
                
                // Add click listener safely to hook back into system arrays
                actionButton.onclick = function() {
                    addToCart(menuItem);
                };
            }
        }
    });
}

// ============================================================
// CORE APPLICATION CART SYSTEM FUNCTIONS
// ============================================================
function addToCart(item) {
    const existing = cart.find(c => c.drink === (item.drink || item.name));
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            drink: item.drink || item.name,
            price: Number(item.price) || 0,
            quantity: 1
        });
    }
    syncCartUI();
}

function syncCartUI() {
    if (!cartItems) return;
    cartItems.innerHTML = "";
    let total = 0;
    let count = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        count += item.quantity;

        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.marginBottom = "10px";
        li.innerHTML = `
            <span>${item.drink} x${item.quantity}</span>
            <span>RM ${(item.price * item.quantity).toFixed(2)}</span>
        `;
        cartItems.appendChild(li);
    });

    if (cartTotal) cartTotal.textContent = "RM " + total.toFixed(2);
    if (cartCount) cartCount.textContent = count;
    updateCheckoutTotals();
}

function updateCheckoutTotals() {
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let total = (subtotal - appliedDiscount) + deliveryFee;

    if (checkoutSubtotal) checkoutSubtotal.textContent = "RM " + subtotal.toFixed(2);
    if (checkoutDiscount) checkoutDiscount.textContent = "-RM " + appliedDiscount.toFixed(2);
    if (checkoutDeliveryFee) checkoutDeliveryFee.textContent = "RM " + deliveryFee.toFixed(2);
    if (checkoutTotal) checkoutTotal.textContent = "RM " + total.toFixed(2);
}

