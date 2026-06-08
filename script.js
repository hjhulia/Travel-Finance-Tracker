// CONSTANTES GLOBAIS
let gastos = [];
let moedaBase = "BRL";
let orcamento = null;
let filtroInicio = null;
let filtroFim = null;
let grafico = null;
let graficoPizza = null;
let usuarioAtual = "";
let ultimaNotificacao = "";
let ultimaAtualizacao = null;

// Taxas de câmbio padrão (fallback)
let taxas = {
    BRL: 1, USD: 5.18, EUR: 5.45, GBP: 6.40, JPY: 0.033, CNY: 0.71
};

const categorias = ["Alimentação", "Hospedagem", "Transporte", "Passeios", "Compras", "Outros"];
const coresCategorias = ["#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#6B7280"];

// BANDEIRAS COM IMAGENS (funciona em qualquer PC)
const todasMoedas = {
    USD: { nome: "Dólar Americano", bandeira: "<img src='https://flagcdn.com/us.svg' style='width: 40px; height: 30px; border-radius: 4px;'>" },
    EUR: { nome: "Euro", bandeira: "<img src='https://flagcdn.com/eu.svg' style='width: 40px; height: 30px; border-radius: 4px;'>" },
    JPY: { nome: "Iene Japonês", bandeira: "<img src='https://flagcdn.com/jp.svg' style='width: 40px; height: 30px; border-radius: 4px;'>" },
    GBP: { nome: "Libra Esterlina", bandeira: "<img src='https://flagcdn.com/gb.svg' style='width: 40px; height: 30px; border-radius: 4px;'>" },
    CNY: { nome: "Yuan Chinês", bandeira: "<img src='https://flagcdn.com/cn.svg' style='width: 40px; height: 30px; border-radius: 4px;'>" },
    BRL: { nome: "Real Brasileiro", bandeira: "<img src='https://flagcdn.com/br.svg' style='width: 40px; height: 30px; border-radius: 4px;'>" }
};

// DICAS
const todasDicas = [
    "✈️ Viajar na baixa temporada pode economizar até 50% nas passagens!",
    "🏨 Hostels e Airbnb costumam ser mais baratos que hotéis tradicionais.",
    "🍜 Comer onde os locais comem é mais barato e autêntico.",
    "🚇 Transporte público é sempre mais econômico que táxi/uber.",
    "🎫 Compre ingressos de atrações online com antecedência para desconto.",
    "💳 Use cartões sem taxa internacional para economizar.",
    "📱 Baixe mapas offline para não gastar roaming.",
    "🎒 Viaje só com bagagem de mão e evite taxas extras.",
    "🏧 Saque valores maiores para pagar menos taxas por operação.",
    "🍺 Evite consumir em áreas extremamente turísticas, os preços são maiores.",
    "📅 Reserve voos com 2-3 meses de antecedência para melhores preços.",
    "🔄 Use comparadores de preços como Skyscanner e Google Flights.",
    "💉 Verifique vacinas necessárias para evitar gastos extras com saúde.",
    "📞 Ative o roaming ou compre chip local para evitar surpresas na conta.",
    "🍽️ Almoço em self-service por quilo é mais econômico que à la carte."
];

// FUNÇÕES AUXILIARES
function formatarDataHora(data) {
    return data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR');
}

function formatarMoeda(valor, moeda) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: moeda });
}

function converterParaBase(valor, moeda) {
    const valorMoedaEmBRL = taxas[moeda] || 1;
    const valorBaseEmBRL = taxas[moedaBase] || 1;
    return (valor * valorMoedaEmBRL) / valorBaseEmBRL;
}

function calcularTotal(lista) {
    return lista.reduce((t, g) => t + (g.convertido || 0), 0);
}

