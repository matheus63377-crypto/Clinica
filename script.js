// SENHAS DE ACESSO
const SENHA_MESTRE = "pet123";          // Acesso total (Adm)
const SENHA_FUNCIONARIO = "funcionario123"; // Acesso restrito (Agenda e Banho/Tosa)

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDmvZrKvhm0pmofPiejBGNT4ItaMz5EpvM",
  authDomain: "barracao-pet-db.firebaseapp.com",
  databaseURL: "https://barracao-pet-db-default-rtdb.firebaseio.com",
  projectId: "barracao-pet-db",
  storageBucket: "barracao-pet-db.firebasestorage.app",
  messagingSenderId: "411704840688",
  appId: "1:411704840688:web:cc47f23cf326021ce68d35",
  measurementId: "G-RQFLZ71JTN"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let state = {
  consultas: [],
  banhotosa: [],
  cirurgias: [],
  vacinas: [],
  vendas: [],
  crm: []
};

let selectedDate = new Date().toISOString().split('T')[0];
let currentUserRole = localStorage.getItem('bcp_role') || null;

document.addEventListener("DOMContentLoaded", () => {
  if (currentUserRole) {
    iniciarApp(currentUserRole);
  }
});

function validarLogin(e) {
  e.preventDefault();
  const senhaInput = document.getElementById('senha-acesso').value.trim();
  
  if (senhaInput === SENHA_MESTRE) {
    localStorage.setItem('bcp_logged', 'true');
    localStorage.setItem('bcp_role', 'adm');
    iniciarApp('adm');
  } else if (senhaInput === SENHA_FUNCIONARIO) {
    localStorage.setItem('bcp_logged', 'true');
    localStorage.setItem('bcp_role', 'funcionario');
    iniciarApp('funcionario');
  } else {
    document.getElementById('login-erro').style.display = 'block';
  }
}

function logout() {
  localStorage.removeItem('bcp_logged');
  localStorage.removeItem('bcp_role');
  location.reload();
}

function iniciarApp(role) {
  currentUserRole = role;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-content').style.display = 'block';
  document.getElementById('selected-date-input').value = selectedDate;

  // Se for funcionário, oculta as abas de ADM
  if (role === 'funcionario') {
    document.querySelectorAll('.adm-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.adm-only-section').forEach(el => el.style.display = 'none');
    switchTab('agenda');
  }

  // Conecta ao banco em tempo real
  db.ref('barracao_data').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      state.consultas = data.consultas || [];
      state.banhotosa = data.banhotosa || [];
      state.cirurgias = data.cirurgias || [];
      state.vacinas = data.vacinas || [];
      state.vendas = data.vendas || [];
      state.crm = data.crm || [];
    }

    const syncStatus = document.getElementById('sync-status');
    if (syncStatus) {
      syncStatus.innerHTML = `<i class="fas fa-check-circle" style="color:#10b981;"></i> Sincronizado`;
    }

    renderAll();
  });
}

function renderAll() {
  loadAgenda();
  if (currentUserRole === 'adm') {
    renderConsultas();
    renderCirurgias();
    renderVacinas();
    renderCRM();
    renderFinancas();
  }
  renderBanhoTosa();
}

function saveData() {
  db.ref('barracao_data').set(state);
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  event.currentTarget.classList.add('active');
}

function syncCRM(tutor, tel, pet) {
  let existing = state.crm.find(c => c.tel === tel);
  if (existing) {
    if (!existing.pets.includes(pet)) existing.pets.push(pet);
  } else {
    state.crm.push({ id: Date.now(), tutor, tel, pets: [pet] });
  }
}

// Funções de Exclusão
function removerConsulta(id) {
  if (currentUserRole !== 'adm') return;
  if (confirm("Tem certeza que deseja cancelar esta consulta?")) {
    state.consultas = state.consultas.filter(c => c.id !== id);
    saveData();
  }
}

function removerBanhoTosa(id) {
  if (currentUserRole !== 'adm') {
    alert("Apenas administradores podem desmarcar agendamentos!");
    return;
  }
  if (confirm("Tem certeza que deseja desmarcar este banho/tosa?")) {
    state.banhotosa = state.banhotosa.filter(b => b.id !== id);
    saveData();
  }
}

