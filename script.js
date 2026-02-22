/* ================= FIREBASE ================= */
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, query, where, getDocs, addDoc, onSnapshot, orderBy }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


/* ================= ELEMENTS ================= */
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const ordersLink = document.getElementById("ordersLink");

const searchIcon = document.getElementById("searchIcon");
const navSearch = document.querySelector(".nav-search");
const navSearchInput = document.getElementById("navSearchInput");
const closeSearchBtn = document.getElementById("closeSearch");

const cartBtn = document.getElementById("cartBtn");
const cartSidebar = document.getElementById("cartSidebar");
const closeCart = document.getElementById("closeCart");
const cartBox = document.querySelector(".cart-items");
const cartTotal = document.getElementById("cartTotal");
const count = document.getElementById("cartCount");

const menuBox = document.querySelector(".menu-container");

const addressModal = document.getElementById("addressModal");
const addressText = document.getElementById("addressText");
const confirmOrderBtn = document.getElementById("confirmOrder");
const closeAddress = document.getElementById("closeAddress");

const ordersSection = document.getElementById("orders");
const ordersList = document.getElementById("ordersList");


/* ================= AUTH UI ================= */
onAuthStateChanged(auth, user => {
  loginBtn.style.display = user ? "none" : "inline-block";
  logoutBtn.style.display = user ? "inline-block" : "none";
  ordersLink.style.display = user ? "inline-block" : "none";
});