// DICAS SAZONAIS
function getDicasSazonais() {
    const mes = new Date().getMonth();
    const dicas = {
        0: "❄️ Janeiro: Férias de verão! Destinos como Florianópolis e Costa Rica estão em alta.",
        1: "💘 Fevereiro: Carnaval está chegando! Salvador, Rio e Recife são ótimas opções.",
        2: "🍂 Março: Bom momento para viajar para o Nordeste brasileiro.",
        3: "🌸 Abril: Outono europeu - preços mais baixos em Paris e Roma!",
        4: "🌺 Maio: Bom mês para visitar o Japão (Golden Week) ou Portugal.",
        5: "☀️ Junho: Festas juninas no Brasil. Ótimo para conhecer Caruaru ou Campina Grande!",
        6: "🎆 Julho: Temporada de inverno na Europa. Patagônia argentina é uma pedida!",
        7: "🍇 Agosto: Vinhos em Mendoza (Argentina) ou Oktoberfest antecipada em Blumenau.",
        8: "🌴 Setembro: Primavera no Brasil - bom para visitar Campos do Jordão.",
        9: "🎃 Outubro: Outono nos EUA - cores lindas em Chicago e Nova York!",
        10: "🦃 Novembro: Black Friday - época de comprar passagens para o próximo ano!",
        11: "🎄 Dezembro: Natal e Réveillon! Florianópolis, Rio ou Buenos Aires são ótimas pedidas."
    };
    return dicas[mes] || "🌎 Toda época é boa para viajar! Pesquise promoções de passagens.";
}

// API DE CÂMBIO
async function atualizarTaxasReais() {
    try {
        const response = await fetch(`https://api.frankfurter.app/latest?from=BRL&to=USD,EUR,GBP,JPY,CNY`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.rates) {
                if (data.rates.USD) taxas.USD = data.rates.USD;
                if (data.rates.EUR) taxas.EUR = data.rates.EUR;
                if (data.rates.GBP) taxas.GBP = data.rates.GBP;
                if (data.rates.JPY) taxas.JPY = data.rates.JPY;
                if (data.rates.CNY) taxas.CNY = data.rates.CNY;
                
                ultimaAtualizacao = new Date();
                
                gastos.forEach(g => {
                    if (taxas[g.moeda]) g.convertido = converterParaBase(g.valor, g.moeda);
                });
                
                atualizarCambio();
                atualizarInterface();
                mostrarNotificacao(`💰 Cotações atualizadas! 1 USD = ${formatarMoeda(taxas.USD, "BRL")}`, "alerta-proximo");
            }
        } else {
            throw new Error("Falha na API");
        }
    } catch (erro) {
        console.error('Erro ao buscar cotações:', erro);
    }
}

// NOTIFICAÇÕES
function mostrarNotificacao(mensagem, tipo = "alerta-limite") {
    const container = document.getElementById("notificacao-container");
    if (!container) return;
    
    const notif = document.createElement("div");
    notif.className = `notificacao ${tipo}`;
    notif.innerHTML = mensagem;
    container.appendChild(notif);
    
    setTimeout(() => notif.remove(), 5000);
}

function verificarLimiteOrcamento() {
    if (!orcamento) return;
    
    const total = calcularTotal(gastos);
    const percentual = total / orcamento;
    
    if (percentual >= 1 && ultimaNotificacao !== "estourou") {
        mostrarNotificacao("⚠️ ALERTA! Você ultrapassou seu orçamento! ⚠️", "alerta-limite");
        ultimaNotificacao = "estourou";
    } else if (percentual >= 0.8 && percentual < 1 && ultimaNotificacao !== "80") {
        mostrarNotificacao("⚠️ Atenção! Você já gastou 80% do seu orçamento!", "alerta-proximo");
        ultimaNotificacao = "80";
    } else if (percentual < 0.8) {
        ultimaNotificacao = "";
    }
}

// GERENCIAMENTO DE USUÁRIOS
function getUsuarios() {
    const u = localStorage.getItem("usuarios");
    return u ? JSON.parse(u) : [];
}

