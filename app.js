/* Nuestro Nido — lógica de la app. Todo se guarda en este dispositivo (localStorage). */
(() => {
"use strict";

const KEY = "nido-app-v1";
const $ = (s, el = document) => el.querySelector(s);
const view = $("#view");

/* ---------- Estado ---------- */
function freshState() {
  return {
    v: 1,
    example: true,
    names: { a: "Persona A", b: "Persona B" },
    incomes: { a: 22000, b: 16000 },
    buckets: JSON.parse(JSON.stringify(DEFAULT_BUCKETS)),
    goals: JSON.parse(JSON.stringify(DEFAULT_GOALS)),
    tx: [],
    answers: {},
    ui: { cat: "hablar", month: monthKey(new Date()) }
  };
}
let S;
try { S = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { S = null; }
const startedEmpty = !S || S.v !== 1;
if (startedEmpty) S = freshState();
S.ui = S.ui || { cat: "hablar", month: monthKey(new Date()) };

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast("No se pudo guardar. Revisen el espacio del teléfono."); }
  scheduleSnap();
}

/* ---------- Copias automáticas (IndexedDB, separado del guardado normal) ----------
   Una copia por día (últimos 14 días) y una por mes (últimos 6 meses). */
const SNAP_DAYS = 14, SNAP_MONTHS = 6;
let dbP = null;
function db() {
  if (!dbP) dbP = new Promise((res, rej) => {
    if (!("indexedDB" in window)) return rej(new Error("sin IndexedDB"));
    const r = indexedDB.open("nido-copias", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("snaps", { keyPath: "id" });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbP;
}
function store(mode) { return db().then((d) => d.transaction("snaps", mode).objectStore("snaps")); }
const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function listSnaps() {
  try { return (await req((await store("readonly")).getAll())).sort((a, b) => b.at - a.at); }
  catch (e) { return []; }
}
async function takeSnap() {
  if (S.example && !S.tx.length && !Object.keys(S.answers).length) return; // no copiar datos de ejemplo sin tocar
  try {
    const now = new Date(), day = todayISO(), data = JSON.parse(JSON.stringify(S));
    const st = await store("readwrite");
    st.put({ id: "d-" + day, kind: "día", at: now.getTime(), data });
    st.put({ id: "m-" + day.slice(0, 7), kind: "mes", at: now.getTime(), data });
    const all = await listSnaps();
    const drop = [...all.filter((s) => s.kind === "día").slice(SNAP_DAYS), ...all.filter((s) => s.kind === "mes").slice(SNAP_MONTHS)];
    if (drop.length) { const st2 = await store("readwrite"); drop.forEach((s) => st2.delete(s.id)); }
  } catch (e) { /* si el navegador no permite copias, la app sigue funcionando */ }
}
let snapT;
function scheduleSnap() { clearTimeout(snapT); snapT = setTimeout(takeSnap, 1500); }
document.addEventListener("visibilitychange", () => { if (document.hidden) { clearTimeout(snapT); takeSnap(); } });

function snapSummary(d) {
  const a = Object.values(d.answers || {}).filter((x) => x.d).length;
  return `${(d.tx || []).length} movimientos · ${(d.goals || []).length} metas · ${a} respuestas`;
}
function whenLabel(ms) {
  const d = new Date(ms), t = new Date(), y = new Date(); y.setDate(t.getDate() - 1);
  const hm = d.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === t.toDateString()) return "Hoy, " + hm;
  if (d.toDateString() === y.toDateString()) return "Ayer, " + hm;
  return d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" }) + ", " + hm;
}
async function fillSnaps() {
  const box = document.getElementById("snaps"); if (!box) return;
  const all = await listSnaps();
  if (!document.body.contains(box)) return;
  if (!all.length) { box.innerHTML = `<p class="muted small">Aún no hay copias. La primera se hace sola en cuanto anoten o cambien algo.</p>`; return; }
  box.innerHTML = all.map((s) => `
    <div class="snap" data-sid="${s.id}">
      <div style="min-width:0"><b>${s.kind === "mes" ? "📅 Copia del mes" : s.kind === "previo" ? "↩️ Antes de restaurar" : "🗓️ " + whenLabel(s.at)}</b>
        <small class="muted" style="display:block">${s.kind !== "día" ? whenLabel(s.at) + " · " : ""}${snapSummary(s.data)}</small></div>
      <button class="btn small" data-act="snapask">Restaurar</button>
    </div>`).join("");
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

/* ---------- Utilidades ---------- */
function monthKey(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
function todayISO() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
function monthLabel(k) { const [y, m] = k.split("-").map(Number); return MESES[m - 1] + " " + y; }
function shiftMonth(k, n) { const [y, m] = k.split("-").map(Number); return monthKey(new Date(y, m - 1 + n, 1)); }
const mx = (n) => "$" + Math.round(n || 0).toLocaleString("es-MX");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const num = (v) => Math.max(0, Number(String(v).replace(/[^\d.]/g, "")) || 0);
const total = () => S.incomes.a + S.incomes.b;
const bname = (b) => b.name.replace("{A}", S.names.a).replace("{B}", S.names.b);
const pctSum = () => S.buckets.reduce((a, b) => a + b.pct, 0);
const assigned = (b) => total() * b.pct / 100;
const css = (c) => `--c:var(--${c});--s:var(--${c}-s)`;

let toastT;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2600);
}

function answeredCount() {
  let d = 0, t = 0;
  CATS.forEach((c) => c.qs.forEach((q, i) => { t++; if ((S.answers[c.id + "-" + i] || {}).d) d++; }));
  return { d, t, pct: t ? Math.round(d / t * 100) : 0 };
}
function monthTx(k) { return S.tx.filter((t) => t.date.slice(0, 7) === k); }
function spentBy(k) {
  const m = {}; monthTx(k).forEach((t) => (m[t.bucket] = (m[t.bucket] || 0) + t.amount)); return m;
}
function basicMonthly() { return S.buckets.filter((b) => b.kind === "basico").reduce((a, b) => a + assigned(b), 0); }
function monthsUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date(), d = new Date(dateStr + "T12:00:00");
  const m = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
  return Math.max(1, m);
}

/* ---------- Dibujos ---------- */
function donut(items, centerTop, centerBottom) {
  const sum = items.reduce((a, d) => a + d.v, 0) || 1, R = 70, C = 2 * Math.PI * R;
  let off = 0, s = "";
  items.forEach((d) => {
    const len = d.v / sum * C;
    s += `<circle cx="100" cy="100" r="${R}" fill="none" stroke="var(--${d.c})" stroke-width="30" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 100 100)"/>`;
    off += len;
  });
  return `<svg viewBox="0 0 200 200" role="img" aria-label="Gráfica de dona">${s}
    <circle cx="100" cy="100" r="85" fill="none" stroke="var(--ink)" stroke-width="2.5"/>
    <circle cx="100" cy="100" r="55" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5"/>
    <text x="100" y="95" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="var(--muted)">${esc(centerTop)}</text>
    <text x="100" y="116" text-anchor="middle" font-family="Bricolage Grotesque,sans-serif" font-size="17" font-weight="800" fill="var(--ink)">${esc(centerBottom)}</text></svg>`;
}
function ring(p, c) {
  const R = 30, C = 2 * Math.PI * R, len = Math.min(1, p) * C;
  return `<svg viewBox="0 0 76 76" role="img" aria-label="${Math.round(p * 100)}% logrado">
    <circle cx="38" cy="38" r="${R}" fill="none" stroke="var(--line)" stroke-width="10"/>
    <circle cx="38" cy="38" r="${R}" fill="none" stroke="var(--${c})" stroke-width="10" stroke-linecap="round" stroke-dasharray="${len} ${C}" transform="rotate(-90 38 38)"/>
    <text x="38" y="43" text-anchor="middle" font-family="Bricolage Grotesque,sans-serif" font-size="15" font-weight="800" fill="var(--ink)">${Math.round(Math.min(1, p) * 100)}%</text></svg>`;
}
const HOUSE = `<svg viewBox="0 0 420 210" role="img" aria-label="Dibujo de una casita con dos personas">
  <circle cx="352" cy="44" r="26" fill="var(--mango)" stroke="var(--ink)" stroke-width="3"/>
  <path d="M20 190 Q210 160 400 190 L400 208 L20 208 Z" fill="var(--mint)" stroke="var(--ink)" stroke-width="3"/>
  <rect x="140" y="85" width="130" height="100" rx="6" fill="var(--sky)" stroke="var(--ink)" stroke-width="3"/>
  <path d="M125 90 L205 30 L285 90 Z" fill="var(--coral)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>
  <rect x="190" y="132" width="32" height="53" rx="4" fill="var(--mango)" stroke="var(--ink)" stroke-width="3"/>
  <rect x="152" y="104" width="28" height="24" rx="3" fill="var(--paper)" stroke="var(--ink)" stroke-width="3"/>
  <rect x="232" y="104" width="28" height="24" rx="3" fill="var(--paper)" stroke="var(--ink)" stroke-width="3"/>
  <g class="heart"><path d="M205 60 c-6-10-20-6-18 4 c2 8 18 16 18 16 s16-8 18-16 c2-10-12-14-18-4z" fill="var(--pink)" stroke="var(--ink)" stroke-width="2.5"/></g>
  <circle cx="62" cy="116" r="14" fill="var(--mango-s)" stroke="var(--ink)" stroke-width="3"/>
  <path d="M44 186 L48 140 Q62 128 76 140 L80 186 Z" fill="var(--grape)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="108" cy="112" r="14" fill="var(--coral-s)" stroke="var(--ink)" stroke-width="3"/>
  <path d="M90 186 L94 136 Q108 124 122 136 L126 186 Z" fill="var(--pink)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>
  <path d="M78 156 Q85 164 92 156" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>
  <rect x="300" y="146" width="56" height="40" rx="18" fill="var(--mango-s)" stroke="var(--ink)" stroke-width="3"/>
  <text x="328" y="172" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="800" font-size="11" fill="var(--ink)">BOTE</text>
</svg>`;

function flowHTML() {
  return `<div class="flow">
    <div class="p" style="${css("grape")}"><small class="muted">${esc(S.names.a)}</small><b>${mx(S.incomes.a)}</b></div>
    <span class="arrow" aria-hidden="true">＋</span>
    <div class="p" style="${css("pink")}"><small class="muted">${esc(S.names.b)}</small><b>${mx(S.incomes.b)}</b></div>
  </div>
  <div style="text-align:center;font-size:1.4rem" aria-hidden="true">⬇️</div>
  <div class="jar"><span class="eyebrow">El bote de los dos · al mes</span><b>${mx(total())}</b><small>100% de los ingresos en una sola cuenta</small></div>`;
}

/* ---------- Vistas ---------- */
const VIEWS = {
inicio() {
  const a = answeredCount(), k = monthKey(new Date()), sp = spentBy(k);
  const gastable = S.buckets.filter((b) => b.kind !== "ahorro");
  const used = gastable.reduce((x, b) => x + (sp[b.id] || 0), 0), cap = gastable.reduce((x, b) => x + assigned(b), 0);
  const ahorro = S.buckets.filter((b) => b.kind === "ahorro").reduce((x, b) => x + (sp[b.id] || 0), 0);
  const g = S.goals[0];
  return `
  <section class="hero" style="display:grid;gap:12px">
    ${HOUSE}
    <p class="eyebrow" style="color:var(--coral)">Su plan para independizarse</p>
    <h1>Hola, <span class="hl">${esc(S.names.a)}</span> y <span class="hl">${esc(S.names.b)}</span> 👋</h1>
  </section>
  ${S.example ? `<div class="tip" style="${css("mango")}"><b>✏️ Están viendo números de ejemplo</b><span class="small">Pongan sus nombres e ingresos reales para que todo se calcule con sus datos.</span><a class="btn small" href="#ajustes" style="justify-self:start">Poner mis datos</a></div>` : ""}
  ${flowHTML()}
  <div class="tiles">
    <div class="tile" style="${css("sky")}"><small>Gastado en ${MESES[new Date().getMonth()]}</small><b>${mx(used)}</b><small>de ${mx(cap)} para gastar</small></div>
    <div class="tile" style="${css("coral")}"><small>Apartado este mes</small><b>${mx(ahorro)}</b><small>fondo y metas</small></div>
    <div class="tile" style="${css("pink")}"><small>Cuestionario</small><b>${a.pct}%</b><small>${a.d} de ${a.t} platicadas</small></div>
    <div class="tile" style="${css("mango")}"><small>${g ? esc(g.emoji + " " + g.name) : "Metas"}</small><b>${g ? Math.round(Math.min(1, g.saved / (g.target || 1)) * 100) + "%" : "—"}</b><small>${g ? mx(g.saved) + " de " + mx(g.target) : "Agreguen una meta"}</small></div>
  </div>
  <div class="card">
    <h3>Exportar y respaldar 📄</h3>
    <p class="muted small">Un PDF bonito con su presupuesto, gastos del mes, metas y respuestas del cuestionario.</p>
    <div class="row">
      <button class="btn primary" data-act="pdf">📄 Exportar a PDF</button>
      <a class="btn" href="#ajustes">⚙️ Ajustes y respaldo</a>
    </div>
  </div>
  <p class="muted small">🛟 La app guarda sola una copia diaria en este teléfono. Para cambiar de celular, usen <b>Guardar respaldo</b> en Ajustes.</p>`;
},

plan() {
  const a = answeredCount();
  const cat = CATS.find((c) => c.id === S.ui.cat) || CATS[0];
  const ci = CATS.indexOf(cat);
  const chips = CATS.map((c) => {
    const d = c.qs.filter((q, i) => (S.answers[c.id + "-" + i] || {}).d).length;
    return `<button class="chip" data-act="cat" data-id="${c.id}" aria-pressed="${c.id === cat.id}">${c.emoji} ${c.name}<span class="n">${d}/${c.qs.length}</span></button>`;
  }).join("");
  const qs = cat.qs.map((q, i) => {
    const k = cat.id + "-" + i, st = S.answers[k] || {};
    return `<div class="q${st.d ? " done" : ""}" data-k="${k}">
      <label class="top" for="c-${k}"><input class="check" type="checkbox" id="c-${k}" data-act="ans" ${st.d ? "checked" : ""}><span>${esc(q[0])}</span></label>
      ${q[1] ? `<p class="hint">💡 ${esc(q[1])}</p>` : ""}
      <textarea class="input" id="t-${k}" data-act="note" placeholder="Sus notas y acuerdos…" aria-label="Notas">${esc(st.n || "")}</textarea></div>`;
  }).join("");
  return `
  <div class="card">
    <div class="between"><h3>Su avance 💪</h3><b class="num">${a.pct}%</b></div>
    <div class="bar stripes"><i style="width:${a.pct}%"></i></div>
    <p class="muted small">${a.d} de ${a.t} preguntas platicadas. Palomeen cuando ya lo hayan hablado.</p>
  </div>
  <div class="chips" role="group" aria-label="Categorías">${chips}</div>
  <section style="display:grid;gap:14px;${css(cat.c)}">
    <div class="head"><div class="icon" aria-hidden="true">${cat.emoji}</div><div><p class="eyebrow">Estación ${ci + 1} de ${CATS.length}</p><h2>${cat.name}</h2><p class="muted small">${esc(cat.intro)}</p></div></div>
    ${cat.fact ? `<div class="fact"><span class="eyebrow">📊 ${esc(cat.fact.eyebrow)}</span><span class="big">${esc(cat.fact.big)}</span><p>${esc(cat.fact.text)}</p><span class="src">Fuente: ${esc(cat.fact.src)}</span></div>` : ""}
    ${qs}
    ${cat.tip ? `<div class="tip"><h3>${esc(cat.tip.title)}</h3><ul>${cat.tip.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>` : ""}
    <div class="row">
      ${ci > 0 ? `<button class="btn ghost" data-act="cat" data-id="${CATS[ci - 1].id}">← ${CATS[ci - 1].name}</button>` : ""}
      ${ci < CATS.length - 1 ? `<button class="btn mint" data-act="cat" data-id="${CATS[ci + 1].id}">${CATS[ci + 1].name} →</button>` : ""}
    </div>
  </section>`;
},

bote() {
  const sum = pctSum();
  const pill = sum === 100 ? `<span class="pill ok">100% repartido</span>` : sum < 100 ? `<span class="pill warn">Faltan ${100 - sum}% por repartir</span>` : `<span class="pill bad">Se pasan por ${sum - 100}%</span>`;
  const casa = S.buckets.find((b) => b.id === "casa");
  const pCasa = casa ? casa.pct : 0;
  const items = S.buckets.filter((b) => b.pct > 0).map((b) => ({ v: b.pct, c: b.c }));
  const rows = S.buckets.map((b) => `
    <div class="soft" style="${css(b.c)}" data-id="${b.id}">
      <div class="bucket"><span class="em" aria-hidden="true">${b.emoji}</span>
        <span class="name">${esc(bname(b))}<br><small class="muted">${b.kind === "ahorro" ? "Ahorro" : b.kind === "basico" ? "Básico" : "Gasto"}</small></span>
        <span class="amt">${mx(assigned(b))}</span></div>
      <div class="pctctl"><input type="range" min="0" max="60" step="1" value="${b.pct}" id="r-${b.id}" data-act="pct" aria-label="Porcentaje de ${esc(bname(b))}"><span class="v">${b.pct}%</span></div>
      <details class="box"><summary>Editar sobre</summary><div>
        <div class="grid2">
          <div class="field"><label for="bn-${b.id}">Nombre</label><input class="input" id="bn-${b.id}" data-act="bname" value="${esc(b.name)}"></div>
          <div class="field"><label for="be-${b.id}">Emoji</label><input class="input" id="be-${b.id}" data-act="bemoji" value="${esc(b.emoji)}" maxlength="4"></div>
          <div class="field"><label for="bk-${b.id}">Tipo</label><select class="input" id="bk-${b.id}" data-act="bkind">
            <option value="basico" ${b.kind === "basico" ? "selected" : ""}>Básico (cuenta para el fondo)</option>
            <option value="gasto" ${b.kind === "gasto" ? "selected" : ""}>Gasto</option>
            <option value="ahorro" ${b.kind === "ahorro" ? "selected" : ""}>Ahorro</option></select></div>
        </div>
        <button class="btn small ghost" data-act="bdel" style="justify-self:start">🗑️ Quitar sobre</button>
      </div></details>
    </div>`).join("");
  return `
  <div class="head" style="${css("mint")}"><div class="icon" aria-hidden="true">🫙</div><div><p class="eyebrow">Una sola cuenta</p><h2>El bote común</h2><p class="muted small">Todo entra junto y se reparte en sobres. Muevan las barritas hasta llegar a 100%.</p></div></div>
  ${flowHTML()}
  <div class="card">
    <div class="between"><h3>Cómo se reparte</h3>${pill}</div>
    <div class="donutwrap">${donut(items, "Repartido", sum + "%")}
      <div class="legend">${S.buckets.filter((b) => b.pct > 0).map((b) => `<span><i style="background:var(--${b.c})"></i>${b.emoji} ${esc(bname(b))} · ${b.pct}%</span>`).join("")}</div></div>
    ${pCasa > 35 ? `<p class="pill bad" style="white-space:normal">La vivienda se lleva ${pCasa}% del bote. Lo sano es 30–35%.</p>` : ""}
  </div>
  <div style="display:grid;gap:10px">${rows}</div>
  <div class="row">
    <button class="btn mint" data-act="badd">＋ Agregar sobre</button>
    <button class="btn ghost" data-act="breset">Volver a la sugerencia</button>
  </div>
  <div class="tip" style="${css("mint")}">
    <h3>🧠 Tips de coach para un bote común</h3>
    <ul>
      <li><b>Primero se aparta, luego se gasta.</b> El día de pago, pasen el fondo y las metas a su apartado antes de cualquier gasto.</li>
      <li><b>Gustito personal igual para los dos</b>, sin rendir cuentas. Es lo que mantiene la libertad dentro de una sola cuenta.</li>
      <li><b>Cita de dinero cada quincena</b>, 20 minutos: revisan la pestaña Gastos y ajustan.</li>
      <li>Otra opción, si algún día lo quieren: que cada uno se transfiera su gustito a una cuenta personal. Lo dejan a su elección.</li>
    </ul>
  </div>`;
},

gastos() {
  const k = S.ui.month || monthKey(new Date());
  const list = monthTx(k).sort((a, b) => b.date.localeCompare(a.date) || b.t - a.t);
  const sp = spentBy(k);
  const tot = list.reduce((a, t) => a + t.amount, 0);
  const opts = S.buckets.map((b) => `<option value="${b.id}">${b.emoji} ${esc(bname(b))}</option>`).join("");
  const bars = S.buckets.map((b) => {
    const used = sp[b.id] || 0, cap = assigned(b), p = cap ? used / cap : 0;
    return `<div style="display:grid;gap:4px;${css(b.c)}">
      <div class="between small"><b>${b.emoji} ${esc(bname(b))}</b><span class="num">${mx(used)} / ${mx(cap)}</span></div>
      <div class="bar${p > 1 && b.kind !== "ahorro" ? " over" : ""}"><i style="width:${Math.min(100, p * 100)}%"></i></div></div>`;
  }).join("");
  const rows = list.map((t) => {
    const b = S.buckets.find((x) => x.id === t.bucket) || { emoji: "❔", name: "Sin sobre", c: "mango" };
    const who = t.who === "a" ? S.names.a : t.who === "b" ? S.names.b : "Los dos";
    return `<div class="tx" style="${css(b.c)}"><span class="em" aria-hidden="true">${b.emoji}</span>
      <span class="d"><b>${esc(t.desc || bname(b))}</b><small class="muted">${t.date.slice(8)} ${MESES[+t.date.slice(5, 7) - 1].slice(0, 3)} · ${esc(who)}</small></span>
      <span class="m">${mx(t.amount)}</span><button class="iconbtn" data-act="txdel" data-id="${t.id}" aria-label="Borrar movimiento">✕</button></div>`;
  }).join("");
  return `
  <div class="head" style="${css("sky")}"><div class="icon" aria-hidden="true">🧾</div><div><p class="eyebrow">Registro del bote</p><h2>Gastos y apartados</h2><p class="muted small">Anoten lo que sale del bote. En sobres de ahorro, anoten lo que apartan.</p></div></div>
  <form class="card" id="txform" autocomplete="off">
    <h3>Anotar movimiento</h3>
    <div class="grid2">
      <div class="field"><label for="txAmt">Monto</label><input class="input" id="txAmt" inputmode="decimal" placeholder="$0" required></div>
      <div class="field"><label for="txBucket">Sobre</label><select class="input" id="txBucket">${opts}</select></div>
      <div class="field"><label for="txDesc">¿En qué?</label><input class="input" id="txDesc" placeholder="Ej. súper de la semana" maxlength="60"></div>
      <div class="field"><label for="txDate">Fecha</label><input class="input" id="txDate" type="date" value="${todayISO()}"></div>
      <div class="field"><label for="txWho">¿Quién lo hizo?</label><select class="input" id="txWho"><option value="ab">Los dos</option><option value="a">${esc(S.names.a)}</option><option value="b">${esc(S.names.b)}</option></select></div>
    </div>
    <button class="btn primary" type="submit">＋ Anotar</button>
  </form>
  <div class="between">
    <button class="btn small ghost" data-act="month" data-n="-1" aria-label="Mes anterior">←</button>
    <h3 style="text-transform:capitalize">${monthLabel(k)}</h3>
    <button class="btn small ghost" data-act="month" data-n="1" aria-label="Mes siguiente">→</button>
  </div>
  <div class="card"><div class="between"><h3>Cómo van los sobres</h3><b class="num">${mx(tot)}</b></div>${bars}</div>
  <div class="card"><h3>Movimientos</h3>
    ${rows ? `<div class="txlist">${rows}</div>` : `<div class="empty"><span class="big">🧾</span><b>Aún no hay movimientos este mes</b><span class="muted small">Anoten el primero arriba; aquí aparecerá la lista.</span></div>`}
  </div>`;
},

metas() {
  const basic = basicMonthly();
  const goals = S.goals.map((g) => {
    const p = g.target ? g.saved / g.target : 0, left = Math.max(0, g.target - g.saved), m = monthsUntil(g.date);
    return `<div class="card" style="${css(g.c)}" data-id="${g.id}">
      <div class="goal">${ring(p, g.c)}<div style="display:grid;gap:2px;min-width:0">
        <h3>${esc(g.emoji)} ${esc(g.name)}</h3>
        <span class="num"><b>${mx(g.saved)}</b> <span class="muted">de ${mx(g.target)}</span></span>
        <span class="small muted">${left === 0 ? "¡Meta lograda! 🎉" : m ? `Para ${new Date(g.date + "T12:00").toLocaleDateString("es-MX", { month: "long", year: "numeric" })}: <b style="color:var(--ink)">${mx(left / m)} al mes</b>` : "Pongan una fecha para calcular cuánto al mes."}</span>
      </div></div>
      <div class="row"><input class="input" id="ab-${g.id}" inputmode="decimal" placeholder="Abonar $" style="flex:1;min-width:120px" aria-label="Monto a abonar">
        <button class="btn mint small" data-act="gadd">＋ Abonar</button></div>
      <details class="box"><summary>Editar meta</summary><div><div class="grid2">
        <div class="field"><label for="gn-${g.id}">Nombre</label><input class="input" id="gn-${g.id}" data-act="gfield" data-f="name" value="${esc(g.name)}"></div>
        <div class="field"><label for="ge-${g.id}">Emoji</label><input class="input" id="ge-${g.id}" data-act="gfield" data-f="emoji" value="${esc(g.emoji)}" maxlength="4"></div>
        <div class="field"><label for="gt-${g.id}">Meta $</label><input class="input" id="gt-${g.id}" data-act="gfield" data-f="target" inputmode="decimal" value="${g.target}"></div>
        <div class="field"><label for="gs-${g.id}">Llevan $</label><input class="input" id="gs-${g.id}" data-act="gfield" data-f="saved" inputmode="decimal" value="${g.saved}"></div>
        <div class="field"><label for="gd-${g.id}">Fecha meta</label><input class="input" id="gd-${g.id}" data-act="gfield" data-f="date" type="date" value="${esc(g.date)}"></div>
      </div><button class="btn small ghost" data-act="gdel" style="justify-self:start">🗑️ Quitar meta</button></div></details>
    </div>`;
  }).join("");
  return `
  <div class="head" style="${css("pink")}"><div class="icon" aria-hidden="true">🎯</div><div><p class="eyebrow">Sueños con fecha</p><h2>Metas</h2><p class="muted small">Pongan cuánto y para cuándo; la app les dice cuánto apartar al mes.</p></div></div>
  <div class="fact" style="${css("coral")}"><span class="eyebrow">🛟 Su fondo de emergencia ideal</span>
    <span class="big">${mx(basic * 3)} – ${mx(basic * 6)}</span>
    <p>Es de 3 a 6 meses de sus gastos básicos (${mx(basic)} al mes, según sus sobres básicos), como recomienda Condusef. Con un solo bote, mejor acercarse a 6.</p>
    <span class="src">Fuente: Condusef, 2026</span></div>
  ${goals || `<div class="empty card"><span class="big">🎯</span><b>Sin metas todavía</b><span class="muted small">Agreguen la primera abajo.</span></div>`}
  <form class="card" id="goalform" autocomplete="off">
    <h3>Nueva meta ✨</h3>
    <div class="grid2">
      <div class="field"><label for="ngName">¿Qué sueñan?</label><input class="input" id="ngName" placeholder="Ej. Viaje a Oaxaca" required maxlength="40"></div>
      <div class="field"><label for="ngEmoji">Emoji</label><input class="input" id="ngEmoji" value="✈️" maxlength="4"></div>
      <div class="field"><label for="ngTarget">¿Cuánto cuesta?</label><input class="input" id="ngTarget" inputmode="decimal" placeholder="$0" required></div>
      <div class="field"><label for="ngDate">¿Para cuándo?</label><input class="input" id="ngDate" type="date"></div>
    </div>
    <button class="btn primary" type="submit">＋ Agregar meta</button>
  </form>
  <div class="tip" style="${css("pink")}"><b>Orden sugerido para que no choquen</b>
    <ul><li>1️⃣ Fondo de emergencia (al menos 3 meses).</li><li>2️⃣ Arranque de la mudanza.</li><li>3️⃣ Viajes, auto, estudios y lo demás.</li></ul></div>`;
},

ajustes() {
  return `
  <div class="head" style="${css("grape")}"><div class="icon" aria-hidden="true">⚙️</div><div><p class="eyebrow">Su información</p><h2>Ajustes</h2><p class="muted small">Nombres, ingresos, respaldo y cómo instalar la app.</p></div></div>
  <div class="card"><h3>Ustedes dos 💞</h3>
    <div class="grid2">
      <div class="field"><label for="nA">Nombre 1</label><input class="input" id="nA" data-act="set" data-path="names.a" value="${esc(S.names.a)}" maxlength="20"></div>
      <div class="field"><label for="iA">Ingreso neto al mes</label><input class="input" id="iA" data-act="set" data-path="incomes.a" inputmode="numeric" value="${S.incomes.a}"></div>
      <div class="field"><label for="nB">Nombre 2</label><input class="input" id="nB" data-act="set" data-path="names.b" value="${esc(S.names.b)}" maxlength="20"></div>
      <div class="field"><label for="iB">Ingreso neto al mes</label><input class="input" id="iB" data-act="set" data-path="incomes.b" inputmode="numeric" value="${S.incomes.b}"></div>
    </div>
    <p class="muted small">Neto = lo que de verdad les llega a la cuenta, ya con impuestos descontados.</p>
  </div>
  <div class="card"><h3>Exportar y respaldar 📦</h3>
    <div class="row"><button class="btn primary" data-act="pdf">📄 Exportar a PDF</button>
      <button class="btn" data-act="backup">💾 Guardar respaldo</button>
      <label class="btn" for="restore">📂 Cargar respaldo</label><input type="file" id="restore" accept="application/json,.json" hidden></div>
    <p class="muted small">El respaldo es un archivo que pueden guardar en Drive, iCloud o mandarse por WhatsApp. Con él pasan sus datos a otro teléfono.</p>
  </div>
  <div class="card" style="${css("mint")}"><h3>🛟 Copias automáticas</h3>
    <p class="muted small">La app guarda sola una copia cada día (últimos ${SNAP_DAYS} días) y una por mes (últimos ${SNAP_MONTHS} meses). Si borran algo sin querer, regresen a una copia anterior.</p>
    <div id="snaps" class="snaps"><p class="muted small">Buscando copias…</p></div>
    <p class="small" style="color:var(--warn-ink)">⚠️ Estas copias viven en este teléfono. Si borran la app o cambian de celular, usen <b>Guardar respaldo</b>.</p>
  </div>
  <details class="box"><summary>📲 Cómo instalarla en el teléfono</summary><div class="small">
    <p><b>iPhone (Safari):</b> abran la página, toquen el botón Compartir y elijan "Agregar a pantalla de inicio".</p>
    <p><b>Android (Chrome):</b> abran la página, toquen el menú ⋮ y elijan "Instalar app" o "Agregar a pantalla principal".</p>
    <p>Después de abrirla una vez con internet, funciona sin conexión.</p>
  </div></details>
  <details class="box"><summary>📚 Fuentes de los datos</summary><div class="small"><ul style="margin:0;padding-left:18px;display:grid;gap:4px">${SOURCES.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
    <p class="muted">La parte legal es orientación general y cambia según el estado. Para decisiones concretas, consulten a un abogado o notario.</p></div></details>
  <div class="card" style="border-color:var(--coral);box-shadow:4px 4px 0 var(--coral)" id="wipeBox">
    <h3>Borrar todo</h3><p class="muted small">Quita respuestas, gastos y metas de este teléfono. Las copias automáticas se conservan por si se arrepienten.</p>
    <button class="btn small ghost" data-act="wipe" style="justify-self:start">Borrar todos mis datos</button>
  </div>`;
}
};

/* ---------- Router ---------- */
function current() { const h = location.hash.slice(1); return VIEWS[h] ? h : "inicio"; }
function render(keepScroll) {
  const name = current(), y = window.scrollY;
  view.innerHTML = VIEWS[name]();
  document.querySelectorAll(".tabs a").forEach((a) => {
    const on = a.dataset.tab === name || (name === "ajustes" && a.dataset.tab === "inicio");
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  window.scrollTo(0, keepScroll ? y : 0);
  if (name === "ajustes") fillSnaps();
}
window.addEventListener("hashchange", () => render(false));

/* ---------- Eventos ---------- */
view.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const act = el.dataset.act, card = el.closest("[data-id]");
  if (act === "cat") { S.ui.cat = el.dataset.id; save(); render(false); }
  else if (act === "month") { S.ui.month = shiftMonth(S.ui.month || monthKey(new Date()), +el.dataset.n); save(); render(true); }
  else if (act === "txdel") { S.tx = S.tx.filter((t) => t.id !== el.dataset.id); save(); render(true); toast("Movimiento borrado"); }
  else if (act === "badd") { S.buckets.push({ id: uid(), name: "Nuevo sobre", emoji: "✨", c: COLORS[S.buckets.length % COLORS.length], pct: 0, kind: "gasto" }); save(); render(true); toast("Sobre agregado al final"); }
  else if (act === "breset") { S.buckets = JSON.parse(JSON.stringify(DEFAULT_BUCKETS)); save(); render(true); toast("Sobres sugeridos restaurados"); }
  else if (act === "bdel" && card) { S.buckets = S.buckets.filter((b) => b.id !== card.dataset.id); save(); render(true); toast("Sobre quitado"); }
  else if (act === "gdel" && card) { S.goals = S.goals.filter((g) => g.id !== card.dataset.id); save(); render(true); toast("Meta quitada"); }
  else if (act === "gadd" && card) {
    const g = S.goals.find((x) => x.id === card.dataset.id), inp = $("#ab-" + g.id), v = num(inp.value);
    if (!v) { inp.focus(); toast("Escriban cuánto abonan"); return; }
    g.saved += v; save(); render(true); toast(`Abonaron ${mx(v)} a ${g.name} 🎉`);
  }
  else if (act === "pdf") { exportPDF(); }
  else if (act === "backup") { backup(); }
  else if (act === "wipe") {
    $("#wipeBox").innerHTML = `<h3>¿Seguro?</h3><p class="small">Se borra todo lo de este teléfono y no se puede deshacer. Si quieren, primero guarden un respaldo.</p>
      <div class="row"><button class="btn primary small" data-act="wipeyes">Sí, borrar todo</button><button class="btn small" data-act="wipeno">Cancelar</button></div>`;
  }
  else if (act === "wipeyes") { S = freshState(); save(); location.hash = "#inicio"; render(false); toast("Listo, empezaron de cero"); }
  else if (act === "wipeno") { render(true); }
  else if (act === "snapask") {
    const row = el.closest("[data-sid]");
    el.outerHTML = `<span class="row" style="gap:6px"><button class="btn small primary" data-act="snapyes">Sí, restaurar</button><button class="btn small ghost" data-act="snapno">No</button></span>`;
    row.querySelector("small").insertAdjacentHTML("afterend", `<small style="display:block;color:var(--warn-ink);font-weight:700">Lo de ahora se reemplaza por esta copia. Antes guardamos lo actual por si acaso.</small>`);
  }
  else if (act === "snapno") { fillSnaps(); }
  else if (act === "snapyes") {
    const id = el.closest("[data-sid]").dataset.sid;
    (async () => {
      const all = await listSnaps(), snap = all.find((s) => s.id === id);
      if (!snap) { toast("No encontramos esa copia"); fillSnaps(); return; }
      try { (await store("readwrite")).put({ id: "p-previo", kind: "previo", at: Date.now(), data: JSON.parse(JSON.stringify(S)) }); } catch (e) {}
      S = JSON.parse(JSON.stringify(snap.data)); S.example = false;
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
      render(true); toast("Copia restaurada ✅");
    })();
  }
});

view.addEventListener("change", (e) => {
  const el = e.target, act = el.dataset.act, card = el.closest("[data-id]");
  if (act === "ans") {
    const q = el.closest(".q"), k = q.dataset.k;
    S.answers[k] = { ...(S.answers[k] || {}), d: el.checked }; save(); render(true);
  } else if (act === "pct" && card) {
    S.buckets.find((b) => b.id === card.dataset.id).pct = +el.value; save(); render(true);
  } else if (act === "bkind" && card) {
    S.buckets.find((b) => b.id === card.dataset.id).kind = el.value; save();
  } else if (act === "gfield" && card) {
    const g = S.goals.find((x) => x.id === card.dataset.id), f = el.dataset.f;
    g[f] = (f === "target" || f === "saved") ? num(el.value) : el.value; save(); render(true);
  } else if (act === "bname" || act === "bemoji") { render(true); }
  else if (act === "set") { render(true); }
  else if (el.id === "restore") { restore(el.files[0]); el.value = ""; }
});

view.addEventListener("input", (e) => {
  const el = e.target, act = el.dataset.act, card = el.closest("[data-id]");
  if (act === "note") { const k = el.closest(".q").dataset.k; S.answers[k] = { ...(S.answers[k] || {}), n: el.value }; save(); }
  else if (act === "pct" && card) { el.nextElementSibling.textContent = el.value + "%"; }
  else if (act === "bname" && card) { S.buckets.find((b) => b.id === card.dataset.id).name = el.value || "Sobre"; save(); }
  else if (act === "bemoji" && card) { S.buckets.find((b) => b.id === card.dataset.id).emoji = el.value || "✨"; save(); }
  else if (act === "set") {
    const [o, k] = el.dataset.path.split(".");
    S[o][k] = o === "incomes" ? num(el.value) : (el.value.trim() || (k === "a" ? "Persona A" : "Persona B"));
    S.example = false; save();
  }
});

view.addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.target.id === "txform") {
    const amt = num($("#txAmt").value);
    if (!amt) { $("#txAmt").focus(); toast("Escriban el monto"); return; }
    const date = $("#txDate").value || todayISO();
    S.tx.push({ id: uid(), t: Date.now(), amount: amt, bucket: $("#txBucket").value, desc: $("#txDesc").value.trim(), date, who: $("#txWho").value });
    S.ui.month = date.slice(0, 7); save(); render(true); toast(`Anotado: ${mx(amt)}`);
  } else if (e.target.id === "goalform") {
    const target = num($("#ngTarget").value);
    if (!target) { $("#ngTarget").focus(); toast("Escriban cuánto cuesta la meta"); return; }
    S.goals.push({ id: uid(), name: $("#ngName").value.trim(), emoji: $("#ngEmoji").value || "✨", target, saved: 0, date: $("#ngDate").value, c: COLORS[S.goals.length % COLORS.length] });
    save(); render(true); toast("Meta agregada ✨");
  }
});

