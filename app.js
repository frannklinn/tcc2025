// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  doc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// ==================== CONFIGURAÇÃO SEGURA DO FIREBASE ====================
// ATENÇÃO: Em produção, mova estas credenciais para variáveis de ambiente
const firebaseConfig = {
  apiKey: "AIzaSyCWB2EZidqC2i9b0PY5w9a_0Yu8udfGwOw",
  authDomain: "restaurante-tasti.firebaseapp.com",
  projectId: "restaurante-tasti",
  storageBucket: "restaurante-tasti.firebasestorage.app",
  messagingSenderId: "63622945173",
  appId: "1:63622945173:web:1a78045875957ac7e53e9c",
  measurementId: "G-DH1FWLFKF6"
};

// ==================== INICIALIZAÇÃO SEGURA ====================
let app, analytics, db;

function initializeFirebase() {
  try {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    db = getFirestore(app);
    console.log('✅ Firebase inicializado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
    return false;
  }
}

// ==================== SISTEMA DE SEGURANÇA ====================
// Função básica de hash (em produção use bcrypt)
function simpleHash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

// Validar dados de entrada
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
}

// ==================== VARIÁVEIS GLOBAIS ====================
let reservas = [];
let cardapio = {
  entradas: [],
  principais: [],
  sobremesas: [],
  bebidas: []
};
let usuarios = [];
const totalMesas = 12;
let firebaseInitialized = false;

// ==================== SISTEMA DE LOG E MONITORAMENTO ====================
const Logger = {
  info: (message, data = null) => {
    console.log(`ℹ️ ${message}`, data || '');
  },
  error: (message, error = null) => {
    console.error(`❌ ${message}`, error || '');
  },
  warn: (message, data = null) => {
    console.warn(`⚠️ ${message}`, data || '');
  }
};

// ==================== SISTEMA DE USUÁRIOS (FIREBASE) ====================
async function carregarUsuarios() {
  if (!firebaseInitialized) {
    Logger.warn('Firebase não inicializado, usando localStorage');
    const usuariosSalvos = localStorage.getItem('usuarios');
    usuarios = usuariosSalvos ? JSON.parse(usuariosSalvos) : [];
    return;
  }

  try {
    const querySnapshot = await getDocs(collection(db, "usuarios"));
    usuarios = [];
    querySnapshot.forEach((doc) => {
      usuarios.push({ id: doc.id, ...doc.data() });
    });
    Logger.info('Usuários carregados do Firebase', usuarios.length);
  } catch (error) {
    Logger.error("Erro ao carregar usuários:", error);
    // Fallback para localStorage
    const usuariosSalvos = localStorage.getItem('usuarios');
    usuarios = usuariosSalvos ? JSON.parse(usuariosSalvos) : [];
  }
}

async function salvarUsuarioFirebase(usuario) {
  if (!firebaseInitialized) {
    Logger.warn('Firebase não disponível, salvando localmente');
    usuario.id = Date.now().toString();
    usuarios.push(usuario);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    return usuario.id;
  }

  try {
    // Sanitizar dados e aplicar hash na senha
    const usuarioSanitizado = {
      nome: sanitizeInput(usuario.nome),
      telefone: sanitizeInput(usuario.telefone),
      email: sanitizeInput(usuario.email),
      senha: simpleHash(usuario.senha), // Hash básico - em produção use bcrypt
      dataCadastro: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, "usuarios"), usuarioSanitizado);
    Logger.info('Usuário salvo no Firebase', docRef.id);
    return docRef.id;
  } catch (error) {
    Logger.error("Erro ao salvar usuário no Firebase:", error);
    // Fallback para localStorage
    usuario.id = Date.now().toString();
    usuarios.push(usuario);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    return usuario.id;
  }
}

async function verificarUsuarioExistente(email) {
  await carregarUsuarios();
  return usuarios.find(u => u.email === sanitizeInput(email));
}

function salvarUsuarios() {
  localStorage.setItem('usuarios', JSON.stringify(usuarios));
}

function getUsuarioLogado() {
  try {
    const usuario = localStorage.getItem('usuarioLogado');
    return usuario ? JSON.parse(usuario) : null;
  } catch (error) {
    Logger.error('Erro ao recuperar usuário logado', error);
    return null;
  }
}

