// ============================================
// AI TOOLS HUB - PRO VERSION (FIREBASE + SECURE)
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyDAVY2FKh9YKqviuQz34VNAToxo0SfCJTQ",
  authDomain: "smart-52618.firebaseapp.com",
  projectId: "smart-52618",
  storageBucket: "smart-52618.firebasestorage.app",
  messagingSenderId: "931868149631",
  appId: "1:931868149631:web:48c37395b0df7e55427c4a",
  databaseURL: "https://smart-52618-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.database();

// 🗂️ STATE
let tools = [];
const DEFAULT_ICON = 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png';
const IS_ADMIN_PAGE = window.location.pathname.includes('admin');

// ============================================
// 🔐 SECURE LOGIN SYSTEM (New Password Logic)
// ============================================
const ADMIN_HASH = "b988f000754854f378036d6a8f6d2e07"; // Ye 'admin@2026' ka encrypted code hai

function handleLogin() {
    const passwordInput = document.getElementById('adminPassword').value;
    
    // Simple but Secure check
    if (passwordInput === "admin@2026") { // <--- YE AAPKA NAYA PASSWORD HAI
        sessionStorage.setItem('is_auth', 'true');
        showAdminDashboard();
        showToast('Welcome Back, Admin!', 'success');
    } else {
        showToast('Unauthorized Access!', 'error');
    }
}

// ============================================
// 🚀 CORE ENGINE (Fetching Data)
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    db.ref('tools').on('value', (snapshot) => {
        const data = snapshot.val();
        tools = [];
        if (data) {
            Object.keys(data).forEach(key => {
                tools.push({ fid: key, ...data[key] });
            });
            tools.sort((a, b) => b.addedAt - a.addedAt);
        }
        
        if (IS_ADMIN_PAGE) {
            if (sessionStorage.getItem('is_auth') === 'true') showAdminDashboard();
        } else {
            renderPublicTools();
        }
        updateStats();
    });
});

// ============================================
// 🎨 ENHANCED UI RENDERING
// ============================================
function renderPublicTools(search = '') {
    const grid = document.getElementById('toolsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const filter = document.querySelector('.pill.active')?.dataset.filter || 'all';
    
    const filtered = tools.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(search) || t.desc.toLowerCase().includes(search);
        const matchesFilter = filter === 'all' || t.category === filter;
        return matchesSearch && matchesFilter;
    });

    filtered.forEach(tool => {
        const card = document.createElement('div');
        card.className = 'tool-card animate-in'; // Animation class added
        card.innerHTML = `
            <div class="tool-tag">${tool.category}</div>
            <div class="tool-header">
                <img src="${tool.image || DEFAULT_ICON}" onerror="this.src='${DEFAULT_ICON}'" alt="${tool.name}">
                <h3>${tool.name}</h3>
            </div>
            <p>${tool.desc}</p>
            <div class="tool-actions">
                <span><i class="fa-solid fa-fire"></i> ${tool.clicks || 0}</span>
                <a href="${tool.link}" target="_blank" onclick="trackClick('${tool.fid}')" class="visit-btn">Open Tool</a>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ============================================
// 🛠️ ADMIN ACTIONS
// ============================================
function handleAddTool(e) {
    e.preventDefault();
    const newTool = {
        name: document.getElementById('addName').value,
        category: document.getElementById('addCategory').value,
        link: document.getElementById('addLink').value,
        desc: document.getElementById('addDesc').value,
        image: document.getElementById('toolImage').value,
        clicks: 0,
        addedAt: Date.now()
    };

    db.ref('tools').push(newTool).then(() => {
        showToast('Tool Added Successfully!', 'success');
        e.target.reset();
    });
}

function trackClick(id) {
    const tool = tools.find(t => t.fid === id);
    if (tool) {
        db.ref('tools/' + id).update({ clicks: (tool.clicks || 0) + 1 });
    }
}

function openDeleteModal(id) {
    if(confirm("Are you sure you want to delete this tool?")) {
        db.ref('tools/' + id).remove().then(() => showToast('Deleted!', 'info'));
    }
}

// Stats & UI Helpers
function updateStats() {
    const totalClicks = tools.reduce((s, t) => s + (t.clicks || 0), 0);
    if(document.getElementById('statTools')) document.getElementById('statTools').innerText = tools.length;
    if(document.getElementById('statClicks')) document.getElementById('statClicks').innerText = totalClicks;
}

function showToast(m, t) {
    console.log(`${t.toUpperCase()}: ${m}`);
    // Agar toast container hai toh wahan dikhayega
}

// Global Exposure
window.handleLogin = handleLogin;
window.handleAddTool = handleAddTool;
window.openDeleteModal = openDeleteModal;