function salvarUsuarios(usuarios) {
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

function adicionarUsuario(nome) {
    let usuarios = getUsuarios();
    if (!usuarios.includes(nome)) {
        usuarios.push(nome);
        salvarUsuarios(usuarios);
    }
}

function removerUsuario(nome) {
    let usuarios = getUsuarios();
    usuarios = usuarios.filter(u => u !== nome);
    salvarUsuarios(usuarios);
    
    localStorage.removeItem(`user_${nome}`);
    
    if (usuarioAtual === nome) {
        sairApp();
    }
    
    atualizarListaUsuarios();
    mostrarNotificacao(`👤 Usuário "${nome}" removido com sucesso!`, "alerta-proximo");
}

function carregarDadosUsuario(nome) {
    const dados = localStorage.getItem(`user_${nome}`);
    if (dados) {
        const obj = JSON.parse(dados);
        gastos = obj.gastos || [];
        orcamento = obj.orcamento || null;
        moedaBase = obj.moedaBase || "BRL";
        
        gastos.forEach(g => {
            if (!g.convertido) g.convertido = converterParaBase(g.valor, g.moeda);
        });
    } else {
        gastos = [];
        orcamento = null;
        moedaBase = "BRL";
    }
    
    const inputOrcamento = document.getElementById("inputOrcamento");
    if (inputOrcamento) inputOrcamento.value = orcamento || "";
    
    const selectMoedaBase = document.getElementById("selectMoedaBase");
    if (selectMoedaBase) selectMoedaBase.value = moedaBase;
}

function salvarDadosUsuario() {
    if (!usuarioAtual) return;
    localStorage.setItem(`user_${usuarioAtual}`, JSON.stringify({
        gastos: gastos,
        orcamento: orcamento,
        moedaBase: moedaBase
    }));
}

// GASTOS
function adicionarGasto(valor, moeda, data, categoria) {
    valor = parseFloat(valor);
    if (isNaN(valor) || valor <= 0) {
        alert("Valor inválido!");
        return false;
    }
    
    if (!data) data = new Date().toISOString().split('T')[0];
    
    gastos.push({
        id: Date.now(),
        descricao: categoria,
        valor: valor,
        moeda: moeda,
        data: data,
        categoria: categoria || "Outros",
        convertido: converterParaBase(valor, moeda)
    });
    
    salvarDadosUsuario();
    atualizarInterface();
    verificarLimiteOrcamento();
    return true;
}

function editarGasto(id) {
    const gasto = gastos.find(g => g.id === id);
    if (!gasto) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-edicao';
    modal.innerHTML = `
        <div class="modal-edicao-content">
            <h3>✏️ Editar Gasto</h3>
            <div class="container-form">
                <input type="number" id="editValor" placeholder="Valor" step="0.01" class="input-padrao" value="${gasto.valor}">
                <select id="editCategoria" class="input-padrao">
                    <option value="Alimentação" ${gasto.categoria === 'Alimentação' ? 'selected' : ''}>🍔 Alimentação</option>
                    <option value="Hospedagem" ${gasto.categoria === 'Hospedagem' ? 'selected' : ''}>🏨 Hospedagem</option>
                    <option value="Transporte" ${gasto.categoria === 'Transporte' ? 'selected' : ''}>🚗 Transporte</option>
                    <option value="Passeios" ${gasto.categoria === 'Passeios' ? 'selected' : ''}>🎡 Passeios</option>
                    <option value="Compras" ${gasto.categoria === 'Compras' ? 'selected' : ''}>🛍️ Compras</option>
                    <option value="Outros" ${gasto.categoria === 'Outros' ? 'selected' : ''}>📌 Outros</option>
                </select>
                <select id="editMoeda" class="input-padrao">
                    <option value="BRL" ${gasto.moeda === 'BRL' ? 'selected' : ''}>BRL - Real Brasileiro</option>
                    <option value="USD" ${gasto.moeda === 'USD' ? 'selected' : ''}>USD - Dólar Americano</option>
                    <option value="EUR" ${gasto.moeda === 'EUR' ? 'selected' : ''}>EUR - Euro</option>
                    <option value="GBP" ${gasto.moeda === 'GBP' ? 'selected' : ''}>GBP - Libra Esterlina</option>
                    <option value="JPY" ${gasto.moeda === 'JPY' ? 'selected' : ''}>JPY - Iene Japonês</option>
                    <option value="CNY" ${gasto.moeda === 'CNY' ? 'selected' : ''}>CNY - Yuan Chinês</option>
                </select>
                <input type="date" id="editData" class="input-padrao" value="${gasto.data}">
            </div>
            <div class="modal-botoes">
                <button id="confirmarEditar" class="btn-principal">💾 Salvar</button>
                <button id="cancelarEditar" class="btn-secundario">❌ Cancelar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('confirmarEditar').onclick = () => {
        const novoValor = parseFloat(document.getElementById('editValor').value);
        const novaCategoria = document.getElementById('editCategoria').value;
        const novaMoeda = document.getElementById('editMoeda').value;
        const novaData = document.getElementById('editData').value;
        
        if (isNaN(novoValor) || novoValor <= 0) {
            alert("Valor inválido!");
            return;
        }
        
        gasto.valor = novoValor;
        gasto.categoria = novaCategoria;
        gasto.descricao = novaCategoria;
        gasto.moeda = novaMoeda;
        gasto.data = novaData;
        gasto.convertido = converterParaBase(novoValor, novaMoeda);
        
        salvarDadosUsuario();
        atualizarInterface();
        verificarLimiteOrcamento();
        modal.remove();
        mostrarNotificacao("✏️ Gasto editado com sucesso!", "alerta-proximo");
    };
    
    document.getElementById('cancelarEditar').onclick = () => modal.remove();
}

function removerGasto(id) {
    confirmarExclusao(id);
}

function confirmarExclusao(id) {
    const gasto = gastos.find(g => g.id === id);
    if (!gasto) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-confirmacao';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>⚠️ Confirmar exclusão</h3>
            <p>Tem certeza que deseja remover:<br><strong>"${gasto.descricao}"</strong>?</p>
            <div class="modal-botoes">
                <button id="confirmarSim" class="btn-principal">Sim, remover</button>
                <button id="confirmarNao" class="btn-secundario">Cancelar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('confirmarSim').onclick = () => {
        gastos = gastos.filter(g => g.id !== id);
        salvarDadosUsuario();
        atualizarInterface();
        verificarLimiteOrcamento();
        modal.remove();
        mostrarNotificacao("🗑️ Gasto removido!", "alerta-proximo");
    };
    
    document.getElementById('confirmarNao').onclick = () => modal.remove();
}

// RESET ORÇAMENTO
function resetOrcamento() {
    orcamento = null;
    const inputOrcamento = document.getElementById("inputOrcamento");
    if (inputOrcamento) inputOrcamento.value = "";
    salvarDadosUsuario();
    atualizarInterface();
    mostrarNotificacao("💰 Orçamento resetado com sucesso!", "alerta-proximo");
}

// FILTROS
function filtrarGastos() {
    if (!gastos.length) return [];
    if (!filtroInicio && !filtroFim) return gastos;
    
    return gastos.filter(g => {
        const dataGasto = new Date(g.data + "-01");
        if (filtroInicio && dataGasto < new Date(filtroInicio)) return false;
        if (filtroFim && dataGasto > new Date(filtroFim)) return false;
        return true;
    });
}

// GRÁFICOS
function atualizarGrafico() {
    const canvas = document.getElementById("graficoGastos");
    if (!canvas) return;
    
    const porMes = {};
    gastos.forEach(g => {
        const mes = g.data.substring(0, 7);
        porMes[mes] = (porMes[mes] || 0) + g.convertido;
    });
    
    const meses = Object.keys(porMes).sort();
    const valores = meses.map(m => porMes[m]);
    
    if (grafico) grafico.destroy();
    
    if (meses.length === 0) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#CBD5E1';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Nenhum gasto registrado', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    grafico = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: meses.map(m => m.split('-').reverse().join('/')),
            datasets: [{
                label: `Gastos (${moedaBase})`,
                data: valores,
                backgroundColor: '#F59E0B',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => formatarMoeda(ctx.raw, moedaBase)
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        callback: (v) => formatarMoeda(v, moedaBase)
                    }
                }
            }
        }
    });
}

function atualizarGraficoPizza() {
    const canvas = document.getElementById("graficoPizza");
    if (!canvas) return;
    
    const totalPorCategoria = {};
    categorias.forEach(cat => totalPorCategoria[cat] = 0);
    gastos.forEach(g => totalPorCategoria[g.categoria] += g.convertido);
    const dados = categorias.map(cat => totalPorCategoria[cat]);
    
    if (graficoPizza) graficoPizza.destroy();
    
    if (gastos.length === 0) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#CBD5E1';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Nenhum gasto registrado', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    graficoPizza = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: categorias,
            datasets: [{
                data: dados,
                backgroundColor: coresCategorias,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${formatarMoeda(ctx.raw, moedaBase)}`
                    }
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// CÂMBIO
function atualizarCambio() {
    const container = document.getElementById("cambioGrid");
    const infoBase = document.getElementById("infoMoedaBase");
    if (!container) return;
    
    const codigosMoedas = ["USD", "EUR", "JPY", "GBP", "CNY", "BRL"];
    const valorBaseEmBRL = taxas[moedaBase];
    const moedasComValor = [];
    
    for (const codigo of codigosMoedas) {
        if (codigo === moedaBase) continue;
        
        const info = todasMoedas[codigo];
        if (!info) continue;
        
        let valorCalculado = 0;
        if (taxas[codigo] && valorBaseEmBRL && valorBaseEmBRL > 0) {
            valorCalculado = taxas[codigo] / valorBaseEmBRL;
        }
        
        moedasComValor.push({
            codigo: codigo,
            nome: info.nome,
            bandeira: info.bandeira,
            valor: valorCalculado
        });
    }
    
    moedasComValor.sort((a, b) => a.valor - b.valor);
    
    let htmlContent = '';
    let ranking = 1;
    
    for (const moeda of moedasComValor) {
        const isCheapest = ranking === 1;
        htmlContent += `
            <div class="cambio-card ${isCheapest ? 'mais-forte' : ''}">
                <div class="ranking-badge">${ranking}</div>
                <div class="cambio-bandeira">${moeda.bandeira}</div>
                <div class="cambio-codigo">${moeda.codigo}</div>
                <div class="cambio-nome">${moeda.nome}</div>
                <div class="cambio-valor">${moeda.valor.toFixed(2)}</div>
                <div class="cambio-detalhe">1 ${moeda.codigo} = ${moeda.valor.toFixed(2)} ${moedaBase}</div>
            </div>
        `;
        ranking++;
    }
    
    container.innerHTML = htmlContent;
    
    const nomeMoedaBase = todasMoedas[moedaBase]?.nome || moedaBase;
    if (infoBase) {
        infoBase.innerHTML = `💰 Baseado na sua moeda: ${moedaBase} - ${nomeMoedaBase}`;
    }
}

// GERAR DICAS (sem a dica de câmbio "Euro desvalorizado")
function gerarDicasDestinos() {
    const container = document.getElementById("container-dicas");
    if (!container) return;
    
    const dicasAleatorias = [...todasDicas];
    for (let i = dicasAleatorias.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dicasAleatorias[i], dicasAleatorias[j]] = [dicasAleatorias[j], dicasAleatorias[i]];
    }
    const dicasSelecionadas = dicasAleatorias.slice(0, 5);
    
    const total = calcularTotal(gastos);
    let dicaOrcamento = "";
    
    if (orcamento && total > orcamento * 0.8) {
        dicaOrcamento = "⚠️ Você já gastou mais de 80% do orçamento! Reveja seus gastos.";
    } else if (orcamento && total > orcamento * 0.5) {
        dicaOrcamento = "📊 Você já usou metade do orçamento. Ainda dá para planejar!";
    } else if (orcamento) {
        dicaOrcamento = "✅ Você está dentro do orçamento! Continue assim!";
    } else {
        dicaOrcamento = "💰 Defina um orçamento para ter dicas personalizadas!";
    }
    
    const dicaSazonal = getDicasSazonais();
    
    let dicasLista = '<div class="dica-card"><div class="dica-titulo">💡 Dicas Rápidas para Economizar</div><ul class="dica-lista">';
    dicasSelecionadas.forEach(dica => {
        dicasLista += `<li>${dica}</li>`;
    });
    dicasLista += '</ul></div>';
    
    container.innerHTML = `
        <div class="dica-card">
            <div class="dica-titulo">🎯 Seu Orçamento</div>
            <div class="dica-texto">${dicaOrcamento}</div>
        </div>
        <div class="dica-card">
            <div class="dica-titulo">📅 Dica Sazonal</div>
            <div class="dica-texto">${dicaSazonal}</div>
        </div>
        ${dicasLista}
    `;
}

