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

// 🔐 DASHBOARD TEMPLATE
const ADMIN_DASHBOARD_TEMPLATE = `
    <div id="adminDashboard">
        <nav class="navbar">
            <div class="nav-brand"><i class="fa-solid fa-bolt"></i> <span>DASHBOARD</span></div>
            <div class="nav-links">
                <button id="logoutBtn" class="btn-danger" style="padding: 10px 20px; border-radius: 8px; cursor: pointer; border: none; background: #ef4444; color: white;">Logout</button>
            </div>
        </nav>

        <main class="dashboard-content" style="padding: 2rem 5%;">
            <div class="admin-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div class="tool-card" style="text-align: center; padding: 20px;">
                    <p style="color: var(--text-secondary);">Total Tools</p><h2 id="adminStatTools" style="color:var(--primary); font-size: 2rem;">0</h2>
                </div>
                <div class="tool-card" style="text-align: center; padding: 20px;">
                    <p style="color: var(--text-secondary);">Total Clicks</p><h2 id="adminStatClicks" style="color:#10b981; font-size: 2rem;">0</h2>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px;">
                <section class="tool-card" style="padding: 25px;">
                    <h2 style="margin-bottom:20px;"><i class="fa-solid fa-plus-circle"></i> Add New Tool</h2>
                    <form id="addToolForm">
                        <input type="text" id="addName" placeholder="Tool Name" required style="width:100%; margin-bottom:12px; padding:12px; border-radius:8px; border:1px solid var(--border); background:#000; color:#fff;">
                        
                        <select id="addCategory" required style="width:100%; margin-bottom:12px; padding:12px; border-radius:8px; background:#000; color:#fff; border:1px solid var(--border);">
                            <option value="chatbot">💬 Chatbot AI</option>
                            <option value="image">🎨 Image Generator</option>
                            <option value="video">🎬 Video AI</option>
                            <option value="audio">🎵 Music/Audio</option>
                        </select>

                        <label style="font-size:0.8rem; color:var(--text-secondary);">Icon Image URL (Use ImgBB Direct Link):</label>
                        <input type="text" id="toolImageUrl" placeholder="https://i.ibb.co/..." 
                               style="width:100%; margin-bottom:12px; padding:12px; border-radius:8px; background:#000; color:#fff; border:1px solid var(--border);"
                               oninput="document.getElementById('imgPrev').src = this.value">
                        
                        <div class="preview-box" style="width: 60px; height: 60px; background: white; border-radius: 10px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid var(--primary);">
                            <img id="imgPrev" src="https://cdn-icons-png.flaticon.com/512/2103/2103633.png" style="width: 80%; height: 80%; object-fit: contain;" onerror="this.src='https://cdn-icons-png.flaticon.com/512/2103/2103633.png'">
                        </div>

                        <input type="url" id="addLink" placeholder="Website URL" required style="width:100%; margin-bottom:12px; padding:12px; border-radius:8px; background:#000; color:#fff; border:1px solid var(--border);">
                        <textarea id="addDesc" placeholder="Short description..." required style="width:100%; height:80px; margin-bottom:15px; padding:12px; border-radius:8px; background:#000; color:#fff; border:1px solid var(--border);"></textarea>
                        
                        <button type="submit" id="submitBtn" class="btn-visit" style="width:100%; border:none; padding:15px; cursor:pointer; font-weight: bold; font-size: 1rem;">Deploy Tool</button>
                    </form>
                </section>

                <section class="tool-card" style="padding: 25px;">
                    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h2 style="margin:0;">Inventory</h2>
                        <input type="text" id="adminSearch" placeholder="Search..." style="width:150px; padding:8px; border-radius:8px; background:#000; border:1px solid var(--border); color:#fff;">
                    </div>
                    <div id="adminToolsList" style="max-height: 500px; overflow-y: auto;"></div>
                </section>
            </div>
        </main>
    </div>
`;