function removerCirurgia(id) {
  if (currentUserRole !== 'adm') return;
  if (confirm("Tem certeza que deseja desmarcar esta cirurgia?")) {
    state.cirurgias = state.cirurgias.filter(c => c.id !== id);
    saveData();
  }
}

function removerVacinaItem(petKey, vacinaId) {
  if (currentUserRole !== 'adm') return;
  if (confirm("Deseja apagar este registro de vacina do cartão do pet?")) {
    let card = state.vacinas.find(v => v.petKey === petKey);
    if (card) {
      card.itens = card.itens.filter(i => i.id !== vacinaId);
      if (card.itens.length === 0) {
        state.vacinas = state.vacinas.filter(v => v.petKey !== petKey);
      }
      saveData();
    }
  }
}

function removerVenda(id) {
  if (currentUserRole !== 'adm') return;
  if (confirm("Tem certeza que deseja remover este registro financeiro?")) {
    state.vendas = state.vendas.filter(v => v.id !== id);
    saveData();
  }
}

function removerCRM(id) {
  if (currentUserRole !== 'adm') return;
  if (confirm("Tem certeza que deseja excluir este cliente dos cartões salvos?")) {
    state.crm = state.crm.filter(c => c.id !== id);
    saveData();
  }
}

function salvarConsulta(e) {
  e.preventDefault();
  const c = {
    id: Date.now(),
    tutor: document.getElementById('c-tutor').value,
    tel: document.getElementById('c-tel').value,
    pet: document.getElementById('c-pet').value,
    raca: document.getElementById('c-raca').value || 'Não informada',
    idade: document.getElementById('c-idade').value || 'Não informada',
    data: document.getElementById('c-data').value
  };
  state.consultas.push(c);
  syncCRM(c.tutor, c.tel, c.pet);
  saveData();
  closeModal('modal-consulta');
  document.getElementById('modal-consulta').querySelector('form').reset();
}

function salvarBanhoTosa(e) {
  e.preventDefault();
  const b = {
    id: Date.now(),
    tutor: document.getElementById('b-tutor').value,
    tel: document.getElementById('b-tel').value,
    pet: document.getElementById('b-pet').value,
    desc: document.getElementById('b-desc').value,
    data: document.getElementById('b-data').value
  };
  state.banhotosa.push(b);
  syncCRM(b.tutor, b.tel, b.pet);
  saveData();
  closeModal('modal-banhotosa');
  document.getElementById('modal-banhotosa').querySelector('form').reset();
}

function salvarCirurgia(e) {
  e.preventDefault();
  const cir = {
    id: Date.now(),
    tutor: document.getElementById('cir-tutor').value,
    tel: document.getElementById('cir-tel').value,
    pet: document.getElementById('cir-pet').value,
    tipo: document.getElementById('cir-tipo').value,
    obs: document.getElementById('cir-obs').value,
    data: document.getElementById('cir-data').value
  };
  state.cirurgias.push(cir);
  syncCRM(cir.tutor, cir.tel, cir.pet);
  saveData();
  closeModal('modal-cirurgia');
  document.getElementById('modal-cirurgia').querySelector('form').reset();
}

function salvarVacina(e) {
  e.preventDefault();
  const tutor = document.getElementById('v-tutor').value.trim();
  const tel = document.getElementById('v-tel').value.trim();
  const pet = document.getElementById('v-pet').value.trim();
  const nomeVacina = document.getElementById('v-nome').value.trim();
  const dataAplicacao = document.getElementById('v-data').value;
  const dataRetorno = document.getElementById('v-retorno').value;

  const petKey = `${pet.toLowerCase()}_${tutor.toLowerCase()}`;

  let itemVacina = {
    id: Date.now(),
    nome: nomeVacina,
    data: dataAplicacao,
    retorno: dataRetorno || null
  };

  let existingCard = state.vacinas.find(v => v.petKey === petKey);
  if (existingCard) {
    existingCard.tutor = tutor;
    existingCard.tel = tel;
    existingCard.pet = pet;
    if (!existingCard.itens) existingCard.itens = [];
    existingCard.itens.push(itemVacina);
  } else {
    state.vacinas.push({
      petKey: petKey,
      tutor: tutor,
      tel: tel,
      pet: pet,
      itens: [itemVacina]
    });
  }

  syncCRM(tutor, tel, pet);
  saveData();
  closeModal('modal-vacina');
  document.getElementById('modal-vacina').querySelector('form').reset();
}