// EXPORTAÇÃO
function exportarCSV() {
    let csv = "Descrição,Valor,Moeda,Data,Categoria,Convertido (BRL)\n";
    gastos.forEach(g => {
        csv += `"${g.descricao}",${g.valor},${g.moeda},${g.data},${g.categoria},${g.convertido}\n`;
    });
    
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `gastos_${usuarioAtual}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    mostrarNotificacao("📥 Gastos exportados com sucesso!", "alerta-proximo");
}

// TEMA
function toggleTema() {
    document.body.classList.toggle("dark");
    const btn = document.getElementById("btnTema");
    btn.textContent = document.body.classList.contains("dark") ? "☀️ Light" : "🌙 Dark";
    localStorage.setItem("tema", document.body.classList.contains("dark") ? "dark" : "light");
}

function initTema() {
    if (localStorage.getItem("tema") === "dark") {
        document.body.classList.add("dark");
        const btn = document.getElementById("btnTema");
        if (btn) btn.textContent = "☀️ Light";
    }
}

// ANIMAÇÕES
function mostrarAviao() {
    const div = document.createElement('div');
    div.className = 'animacao-aviao';
    div.innerHTML = '<div class="aviao">✈️</div>';
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 1500);
}

function atualizarSaudacao() {
    const hora = new Date().getHours();
    let periodo = hora >= 5 && hora < 12 ? "Bom dia" : (hora >= 12 && hora < 18 ? "Boa tarde" : "Boa noite");
    let emoji = hora >= 5 && hora < 12 ? "🌅" : (hora >= 12 && hora < 18 ? "☀️" : "🌙");
    const saudacaoEl = document.getElementById("saudacao");
    if (saudacaoEl) saudacaoEl.textContent = `${periodo}, ${usuarioAtual}! ${emoji} ✈️`;
}

// INTERFACE PRINCIPAL
function atualizarInterface() {
    const filtrados = filtrarGastos();
    const total = calcularTotal(filtrados);
    
    const totalEl = document.getElementById("totalGastos");
    if (totalEl) totalEl.textContent = formatarMoeda(total, moedaBase);
    
    const listaEl = document.getElementById("listaGastos");
    const msgVaziaEl = document.getElementById("mensagemVazia");
    
    if (filtrados.length === 0) {
        if (msgVaziaEl) msgVaziaEl.style.display = "block";
        if (listaEl) listaEl.innerHTML = "";
    } else {
        if (msgVaziaEl) msgVaziaEl.style.display = "none";
        if (listaEl) {
            listaEl.innerHTML = filtrados.map(g => `
                <li class="gasto-item">
                    <div class="gasto-info">
                        <span class="gasto-descricao">${g.descricao}</span>
                        <span class="categoria-badge">${g.categoria}</span>
                        <span>📅 ${g.data.split('-').reverse().join('/')}</span>
                        <span>${formatarMoeda(g.valor, g.moeda)}</span>
                        <span class="gasto-convertido">≈ ${formatarMoeda(g.convertido, moedaBase)}</span>
                    </div>
                    <div class="gasto-acoes">
                        <button class="btn-editar" onclick="editarGasto(${g.id})">✏️ Editar</button>
                        <button class="btn-remover" onclick="removerGasto(${g.id})">✕ Remover</button>
                    </div>
                </li>
            `).join('');
        }
    }
    
    const blocoSaldo = document.getElementById("blocoSaldo");
    const saldoEl = document.getElementById("saldoRestante");
    
    if (orcamento === null) {
        if (blocoSaldo) blocoSaldo.style.display = "none";
    } else {
        if (blocoSaldo) blocoSaldo.style.display = "block";
        const saldo = orcamento - total;
        if (saldoEl) {
            saldoEl.textContent = formatarMoeda(saldo, moedaBase);
            saldoEl.style.color = saldo < 0 ? "#EF4444" : "#F59E0B";
        }
    }
    
    atualizarCambio();
    atualizarGrafico();
    atualizarGraficoPizza();
    gerarDicasDestinos();
}

// TELA DE BOAS VINDAS
function atualizarListaUsuarios() {
    const usuarios = getUsuarios();
    const container = document.getElementById("usuariosRecentesDiv");
    const listaDiv = document.getElementById("listaUsuarios");
    
    if (usuarios.length === 0) {
        if (container) container.style.display = "none";
    } else {
        if (container) container.style.display = "block";
        if (listaDiv) {
            listaDiv.innerHTML = usuarios.map(u => `
                <div class="usuario-item">
                    <button class="btn-usuario-recente" onclick="entrarComoUsuario('${u.replace(/'/g, "\\'")}')">
                        👤 ${u}
                    </button>
                    <button class="btn-remover-usuario" onclick="removerUsuario('${u.replace(/'/g, "\\'")}')" title="Remover usuário">
                        ✕
                    </button>
                </div>
            `).join('');
        }
    }
}

function entrarComoUsuario(nome) {
    usuarioAtual = nome;
    carregarDadosUsuario(nome);
    mostrarAviao();
    
    const telaBoasVindas = document.getElementById("telaBoasVindas");
    telaBoasVindas.style.opacity = "0";
    
    setTimeout(() => {
        telaBoasVindas.style.display = "none";
        document.getElementById("appPrincipal").style.display = "block";
        atualizarSaudacao();
        atualizarInterface();
    }, 500);
}

function entrarApp() {
    const inputNome = document.getElementById("inputNome");
    const nome = inputNome.value.trim();
    
    if (nome === "") {
        alert("Digite seu nome!");
        inputNome.focus();
        return;
    }
    
    usuarioAtual = nome;
    adicionarUsuario(nome);
    carregarDadosUsuario(nome);
    mostrarAviao();
    
    const telaBoasVindas = document.getElementById("telaBoasVindas");
    telaBoasVindas.style.opacity = "0";
    
    setTimeout(() => {
        telaBoasVindas.style.display = "none";
        document.getElementById("appPrincipal").style.display = "block";
        atualizarSaudacao();
        atualizarInterface();
    }, 500);
}

function sairApp() {
    salvarDadosUsuario();
    usuarioAtual = "";
    gastos = [];
    
    document.getElementById("appPrincipal").style.display = "none";
    const telaBoasVindas = document.getElementById("telaBoasVindas");
    telaBoasVindas.style.display = "flex";
    telaBoasVindas.style.opacity = "1";
    
    const inputNome = document.getElementById("inputNome");
    if (inputNome) inputNome.value = "";
    
    atualizarListaUsuarios();
}

// EVENTOS
function initEventos() {
    const btnEntrar = document.getElementById("btnEntrar");
    if (btnEntrar) btnEntrar.onclick = entrarApp;
    
    const btnSair = document.getElementById("btnSair");
    if (btnSair) btnSair.onclick = sairApp;
    
    const btnTema = document.getElementById("btnTema");
    if (btnTema) btnTema.onclick = toggleTema;
    
    const btnExportar = document.getElementById("btnExportar");
    if (btnExportar) btnExportar.onclick = exportarCSV;
    
    const btnRegistrar = document.getElementById("btnRegistrar");
    if (btnRegistrar) {
        btnRegistrar.onclick = () => {
            const valor = document.getElementById("inputValor").value;
            const moeda = document.getElementById("inputMoeda").value;
            const categoria = document.getElementById("inputCategoria").value;
            let data = document.getElementById("inputData").value;
            
            if (adicionarGasto(valor, moeda, data, categoria)) {
                document.getElementById("inputValor").value = "";
                document.getElementById("inputData").value = "";
            }
        };
    }
    
    const btnOrcamento = document.getElementById("btnOrcamento");
    if (btnOrcamento) {
        btnOrcamento.onclick = () => {
            const val = parseFloat(document.getElementById("inputOrcamento").value);
            orcamento = (isNaN(val) || val <= 0) ? null : val;
            salvarDadosUsuario();
            atualizarInterface();
            verificarLimiteOrcamento();
        };
    }
    
    const btnResetOrcamento = document.getElementById("btnResetOrcamento");
    if (btnResetOrcamento) {
        btnResetOrcamento.onclick = resetOrcamento;
    }
    
    const selectMoedaBase = document.getElementById("selectMoedaBase");
    if (selectMoedaBase) {
        selectMoedaBase.onchange = () => {
            moedaBase = selectMoedaBase.value;
            gastos.forEach(g => {
                g.convertido = converterParaBase(g.valor, g.moeda);
            });
            salvarDadosUsuario();
            atualizarInterface();
        };
    }
    
    const btnFiltrar = document.getElementById("btnFiltrar");
    if (btnFiltrar) {
        btnFiltrar.onclick = () => {
            filtroInicio = document.getElementById("filtroInicio").value ? document.getElementById("filtroInicio").value + "-01" : null;
            filtroFim = document.getElementById("filtroFim").value ? document.getElementById("filtroFim").value + "-01" : null;
            atualizarInterface();
        };
    }
    
    const btnLimparFiltro = document.getElementById("btnLimparFiltro");
    if (btnLimparFiltro) {
        btnLimparFiltro.onclick = () => {
            document.getElementById("filtroInicio").value = "";
            document.getElementById("filtroFim").value = "";
            filtroInicio = null;
            filtroFim = null;
            atualizarInterface();
        };
    }
    
    const btnAtualizarCambio = document.getElementById("btnAtualizarCambio");
    if (btnAtualizarCambio) {
        btnAtualizarCambio.onclick = async () => {
            const textoOriginal = btnAtualizarCambio.innerHTML;
            btnAtualizarCambio.innerHTML = "🔄 Atualizando...";
            btnAtualizarCambio.disabled = true;
            await atualizarTaxasReais();
            btnAtualizarCambio.innerHTML = textoOriginal;
            btnAtualizarCambio.disabled = false;
        };
    }
    
    const inputNome = document.getElementById("inputNome");
    if (inputNome) {
        inputNome.onkeypress = (e) => {
            if (e.key === "Enter") entrarApp();
        };
    }
}

// INICIALIZAÇÃO
async function init() {
    initTema();
    initEventos();
    await atualizarTaxasReais();
    
    const inputData = document.getElementById("inputData");
    if (inputData) inputData.value = new Date().toISOString().split('T')[0];
    
    const usuarioSalvo = localStorage.getItem("usuario_atual");
    const usuarios = getUsuarios();
    
    if (usuarioSalvo && usuarios.includes(usuarioSalvo)) {
        entrarComoUsuario(usuarioSalvo);
    } else {
        document.getElementById("telaBoasVindas").style.display = "flex";
        document.getElementById("appPrincipal").style.display = "none";
        atualizarListaUsuarios();
    }
}

init();