// 🔐 LOGIN LOGIC
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.onclick = () => {
            const passInput = document.getElementById('adminPassword').value;
            if (btoa(passInput) === "MjAxODAwNDcyMjY=") {
                sessionStorage.setItem('adminAuth', 'true');
                renderDashboardFlow();
            } else {
                alert("Wrong Password!");
            }
        };
    }
    if (IS_ADMIN_PAGE && isUserAdmin()) renderDashboardFlow();
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

function renderDashboardFlow() {
    const loginScr = document.getElementById('loginScreen');
    const root = document.getElementById('dynamicAdminRoot');
    if (loginScr) loginScr.style.display = 'none';
    if (root) {
        root.innerHTML = ADMIN_DASHBOARD_TEMPLATE;
        initAdminFunctions();
        document.getElementById('logoutBtn').onclick = () => {
            sessionStorage.clear();
            window.location.reload();
        };
        document.getElementById('adminSearch').oninput = (e) => renderAdminTools(e.target.value);
    }
}

function initAdminFunctions() {
    const addForm = document.getElementById('addToolForm');
    if (!addForm) return;

    addForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        btn.innerText = "Deploying...";
        btn.disabled = true;

        try {
            const newTool = {
                name: document.getElementById('addName').value,
                category: document.getElementById('addCategory').value,
                link: document.getElementById('addLink').value,
                desc: document.getElementById('addDesc').value,
                image: document.getElementById('toolImageUrl').value || "https://cdn-icons-png.flaticon.com/512/2103/2103633.png",
                clicks: 0,
                addedAt: Date.now()
            };

            await db.ref('tools').push(newTool);
            alert("Tool Added Successfully!");
            addForm.reset();
            document.getElementById('imgPrev').src = "https://cdn-icons-png.flaticon.com/512/2103/2103633.png";
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            btn.innerText = "Deploy Tool";
            btn.disabled = false;
        }
    };
}

// 🛠️ ADMIN TOOLS RENDER
function renderAdminTools(search = '') {
    const list = document.getElementById('adminToolsList');
    if(!list) return;
    const filtered = tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    list.innerHTML = filtered.map(t => `
        <div class="tool-item" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:12px; border-radius:10px; margin-bottom:10px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="display:flex; align-items:center; gap:12px;">
                <img src="${t.image}" style="width:40px; height:40px; border-radius:8px; background:white; object-fit:contain; padding: 2px;">
                <div>
                    <div style="font-weight:bold; font-size:0.9rem;">${t.name}</div>
                    <div style="font-size:0.7rem; color:var(--primary);">${t.category}</div>
                </div>
            </div>
            <button onclick="deleteTool('${t.fid}')" style="background:#ef4444; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
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
    if (confirm("Delete this tool forever?")) db.ref('tools/' + id).remove();
}

function trackClick(id) {
    db.ref('tools/' + id).child('clicks').transaction((c) => (c || 0) + 1);
}

// 📱 PUBLIC RENDER (With Category Filtering)
function renderPublicTools(search = '') {
    const grid = document.getElementById('toolsGrid');
    if(!grid) return;
    
    const activePill = document.querySelector('.pill.active');
    const filter = activePill ? activePill.dataset.filter : 'all';
    
    const filtered = tools.filter(t => 
        (filter === 'all' || t.category === filter) && 
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    grid.innerHTML = filtered.map(t => `
        <div class="tool-card">
            <div class="tool-icon-container">
                <img src="${t.image}" class="tool-card-img" onerror="this.src='https://cdn-icons-png.flaticon.com/512/2103/2103633.png'">
            </div>
            <div class="tool-info">
                <span class="tool-category ${t.category}">${t.category}</span>
                <h3>${t.name}</h3>
                <p class="tool-desc">${t.desc}</p>
                <div class="tool-footer" style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.8rem; color:var(--text-secondary);"><i class="fa-solid fa-fire"></i> ${t.clicks || 0}</span>
                    <a href="${t.link}" target="_blank" onclick="trackClick('${t.fid}')" class="btn-visit" style="padding:6px 18px;">Open</a>
                </div>
            </div>
        </div>`).join('');
}

// Category Pill click listener for index.html
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        renderPublicTools(document.getElementById('toolSearch')?.value || '');
    }
});
