// ---------------------------------------------------------------------------
// Módulos da planilha "Lideranças — CONecta Campanha"
// Lideranças · Eleitores (geral / Adriano José / Paranhos) · Mensagens
// ---------------------------------------------------------------------------
import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, Plus, X, Pencil, Trash2, Copy, Send, Upload, Download, CheckCircle2,
  ChevronDown, ChevronUp, MessageCircle, Users,
} from "lucide-react";

export const NIVEL_LID = ["Cabo Eleitoral", "Liderança", "Apoiador"];
export const STATUS_LID = ["Ativo", "Inativo", "Pausado"];
export const GENERO = ["Masculino", "Feminino", "Outro"];
export const NIVEL_VOTO = ["Confirmado", "Pendente", "Indeciso"];
export const CATEGORIAS_ELE = ["Sem categoria", "Amigos", "Prefeitura", "Igreja", "Carretinha de Natal", "Comerciantes", "Barracas", "Visitas"];
export const STATUS_CONTATO = ["Enviado", "Indeciso", "Grupo"];
export const CARGOS_PLAN = [
  ["estadual", "Dep. Estadual"], ["federal", "Dep. Federal"], ["senador", "Senador"],
  ["governador", "Governador"], ["presidente", "Presidente"],
];

export const LISTAS_ELEITORES = {
  eleitores: { key: "eleitores", tab: "Cadastro geral", title: "Eleitores", sub: "Cadastro completo de Ivatuba/PR, com intenção de voto por cargo", cargos: true, origem: "Eleitor", sheet: "Eleitores" },
  adriano: { key: "adriano", tab: "Adriano José", title: "Eleitores — Adriano José", sub: "Deputado Estadual · 55.900", origem: "Adriano José", sheet: "Eleitores - Adriano José" },
  paranhos: { key: "paranhos", tab: "Paranhos", title: "Eleitores — Paranhos", sub: "Deputado Federal", origem: "Paranhos", sheet: "Eleitores - Paranhos" },
};