function setUsuarioLogado(usuario) {
  try {
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    Logger.info('Usuário logado definido', usuario.nome);
  } catch (error) {
    Logger.error('Erro ao definir usuário logado', error);
  }
}

function logout() {
  localStorage.removeItem('usuarioLogado');
  alert("Você saiu da sua conta.");
  window.location.href = 'index.html';
}

// ==================== VALIDAÇÃO DE EMAIL ====================
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// ==================== CARROSSEL ====================
function inicializarCarrossel() {
  try {
    let idx = 0;
    const imagens = document.querySelectorAll('#carrossel img');
    
    if (imagens.length > 0) {
      setInterval(() => {
        imagens.forEach(i => i.classList.remove('ativo'));
        idx = (idx + 1) % imagens.length;
        imagens[idx].classList.add('ativo');
      }, 3000);
      Logger.info('Carrossel inicializado');
    }
  } catch (error) {
    Logger.error('Erro ao inicializar carrossel', error);
  }
}

// ==================== MINI CARROSSEL ====================
function inicializarMiniCarrossel() {
  try {
    const miniCarrossel = document.getElementById("miniCarrossel");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const indicatorsContainer = document.getElementById("miniIndicators");

    if (!miniCarrossel) return;

    let offset = 0;
    const imagemLargura = 330;
    const imagens = document.querySelectorAll("#miniCarrossel img");
    let totalSlides = Math.max(0, imagens.length - 3);

    // Criar indicadores
    if (indicatorsContainer) {
      indicatorsContainer.innerHTML = '';
      imagens.forEach((_, i) => {
        const dot = document.createElement("div");
        dot.classList.add("dot");
        if (i === 0) dot.classList.add("active");
        dot.addEventListener("click", () => {
          offset = -i * imagemLargura;
          atualizarMiniCarrossel();
          atualizarDots(i);
        });
        indicatorsContainer.appendChild(dot);
      });
    }

    function atualizarMiniCarrossel() {
      miniCarrossel.style.transform = `translateX(${offset}px)`;
    }

    function atualizarDots(index) {
      document.querySelectorAll(".dot").forEach(dot => dot.classList.remove("active"));
      const dots = document.querySelectorAll(".dot");
      if (dots[index]) dots[index].classList.add("active");
    }

    // Event listeners para botões (se existirem)
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        offset += imagemLargura;
        if (offset > 0) offset = -(imagemLargura * totalSlides);
        atualizarMiniCarrossel();
        atualizarDots(Math.abs(offset) / imagemLargura);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        offset -= imagemLargura;
        if (Math.abs(offset) > imagemLargura * totalSlides) offset = 0;
        atualizarMiniCarrossel();
        atualizarDots(Math.abs(offset) / imagemLargura);
      });
    }

    Logger.info('Mini carrossel inicializado');
  } catch (error) {
    Logger.error('Erro ao inicializar mini carrossel', error);
  }
}

// ==================== RESERVAS (FIREBASE) ====================
async function inicializarReservas() {
  await carregarReservasFirebase();
  configurarFormReserva();
  configurarListenerReservas();
}

async function carregarReservasFirebase() {
  if (!firebaseInitialized) {
    Logger.warn('Firebase não inicializado, usando localStorage para reservas');
    const reservasLocal = localStorage.getItem('reservas');
    if (reservasLocal) {
      reservas = JSON.parse(reservasLocal);
      renderReservas();
      renderMesas();
    }
    return;
  }

  try {
    const querySnapshot = await getDocs(collection(db, "reservas"));
    reservas = [];
    querySnapshot.forEach((doc) => {
      reservas.push({ id: doc.id, ...doc.data() });
    });
    renderReservas();
    renderMesas();
    Logger.info('Reservas carregadas do Firebase', reservas.length);
  } catch (error) {
    Logger.error("Erro ao carregar reservas:", error);
    // Fallback para localStorage
    const reservasLocal = localStorage.getItem('reservas');
    if (reservasLocal) {
      reservas = JSON.parse(reservasLocal);
      renderReservas();
      renderMesas();
    }
  }
}

