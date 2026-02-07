// FIREBASE CONFIG
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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let tools = [];
const IS_ADMIN_PAGE = window.location.pathname.includes('admin.html');

// 🔐 SECURE LOGIN SYSTEM
// Aapka Password: 20180047226 (Base64 encoded: MjAxODAwNDcyMjY=)
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const passInput = document.getElementById('adminPassword').value;
            if (btoa(passInput) === "MjAxODAwNDcyMjY=") {
                sessionStorage.setItem('adminAuth', 'true');
                showDashboard();
                showToast("Welcome Back, Sahil!", "success");
            } else {
                alert("Wrong Password!");
            }
        });
    }

    // Check Auth Status on Admin Page
    if (IS_ADMIN_PAGE && sessionStorage.getItem('adminAuth') === 'true') {
        showDashboard();
    }
});

// 🚀 DATA FETCHING & SYNC
db.ref('tools').on('value', (snap) => {
    const data = snap.val();
    tools = data ? Object.keys(data).map(k => ({fid: k, ...data[k]})) : [];
    tools.sort((a, b) => b.addedAt - a.addedAt);
    
    if (IS_ADMIN_PAGE) {
        if (sessionStorage.getItem('adminAuth') === 'true') {
            renderAdminTools();
            updateStats();
        }
    } else {
        renderPublicTools();
    }
});

// 📱 RENDER PUBLIC TOOLS (Index Page)
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
        <div class="tool-card animate-in">
            <div class="tool-icon-container">
                <img src="${t.image || 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'}" class="tool-card-img">
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

// 🛠️ ADMIN: RENDER TOOLS LIST WITH EDIT/DELETE
function renderAdminTools() {
    const list = document.getElementById('adminToolsList');
    if(!list) return;
    list.innerHTML = '';

    tools.forEach(t => {
        list.innerHTML += `
        <div class="tool-item">
            <div class="tool-item-info">
                <img src="${t.image}" style="width:40px; height:40px; border-radius:8px;">
                <div>
                    <h4 style="margin:0">${t.name}</h4>
                    <small>${t.clicks} Clicks</small>
                </div>
            </div>
            <div class="tool-item-actions">
                <button onclick="deleteTool('${t.fid}')" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>`;
    });
}

// 📈 UPDATE DASHBOARD STATS
function updateStats() {
    document.getElementById('adminStatTools').innerText = tools.length;
    const totalClicks = tools.reduce((sum, t) => sum + (t.clicks || 0), 0);
    document.getElementById('adminStatClicks').innerText = totalClicks;
    document.getElementById('adminLastUpdated').innerText = new Date().toLocaleTimeString();
}

// 🖱️ TRACK CLICKS
function trackClick(id) {
    const tool = tools.find(t => t.fid === id);
    if(tool) {
        db.ref('tools/' + id).update({ clicks: (tool.clicks || 0) + 1 });
    }
}

// ➕ ADD NEW TOOL
const addForm = document.getElementById('addToolForm');
if (addForm) {
    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
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
            alert("Tool Added Successfully!");
            addForm.reset();
            document.getElementById('imgPrev').src = 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png';
        });
    });
}

// 🗑️ DELETE TOOL
function deleteTool(id) {
    if(confirm("Are you sure you want to delete this tool?")) {
        db.ref('tools/' + id).remove().then(() => {
            alert("Tool Removed!");
        });
    }
}

// 🚪 LOGOUT
const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('adminAuth');
        location.reload();
    });
}

// 🖼️ UI HELPERS
function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('adminDashboard').classList.remove('hidden');
}

// Search Logic for Index Page
const searchInput = document.getElementById('searchInput');
if(searchInput) {
    searchInput.addEventListener('input', (e) => renderPublicTools(e.target.value));
}

// Category Filter Logic
document.querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelector('.pill.active').classList.remove('active');
        this.classList.add('active');
        renderPublicTools(document.getElementById('searchInput')?.value || '');
    });
});
