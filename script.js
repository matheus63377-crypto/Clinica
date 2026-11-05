let state = {
  consultas: JSON.parse(localStorage.getItem('bcp_consultas')) || [],
  banhotosa: JSON.parse(localStorage.getItem('bcp_banhotosa')) || [],
  cirurgias: JSON.parse(localStorage.getItem('bcp_cirurgias')) || [],
  vendas: JSON.parse(localStorage.getItem('bcp_vendas')) || [],
  crm: JSON.parse(localStorage.getItem('bcp_crm')) || []
};

let selectedDate = new Date().toISOString().split('T')[0];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('selected-date-input').value = selectedDate;
  loadAgenda();
  renderConsultas();
  renderBanhoTosa();
  renderCirurgias();
  renderCRM();
  renderFinancas();
});

function saveData() {
  localStorage.setItem('bcp_consultas', JSON.stringify(state.consultas));
  localStorage.setItem('bcp_banhotosa', JSON.stringify(state.banhotosa));
  localStorage.setItem('bcp_cirurgias', JSON.stringify(state.cirurgias));
  localStorage.setItem('bcp_vendas', JSON.stringify(state.vendas));
  localStorage.setItem('bcp_crm', JSON.stringify(state.crm));
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
  saveData(); closeModal('modal-consulta'); renderConsultas(); loadAgenda(); renderCRM();
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
  saveData(); closeModal('modal-banhotosa'); renderBanhoTosa(); loadAgenda(); renderCRM();
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
  saveData(); closeModal('modal-cirurgia'); renderCirurgias(); loadAgenda(); renderCRM();
}

function salvarVenda(e) {
  e.preventDefault();
  const v = {
    id: Date.now(),
    item: document.getElementById('venda-item').value,
    qtd: parseInt(document.getElementById('venda-qtd').value),
    valor: parseFloat(document.getElementById('venda-valor').value),
    data: new Date().toISOString()
  };
  state.vendas.push(v);
  saveData();
  document.getElementById('form-venda').reset();
  renderFinancas();
}

function renderConsultas() {
  const container = document.getElementById('consultas-list');
  const search = document.getElementById('search-consultas').value.toLowerCase();
  const sort = document.getElementById('sort-consultas').value;
  
  let filtered = state.consultas.filter(c => 
    c.tutor.toLowerCase().includes(search) || c.pet.toLowerCase().includes(search)
  );

  if (sort === 'data') filtered.sort((a,b) => new Date(a.data) - new Date(b.data));
  else filtered.sort((a,b) => a.tutor.localeCompare(b.tutor));

  container.innerHTML = filtered.map(c => `
    <div class="detail-card">
      <h3><i class="fas fa-dog text-primary"></i> ${c.pet}</h3>
      <p><strong>Tutor:</strong> ${c.tutor}</p>
      <p><strong>Contato:</strong> ${c.tel}</p>
      <p><strong>Raça/Idade:</strong> ${c.raca} (${c.idade})</p>
      <p><strong>Data/Hora:</strong> ${new Date(c.data).toLocaleString('pt-BR')}</p>
    </div>
  `).join('');
}

function renderBanhoTosa() {
  const container = document.getElementById('banhotosa-list');
  const search = document.getElementById('search-banhotosa').value.toLowerCase();
  let filtered = state.banhotosa.filter(b => b.tutor.toLowerCase().includes(search) || b.pet.toLowerCase().includes(search));

  container.innerHTML = filtered.map(b => `
    <div class="detail-card">
      <h3><i class="fas fa-cut text-primary"></i> ${b.pet}</h3>
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
      <h3><i class="fas fa-microscope text-danger"></i> ${c.pet} - ${c.tipo}</h3>
      <p><strong>Tutor:</strong> ${c.tutor} (${c.tel})</p>
      <p><strong>Obs:</strong> ${c.obs || 'Nenhuma'}</p>
      <p><strong>Data/Hora:</strong> ${new Date(c.data).toLocaleString('pt-BR')}</p>
    </div>
  `).join('');
}

function renderCRM() {
  const container = document.getElementById('crm-list');
  const search = document.getElementById('search-crm').value.toLowerCase();
  let filtered = state.crm.filter(c => c.tutor.toLowerCase().includes(search) || c.pets.some(p => p.toLowerCase().includes(search)));

  container.innerHTML = filtered.map(c => `
    <div class="detail-card">
      <h3><i class="fas fa-user"></i> ${c.tutor}</h3>
      <p><strong>Pets:</strong> ${c.pets.join(', ')}</p>
      <p><strong>Contato:</strong> ${c.tel}</p>
      <a href="https://wa.me/55${c.tel.replace(/\D/g,'')}" target="_blank" class="btn btn-primary btn-sm btn-block" style="margin-top:10px; text-align:center; text-decoration:none;"><i class="fab fa-whatsapp"></i> WhatsApp</a>
    </div>
  `).join('');
}

function renderFinancas() {
  const hoje = new Date().toISOString().split('T')[0];
  const vendasHoje = state.vendas.filter(v => v.data.startsWith(hoje));
  const total = vendasHoje.reduce((acc, v) => acc + v.valor, 0);

  document.getElementById('fin-entradas').innerText = `R$ ${total.toFixed(2)}`;
  document.getElementById('fin-saidas').innerText = `R$ 0,00`;
  document.getElementById('fin-saldo').innerText = `R$ ${total.toFixed(2)}`;

  let itemCounts = {};
  state.vendas.forEach(v => {
    itemCounts[v.item] = (itemCounts[v.item] || 0) + v.qtd;
  });

  document.getElementById('top-itens-list').innerHTML = Object.entries(itemCounts)
    .sort((a,b) => b[1] - a[1])
    .map(([item, qtd]) => `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee;"><span>${item}</span><strong>${qtd} un</strong></div>`)
    .join('');
}

function loadAgenda() {
  const dateStr = document.getElementById('selected-date-input').value;
  const cList = state.consultas.filter(c => c.data.startsWith(dateStr)).map(c => ({...c, tipo: 'Consulta'}));
  const bList = state.banhotosa.filter(b => b.data.startsWith(dateStr)).map(b => ({...b, tipo: 'Banho & Tosa'}));
  const cirList = state.cirurgias.filter(c => c.data.startsWith(dateStr)).map(c => ({...c, tipo: 'Cirurgia'}));

  const todos = [...cList, ...bList, ...cirList].sort((a,b) => new Date(a.data) - new Date(b.data));
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
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `backup_barracao_pet_${new Date().toISOString().split('T')[0]}.json`);
  dlAnchorElem.click();
}