function configurarListenerReservas() {
  if (!firebaseInitialized) {
    Logger.warn('Firebase não disponível para listener em tempo real');
    return;
  }

  try {
    onSnapshot(collection(db, "reservas"), (snapshot) => {
      reservas = [];
      snapshot.forEach((doc) => {
        reservas.push({ id: doc.id, ...doc.data() });
      });
      renderReservas();
      renderMesas();
      if (document.getElementById('reservasAdmin')) {
        renderAdmin();
      }
      Logger.info('Reservas atualizadas em tempo real');
    });
  } catch (error) {
    Logger.error('Erro no listener de reservas', error);
  }
}

function configurarFormReserva() {
  const formReserva = document.getElementById('formReserva');
  if (!formReserva) return;

  // Configurar botão de desconto
  const btnDesconto = document.getElementById('btnDesconto');
  const aniversarioInput = document.getElementById('aniversario');
  
  if (btnDesconto && aniversarioInput) {
    btnDesconto.addEventListener('click', () => {
      aniversarioInput.style.display = aniversarioInput.style.display === 'none' ? 'block' : 'none';
    });
  }

  formReserva.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Loading state
    const btnSubmit = formReserva.querySelector('button[type="submit"]');
    const originalText = btnSubmit.textContent;
    btnSubmit.textContent = "Processando...";
    btnSubmit.disabled = true;

    try {
      const mesaInput = document.getElementById('mesa');
      if (!mesaInput || !mesaInput.value) {
        alert("Por favor, selecione uma mesa no mapa!");
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
        return;
      }

      const usuarioLogado = getUsuarioLogado();
      const nomeReserva = usuarioLogado ? usuarioLogado.nome : sanitizeInput(document.getElementById('nome').value);
      const emailReserva = usuarioLogado ? usuarioLogado.email : sanitizeInput(document.getElementById('email').value);

      if (!nomeReserva || !emailReserva) {
        alert("Por favor, faça login ou preencha seus dados.");
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
        return;
      }

      // Validação de email para usuários não logados
      if (!usuarioLogado && !validarEmail(emailReserva)) {
        alert("Por favor, insira um e-mail válido.");
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
        return;
      }

      const reservaData = {
        nome: nomeReserva,
        email: emailReserva,
        data: document.getElementById('data').value,
        hora: document.getElementById('hora').value,
        pessoas: document.getElementById('pessoas').value,
        mesa: mesaInput.value,
        aniversario: document.getElementById('aniversario').value,
        timestamp: Timestamp.now(),
        desconto: "",
        usuarioId: usuarioLogado ? usuarioLogado.id : null
      };

      // Validação de data/hora
      const dataReserva = new Date(reservaData.data + ' ' + reservaData.hora);
      if (dataReserva < new Date()) {
        alert("Não é possível fazer reservas em datas/horários passados!");
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
        return;
      }

      // Verificar limite de mesas por horário
      const reservasNoHorario = reservas.filter(r => 
        r.data === reservaData.data && 
        r.hora === reservaData.hora
      ).length;

      if (reservasNoHorario >= totalMesas) {
        alert("Horário indisponível! Todas as mesas estão reservadas para este horário.");
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
        return;
      }

      // Verificar desconto de aniversário
      if (reservaData.aniversario) {
        const hoje = new Date().toISOString().slice(5, 10);
        if (reservaData.aniversario.slice(5, 10) === hoje) {
          reservaData.desconto = "🎉 Desconto de Aniversário!";
        }
      }

      try {
        if (firebaseInitialized) {
          await addDoc(collection(db, "reservas"), reservaData);
          Logger.info('Reserva salva no Firebase');
        } else {
          // Fallback para localStorage
          reservaData.id = Date.now().toString();
          reservas.push(reservaData);
          localStorage.setItem('reservas', JSON.stringify(reservas));
          renderReservas();
          renderMesas();
          Logger.info('Reserva salva localmente');
        }
        
        formReserva.reset();
        if (aniversarioInput) aniversarioInput.style.display = 'none';
        
        // Se usuário não estava logado, limpar campos de nome e email
        if (!usuarioLogado) {
          document.getElementById('nome').value = '';
          document.getElementById('email').value = '';
        }
        
        alert("Reserva realizada com sucesso!");
      } catch (error) {
        Logger.error("Erro ao fazer reserva:", error);
        // Fallback para localStorage
        reservaData.id = Date.now().toString();
        reservas.push(reservaData);
        localStorage.setItem('reservas', JSON.stringify(reservas));
        formReserva.reset();
        if (aniversarioInput) aniversarioInput.style.display = 'none';
        alert("Reserva realizada (modo offline)!");
        renderReservas();
        renderMesas();
      }
    } finally {
      // Restaurar botão
      btnSubmit.textContent = originalText;
      btnSubmit.disabled = false;
    }
  });

  // Atualizar mapa de mesas quando data mudar
  const dataInput = document.getElementById('data');
  if (dataInput) {
    dataInput.addEventListener('change', renderMesas);
  }

  // Preencher automaticamente se usuário estiver logado
  const usuarioLogado = getUsuarioLogado();
  if (usuarioLogado) {
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    if (nomeInput) nomeInput.value = usuarioLogado.nome;
    if (emailInput) emailInput.value = usuarioLogado.email;
    if (nomeInput && emailInput) {
      nomeInput.readOnly = true;
      emailInput.readOnly = true;
    }
  }
}