/* ================= UTILITIES ================= */
function formatDate(isoString) {
  return new Date(isoString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}


/* ================= NAV  ================= */
document.getElementById("hamburger").onclick = () =>
document.getElementById("navLink").classList.toggle("active");

cartBtn.onclick = () => cartSidebar.classList.add("active");
closeCart.onclick = () => cartSidebar.classList.remove("active");


/* ================= SEARCH ================= */
searchIcon.onclick = () => {
  searchIcon.classList.toggle("active");
  navSearchInput.classList.toggle("active");
  navSearch.classList.toggle("active");
  closeSearchBtn.classList.toggle("active");

  if (navSearchInput.classList.contains("active")) {
    navSearchInput.focus();
  } else {
    navSearchInput.value = "";
    filterMenu("");
  }

};

closeSearchBtn.onclick = () => {
  navSearchInput.classList.remove("active");
  navSearch.classList.remove("active");
  closeSearchBtn.classList.remove("active");
  searchIcon.classList.remove("active");
  navSearchInput.value = "";
  filterMenu("");
};

navSearchInput.addEventListener("input", () => {
  filterMenu(navSearchInput.value);
});

function filterMenu(query) {
  query = query.toLowerCase();
  document.querySelectorAll(".menu-card").forEach(card => {
    const name = card.querySelector("h3").innerText.toLowerCase();
    card.style.display = name.includes(query) ? "block" : "none";
  });
}


/* ================= MENU ================= */
async function loadMenu() {
  const snap = await getDocs(collection(db, "menu"));
  snap.forEach(doc => {
    const item = doc.data();
    if (item.status === "active") {
      createMenuCard(doc.id, item);
    }
  });
}

loadMenu();

function createMenuCard(id, item) {
  const card = document.createElement("div");
  card.className = "menu-card";

  card.innerHTML = `
    <img src="${item.image}">
    <h3>${item.name}</h3>
    <p>₹${item.price}</p>
    <button class="add-btn">Add to Cart</button>
  `;

  card.querySelector("button").onclick = () =>
    addToCart({ id, ...item });

  menuBox.appendChild(card);
}


/* ================= CART ================= */
let cart = [];

function updateTotal() {
  let total = 0;
  cart.forEach(i => total += i.price * i.qty);
  cartTotal.innerText = total.toFixed(2);
}

function addToCart(item) {
  if (cart.find(i => i.id === item.id)) {
    alert("Item already in cart");
    return;
  }
  count.innerText = Number(count.innerText) + 1;
  item.qty = 1;
  cart.push(item);

  const div = document.createElement("div");
  div.className = "item";

  div.innerHTML = `
    <img src="${item.image}">
    <div class="item-info">
      <h4>${item.name}</h4>
    </div>

    <div class="item-qty">
      <button class="minus"><i class="fa-solid fa-minus"></i></button>
      <span>${item.qty}</span>
      <button class="plus"><i class="fa-solid fa-plus"></i></button>
    </div>

    <div class="item-price">₹${item.price}</div>
  `;

  cartBox.appendChild(div);
  updateTotal();

  const qtyEl = div.querySelector("span");
  const priceEl = div.querySelector(".item-price");

  div.querySelector(".plus").onclick = () => {
    item.qty++;
    qtyEl.innerText = item.qty;
    priceEl.innerText = "₹" + (item.qty * item.price);
    updateTotal();
  };

  div.querySelector(".minus").onclick = () => {
    if (item.qty > 1) {
      item.qty--;
      qtyEl.innerText = item.qty;
      priceEl.innerText = "₹" + (item.qty * item.price);
    } else {
      count.innerText = Number(count.innerText) - 1;
      cart = cart.filter(i => i.id !== item.id);
      div.remove();
    }
    updateTotal();
  };
}


/* ================= PLACE ORDER (STEP 1) ================= */
document.querySelector(".order-btn").onclick = () => {
  const user = auth.currentUser;

  if (!user) return alert("Login first");
  if (!cart.length) return alert("Cart empty");

  addressModal.style.display = "flex";
};

/* ================= CONFIRM ORDER (STEP 2) ================= */
confirmOrderBtn.onclick = async () => {
  const user = auth.currentUser;

  if (!addressText.value.trim()) {
    return alert("Please enter delivery address");
  }

  await addDoc(collection(db, "orders"), {
    userId: user.uid,
    items: cart,
    total: cartTotal.innerText,
    address: addressText.value,
    payment: "Cash on Delivery",
    date: new Date().toISOString(),
    status: "Pending"
  });

  alert("Order placed successfully.");

  addressModal.style.display = "none";
  cartBox.innerHTML = "";
  cart = [];
  cartTotal.innerText = "0.00";
};

/* ================= CLOSE ADDRESS MODAL ================= */
closeAddress.onclick = () => {
  addressModal.style.display = "none";
};


/* ================= SHOW ORDERS (REAL-TIME) ================= */
ordersLink.onclick = () => {
  const user = auth.currentUser;
  if (!user) return;

  ordersSection.style.display = "flex";
  ordersList.innerHTML = "";

  const q = query(
    collection(db, "orders"),
    where("userId", "==", user.uid),
    orderBy("date", "desc")
  );

  onSnapshot(q, (snap) => {
    ordersList.innerHTML = "";

    if (snap.empty) {
      ordersList.innerHTML = "<p>No orders yet</p>";
      return;
    }

    snap.forEach(docSnap => {
      const o = docSnap.data();

      let itemsHTML = "";
      o.items.forEach(item => {
        itemsHTML += `<li>${item.name} x ${item.qty} — ₹${item.price * item.qty}</li>`;
      });

      const div = document.createElement("div");
      div.className = "order-card";

      div.innerHTML = `
        <p><b>Date:</b> ${formatDate(o.date)}</p>
        <p><b>Status:</b> ${o.status || "Pending"}</p>
        <p><b>Address:</b> ${o.address}</p>
        <p><b>Payment:</b> ${o.payment}</p>
        <ul>${itemsHTML}</ul>
        <p><b>Total:</b> ₹${o.total}</p>
        <hr>
      `;

      ordersList.appendChild(div);
    });
  });
};

document.getElementById("closeOrders").onclick = () =>
  ordersSection.style.display = "none";


/* ================= LOGOUT ================= */
logoutBtn.onclick = async () => {
  await signOut(auth);
  alert("Logged out");
  location.reload();
};
