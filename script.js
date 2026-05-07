const state = { agrupaciones: [], fotos: [], municipios: [], query: '', municipio: '', modalidad: '', decada: '' };

const $ = (sel) => document.querySelector(sel);
const normalize = (txt='') => txt.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const decadeOf = (year) => Math.floor(Number(year)/10)*10;

async function loadData(){
  const [agrupaciones, fotos, municipios] = await Promise.all([
    fetch('data/agrupaciones.json').then(r=>r.json()),
    fetch('data/fotos.json').then(r=>r.json()),
    fetch('data/municipios.json').then(r=>r.json())
  ]);
  state.agrupaciones = agrupaciones;
  state.fotos = fotos;
  state.municipios = municipios;
  initFilters();
  renderAll();
}

function initFilters(){
  const municipios = [...new Set(state.agrupaciones.map(a=>a.municipio))].sort();
  const modalidades = [...new Set(state.agrupaciones.map(a=>a.modalidad))].sort();
  const decadas = [...new Set(state.agrupaciones.map(a=>decadeOf(a.anio)))].sort((a,b)=>a-b);
  $('#filterMunicipio').innerHTML = '<option value="">Todos los municipios</option>' + municipios.map(m=>`<option>${m}</option>`).join('');
  $('#filterModalidad').innerHTML = '<option value="">Todas las modalidades</option>' + modalidades.map(m=>`<option>${m}</option>`).join('');
  $('#filterDecada').innerHTML = '<option value="">Todas las décadas</option>' + decadas.map(d=>`<option value="${d}">Años ${String(d).slice(-2)}</option>`).join('');
}

function filteredAgrupaciones(){
  const q = normalize(state.query);
  return state.agrupaciones.filter(a=>{
    const haystack = normalize([a.nombre,a.anio,a.modalidad,a.municipio,a.autores,a.descripcion,(a.etiquetas||[]).join(' ')].join(' '));
    return (!q || haystack.includes(q)) && (!state.municipio || a.municipio===state.municipio) && (!state.modalidad || a.modalidad===state.modalidad) && (!state.decada || decadeOf(a.anio)==state.decada);
  });
}

function renderStats(){
  $('#statAgrupaciones').textContent = state.agrupaciones.length;
  $('#statFotos').textContent = state.fotos.length;
  $('#statMunicipios').textContent = state.municipios.length;
  $('#statAnios').textContent = new Set(state.agrupaciones.map(a=>a.anio)).size;
}

function renderAgrupaciones(){
  const data = filteredAgrupaciones();
  $('#agrupacionesGrid').innerHTML = data.map((a,i)=>`
    <article class="card" onclick="openAgrupacion(${state.agrupaciones.indexOf(a)})">
      <span class="pill">${a.modalidad}</span><span class="pill">${a.municipio}</span><span class="pill">${a.anio}</span>
      <h3>${a.nombre}</h3>
      <p class="meta">Autores: ${a.autores || 'Pendiente'}</p>
      <p>${a.descripcion}</p>
      <div class="tag-list">${(a.etiquetas||[]).map(t=>`<span class="pill">#${t}</span>`).join('')}</div>
    </article>
  `).join('') || '<p class="empty">No hay resultados para esa búsqueda.</p>';
}

function renderGallery(){
  const q = normalize(state.query);
  const fotos = state.fotos.filter(f=>!q || normalize(Object.values(f).join(' ')).includes(q));
  $('#galleryGrid').innerHTML = fotos.map(f=>`
    <article class="gallery-item">
      ${f.imagen ? `<img src="${f.imagen}" alt="${f.titulo}">` : `<div class="gallery-img">${f.categoria || 'Archivo'}</div>`}
      <div class="gallery-body">
        <h3>${f.titulo}</h3>
        <p class="meta">${f.autor} · ${f.anio} · ${f.municipio}</p>
        <p>${f.descripcion}</p>
        <span class="pill">${f.licencia}</span>
      </div>
    </article>
  `).join('');
}

function renderMunicipios(){
  $('#municipiosGrid').innerHTML = state.municipios.map(m=>{
    const count = state.agrupaciones.filter(a=>a.municipio===m.nombre).length;
    return `<article class="municipio"><h3>${m.nombre}</h3><p>${m.historia}</p><span class="pill">${count} agrupaciones</span></article>`;
  }).join('');
}

function renderTimeline(){
  const decades = [1970,1980,1990,2000,2010,2020];
  $('#timeline').innerHTML = decades.map(d=>{
    const items = state.agrupaciones.filter(a=>decadeOf(a.anio)===d);
    return `<div class="time-item"><div class="time-box"><h3>Años ${String(d).slice(-2)}</h3><p>${items.length ? items.map(a=>`${a.nombre} (${a.anio})`).join(' · ') : 'Espacio pendiente de completar con agrupaciones, fotografías y documentos de esta década.'}</p></div></div>`;
  }).join('');
}

function renderAll(){ renderStats(); renderAgrupaciones(); renderGallery(); renderMunicipios(); renderTimeline(); }

function openAgrupacion(index){
  const a = state.agrupaciones[index];
  $('#modalContent').innerHTML = `<div class="modal-inner">
    <span class="pill">${a.modalidad}</span><span class="pill">${a.municipio}</span><span class="pill">${a.anio}</span>
    <h2>${a.nombre}</h2>
    <p>${a.descripcion}</p>
    <div class="detail-grid">
      <div class="detail"><b>Autores</b>${a.autores || 'Pendiente'}</div>
      <div class="detail"><b>Componentes</b>${a.componentes || 'Pendiente'}</div>
      <div class="detail"><b>Premios / Palmarés</b>${a.premios || 'Pendiente'}</div>
      <div class="detail"><b>Anecdotario</b>${a.anecdotario || 'Pendiente'}</div>
      <div class="detail"><b>Vídeos</b>${(a.videos||[]).join(', ') || 'Pendiente'}</div>
      <div class="detail"><b>Audios</b>${(a.audios||[]).join(', ') || 'Pendiente'}</div>
      <div class="detail"><b>Carteles</b>${(a.carteles||[]).join(', ') || 'Pendiente'}</div>
      <div class="detail"><b>Enlaces relacionados</b>${(a.enlaces||[]).join(', ') || 'Pendiente'}</div>
    </div>
    <div class="tag-list">${(a.etiquetas||[]).map(t=>`<span class="pill">#${t}</span>`).join('')}</div>
  </div>`;
  $('#modal').showModal();
}
window.openAgrupacion = openAgrupacion;

$('#globalSearch').addEventListener('input', e=>{ state.query=e.target.value; renderAgrupaciones(); renderGallery(); });
$('#filterMunicipio').addEventListener('change', e=>{ state.municipio=e.target.value; renderAgrupaciones(); });
$('#filterModalidad').addEventListener('change', e=>{ state.modalidad=e.target.value; renderAgrupaciones(); });
$('#filterDecada').addEventListener('change', e=>{ state.decada=e.target.value; renderAgrupaciones(); });
$('#closeModal').addEventListener('click', ()=>$('#modal').close());
$('#menuBtn').addEventListener('click', ()=>$('#nav').classList.toggle('open'));
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>$('#nav').classList.remove('open')));
loadData();