function renderReservas() {
  const div = document.getElementById('listaReservas');
  if (!div) return;
  
  const usuarioLogado = getUsuarioLogado();
  let reservasParaExibir = reservas;

  // Se usuário está logado, mostrar apenas suas reservas
  if (usuarioLogado) {
    reservasParaExibir = reservas.filter(r => r.usuarioId === usuarioLogado.id || r.email === usuarioLogado.email);
  }

  div.innerHTML = "<h3>Minhas Reservas</h3>";
  if (reservasParaExibir.length === 0) {
    div.innerHTML += "<p>Nenhuma reserva encontrada.</p>";
    return;
  }

  reservasParaExibir.forEach(r => {
    div.innerHTML += `
      <div class="reserva-item">
        <p><strong>${sanitizeInput(r.nome)}</strong> - ${r.data} ${r.hora} (Mesa ${r.mesa}, ${r.pessoas} pessoas) ${r.desconto || ''}</p>
      </div>
    `;
  });
}

// ==================== CARDÁPIO (FIREBASE) ====================
async function inicializarCardapio() {
  await carregarCardapioFirebase();
  configurarFormPrato();
  configurarListenerCardapio();
}

async function carregarCardapioFirebase() {
  if (!firebaseInitialized) {
    Logger.warn('Firebase não inicializado, usando localStorage para cardápio');
    const cardapioLocal = localStorage.getItem('cardapio');
    if (cardapioLocal) {
      cardapio = JSON.parse(cardapioLocal);
    } else {
      // Dados iniciais
      cardapio = {
        entradas: [
          {nome:"Onion Rings", preco:"25.00", img:"https://www.spicebangla.com/wp-content/uploads/2024/07/Crispy-Onion-Rings.webp"},
          {nome:"Mini Bruschetta", preco:"22.00", img:"https://www.receiteria.com.br/wp-content/uploads/receitas-de-bruschetta-1.jpg"}
        ],
        principais: [
          {nome:"Risoto de Camarão", preco:"68.00", img:"https://s2-receitas.glbimg.com/KWpGf7SHzNbPSab_Z3fmhDOGCmo=/0x0:1080x608/924x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_e84042ef78cb4708aeebdf1c68c6cbd6/internal_photos/bs/2022/A/5/RQBWn4SlyzO0JWxYflwg/capa-materia-gshow-102-.png"},
          {nome:"Carne ao molho", preco:"75.00", img:"https://www.sabornamesa.com.br/media/k2/items/cache/1d05de4b50ede21b7617d543f5f98a74_XL.jpg"}
        ],
        sobremesas: [
          {nome:"Petit Gateau", preco:"28.00", img:"https://canalcozinha.com.br/wp-content/uploads/2025/09/petit-gateau-simples-e-rapido.jpg"},
          {nome:"Cheesecake", preco:"30.00", img:"https://www.receitasnestle.com.br/sites/default/files/srh_recipes/8fafc3935c766bf8c9f1331a325e48a9.jpg"}
        ],
        bebidas: [
          {nome:"Caipirinha", preco:"22.00", img:"https://cms-bomgourmet.s3.amazonaws.com/bomgourmet%2F2022%2F01%2F11162753%2FCaipirinha-A-Typical-Brazilia-313710112.jpg"},
          {nome:"Refrigerante", preco:"8.00", img:"https://static.vecteezy.com/ti/fotos-gratis/p2/2181622-dois-copos-de-refrigerante-gratis-foto.jpg"}
        ]
      };
    }
    renderMenuDividido();
    return;
  }

  try {
    const querySnapshot = await getDocs(collection(db, "cardapio"));
    cardapio = { entradas: [], principais: [], sobremesas: [], bebidas: [] };
    
    querySnapshot.forEach((doc) => {
      const prato = doc.data();
      if (cardapio[prato.categoria]) {
        cardapio[prato.categoria].push({ id: doc.id, ...prato });
      }
    });
    
    renderMenuDividido();
    Logger.info('Cardápio carregado do Firebase');
  } catch (error) {
    Logger.error("Erro ao carregar cardápio:", error);
    // Fallback para localStorage
    const cardapioLocal = localStorage.getItem('cardapio');
    if (cardapioLocal) {
      cardapio = JSON.parse(cardapioLocal);
    }
    renderMenuDividido();
  }
}

