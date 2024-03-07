// Data import & Firebase initialization.

import { menuArray } from '/data.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js';
import { getDatabase, ref, push, onValue, remove, set, get } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js'; 

const appSettings = {
    databaseURL: 'https://realtime-database-2-a41de-default-rtdb.firebaseio.com/'
};

const app = initializeApp(appSettings);
const database = getDatabase(app);
const cartItemsDB = ref(database, 'shoppingCart');

// Elements appended to the DOM & global variables.

const foodMenu = document.getElementById('menu-items');
const shoppingCart = document.getElementById('shopping-cart');
const shoppingCartPlaceholder = document.getElementById('shopping-cart-placeholder');
const cartItemsContainer = document.getElementById('cart-items-container');
const totalPrice = document.getElementById('total-price');
const checkoutModal = document.getElementById('checkout-modal');
const checkoutForm = document.getElementById('checkout-form');
const thankYouBanner = document.getElementById('thank-you-banner');

const nameForm = document.getElementById('name-form');
const cardForm = document.getElementById('card-form');
const cvvForm = document.getElementById('cvv-form');

const cartTotal = {};
let shoppingCartCopyArr = '';

// Rendering menu items from imported data.

menuArray.forEach(function(foodItem) {
    foodMenu.innerHTML += `
        <div class="container">
            <div class="menu-entry">
                <p class="food-img">${foodItem.emoji}</p>
                <div class="food-desc">
                    <p class="food-title">${foodItem.name}</p>
                    <p class="food-ingredients">${foodItem.ingredients.join()}</p>
                    <p class="food-price">$${foodItem.price}</p>
                </div>
                <button class="add-food-btn" data-food="${foodItem.id}">+</button>
            </div>
            <hr class="light-divider">
        </div>
    `
});

// Button event listener.

document.addEventListener('click', function(e) {

    const foodAddedToCart = menuArray.filter(function(foodItem) {
        return foodItem.id === Number(e.target.dataset.food);
    })[0];

    // Click on '+' with 0 items in cart.
    if (e.target.dataset.food && shoppingCart.classList.contains('display-off')) {

        set(cartItemsDB, null);
        thankYouBanner.classList.add('display-off');
        
        shoppingCartPlaceholder.classList.add('display-off');
        shoppingCart.classList.remove('display-off');

        addItemToShoppingCart(foodAddedToCart);

    // Click on '+' with items in cart.
    } else if (e.target.dataset.food && !shoppingCart.classList.contains('display-off')) { 

        addItemToShoppingCart(foodAddedToCart);

    // Click on 'remove'.
    } else if (e.target.dataset.remove) {

        removeItemFromShoppingCart(e.target.dataset.remove);

    // Click on 'Complete order'.
    } else if (e.target.dataset.checkout) {

        checkoutModal.classList.remove('display-off');
        
    }
    
})

// Event listener for form submission. Separate event listener needed to prevent page refresh on submission.

checkoutForm.addEventListener('submit', function(e) {

    e.preventDefault();

    if (nameForm.checkValidity() && cardForm.checkValidity() && cvvForm.checkValidity()) {

        const name = nameForm.value;

        checkoutModal.classList.add('display-off');
        shoppingCart.classList.add('display-off');

        const thankYouMsg = document.createElement('h2');
        thankYouMsg.innerText = `Thanks ${name}! Your order is on its way!`

        thankYouBanner.append(thankYouMsg);

        thankYouBanner.classList.remove('display-off');

    }

})

// This function adds the passed food object into the database, retrieves the UID and then replaces the food object with the HTML to be appended.

function addItemToShoppingCart(item) {

    let foodUid = '';
    let newShoppingCartItem = '';

    push(cartItemsDB, item);

    get(cartItemsDB).then(function(snapshot) {

        Object.entries(snapshot.val()).forEach(function(dbEntryArray) {
            if (dbEntryArray[1].id === item.id) {

                foodUid = dbEntryArray[0]

                newShoppingCartItem = `
                    <div class="item-list">
                        <div class="item">
                            <div class="item-details">
                                <p class="item-name">${item.name}</p>
                                <button class="remove-btn" data-remove="${foodUid}">remove</button>
                            </div>
                            <div class="cart-price">$${item.price}</div>
                        </div>
                    </div>
                `;

                cartTotal[foodUid] = Number(item.price);

            }
        })

        const dbFoodRef = ref(database, `shoppingCart/${foodUid}`);

        set(dbFoodRef, newShoppingCartItem).then(function() {

            get(cartItemsDB).then(function(snapshot) {

                shoppingCartCopyArr = Object.values(snapshot.val()).join('');

                render(shoppingCartCopyArr);

            })
            
        })
        
        totalPrice.innerText = `$${priceCalculation(cartTotal)}`;

        return;
    })

    return;
};

// This function receives the UID and removes the associated database entry and key from the cartTotal object.

function removeItemFromShoppingCart(itemId) {

    const dbFoodRef = ref(database, `shoppingCart/${itemId}`);

    get(cartItemsDB).then(function(snapshot) {

        delete cartTotal[itemId];

        remove(dbFoodRef);

        get(cartItemsDB).then(function(snapshot) {

            if (snapshot.exists()) {

                shoppingCartCopyArr = Object.values(snapshot.val()).join('');

            } else {

                shoppingCartCopyArr = '';

                shoppingCart.classList.add('display-off');

            }

            render(shoppingCartCopyArr);
            
        })

        totalPrice.innerText = `$${priceCalculation(cartTotal)}`;

    })

    

}

// Calculates the total from the cartTotal object.

function priceCalculation(cartObj) {

    let cartTotalCalculated = 0;

    for (let key in cartObj) {
        cartTotalCalculated += cartObj[key];
    }

    return cartTotalCalculated;

}

// This function renders each item in the database. 

function render(itemsToRenderArr) {

    cartItemsContainer.innerHTML = '';

    cartItemsContainer.innerHTML = itemsToRenderArr;

    return;
}