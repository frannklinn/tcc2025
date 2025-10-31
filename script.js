// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";

// const firebaseConfig = {
//   apiKey: "AIzaSyCWB2EZidqC2i9b0PY5w9a_0Yu8udfGwOw",
//   authDomain: "restaurante-tasti.firebaseapp.com",
//   projectId: "restaurante-tasti",
//   storageBucket: "restaurante-tasti.firebasestorage.app",
//   messagingSenderId: "63622945173",
//   appId: "1:63622945173:web:1a78045875957ac7e53e9c",
//   measurementId: "G-DH1FWLFKF6"
// };


// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

let idx = 0;
setInterval(()=>{
  const imagens = document.querySelectorAll('#carrossel img');
  imagens.forEach(i=>i.classList.remove('ativo'));
  idx = (idx+1)%imagens.length;
  imagens[idx].classList.add('ativo');
}, 3000);



let reservas = JSON.parse(localStorage.getItem('reservas')) || [];
const formReserva = document.getElementById('formReserva');
if(formReserva){
  formReserva.addEventListener('submit', e=>{
    e.preventDefault();
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const data = document.getElementById('data').value;
    const hora = document.getElementById('hora').value;
    const pessoas = document.getElementById('pessoas').value;
    const mesa = document.getElementById('mesa').value;
    const aniversario = document.getElementById('aniversario').value;

    let desconto = "";
    if(aniversario){
      const hoje = new Date().toISOString().slice(5,10);
      if(aniversario.slice(5,10) === hoje){
        desconto = "🎉 Desconto de Aniversário!";
      }
    }

    reservas.push({nome,email,data,hora,pessoas,mesa,desconto});
    localStorage.setItem('reservas', JSON.stringify(reservas));
    renderReservas();
   

    formReserva.reset();
    alert("Reserva realizada!");
  });
}
function renderReservas(){
  const div = document.getElementById('listaReservas');
  if(!div) return;
  div.innerHTML = "<h3>Minhas Reservas</h3>";
  reservas.forEach(r=>{
    div.innerHTML += `<p>${r.nome} - ${r.data} ${r.hora} (Mesa ${r.mesa}) ${r.desconto}</p>`;
  });
}
renderReservas();