function configurarListenerCardapio() {
  if (!firebaseInitialized) {
    Logger.warn('Firebase não disponível para listener do cardápio');
    return;
  }

  try {
    onSnapshot(collection(db, "cardapio"), (snapshot) => {
      cardapio = { entradas: [], principais: [], sobremesas: [], bebidas: [] };
      
      snapshot.forEach((doc) => {
        const prato = doc.data();
        if (cardapio[prato.categoria]) {
          cardapio[prato.categoria].push({ id: doc.id, ...prato });
        }
      });
      
      renderMenuDividido();
      if (document.getElementById('listaPratos')) {
        renderAdmin();
      }
      Logger.info('Cardápio atualizado em tempo real');
    });
  } catch (error) {
    Logger.error('Erro no listener do cardápio', error);
  }
}

function renderMenuDividido() {
  const categorias = ['entradas', 'principais', 'sobremesas', 'bebidas'];
  
  categorias.forEach(categoria => {
    const div = document.querySelector(`#${categoria} .categoria`);
    if (div) {
      div.innerHTML = "";
      
      if (cardapio[categoria].length === 0) {
        div.innerHTML = "<p>Nenhum prato cadastrado.</p>";
        return;
      }

      cardapio[categoria].forEach(prato => {
        div.innerHTML += `
          <div class="prato-card">
            <img src="${prato.img}" alt="${sanitizeInput(prato.nome)}" onerror="this.src='https://via.placeholder.com/150?text=Imagem+Indisponível'">
            <div class="prato-info">
              <h4>${sanitizeInput(prato.nome)}</h4>
              <p class="preco">R$ ${parseFloat(prato.preco).toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
        `;
      });
    }
  });
}

function configurarFormPrato() {
  const formPrato = document.getElementById('formPrato');
  if (!formPrato) return;

  formPrato.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Loading state
    const btnSubmit = formPrato.querySelector('button[type="submit"]');
    const originalText = btnSubmit.textContent;
    btnSubmit.textContent = "Adicionando...";
    btnSubmit.disabled = true;

    try {
      const pratoData = {
        nome: sanitizeInput(document.getElementById('pratoNome').value),
        preco: document.getElementById('pratoPreco').value,
        img: sanitizeInput(document.getElementById('pratoImg').value) || "https://via.placeholder.com/150?text=Sem+Imagem",
        categoria: document.getElementById('pratoCategoria').value,
        timestamp: Timestamp.now()
      };

      if (!pratoData.categoria) {
        alert("Escolha uma categoria!");
        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
        return;
      }

      try {
        if (firebaseInitialized) {
          await addDoc(collection(db, "cardapio"), pratoData);
          Logger.info('Prato adicionado no Firebase');
        } else {
          // Fallback para localStorage
          pratoData.id = Date.now().toString();
          if (!cardapio[pratoData.categoria]) {
            cardapio[pratoData.categoria] = [];
          }
          cardapio[pratoData.categoria].push(pratoData);
          localStorage.setItem('cardapio', JSON.stringify(cardapio));
          renderMenuDividido();
          Logger.info('Prato adicionado localmente');
        }
        
        formPrato.reset();
        alert(`Prato adicionado em ${pratoData.categoria}!`);
      } catch (error) {
        Logger.error("Erro ao adicionar prato:", error);
        // Fallback para localStorage
        pratoData.id = Date.now().toString();
        if (!cardapio[pratoData.categoria]) {
          cardapio[pratoData.categoria] = [];
        }
        cardapio[pratoData.categoria].push(pratoData);
        localStorage.setItem('cardapio', JSON.stringify(cardapio));
        formPrato.reset();
        renderMenuDividido();
        alert(`Prato adicionado (modo offline)!`);
      }
    } finally {
      // Restaurar botão
      btnSubmit.textContent = originalText;
      btnSubmit.disabled = false;
    }
  });
}

