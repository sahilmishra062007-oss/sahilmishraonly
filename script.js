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
const storage = firebase.storage(); // Photo upload ke liye

let tools = [];
const IS_ADMIN_PAGE = window.location.pathname.includes('admin.html');

// 🔒 SECURITY CHECK
function isUserAdmin() {
    return sessionStorage.getItem('adminAuth') === 'true';
}

// 🔐 DASHBOARD TEMPLATE (Updated with File Input)
const ADMIN_DASHBOARD_TEMPLATE = `
    <div id="adminDashboard">
        <nav class="navbar">
            <div class="nav-brand"><i class="fa-solid fa-bolt"></i> <span>DASHBOARD</span></div>
            <div class="nav-links">
                <button id="logoutBtn" class="btn-danger">Logout</button>
            </div>
        </nav>

        <main class="dashboard-content" style="padding: 2rem 5%;">
            <div class="admin-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div class="tool-card" style="text-align: center; padding: 15px;">
                    <p>Total Tools</p><h2 id="adminStatTools" style="color:var(--primary)">0</h2>
                </div>
                <div class="tool-card" style="text-align: center; padding: 15px;">
                    <p>Total Clicks</p><h2 id="adminStatClicks" style="color:#10b981">0</h2>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px;">
                <section class="tool-card">
                    <h2 style="margin-bottom:15px;">Add New Tool</h2>
                    <form id="addToolForm">
                        <input type="text" id="addName" placeholder="Tool Name" required style="width:100%; margin-bottom:10px; padding:12px; border-radius:8px; border:1px solid var(--border); background:#000; color:#fff;">
                        
                        <select id="addCategory" required style="width:100%; margin-bottom:10px; padding:12px; border-radius:8px; background:#000; color:#fff;">
                            <option value="chatbot">💬 Chatbot</option>
                            <option value="image">🎨 Image AI</option>
                            <option value="video">🎬 Video AI</option>
                            <option value="audio">🎵 Audio AI</option>
                        </select>

                        <label style="font-size:0.8rem; color:var(--text-secondary);">Upload Icon Image:</label>
                        <input type="file" id="toolImageFile" accept="image/*" style="margin:10px 0;" onchange="previewImage(this)">
                        
                        <div class="preview-box">
                            <img id="imgPrev" src="https://cdn-icons-png.flaticon.com/512/2103/2103633.png">
                        </div>

                        <input type="url" id="addLink" placeholder="Tool Website Link" required style="width:100%; margin-bottom:10px; padding:12px; border-radius:8px; background:#000; color:#fff;">
                        <textarea id="addDesc" placeholder="Description..." required style="width:100%; height:80px; margin-bottom:10px; padding:12px; border-radius:8px; background:#000; color:#fff;"></textarea>
                        
                        <button type="submit" id="submitBtn" class="btn-visit" style="width:100%; border:none; padding:15px; cursor:pointer;">Add Tool</button>
                    </form>
                </section>

                <section class="tool-card">
                    <input type="text" id="adminSearch" placeholder="Search inventory..." style="width:100%; margin-bottom:15px; padding:10px; border-radius:8px; background:#000; border:1px solid var(--border); color:#fff;">
                    <div id="adminToolsList"></div>
                </section>
            </div>
        </main>
    </div>
`;

// 🖼️ IMAGE PREVIEW FUNCTION
function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => document.getElementById('imgPrev').src = e.target.result;
        reader.readAsDataURL(input.files[0]);
    }
}

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

// 📸 PHOTO UPLOAD & TOOL ADD LOGIC
function initAdminFunctions() {
    const addForm = document.getElementById('addToolForm');
    if (!addForm) return;

    addForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        const fileInput = document.getElementById('toolImageFile');
        
        btn.innerText = "Processing...";
        btn.disabled = true;

        try {
            let imageUrl = "https://cdn-icons-png.flaticon.com/512/2103/2103633.png";

            // Agar user ne file select ki hai toh upload karo
            if (fileInput.files[0]) {
                const file = fileInput.files[0];
                const storageRef = storage.ref('tool_icons/' + Date.now() + "_" + file.name);
                const snapshot = await storageRef.put(file);
                imageUrl = await snapshot.ref.getDownloadURL();
            }

            const newTool = {
                name: document.getElementById('addName').value,
                category: document.getElementById('addCategory').value,
                link: document.getElementById('addLink').value,
                desc: document.getElementById('addDesc').value,
                image: imageUrl,
                clicks: 0,
                addedAt: Date.now()
            };

            await db.ref('tools').push(newTool);
            alert("Tool Added Successfully!");
            addForm.reset();
            document.getElementById('imgPrev').src = "https://cdn-icons-png.flaticon.com/512/2103/2103633.png";

        } catch (err) {
            console.error(err);
            alert("Upload failed: " + err.message);
        } finally {
            btn.innerText = "Add Tool";
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
        <div class="tool-item">
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="${t.image}" style="width:35px; height:35px; border-radius:6px; background:white;">
                <span>${t.name}</span>
            </div>
            <button onclick="deleteTool('${t.fid}')" class="btn-danger" style="padding:5px 10px;">Delete</button>
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
    if (confirm("Delete this tool?")) db.ref('tools/' + id).remove();
}

function trackClick(id) {
    db.ref('tools/' + id).child('clicks').transaction((c) => (c || 0) + 1);
}

// 📱 PUBLIC RENDER (Wahi purana)
function renderPublicTools(search = '') {
    const grid = document.getElementById('toolsGrid');
    if(!grid) return;
    grid.innerHTML = '';
    const filtered = tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    filtered.forEach(t => {
        grid.innerHTML += `
        <div class="tool-card">
            <div class="tool-icon-container">
                <img src="${t.image}" class="tool-card-img" onerror="this.src='https://cdn-icons-png.flaticon.com/512/2103/2103633.png'">
            </div>
            <div class="tool-info">
                <span class="tool-category ${t.category}">${t.category}</span>
                <h3>${t.name}</h3>
                <p class="tool-desc">${t.desc}</p>
                <div class="tool-footer">
                    <span>🔥 ${t.clicks || 0}</span>
                    <a href="${t.link}" target="_blank" onclick="trackClick('${t.fid}')" class="btn-visit">Open</a>
                </div>
            </div>
        </div>`;
    });
}