// ---------- utilidades ----------
let xlsxPromise = null;
function carregarXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  xlsxPromise ||= new Promise((ok, falha) => {
    const sc = document.createElement("script");
    sc.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    sc.onload = () => ok(window.XLSX); sc.onerror = () => { xlsxPromise = null; falha(new Error("xlsx")); };
    document.head.appendChild(sc);
  });
  return xlsxPromise;
}
const inputCls = "w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2";
const inputStyle = { borderColor: "var(--border)", background: "var(--surface)" };
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const digits = (s) => String(s || "").replace(/\D/g, "");
export function fmtTel(s) {
  const d = digits(s);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return String(s || "").trim();
}
export function fmtCpf(s) {
  const d = digits(s);
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : String(s || "").trim();
}
function waNumber(tel) {
  let d = digits(tel).replace(/^0+/, "");
  if (!d) return "";
  if (d.length === 10 || d.length === 11) d = "55" + d;
  return d.length >= 12 ? d : "";
}
export function montarMensagem(cfg, nome) {
  let m = (cfg?.mensagem || "Olá {nome}!").split("{nome}").join(nome || "");
  if (cfg?.link) m += "\n\nFoto/Vídeo: " + cfg.link;
  return m;
}
function waLink(tel, msg) {
  const n = waNumber(tel);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(msg)}` : "";
}
async function copiar(texto, avisar) {
  try { await navigator.clipboard.writeText(texto); avisar("Mensagem copiada"); return; } catch (e) { /* fallback */ }
  const ta = document.createElement("textarea");
  ta.value = texto; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); avisar("Mensagem copiada"); } catch (e) { avisar("Não foi possível copiar"); }
  ta.remove();
}
const isExemplo = (r) => /exemplo/i.test(r.observacoes || "") && /apague/i.test(r.observacoes || "");

const TONS = {
  ok: { bg: "#E6F7EF", fg: "#1E8E5F" }, warn: { bg: "#FFF3DC", fg: "#9A6300" }, bad: { bg: "#FBE9E7", fg: "#B3402C" },
  blue: { bg: "#EAF1FE", fg: "var(--blue-600)" }, purple: { bg: "#EFE9FB", fg: "#6A4CB8" }, grey: { bg: "#EEF1F5", fg: "#5B6B7C" },
  gold: { bg: "#FFF6DA", fg: "#8A6400" },
};
function tomDe(v, tipo) {
  if (tipo === "contato") return v === "Enviado" ? "ok" : v === "Grupo" ? "warn" : v === "Indeciso" ? "gold" : "grey";
  return ({ Confirmado: "ok", Pendente: "warn", Indeciso: "bad", Ativo: "ok", Inativo: "grey", Pausado: "bad",
    "Cabo Eleitoral": "ok", "Liderança": "blue", Apoiador: "purple" })[v] || "grey";
}
function Kpi({ label, value, tone, lead }) {
  const cor = tone ? TONS[tone].fg : "var(--ink-900)";
  return (
    <div className="cc-card p-3 flex flex-col gap-0.5" style={lead ? { background: "var(--blue-600)", borderColor: "var(--blue-600)" } : undefined}>
      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: lead ? "rgba(255,255,255,.85)" : "var(--ink-500)" }}>{label}</span>
      <span className="cc-display text-2xl font-bold tabular-nums" style={{ color: lead ? "#fff" : cor }}>{value}</span>
    </div>
  );
}
function useToast() {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);
  const avisar = (m) => { setMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(null), 2500); };
  const el = msg ? (
    <div role="status" className="fixed left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-lg text-sm font-semibold text-white shadow-lg"
      style={{ background: "var(--navy-950)", bottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>{msg}</div>
  ) : null;
  return [avisar, el];
}
function Folha({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" style={{ background: "rgba(10,25,41,0.55)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cc-card cc-fade-in w-full max-w-xl max-h-[92vh] overflow-y-auto cc-scroll rounded-b-none sm:rounded-[14px]" style={{ background: "var(--surface)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 z-10" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <h3 className="cc-display font-semibold text-base">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100" aria-label="Fechar"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
function Campo({ label, children, full }) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="font-medium text-xs" style={{ color: "var(--ink-500)" }}>{label}</span>
      {children}
    </label>
  );
}
function Sel({ value, onChange, opcoes, vazio = "—", id }) {
  return (
    <select id={id} className={inputCls} style={inputStyle} value={value || ""} onChange={(e) => onChange(e.target.value)}>
      <option value="">{vazio}</option>
      {opcoes.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

// ---------- mensagem do WhatsApp (config por lista) ----------
function PainelMensagem({ chave, rotulo, msgKV, avisar }) {
  const atual = msgKV.data?.[chave] || {};
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState(null);
  const val = rascunho || { mensagem: atual.mensagem || "", link: atual.link || "" };
  const preview = montarMensagem(val, "Maria");
  async function salvar() {
    await msgKV.setValue(chave, { mensagem: val.mensagem, link: (val.link || "").trim() });
    setRascunho(null); avisar("Mensagem salva");
  }
  return (
    <div className="cc-card">
      <button onClick={() => setAberto(!aberto)} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-sm font-semibold"><MessageCircle size={16} style={{ color: "var(--blue-600)" }} /> Mensagem do WhatsApp {rotulo}</span>
        <span className="flex items-center gap-2 text-xs" style={{ color: "var(--ink-500)" }}>use {"{nome}"} {aberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </button>
      {aberto && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <Campo label="Mensagem completa">
            <textarea rows={8} className={inputCls} style={inputStyle} value={val.mensagem}
              onChange={(e) => setRascunho({ ...val, mensagem: e.target.value })} placeholder="Olá {nome}! Aqui é da campanha…" />
          </Campo>
          <Campo label="Link da foto/vídeo (opcional — Google Drive, Google Fotos, Canva, Imgur…)">
            <input className={inputCls} style={inputStyle} value={val.link} onChange={(e) => setRascunho({ ...val, link: e.target.value })} placeholder="https://" />
          </Campo>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--ink-500)" }}>Prévia para “Maria”</p>
            <div className="text-sm whitespace-pre-wrap rounded-lg border p-3 max-h-48 overflow-auto cc-scroll" style={{ borderColor: "var(--border)", background: "var(--paper)" }}>{preview}</div>
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs" style={{ color: "var(--ink-500)" }}>O botão WhatsApp abre a conversa com a mensagem completa e o link.</span>
            <button onClick={salvar} disabled={!rascunho} className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: "var(--blue-600)" }}>Salvar mensagem</button>
          </div>
        </div>
      )}
    </div>
  );
}

function focarNovaLinha() {
  const el = document.querySelector(".xg tr.xg-new input");
  if (el) { el.scrollIntoView({ block: "center", behavior: "smooth" }); setTimeout(() => el.focus(), 250); }
}

function AcoesLinha({ tel, msg, avisar, onMarcar }) {
  const link = waLink(tel, msg);
  return (
    <>
      {link ? <a className="wa" href={link} target="_blank" rel="noopener noreferrer" title="Abrir WhatsApp com a mensagem"><Send size={12} />Enviar</a>
        : <span style={{ fontSize: 11.5, color: "#9AA8B8", padding: "3px 4px" }}>sem tel.</span>}
      <button type="button" onClick={() => copiar(msg, avisar)} title="Copiar mensagem"><Copy size={12} />Copiar</button>
      {onMarcar && <button type="button" onClick={onMarcar} title="Marcar como Enviado" style={{ color: "#1E8E5F" }}><CheckCircle2 size={12} />Enviado</button>}
    </>
  );
}

function BarraBusca({ value, onChange, placeholder, children }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-300)" }} />
        <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={inputCls} style={{ ...inputStyle, paddingLeft: "2rem" }} />
      </div>
      {children}
    </div>
  );
}
function Filtro({ value, onChange, opcoes, vazio }) {
  return (
    <select className="border rounded-lg px-3 py-2 text-sm" style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{vazio}</option>
      {opcoes.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

// ===========================================================================
// GRADE ESTILO EXCEL — células editáveis, linha nova no fim, cabeçalho fixo
// ===========================================================================
const GRID_CSS = `
.xg-wrap{overflow:auto;max-height:70vh;border:1px solid #C9D2DE;border-radius:10px;background:#fff}
.xg{border-collapse:separate;border-spacing:0;font-size:13px;min-width:100%;font-variant-numeric:tabular-nums}
.xg th{position:sticky;top:0;z-index:3;background:#1F4E78;color:#fff;font-weight:700;font-size:12px;text-align:center;padding:8px 8px;border-right:1px solid #2E6395;white-space:nowrap}
.xg td{border-right:1px solid #DDE3EB;border-bottom:1px solid #DDE3EB;padding:0;background:#fff;height:34px;vertical-align:middle}
.xg tr:hover td{background:#F5F9FF}
.xg td.xg-n,.xg th.xg-n{position:sticky;left:0;z-index:2;width:44px;min-width:44px;text-align:center;background:#EEF2F7;color:#5B6B7C;font-weight:600;font-size:12px}
.xg th.xg-n{z-index:4;background:#173D5E;color:#fff}
.xg td.xg-nome,.xg th.xg-nome{position:sticky;left:44px;z-index:2;box-shadow:1px 0 0 #C9D2DE}
.xg th.xg-nome{z-index:4;background:#1F4E78}
.xg input,.xg select{width:100%;height:34px;border:0;background:transparent;padding:0 8px;font:inherit;color:#0D1B2A;outline:none;border-radius:0}
.xg select{cursor:pointer;font-weight:600;appearance:none;-webkit-appearance:none;padding-right:18px;background-image:linear-gradient(45deg,transparent 50%,#8A99AB 50%),linear-gradient(135deg,#8A99AB 50%,transparent 50%);background-position:calc(100% - 10px) 15px,calc(100% - 6px) 15px;background-size:4px 4px;background-repeat:no-repeat}
.xg input:focus,.xg select:focus{box-shadow:inset 0 0 0 2px #217346;background-color:#fff}
.xg tr.xg-new td{background:#FAFCF7}
.xg tr.xg-new input::placeholder{color:#9AA8B8;font-style:italic}
.xg tr.xg-total td{background:#FFF2CC;font-weight:700;padding:0 8px;border-top:2px solid #E0C36A}
.xg .xg-act{display:flex;gap:4px;padding:0 6px;white-space:nowrap}
.xg .xg-act a,.xg .xg-act button{display:inline-flex;align-items:center;gap:4px;border:1px solid #DDE3EB;background:#fff;border-radius:6px;padding:3px 7px;font-size:11.5px;font-weight:600;cursor:pointer;color:#0D1B2A;text-decoration:none}
.xg .xg-act a.wa{background:#1F9D55;border-color:#1F9D55;color:#fff}
.xg .xg-act button.del{color:#B3402C}
.xg .xg-act button.del.armed{background:#E4572E;border-color:#E4572E;color:#fff}
.xg .xg-ro{padding:0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px}
`;

function CelulaTexto({ value, onCommit, type = "text", placeholder, format, inputMode, list }) {
  const [v, setV] = useState(value ?? "");
  const foco = useRef(false);
  React.useEffect(() => { if (!foco.current) setV(value ?? ""); }, [value]);
  function commit() {
    foco.current = false;
    let nv = format ? format(v) : v;
    if (type === "number") nv = nv === "" ? 0 : Math.max(0, Number(nv) || 0);
    if (String(nv) !== String(value ?? "")) onCommit(nv);
    setV(nv);
  }
  return (
    <input type={type === "number" ? "number" : type} min={type === "number" ? 0 : undefined} inputMode={inputMode} list={list}
      value={v} placeholder={placeholder} onFocus={() => { foco.current = true; }}
      onChange={(e) => setV(e.target.value)} onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { setV(value ?? ""); foco.current = false; e.currentTarget.blur(); } }} />
  );
}
function CelulaLista({ value, opcoes, onCommit, tipo }) {
  const t = value ? TONS[tomDe(value, tipo)] : null;
  return (
    <select value={value || ""} onChange={(e) => onCommit(e.target.value)}
      style={t ? { background: t.bg, color: t.fg } : { color: "#9AA8B8" }}>
      <option value=""></option>
      {opcoes.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}
function BotaoExcluirMini({ onConfirm }) {
  const [armado, setArmado] = useState(false);
  React.useEffect(() => { if (!armado) return; const t = setTimeout(() => setArmado(false), 3500); return () => clearTimeout(t); }, [armado]);
  return (
    <button type="button" className={`del${armado ? " armed" : ""}`} onClick={() => (armado ? onConfirm() : setArmado(true))} title="Excluir linha">
      <Trash2 size={12} />{armado ? "Confirmar" : ""}
    </button>
  );
}

// columns: [{key,label,width,type:'text'|'number'|'tel'|'cpf'|'select',opcoes,tipo,get,set,placeholder}]
function Grade({ columns, rows, onUpdate, onInsert, onDelete, acoes, total, novaLinha = true, numeroBase = 0 }) {
  const [nova, setNova] = useState({});
  const [chaveNova, setChaveNova] = useState(0);
  const getV = (c, r) => (c.get ? c.get(r) : r[c.key]);
  async function commitNova(patch) {
    const rec = { ...nova, ...patch };
    setNova(rec);
    if (!(rec.nome || "").trim()) return;
    const ok = await onInsert(rec);
    if (ok !== false) { setNova({}); setChaveNova((k) => k + 1); }
  }
  function celula(c, r, commit) {
    const v = getV(c, r);
    if (c.type === "select") return <CelulaLista value={v} opcoes={c.opcoes} tipo={c.tipo} onCommit={commit} />;
    if (c.type === "tel") return <CelulaTexto value={v} type="tel" inputMode="tel" format={fmtTel} onCommit={commit} placeholder={c.placeholder} />;
    if (c.type === "cpf") return <CelulaTexto value={v} inputMode="numeric" format={fmtCpf} onCommit={commit} placeholder={c.placeholder} />;
    if (c.type === "number") return <CelulaTexto value={v} type="number" inputMode="numeric" onCommit={commit} />;
    return <CelulaTexto value={v} onCommit={commit} placeholder={c.placeholder} list={c.list} />;
  }
  return (
    <>
      <style>{GRID_CSS}</style>
      <div className="xg-wrap cc-scroll">
        <table className="xg">
          <thead>
            <tr>
              <th className="xg-n">Nº</th>
              {columns.map((c, i) => <th key={c.key} className={i === 0 ? "xg-nome" : ""} style={{ minWidth: c.width }}>{c.label}</th>)}
              {acoes && <th style={{ minWidth: 190 }}>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id}>
                <td className="xg-n">{numeroBase + idx + 1}</td>
                {columns.map((c, i) => (
                  <td key={c.key} className={i === 0 ? "xg-nome" : ""} style={{ minWidth: c.width }}>
                    {c.readOnly ? <div className="xg-ro" title={String(getV(c, r) ?? "")}>{getV(c, r)}</div>
                      : celula({ ...c, placeholder: undefined }, r, (v) => onUpdate(r, c.set ? c.set(v, r) : { [c.key]: v }))}
                  </td>
                ))}
                {acoes && <td><div className="xg-act">{acoes(r)}{onDelete && <BotaoExcluirMini onConfirm={() => onDelete(r)} />}</div></td>}
              </tr>
            ))}
            {novaLinha && onInsert && (
              <tr className="xg-new" key={"nova" + chaveNova}>
                <td className="xg-n"><Plus size={13} style={{ display: "inline" }} /></td>
                {columns.map((c, i) => (
                  <td key={c.key} className={i === 0 ? "xg-nome" : ""} style={{ minWidth: c.width }}>
                    {c.readOnly ? null : celula({ ...c, placeholder: i === 0 ? "Digite um nome para cadastrar…" : c.placeholder }, nova,
                      (v) => { const p = c.set ? c.set(v, nova) : { [c.key]: v }; if (i === 0) commitNova(p); else setNova((n) => ({ ...n, ...p })); })}
                  </td>
                ))}
                {acoes && <td />}
              </tr>
            )}
            {total && (
              <tr className="xg-total">
                <td className="xg-n" style={{ background: "#FFF2CC" }}>Σ</td>
                <td colSpan={columns.length + (acoes ? 1 : 0)} style={{ height: 34 }}>{total}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------- estatísticas ----------
export function statsLid(rows) {
  const c = (v) => rows.filter((r) => r.nivel === v).length;
  return {
    total: rows.length, meta: rows.reduce((s, r) => s + (Number(r.metaVotos) || 0), 0),
    ativas: rows.filter((r) => r.status === "Ativo").length, inativas: rows.filter((r) => r.status === "Inativo").length,
    pausadas: rows.filter((r) => r.status === "Pausado").length,
    cabo: c("Cabo Eleitoral"), lid: c("Liderança"), apoio: c("Apoiador"), semcat: rows.filter((r) => !NIVEL_LID.includes(r.nivel)).length,
  };
}
export function statsEle(rows) {
  return {
    total: rows.length, enviado: rows.filter((r) => r.contatoStatus === "Enviado").length,
    conf: rows.filter((r) => r.status === "Confirmado").length, pend: rows.filter((r) => r.status === "Pendente").length,
    ind: rows.filter((r) => r.status === "Indeciso").length,
    semcat: rows.filter((r) => !r.categoria || r.categoria === "Sem categoria").length,
  };
}

// ===========================================================================
// LIDERANÇAS
// ===========================================================================
export function LiderancasPlanilhaView({ table, msgKV, onImportar }) {
  const rows = table.items;
  const [q, setQ] = useState(""); const [fNivel, setFNivel] = useState(""); const [fStatus, setFStatus] = useState("");
  const [avisar, toastEl] = useToast();
  const s = statsLid(rows);
  const lista = useMemo(() => rows.filter((r) => {
    if (q && !norm([r.nome, r.telefone, r.responsavel, r.observacoes].join(" ")).includes(norm(q))) return false;
    if (fNivel && r.nivel !== fNivel) return false;
    if (fStatus && r.status !== fStatus) return false;
    return true;
  }).sort((a, b) => a.id - b.id), [rows, q, fNivel, fStatus]);


  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="cc-display text-xl font-bold">Lideranças</h2>
          <p className="text-sm" style={{ color: "var(--ink-500)" }}>Gestão de lideranças, metas de voto e status de contato</p>
        </div>
        <div className="flex gap-2">
          {onImportar && <button onClick={onImportar} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}><Upload size={15} /> Importar planilha</button>}
          <button onClick={focarNovaLinha}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>
            <Plus size={16} /> Nova liderança
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Kpi label="Lideranças cadastradas" value={s.total} lead />
        <Kpi label="Meta total de votos" value={s.meta.toLocaleString("pt-BR")} tone="gold" />
        <Kpi label="Ativas" value={s.ativas} tone="ok" />
        <Kpi label="Inativas / Pausadas" value={`${s.inativas} / ${s.pausadas}`} />
        <Kpi label="Cabo eleitoral" value={s.cabo} />
        <Kpi label="Liderança" value={s.lid} />
        <Kpi label="Apoiador" value={s.apoio} />
        <Kpi label="Sem categoria" value={s.semcat} />
      </div>

      <PainelMensagem chave="liderancas" rotulo="das lideranças" msgKV={msgKV} avisar={avisar} />

      <BarraBusca value={q} onChange={setQ} placeholder="Buscar por nome, telefone, responsável…">
        <Filtro value={fNivel} onChange={setFNivel} opcoes={NIVEL_LID} vazio="Todos os níveis" />
        <Filtro value={fStatus} onChange={setFStatus} opcoes={STATUS_LID} vazio="Todos os status" />
      </BarraBusca>
      <p className="text-xs tabular-nums" style={{ color: "var(--ink-500)" }}>{lista.length} de {rows.length} lideranças</p>

      <Grade
        columns={[
          { key: "nome", label: "Nome", width: 200 },
          { key: "nivel", label: "Nível", width: 140, type: "select", opcoes: NIVEL_LID },
          { key: "metaVotos", label: "Meta Votos", width: 100, type: "number" },
          { key: "status", label: "Status", width: 110, type: "select", opcoes: STATUS_LID },
          { key: "telefone", label: "WhatsApp", width: 150, type: "tel", placeholder: "(44) 99999-1234" },
          { key: "responsavel", label: "Responsável por", width: 160 },
          { key: "observacoes", label: "Observações", width: 260 },
        ]}
        rows={lista}
        onUpdate={(r, patch) => table.update(r.id, patch)}
        onInsert={async (rec) => { const res = await table.insert({ nome: rec.nome.trim(), nivel: rec.nivel || "", metaVotos: Number(rec.metaVotos) || 0, status: rec.status || "Ativo", telefone: rec.telefone || "", responsavel: rec.responsavel || "", observacoes: rec.observacoes || "" }); if (res) avisar("Liderança cadastrada"); return !!res; }}
        onDelete={async (r) => { await table.remove(r.id); avisar("Liderança excluída"); }}
        acoes={(r) => <AcoesLinha tel={r.telefone} msg={montarMensagem(msgKV.data?.liderancas, r.nome)} avisar={avisar} />}
        total={`${lista.length} lideranças · Cabo: ${lista.filter((r) => r.nivel === "Cabo Eleitoral").length} · Lid: ${lista.filter((r) => r.nivel === "Liderança").length} · Apoio: ${lista.filter((r) => r.nivel === "Apoiador").length} · Meta: ${lista.reduce((t, r) => t + (Number(r.metaVotos) || 0), 0).toLocaleString("pt-BR")} votos`}
      />
      {toastEl}
    </div>
  );
}

// ===========================================================================
// ELEITORES (geral / Adriano José / Paranhos)
// ===========================================================================
export function EleitoresPlanilhaView({ tables, liderancas, msgKV, onImportar }) {
  const [lista, setLista] = useState("eleitores");
  const def = LISTAS_ELEITORES[lista];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 overflow-x-auto cc-scroll pb-1" role="tablist">
        {Object.values(LISTAS_ELEITORES).map((l) => (
          <button key={l.key} role="tab" aria-selected={lista === l.key} onClick={() => setLista(l.key)}
            className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
            style={{ background: lista === l.key ? "var(--blue-600)" : "var(--border)", color: lista === l.key ? "#fff" : "var(--ink-500)" }}>
            {l.tab} <span className="opacity-75 tabular-nums">· {tables[l.key].items.length}</span>
          </button>
        ))}
      </div>
      <ListaEleitores key={lista} def={def} table={tables[lista]} liderancas={liderancas} msgKV={msgKV} onImportar={onImportar} />
    </div>
  );
}

function ListaEleitores({ def, table, liderancas, msgKV, onImportar }) {
  const rows = table.items;
  const [q, setQ] = useState(""); const [fNivel, setFNivel] = useState(""); const [fCat, setFCat] = useState(""); const [fCont, setFCont] = useState("");
  const [avisar, toastEl] = useToast();
  const [lote, setLote] = useState(false);
  const [envio, setEnvio] = useState(false);
  const s = statsEle(rows);
  const lista = useMemo(() => rows.filter((r) => {
    if (q && !norm([r.nome, r.telefone, r.cpf, r.lideranca, r.observacoes].join(" ")).includes(norm(q))) return false;
    if (fNivel && r.status !== fNivel) return false;
    if (fCat && (r.categoria || "Sem categoria") !== fCat) return false;
    if (fCont && r.contatoStatus !== fCont) return false;
    return true;
  }).sort((a, b) => a.id - b.id), [rows, q, fNivel, fCat, fCont]);

  const porCargo = def.cargos ? CARGOS_PLAN.map(([k, label]) => {
    const c = rows.filter((r) => r.cargos?.[k] === "Confirmado").length;
    const p = rows.filter((r) => r.cargos?.[k] === "Pendente").length;
    const i = rows.filter((r) => r.cargos?.[k] === "Indeciso").length;
    return { k, label, c, p, i };
  }) : null;

  async function marcar(r) { await table.update(r.id, { contatoStatus: "Enviado" }); avisar("Marcado como Enviado"); }

  const tot = Math.max(rows.length, 1);
  return (
    <>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="cc-display text-xl font-bold">{def.title}</h2>
          <p className="text-sm" style={{ color: "var(--ink-500)" }}>{def.sub}</p>
        </div>
        <div className="flex gap-2">
          {onImportar && <button onClick={onImportar} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border whitespace-nowrap" style={{ borderColor: "var(--border)", background: "var(--surface)" }}><Upload size={15} /> Importar<span className="hidden sm:inline"> planilha</span></button>}
          <button onClick={() => setLote(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border whitespace-nowrap" style={{ borderColor: "var(--blue-600)", color: "var(--blue-600)", background: "var(--surface)" }}>
            <Users size={15} /> Vários<span className="hidden sm:inline"> eleitores</span>
          </button>
          <button onClick={focarNovaLinha}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white whitespace-nowrap" style={{ background: "var(--blue-600)" }}>
            <Plus size={16} /> Novo<span className="hidden sm:inline"> eleitor</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <Kpi label="Eleitores cadastrados" value={s.total} lead />
        <Kpi label="Mensagem enviada" value={s.enviado} tone="gold" />
        <Kpi label="Voto confirmado" value={s.conf} tone="ok" />
        <Kpi label="Voto pendente" value={s.pend} tone="warn" />
        <Kpi label="Indecisos" value={s.ind} tone="bad" />
        <Kpi label="Sem categoria" value={s.semcat} />
      </div>

      {porCargo && (
        <div className="cc-card p-4 flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h3 className="cc-display font-semibold text-sm">Intenção de voto por cargo</h3>
            <div className="flex gap-3 text-[11px]" style={{ color: "var(--ink-500)" }}>
              <span><i className="inline-block w-2.5 h-2.5 rounded-sm mr-1 align-[-1px]" style={{ background: "#2AA876" }} />Confirmado</span>
              <span><i className="inline-block w-2.5 h-2.5 rounded-sm mr-1 align-[-1px]" style={{ background: "#F0A202" }} />Pendente</span>
              <span><i className="inline-block w-2.5 h-2.5 rounded-sm mr-1 align-[-1px]" style={{ background: "#E4572E" }} />Indeciso</span>
            </div>
          </div>
          {porCargo.map((c) => (
            <div key={c.k} className="grid items-center gap-2" style={{ gridTemplateColumns: "96px 1fr auto" }}>
              <span className="text-xs font-semibold">{c.label}</span>
              <div className="flex h-3 rounded overflow-hidden" style={{ background: "var(--border)" }} role="img" aria-label={`${c.label}: ${c.c} confirmados, ${c.p} pendentes, ${c.i} indecisos`}>
                <span style={{ width: `${(c.c / tot) * 100}%`, background: "#2AA876" }} />
                <span style={{ width: `${(c.p / tot) * 100}%`, background: "#F0A202" }} />
                <span style={{ width: `${(c.i / tot) * 100}%`, background: "#E4572E" }} />
              </div>
              <span className="text-[11px] tabular-nums" style={{ color: "var(--ink-500)" }}>{c.c}/{c.p}/{c.i}</span>
            </div>
          ))}
        </div>
      )}

      <PainelMensagem chave={def.key} rotulo="desta lista" msgKV={msgKV} avisar={avisar} />
      <button onClick={() => setEnvio(true)} className="flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white" style={{ background: "#1F9D55" }}>
        <Send size={16} /> Enviar mensagens no WhatsApp
      </button>

      <BarraBusca value={q} onChange={setQ} placeholder="Buscar por nome, telefone, CPF…">
        <Filtro value={fNivel} onChange={setFNivel} opcoes={NIVEL_VOTO} vazio="Nível de votação" />
        <Filtro value={fCat} onChange={setFCat} opcoes={CATEGORIAS_ELE} vazio="Categoria" />
        <Filtro value={fCont} onChange={setFCont} opcoes={STATUS_CONTATO} vazio="Status do contato" />
      </BarraBusca>
      <p className="text-xs tabular-nums" style={{ color: "var(--ink-500)" }}>{lista.length} de {rows.length} eleitores</p>

      <Grade
        columns={[
          { key: "nome", label: "Nome Completo", width: 210 },
          { key: "cpf", label: "CPF", width: 130, type: "cpf", placeholder: "000.000.000-00" },
          { key: "telefone", label: "Telefone/WhatsApp", width: 150, type: "tel", placeholder: "(44) 99999-0000" },
          { key: "genero", label: "Gênero", width: 115, type: "select", opcoes: GENERO },
          { key: "status", label: "Nível de Votação", width: 125, type: "select", opcoes: NIVEL_VOTO },
          { key: "categoria", label: "Categoria", width: 160, type: "select", opcoes: CATEGORIAS_ELE,
            get: (r) => r.categoria || (r.id ? "Sem categoria" : ""), set: (v) => ({ categoria: v === "Sem categoria" ? "" : v }) },
          ...(def.cargos ? CARGOS_PLAN.map(([k, label]) => ({ key: "cargo_" + k, label, width: 120, type: "select", opcoes: NIVEL_VOTO,
            get: (r) => r.cargos?.[k] || "", set: (v, r) => ({ cargos: { ...(r.cargos || {}), [k]: v } }) })) : []),
          { key: "contatoStatus", label: "Status", width: 110, type: "select", opcoes: STATUS_CONTATO, tipo: "contato" },
          { key: "lideranca", label: "Indicado por", width: 160, list: "dl-lid-grade" },
          { key: "observacoes", label: "Observações", width: 240 },
        ]}
        rows={lista}
        onUpdate={(r, patch) => table.update(r.id, patch)}
        onInsert={async (rec) => {
          const dados = { nome: rec.nome.trim(), cpf: rec.cpf || "", telefone: rec.telefone || "", genero: rec.genero || "", status: rec.status || "",
            categoria: rec.categoria || "", contatoStatus: rec.contatoStatus || "", lideranca: rec.lideranca || "", observacoes: rec.observacoes || "" };
          if (def.cargos) dados.cargos = rec.cargos || {};
          const res = await table.insert(dados); if (res) avisar("Eleitor cadastrado"); return !!res; }}
        onDelete={async (r) => { await table.remove(r.id); avisar("Eleitor excluído"); }}
        acoes={(r) => <AcoesLinha tel={r.telefone} msg={montarMensagem(msgKV.data?.[def.key], r.nome)} avisar={avisar}
          onMarcar={r.contatoStatus !== "Enviado" ? () => marcar(r) : null} />}
        total={`${lista.length} eleitores · Confirm: ${lista.filter((r) => r.status === "Confirmado").length} · Pend: ${lista.filter((r) => r.status === "Pendente").length} · Indec: ${lista.filter((r) => r.status === "Indeciso").length} · Enviado: ${lista.filter((r) => r.contatoStatus === "Enviado").length}`}
      />
      <datalist id="dl-lid-grade">{liderancas.map((l) => <option key={l.id} value={l.nome} />)}</datalist>
      {envio && <EnvioWhatsApp titulo={def.tab} pessoas={lista} cfg={msgKV.data?.[def.key]}
        onMarcar={(r) => table.update(r.id, { contatoStatus: "Enviado" })} onClose={() => setEnvio(false)} avisar={avisar} />}
      {lote && <CadastroLote def={def} table={table} liderancas={liderancas}
        onClose={(m) => { setLote(false); if (m) avisar(m); }} />}
      {toastEl}
    </>
  );
}

// ===========================================================================
// ENVIO NO WHATSAPP — um por um (abre a conversa pronta, marca Enviado, próximo)
// ===========================================================================
export function EnvioWhatsApp({ titulo, pessoas, cfg, onMarcar, onClose, avisar }) {
  const [soPendentes, setSoPendentes] = useState(true);
  const [pos, setPos] = useState(0);
  const [feitos, setFeitos] = useState(0);
  const comTel = pessoas.filter((r) => waNumber(r.telefone));
  const semTel = pessoas.length - comTel.length;
  const fila = useMemo(() => comTel.filter((r) => !soPendentes || r.contatoStatus !== "Enviado"),
    // fila fixa enquanto a janela está aberta (não "pula" ao marcar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [soPendentes, pessoas.length]);
  const atual = fila[pos];
  const msg = atual ? montarMensagem(cfg, atual.nome) : "";
  const msgGeral = montarMensagem(cfg, "").replace(/Olá\s*!/, "Olá!").replace(/\s+!/, "!");
  const semMensagem = !cfg?.mensagem;

  async function abrir() {
    window.open(waLink(atual.telefone, msg), "_blank", "noopener");
    if (atual.contatoStatus !== "Enviado") await onMarcar(atual);
    setFeitos((f) => f + 1);
    setPos((p) => p + 1);
  }

  return (
    <Folha title={`Enviar mensagens — ${titulo}`} onClose={onClose}>
      <div className="flex flex-col gap-4 text-sm">
        {semMensagem && <p className="font-semibold" style={{ color: "var(--red-500)" }}>Escreva e salve a “Mensagem do WhatsApp desta lista” antes de enviar.</p>}

        <div className="rounded-lg border p-3 flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
          <p className="font-semibold">Uma pessoa por vez</p>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={soPendentes} onChange={(e) => { setSoPendentes(e.target.checked); setPos(0); }} /> Só quem ainda não recebeu</label>
          {atual ? (
            <>
              <p className="text-xs tabular-nums" style={{ color: "var(--ink-500)" }}>{pos + 1} de {fila.length}{feitos ? ` · ${feitos} enviados agora` : ""}</p>
              <div className="flex items-center justify-between gap-2">
                <div><p className="font-bold text-base">{atual.nome}</p><p className="text-xs" style={{ color: "var(--ink-500)" }}>{fmtTel(atual.telefone)}</p></div>
                <button onClick={() => setPos((p) => p + 1)} className="text-xs underline" style={{ color: "var(--ink-500)" }}>Pular</button>
              </div>
              <div className="text-xs whitespace-pre-wrap rounded-lg border p-2 max-h-32 overflow-auto cc-scroll" style={{ borderColor: "var(--border)", background: "var(--paper)" }}>{msg}</div>
              <button onClick={abrir} disabled={semMensagem} className="flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white disabled:opacity-50" style={{ background: "#1F9D55" }}>
                <Send size={16} /> Abrir WhatsApp de {atual.nome.split(" ")[0]}
              </button>
              <p className="text-[11px]" style={{ color: "var(--ink-500)" }}>No WhatsApp, toque em enviar ➤ e volte aqui para o próximo. A pessoa já fica marcada como “Enviado”.</p>
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--ink-500)" }}>
              {fila.length ? `Pronto! ${feitos} mensagens abertas.` : "Ninguém com telefone para enviar nesta lista."}
            </p>
          )}
          {!!semTel && <p className="text-xs" style={{ color: "var(--ink-500)" }}>{semTel} {semTel === 1 ? "pessoa está" : "pessoas estão"} sem telefone e {semTel === 1 ? "fica" : "ficam"} de fora.</p>}
        </div>

        <div className="rounded-lg border p-3 flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
          <p className="font-semibold">Mandar em um grupo ou para vários de uma vez</p>
          <p className="text-xs" style={{ color: "var(--ink-500)" }}>Abre o WhatsApp para você escolher o grupo (ou vários contatos) e enviar a mensagem sem o nome da pessoa.</p>
          <div className="flex gap-2 flex-wrap">
            <a href={`https://wa.me/?text=${encodeURIComponent(msgGeral)}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-white whitespace-nowrap" style={{ background: "#1F9D55" }}><Send size={15} /> Escolher grupo</a>
            <button onClick={() => copiar(msgGeral, avisar)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold border whitespace-nowrap" style={{ borderColor: "var(--border)" }}><Copy size={15} /> Copiar mensagem</button>
          </div>
        </div>
      </div>
    </Folha>
  );
}

// ===========================================================================
// CADASTRO EM LOTE — cola/digita até 200 eleitores de uma vez
// ===========================================================================
export const MAX_LOTE = 200;
function parseLinhaLote(linha) {
  let partes = linha.split(/\t|;/).map((p) => p.trim()).filter(Boolean);
  if (partes.length === 1) {
    // "Maria Silva 44 99999-0000" → separa o número do fim
    const m = partes[0].match(/^(.*?)[\s,\-–]*([\d()\s.\-+]{8,})$/);
    if (m && digits(m[2]).length >= 8) partes = [m[1].trim(), m[2].trim()];
    else if (partes[0].includes(",")) partes = partes[0].split(",").map((p) => p.trim()).filter(Boolean);
  }
  const nome = (partes.shift() || "").replace(/\s+/g, " ");
  let telefone = "", cpf = "";
  for (const p of partes) {
    const d = digits(p);
    if (!d) continue;
    if (/[.\-]\d{2}$/.test(p) && /\d{3}\.\d{3}\.\d{3}/.test(p)) { cpf = cpf || d; continue; }
    if (!telefone) telefone = d; else if (!cpf) cpf = d;
  }
  return { nome, telefone: telefone ? fmtTel(telefone) : "", cpf: cpf ? fmtCpf(cpf) : "" };
}

function CadastroLote({ def, table, liderancas, onClose }) {
  const [texto, setTexto] = useState("");
  const [status, setStatus] = useState("");
  const [categoria, setCategoria] = useState("");
  const [genero, setGenero] = useState("");
  const [lideranca, setLideranca] = useState("");
  const [contatoStatus, setContatoStatus] = useState("");
  const [cargoEstadual, setCargoEstadual] = useState(true);
  const [progresso, setProgresso] = useState(null);
  const [erro, setErro] = useState("");

  const analise = useMemo(() => {
    const linhas = texto.split(/\r?\n/).map((l, i) => [l.trim(), i + 1]).filter(([l]) => l);
    const ja = new Set(table.items.map((r) => norm(r.nome) + "|" + digits(r.telefone)));
    const novos = [], dup = [], invalidos = [];
    linhas.forEach(([l, n]) => {
      const r = parseLinhaLote(l);
      if (!r.nome || r.nome.length < 2 || /^[\d\s().\-+]+$/.test(r.nome)) { invalidos.push(n); return; }
      const sig = norm(r.nome) + "|" + digits(r.telefone);
      if (ja.has(sig)) { dup.push(r); return; }
      ja.add(sig); novos.push(r);
    });
    return { total: linhas.length, novos, dup, invalidos };
  }, [texto, table.items]);

  const excede = analise.novos.length > MAX_LOTE;

  async function salvar() {
    setErro("");
    const recs = analise.novos.map((r) => {
      const dados = { nome: r.nome, cpf: r.cpf, telefone: r.telefone, genero, status, categoria: categoria === "Sem categoria" ? "" : categoria,
        contatoStatus, lideranca: lideranca.trim(), observacoes: "" };
      if (def.cargos) dados.cargos = cargoEstadual && status ? { estadual: status } : {};
      return dados;
    });
    let ok = 0;
    setProgresso({ ok, total: recs.length });
    for (let i = 0; i < recs.length; i += 50) {
      const parte = recs.slice(i, i + 50);
      const res = table.insertMany ? await table.insertMany(parte) : await Promise.all(parte.map((r) => table.insert(r)));
      if (!res || (Array.isArray(res) && res.some((x) => !x))) {
        setErro(`${ok} cadastrados, mas houve erro no restante. Tente de novo: quem já entrou será ignorado.`);
        setProgresso(null); return;
      }
      ok += parte.length; setProgresso({ ok, total: recs.length });
    }
    onClose(`${ok} eleitores cadastrados`);
  }

  return (
    <Folha title={`Cadastrar vários eleitores — ${def.tab}`} onClose={() => !progresso && onClose()}>
      <div className="flex flex-col gap-4 text-sm">
        <p style={{ color: "var(--ink-500)" }}>
          Um eleitor por linha, até <b>{MAX_LOTE}</b> de uma vez. Formato: <b>Nome; Telefone; CPF</b> (telefone e CPF são opcionais).
          Também dá para colar colunas copiadas do Excel.
        </p>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={9} autoFocus
          className={inputCls + " font-mono text-[13px] leading-6"} style={inputStyle}
          placeholder={"Maria da Silva; (44) 99999-0000; 000.000.000-00\nJoão Pereira; 44988887777\nAna Souza"} />
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums">
          <span className="font-semibold" style={{ color: excede ? "var(--red-500)" : "var(--blue-600)" }}>{analise.novos.length}/{MAX_LOTE} novos</span>
          {!!analise.dup.length && <span style={{ color: "var(--ink-500)" }}>{analise.dup.length} já cadastrados (serão ignorados)</span>}
          {!!analise.invalidos.length && <span style={{ color: "var(--ink-500)" }}>Linhas sem nome ignoradas: {analise.invalidos.slice(0, 8).join(", ")}{analise.invalidos.length > 8 ? "…" : ""}</span>}
        </div>

        <div>
          <p className="font-semibold text-xs mb-2">Aplicar a todos (opcional)</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Campo label="Nível de votação"><Sel value={status} onChange={setStatus} opcoes={NIVEL_VOTO} /></Campo>
            <Campo label="Categoria"><Sel value={categoria} onChange={setCategoria} opcoes={CATEGORIAS_ELE} /></Campo>
            <Campo label="Gênero"><Sel value={genero} onChange={setGenero} opcoes={GENERO} /></Campo>
            <Campo label="Status do contato"><Sel value={contatoStatus} onChange={setContatoStatus} opcoes={STATUS_CONTATO} /></Campo>
            <Campo label="Indicado por" full>
              <input className={inputCls} style={inputStyle} value={lideranca} onChange={(e) => setLideranca(e.target.value)} list="dl-lid-lote" placeholder="Nome da liderança" />
              <datalist id="dl-lid-lote">{liderancas.map((l) => <option key={l.id} value={l.nome} />)}</datalist>
            </Campo>
          </div>
          {def.cargos && status && (
            <label className="flex items-center gap-2 mt-3 text-xs"><input type="checkbox" checked={cargoEstadual} onChange={(e) => setCargoEstadual(e.target.checked)} /> Usar o mesmo nível para Dep. Estadual</label>
          )}
        </div>

        {!!analise.novos.length && (
          <div className="border rounded-lg max-h-48 overflow-y-auto cc-scroll" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-xs tabular-nums">
              <thead className="sticky top-0" style={{ background: "var(--surface)" }}><tr style={{ color: "var(--ink-500)" }}><th className="text-left px-2 py-1.5">Nº</th><th className="text-left">Nome</th><th className="text-left">Telefone</th><th className="text-left">CPF</th></tr></thead>
              <tbody>{analise.novos.slice(0, MAX_LOTE).map((r, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}><td className="px-2 py-1">{i + 1}</td><td>{r.nome}</td><td>{r.telefone}</td><td>{r.cpf}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {excede && <p className="text-sm font-semibold" style={{ color: "var(--red-500)" }}>Máximo de {MAX_LOTE} por vez. Remova {analise.novos.length - MAX_LOTE} linha(s).</p>}
        {erro && <p className="text-sm font-semibold" style={{ color: "var(--red-500)" }}>{erro}</p>}
        <button onClick={salvar} disabled={!!progresso || excede || !analise.novos.length}
          className="py-3 rounded-lg font-semibold text-white disabled:opacity-60" style={{ background: "var(--blue-600)" }}>
          {progresso ? `Cadastrando… ${progresso.ok}/${progresso.total}` : `Cadastrar ${analise.novos.length} eleitor${analise.novos.length === 1 ? "" : "es"}`}
        </button>
      </div>
    </Folha>
  );
}

// ===========================================================================
// MENSAGENS — lista única (Lideranças + Eleitores + Adriano + Paranhos)
// ===========================================================================
export function MensagensPlanilhaView({ liderancasTable, tables, msgKV, onExportar }) {
  const [origem, setOrigem] = useState(""); const [sit, setSit] = useState(""); const [q, setQ] = useState(""); const [soPend, setSoPend] = useState(false);
  const [avisar, toastEl] = useToast();
  const todos = useMemo(() => {
    const out = liderancasTable.items.map((r) => ({ uid: "l" + r.id, r, nome: r.nome, tel: r.telefone, origem: "Liderança", situacao: r.status || "", lid: true }));
    Object.values(LISTAS_ELEITORES).forEach((d) => tables[d.key].items.forEach((r) =>
      out.push({ uid: d.key + r.id, r, key: d.key, nome: r.nome, tel: r.telefone, origem: d.origem, situacao: r.status || "", contato: r.contatoStatus })));
    return out;
  }, [liderancasTable.items, tables]);
  const lista = todos.filter((c) => (!origem || c.origem === origem) && (!sit || c.situacao === sit)
    && (!q || norm(c.nome + " " + c.tel).includes(norm(q))) && (!soPend || (!c.lid && c.contato !== "Enviado")));
  const comTel = lista.filter((c) => waNumber(c.tel)).length;
  const origens = ["Liderança", "Eleitor", "Adriano José", "Paranhos"];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="cc-display text-xl font-bold">Mensagens</h2>
          <p className="text-sm" style={{ color: "var(--ink-500)" }}>Uma mensagem só para Lideranças e Eleitores juntos. Filtre e envie, uma conversa de cada vez, pelo seu WhatsApp.</p>
        </div>
        {onExportar && <button onClick={onExportar} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}><Download size={15} /> Exportar planilha</button>}
      </div>
      <PainelMensagem chave="mensagens" rotulo="para todos" msgKV={msgKV} avisar={avisar} />
      <div className="flex gap-1.5 flex-wrap">
        {["", ...origens].map((o) => (
          <button key={o || "todos"} onClick={() => setOrigem(o)} aria-pressed={origem === o}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border"
            style={origem === o ? { background: "var(--blue-600)", color: "#fff", borderColor: "var(--blue-600)" } : { borderColor: "var(--border)", background: "var(--surface)" }}>
            {o || "Todos"}
          </button>
        ))}
      </div>
      <BarraBusca value={q} onChange={setQ} placeholder="Buscar nome ou telefone…">
        <Filtro value={sit} onChange={setSit} opcoes={[...NIVEL_VOTO, ...STATUS_LID]} vazio="Toda situação" />
        <button onClick={() => setSoPend(!soPend)} aria-pressed={soPend} className="px-3 py-2 rounded-lg text-sm font-semibold border"
          style={soPend ? { background: "var(--blue-600)", color: "#fff", borderColor: "var(--blue-600)" } : { borderColor: "var(--border)", background: "var(--surface)" }}>
          Só quem não recebeu
        </button>
      </BarraBusca>
      <p className="text-xs tabular-nums" style={{ color: "var(--ink-500)" }}>{lista.length} contatos · {comTel} com telefone</p>
      <Grade
        novaLinha={false}
        columns={[
          { key: "nome", label: "Nome", width: 200, readOnly: true },
          { key: "tel", label: "Telefone", width: 140, readOnly: true, get: (c) => fmtTel(c.tel) },
          { key: "origem", label: "Origem", width: 120, readOnly: true },
          { key: "situacao", label: "Situação", width: 110, readOnly: true },
          { key: "contato", label: "Status", width: 90, readOnly: true, get: (c) => (c.lid ? "—" : c.contato || "") },
          { key: "msg", label: "💬 Mensagem", width: 260, readOnly: true, get: (c) => montarMensagem(msgKV.data?.mensagens, c.nome) },
        ]}
        rows={lista.map((c) => ({ ...c, id: c.uid }))}
        acoes={(c) => <AcoesLinha tel={c.tel} msg={montarMensagem(msgKV.data?.mensagens, c.nome)} avisar={avisar}
          onMarcar={!c.lid && c.contato !== "Enviado" ? async () => { await tables[c.key].update(c.r.id, { contatoStatus: "Enviado" }); avisar("Marcado como Enviado"); } : null} />}
      />
      {toastEl}
    </div>
  );
}

// ===========================================================================
// IMPORTAR / EXPORTAR planilha .xlsx (mesmo modelo "lideranças_conecta_campanha")
// ===========================================================================
const MAP_LID = { "Nome": "nome", "Nível": "nivel", "Meta Votos": "metaVotos", "Status": "status", "WhatsApp": "telefone", "Responsável por": "responsavel", "Observações": "observacoes" };
const MAP_ELE = { "Nome Completo": "nome", "CPF": "cpf", "Telefone/WhatsApp": "telefone", "Gênero": "genero", "Nível de Votação": "status", "Categoria": "categoria", "Status": "contatoStatus", "Indicado por": "lideranca", "Observações": "observacoes" };
const MAP_CARGO = { "Dep. Estadual": "estadual", "Dep. Federal": "federal", "Senador": "senador", "Governador": "governador", "Presidente": "presidente" };

function lerAba(XLSX, ws, tipo) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true });
  const hi = rows.findIndex((r) => String(r[0]).trim() === "Nº" && (r.includes("Nome") || r.includes("Nome Completo")));
  let mensagem = "", link = "";
  for (let i = 0; i < Math.min(hi < 0 ? 20 : hi, 20); i++) {
    const a = String(rows[i]?.[0] ?? "");
    if (/Mensagem padrão|Compor mensagem/i.test(a)) mensagem = String(rows[i + 1]?.[0] ?? "").trim();
    if (/Link da foto/i.test(a)) link = String(rows[i + 1]?.[0] ?? "").trim();
  }
  if (hi < 0) return { recs: [], mensagem, link };
  const hdr = rows[hi].map((h) => String(h).trim()); const recs = [];
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i]; if (String(r[0]).trim().toUpperCase() === "TOTAL") break;
    const o = {}; const cargos = {};
    hdr.forEach((h, j) => {
      const v = String(r[j] ?? "").trim(); if (!v) return;
      if (tipo === "lid" && MAP_LID[h]) o[MAP_LID[h]] = v;
      if (tipo === "ele" && MAP_ELE[h]) o[MAP_ELE[h]] = v;
      if (tipo === "ele" && MAP_CARGO[h]) cargos[MAP_CARGO[h]] = v;
    });
    if (!o.nome) continue;
    if (tipo === "lid") o.metaVotos = Number(String(o.metaVotos || "0").replace(/\D/g, "")) || 0;
    if (tipo === "ele") { o.cargos = cargos; if (o.categoria === "Sem categoria") o.categoria = ""; if (o.cpf) o.cpf = fmtCpf(o.cpf); }
    if (o.telefone) o.telefone = fmtTel(o.telefone);
    recs.push(o);
  }
  return { recs, mensagem, link };
}

export function ImportarPlanilha({ liderancasTable, tables, msgKV, onClose }) {
  const [plano, setPlano] = useState(null);
  const [erro, setErro] = useState("");
  const [comExemplos, setComExemplos] = useState(false);
  const [comMsgs, setComMsgs] = useState(true);
  const [progresso, setProgresso] = useState(null);
  const inputRef = useRef(null);

  const destinos = [
    { key: "liderancas", aba: "Lideranças", tipo: "lid", table: liderancasTable, rotulo: "Lideranças" },
    ...Object.values(LISTAS_ELEITORES).map((d) => ({ key: d.key, aba: d.sheet, tipo: "ele", table: tables[d.key], rotulo: d.tab === "Cadastro geral" ? "Eleitores" : `Eleitores — ${d.tab}` })),
  ];

  async function ler(file) {
    setErro("");
    try {
      const XLSX = await carregarXLSX();
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const p = { nome: file.name, listas: [], msgs: {} };
      for (const d of destinos) {
        const ws = wb.Sheets[d.aba]; if (!ws) continue;
        const { recs, mensagem, link } = lerAba(XLSX, ws, d.tipo);
        const ja = new Set(d.table.items.map((r) => norm(r.nome) + "|" + digits(r.telefone)));
        const novos = [], dup = [];
        recs.forEach((r) => { const sig = norm(r.nome) + "|" + digits(r.telefone); (ja.has(sig) ? dup : novos).push(r); ja.add(sig); });
        p.listas.push({ ...d, novos, dup });
        if (mensagem) p.msgs[d.key] = { mensagem, link };
      }
      const wm = wb.Sheets["Mensagens"];
      if (wm) { const { mensagem, link } = lerAba(XLSX, wm, "lid"); if (mensagem) p.msgs.mensagens = { mensagem, link }; }
      if (!p.listas.length) setErro("Não encontrei as abas da planilha CONecta Campanha (Lideranças, Eleitores…) neste arquivo.");
      setPlano(p);
    } catch (e) {
      setErro("Não consegui ler esse arquivo. Envie a planilha no formato .xlsx.");
    }
  }

  async function importar() {
    const jobs = [];
    plano.listas.forEach((l) => l.novos.forEach((r) => { if (!comExemplos && isExemplo(r)) return; jobs.push([l.table, r]); }));
    let ok = 0, falha = 0;
    setProgresso({ ok, total: jobs.length });
    for (const [table, r] of jobs) {
      const res = await table.insert(r);
      if (res) ok++; else falha++;
      setProgresso({ ok, total: jobs.length });
    }
    if (comMsgs) for (const [k, v] of Object.entries(plano.msgs)) await msgKV.setValue(k, v);
    if (falha) { setErro(`${ok} importados e ${falha} com erro. Importe de novo: quem já entrou será ignorado.`); setProgresso(null); }
    else onClose(`${ok} cadastros importados`);
  }

  const temExemplos = plano?.listas.some((l) => l.novos.some(isExemplo));
  return (
    <Folha title="Importar planilha" onClose={() => onClose()}>
      <div className="flex flex-col gap-4 text-sm">
        {!plano && (
          <>
            <p style={{ color: "var(--ink-500)" }}>Escolha a planilha <b>lideranças_conecta_campanha.xlsx</b>. As abas Lideranças, Eleitores, Eleitores - Adriano José e Eleitores - Paranhos entram nas listas do app, e as mensagens de WhatsApp de cada aba também.</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && ler(e.target.files[0])} />
            <button onClick={() => inputRef.current?.click()} className="flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white" style={{ background: "var(--blue-600)" }}>
              <Upload size={16} /> Escolher arquivo .xlsx
            </button>
          </>
        )}
        {plano && (
          <>
            <p className="font-semibold">{plano.nome}</p>
            <p className="text-xs" style={{ color: "var(--ink-500)" }}>Cadastros com o mesmo nome e telefone de um já existente são ignorados.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm tabular-nums">
                <thead><tr className="text-[11px] uppercase" style={{ color: "var(--ink-500)" }}><th className="text-left py-1.5">Lista</th><th className="text-right">Novos</th><th className="text-right">Já existem</th></tr></thead>
                <tbody>{plano.listas.map((l) => (
                  <tr key={l.key} className="border-t" style={{ borderColor: "var(--border)" }}><td className="py-1.5">{l.rotulo}</td><td className="text-right">{l.novos.filter((r) => comExemplos || !isExemplo(r)).length}</td><td className="text-right">{l.dup.length}</td></tr>
                ))}</tbody>
              </table>
            </div>
            {temExemplos && <label className="flex items-center gap-2"><input type="checkbox" checked={comExemplos} onChange={(e) => setComExemplos(e.target.checked)} /> Importar também as linhas de exemplo (Maria Silva / João da Silva)</label>}
            {!!Object.keys(plano.msgs).length && <label className="flex items-center gap-2"><input type="checkbox" checked={comMsgs} onChange={(e) => setComMsgs(e.target.checked)} /> Usar as mensagens de WhatsApp da planilha</label>}
            <button onClick={importar} disabled={!!progresso} className="py-3 rounded-lg font-semibold text-white disabled:opacity-70" style={{ background: "var(--blue-600)" }}>
              {progresso ? `Importando… ${progresso.ok}/${progresso.total}` : "Importar"}
            </button>
          </>
        )}
        {erro && <p className="text-sm font-semibold" style={{ color: "var(--red-500)" }}>{erro}</p>}
      </div>
    </Folha>
  );
}

export async function exportarPlanilha({ liderancas, tables }) {
  const XLSX = await carregarXLSX();
  const wb = XLSX.utils.book_new();
  const L = liderancas.map((r, i) => ({ "Nº": i + 1, "Nome": r.nome, "Nível": r.nivel, "Meta Votos": Number(r.metaVotos) || 0, "Status": r.status, "WhatsApp": r.telefone, "Responsável por": r.responsavel, "Observações": r.observacoes }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(L.length ? L : [{ "Nº": "", "Nome": "" }]), "Lideranças");
  for (const d of Object.values(LISTAS_ELEITORES)) {
    const rows = tables[d.key].items.map((r, i) => {
      const o = { "Nº": i + 1, "Nome Completo": r.nome, "CPF": r.cpf, "Telefone/WhatsApp": r.telefone, "Gênero": r.genero, "Nível de Votação": r.status, "Categoria": r.categoria || "Sem categoria" };
      if (d.cargos) CARGOS_PLAN.forEach(([k, label]) => { o[label] = r.cargos?.[k] || ""; });
      Object.assign(o, { "Status": r.contatoStatus, "Indicado por": r.lideranca, "Observações": r.observacoes });
      return o;
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{ "Nº": "", "Nome Completo": "" }]), d.sheet);
  }
  const hoje = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `conecta-campanha-${hoje}.xlsx`);
}