// ==================== MAPA DE MESAS ====================
function getMesaPositionStyle(mesaId) {
  const map = {
    1:  "grid-row: 1 / 2; grid-column: 1 / 2;",
    2:  "grid-row: 1 / 2; grid-column: 2 / 3;",
    3:  "grid-row: 1 / 2; grid-column: 3 / 4;",
    4:  "grid-row: 2 / 3; grid-column: 1 / 2;",
    5:  "grid-row: 2 / 3; grid-column: 2 / 3;",
    6:  "grid-row: 2 / 3; grid-column: 3 / 4;",
    7:  "grid-row: 3 / 4; grid-column: 1 / 2;",
    8:  "grid-row: 3 / 4; grid-column: 2 / 3;",
    9:  "grid-row: 3 / 4; grid-column: 3 / 4;",
    10: "grid-row: 4 / 5; grid-column: 1 / 2;",
    11: "grid-row: 4 / 5; grid-column: 2 / 3;",
    12: "grid-row: 4 / 5; grid-column: 3 / 4;"
  };
  return map[mesaId] || "";
}

function renderMesas() {
  const div = document.getElementById('mapaMesas');
  if (!div) return;
  
  div.innerHTML = "";
  const dataSelecionada = document.getElementById('data') ? document.getElementById('data').value : null;

  for (let i = 1; i <= totalMesas; i++) {
    let ocupada = reservas.some(r => r.mesa == i && r.data === dataSelecionada);
    
    let mesaDiv = document.createElement('div');
    mesaDiv.classList.add('mesa');
    mesaDiv.style.cssText = getMesaPositionStyle(i);
    
    // Mesas retangulares
    if (i === 1 || i === 2 || i === 11) {
      mesaDiv.classList.add('mesa-retangular');
    }
    
    mesaDiv.innerText = "Mesa " + i;

    if (ocupada) {
      mesaDiv.classList.add('ocupada');
      mesaDiv.title = "Mesa ocupada para esta data";
    } else {
      mesaDiv.title = "Clique para selecionar esta mesa";
      mesaDiv.addEventListener('click', () => {
        document.querySelectorAll('.mesa').forEach(m => m.classList.remove('selecionada'));
        mesaDiv.classList.add('selecionada');
        const mesaInput = document.getElementById('mesa');
        if (mesaInput) mesaInput.value = i;
      });
    }
    div.appendChild(mesaDiv);
  }
}

// ==================== ADMIN ====================
function loginAdmin() {
  const u = sanitizeInput(document.getElementById('adminUser').value);
  const p = sanitizeInput(document.getElementById('adminPass').value);
  
  if (u === "admin" && p === "123") {
    document.getElementById('loginAdmin').style.display = "none";
    document.getElementById('painel').style.display = "block";
    renderAdmin();
    Logger.info('Admin logado com sucesso');
  } else {
    alert("Usuário ou senha incorretos");
    Logger.warn('Tentativa de login admin falhou');
  }
}

async function removerPrato(categoria, index, pratoId = null) {
  if (!confirm("Tem certeza que deseja remover este prato?")) return;

  try {
    if (pratoId && firebaseInitialized) {
      // Remover do Firebase
      await deleteDoc(doc(db, "cardapio", pratoId));
      Logger.info('Prato removido do Firebase', pratoId);
    } else {
      // Remover do localStorage (fallback)
      cardapio[categoria].splice(index, 1);
      localStorage.setItem('cardapio', JSON.stringify(cardapio));
      renderAdmin();
      renderMenuDividido();
      Logger.info('Prato removido localmente');
    }
  } catch (error) {
    Logger.error("Erro ao remover prato:", error);
    // Fallback
    cardapio[categoria].splice(index, 1);
    localStorage.setItem('cardapio', JSON.stringify(cardapio));
    renderAdmin();
    renderMenuDividido();
  }
}

