// ⚙️ FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyDAVY2FKh9YKqviuQz34VNAToxo0SfCJTQ",
    authDomain: "smart-52618.firebaseapp.com",
    projectId: "smart-52618",
    storageBucket: "smart-52618.firebasestorage.app",
    messagingSenderId: "931868149631",
    appId: "1:931868149631:web:48c37395b0df7e55427c4a",
    databaseURL: "https://smart-52618-default-rtdb.firebaseio.com/"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let tools = [];
const IS_ADMIN_PAGE = window.location.pathname.includes('admin.html');

// 🔒 SECURITY GUARD
function isUserAdmin() {
    return sessionStorage.getItem('adminAuth') === 'true';
}

// 🔐 SECURE LOGIN
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const passInput = document.getElementById('adminPassword').value;
            if (btoa(passInput) === "MjAxODAwNDcyMjY=") {
                sessionStorage.setItem('adminAuth', 'true');
                showDashboard();
            } else {
                alert("Wrong Password! Access Denied.");
            }
        });
    }

    if (IS_ADMIN_PAGE && isUserAdmin()) {
        showDashboard();
    }
});

// 🚀 REAL-TIME SYNC
db.ref('tools').on('value', (snap) => {
    const data = snap.val();
    tools = data ? Object.keys(data).map(k => ({fid: k, ...data[k]})) : [];
    tools.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    
    if (IS_ADMIN_PAGE && isUserAdmin()) {
        renderAdminTools();
        updateStats();
    } else if (!IS_ADMIN_PAGE) {
        renderPublicTools();
    }
});

// 📱 RENDER PUBLIC TOOLS
function renderPublicTools(search = '') {
    const grid = document.getElementById('toolsGrid');
    if(!grid) return;
    grid.innerHTML = '';
    
    const activePill = document.querySelector('.pill.active');
    const filter = activePill ? activePill.dataset.filter : 'all';
    
    const filtered = tools.filter(t => 
        (filter === 'all' || t.category === filter) && 
        (t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase()))
    );

    filtered.forEach(t => {
        grid.innerHTML += `
        <div class="tool-card">
            <div class="tool-icon-container">
                <img src="${t.image || 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'}" class="tool-card-img" onerror="this.src='https://cdn-icons-png.flaticon.com/512/2103/2103633.png'">
            </div>
            <div class="tool-info">
                <span class="tool-category ${t.category}">${t.category}</span>
                <h3>${t.name}</h3>
                <p class="tool-desc">${t.desc}</p>
                <div class="tool-footer">
                    <span><i class="fa-solid fa-fire"></i> ${t.clicks || 0}</span>
                    <a href="${t.link}" target="_blank" onclick="trackClick('${t.fid}')" class="btn-visit">Open Tool</a>
                </div>
            </div>
        </div>`;
    });
}

// 🛡️ ADMIN PANEL CONTROL
function showDashboard() {
    const loginScr = document.getElementById('loginScreen');
    const adminDash = document.getElementById('adminDashboard');
    if(loginScr) loginScr.classList.add('hidden');
    if(adminDash) adminDash.classList.remove('hidden');
    
    // 🔥 UPLOAD LOGIC SIRF LOGIN KE BAAD START HOGA
    initAdminFunctions();
}

function initAdminFunctions() {
    const addForm = document.getElementById('addToolForm');
    if (addForm && !addForm.dataset.active) {
        addForm.dataset.active = "true"; // Prevent duplicate listeners
        addForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!isUserAdmin()) {
                alert("Security Breach: Unauthorized!");
                return;
            }

            const newTool = {
                name: document.getElementById('addName').value,
                category: document.getElementById('addCategory').value,
                link: document.getElementById('addLink').value,
                desc: document.getElementById('addDesc').value,
                image: document.getElementById('toolImage').value || 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png',
                clicks: 0,
                addedAt: Date.now()
            };

            db.ref('tools').push(newTool).then(() => {
                alert("Success: Tool Added!");
                addForm.reset();
            });
        });
    }
}

// 🛠️ ADMIN TOOLS RENDER
function renderAdminTools() {
    const list = document.getElementById('adminToolsList');
    if(!list) return;
    list.innerHTML = tools.map(t => `
        <div class="tool-item">
            <div style="display:flex; align-items:center; gap:15px;">
                <img src="${t.image}" style="width:40px; height:40px; border-radius:8px;">
                <div><h4 style="margin:0">${t.name}</h4><small>${t.category}</small></div>
            </div>
            <button onclick="deleteTool('${t.fid}')" class="btn-danger"><i class="fa-solid fa-trash"></i></button>
        </div>`).join('');
}

function updateStats() {
    if(document.getElementById('adminStatTools')) {
        document.getElementById('adminStatTools').innerText = tools.length;
        const totalClicks = tools.reduce((sum, t) => sum + (t.clicks || 0), 0);
        document.getElementById('adminStatClicks').innerText = totalClicks;
        document.getElementById('adminLastUpdated').innerText = new Date().toLocaleTimeString();
    }
}

function deleteTool(id) {
    if (!isUserAdmin()) return;
    if(confirm("Delete this tool forever?")) {
        db.ref('tools/' + id).remove();
    }
}

function trackClick(id) {
    db.ref('tools/' + id).child('clicks').transaction((c) => (c || 0) + 1);
}

const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.clear();
        location.href = 'index.html';
    });
}