/* ---------- Compartir / descargar archivos ---------- */
async function deliver(blob, filename, title) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] }) && /iphone|ipad|android/i.test(navigator.userAgent)) {
    try { await navigator.share({ files: [file], title }); return; }
    catch (e) { if (e.name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function stamp() { return todayISO(); }

async function exportPDF() {
  try {
    const blob = NidoPDF.build(S, { CATS, mx, bname, assigned, total, spentBy, monthKey, monthLabel, basicMonthly, monthsUntil, SOURCES });
    await deliver(blob, `nuestro-nido-${stamp()}.pdf`, "Nuestro Nido");
    toast("PDF listo 📄");
  } catch (e) { console.error(e); toast("No se pudo crear el PDF. Intenten de nuevo."); }
}
async function backup() {
  const blob = new Blob([JSON.stringify({ app: "nuestro-nido", saved: new Date().toISOString(), data: S }, null, 2)], { type: "application/json" });
  await deliver(blob, `nuestro-nido-respaldo-${stamp()}.json`, "Respaldo Nuestro Nido");
  toast("Respaldo guardado 💾");
}
function restore(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const j = JSON.parse(r.result), d = j.data || j;
      if (d.v !== 1 || !d.buckets || !d.names) throw new Error("formato");
      S = d; save(); render(false); toast("Respaldo cargado ✅");
    } catch (e) { toast("Ese archivo no es un respaldo de Nuestro Nido."); }
  };
  r.readAsText(file);
}

/* ---------- Sin conexión y service worker ---------- */
function net() { $("#offline").hidden = navigator.onLine; }
window.addEventListener("online", net); window.addEventListener("offline", net); net();
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

render(false);

// Si el guardado normal se perdió pero hay copias automáticas, se recupera la más reciente.
if (startedEmpty) {
  listSnaps().then((all) => {
    const last = all.find((s) => s.kind === "día") || all[0];
    if (!last) return;
    S = JSON.parse(JSON.stringify(last.data));
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    render(false); toast("Recuperamos su última copia automática 🛟");
  });
}
})();
