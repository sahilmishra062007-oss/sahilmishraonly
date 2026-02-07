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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let tools = [];
const IS_ADMIN = window.location.pathname.includes('admin');

// 🔐 SECURE LOGIN (Hidden Password)
function handleLogin() {
    const pass = document.getElementById('adminPassword').value;
    // Password "smartadmin2026" is hidden as Base64
    if (btoa(pass) === "c21hcnRhZG1pbjIwMjY=") {
        sessionStorage.setItem('adminAuth', 'true');
        location.reload(); 
    } else {
        alert("Access Denied!");
    }
}

// 🚀 DATA FETCHING
document.addEventListener('DOMContentLoaded', () => {
    db.ref('tools').on('value', (snap) => {
        const data = snap.val();
        tools = data ? Object.keys(data).map(k => ({fid: k, ...data[k]})) : [];
        tools.sort((a, b) => b.addedAt - a.addedAt);
        
        if (IS_ADMIN) {
            if (sessionStorage.getItem('adminAuth') === 'true') showDashboard();
        } else {
            renderTools();
        }
    });
});

function renderTools(search = '') {
    const grid = document.getElementById('toolsGrid');
    if(!grid) return;
    grid.innerHTML = '';
    
    const filter = document.querySelector('.pill.active')?.dataset.filter || 'all';
    
    tools.filter(t => (filter === 'all' || t.category === filter) && 
                 (t.name.toLowerCase().includes(search) || t.desc.toLowerCase().includes(search)))
         .forEach(t => {
            grid.innerHTML += `
            <div class="tool-card">
                <div class="card-glass"></div>
                <img src="${t.image || 'default-icon.png'}" class="tool-img">
                <h3>${t.name}</h3>
                <p>${t.desc}</p>
                <div class="card-footer">
                    <span><i class="fa-solid fa-bolt"></i> ${t.clicks || 0}</span>
                    <a href="${t.link}" target="_blank" onclick="trackClick('${t.fid}')" class="btn-main">Get Started</a>
                </div>
            </div>`;
    });
}

function trackClick(id) {
    const tool = tools.find(t => t.fid === id);
    db.ref('tools/' + id).update({ clicks: (tool.clicks || 0) + 1 });
}

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
        alert("Tool Live!");
        e.target.reset();
    });
}

window.handleLogin = handleLogin;
window.handleAddTool = handleAddTool;