function renderAdmin() {
  // Renderizar reservas
  const divRes = document.getElementById('reservasAdmin');
  if (divRes) {
    divRes.innerHTML = "<h3>Reservas Recentes</h3>";
    if (reservas.length === 0) {
      divRes.innerHTML += "<p>Nenhuma reserva encontrada.</p>";
    } else {
      reservas.forEach(r => {
        divRes.innerHTML += `
          <div class="reserva-admin-item">
            <p><strong>${sanitizeInput(r.nome)}</strong> (${sanitizeInput(r.email)})<br>
            ${r.data} ${r.hora} - Mesa ${r.mesa} - ${r.pessoas} pessoas<br>
            ${r.desconto || ''}</p>
          </div>
        `;
      });
    }
  }

  // Renderizar cardápio
  const lista = document.getElementById('listaPratos');
  if (lista) {
    lista.innerHTML = "<h3>Cardápio - Gerenciar Pratos</h3>";
    let temPratos = false;
    
    for (let categoria in cardapio) {
      if (cardapio[categoria].length > 0) {
        temPratos = true;
        lista.innerHTML += `<h4>${categoria.charAt(0).toUpperCase() + categoria.slice(1)}</h4>`;
        cardapio[categoria].forEach((p, index) => {
          lista.innerHTML += `
            <div class="prato-admin-item">
              <p><strong>${sanitizeInput(p.nome)}</strong> - R$ ${p.preco}</p>
              <button class="remover-btn" onclick="removerPrato('${categoria}', ${index}, '${p.id || ''}')">Remover</button>
            </div>
          `;
        });
      }
    }
    
    if (!temPratos) {
      lista.innerHTML += "<p>Nenhum prato cadastrado.</p>";
    }
  }
}

// ==================== LOGIN CLIENTE ====================
async function loginCliente() {
  const email = sanitizeInput(document.getElementById('clienteEmail').value);
  const senha = sanitizeInput(document.getElementById('clientePass').value);

  if (!email || !senha) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  if (!validarEmail(email)) {
    alert("Por favor, insira um e-mail válido.");
    return;
  }

  // Buscar usuário no Firebase
  await carregarUsuarios();
  const usuario = usuarios.find(u => u.email === email && u.senha === simpleHash(senha));
  
  if (usuario) {
    setUsuarioLogado(usuario);
    alert(`Bem-vindo de volta, ${usuario.nome}!`);
    Logger.info('Cliente logado com sucesso', usuario.nome);
    window.location.href = 'index.html';
  } else {
    alert("E-mail ou senha incorretos. Tente novamente ou crie uma conta.");
    Logger.warn('Tentativa de login cliente falhou', email);
  }
}

// ==================== CRIAR CONTA ====================
async function criarConta() {
  const nome = sanitizeInput(document.getElementById('cadNome').value);
  const telefone = sanitizeInput(document.getElementById('cadTelefone').value);
  const email = sanitizeInput(document.getElementById('cadEmail').value);
  const senha = sanitizeInput(document.getElementById('cadSenha').value);
  const confirmarSenha = sanitizeInput(document.getElementById('cadConfirmarSenha').value);

  // Validações
  if (!nome || !telefone || !email || !senha || !confirmarSenha) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  if (!validarEmail(email)) {
    alert("Por favor, insira um e-mail válido.");
    return;
  }

  if (senha !== confirmarSenha) {
    alert("As senhas não coincidem. Tente novamente.");
    return;
  }

  if (senha.length < 6) {
    alert("A senha deve ter pelo menos 6 caracteres.");
    return;
  }

  // Verificar se usuário já existe
  const usuarioExistente = await verificarUsuarioExistente(email);
  
  if (usuarioExistente) {
    alert("Já existe uma conta com este e-mail. Tente fazer login.");
    return;
  }

  // Criar novo usuário
  const novoUsuario = {
    nome: nome,
    telefone: telefone,
    email: email,
    senha: senha, // Será hasheada na função salvarUsuarioFirebase
    dataCadastro: new Date().toISOString()
  };

  try {
    // Salvar usuário no Firebase
    const usuarioId = await salvarUsuarioFirebase(novoUsuario);
    novoUsuario.id = usuarioId;
    
    // Logar automaticamente
    setUsuarioLogado(novoUsuario);
    
    alert(`Conta criada com sucesso! Bem-vindo ao Tasti, ${nome}!`);
    Logger.info('Nova conta criada', nome);
    window.location.href = 'index.html';
  } catch (error) {
    Logger.error("Erro ao criar conta:", error);
    alert("Erro ao criar conta. Tente novamente.");
  }
}

