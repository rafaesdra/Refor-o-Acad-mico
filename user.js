// user.js - Gerenciamento de usuários, login e progresso
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, orderBy } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js';
let usuarioAtivo = null;
let metaDiaria = 3;

// === USUÁRIOS / LOGIN ===
async function carregarUsuarios(){
  // Not needed for Firestore
}

async function criarUsuario(){
  try {
    let nome = document.getElementById("username").value.trim();
    let senha = document.getElementById("password").value.trim();
    if(!nome || !senha){ document.getElementById("loginMsg").innerText="Preencha nome e senha."; return; }

    if(!window.db) { document.getElementById("loginMsg").innerText="Erro: Firebase não inicializado."; return; }
    
    const userRef = doc(window.db, 'usuarios', nome);
    const userSnap = await getDoc(userRef);
    if(userSnap.exists()){
      document.getElementById("loginMsg").innerText="Usuário já existe."; return;
    }

    const newUser = {nome, senha, xp:0, streak:0, ultimaData:null, progresso:{}};
    await setDoc(userRef, newUser);
    document.getElementById("loginMsg").innerText="Usuário criado! Agora faça login.";
  } catch(error) {
    console.error("Erro ao criar usuário:", error);
    document.getElementById("loginMsg").innerText="Erro: " + error.message;
  }
}

async function loginUsuario(){
  try {
    let nome = document.getElementById("username").value.trim();
    let senha = document.getElementById("password").value.trim();
    
    if(!window.db) { document.getElementById("loginMsg").innerText="Erro: Firebase não inicializado."; return; }
    
    const userRef = doc(window.db, 'usuarios', nome);
    const userSnap = await getDoc(userRef);

    if(!userSnap.exists() || userSnap.data().senha !== senha){
      document.getElementById("loginMsg").innerText="Usuário ou senha incorretos."; return;
    }
    usuarioAtivo = {id: nome, ...userSnap.data()};
    await setDoc(doc(window.db, 'ativos', 'current'), {usuario: nome});
    mostrarDashboard();
  } catch(error) {
    console.error("Erro ao fazer login:", error);
    document.getElementById("loginMsg").innerText="Erro: " + error.message;
  }
}

async function logout(){
  try {
    if(window.db) {
      await setDoc(doc(window.db, 'ativos', 'current'), {usuario: null});
    }
  } catch(e) {
    console.error("Erro ao fazer logout:", e);
  }
  location.reload();
}

// === DASHBOARD ===
async function mostrarDashboard(){
  document.getElementById("loginCard").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("usuarioAtivo").innerText = usuarioAtivo.nome;
  atualizarXPStreak();
  await atualizarRanking();
  
  // Carregar disciplinas quando o dashboard é mostrado
  if(window.carregarDisciplinas){
    window.carregarDisciplinas();
  }
}

// Atualiza XP e streak
function atualizarXPStreak(){
  document.getElementById("xpUsuario").innerText = usuarioAtivo.xp;
  document.getElementById("streakUsuario").innerText = usuarioAtivo.streak;
}

// Atualiza ranking histórico
async function atualizarRanking(){
  try {
    if(!window.db) return;
    const q = query(collection(window.db, 'usuarios'), orderBy('xp', 'desc'));
    const querySnapshot = await getDocs(q);
    let ol = document.getElementById("rankingHistorico");
    ol.innerHTML = "";
    querySnapshot.forEach((docSnap) => {
      let data = docSnap.data();
      let li = document.createElement("li");
      li.innerText = `${data.nome} - ${data.xp} XP`;
      ol.appendChild(li);
    });
  } catch(error) {
    console.error("Erro ao atualizar ranking:", error);
  }
}

// === STREAK ===
function atualizarStreak(){
  let hoje = new Date().toDateString();
  if(usuarioAtivo.ultimaData !== hoje){
    let ontem = new Date();
    ontem.setDate(ontem.getDate()-1);
    if(usuarioAtivo.ultimaData === ontem.toDateString()){
      usuarioAtivo.streak += 1;
    } else {
      usuarioAtivo.streak = 1;
    }
    usuarioAtivo.ultimaData = hoje;
  }
}

// === META AUTOMÁTICA ===
function registrarQuestaoDoDia(){
  let hoje = new Date().toDateString();
  let progressoHoje = JSON.parse(localStorage.getItem("progressoHoje")) || {};
  if(progressoHoje.data !== hoje){
    progressoHoje = { data: hoje, acertos: 0 };
  }
  progressoHoje.acertos += 1;
  localStorage.setItem("progressoHoje", JSON.stringify(progressoHoje));
  atualizarMeta();
}

function atualizarMeta(){
  let progressoHoje = JSON.parse(localStorage.getItem("progressoHoje"));
  if(!progressoHoje){
    document.getElementById("metaAtual").innerText = `Meta de hoje: 0 / ${metaDiaria} questões`;
    return;
  }
  let texto = `Meta de hoje: ${progressoHoje.acertos} / ${metaDiaria} questões`;
  if(progressoHoje.acertos >= metaDiaria){
    texto += " ✅ Meta concluída!";
  }
  document.getElementById("metaAtual").innerText = texto;
}

// === META ===
function salvarMeta(){
  metaDiaria = parseInt(document.getElementById("metaDiaria").value)||3;
  atualizarMeta();
}
function mostrarMeta(){ document.getElementById("metaAtual").innerText = ""; }

// === CALENDÁRIO 2026 ===
function gerarCalendario(){
  const calendario = document.getElementById("calendario2026");
  calendario.innerHTML = "";
  const diasSemana = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"];
  diasSemana.forEach(d=>{
    let el = document.createElement("div");
    el.innerText = d;
    el.className="font-bold";
    calendario.appendChild(el);
  });

  let data = new Date("2026-01-01");
  while(data.getFullYear() === 2026){
    let dia = document.createElement("div");
    dia.innerText = data.getDate();
    dia.className="p-2 rounded";
    calendario.appendChild(dia);
    data.setDate(data.getDate()+1);
  }
}

export { usuarioAtivo, metaDiaria, carregarUsuarios, criarUsuario, loginUsuario, logout, mostrarDashboard, atualizarXPStreak, atualizarRanking, atualizarStreak, registrarQuestaoDoDia, atualizarMeta, salvarMeta, mostrarMeta, gerarCalendario };

// Função para definir usuarioAtivo (usada pelo main.js)
export function definirUsuarioAtivo(user) {
  usuarioAtivo = user;
}

// Tornar funções globais para onclick no HTML
window.criarUsuario = criarUsuario;
window.loginUsuario = loginUsuario;
window.logout = logout;
window.salvarMeta = salvarMeta;
window.logout = logout;
window.salvarMeta = salvarMeta;