function abrirVacinaDireta(petKey) {
  let card = state.vacinas.find(v => v.petKey === petKey);
  if (!card) return;
  document.getElementById('vd-petkey').value = petKey;
  document.getElementById('vd-pet-label').innerText = `${card.pet} (Tutor: ${card.tutor})`;
  openModal('modal-vacina-direta');
}

function salvarVacinaDireta(e) {
  e.preventDefault();
  const petKey = document.getElementById('vd-petkey').value;
  const nomeVacina = document.getElementById('vd-nome').value.trim();
  const dataAplicacao = document.getElementById('vd-data').value;
  const dataRetorno = document.getElementById('vd-retorno').value;

  let card = state.vacinas.find(v => v.petKey === petKey);
  if (card) {
    if (!card.itens) card.itens = [];
    card.itens.push({
      id: Date.now(),
      nome: nomeVacina,
      data: dataAplicacao,
      retorno: dataRetorno || null
    });
    saveData();
    closeModal('modal-vacina-direta');
    document.getElementById('modal-vacina-direta').querySelector('form').reset();
  }
}

function salvarTransacao(e) {
  e.preventDefault();
  const tipo = document.getElementById('trans-tipo').value;
  const item = document.getElementById('venda-item').value;
  const qtd = parseInt(document.getElementById('venda-qtd').value);
  const valor = parseFloat(document.getElementById('venda-valor').value);

  const t = {
    id: Date.now(),
    tipo: tipo, // 'entrada' ou 'saida'
    item: item,
    qtd: qtd,
    valor: valor,
    data: new Date().toISOString()
  };

  state.vendas.push(t);
  saveData();
  document.getElementById('form-venda').reset();
}

function renderConsultas() {
  const container = document.getElementById('consultas-list');
  const searchInput = document.getElementById('search-consultas');
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  const sort = document.getElementById('sort-consultas').value;
  
  let filtered = state.consultas.filter(c => 
    c.tutor.toLowerCase().includes(search) || c.pet.toLowerCase().includes(search)
  );

  if (sort === 'data') filtered.sort((a,b) => new Date(a.data) - new Date(b.data));
  else filtered.sort((a,b) => a.tutor.localeCompare(b.tutor));

  container.innerHTML = filtered.map(c => `
    <div class="detail-card">
      <div style="display:flex; justify-content:space-between; align-items:start;">
        <h3><i class="fas fa-dog text-primary"></i> ${c.pet}</h3>
        <button onclick="removerConsulta(${c.id})" class="btn btn-sm btn-secondary" style="color:#ef4444;" title="Cancelar Consulta"><i class="fas fa-trash"></i></button>
      </div>
      <p><strong>Tutor:</strong> ${c.tutor}</p>
      <p><strong>Contato:</strong> ${c.tel}</p>
      <p><strong>Raça/Idade:</strong> ${c.raca} (${c.idade})</p>
      <p><strong>Data/Hora:</strong> ${new Date(c.data).toLocaleString('pt-BR')}</p>
    </div>
  `).join('');
}

function renderBanhoTosa() {
  const container = document.getElementById('banhotosa-list');
  const searchInput = document.getElementById('search-banhotosa');
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  let filtered = state.banhotosa.filter(b => b.tutor.toLowerCase().includes(search) || b.pet.toLowerCase().includes(search));

  container.innerHTML = filtered.map(b => `
    <div class="detail-card">
      <div style="display:flex; justify-content:space-between; align-items:start;">
        <h3><i class="fas fa-cut text-primary"></i> ${b.pet}</h3>
        ${currentUserRole === 'adm' ? `<button onclick="removerBanhoTosa(${b.id})" class="btn btn-sm btn-secondary" style="color:#ef4444;" title="Cancelar Banho/Tosa"><i class="fas fa-trash"></i></button>` : ''}
      </div>
      <p><strong>Tutor:</strong> ${b.tutor} (${b.tel})</p>
      <p><strong>Instruções de Tosa:</strong> ${b.desc}</p>
      <p><strong>Horário:</strong> ${new Date(b.data).toLocaleString('pt-BR')}</p>
    </div>
  `).join('');
}