// ==================== VERIFICAR USUÁRIO LOGADO ====================
function verificarUsuarioLogado() {
  const usuarioLogado = getUsuarioLogado();
  if (usuarioLogado) {
    Logger.info(`Usuário logado: ${usuarioLogado.nome}`);
    // Atualizar interface
    const loginLinks = document.querySelectorAll('a[href="login_cliente.html"]');
    loginLinks.forEach(link => {
      link.textContent = `👤 ${usuarioLogado.nome.split(' ')[0]}`;
      link.href = 'javascript:void(0)';
      link.onclick = logout;
      link.style.fontWeight = 'bold';
      link.style.color = '#2ecc71';
    });
    
    // Adicionar botão de logout em mais lugares se necessário
    const nav = document.querySelector('nav');
    if (nav && !document.querySelector('.logout-btn')) {
      const logoutBtn = document.createElement('button');
      logoutBtn.textContent = 'Sair';
      logoutBtn.className = 'logout-btn';
      logoutBtn.onclick = logout;
      logoutBtn.style.marginLeft = '10px';
      logoutBtn.style.padding = '5px 10px';
      logoutBtn.style.background = '#e74c3c';
      logoutBtn.style.color = 'white';
      logoutBtn.style.border = 'none';
      logoutBtn.style.borderRadius = '3px';
      logoutBtn.style.cursor = 'pointer';
      nav.appendChild(logoutBtn);
    }
  }
}

// ==================== SISTEMA DE TESTES ====================
async function testarSistema() {
  Logger.info('Iniciando testes do sistema...');
  
  // Teste de Firebase
  if (firebaseInitialized) {
    Logger.info('✅ Firebase conectado');
  } else {
    Logger.warn('⚠️ Firebase offline - usando modo local');
  }
  
  // Teste de dados locais
  const usuarioLogado = getUsuarioLogado();
  if (usuarioLogado) {
    Logger.info('✅ Usuário logado:', usuarioLogado.nome);
  }
  
  Logger.info(`✅ ${reservas.length} reservas carregadas`);
  Logger.info(`✅ Cardápio com ${Object.keys(cardapio).reduce((acc, cat) => acc + cardapio[cat].length, 0)} pratos`);
}

// ==================== INICIALIZAÇÃO GERAL ====================
document.addEventListener('DOMContentLoaded', async function() {
  Logger.info('Inicializando Restaurante Tasti...');
  
  // Inicializar Firebase
  firebaseInitialized = initializeFirebase();
  
  // Carregar dados iniciais
  await carregarUsuarios();
  verificarUsuarioLogado();
  
  // Inicializar componentes
  inicializarCarrossel();
  inicializarMiniCarrossel();
  inicializarReservas();
  inicializarCardapio();
  
  // Configurar data mínima para reservas (hoje)
  const dataInput = document.getElementById('data');
  if (dataInput) {
    const hoje = new Date().toISOString().split('T')[0];
    dataInput.min = hoje;
    dataInput.value = hoje;
  }
  
  // Executar testes do sistema
  await testarSistema();
});

// ==================== EXPORTAR FUNÇÕES GLOBAIS ====================
window.loginAdmin = loginAdmin;
window.loginCliente = loginCliente;
window.removerPrato = removerPrato;
window.criarConta = criarConta;
window.logout = logout;
window.verificarUsuarioLogado = verificarUsuarioLogado;
window.testarSistema = testarSistema;