let cardapio = JSON.parse(localStorage.getItem('cardapio')) || {
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

function renderMenuDividido() {
  const entradasDiv = document.querySelector('#entradas .categoria');
  const principaisDiv = document.querySelector('#principais .categoria');
  const sobremesasDiv = document.querySelector('#sobremesas .categoria');
  const bebidasDiv = document.querySelector('#bebidas .categoria');

  // Função auxiliar para renderizar uma categoria
  const renderCategoria = (divElement, itens) => {
    if (divElement) {
      divElement.innerHTML = "";
      itens.forEach(prato => {
        divElement.innerHTML += `
          <div class="prato-card">
            <img src="${prato.img}" alt="${prato.nome}">
            <div class="prato-info">
              <h4>${prato.nome}</h4>
              <p class="preco">R$ ${parseFloat(prato.preco).toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
        `;
      });
    }
  };

  renderCategoria(entradasDiv, cardapio.entradas);
  renderCategoria(principaisDiv, cardapio.principais);
  renderCategoria(sobremesasDiv, cardapio.sobremesas);
  renderCategoria(bebidasDiv, cardapio.bebidas);
}


function loginAdmin(){
  const u = document.getElementById('adminUser').value;
  const p = document.getElementById('adminPass').value;
  if(u==="admin" && p==="123"){
    document.getElementById('loginAdmin').style.display="none";
    document.getElementById('painel').style.display="block";
    renderAdmin();
  } else {
    alert("Usuário ou senha incorretos");
  }
}

function renderAdmin(){
  
  const divRes = document.getElementById('reservasAdmin');
  if(divRes){
    divRes.innerHTML="";
    reservas.forEach(r=>{
      divRes.innerHTML += `<p>${r.nome} - ${r.data} ${r.hora} (Mesa ${r.mesa})</p>`;
    });
  }
}


let totalMesas = 12; 


function getMesaPositionStyle(mesaId) {
  // Mapear mesaId -> célula do grid: cada string devolvida será aplicada como style.cssText
  // Formato: "grid-row: X / X; grid-column: Y / Y;"
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




function renderMesas(){
  const div = document.getElementById('mapaMesas');
  if(!div) return;
  div.innerHTML = "";

  // Busca a data atual selecionada para verificar ocupação
  const dataSelecionada = document.getElementById('data') ? document.getElementById('data').value : null;

  for(let i=1; i<=totalMesas; i++){
    // Verifica ocupação com base na data (se estiver ocupada na data selecionada)
    let ocupada = reservas.some(r => r.mesa == i && r.data === dataSelecionada);
    
    let mesaDiv = document.createElement('div');
    mesaDiv.classList.add('mesa');

    
    const style = getMesaPositionStyle(i); 
    mesaDiv.style.cssText = style; 

    // Define quais mesas são maiores/retangulares (Mesas 1, 2 e 11)
    if(i === 1 || i === 2 || i === 11){
      mesaDiv.classList.add('mesa-retangular');
    }
    
    mesaDiv.innerText = "Mesa " + i;

    if(ocupada){
      mesaDiv.classList.add('ocupada');
    } else {
      mesaDiv.addEventListener('click', ()=>{
        document.querySelectorAll('.mesa').forEach(m=>m.classList.remove('selecionada'));
        mesaDiv.classList.add('selecionada');
        document.getElementById('mesa').value = i;
      });
    }
    div.appendChild(mesaDiv);
  }
}

const dataInput = document.getElementById('data');
if (dataInput) {
    dataInput.addEventListener('change', renderMesas);
}


renderMesas();


const miniCarrossel = document.getElementById("miniCarrossel");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const indicatorsContainer = document.getElementById("miniIndicators");

let offset = 0;
const imagemLargura = 330; 
const imagens = document.querySelectorAll("#miniCarrossel img");
let totalSlides = imagens.length - 3; 


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

function atualizarMiniCarrossel() {
  miniCarrossel.style.transform = `translateX(${offset}px)`;
}

function atualizarDots(index) {
  document.querySelectorAll(".dot").forEach(dot => dot.classList.remove("active"));
  document.querySelectorAll(".dot")[index].classList.add("active");
}

if (prevBtn && nextBtn && miniCarrossel) {
  prevBtn.addEventListener("click", () => {
    offset += imagemLargura;
    if (offset > 0) offset = -(imagemLargura * (totalSlides - 1));
    atualizarMiniCarrossel();
    atualizarDots(Math.abs(offset) / imagemLargura);
  });

  nextBtn.addEventListener("click", () => {
    offset -= imagemLargura;
    if (Math.abs(offset) > imagemLargura * totalSlides) offset = 0;
    atualizarMiniCarrossel();
    atualizarDots(Math.abs(offset) / imagemLargura);
  });
}
const formPrato = document.getElementById('formPrato');

if (formPrato) {
  formPrato.addEventListener('submit', e => {
    e.preventDefault();

    const nome = document.getElementById('pratoNome').value;
    const preco = document.getElementById('pratoPreco').value;
    const img = document.getElementById('pratoImg').value || "https://via.placeholder.com/150";
    const categoria = document.getElementById('pratoCategoria').value;

    if (!categoria) {
      alert("Escolha uma categoria!");
      return;
    }

   
    cardapio[categoria].push({ nome, preco, img });

   
    localStorage.setItem('cardapio', JSON.stringify(cardapio));

    
    renderMenuDividido();

    
    formPrato.reset();

    alert(`Prato adicionado em ${categoria}!`);
  });
}


function renderAdmin(){
  const divRes = document.getElementById('reservasAdmin');
  if(divRes){
    divRes.innerHTML = "";
    reservas.forEach(r=>{
      divRes.innerHTML += `<p>${r.nome} - ${r.data} ${r.hora} (Mesa ${r.mesa})</p>`;
    });
  }

  const lista = document.getElementById('listaPratos');
  if(lista){
    lista.innerHTML = "";
    for(let categoria in cardapio){
      lista.innerHTML += `<h3>${categoria.charAt(0).toUpperCase()+categoria.slice(1)}</h3>`;
      cardapio[categoria].forEach((p, index)=>{
        lista.innerHTML += `
          <p>${p.nome} - R$${p.preco} 
          <button class="remover-btn" onclick="removerPrato('${categoria}', ${index})">Remover</button></p>`;
      });
    }
  }
}

function removerPrato(categoria, index){
  if(confirm("Tem certeza que deseja remover este prato?")){
    cardapio[categoria].splice(index, 1);
    localStorage.setItem('cardapio', JSON.stringify(cardapio));
    renderAdmin();
    renderMenuDividido();
  }
}
