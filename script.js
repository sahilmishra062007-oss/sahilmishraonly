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

// 🔒 SECURITY CHECK
function isUserAdmin() {
    return sessionStorage.getItem('adminAuth') === 'true';
}

// 🔐 DASHBOARD KA KHAZANA (HTML INJECTION)
const ADMIN_DASHBOARD_TEMPLATE = `
    <div id="adminDashboard">
        <nav class="navbar">
            <div class="nav-brand"><i class="fa-solid fa-bolt"></i> <span>DASHBOARD</span></div>
            <div class="nav-links">
                <button id="logoutBtn" class="btn-danger" style="padding: 10px 25px; border-radius: 12px; font-weight: 800; cursor: pointer; border: none; background: #ef4444; color: white;">
                    <i class="fa-solid fa-power-off"></i> Logout
                </button>
            </div>
        </nav>

        <main class="dashboard-content" style="padding: 3rem 5%;">
            <div class="admin-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 25px; margin-bottom: 40px;">
                <div class="tool-card" style="text-align: center;">
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Total AI Tools</p>
                    <h2 id="adminStatTools" style="font-size: 2.5rem; color: var(--primary);">0</h2>
                </div>
                <div class="tool-card" style="text-align: center;">
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">Total Traffic</p>
                    <h2 id="adminStatClicks" style="font-size: 2.5rem; color: #10b981;">0</h2>
                </div>
                <div class="tool-card" style="text-align: center;">
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">System Status</p>
                    <h2 id="adminLastUpdated" style="font-size: 1.2rem; margin-top: 15px; color: #f59e0b;">Online</h2>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 30px;">
                <section class="admin-section tool-card">
                    <h2 style="margin-bottom: 20px;"><i class="fa-solid fa-plus-circle"></i> Add New AI Tool</h2>
                    <form id="addToolForm">
                        <input type="text" id="addName" placeholder="Tool Name (e.g. ChatGPT)" required>
                        <select id="addCategory" required>
                            <option value="chatbot">💬 Chatbot AI</option>
                            <option value="image">🎨 Image Generator</option>
                            <option value="video">🎬 Video Editor</option>
                            <option value="audio">🎵 Music/Audio</option>
                        </select>
                        <span class="preview-label">Icon Image URL:</span>
                        <input type="text" id="toolImage" placeholder="https://link-to-logo.png" oninput="document.getElementById('imgPrev').src = this.value">
                        <div class="preview-box">
                            <img id="imgPrev" src="https://cdn-icons-png.flaticon.com/512/2103/2103633.png" onerror="this.src='https://cdn-icons-png.flaticon.com/512/2103/2103633.png'">
                        </div>
                        <input type="url" id="addLink" placeholder="Official Website URL" required>
                        <textarea id="addDesc" placeholder="Write a short catchy description..." required></textarea>
                        <button type="submit" class="btn-visit" style="width: 100%; border: none; padding: 18px; border-radius: 12px; font-weight: 800; font-size: 1rem; cursor: pointer;">Deploy to Public Hub</button>
                    </form>
                </section>

                <section class="admin-section tool-card">
                    <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                        <h2><i class="fa-solid fa-list-check"></i> Inventory</h2>
                        <input type="text" id="adminSearch" placeholder="Search tools..." style="width: 180px; margin-bottom: 0; padding: 8px 15px;">
                    </div>
                    <div id="adminToolsList" style="max-height: 550px; overflow-y: auto; padding-right: 10px;"></div>
                </section>
            </div>
        </main>
    </div>
`;

// 🔐 LOGIN LOGIC
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const passInput = document.getElementById('adminPassword').value;
            // Password: 20180047226
            if (btoa(passInput) === "MjAxODAwNDcyMjY=") {
                sessionStorage.setItem('adminAuth', 'true');
                renderDashboardFlow();
            } else {
                alert("Wrong Password! Access Denied.");
            }
        });
    }

    if (IS_ADMIN_PAGE && isUserAdmin()) {
        renderDashboardFlow();
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

// 🔥 DASHBOARD RENDER & ACTIVATION
function renderDashboardFlow() {
    const loginScr = document.getElementById('loginScreen');
    const root = document.getElementById('dynamicAdminRoot');
    
    if (loginScr) loginScr.style.display = 'none';
    if (root) {
        root.innerHTML = ADMIN_DASHBOARD_TEMPLATE;
        initAdminFunctions();
        
        // Logout setup
        document.getElementById('logoutBtn').onclick = () => {
            sessionStorage.clear();
            window.location.reload();
        };

        // Admin Search setup
        document.getElementById('adminSearch').oninput = (e) => renderAdminTools(e.target.value);
    }
}

function initAdminFunctions() {
    const addForm = document.getElementById('addToolForm');
    if (addForm) {
        addForm.onsubmit = (e) => {
            e.preventDefault();
            if (!isUserAdmin()) return alert("Unauthorized!");

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
                document.getElementById('imgPrev').src = 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png';
            });
        };
    }
}

// 🛠️ ADMIN TOOLS RENDER
function renderAdminTools(search = '') {
    const list = document.getElementById('adminToolsList');
    if(!list) return;
    
    const filtered = tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    
    list.innerHTML = filtered.map(t => `
        <div class="tool-item" style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.05); padding:15px; border-radius:12px; margin-bottom:10px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="display:flex; align-items:center; gap:15px;">
                <img src="${t.image}" style="width:45px; height:45px; border-radius:10px; object-fit:contain; background:white; padding:2px;">
                <div>
                    <h4 style="margin:0; font-size:1rem;">${t.name}</h4>
                    <small style="color:var(--primary)">${t.category}</small>
                </div>
            </div>
            <button onclick="deleteTool('${t.fid}')" style="background:#ef4444; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
        </div>`).join('');
}

function updateStats() {
    if(document.getElementById('adminStatTools')) {
        document.getElementById('adminStatTools').innerText = tools.length;
        const totalClicks = tools.reduce((sum, t) => sum + (t.clicks || 0), 0);
        document.getElementById('adminStatClicks').innerText = totalClicks;
    }
}

function deleteTool(id) {
    if (isUserAdmin() && confirm("Delete this tool forever?")) {
        db.ref('tools/' + id).remove();
    }
}

// 📱 PUBLIC RENDER (Wahi purana)
function renderPublicTools(search = '') {
    const grid = document.getElementById('toolsGrid');
    if(!grid) return;
    grid.innerHTML = '';
    const activePill = document.querySelector('.pill.active');
    const filter = activePill ? activePill.dataset.filter : 'all';
    const filtered = tools.filter(t => (filter === 'all' || t.category === filter) && t.name.toLowerCase().includes(search.toLowerCase()));

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
