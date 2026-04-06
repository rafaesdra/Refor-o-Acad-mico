// main.js - Inicialização da aplicação
import { carregarUsuarios, mostrarDashboard, gerarCalendario, mostrarMeta, atualizarMeta, definirUsuarioAtivo } from './user.js';
import './disciplinas.js';
import './exercicios.js';

// === INICIALIZAÇÃO ===
async function iniciar() {
  // Wait for Firebase to be initialized
  while(!window.db) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  await carregarUsuarios();
  gerarCalendario();
  mostrarMeta();
  atualizarMeta();

  // Load active user from Firestore
  try {
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js');
    const activeRef = doc(window.db, 'ativos', 'current');
    const activeSnap = await getDoc(activeRef);
    if(activeSnap.exists() && activeSnap.data().usuario){
      const userRef = doc(window.db, 'usuarios', activeSnap.data().usuario);
      const userSnap = await getDoc(userRef);
      if(userSnap.exists()){
        definirUsuarioAtivo({id: activeSnap.data().usuario, ...userSnap.data()});
        mostrarDashboard();
      }
    }
  } catch(error) {
    console.error("Erro ao carregar usuário ativo:", error);
  }
}

window.onload = iniciar;