function renderCirurgias() {
  const container = document.getElementById('cirurgias-list');
  container.innerHTML = state.cirurgias.map(c => `
    <div class="detail-card">
      <div style="display:flex; justify-content:space-between; align-items:start;">
        <h3><i class="fas fa-microscope text-danger"></i> ${c.pet} - ${c.tipo}</h3>
        <button onclick="removerCirurgia(${c.id})" class="btn btn-sm btn-secondary" style="color:#ef4444;" title="Cancelar Cirurgia"><i class="fas fa-trash"></i></button>
      </div>
      <p><strong>Tutor:</strong> ${c.tutor} (${c.tel})</p>
      <p><strong>Obs:</strong> ${c.obs || 'Nenhuma'}</p>
      <p><strong>Data/Hora:</strong> ${new Date(c.data).toLocaleString('pt-BR')}</p>
    </div>
  `).join('');
}

function renderVacinas() {
  const container = document.getElementById('vacinas-list');
  const searchInput = document.getElementById('search-vacinas');
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  let filtered = state.vacinas.filter(v => v.pet.toLowerCase().includes(search) || v.tutor.toLowerCase().includes(search));

  if (filtered.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-muted);">Nenhum cartão de vacina cadastrado.</p>`;
    return;
  }

  container.innerHTML = filtered.map(card => `
    <div class="detail-card">
      <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:10px;">
        <h3><i class="fas fa-syringe text-primary"></i> ${card.pet}</h3>
        <button onclick="abrirVacinaDireta('${card.petKey}')" class="btn btn-primary btn-sm" title="Adicionar nova dose"><i class="fas fa-plus"></i> Dose</button>
      </div>
      <p style="margin-bottom:4px;"><strong>Tutor:</strong> ${card.tutor}</p>
      <p style="margin-bottom:12px;"><strong>Contato:</strong> ${card.tel}</p>
      <div style="border-top: 1px solid var(--border); padding-top: 10px;">
        <strong style="font-size:0.85rem; color: var(--text-muted); display:block; margin-bottom:6px;">Histórico de Vacinas:</strong>
        ${(card.itens || []).map(item => `
          <div style="background: #f1f5f9; padding: 8px; border-radius: 6px; margin-bottom: 6px; font-size: 0.9rem; position:relative;">
            <div style="display:flex; justify-content:space-between;">
              <strong>${item.nome}</strong>
              <button onclick="removerVacinaItem('${card.petKey}', ${item.id})" style="background:none; border:none; color:#ef4444; cursor:pointer;" title="Remover vacina"><i class="fas fa-times"></i></button>
            </div>
            <div style="color: var(--text-muted); font-size: 0.8rem; margin-top:2px;">
              Aplicada em: ${new Date(item.data).toLocaleDateString('pt-BR')}
              ${item.retorno ? `<br><span class="text-danger" style="font-weight:600;">Retorno/Reforço: ${new Date(item.retorno).toLocaleDateString('pt-BR')}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function renderCRM() {
  const container = document.getElementById('crm-list');
  const searchInput = document.getElementById('search-crm');
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  let filtered = state.crm.filter(c => c.tutor.toLowerCase().includes(search) || c.pets.some(p => p.toLowerCase().includes(search)));

  container.innerHTML = filtered.map(c => `
    <div class="detail-card">
      <div class="card-header-flex">
        <h3 style="margin:0;"><i class="fas fa-user text-primary"></i> ${c.tutor}</h3>
        <div style="display:flex; gap:6px; align-items:center;">
          <a href="https://wa.me/55${c.tel.replace(/\D/g,'')}" target="_blank" class="whatsapp-btn-right" title="WhatsApp">
            <i class="fab fa-whatsapp"></i> WhatsApp
          </a>
          <button onclick="removerCRM(${c.id})" class="btn btn-sm btn-secondary" style="color:#ef4444; padding:6px 10px;" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <p><strong>Pets:</strong> ${c.pets.join(', ')}</p>
      <p><strong>Contato:</strong> ${c.tel}</p>
    </div>
  `).join('');
}

function renderFinancas() {
  const hoje = new Date().toISOString().split('T')[0];
  const transHoje = state.vendas.filter(v => v.data.startsWith(hoje));
  
  const entradas = transHoje.filter(v => !v.tipo || v.tipo === 'entrada').reduce((acc, v) => acc + v.valor, 0);
  const saidas = transHoje.filter(v => v.tipo === 'saida').reduce((acc, v) => acc + v.valor, 0);
  const saldo = entradas - saidas;

  document.getElementById('fin-entradas').innerText = `R$ ${entradas.toFixed(2)}`;
  document.getElementById('fin-saidas').innerText = `R$ ${saidas.toFixed(2)}`;
  document.getElementById('fin-saldo').innerText = `R$ ${saldo.toFixed(2)}`;
  
  if (saldo < 0) {
    document.getElementById('fin-saldo').className = "stat-value text-danger";
  } else {
    document.getElementById('fin-saldo').className = "stat-value text-success";
  }

  const listContainer = document.getElementById('vendas-hoje-list');
  if (listContainer) {
    if (transHoje.length === 0) {
      listContainer.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">Nenhuma movimentação registrada hoje.</p>`;
    } else {
      listContainer.innerHTML = transHoje.map(v => {
        const isSaida = v.tipo === 'saida';
        const cor = isSaida ? 'text-danger' : 'text-success';
        const sinal = isSaida ? '-' : '+';
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #eee;">
            <span>${v.qtd}x ${v.item} - <strong class="${cor}">${sinal} R$ ${v.valor.toFixed(2)}</strong></span>
            <button onclick="removerVenda(${v.id})" class="btn btn-sm btn-secondary" style="color:#ef4444; padding:2px 8px;"><i class="fas fa-trash"></i></button>
          </div>
        `;
      }).join('');
    }
  }

  let itemCounts = {};
  state.vendas.filter(v => !v.tipo || v.tipo === 'entrada').forEach(v => {
    itemCounts[v.item] = (itemCounts[v.item] || 0) + v.qtd;
  });

  document.getElementById('top-itens-list').innerHTML = Object.entries(itemCounts)
    .sort((a,b) => b[1] - a[1])
    .map(([item, qtd]) => `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee;"><span>${item}</span><strong>${qtd} un</strong></div>`)
    .join('') || `<p style="color:var(--text-muted); font-size:0.9rem;">Nenhum produto vendido ainda.</p>`;
}

function loadAgenda() {
  const dateStr = document.getElementById('selected-date-input').value;
  const cList = state.consultas.filter(c => c.data.startsWith(dateStr)).map(c => ({...c, tipo: 'Consulta'}));
  const bList = state.banhotosa.filter(b => b.data.startsWith(dateStr)).map(b => ({...b, tipo: 'Banho & Tosa'}));
  const cirList = state.cirurgias.filter(c => c.data.startsWith(dateStr)).map(c => ({...c, tipo: 'Cirurgia'}));

  let vacinaRetornos = [];
  state.vacinas.forEach(card => {
    (card.itens || []).forEach(item => {
      if (item.retorno && item.retorno.startsWith(dateStr)) {
        vacinaRetornos.push({
          id: item.id,
          pet: card.pet,
          tutor: card.tutor,
          data: item.retorno,
          tipo: `Retorno Vacina (${item.nome})`
        });
      }
    });
  });

  const todos = [...cList, ...bList, ...cirList, ...vacinaRetornos].sort((a,b) => new Date(a.data) - new Date(b.data));
  const container = document.getElementById('agenda-cards');

  if(todos.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-muted);">Nenhum compromisso para este dia.</p>`;
    return;
  }

  container.innerHTML = todos.map(item => `
    <div class="detail-card">
      <span class="btn btn-sm btn-secondary mb-2">${item.tipo}</span>
      <h3>${item.pet} (${item.tutor})</h3>
      <p><strong>Horário:</strong> ${new Date(item.data).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</p>
    </div>
  `).join('');
}

function changeDate(days) {
  let curr = new Date(document.getElementById('selected-date-input').value);
  curr.setDate(curr.getDate() + days);
  document.getElementById('selected-date-input').value = curr.toISOString().split('T')[0];
  loadAgenda();
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function exportarDados() {
  if (currentUserRole !== 'adm') return;
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `backup_barracao_pet_${new Date().toISOString().split('T')[0]}.json`);
  dlAnchorElem.click();
}
