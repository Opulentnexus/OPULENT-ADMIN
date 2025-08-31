// ---------------- Firebase Setup ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Config
const firebaseConfig = {
  apiKey: "AIzaSyBOCm04lnMOLcp2nQ_VY18o_0uyMyisyX4",
  authDomain: "opulent-f4da9.firebaseapp.com",
  projectId: "opulent-f4da9",
  storageBucket: "opulent-f4da9.firebasestorage.app",
  messagingSenderId: "1034930012269",
  appId: "1:1034930012269:web:89e8f6877530560400bf64",
  measurementId: "G-TC7N7D8J65"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------------- Tabs Functionality ----------------
const navLinks = document.querySelectorAll(".nav-link");
const tabs = document.querySelectorAll(".tab");

navLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const tabId = link.getAttribute("data-tab");
    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    tabs.forEach(tab => {
      tab.classList.remove("active");
      if (tab.id === "tab-" + tabId) tab.classList.add("active");
    });
  });
});

// ---------------- Firebase Data Handling ----------------
const userForm = document.getElementById("userForm");
const userList = document.getElementById("userList");
const taskForm = document.getElementById("taskForm");
const taskUserEmail = document.getElementById("taskUserEmail");
const taskList = document.getElementById("taskList");
const notificationList = document.getElementById("notificationList");

// Add User
userForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("userName").value;
  const email = document.getElementById("userEmail").value;
  const role = document.getElementById("userRole").value;

  await addDoc(collection(db, "users"), { name, email, role, createdAt: new Date() });
  userForm.reset();
});

// Real-time Users with Delete Button
onSnapshot(query(collection(db, "users"), orderBy("createdAt", "desc")), (snap) => {
  userList.innerHTML = "";
  taskUserEmail.innerHTML = '<option value="">Select User</option>';
  snap.forEach((docSnap) => {
    const u = docSnap.data();
    const li = document.createElement("li");
    li.innerHTML = `
      ${u.name} (${u.role}) - ${u.email}
      <button class="delete-btn" data-id="${docSnap.id}">❌ Delete</button>
    `;
    userList.appendChild(li);

    // add to task dropdown
    const opt = document.createElement("option");
    opt.value = u.email;
    opt.textContent = `${u.name} (${u.role})`;
    taskUserEmail.appendChild(opt);

    // Delete handler
    li.querySelector(".delete-btn").addEventListener("click", async () => {
      if (confirm(`Delete user ${u.name}?`)) {
        await deleteDoc(doc(db, "users", docSnap.id));
      }
    });
  });
});

// Add Task
taskForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("taskUserEmail").value;
  const title = document.getElementById("taskTitle").value;
  const details = document.getElementById("taskDetails").value;
  const deadline = document.getElementById("taskDeadline").value;

  await addDoc(collection(db, "tasks"), { 
    email, 
    title, 
    details, 
    deadline, 
    status:"Pending", 
    createdAt:new Date() 
  });
  taskForm.reset();
});

// ---------------- Notifications ----------------
async function saveNotification(msg) {
  await addDoc(collection(db, "notifications"), {
    message: msg,
    createdAt: new Date()
  });
}

// Listen to notifications
onSnapshot(query(collection(db, "notifications"), orderBy("createdAt", "desc")), (snap) => {
  notificationList.innerHTML = "";
  snap.forEach((docSnap) => {
    const n = docSnap.data();
    const li = document.createElement("li");
    li.textContent = n.message;
    notificationList.appendChild(li);
  });
});

// ---------------- Real-time Tasks ----------------
onSnapshot(query(collection(db, "tasks"), orderBy("createdAt", "desc")), (snap) => {
  taskList.innerHTML = "";

  snap.docChanges().forEach(change => {
    const t = change.doc.data();
    if (change.type === "modified") {
      saveNotification(`✅ ${t.email} marked "${t.title}" as ${t.status}`);
    }
  });

  snap.forEach((docSnap) => {
    const t = docSnap.data();
    const li = document.createElement("li");
    li.innerHTML = `
      <b>${t.title}</b><br>${t.details}<br>
      <small>${t.email}</small><br>
      <span class="status ${t.status.toLowerCase()}">${t.status}</span><br>
      <small>Deadline: ${t.deadline || "N/A"}</small>
      <button class="delete-task-btn" data-id="${docSnap.id}">🗑 Delete Task</button>
    `;
    taskList.appendChild(li);

    // Delete handler
    li.querySelector(".delete-task-btn").addEventListener("click", async () => {
      if (confirm(`Delete task "${t.title}" assigned to ${t.email}?`)) {
        await deleteDoc(doc(db, "tasks", docSnap.id));
      }
    });
  });
});

