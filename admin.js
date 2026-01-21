/* ================= FIREBASE ================= */
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, getDoc, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy }
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";


/* ================= ELEMENTS ================= */
const right = document.getElementById("right");
const section = document.getElementById("panel");
const hamburger = document.getElementById("hamburger");
const box = document.getElementById("totalEarning");
const reset = document.querySelector(".reset");


/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "login.html";

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || !snap.data().isAdmin) {
    alert("Access denied");
    location.href = "index.html";
    return;
  }

});


/* ================= NAV ================= */
hamburger.onclick = () => right.classList.toggle("active");

document.querySelector(".add-item").onclick = showAddItem;
document.querySelector(".list-item").onclick = showMenu;
document.querySelector(".orders").onclick = showOrders;
document.querySelector(".log-out").onclick = logout;


/* ================= HELPERS ================= */
function formatDate(isoString) {
  if (!isoString) return "N/A";

  return new Date(isoString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

/* ================= RESET ================= */
reset.onclick = () => {
  totalEarnings = 0;
  localStorage.setItem("totalEarnings", 0);
  box.innerText = `₹0`;

};


/* ================= TOTAL EARNINGS ================= */
let totalEarnings = Number(localStorage.getItem("totalEarnings")) || 0;
if (box) box.innerText = `₹${totalEarnings}`;


/* ================= CLOSE ================= */
function closeSection() {
  section.innerHTML = "";

}


/* ================= ADD MENU ITEM ================= */
function showAddItem() {

  section.innerHTML = `
    <div class="admin-panel">
      <div class="close">✖</div>
      <h3>Add Menu Item</h3>
      <input id="name" placeholder="Item name">
      <input id="price" placeholder="Price">
      <input id="image" placeholder="Image URL or path">
      <button id="save">Add Item</button>
    </div>
  `;

  document.querySelector(".close").onclick = closeSection;

  document.getElementById("save").onclick = async () => {
    const name = document.getElementById("name").value.trim();
    const price = document.getElementById("price").value.trim();
    const image = document.getElementById("image").value.trim();

    if (!name || !price || !image) {
      alert("Fill all fields");
      return;
    }

    await addDoc(collection(db, "menu"), {
      name,
      price: Number(price),
      image,
      status: "active"
    });

    alert("Item added");
    closeSection();
  };
}


/* ================= MENU LIST ================= */
async function showMenu() {

  section.innerHTML = `
    <div class="admin-panel">
      <span class="close">✖</span>
      <h3>Menu Items</h3>
      <div id="menuList"></div>
    </div>
  `;

  document.querySelector(".close").onclick = closeSection;

  const list = document.getElementById("menuList");
  const snap = await getDocs(collection(db, "menu"));

  if (snap.empty) {
    list.innerHTML = "<p>No menu items</p>";
    return;
  }

  snap.docs.forEach(d => {
    const i = d.data();

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${i.image}" width="60">
      <p>${i.name} - ₹${i.price}</p>

      <button class="status-btn ${i.status || "active"}">${i.status || "active"}</button>
      <button  onclick="deleteItem('${d.id}')">Delete</button>
    `;

    const statusBtn = card.querySelector(".status-btn");

    statusBtn.onclick = async () => {
      const newStatus =
        statusBtn.innerText === "active" ? "inactive" : "active";

      await updateDoc(doc(db, "menu", d.id), {
        status: newStatus
      });

      statusBtn.innerText = newStatus;
      statusBtn.className = `status-btn ${newStatus}`;
    };

    list.appendChild(card);
  });
}


/* ================= DELETE ================= */
window.deleteItem = async (id) => {

  await deleteDoc(doc(db, "menu", id));
  showMenu();

};


/* ================= ORDERS ================= */
async function showOrders() {

  section.innerHTML = `
    <div class="admin-panel order">
      <span class="close">✖</span>
      <h3>Orders</h3>
      <div id="orderList"></div>
    </div>
  `;

  document.querySelector(".close").onclick = closeSection;

  const list = document.getElementById("orderList");

  const q = query(
    collection(db, "orders"),
    orderBy("date", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    list.innerHTML = "<p>No orders found</p>";
    return;
  }

  snap.docs.forEach(d => {
    const o = d.data();

    let itemsHTML = "";
    o.items.forEach(it => {
      itemsHTML += `<li>${it.name} x ${it.qty} (₹${it.price})</li>`;
    });

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <p><b>Customer ID:</b> ${o.userId}</p>
      <p><b>Date:</b> ${formatDate(o.date)}</p>
      <p><b>Address:</b> ${o.address || "N/A"}</p>
      <p><b>Payment:</b> ${o.payment || "N/A"}</p>

      <p><b>Status:</b></p>
      <ul class="status-list flex" data-id="${d.id}">
        <li class="status-item ${o.status === "Pending" ? "active" : ""}">Pending</li>
        <li class="status-item ${o.status === "Processing" ? "active" : ""}">Processing</li>
        <li class="status-item ${o.status === "Delivered" ? "active" : ""}">Delivered</li>
      </ul>

      <ul class="order-items">${itemsHTML}</ul>
      <p><b>Total:</b> ₹${o.total}</p>
    `;

    const statusItems = card.querySelectorAll(".status-item");

    statusItems.forEach(item => {
      item.onclick = async () => {
        const newStatus = item.innerText;
        const orderId = card.querySelector(".status-list").dataset.id;
        const currentStatus = o.status;

        const statusOrder = ["Pending", "Processing", "Delivered"];

        if (statusOrder.indexOf(newStatus) < statusOrder.indexOf(currentStatus)) {
          alert(`Cannot revert status from "${currentStatus}" to "${newStatus}"`);
          return;
        }

        try {
          await updateDoc(doc(db, "orders", orderId), { status: newStatus });

          if (newStatus === "Delivered" && currentStatus !== "Delivered") {
            totalEarnings += Number(o.total);
            localStorage.setItem("totalEarnings", totalEarnings);
            box.innerText = `₹${totalEarnings}`;
          }

          o.status = newStatus; 

          statusItems.forEach(i => i.classList.remove("active"));
          item.classList.add("active");

          alert(`Order status updated to "${newStatus}"`);
        } catch (err) {
          console.error(err);
          alert("Failed to update order status");
        }
      };
    });
    list.appendChild(card);
  });
}


/* ================= LOGOUT ================= */
async function logout() {

  await signOut(auth);
  location.href = "login.html";

}
