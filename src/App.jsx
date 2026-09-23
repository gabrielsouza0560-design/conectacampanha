import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Sidebar, Drawer, Header, BottomNav, AcoesRapidas, PainelAlertas, useAlertas, pedirAcao, useAcaoPendente, NAV_ITEMS } from "./Shell";
import { Sheet, ToastHost, ConfirmHost, LoadingScreen, toast, confirmar, IconBtn, Vazio, Skeleton } from "./ui";
import { useSupabaseTable, useSupabaseKV } from "./useSupabase";
import InstallPrompt from "./InstallPrompt";
import {
  LiderancasPlanilhaView, EleitoresPlanilhaView, MensagensPlanilhaView,
  ImportarPlanilha, exportarPlanilha,
} from "./PlanilhaViews";
import {
  LayoutDashboard, Users, Crown, MapPin,
  ClipboardList, Calendar as CalendarIcon, PartyPopper, Map,
  BarChart3, MessageCircle, CheckSquare, FileText, Printer,
  Bell, Settings, Search, Plus, X, Pencil, Trash2, Phone,
  ChevronRight, Clock, TrendingUp, Activity,
  Wallet, Package, Vote, ExternalLink,
  Send, Image, Video, Copy, Share2,
  Home, Instagram, UsersRound, ThumbsUp, ThumbsDown, Minus,
  Download, QrCode, UserCheck, Shield, Eye, Target, MessageSquare,
  Landmark, Globe, Star, ArrowLeft, Link2, ChevronDown, ChevronUp,
  Building2, Briefcase, DollarSign, GraduationCap, Heart
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, CartesianGrid
} from "recharts";

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const THEME = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

  .cc-root {
    --navy-950:#0A1929; --navy-900:#0F2540; --navy-800:#153357;
    --blue-600:#1B5FC4; --blue-500:#2E86D8; --teal-400:#38C6C8;
    --amber-500:#F0A202; --red-500:#E4572E; --green-500:#2AA876;
    --paper:#F3F6FB; --surface:#FFFFFF; --ink-900:#0D1B2A;
    --ink-500:#5B6B7C; --ink-300:#93A2B3; --border:#E3E9F1;
    font-family:'Inter',sans-serif; color:var(--ink-900); background:var(--paper);
  }
  .cc-display{font-family:'Space Grotesk',sans-serif;}
  .cc-sash{
    background: linear-gradient(135deg, var(--blue-600) 0%, var(--navy-900) 55%, var(--navy-950) 100%);
    position:relative; overflow:hidden;
  }
  .cc-sash::after{
    content:''; position:absolute; width:180%; height:60px; background:var(--teal-400);
    opacity:.15; transform:rotate(-8deg); top:38px; left:-40%;
  }
  .cc-pulse{ position:relative; }
  .cc-pulse::before{
    content:''; position:absolute; inset:0; border-radius:999px; background:var(--teal-400);
    animation: cc-ping 1.8s cubic-bezier(0,0,.2,1) infinite;
  }
  @keyframes cc-ping{ 75%,100%{ transform:scale(2.4); opacity:0; } }
  .cc-navlink{ transition: background .15s ease, color .15s ease; }
  .cc-card{ background:var(--surface); border:1px solid var(--border); border-radius:14px; }
  .cc-badge-nova{ background:#EAF1FE; color:var(--blue-600); }
  .cc-badge-analise{ background:#FFF3DC; color:#9A6300; }
  .cc-badge-andamento{ background:#E7F6FE; color:#0F7EA6; }
  .cc-badge-resolvida{ background:#E6F7EF; color:#1E8E5F; }
  .cc-badge-cancelada{ background:#FBE9E7; color:#B3402C; }
  .cc-prio-alta{ color:var(--red-500); }
  .cc-prio-media{ color:var(--amber-500); }
  .cc-prio-baixa{ color:var(--ink-500); }
  .cc-scroll::-webkit-scrollbar{ width:6px; height:6px; }
  .cc-scroll::-webkit-scrollbar-thumb{ background:var(--border); border-radius:99px; }
  .cc-fade-in{ animation: cc-fade .25s ease; }
  @keyframes cc-fade{ from{opacity:0; transform:translateY(4px);} to{opacity:1; transform:none;} }
`;

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const CIDADE_REDUTO = "Ivatuba";
const CARGOS = ["Deputado Estadual", "Deputado Federal", "Senado", "Governador", "Presidente"];
const INTENCOES = ["Nosso candidato", "Outro candidato", "Indeciso"];
const CATEGORIAS = ["Amigos", "Prefeitura", "Igreja", "Carretinha de Natal", "Comerciantes", "Barracas", "Visitas"];

function intencoesPadrao() {
  return { "Deputado Estadual": "Indeciso", "Deputado Federal": "Indeciso", "Senado": "Indeciso", "Governador": "Indeciso", "Presidente": "Indeciso" };
}



// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
function StatCard({ label, value, sub, tone = "blue" }) {
  const tones = {
    blue: { bg: "#EAF1FE", fg: "var(--blue-600)" },
    teal: { bg: "#E7FBFB", fg: "#0E8E90" },
    amber: { bg: "#FFF3DC", fg: "#9A6300" },
    green: { bg: "#E6F7EF", fg: "#1E8E5F" },
  }[tone];
  return (
    <div className="cc-card p-4 flex flex-col gap-1">
      <span className="text-xs font-medium" style={{ color: "var(--ink-500)" }}>{label}</span>
      <span className="cc-display text-2xl font-bold">{value}</span>
      {sub && (
        <span className="text-xs px-2 py-0.5 rounded-full w-fit mt-1" style={{ background: tones.bg, color: tones.fg }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function Badge({ text }) {
  const map = {
    "Nova": "cc-badge-nova", "Em análise": "cc-badge-analise", "Em andamento": "cc-badge-andamento",
    "Resolvida": "cc-badge-resolvida", "Cancelada": "cc-badge-cancelada",
  };
  return <span className={`text-xs font-medium px-2 py-1 rounded-full ${map[text] || "cc-badge-nova"}`}>{text}</span>;
}

function PrioTag({ p }) {
  const cls = p === "Alta" ? "cc-prio-alta" : p === "Média" ? "cc-prio-media" : "cc-prio-baixa";
  return <span className={`text-xs font-semibold ${cls}`}>● {p}</span>;
}

function Modal({ title, onClose, children }) {
  return <Sheet title={title} onClose={onClose}>{children}</Sheet>;
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm mb-3">
      <span className="font-medium" style={{ color: "var(--ink-500)" }}>{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2";
const inputStyle = { borderColor: "var(--border)" };

function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" style={{ color: "var(--ink-300)" }}>
      <Activity size={28} className="mb-2" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

function DashboardView({ listas, liderancas, demandas, agenda, gastos, onNavigate, carregando }) {
  if (carregando) return <Skeleton linhas={3} />;
  const todos = [...listas.eleitores, ...listas.adriano, ...listas.paranhos];
  const conta = (arr, f) => arr.filter(f).length;
  const conf = conta(todos, e => e.status === "Confirmado");
  const pend = conta(todos, e => e.status === "Pendente");
  const indec = conta(todos, e => e.status === "Indeciso");
  const enviados = conta(todos, e => e.contatoStatus === "Enviado");
  const semana = Date.now() - 7 * 864e5;
  const novosSemana = conta(todos, e => e.createdAt && new Date(e.createdAt).getTime() >= semana);
  const pctConf = todos.length ? Math.round((conf / todos.length) * 100) : 0;
  const abertas = demandas.filter(d => d.status !== "Resolvida" && d.status !== "Cancelada").length;
  const totalGasto = gastos.reduce((s, g) => s + Number(g.valor || 0), 0);
  const fmt = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const hoje = new Date().toLocaleDateString("sv-SE");
  const proximos = agenda.filter(a => (a.data || "") >= hoje).sort((a, b) => (a.data + (a.hora || "")).localeCompare(b.data + (b.hora || ""))).slice(0, 4);
  const cores = ["#1B5FC4", "#38C6C8", "#F0A202", "#2AA876", "#E4572E", "#9A6300", "#5B6B7C"];
  const categoriaData = CATEGORIAS.map(cat => ({ categoria: cat, total: conta(todos, e => e.categoria === cat) })).filter(c => c.total > 0);
  const semCategoria = conta(todos, e => !e.categoria);

  const Mini = ({ label, value, cor, icon: Icon, onClick }) => (
    <button onClick={onClick} className="cc-card cc-card-hover p-4 flex flex-col gap-2 text-left">
      <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: cor + "1A", color: cor }}><Icon size={18} /></span>
      <span className="cc-display text-2xl font-bold leading-none">{value}</span>
      <span className="text-xs font-medium" style={{ color: "var(--ink-500)" }}>{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Card principal */}
      <button onClick={() => onNavigate("eleitores")} className="text-left rounded-[20px] p-5 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2E86D8 0%, #1B5FC4 40%, #0F2540 100%)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium" style={{ color: "#D6E4F7" }}>Eleitores cadastrados</p>
            <p className="cc-display text-5xl font-bold mt-1 leading-none">{todos.length}</p>
          </div>
          <span className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#ffffff22" }}><Users size={24} /></span>
        </div>
        <div className="flex items-center gap-2 mt-3 text-sm">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold" style={{ background: "#ffffff22" }}><TrendingUp size={14} /> +{novosSemana} nesta semana</span>
          <span style={{ color: "#D6E4F7" }}>{pctConf}% confirmados</span>
        </div>
        <div className="h-2 rounded-full mt-4 overflow-hidden flex" style={{ background: "#ffffff26" }} role="img" aria-label={`${conf} confirmados, ${pend} pendentes, ${indec} indecisos`}>
          <span style={{ width: `${todos.length ? conf / todos.length * 100 : 0}%`, background: "#5BE0A0" }} />
          <span style={{ width: `${todos.length ? pend / todos.length * 100 : 0}%`, background: "#F6C453" }} />
          <span style={{ width: `${todos.length ? indec / todos.length * 100 : 0}%`, background: "#FF8A65" }} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs" style={{ color: "#D6E4F7" }}>
          <span>Geral <b className="text-white">{listas.eleitores.length}</b></span>
          <span>Adriano José <b className="text-white">{listas.adriano.length}</b></span>
          <span>Paranhos <b className="text-white">{listas.paranhos.length}</b></span>
        </div>
      </button>

      {/* Cards secundários */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Mini label="Votos confirmados" value={conf} cor="#1E8E5F" icon={ThumbsUp} onClick={() => onNavigate("eleitores")} />
        <Mini label="Pendentes" value={pend} cor="#9A6300" icon={Clock} onClick={() => onNavigate("eleitores")} />
        <Mini label="Indecisos" value={indec} cor="#C8441F" icon={Minus} onClick={() => onNavigate("eleitores")} />
        <Mini label="Mensagens enviadas" value={enviados} cor="#1B5FC4" icon={Send} onClick={() => onNavigate("mensagens")} />
        <Mini label="Lideranças" value={liderancas.length} cor="#9A6300" icon={Crown} onClick={() => onNavigate("liderancas")} />
        <Mini label="Demandas abertas" value={abertas} cor="#C8441F" icon={ClipboardList} onClick={() => onNavigate("demandas")} />
        <Mini label="Compromissos futuros" value={agenda.filter(a => (a.data || "") >= hoje).length} cor="#0E8E90" icon={CalendarIcon} onClick={() => onNavigate("agenda")} />
        <Mini label="Total gasto" value={fmt(totalGasto)} cor="#1E8E5F" icon={Wallet} onClick={() => onNavigate("gastos")} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Próximos compromissos */}
        <div className="cc-card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="cc-display font-semibold text-sm">Próximos compromissos</h3>
            <button onClick={() => onNavigate("agenda")} className="text-xs font-semibold px-2 min-h-[36px]" style={{ color: "var(--blue-600)" }}>Ver agenda</button>
          </div>
          {proximos.length ? (
            <div className="flex flex-col">
              {proximos.map(a => (
                <div key={a.id} className="flex items-center gap-3 py-2.5 border-t first:border-t-0" style={{ borderColor: "var(--border)" }}>
                  <div className="w-12 text-center flex-shrink-0">
                    <p className="cc-display font-bold leading-none" style={{ color: "var(--blue-600)" }}>{(a.data || "").slice(8, 10)}</p>
                    <p className="text-[10px] uppercase" style={{ color: "var(--ink-500)" }}>{a.data ? new Date(a.data + "T12:00").toLocaleDateString("pt-BR", { month: "short" }).replace(".", "") : ""}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{a.titulo}</p>
                    <p className="text-xs truncate" style={{ color: "var(--ink-500)" }}>{[a.hora, a.local].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <Vazio texto="Nenhum compromisso marcado." acao={<button className="cc-btn cc-btn-secondary" onClick={() => { pedirAcao("agenda", "novo"); onNavigate("agenda"); }}><Plus size={16} /> Novo compromisso</button>} />}
        </div>

        {/* Categorias */}
        <div className="cc-card p-4">
          <h3 className="cc-display font-semibold text-sm mb-3">Eleitores por categoria</h3>
          {categoriaData.length || semCategoria ? (
            <div className="flex flex-col gap-2.5">
              {categoriaData.map((c, i) => (
                <div key={c.categoria} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-24 sm:w-32 flex-shrink-0 truncate">{c.categoria}</span>
                  <div className="flex-1 h-2.5 rounded-full" style={{ background: "var(--border)" }}>
                    <div className="h-2.5 rounded-full transition-all" style={{ width: `${Math.round(c.total / todos.length * 100)}%`, background: cores[i % cores.length] }} />
                  </div>
                  <span className="text-xs font-bold cc-display w-8 text-right">{c.total}</span>
                </div>
              ))}
              {semCategoria > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium w-24 sm:w-32 flex-shrink-0 truncate" style={{ color: "var(--ink-500)" }}>Sem categoria</span>
                  <div className="flex-1 h-2.5 rounded-full" style={{ background: "var(--border)" }}>
                    <div className="h-2.5 rounded-full" style={{ width: `${Math.round(semCategoria / (todos.length || 1) * 100)}%`, background: "var(--ink-300)" }} />
                  </div>
                  <span className="text-xs font-bold cc-display w-8 text-right" style={{ color: "var(--ink-500)" }}>{semCategoria}</span>
                </div>
              )}
            </div>
          ) : <Vazio texto="Cadastre eleitores para ver a divisão por categoria." />}
        </div>
      </div>

      {/* Acesso rápido */}
      <div className="cc-card p-4">
        <h3 className="cc-display font-semibold text-sm mb-3">Acesso rápido</h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {[
            { key: "eleitores", label: "Eleitores", icon: Users, cor: "#1B5FC4" },
            { key: "mensagens", label: "Mensagens", icon: Send, cor: "#1F9D55" },
            { key: "relatorios", label: "Votos", icon: Vote, cor: "#0E8E90" },
            { key: "agenda", label: "Agenda", icon: CalendarIcon, cor: "#9A6300" },
            { key: "demandas", label: "Demandas", icon: ClipboardList, cor: "#C8441F" },
            { key: "liderancas", label: "Lideranças", icon: Crown, cor: "#9A6300" },
            { key: "gastos", label: "Gastos", icon: Wallet, cor: "#1E8E5F" },
            { key: "tarefas", label: "Tarefas", icon: CheckSquare, cor: "#5B6B7C" },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button key={item.key} onClick={() => onNavigate(item.key)} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl min-h-[72px]" style={{ background: item.cor + "12" }}>
                <Icon size={22} style={{ color: item.cor }} />
                <span className="text-[11px] font-semibold" style={{ color: item.cor }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DemandasView({ items, setItems, table }) {
  const [modal, setModal] = useState(null);
  const statuses = ["Nova", "Em análise", "Em andamento", "Resolvida", "Cancelada"];

  function openNew() { setModal({ mode: "new", data: { solicitante: "", categoria: "Saúde", descricao: "", prioridade: "Média", status: "Nova", prazo: "" } }); }
  useAcaoPendente("demandas", { novo: openNew });
  function openEdit(item) { setModal({ mode: "edit", data: item }); }
  function save(form) {
    if (modal.mode === "new") {
      table.insert(form);
    } else {
      table.update(form.id, form);
    }
    setModal(null);
    if (modal.mode !== "new") toast("Alterações salvas");
  }
  function remove(id) { table.remove(id); }
  function changeStatus(id, status) { table.update(id, { status }); }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>
          <Plus size={16} /> Nova demanda
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {items.map(d => (
          <div key={d.id} className="cc-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-sm">{d.descricao}</span>
                <PrioTag p={d.prioridade} />
              </div>
              <p className="text-xs" style={{ color: "var(--ink-500)" }}>
                {d.solicitante} • {d.categoria} • prazo {d.prazo}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select value={d.status} onChange={e => changeStatus(d.id, e.target.value)}
                className="text-xs font-medium rounded-full px-2 py-1 border" style={{ borderColor: "var(--border)" }}>
                {statuses.map(s => <option key={s}>{s}</option>)}
              </select>
              <IconBtn label="Editar" onClick={() => openEdit(d)}><Pencil size={18} /></IconBtn>
              <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(remove(d.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyState text="Nenhuma demanda registrada." />}
      </div>
      {modal && (
        <Modal title={modal.mode === "new" ? "Nova demanda" : "Editar demanda"} onClose={() => setModal(null)}>
          <FormDemanda data={modal.data} onSave={save} statuses={statuses} />
        </Modal>
      )}
    </div>
  );
}

function FormDemanda({ data, onSave, statuses }) {
  const [form, setForm] = useState(data);
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <Field label="Solicitante"><input required className={inputCls} style={inputStyle} value={form.solicitante} onChange={e => setForm({ ...form, solicitante: e.target.value })} /></Field>
      <Field label="Descrição"><textarea required rows={2} className={inputCls} style={inputStyle} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></Field>
      <Field label="Categoria">
        <select className={inputCls} style={inputStyle} value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
          <option>Saúde</option><option>Educação</option><option>Infraestrutura</option><option>Assistência social</option><option>Outros</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prioridade">
          <select className={inputCls} style={inputStyle} value={form.prioridade} onChange={e => setForm({ ...form, prioridade: e.target.value })}>
            <option>Alta</option><option>Média</option><option>Baixa</option>
          </select>
        </Field>
        <Field label="Prazo">
          <input type="date" className={inputCls} style={inputStyle} value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} />
        </Field>
      </div>
      <Field label="Status">
        <select className={inputCls} style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <button type="submit" className="w-full mt-2 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>Salvar</button>
    </form>
  );
}

function AgendaView({ items, setItems, table }) {
  const [modal, setModal] = useState(null);
  const grouped = useMemo(() => {
    const g = {};
    [...items].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)).forEach(a => {
      g[a.data] = g[a.data] || [];
      g[a.data].push(a);
    });
    return g;
  }, [items]);

  function openNew() { setModal({ mode: "new", data: { titulo: "", data: new Date().toISOString().slice(0, 10), hora: "09:00", local: "", responsavel: "" } }); }
  useAcaoPendente("agenda", { novo: openNew });
  function openEdit(item) { setModal({ mode: "edit", data: item }); }
  function save(form) {
    if (modal.mode === "new") {
      table.insert(form);
    } else {
      table.update(form.id, form);
    }
    setModal(null);
    if (modal.mode !== "new") toast("Alterações salvas");
  }
  function remove(id) { table.remove(id); }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>
          <Plus size={16} /> Novo compromisso
        </button>
      </div>
      <div className="flex flex-col gap-5">
        {Object.entries(grouped).map(([data, list]) => (
          <div key={data}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--ink-500)" }}>
              {new Date(data + "T00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </p>
            <div className="flex flex-col gap-2">
              {list.map(a => (
                <div key={a.id} className="cc-card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="cc-display font-bold text-sm w-14 text-center" style={{ color: "var(--blue-600)" }}>{a.hora}</div>
                    <div>
                      <p className="text-sm font-medium">{a.titulo}</p>
                      <p className="text-xs" style={{ color: "var(--ink-500)" }}>{a.local} • {a.responsavel}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <IconBtn label="Editar" onClick={() => openEdit(a)}><Pencil size={18} /></IconBtn>
                    <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(remove(a.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyState text="Nenhum compromisso na agenda." />}
      </div>
      {modal && (
        <Modal title={modal.mode === "new" ? "Novo compromisso" : "Editar compromisso"} onClose={() => setModal(null)}>
          <FormAgenda data={modal.data} onSave={save} />
        </Modal>
      )}
    </div>
  );
}

function FormAgenda({ data, onSave }) {
  const [form, setForm] = useState(data);
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <Field label="Título"><input required className={inputCls} style={inputStyle} value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data"><input type="date" required className={inputCls} style={inputStyle} value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
        <Field label="Hora"><input type="time" required className={inputCls} style={inputStyle} value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} /></Field>
      </div>
      <Field label="Local"><input required className={inputCls} style={inputStyle} value={form.local} onChange={e => setForm({ ...form, local: e.target.value })} /></Field>
      <Field label="Responsável"><input required className={inputCls} style={inputStyle} value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} /></Field>
      <button type="submit" className="w-full mt-2 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>Salvar</button>
    </form>
  );
}

function GastosView({ items, setItems, table }) {
  const [modal, setModal] = useState(null);
  const total = items.reduce((s, g) => s + Number(g.valor || 0), 0);
  const fmt = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function openNew() { setModal({ mode: "new", data: { descricao: "", categoria: "Material gráfico", valor: "", data: "", observacoes: "" } }); }
  useAcaoPendente("gastos", { novo: openNew });
  function openEdit(item) { setModal({ mode: "edit", data: item }); }
  function save(form) {
    const payload = { ...form, valor: Number(form.valor) || 0 };
    if (modal.mode === "new") {
      table.insert(payload);
    } else {
      table.update(form.id, payload);
    }
    setModal(null);
    if (modal.mode !== "new") toast("Alterações salvas");
  }
  function remove(id) { table.remove(id); }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="cc-card px-4 py-2 flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--ink-500)" }}>Total gasto</span>
          <span className="cc-display font-bold" style={{ color: "var(--blue-600)" }}>{fmt(total)}</span>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>
          <Plus size={16} /> Novo gasto
        </button>
      </div>
      <div className="flex flex-col gap-2 md:hidden">
        {items.map(g => (
          <div key={g.id} className="cc-card cc-rowcard">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0"><p className="font-semibold">{g.descricao}</p><p className="text-xs" style={{ color: "var(--ink-500)" }}>{g.categoria}{g.data ? " · " + g.data.split("-").reverse().join("/") : ""}</p></div>
              <p className="cc-display font-bold whitespace-nowrap" style={{ color: "var(--blue-600)" }}>{fmt(Number(g.valor || 0))}</p>
            </div>
            <div className="flex justify-end gap-1 -mb-1">
              <IconBtn label="Editar" onClick={() => openEdit(g)}><Pencil size={18} /></IconBtn>
              <IconBtn danger label="Excluir" onClick={() => confirmar("Esse gasto será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(remove(g.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="cc-card"><EmptyState text="Nenhum gasto registrado." /></div>}
      </div>
      <div className="cc-card overflow-x-auto cc-scroll hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: "var(--ink-500)" }}>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(g => (
              <tr key={g.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-3 font-medium">{g.descricao}</td>
                <td className="px-4 py-3" style={{ color: "var(--ink-500)" }}>{g.categoria}</td>
                <td className="px-4 py-3">{g.data}</td>
                <td className="px-4 py-3 cc-display font-semibold">{fmt(Number(g.valor || 0))}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <IconBtn label="Editar" onClick={() => openEdit(g)}><Pencil size={18} /></IconBtn>
                    <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(remove(g.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <EmptyState text="Nenhum gasto registrado." />}
      </div>
      {modal && (
        <Modal title={modal.mode === "new" ? "Novo gasto" : "Editar gasto"} onClose={() => setModal(null)}>
          <FormGasto data={modal.data} onSave={save} />
        </Modal>
      )}
    </div>
  );
}

function FormGasto({ data, onSave }) {
  const [form, setForm] = useState(data);
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <Field label="Descrição"><input required className={inputCls} style={inputStyle} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoria">
          <select className={inputCls} style={inputStyle} value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
            <option>Material gráfico</option><option>Logística</option><option>Eventos</option><option>Alimentação</option><option>Outros</option>
          </select>
        </Field>
        <Field label="Valor (R$)"><input type="number" step="0.01" required className={inputCls} style={inputStyle} value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></Field>
      </div>
      <Field label="Data"><input type="date" required className={inputCls} style={inputStyle} value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
      <Field label="Observações"><input className={inputCls} style={inputStyle} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></Field>
      <button type="submit" className="w-full mt-2 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>Salvar</button>
    </form>
  );
}

function MaterialView({ items, setItems, table }) {
  const [modal, setModal] = useState(null);

  function openNew() { setModal({ mode: "new", data: { nome: "", quantidadeTotal: "", quantidadeDistribuida: "", custoUnitario: "", observacoes: "" } }); }
  function openEdit(item) { setModal({ mode: "edit", data: item }); }
  function save(form) {
    const payload = { ...form, quantidadeTotal: Number(form.quantidadeTotal) || 0, quantidadeDistribuida: Number(form.quantidadeDistribuida) || 0, custoUnitario: Number(form.custoUnitario) || 0 };
    if (modal.mode === "new") {
      table.insert(payload);
    } else {
      table.update(form.id, payload);
    }
    setModal(null);
    if (modal.mode !== "new") toast("Alterações salvas");
  }
  function remove(id) { table.remove(id); }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>
          <Plus size={16} /> Novo material
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(m => {
          const restante = m.quantidadeTotal - m.quantidadeDistribuida;
          const pct = m.quantidadeTotal ? Math.round((m.quantidadeDistribuida / m.quantidadeTotal) * 100) : 0;
          return (
            <div key={m.id} className="cc-card p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-sm">{m.nome}</p>
                <div className="flex gap-1">
                  <IconBtn label="Editar" onClick={() => openEdit(m)}><Pencil size={18} /></IconBtn>
                  <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(remove(m.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
                </div>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: "var(--border)" }}>
                <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: "var(--blue-600)" }} />
              </div>
              <div className="flex justify-between text-xs" style={{ color: "var(--ink-500)" }}>
                <span>{m.quantidadeDistribuida.toLocaleString("pt-BR")} distribuídos</span>
                <span className="cc-display font-semibold" style={{ color: "var(--ink-900)" }}>{restante.toLocaleString("pt-BR")} restantes</span>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <EmptyState text="Nenhum material cadastrado." />}
      </div>
      {modal && (
        <Modal title={modal.mode === "new" ? "Novo material" : "Editar material"} onClose={() => setModal(null)}>
          <FormMaterial data={modal.data} onSave={save} />
        </Modal>
      )}
    </div>
  );
}

function FormMaterial({ data, onSave }) {
  const [form, setForm] = useState(data);
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <Field label="Nome do material"><input required className={inputCls} style={inputStyle} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantidade total"><input type="number" required className={inputCls} style={inputStyle} value={form.quantidadeTotal} onChange={e => setForm({ ...form, quantidadeTotal: e.target.value })} /></Field>
        <Field label="Já distribuído"><input type="number" className={inputCls} style={inputStyle} value={form.quantidadeDistribuida} onChange={e => setForm({ ...form, quantidadeDistribuida: e.target.value })} /></Field>
      </div>
      <Field label="Custo unitário (R$)"><input type="number" step="0.01" className={inputCls} style={inputStyle} value={form.custoUnitario} onChange={e => setForm({ ...form, custoUnitario: e.target.value })} /></Field>
      <Field label="Observações"><input className={inputCls} style={inputStyle} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></Field>
      <button type="submit" className="w-full mt-2 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>Salvar</button>
    </form>
  );
}

function VisitasView({ items, setItems, table }) {
  const [modal, setModal] = useState(null);
  const resultTone = { "Positiva": "cc-badge-resolvida", "Indeciso": "cc-badge-analise", "Negativa": "cc-badge-cancelada" };

  function openNew() { setModal({ mode: "new", data: { pessoa: "", endereco: "", data: "", hora: "", assessor: "", assunto: "", resultado: "Positiva", proximosPassos: "" } }); }
  function openEdit(item) { setModal({ mode: "edit", data: item }); }
  function save(form) {
    if (modal.mode === "new") {
      table.insert(form);
    } else {
      table.update(form.id, form);
    }
    setModal(null);
    if (modal.mode !== "new") toast("Alterações salvas");
  }
  function remove(id) { table.remove(id); }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>
          <Plus size={16} /> Nova visita
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {items.map(v => (
          <div key={v.id} className="cc-card p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{v.pessoa}</p>
                <p className="text-xs" style={{ color: "var(--ink-500)" }}>{v.endereco}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${resultTone[v.resultado] || "cc-badge-nova"}`}>{v.resultado}</span>
                <IconBtn label="Editar" onClick={() => openEdit(v)}><Pencil size={18} /></IconBtn>
                <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(remove(v.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--ink-500)" }}>
              <span>{v.data} • {v.hora}</span>
              <span>Assessor: {v.assessor}</span>
              <span>Assunto: {v.assunto}</span>
            </div>
            {v.proximosPassos && (
              <p className="text-xs pt-2 border-t" style={{ borderColor: "var(--border)", color: "var(--ink-900)" }}>
                <strong>Próximos passos:</strong> {v.proximosPassos}
              </p>
            )}
          </div>
        ))}
        {items.length === 0 && <EmptyState text="Nenhuma visita registrada." />}
      </div>
      {modal && (
        <Modal title={modal.mode === "new" ? "Nova visita" : "Editar visita"} onClose={() => setModal(null)}>
          <FormVisita data={modal.data} onSave={save} />
        </Modal>
      )}
    </div>
  );
}

function FormVisita({ data, onSave }) {
  const [form, setForm] = useState(data);
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <Field label="Pessoa visitada"><input required className={inputCls} style={inputStyle} value={form.pessoa} onChange={e => setForm({ ...form, pessoa: e.target.value })} /></Field>
      <Field label="Endereço"><input required className={inputCls} style={inputStyle} value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data"><input type="date" required className={inputCls} style={inputStyle} value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
        <Field label="Hora"><input type="time" required className={inputCls} style={inputStyle} value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} /></Field>
      </div>
      <Field label="Assessor responsável"><input required className={inputCls} style={inputStyle} value={form.assessor} onChange={e => setForm({ ...form, assessor: e.target.value })} /></Field>
      <Field label="Assunto"><input className={inputCls} style={inputStyle} value={form.assunto} onChange={e => setForm({ ...form, assunto: e.target.value })} /></Field>
      <Field label="Resultado da visita">
        <select className={inputCls} style={inputStyle} value={form.resultado} onChange={e => setForm({ ...form, resultado: e.target.value })}>
          <option>Positiva</option><option>Indeciso</option><option>Negativa</option>
        </select>
      </Field>
      <Field label="Próximos passos"><input className={inputCls} style={inputStyle} value={form.proximosPassos} onChange={e => setForm({ ...form, proximosPassos: e.target.value })} /></Field>
      <button type="submit" className="w-full mt-2 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>Salvar</button>
    </form>
  );
}

function EventosView({ items, setItems, table }) {
  const [modal, setModal] = useState(null);
  const sorted = useMemo(() => [...items].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)), [items]);

  function openNew() { setModal({ mode: "new", data: { nome: "", data: "", hora: "", local: "", responsavel: "", publicoEstimado: "", observacoes: "" } }); }
  function openEdit(item) { setModal({ mode: "edit", data: item }); }
  function save(form) {
    const payload = { ...form, publicoEstimado: Number(form.publicoEstimado) || 0 };
    if (modal.mode === "new") {
      table.insert(payload);
    } else {
      table.update(form.id, payload);
    }
    setModal(null);
    if (modal.mode !== "new") toast("Alterações salvas");
  }
  function remove(id) { table.remove(id); }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>
          <Plus size={16} /> Novo evento
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(ev => (
          <div key={ev.id} className="cc-card p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-lg flex flex-col items-center justify-center cc-display" style={{ background: "#EAF1FE", color: "var(--blue-600)" }}>
                <span className="text-[10px] font-semibold uppercase leading-none">{new Date(ev.data + "T00:00").toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
                <span className="text-sm font-bold leading-none mt-0.5">{ev.data.slice(8, 10)}</span>
              </div>
              <div className="flex gap-1">
                <IconBtn label="Editar" onClick={() => openEdit(ev)}><Pencil size={18} /></IconBtn>
                <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(remove(ev.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm">{ev.nome}</p>
              <p className="text-xs" style={{ color: "var(--ink-500)" }}>{ev.local} • {ev.hora}</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--ink-500)" }}>
              <span>{ev.responsavel}</span>
              <span className="cc-display font-semibold" style={{ color: "var(--ink-900)" }}>{ev.publicoEstimado.toLocaleString("pt-BR")} pessoas</span>
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyState text="Nenhum evento cadastrado." />}
      </div>
      {modal && (
        <Modal title={modal.mode === "new" ? "Novo evento" : "Editar evento"} onClose={() => setModal(null)}>
          <FormEvento data={modal.data} onSave={save} />
        </Modal>
      )}
    </div>
  );
}

function FormEvento({ data, onSave }) {
  const [form, setForm] = useState(data);
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <Field label="Nome do evento"><input required className={inputCls} style={inputStyle} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data"><input type="date" required className={inputCls} style={inputStyle} value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
        <Field label="Hora"><input type="time" required className={inputCls} style={inputStyle} value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} /></Field>
      </div>
      <Field label="Local"><input required className={inputCls} style={inputStyle} value={form.local} onChange={e => setForm({ ...form, local: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Responsável"><input className={inputCls} style={inputStyle} value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} /></Field>
        <Field label="Público estimado"><input type="number" className={inputCls} style={inputStyle} value={form.publicoEstimado} onChange={e => setForm({ ...form, publicoEstimado: e.target.value })} /></Field>
      </div>
      <Field label="Observações"><input className={inputCls} style={inputStyle} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></Field>
      <button type="submit" className="w-full mt-2 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>Salvar</button>
    </form>
  );
}

function TarefasView({ items, setItems, table }) {
  const [modal, setModal] = useState(null);
  const statuses = ["Pendente", "Em andamento", "Concluída"];
  const statusTone = { "Pendente": "cc-badge-nova", "Em andamento": "cc-badge-andamento", "Concluída": "cc-badge-resolvida" };

  function openNew() { setModal({ mode: "new", data: { titulo: "", responsavel: "", prazo: "", prioridade: "Média", status: "Pendente" } }); }
  useAcaoPendente("tarefas", { novo: openNew });
  function openEdit(item) { setModal({ mode: "edit", data: item }); }
  function save(form) {
    if (modal.mode === "new") {
      table.insert(form);
    } else {
      table.update(form.id, form);
    }
    setModal(null);
    if (modal.mode !== "new") toast("Alterações salvas");
  }
  function changeStatus(id, status) { table.update(id, { status }); }
  function remove(id) { table.remove(id); }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>
          <Plus size={16} /> Nova tarefa
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {items.map(t => (
          <div key={t.id} className="cc-card p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <CheckSquare size={16} style={{ color: t.status === "Concluída" ? "var(--green-500)" : "var(--ink-300)" }} />
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${t.status === "Concluída" ? "line-through" : ""}`} style={{ color: t.status === "Concluída" ? "var(--ink-300)" : "var(--ink-900)" }}>{t.titulo}</p>
                <p className="text-xs" style={{ color: "var(--ink-500)" }}>{t.responsavel} • prazo {t.prazo} <PrioTag p={t.prioridade} /></p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <select value={t.status} onChange={e => changeStatus(t.id, e.target.value)}
                className="text-xs font-medium rounded-full px-2 py-1 border" style={{ borderColor: "var(--border)" }}>
                {statuses.map(s => <option key={s}>{s}</option>)}
              </select>
              <IconBtn label="Editar" onClick={() => openEdit(t)}><Pencil size={18} /></IconBtn>
              <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(remove(t.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyState text="Nenhuma tarefa cadastrada." />}
      </div>
      {modal && (
        <Modal title={modal.mode === "new" ? "Nova tarefa" : "Editar tarefa"} onClose={() => setModal(null)}>
          <FormTarefa data={modal.data} onSave={save} statuses={statuses} />
        </Modal>
      )}
    </div>
  );
}

function FormTarefa({ data, onSave, statuses }) {
  const [form, setForm] = useState(data);
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <Field label="Título"><input required className={inputCls} style={inputStyle} value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} /></Field>
      <Field label="Responsável"><input required className={inputCls} style={inputStyle} value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prazo"><input type="date" className={inputCls} style={inputStyle} value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} /></Field>
        <Field label="Prioridade">
          <select className={inputCls} style={inputStyle} value={form.prioridade} onChange={e => setForm({ ...form, prioridade: e.target.value })}>
            <option>Alta</option><option>Média</option><option>Baixa</option>
          </select>
        </Field>
      </div>
      <Field label="Status">
        <select className={inputCls} style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <button type="submit" className="w-full mt-2 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>Salvar</button>
    </form>
  );
}

function RelatoriosView({ eleitores, metas, setMetas, metasKV, candidatos, candidatosKV }) {
  const [editingMeta, setEditingMeta] = useState(null);
  const [editingCandidato, setEditingCandidato] = useState(null);

  const nomeNosso = (cargo) => candidatos[cargo] || "Nosso candidato";

  const linhas = CARGOS.map(cargo => {
    const nosso = eleitores.filter(e => e.intencoes?.[cargo] === "Nosso candidato").length;
    const outro = eleitores.filter(e => e.intencoes?.[cargo] === "Outro candidato").length;
    const indeciso = eleitores.filter(e => e.intencoes?.[cargo] === "Indeciso").length;
    const meta = metas[cargo] || 0;
    const pct = meta ? Math.min(100, Math.round((nosso / meta) * 100)) : 0;
    return { cargo, nosso, outro, indeciso, meta, pct };
  });

  function saveMeta(cargo, valor) {
    metasKV.setValue(cargo, Number(valor) || 0);
    setEditingMeta(null);
  }

  function saveCandidato(cargo, nome) {
    candidatosKV.setValue(cargo, nome.trim() || "Nosso candidato");
    setEditingCandidato(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="cc-card p-4 flex items-start gap-2" style={{ background: "#EAF1FE" }}>
        <Vote size={16} style={{ color: "var(--blue-600)" }} className="mt-0.5 flex-shrink-0" />
        <p className="text-xs" style={{ color: "var(--navy-900)" }}>
          Relatório de intenção de voto — {eleitores.length} eleitores cadastrados. Toque no nome do candidato ou na meta para editar.
        </p>
      </div>

      {CARGOS.map(cargo => {
        const l = linhas.find(x => x.cargo === cargo);
        const nome = nomeNosso(cargo);
        return (
          <div key={cargo} className="cc-card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="cc-display font-semibold text-sm">{cargo}</h3>
              <div className="flex items-center gap-1">
                <span className="text-[11px]" style={{ color: "var(--ink-500)" }}>Meta:</span>
                {editingMeta === cargo ? (
                  <input autoFocus type="number" defaultValue={l.meta}
                    className="w-20 border rounded-lg px-2 py-1 text-sm" style={inputStyle}
                    onBlur={e => saveMeta(cargo, e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") saveMeta(cargo, e.target.value); }} />
                ) : (
                  <button onClick={() => setEditingMeta(cargo)} aria-label="Editar meta" className="cc-display font-semibold text-sm flex items-center gap-1.5 hover:underline min-h-[40px] min-w-[40px] px-2 -mx-2 rounded-lg">
                    {l.meta.toLocaleString("pt-BR")} <Pencil size={14} style={{ color: "var(--ink-300)" }} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {editingCandidato === cargo ? (
                <input autoFocus defaultValue={nome}
                  className="flex-1 border rounded-lg px-2 py-1 text-sm" style={inputStyle}
                  placeholder="Nome do candidato"
                  onBlur={e => saveCandidato(cargo, e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveCandidato(cargo, e.target.value); }} />
              ) : (
                <button onClick={() => setEditingCandidato(cargo)}
                  className="flex items-center gap-1.5 text-sm font-medium hover:underline min-h-[40px] px-2 -mx-2 rounded-lg" style={{ color: "var(--blue-600)" }}>
                  <Pencil size={14} /> {nome}
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl px-3 py-3 text-center" style={{ background: "#E6F7EF" }}>
                <p className="cc-display font-bold text-xl" style={{ color: "#1E8E5F" }}>{l.nosso}</p>
                <p className="text-[11px] font-medium" style={{ color: "#1E8E5F" }}>A favor</p>
              </div>
              <div className="rounded-xl px-3 py-3 text-center" style={{ background: "#FFF3DC" }}>
                <p className="cc-display font-bold text-xl" style={{ color: "#9A6300" }}>{l.indeciso}</p>
                <p className="text-[11px] font-medium" style={{ color: "#9A6300" }}>Indeciso</p>
              </div>
              <div className="rounded-xl px-3 py-3 text-center" style={{ background: "#FBE9E7" }}>
                <p className="cc-display font-bold text-xl" style={{ color: "#B3402C" }}>{l.outro}</p>
                <p className="text-[11px] font-medium" style={{ color: "#B3402C" }}>Outro</p>
              </div>
            </div>

            {l.meta > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 rounded-full" style={{ background: "var(--border)" }}>
                  <div className="h-3 rounded-full transition-all" style={{ width: `${l.pct}%`, background: l.pct >= 100 ? "var(--green-500)" : "var(--blue-600)" }} />
                </div>
                <span className="text-xs font-semibold cc-display w-12 text-right">{l.pct}%</span>
              </div>
            )}
          </div>
        );
      })}

      <div className="cc-card p-5">
        <h3 className="cc-display font-semibold text-sm mb-4">Meta × intenção declarada</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={linhas} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E9F1" />
            <XAxis dataKey="cargo" tick={{ fontSize: 10, fill: "#5B6B7C" }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11, fill: "#5B6B7C" }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="meta" name="Meta" fill="#93A2B3" radius={[4, 4, 0, 0]} barSize={18} />
            <Bar dataKey="nosso" name="Intenção declarada" fill="#1B5FC4" radius={[4, 4, 0, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PesquisasView({ items, setItems, table, eleitores }) {
  const [modal, setModal] = useState(null);
  const [cargoTab, setCargoTab] = useState("Geral");

  function openNew() { setModal({ mode: "new", data: { titulo: "", data: "", responsavel: "", cargo: cargoTab === "Geral" ? "" : cargoTab, opcoes: [{ texto: "", respostas: 0 }, { texto: "", respostas: 0 }] } }); }
  function openEdit(item) { setModal({ mode: "edit", data: { ...item, opcoes: (item.opcoes || []).map(o => ({ ...o })) } }); }
  function save(form) {
    const opcoes = form.opcoes.filter(o => o.texto.trim());
    const payload = { ...form, opcoes };
    if (modal.mode === "new") table.insert(payload);
    else table.update(form.id, payload);
    setModal(null);
    if (modal.mode !== "new") toast("Alterações salvas");
  }
  function remove(id) { table.remove(id); }

  const filteredItems = cargoTab === "Geral"
    ? items.filter(p => !p.cargo)
    : items.filter(p => p.cargo === cargoTab);

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-abas: Geral + cada cargo */}
      <div className="flex gap-1 overflow-x-auto cc-scroll pb-1">
        {["Geral", ...CARGOS].map(tab => (
          <button key={tab} onClick={() => setCargoTab(tab)}
            className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
            style={{ background: cargoTab === tab ? "var(--blue-600)" : "var(--border)", color: cargoTab === tab ? "#fff" : "var(--ink-500)" }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Pesquisa eleitoral automática por cargo */}
      {cargoTab !== "Geral" && eleitores && eleitores.length > 0 && (
        <div className="cc-card p-4">
          <h3 className="cc-display font-semibold text-sm mb-3">Intenção de voto — {cargoTab}</h3>
          <div className="flex flex-col gap-2">
            {INTENCOES.map(int => {
              const count = eleitores.filter(e => e.intencoes?.[cargoTab] === int).length;
              const pct = eleitores.length ? Math.round((count / eleitores.length) * 100) : 0;
              const cor = int === "Nosso candidato" ? "#1E8E5F" : int === "Outro candidato" ? "#B3402C" : "#9A6300";
              return (
                <div key={int} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-28 flex-shrink-0">{int}</span>
                  <div className="flex-1 h-3 rounded-full" style={{ background: "var(--border)" }}>
                    <div className="h-3 rounded-full" style={{ width: `${pct}%`, background: cor }} />
                  </div>
                  <span className="text-xs font-bold cc-display w-16 text-right" style={{ color: cor }}>{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>
          <Plus size={16} /> Nova pesquisa
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {filteredItems.map(p => {
          const total = p.opcoes.reduce((s, o) => s + Number(o.respostas || 0), 0);
          return (
            <div key={p.id} className="cc-card p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{p.titulo}</p>
                  <p className="text-xs" style={{ color: "var(--ink-500)" }}>{p.data} • {p.responsavel} • {total} respostas{p.cargo ? ` • ${p.cargo}` : ""}</p>
                </div>
                <div className="flex gap-1">
                  <IconBtn label="Editar" onClick={() => openEdit(p)}><Pencil size={18} /></IconBtn>
                  <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(remove(p.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {p.opcoes.map((o, idx) => {
                  const pct = total ? Math.round((o.respostas / total) * 100) : 0;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-xs w-40 truncate" style={{ color: "var(--ink-900)" }}>{o.texto}</span>
                      <div className="flex-1 h-2 rounded-full" style={{ background: "var(--border)" }}>
                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: "var(--blue-600)" }} />
                      </div>
                      <span className="text-xs w-16 text-right cc-display font-semibold" style={{ color: "var(--ink-500)" }}>{pct}% ({o.respostas})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {filteredItems.length === 0 && <EmptyState text={cargoTab === "Geral" ? "Nenhuma pesquisa geral." : `Nenhuma pesquisa para ${cargoTab}.`} />}
      </div>
      {modal && (
        <Modal title={modal.mode === "new" ? "Nova pesquisa" : "Editar pesquisa"} onClose={() => setModal(null)}>
          <FormPesquisa data={modal.data} onSave={save} />
        </Modal>
      )}
    </div>
  );
}

function FormPesquisa({ data, onSave }) {
  const [form, setForm] = useState(data);

  function updateOpcao(idx, field, value) {
    const opcoes = form.opcoes.map((o, i) => i === idx ? { ...o, [field]: field === "respostas" ? Number(value) || 0 : value } : o);
    setForm({ ...form, opcoes });
  }
  function addOpcao() { setForm({ ...form, opcoes: [...form.opcoes, { texto: "", respostas: 0 }] }); }
  function removeOpcao(idx) { setForm({ ...form, opcoes: form.opcoes.filter((_, i) => i !== idx) }); }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <Field label="Pergunta / título da pesquisa"><input required className={inputCls} style={inputStyle} value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data"><input type="date" required className={inputCls} style={inputStyle} value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
        <Field label="Responsável"><input className={inputCls} style={inputStyle} value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} /></Field>
      </div>
      <Field label="Cargo (opcional)">
        <select className={inputCls} style={inputStyle} value={form.cargo || ""} onChange={e => setForm({ ...form, cargo: e.target.value })}>
          <option value="">Geral</option>
          {CARGOS.map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <span className="text-sm font-medium block mb-2" style={{ color: "var(--ink-500)" }}>Opções de resposta e contagem</span>
      <div className="flex flex-col gap-2 mb-2">
        {form.opcoes.map((o, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input placeholder="Opção de resposta" className={inputCls} style={{ ...inputStyle, flex: 2 }} value={o.texto} onChange={e => updateOpcao(idx, "texto", e.target.value)} />
            <input type="number" placeholder="0" className={inputCls} style={{ ...inputStyle, width: "5rem" }} value={o.respostas} onChange={e => updateOpcao(idx, "respostas", e.target.value)} />
            <IconBtn danger label="Remover" onClick={() => removeOpcao(idx)}><Trash2 size={18} /></IconBtn>
          </div>
        ))}
      </div>
      <button type="button" onClick={addOpcao} className="text-xs font-medium flex items-center gap-1 mb-4" style={{ color: "var(--blue-600)" }}>
        <Plus size={13} /> Adicionar opção
      </button>
      <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>Salvar</button>
    </form>
  );
}

function DocumentosView({ items, setItems, table }) {
  const [modal, setModal] = useState(null);
  const categoriaTone = { "Jurídico": "cc-badge-analise", "Financeiro": "cc-badge-andamento", "Comunicação": "cc-badge-nova", "Outros": "cc-badge-resolvida" };

  function openNew() { setModal({ mode: "new", data: { nome: "", categoria: "Jurídico", data: "", link: "", observacoes: "" } }); }
  function openEdit(item) { setModal({ mode: "edit", data: item }); }
  function save(form) {
    if (modal.mode === "new") {
      table.insert(form);
    } else {
      table.update(form.id, form);
    }
    setModal(null);
    if (modal.mode !== "new") toast("Alterações salvas");
  }
  function remove(id) { table.remove(id); }

  return (
    <div className="flex flex-col gap-4">
      <div className="cc-card p-3 flex items-start gap-2" style={{ background: "#EAF1FE" }}>
        <FileText size={15} style={{ color: "var(--blue-600)" }} className="mt-0.5 flex-shrink-0" />
        <p className="text-xs" style={{ color: "var(--navy-900)" }}>
          Aqui você organiza onde cada documento está guardado (Drive, pasta física, etc). O upload direto de arquivos entra na versão com Supabase Storage.
        </p>
      </div>
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>
          <Plus size={16} /> Novo documento
        </button>
      </div>
      <div className="flex flex-col gap-2 md:hidden">
        {items.map(d => (
          <div key={d.id} className="cc-card cc-rowcard">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {d.link ? <a href={d.link} target="_blank" rel="noreferrer" className="font-semibold flex items-center gap-1.5" style={{ color: "var(--blue-600)" }}>{d.nome} <ExternalLink size={13} /></a> : <p className="font-semibold">{d.nome}</p>}
                {d.observacoes && <p className="text-xs mt-0.5" style={{ color: "var(--ink-500)" }}>{d.observacoes}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${categoriaTone[d.categoria] || "cc-badge-nova"}`}>{d.categoria}</span>
            </div>
            <div className="flex items-center justify-between gap-1 -mb-1">
              <span className="text-xs" style={{ color: "var(--ink-500)" }}>{d.data ? d.data.split("-").reverse().join("/") : ""}</span>
              <div className="flex gap-1">
                <IconBtn label="Editar" onClick={() => openEdit(d)}><Pencil size={18} /></IconBtn>
                <IconBtn danger label="Excluir" onClick={() => confirmar("Esse documento será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(remove(d.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="cc-card"><EmptyState text="Nenhum documento cadastrado." /></div>}
      </div>
      <div className="cc-card overflow-x-auto cc-scroll hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: "var(--ink-500)" }}>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Observações</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(d => (
              <tr key={d.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-3 font-medium">
                  {d.link ? (
                    <a href={d.link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:underline" style={{ color: "var(--blue-600)" }}>
                      {d.nome} <ExternalLink size={12} />
                    </a>
                  ) : d.nome}
                </td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${categoriaTone[d.categoria] || "cc-badge-nova"}`}>{d.categoria}</span></td>
                <td className="px-4 py-3" style={{ color: "var(--ink-500)" }}>{d.data}</td>
                <td className="px-4 py-3" style={{ color: "var(--ink-500)" }}>{d.observacoes}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <IconBtn label="Editar" onClick={() => openEdit(d)}><Pencil size={18} /></IconBtn>
                    <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(remove(d.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <EmptyState text="Nenhum documento cadastrado." />}
      </div>
      {modal && (
        <Modal title={modal.mode === "new" ? "Novo documento" : "Editar documento"} onClose={() => setModal(null)}>
          <FormDocumento data={modal.data} onSave={save} />
        </Modal>
      )}
    </div>
  );
}

function FormDocumento({ data, onSave }) {
  const [form, setForm] = useState(data);
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <Field label="Nome do documento"><input required className={inputCls} style={inputStyle} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoria">
          <select className={inputCls} style={inputStyle} value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
            <option>Jurídico</option><option>Financeiro</option><option>Comunicação</option><option>Outros</option>
          </select>
        </Field>
        <Field label="Data"><input type="date" className={inputCls} style={inputStyle} value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field>
      </div>
      <Field label="Link (Drive, pasta online...)"><input className={inputCls} style={inputStyle} value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://..." /></Field>
      <Field label="Observações"><input className={inputCls} style={inputStyle} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></Field>
      <button type="submit" className="w-full mt-2 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>Salvar</button>
    </form>
  );
}

function WhatsGruposView({ items, setItems, table }) {
  const [modal, setModal] = useState(null);
  const statusTone = { "Ativo": "cc-badge-resolvida", "Inativo": "cc-badge-cancelada", "Novo": "cc-badge-nova" };

  function openNew() { setModal({ mode: "new", data: { nome: "", link: "", membros: "", admin: "", status: "Ativo", observacoes: "" } }); }
  function openEdit(item) { setModal({ mode: "edit", data: item }); }
  function save(form) {
    const payload = { ...form, membros: Number(form.membros) || 0 };
    if (modal.mode === "new") table.insert(payload);
    else table.update(form.id, payload);
    setModal(null);
    if (modal.mode !== "new") toast("Alterações salvas");
  }
  function remove(id) { table.remove(id); }

  const totalMembros = items.reduce((s, g) => s + (Number(g.membros) || 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Grupos" value={items.length} tone="teal" />
        <StatCard label="Total membros" value={totalMembros} tone="blue" />
      </div>
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#25D366" }}>
          <Plus size={16} /> Novo grupo
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {items.map(g => (
          <div key={g.id} className="cc-card p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#E6F7EF", color: "#25D366" }}>
                  <UsersRound size={18} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{g.nome}</p>
                  <p className="text-xs" style={{ color: "var(--ink-500)" }}>{g.membros || 0} membros</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-2 py-1 rounded-full ${statusTone[g.status] || "cc-badge-nova"}`}>{g.status}</span>
                <IconBtn label="Editar" onClick={() => openEdit(g)}><Pencil size={18} /></IconBtn>
                <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(remove(g.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
              </div>
            </div>
            {g.admin && <p className="text-xs" style={{ color: "var(--ink-500)" }}>Admin: {g.admin}</p>}
            {g.link && (
              <a href={g.link} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 font-medium" style={{ color: "#25D366" }}>
                <ExternalLink size={12} /> Abrir grupo
              </a>
            )}
            {g.observacoes && <p className="text-xs pt-1 border-t" style={{ borderColor: "var(--border)", color: "var(--ink-500)" }}>{g.observacoes}</p>}
          </div>
        ))}
        {items.length === 0 && <EmptyState text="Nenhum grupo cadastrado." />}
      </div>
      {modal && (
        <Modal title={modal.mode === "new" ? "Novo grupo" : "Editar grupo"} onClose={() => setModal(null)}>
          <form onSubmit={e => { e.preventDefault(); save(modal.data); }}>
            <Field label="Nome do grupo"><input required className={inputCls} style={inputStyle} value={modal.data.nome} onChange={e => setModal({ ...modal, data: { ...modal.data, nome: e.target.value } })} /></Field>
            <Field label="Link do grupo"><input className={inputCls} style={inputStyle} value={modal.data.link} onChange={e => setModal({ ...modal, data: { ...modal.data, link: e.target.value } })} placeholder="https://chat.whatsapp.com/..." /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Membros"><input type="number" className={inputCls} style={inputStyle} value={modal.data.membros} onChange={e => setModal({ ...modal, data: { ...modal.data, membros: e.target.value } })} /></Field>
              <Field label="Status">
                <select className={inputCls} style={inputStyle} value={modal.data.status} onChange={e => setModal({ ...modal, data: { ...modal.data, status: e.target.value } })}>
                  <option>Ativo</option><option>Inativo</option><option>Novo</option>
                </select>
              </Field>
            </div>
            <Field label="Admin"><input className={inputCls} style={inputStyle} value={modal.data.admin} onChange={e => setModal({ ...modal, data: { ...modal.data, admin: e.target.value } })} /></Field>
            <Field label="Observações"><input className={inputCls} style={inputStyle} value={modal.data.observacoes} onChange={e => setModal({ ...modal, data: { ...modal.data, observacoes: e.target.value } })} /></Field>
            <button type="submit" className="w-full mt-2 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "#25D366" }}>Salvar</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function InstagramView({ items, setItems, table }) {
  const [modal, setModal] = useState(null);
  const reacaoTone = { "Apoiou": "cc-badge-resolvida", "Reagiu": "cc-badge-andamento", "Ignorou": "cc-badge-analise", "Negativo": "cc-badge-cancelada" };

  function openNew() { setModal({ mode: "new", data: { perfil: "", nome: "", seguidores: "", tipo: "Seguidor", reacao: "Reagiu", ultimaInteracao: "", observacoes: "" } }); }
  function openEdit(item) { setModal({ mode: "edit", data: item }); }
  function save(form) {
    const payload = { ...form, seguidores: Number(form.seguidores) || 0 };
    if (modal.mode === "new") table.insert(payload);
    else table.update(form.id, payload);
    setModal(null);
    if (modal.mode !== "new") toast("Alterações salvas");
  }
  function remove(id) { table.remove(id); }

  const apoiaram = items.filter(i => i.reacao === "Apoiou").length;
  const reagiram = items.filter(i => i.reacao === "Reagiu").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Perfis" value={items.length} tone="blue" />
        <StatCard label="Apoiaram" value={apoiaram} tone="green" />
        <StatCard label="Reagiram" value={reagiram} tone="teal" />
      </div>
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}>
          <Plus size={16} /> Novo perfil
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {items.map(p => (
          <div key={p.id} className="cc-card p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(45deg, #f09433, #dc2743, #bc1888)" }}>
                  {p.nome?.[0] || "@"}
                </div>
                <div>
                  <p className="font-semibold text-sm">{p.nome || p.perfil}</p>
                  <p className="text-xs" style={{ color: "var(--ink-500)" }}>@{p.perfil} • {p.tipo}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-2 py-1 rounded-full ${reacaoTone[p.reacao] || "cc-badge-nova"}`}>{p.reacao}</span>
                <IconBtn label="Editar" onClick={() => openEdit(p)}><Pencil size={18} /></IconBtn>
                <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(remove(p.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
              </div>
            </div>
            {p.observacoes && <p className="text-xs" style={{ color: "var(--ink-500)" }}>{p.observacoes}</p>}
          </div>
        ))}
        {items.length === 0 && <EmptyState text="Nenhum perfil cadastrado." />}
      </div>
      {modal && (
        <Modal title={modal.mode === "new" ? "Novo perfil" : "Editar perfil"} onClose={() => setModal(null)}>
          <form onSubmit={e => { e.preventDefault(); save(modal.data); }}>
            <Field label="@ do perfil"><input required className={inputCls} style={inputStyle} value={modal.data.perfil} onChange={e => setModal({ ...modal, data: { ...modal.data, perfil: e.target.value } })} placeholder="usuario123" /></Field>
            <Field label="Nome"><input className={inputCls} style={inputStyle} value={modal.data.nome} onChange={e => setModal({ ...modal, data: { ...modal.data, nome: e.target.value } })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Seguidores"><input type="number" className={inputCls} style={inputStyle} value={modal.data.seguidores} onChange={e => setModal({ ...modal, data: { ...modal.data, seguidores: e.target.value } })} /></Field>
              <Field label="Tipo">
                <select className={inputCls} style={inputStyle} value={modal.data.tipo} onChange={e => setModal({ ...modal, data: { ...modal.data, tipo: e.target.value } })}>
                  <option>Seguidor</option><option>Influenciador</option><option>Página</option><option>Comercial</option>
                </select>
              </Field>
            </div>
            <Field label="Reação">
              <select className={inputCls} style={inputStyle} value={modal.data.reacao} onChange={e => setModal({ ...modal, data: { ...modal.data, reacao: e.target.value } })}>
                <option>Apoiou</option><option>Reagiu</option><option>Ignorou</option><option>Negativo</option>
              </select>
            </Field>
            <Field label="Última interação"><input type="date" className={inputCls} style={inputStyle} value={modal.data.ultimaInteracao} onChange={e => setModal({ ...modal, data: { ...modal.data, ultimaInteracao: e.target.value } })} /></Field>
            <Field label="Observações"><input className={inputCls} style={inputStyle} value={modal.data.observacoes} onChange={e => setModal({ ...modal, data: { ...modal.data, observacoes: e.target.value } })} /></Field>
            <button type="submit" className="w-full mt-2 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "linear-gradient(45deg, #f09433, #dc2743, #bc1888)" }}>Salvar</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function VisitaCasaView({ items, setItems, table }) {
  const [modal, setModal] = useState(null);
  const reacaoIcon = { "Apoia": ThumbsUp, "Indeciso": Minus, "Não apoia": ThumbsDown };
  const reacaoTone = { "Apoia": "cc-badge-resolvida", "Indeciso": "cc-badge-analise", "Não apoia": "cc-badge-cancelada" };

  function openNew() { setModal({ mode: "new", data: { morador: "", endereco: "", data: "", hora: "", visitante: "", reacao: "Indeciso", observacoes: "", retornar: false } }); }
  function openEdit(item) { setModal({ mode: "edit", data: item }); }
  function save(form) {
    if (modal.mode === "new") table.insert(form);
    else table.update(form.id, form);
    setModal(null);
    if (modal.mode !== "new") toast("Alterações salvas");
  }
  function remove(id) { table.remove(id); }

  const apoiam = items.filter(v => v.reacao === "Apoia").length;
  const indecisos = items.filter(v => v.reacao === "Indeciso").length;
  const contra = items.filter(v => v.reacao === "Não apoia").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="cc-card p-3 text-center">
          <p className="cc-display font-bold text-xl" style={{ color: "#1E8E5F" }}>{apoiam}</p>
          <div className="flex items-center justify-center gap-1"><ThumbsUp size={12} style={{ color: "#1E8E5F" }} /><span className="text-[11px] font-medium" style={{ color: "#1E8E5F" }}>Apoia</span></div>
        </div>
        <div className="cc-card p-3 text-center">
          <p className="cc-display font-bold text-xl" style={{ color: "#9A6300" }}>{indecisos}</p>
          <div className="flex items-center justify-center gap-1"><Minus size={12} style={{ color: "#9A6300" }} /><span className="text-[11px] font-medium" style={{ color: "#9A6300" }}>Indeciso</span></div>
        </div>
        <div className="cc-card p-3 text-center">
          <p className="cc-display font-bold text-xl" style={{ color: "#B3402C" }}>{contra}</p>
          <div className="flex items-center justify-center gap-1"><ThumbsDown size={12} style={{ color: "#B3402C" }} /><span className="text-[11px] font-medium" style={{ color: "#B3402C" }}>Não apoia</span></div>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>
          <Plus size={16} /> Nova visita
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {items.map(v => {
          const ReacaoIcon = reacaoIcon[v.reacao] || Minus;
          return (
            <div key={v.id} className="cc-card p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: v.reacao === "Apoia" ? "#E6F7EF" : v.reacao === "Não apoia" ? "#FBE9E7" : "#FFF3DC" }}>
                    <ReacaoIcon size={18} style={{ color: v.reacao === "Apoia" ? "#1E8E5F" : v.reacao === "Não apoia" ? "#B3402C" : "#9A6300" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{v.morador}</p>
                    <p className="text-xs" style={{ color: "var(--ink-500)" }}>{v.endereco}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${reacaoTone[v.reacao] || "cc-badge-nova"}`}>{v.reacao}</span>
                  <IconBtn label="Editar" onClick={() => openEdit(v)}><Pencil size={18} /></IconBtn>
                  <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(remove(v.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--ink-500)" }}>
                <span>{v.data} • {v.hora}</span>
                <span>Visitante: {v.visitante}</span>
              </div>
              {v.retornar && <span className="text-xs px-2 py-0.5 rounded-full w-fit font-medium" style={{ background: "#EAF1FE", color: "var(--blue-600)" }}>Retornar</span>}
              {v.observacoes && <p className="text-xs pt-1 border-t" style={{ borderColor: "var(--border)", color: "var(--ink-500)" }}>{v.observacoes}</p>}
            </div>
          );
        })}
        {items.length === 0 && <EmptyState text="Nenhuma visita de casa registrada." />}
      </div>
      {modal && (
        <Modal title={modal.mode === "new" ? "Nova visita de casa" : "Editar visita"} onClose={() => setModal(null)}>
          <form onSubmit={e => { e.preventDefault(); save(modal.data); }}>
            <Field label="Nome do morador"><input required className={inputCls} style={inputStyle} value={modal.data.morador} onChange={e => setModal({ ...modal, data: { ...modal.data, morador: e.target.value } })} /></Field>
            <Field label="Endereço"><input required className={inputCls} style={inputStyle} value={modal.data.endereco} onChange={e => setModal({ ...modal, data: { ...modal.data, endereco: e.target.value } })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data"><input type="date" required className={inputCls} style={inputStyle} value={modal.data.data} onChange={e => setModal({ ...modal, data: { ...modal.data, data: e.target.value } })} /></Field>
              <Field label="Hora"><input type="time" className={inputCls} style={inputStyle} value={modal.data.hora} onChange={e => setModal({ ...modal, data: { ...modal.data, hora: e.target.value } })} /></Field>
            </div>
            <Field label="Visitante"><input className={inputCls} style={inputStyle} value={modal.data.visitante} onChange={e => setModal({ ...modal, data: { ...modal.data, visitante: e.target.value } })} /></Field>
            <Field label="Reação">
              <select className={inputCls} style={inputStyle} value={modal.data.reacao} onChange={e => setModal({ ...modal, data: { ...modal.data, reacao: e.target.value } })}>
                <option>Apoia</option><option>Indeciso</option><option>Não apoia</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm mb-3 cursor-pointer">
              <input type="checkbox" checked={modal.data.retornar || false} onChange={e => setModal({ ...modal, data: { ...modal.data, retornar: e.target.checked } })} />
              <span style={{ color: "var(--ink-500)" }}>Precisa retornar</span>
            </label>
            <Field label="Observações"><input className={inputCls} style={inputStyle} value={modal.data.observacoes} onChange={e => setModal({ ...modal, data: { ...modal.data, observacoes: e.target.value } })} /></Field>
            <button type="submit" className="w-full mt-2 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>Salvar</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function VotacaoPublicaView({ candidatosConfig, candidatosConfigKV, votosTable }) {
  const [editMode, setEditMode] = useState(false);
  const [votos, setVotos] = useState({});
  const [votou, setVotou] = useState(() => localStorage.getItem("cc_votou") === "1");
  const [verResultados, setVerResultados] = useState(false);

  function getDeviceId() {
    let id = localStorage.getItem("cc_device_id");
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
      localStorage.setItem("cc_device_id", id);
    }
    return id;
  }

  const jaVotou = votou || localStorage.getItem("cc_votou") === "1";

  const config = candidatosConfig || {};

  function getCandidatos(cargo) {
    return config[cargo] || [];
  }

  function addCandidato(cargo) {
    const lista = [...getCandidatos(cargo), { numero: "", nome: "", partido: "" }];
    candidatosConfigKV.setValue(cargo, lista);
  }
  function removeCandidato(cargo, idx) {
    const lista = getCandidatos(cargo).filter((_, i) => i !== idx);
    candidatosConfigKV.setValue(cargo, lista);
  }
  function updateCandidato(cargo, idx, field, value) {
    const lista = getCandidatos(cargo).map((c, i) => i === idx ? { ...c, [field]: value } : c);
    candidatosConfigKV.setValue(cargo, lista);
  }

  function selecionarVoto(cargo, numero) {
    setVotos(prev => ({ ...prev, [cargo]: prev[cargo] === numero ? null : numero }));
  }

  async function confirmarVoto() {
    const deviceId = getDeviceId();
    const payload = { ...votos, dataVoto: new Date().toISOString(), deviceId };
    await votosTable.insert(payload);
    localStorage.setItem("cc_votou", "1");
    setVotou(true);
  }

  const todosVotos = votosTable.items || [];

  if (jaVotou) {
    return (
      <div className="flex flex-col gap-4">
        <div className="cc-card p-8 text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#E6F7EF" }}>
            <ThumbsUp size={32} style={{ color: "#1E8E5F" }} />
          </div>
          <h3 className="cc-display font-bold text-lg">Voto registrado!</h3>
          <p className="text-sm" style={{ color: "var(--ink-500)" }}>Obrigado por participar. Seu voto é anônimo e único por dispositivo.</p>
          <button onClick={() => setVerResultados(true)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>Ver resultados</button>
        </div>
      </div>
    );
  }

  if (verResultados) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="cc-display font-semibold text-base">Resultados da pesquisa</h3>
          <button onClick={() => setVerResultados(false)} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--border)" }}>Voltar</button>
        </div>
        <div className="cc-card p-3 text-center" style={{ background: "#EAF1FE" }}>
          <p className="cc-display font-bold text-2xl" style={{ color: "var(--blue-600)" }}>{todosVotos.length}</p>
          <p className="text-xs font-medium" style={{ color: "var(--blue-600)" }}>votos registrados</p>
        </div>
        {CARGOS.map(cargo => {
          const cands = getCandidatos(cargo);
          if (cands.length === 0) return null;
          const votosCargoTotal = todosVotos.filter(v => v[cargo]).length;
          return (
            <div key={cargo} className="cc-card p-4 flex flex-col gap-3">
              <h4 className="cc-display font-semibold text-sm">{cargo}</h4>
              {cands.map(c => {
                const count = todosVotos.filter(v => v[cargo] === c.numero).length;
                const pct = votosCargoTotal ? Math.round((count / votosCargoTotal) * 100) : 0;
                return (
                  <div key={c.numero} className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#EAF1FE", color: "var(--blue-600)" }}>{c.numero}</span>
                    <div className="flex-1">
                      <p className="text-xs font-medium">{c.nome} <span style={{ color: "var(--ink-300)" }}>({c.partido})</span></p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2.5 rounded-full" style={{ background: "var(--border)" }}>
                          <div className="h-2.5 rounded-full" style={{ width: `${pct}%`, background: "var(--blue-600)" }} />
                        </div>
                        <span className="text-xs font-bold cc-display w-16 text-right">{pct}% ({count})</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="cc-display font-semibold text-base">Votação</h3>
          <p className="text-xs" style={{ color: "var(--ink-500)" }}>Escolha seu candidato por número — voto anônimo</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => {
            const url = window.location.origin + window.location.pathname + "?votacao=1";
            if (navigator.share) navigator.share({ title: "Votação Pública - Ivatuba", url });
            else { navigator.clipboard.writeText(url); alert("Link copiado!"); }
          }} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--border)" }}>
            <Share2 size={13} />
          </button>
          <button onClick={() => setVerResultados(true)} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--border)" }}>
            Resultados ({todosVotos.length})
          </button>
          <button onClick={() => setEditMode(!editMode)} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: editMode ? "var(--blue-600)" : "var(--border)", color: editMode ? "#fff" : "var(--ink-500)" }}>
            <Settings size={13} />
          </button>
        </div>
      </div>

      {editMode && (
        <div className="cc-card p-4 flex flex-col gap-4" style={{ background: "#FFF3DC" }}>
          <p className="text-xs font-medium" style={{ color: "#9A6300" }}>Configurar candidatos por cargo</p>
          {CARGOS.map(cargo => (
            <div key={cargo} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{cargo}</span>
                <button onClick={() => addCandidato(cargo)} className="text-xs flex items-center gap-1 font-medium" style={{ color: "var(--blue-600)" }}>
                  <Plus size={12} /> Candidato
                </button>
              </div>
              {getCandidatos(cargo).map((c, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input placeholder="Nº" className={inputCls} style={{ ...inputStyle, width: "4rem" }} value={c.numero} onChange={e => updateCandidato(cargo, idx, "numero", e.target.value)} />
                  <input placeholder="Nome" className={inputCls} style={{ ...inputStyle, flex: 1 }} value={c.nome} onChange={e => updateCandidato(cargo, idx, "nome", e.target.value)} />
                  <input placeholder="Partido" className={inputCls} style={{ ...inputStyle, width: "5rem" }} value={c.partido} onChange={e => updateCandidato(cargo, idx, "partido", e.target.value)} />
                  <IconBtn danger label="Remover" onClick={() => removeCandidato(cargo, idx)}><Trash2 size={18} /></IconBtn>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {!editMode && CARGOS.map(cargo => {
        const cands = getCandidatos(cargo);
        if (cands.length === 0) return null;
        const selected = votos[cargo];
        return (
          <div key={cargo} className="cc-card p-4 flex flex-col gap-3">
            <h4 className="cc-display font-semibold text-sm">{cargo}</h4>
            <div className="grid grid-cols-2 gap-2">
              {cands.map(c => {
                const isSelected = selected === c.numero;
                return (
                  <button key={c.numero} onClick={() => selecionarVoto(cargo, c.numero)}
                    className="flex items-center gap-2 p-3 rounded-xl border-2 text-left"
                    style={{ borderColor: isSelected ? "var(--blue-600)" : "var(--border)", background: isSelected ? "#EAF1FE" : "transparent" }}>
                    <span className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: isSelected ? "var(--blue-600)" : "var(--border)", color: isSelected ? "#fff" : "var(--ink-500)" }}>
                      {c.numero}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{c.nome}</p>
                      <p className="text-[10px]" style={{ color: "var(--ink-500)" }}>{c.partido}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {!editMode && Object.keys(votos).filter(k => votos[k]).length > 0 && (
        <button onClick={confirmarVoto}
          className="w-full py-3 rounded-xl text-sm font-bold text-white"
          style={{ background: "var(--green-500)" }}>
          Confirmar voto
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cabos Eleitorais
// ---------------------------------------------------------------------------
function CabosEleitoraisView({ items, setItems, table }) {
  const [form, setForm] = useState(null);
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function salvar() {
    if (!form.nome) return;
    if (form.id) { await table.update(form); setItems(prev => prev.map(i => i.id === form.id ? form : i)); }
    else { const n = await table.insert({ ...form, id: undefined }); setItems(prev => [...prev, n || { ...form, id: Date.now() }]); }
    setForm(null);
  }
  async function remover(id) { await table.remove(id); setItems(prev => prev.filter(i => i.id !== id)); }

  const totalMeta = items.reduce((s, c) => s + (Number(c.meta) || 0), 0);
  const totalContatos = items.reduce((s, c) => s + (Number(c.contatosRealizados) || 0), 0);

  if (form) return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="cc-display font-semibold text-base">{form.id ? "Editar" : "Novo"} Cabo Eleitoral</h3>
        <button onClick={() => setForm(null)} className="p-1"><X size={18} /></button>
      </div>
      <div className="cc-card p-4 flex flex-col gap-3">
        <input placeholder="Nome *" className={inputCls} style={inputStyle} value={form.nome || ""} onChange={e => f("nome", e.target.value)} />
        <input placeholder="Telefone" className={inputCls} style={inputStyle} value={form.telefone || ""} onChange={e => f("telefone", e.target.value)} />
        <input placeholder="Meta de contatos" type="number" className={inputCls} style={inputStyle} value={form.meta || ""} onChange={e => f("meta", e.target.value)} />
        <input placeholder="Contatos realizados" type="number" className={inputCls} style={inputStyle} value={form.contatosRealizados || ""} onChange={e => f("contatosRealizados", e.target.value)} />
        <select className={inputCls} style={inputStyle} value={form.status || "Ativo"} onChange={e => f("status", e.target.value)}>
          <option>Ativo</option><option>Inativo</option>
        </select>
        <textarea placeholder="Observações" className={inputCls} style={inputStyle} rows={2} value={form.observacoes || ""} onChange={e => f("observacoes", e.target.value)} />
        <button onClick={salvar} className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "var(--blue-600)" }}>Salvar</button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="cc-display font-semibold text-base">Cabos Eleitorais</h3>
        <button onClick={() => setForm({ nome: "", telefone: "", meta: 50, contatosRealizados: 0, status: "Ativo", observacoes: "" })}
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "var(--blue-600)" }}>
          <Plus size={14} /> Novo
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="cc-card p-3 text-center">
          <p className="cc-display font-bold text-xl">{items.length}</p>
          <p className="text-[10px] font-medium" style={{ color: "var(--ink-500)" }}>Cabos ativos</p>
        </div>
        <div className="cc-card p-3 text-center">
          <p className="cc-display font-bold text-xl">{totalContatos}<span className="text-sm font-normal" style={{ color: "var(--ink-300)" }}>/{totalMeta}</span></p>
          <p className="text-[10px] font-medium" style={{ color: "var(--ink-500)" }}>Contatos/Meta</p>
        </div>
      </div>
      {items.map(c => {
        const pct = c.meta ? Math.min(100, Math.round(((Number(c.contatosRealizados) || 0) / Number(c.meta)) * 100)) : 0;
        return (
          <div key={c.id} className="cc-card p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{c.nome}</p>
                <p className="text-[10px]" style={{ color: "var(--ink-500)" }}>{c.telefone}</p>
              </div>
              <div className="flex gap-1">
                <IconBtn label="Editar" onClick={() => setForm(c)}><Pencil size={18} /></IconBtn>
                <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(remover(c.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2.5 rounded-full" style={{ background: "var(--border)" }}>
                <div className="h-2.5 rounded-full" style={{ width: `${pct}%`, background: pct >= 80 ? "var(--green-500)" : pct >= 50 ? "var(--amber-500)" : "var(--blue-600)" }} />
              </div>
              <span className="text-xs font-bold cc-display w-20 text-right">{pct}% ({c.contatosRealizados || 0}/{c.meta || 0})</span>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full w-fit ${c.status === "Ativo" ? "cc-badge-resolvida" : "cc-badge-cancelada"}`}>{c.status}</span>
          </div>
        );
      })}
      {items.length === 0 && <p className="text-sm text-center py-8" style={{ color: "var(--ink-300)" }}>Nenhum cabo eleitoral cadastrado</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dia D - Painel da Eleição
// ---------------------------------------------------------------------------
function DiaDView({ eleitores, cabos, fiscaisTable }) {
  const [form, setForm] = useState(null);
  const fiscais = fiscaisTable.items || [];
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function salvar() {
    if (!form.nome) return;
    if (form.id) { await fiscaisTable.update(form); fiscaisTable.setItems(prev => prev.map(i => i.id === form.id ? form : i)); }
    else { const n = await fiscaisTable.insert({ ...form, id: undefined }); fiscaisTable.setItems(prev => [...prev, n || { ...form, id: Date.now() }]); }
    setForm(null);
  }
  async function remover(id) { await fiscaisTable.remove(id); fiscaisTable.setItems(prev => prev.filter(i => i.id !== id)); }
  function marcarVotou(id) {
    const f2 = fiscais.find(f3 => f3.id === id);
    if (f2) { const upd = { ...f2, votou: !f2.votou }; fiscaisTable.update(upd); fiscaisTable.setItems(prev => prev.map(i => i.id === id ? upd : i)); }
  }

  const totalConfirmados = eleitores.filter(e => e.status === "Confirmado").length;
  const totalVotaram = fiscais.filter(f2 => f2.tipo === "eleitor" && f2.votou).length;
  const fiscaisSecao = fiscais.filter(f2 => f2.tipo === "fiscal");
  const eleitoresDiaD = fiscais.filter(f2 => f2.tipo === "eleitor");

  if (form) return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="cc-display font-semibold text-base">{form.id ? "Editar" : "Novo"}</h3>
        <button onClick={() => setForm(null)} className="p-1"><X size={18} /></button>
      </div>
      <div className="cc-card p-4 flex flex-col gap-3">
        <input placeholder="Nome *" className={inputCls} style={inputStyle} value={form.nome || ""} onChange={e => f("nome", e.target.value)} />
        <input placeholder="Telefone" className={inputCls} style={inputStyle} value={form.telefone || ""} onChange={e => f("telefone", e.target.value)} />
        <select className={inputCls} style={inputStyle} value={form.tipo || "fiscal"} onChange={e => f("tipo", e.target.value)}>
          <option value="fiscal">Fiscal de seção</option>
          <option value="eleitor">Eleitor (acompanhar voto)</option>
        </select>
        <input placeholder="Seção eleitoral" className={inputCls} style={inputStyle} value={form.secao || ""} onChange={e => f("secao", e.target.value)} />
        <input placeholder="Local de votação" className={inputCls} style={inputStyle} value={form.local || ""} onChange={e => f("local", e.target.value)} />
        <textarea placeholder="Observações" className={inputCls} style={inputStyle} rows={2} value={form.observacoes || ""} onChange={e => f("observacoes", e.target.value)} />
        <button onClick={salvar} className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "var(--blue-600)" }}>Salvar</button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="cc-display font-semibold text-base">Dia D — Eleição</h3>
        <button onClick={() => setForm({ nome: "", telefone: "", tipo: "fiscal", secao: "", local: "", observacoes: "", votou: false })}
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "var(--blue-600)" }}>
          <Plus size={14} /> Novo
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="cc-card p-3 text-center">
          <p className="cc-display font-bold text-xl" style={{ color: "var(--blue-600)" }}>{fiscaisSecao.length}</p>
          <p className="text-[10px] font-medium" style={{ color: "var(--ink-500)" }}>Fiscais</p>
        </div>
        <div className="cc-card p-3 text-center">
          <p className="cc-display font-bold text-xl" style={{ color: "var(--green-500)" }}>{totalVotaram}</p>
          <p className="text-[10px] font-medium" style={{ color: "var(--ink-500)" }}>Já votaram</p>
        </div>
        <div className="cc-card p-3 text-center">
          <p className="cc-display font-bold text-xl">{eleitoresDiaD.length}</p>
          <p className="text-[10px] font-medium" style={{ color: "var(--ink-500)" }}>Acompanhando</p>
        </div>
      </div>

      {fiscaisSecao.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--ink-500)" }}><Shield size={12} /> Fiscais de seção</h4>
          {fiscaisSecao.map(f2 => (
            <div key={f2.id} className="cc-card p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{f2.nome}</p>
                <p className="text-[10px]" style={{ color: "var(--ink-500)" }}>Seção {f2.secao} • {f2.local} • {f2.telefone}</p>
              </div>
              <div className="flex gap-1">
                <IconBtn label="Editar" onClick={() => setForm(f2)}><Pencil size={18} /></IconBtn>
                <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(remover(f2.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
              </div>
            </div>
          ))}
        </div>
      )}

      {eleitoresDiaD.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--ink-500)" }}><UserCheck size={12} /> Acompanhamento de eleitores</h4>
          {eleitoresDiaD.map(f2 => (
            <div key={f2.id} className="cc-card p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => marcarVotou(f2.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center border-2"
                  style={{ borderColor: f2.votou ? "var(--green-500)" : "var(--border)", background: f2.votou ? "#E6F7EF" : "transparent" }}>
                  {f2.votou && <CheckSquare size={14} style={{ color: "var(--green-500)" }} />}
                </button>
                <div>
                  <p className={`text-sm font-semibold ${f2.votou ? "line-through" : ""}`} style={f2.votou ? { color: "var(--ink-300)" } : {}}>{f2.nome}</p>
                  <p className="text-[10px]" style={{ color: "var(--ink-500)" }}>Seção {f2.secao} • {f2.telefone}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <IconBtn label="Editar" onClick={() => setForm(f2)}><Pencil size={18} /></IconBtn>
                <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(remover(f2.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
              </div>
            </div>
          ))}
        </div>
      )}

      {fiscais.length === 0 && <p className="text-sm text-center py-8" style={{ color: "var(--ink-300)" }}>Cadastre fiscais e eleitores para acompanhar no dia da eleição</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Histórico de Contato
// ---------------------------------------------------------------------------
function HistoricoContatoView({ eleitores, setEleitores, eleitoresTable, historicoTable }) {
  const [selecionado, setSelecionado] = useState(null);
  const [form, setForm] = useState(null);
  const [busca, setBusca] = useState("");
  const historico = historicoTable.items || [];

  const filtrados = eleitores.filter(e => !busca || e.nome.toLowerCase().includes(busca.toLowerCase()));
  const historicoEleitor = selecionado ? historico.filter(h => h.eleitorId === selecionado.id) : [];

  async function salvarContato() {
    if (!form.descricao) return;
    const novo = { ...form, eleitorId: selecionado.id, id: undefined };
    const n = await historicoTable.insert(novo);
    historicoTable.setItems(prev => [...prev, n || { ...novo, id: Date.now() }]);
    setForm(null);
  }
  async function removerContato(id) { await historicoTable.remove(id); historicoTable.setItems(prev => prev.filter(i => i.id !== id)); }

  if (selecionado) return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => setSelecionado(null)} className="text-xs font-medium mb-1" style={{ color: "var(--blue-600)" }}>← Voltar</button>
          <h3 className="cc-display font-semibold text-base">{selecionado.nome}</h3>
          <p className="text-[10px]" style={{ color: "var(--ink-500)" }}>{selecionado.telefone}</p>
        </div>
        <button onClick={() => setForm({ data: new Date().toISOString().slice(0, 10), tipo: "WhatsApp", descricao: "" })}
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "var(--blue-600)" }}>
          <Plus size={14} /> Contato
        </button>
      </div>

      {form && (
        <div className="cc-card p-4 flex flex-col gap-3">
          <input type="date" className={inputCls} style={inputStyle} value={form.data || ""} onChange={e => setForm(prev => ({ ...prev, data: e.target.value }))} />
          <select className={inputCls} style={inputStyle} value={form.tipo || ""} onChange={e => setForm(prev => ({ ...prev, tipo: e.target.value }))}>
            <option>WhatsApp</option><option>Telefone</option><option>Presencial</option><option>Visita</option>
          </select>
          <textarea placeholder="O que foi conversado" className={inputCls} style={inputStyle} rows={3} value={form.descricao || ""} onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={() => setForm(null)} className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--border)" }}>Cancelar</button>
            <button onClick={salvarContato} className="flex-1 py-2 rounded-xl text-sm font-bold text-white" style={{ background: "var(--blue-600)" }}>Salvar</button>
          </div>
        </div>
      )}

      {historicoEleitor.sort((a, b) => (b.data || "").localeCompare(a.data || "")).map(h => (
        <div key={h.id} className="cc-card p-3 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center mt-0.5" style={{ background: "#EAF1FE" }}>
              <MessageSquare size={14} style={{ color: "var(--blue-600)" }} />
            </div>
            <div>
              <p className="text-xs font-semibold">{h.tipo} <span className="font-normal" style={{ color: "var(--ink-300)" }}>• {h.data}</span></p>
              <p className="text-xs mt-1" style={{ color: "var(--ink-500)" }}>{h.descricao}</p>
            </div>
          </div>
          <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(removerContato(h.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
        </div>
      ))}
      {historicoEleitor.length === 0 && !form && <p className="text-sm text-center py-6" style={{ color: "var(--ink-300)" }}>Nenhum contato registrado</p>}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <h3 className="cc-display font-semibold text-base">Histórico de Contato</h3>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-300)" }} />
        <input placeholder="Buscar eleitor..." className={inputCls} style={{ ...inputStyle, paddingLeft: "2.2rem" }} value={busca} onChange={e => setBusca(e.target.value)} />
      </div>
      {filtrados.slice(0, 30).map(e => {
        const ultimo = historico.filter(h => h.eleitorId === e.id).sort((a, b) => (b.data || "").localeCompare(a.data || ""))[0];
        return (
          <button key={e.id} onClick={() => setSelecionado(e)} className="cc-card p-3 flex items-center justify-between text-left w-full">
            <div>
              <p className="text-sm font-semibold">{e.nome}</p>
              <p className="text-[10px]" style={{ color: "var(--ink-500)" }}>{e.telefone}</p>
              {ultimo && <p className="text-[10px] mt-1" style={{ color: "var(--blue-600)" }}>Último: {ultimo.tipo} em {ultimo.data}</p>}
            </div>
            <ChevronRight size={16} style={{ color: "var(--ink-300)" }} />
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exportar Dados
// ---------------------------------------------------------------------------
function ExportarView({ eleitores, cabos, liderancas }) {
  function exportCSV(data, filename, headers) {
    const bom = "﻿";
    const csv = bom + headers.join(";") + "\n" + data.map(row => headers.map(h => {
      const val = row[h] ?? "";
      return typeof val === "object" ? JSON.stringify(val) : String(val).replace(/;/g, ",");
    }).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  const exports = [
    { label: "Eleitores", desc: `${eleitores.length} registros`, icon: Users, action: () => exportCSV(eleitores, "eleitores_ivatuba.csv", ["nome", "telefone", "categoria", "status", "lideranca", "tags", "cadastro"]) },
    { label: "Cabos Eleitorais", desc: `${cabos.length} registros`, icon: Target, action: () => exportCSV(cabos, "cabos_eleitorais.csv", ["nome", "telefone", "meta", "contatosRealizados", "status"]) },
    { label: "Lideranças", desc: `${liderancas.length} registros`, icon: Crown, action: () => exportCSV(liderancas, "liderancas.csv", ["nome", "telefone", "apoiadores"]) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h3 className="cc-display font-semibold text-base">Exportar Dados</h3>
      <p className="text-xs" style={{ color: "var(--ink-500)" }}>Baixe os dados em formato CSV (abre no Excel)</p>
      {exports.map(exp => {
        const Icon = exp.icon;
        return (
          <button key={exp.label} onClick={exp.action} className="cc-card p-4 flex items-center gap-4 text-left w-full">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#EAF1FE" }}>
              <Icon size={20} style={{ color: "var(--blue-600)" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{exp.label}</p>
              <p className="text-[10px]" style={{ color: "var(--ink-500)" }}>{exp.desc}</p>
            </div>
            <Download size={18} style={{ color: "var(--blue-600)" }} />
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Propostas de Deputados
// ---------------------------------------------------------------------------
const AREAS_ATUACAO = ["Saúde", "Educação", "Infraestrutura", "Agricultura", "Esporte", "Assistência Social", "Segurança", "Turismo", "Cultura", "Desenvolvimento Econômico", "Meio Ambiente", "Obras"];
const STATUS_PROPOSTA_DEP = ["Proposta", "Em análise", "Em andamento", "Aprovada", "Executada", "Concluída", "Cancelada"];
const STATUS_ACAO_DEP = ["Planejada", "Em andamento", "Concluída", "Cancelada"];
const PARTIDOS = ["PL", "PT", "MDB", "PP", "UNIÃO", "PSD", "REPUBLICANOS", "PDT", "PSDB", "PODE", "PSB", "AVANTE", "CIDADANIA", "SOLIDARIEDADE", "NOVO", "PSOL", "REDE", "PCdoB", "PV", "Outro"];
const CARGO_DEP = ["Deputado Estadual", "Deputado Federal", "Senador"];

function badgePropDep(status) {
  const map = { "Proposta": "cc-badge-nova", "Em análise": "cc-badge-analise", "Em andamento": "cc-badge-andamento", "Aprovada": "cc-badge-resolvida", "Executada": "cc-badge-resolvida", "Concluída": "cc-badge-resolvida", "Cancelada": "cc-badge-cancelada" };
  return map[status] || "cc-badge-nova";
}

function badgeAcaoDep(status) {
  const map = { "Planejada": "cc-badge-nova", "Em andamento": "cc-badge-andamento", "Concluída": "cc-badge-resolvida", "Cancelada": "cc-badge-cancelada" };
  return map[status] || "cc-badge-nova";
}

function DeputadosView({ deputadosTable, acoesTable, propostasTable }) {
  const deputados = deputadosTable.items;
  const acoes = acoesTable.items;
  const propostas = propostasTable.items;

  const [subView, setSubView] = useState("lista");
  const [selecionado, setSelecionado] = useState(null);
  const [detalheTab, setDetalheTab] = useState("perfil");
  const [busca, setBusca] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editDep, setEditDep] = useState(null);
  const [showAcaoForm, setShowAcaoForm] = useState(false);
  const [editAcao, setEditAcao] = useState(null);
  const [showPropForm, setShowPropForm] = useState(false);
  const [editProp, setEditProp] = useState(null);
  const publicoRef = useRef(null);

  const depVazio = { nome: "", partido: "", cargo: "Deputado Estadual", estado: "PR", municipios: CIDADE_REDUTO, foto: "", biografia: "", email: "", telefone: "", instagram: "", facebook: "", mandatoInicio: "", mandatoFim: "" };
  const acaoVazia = { deputadoId: "", titulo: "", descricao: "", categoria: "Saúde", municipio: CIDADE_REDUTO, data: new Date().toISOString().slice(0, 10), valor: "", status: "Planejada", evidencia: "" };
  const propVazia = { deputadoId: "", titulo: "", descricao: "", area: "Saúde", status: "Proposta", dataApresentacao: new Date().toISOString().slice(0, 10), impacto: "" };

  const [formDep, setFormDep] = useState(depVazio);
  const [formAcao, setFormAcao] = useState(acaoVazia);
  const [formProp, setFormProp] = useState(propVazia);

  function salvarDeputado() {
    if (!formDep.nome.trim()) return;
    if (editDep) {
      deputadosTable.update(editDep.id, formDep);
    } else {
      deputadosTable.insert(formDep);
    }
    setShowForm(false); setEditDep(null); setFormDep(depVazio);
  }
  function excluirDeputado(id) {
    deputadosTable.remove(id);
    acoes.filter(a => a.deputadoId === id).forEach(a => acoesTable.remove(a.id));
    propostas.filter(p => p.deputadoId === id).forEach(p => propostasTable.remove(p.id));
    if (selecionado?.id === id) { setSelecionado(null); setSubView("lista"); }
  }
  function iniciarEdicaoDep(dep) { setFormDep({ ...dep }); setEditDep(dep); setShowForm(true); }

  function salvarAcao() {
    if (!formAcao.titulo.trim()) return;
    const payload = { ...formAcao, deputadoId: selecionado.id, valor: formAcao.valor ? Number(formAcao.valor) : 0 };
    if (editAcao) { acoesTable.update(editAcao.id, payload); }
    else { acoesTable.insert(payload); }
    setShowAcaoForm(false); setEditAcao(null); setFormAcao(acaoVazia);
  }
  function excluirAcao(id) { acoesTable.remove(id); }

  function salvarProposta() {
    if (!formProp.titulo.trim()) return;
    const payload = { ...formProp, deputadoId: selecionado.id };
    if (editProp) { propostasTable.update(editProp.id, payload); }
    else { propostasTable.insert(payload); }
    setShowPropForm(false); setEditProp(null); setFormProp(propVazia);
  }
  function excluirProposta(id) { propostasTable.remove(id); }

  async function gerarPDF(dep) {
    const { default: jsPDF } = await import("jspdf");
    const depAcoes = acoes.filter(a => a.deputadoId === dep.id);
    const depProps = propostas.filter(p => p.deputadoId === dep.id);
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18); doc.setFont(undefined, "bold");
    doc.text(dep.nome, 105, y, { align: "center" }); y += 8;
    doc.setFontSize(11); doc.setFont(undefined, "normal");
    doc.text(`${dep.cargo} - ${dep.partido} | ${dep.estado}`, 105, y, { align: "center" }); y += 12;
    if (dep.biografia) { doc.setFontSize(10); const lines = doc.splitTextToSize(dep.biografia, 170); doc.text(lines, 20, y); y += lines.length * 5 + 8; }
    if (depAcoes.length) {
      doc.setFontSize(14); doc.setFont(undefined, "bold"); doc.text("Ações Realizadas", 20, y); y += 8;
      doc.setFontSize(10); doc.setFont(undefined, "normal");
      depAcoes.forEach(a => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`• ${a.titulo} (${a.categoria}) - ${a.status}`, 25, y); y += 5;
        if (a.descricao) { const dl = doc.splitTextToSize(a.descricao, 155); doc.text(dl, 30, y); y += dl.length * 5; }
        if (a.valor) { doc.text(`  Recurso: R$ ${Number(a.valor).toLocaleString("pt-BR")}`, 30, y); y += 5; }
        y += 3;
      });
      y += 5;
    }
    if (depProps.length) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(14); doc.setFont(undefined, "bold"); doc.text("Propostas", 20, y); y += 8;
      doc.setFontSize(10); doc.setFont(undefined, "normal");
      depProps.forEach(p => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`• ${p.titulo} [${p.status}] - ${p.area}`, 25, y); y += 5;
        if (p.descricao) { const dl = doc.splitTextToSize(p.descricao, 155); doc.text(dl, 30, y); y += dl.length * 5; }
        y += 3;
      });
    }
    doc.setFontSize(8); doc.text(`Gerado por CONecta Campanha em ${new Date().toLocaleDateString("pt-BR")}`, 105, 290, { align: "center" });
    doc.save(`${dep.nome.replace(/\s+/g, "_")}_propostas.pdf`);
  }

  function compartilhar(dep) {
    const depProps = propostas.filter(p => p.deputadoId === dep.id);
    const depAcoes = acoes.filter(a => a.deputadoId === dep.id);
    const text = `📋 *${dep.nome}*\n${dep.cargo} - ${dep.partido}\n\n` +
      (depAcoes.length ? `✅ ${depAcoes.filter(a => a.status === "Concluída").length} ações concluídas\n` : "") +
      (depProps.length ? `📝 ${depProps.length} propostas apresentadas\n` : "") +
      `\nVeja mais no CONecta Campanha!`;
    if (navigator.share) { navigator.share({ title: dep.nome, text }); }
    else { navigator.clipboard.writeText(text); alert("Copiado!"); }
  }

  const depsFiltrados = useMemo(() => deputados.filter(d => !busca || d.nome?.toLowerCase().includes(busca.toLowerCase()) || d.partido?.toLowerCase().includes(busca.toLowerCase())), [deputados, busca]);

  // ---- Formulário Deputado ----
  const formDeputadoUI = showForm && (
    <div className="cc-card p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold">{editDep ? "Editar Deputado" : "Novo Deputado"}</h4>
        <button onClick={() => { setShowForm(false); setEditDep(null); setFormDep(depVazio); }}><X size={16} /></button>
      </div>
      <input placeholder="Nome completo *" className={inputCls} style={inputStyle} value={formDep.nome} onChange={e => setFormDep(p => ({ ...p, nome: e.target.value }))} />
      <div className="grid grid-cols-2 gap-2">
        <select className={inputCls} style={inputStyle} value={formDep.partido} onChange={e => setFormDep(p => ({ ...p, partido: e.target.value }))}>
          <option value="">Partido</option>
          {PARTIDOS.map(p => <option key={p}>{p}</option>)}
        </select>
        <select className={inputCls} style={inputStyle} value={formDep.cargo} onChange={e => setFormDep(p => ({ ...p, cargo: e.target.value }))}>
          {CARGO_DEP.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Estado (UF)" className={inputCls} style={inputStyle} value={formDep.estado} onChange={e => setFormDep(p => ({ ...p, estado: e.target.value }))} />
        <input placeholder="Municípios" className={inputCls} style={inputStyle} value={formDep.municipios} onChange={e => setFormDep(p => ({ ...p, municipios: e.target.value }))} />
      </div>
      <input placeholder="URL da foto" className={inputCls} style={inputStyle} value={formDep.foto} onChange={e => setFormDep(p => ({ ...p, foto: e.target.value }))} />
      <textarea placeholder="Biografia / histórico" className={inputCls} style={{ ...inputStyle, minHeight: 80 }} value={formDep.biografia} onChange={e => setFormDep(p => ({ ...p, biografia: e.target.value }))} />
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="E-mail" className={inputCls} style={inputStyle} value={formDep.email} onChange={e => setFormDep(p => ({ ...p, email: e.target.value }))} />
        <input placeholder="Telefone" className={inputCls} style={inputStyle} value={formDep.telefone} onChange={e => setFormDep(p => ({ ...p, telefone: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Instagram" className={inputCls} style={inputStyle} value={formDep.instagram} onChange={e => setFormDep(p => ({ ...p, instagram: e.target.value }))} />
        <input placeholder="Facebook" className={inputCls} style={inputStyle} value={formDep.facebook} onChange={e => setFormDep(p => ({ ...p, facebook: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="date" className={inputCls} style={inputStyle} value={formDep.mandatoInicio} onChange={e => setFormDep(p => ({ ...p, mandatoInicio: e.target.value }))} />
        <input type="date" className={inputCls} style={inputStyle} value={formDep.mandatoFim} onChange={e => setFormDep(p => ({ ...p, mandatoFim: e.target.value }))} />
      </div>
      <p className="text-[10px]" style={{ color: "var(--ink-500)" }}>Início e fim do mandato</p>
      <button onClick={salvarDeputado} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>{editDep ? "Salvar" : "Cadastrar"}</button>
    </div>
  );

  // ---- Formulário Ação ----
  const formAcaoUI = showAcaoForm && (
    <div className="cc-card p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold">{editAcao ? "Editar Ação" : "Nova Ação"}</h4>
        <button onClick={() => { setShowAcaoForm(false); setEditAcao(null); setFormAcao(acaoVazia); }}><X size={16} /></button>
      </div>
      <input placeholder="Título da ação *" className={inputCls} style={inputStyle} value={formAcao.titulo} onChange={e => setFormAcao(p => ({ ...p, titulo: e.target.value }))} />
      <textarea placeholder="Descrição" className={inputCls} style={{ ...inputStyle, minHeight: 60 }} value={formAcao.descricao} onChange={e => setFormAcao(p => ({ ...p, descricao: e.target.value }))} />
      <div className="grid grid-cols-2 gap-2">
        <select className={inputCls} style={inputStyle} value={formAcao.categoria} onChange={e => setFormAcao(p => ({ ...p, categoria: e.target.value }))}>
          {AREAS_ATUACAO.map(a => <option key={a}>{a}</option>)}
        </select>
        <select className={inputCls} style={inputStyle} value={formAcao.status} onChange={e => setFormAcao(p => ({ ...p, status: e.target.value }))}>
          {STATUS_ACAO_DEP.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="date" className={inputCls} style={inputStyle} value={formAcao.data} onChange={e => setFormAcao(p => ({ ...p, data: e.target.value }))} />
        <input type="number" placeholder="Valor R$" className={inputCls} style={inputStyle} value={formAcao.valor} onChange={e => setFormAcao(p => ({ ...p, valor: e.target.value }))} />
      </div>
      <input placeholder="Município" className={inputCls} style={inputStyle} value={formAcao.municipio} onChange={e => setFormAcao(p => ({ ...p, municipio: e.target.value }))} />
      <input placeholder="Evidência (link ou descrição)" className={inputCls} style={inputStyle} value={formAcao.evidencia} onChange={e => setFormAcao(p => ({ ...p, evidencia: e.target.value }))} />
      <button onClick={salvarAcao} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>{editAcao ? "Salvar" : "Adicionar"}</button>
    </div>
  );

  // ---- Formulário Proposta ----
  const formPropUI = showPropForm && (
    <div className="cc-card p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold">{editProp ? "Editar Proposta" : "Nova Proposta"}</h4>
        <button onClick={() => { setShowPropForm(false); setEditProp(null); setFormProp(propVazia); }}><X size={16} /></button>
      </div>
      <input placeholder="Título da proposta *" className={inputCls} style={inputStyle} value={formProp.titulo} onChange={e => setFormProp(p => ({ ...p, titulo: e.target.value }))} />
      <textarea placeholder="Descrição detalhada" className={inputCls} style={{ ...inputStyle, minHeight: 60 }} value={formProp.descricao} onChange={e => setFormProp(p => ({ ...p, descricao: e.target.value }))} />
      <div className="grid grid-cols-2 gap-2">
        <select className={inputCls} style={inputStyle} value={formProp.area} onChange={e => setFormProp(p => ({ ...p, area: e.target.value }))}>
          {AREAS_ATUACAO.map(a => <option key={a}>{a}</option>)}
        </select>
        <select className={inputCls} style={inputStyle} value={formProp.status} onChange={e => setFormProp(p => ({ ...p, status: e.target.value }))}>
          {STATUS_PROPOSTA_DEP.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <input type="date" className={inputCls} style={inputStyle} value={formProp.dataApresentacao} onChange={e => setFormProp(p => ({ ...p, dataApresentacao: e.target.value }))} />
      <textarea placeholder="Impacto esperado" className={inputCls} style={{ ...inputStyle, minHeight: 50 }} value={formProp.impacto} onChange={e => setFormProp(p => ({ ...p, impacto: e.target.value }))} />
      <button onClick={salvarProposta} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>{editProp ? "Salvar" : "Adicionar"}</button>
    </div>
  );

  // ---- Página Pública (Preview) ----
  function PaginaPublica({ dep }) {
    const depAcoes = acoes.filter(a => a.deputadoId === dep.id);
    const depProps = propostas.filter(p => p.deputadoId === dep.id);
    const totalRecursos = depAcoes.reduce((s, a) => s + (Number(a.valor) || 0), 0);
    const acoesConcluidas = depAcoes.filter(a => a.status === "Concluída").length;
    const areaCount = {};
    depAcoes.forEach(a => { areaCount[a.categoria] = (areaCount[a.categoria] || 0) + 1; });
    const topAreas = Object.entries(areaCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return (
      <div ref={publicoRef} className="flex flex-col gap-0 -mx-4 -mt-4" style={{ background: "var(--paper)" }}>
        {/* Hero */}
        <div className="cc-sash text-white px-5 py-8 relative z-10">
          <div className="flex items-center gap-4">
            {dep.foto ? (
              <img src={dep.foto} alt={dep.nome} className="w-20 h-20 rounded-full object-cover border-2 border-white/30" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: "rgba(255,255,255,0.15)" }}>
                {dep.nome?.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="cc-display text-xl font-bold">{dep.nome}</h1>
              <p className="text-sm opacity-80">{dep.cargo} • {dep.partido}</p>
              <p className="text-xs opacity-60">{dep.estado} {dep.municipios && `• ${dep.municipios}`}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 px-4 -mt-4 relative z-20">
          <div className="cc-card p-3 text-center">
            <p className="cc-display text-lg font-bold" style={{ color: "var(--blue-600)" }}>{depAcoes.length}</p>
            <p className="text-[10px]" style={{ color: "var(--ink-500)" }}>Ações</p>
          </div>
          <div className="cc-card p-3 text-center">
            <p className="cc-display text-lg font-bold" style={{ color: "var(--green-500)" }}>{depProps.length}</p>
            <p className="text-[10px]" style={{ color: "var(--ink-500)" }}>Propostas</p>
          </div>
          <div className="cc-card p-3 text-center">
            <p className="cc-display text-lg font-bold" style={{ color: "var(--amber-500)" }}>{totalRecursos ? `R$${(totalRecursos / 1000).toFixed(0)}k` : "—"}</p>
            <p className="text-[10px]" style={{ color: "var(--ink-500)" }}>Recursos</p>
          </div>
        </div>

        {/* Bio */}
        {dep.biografia && (
          <div className="cc-card mx-4 mt-4 p-4">
            <h3 className="cc-display text-sm font-semibold mb-2">Sobre</h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--ink-500)" }}>{dep.biografia}</p>
          </div>
        )}

        {/* Áreas de atuação */}
        {topAreas.length > 0 && (
          <div className="cc-card mx-4 mt-3 p-4">
            <h3 className="cc-display text-sm font-semibold mb-3">Áreas de Atuação</h3>
            <div className="flex flex-col gap-2">
              {topAreas.map(([area, count]) => (
                <div key={area} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium">{area}</span>
                      <span className="text-[10px]" style={{ color: "var(--ink-500)" }}>{count} {count === 1 ? "ação" : "ações"}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                      <div className="h-full rounded-full" style={{ background: "var(--blue-600)", width: `${Math.min((count / Math.max(...topAreas.map(t => t[1]))) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline de ações */}
        {depAcoes.length > 0 && (
          <div className="cc-card mx-4 mt-3 p-4">
            <h3 className="cc-display text-sm font-semibold mb-3">Ações Realizadas</h3>
            <div className="flex flex-col gap-3">
              {depAcoes.sort((a, b) => (b.data || "").localeCompare(a.data || "")).map(a => (
                <div key={a.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: a.status === "Concluída" ? "var(--green-500)" : "var(--blue-600)" }} />
                    <div className="flex-1 w-px" style={{ background: "var(--border)" }} />
                  </div>
                  <div className="flex-1 pb-3">
                    <p className="text-xs font-semibold">{a.titulo}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[10px]" style={{ color: "var(--ink-500)" }}>{a.data}</span>
                      <span className={`text-[10px] px-1.5 rounded-full ${badgeAcaoDep(a.status)}`}>{a.status}</span>
                    </div>
                    {a.descricao && <p className="text-[10px] mt-1" style={{ color: "var(--ink-500)" }}>{a.descricao}</p>}
                    {a.valor > 0 && <p className="text-[10px] mt-1 font-medium" style={{ color: "var(--green-500)" }}>R$ {Number(a.valor).toLocaleString("pt-BR")}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Propostas */}
        {depProps.length > 0 && (
          <div className="cc-card mx-4 mt-3 p-4">
            <h3 className="cc-display text-sm font-semibold mb-3">Propostas</h3>
            <div className="flex flex-col gap-2">
              {depProps.sort((a, b) => (b.dataApresentacao || "").localeCompare(a.dataApresentacao || "")).map(p => (
                <div key={p.id} className="p-3 rounded-xl" style={{ background: "var(--paper)" }}>
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-semibold flex-1">{p.titulo}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-2 whitespace-nowrap ${badgePropDep(p.status)}`}>{p.status}</span>
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: "var(--ink-500)" }}>{p.area} • {p.dataApresentacao}</p>
                  {p.descricao && <p className="text-[10px] mt-1" style={{ color: "var(--ink-500)" }}>{p.descricao}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contato */}
        <div className="cc-card mx-4 mt-3 mb-4 p-4">
          <h3 className="cc-display text-sm font-semibold mb-3">Contato</h3>
          <div className="flex flex-col gap-2">
            {dep.email && <p className="text-xs flex items-center gap-2"><Send size={12} style={{ color: "var(--blue-600)" }} /> {dep.email}</p>}
            {dep.telefone && <p className="text-xs flex items-center gap-2"><Phone size={12} style={{ color: "var(--blue-600)" }} /> {dep.telefone}</p>}
            {dep.instagram && <p className="text-xs flex items-center gap-2"><Instagram size={12} style={{ color: "var(--blue-600)" }} /> {dep.instagram}</p>}
            {dep.facebook && <p className="text-xs flex items-center gap-2"><Globe size={12} style={{ color: "var(--blue-600)" }} /> {dep.facebook}</p>}
          </div>
          <p className="text-[9px] mt-4 text-center" style={{ color: "var(--ink-300)" }}>Gerado por CONecta Campanha • {CIDADE_REDUTO}</p>
        </div>
      </div>
    );
  }

  // ---- DETALHE DO DEPUTADO ----
  if (subView === "detalhe" && selecionado) {
    const dep = deputados.find(d => d.id === selecionado.id) || selecionado;
    const depAcoes = acoes.filter(a => a.deputadoId === dep.id).sort((a, b) => (b.data || "").localeCompare(a.data || ""));
    const depProps = propostas.filter(p => p.deputadoId === dep.id).sort((a, b) => (b.dataApresentacao || "").localeCompare(a.dataApresentacao || ""));
    const tabs = [
      { key: "perfil", label: "Perfil", icon: Users },
      { key: "acoes", label: "Ações", icon: CheckSquare },
      { key: "propostas", label: "Propostas", icon: FileText },
      { key: "pagina", label: "Página", icon: Globe },
    ];

    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => { setSubView("lista"); setSelecionado(null); setDetalheTab("perfil"); }} className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--blue-600)" }}>
          <ArrowLeft size={16} /> Voltar
        </button>

        {/* Header deputado */}
        <div className="cc-card p-4 flex items-center gap-4">
          {dep.foto ? (
            <img src={dep.foto} alt={dep.nome} className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: "#EAF1FE", color: "var(--blue-600)" }}>
              {dep.nome?.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <h3 className="cc-display font-semibold text-base">{dep.nome}</h3>
            <p className="text-xs" style={{ color: "var(--ink-500)" }}>{dep.cargo} • {dep.partido} • {dep.estado}</p>
          </div>
          <div className="flex gap-1">
            <button onClick={() => gerarPDF(dep)} className="p-2 rounded-lg" style={{ background: "#E6F7EF" }}><Download size={16} style={{ color: "var(--green-500)" }} /></button>
            <button onClick={() => compartilhar(dep)} className="p-2 rounded-lg" style={{ background: "#EAF1FE" }}><Share2 size={16} style={{ color: "var(--blue-600)" }} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = detalheTab === t.key;
            return (
              <button key={t.key} onClick={() => setDetalheTab(t.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap"
                style={{ background: active ? "#EAF1FE" : "transparent", color: active ? "var(--blue-600)" : "var(--ink-500)" }}>
                <Icon size={14} />{t.label}
              </button>
            );
          })}
        </div>

        {/* Tab: Perfil */}
        {detalheTab === "perfil" && (
          <div className="flex flex-col gap-3">
            <div className="cc-card p-4">
              <h4 className="text-xs font-semibold mb-2">Informações</h4>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <span style={{ color: "var(--ink-500)" }}>Cargo</span><span>{dep.cargo}</span>
                <span style={{ color: "var(--ink-500)" }}>Partido</span><span>{dep.partido}</span>
                <span style={{ color: "var(--ink-500)" }}>Estado</span><span>{dep.estado}</span>
                <span style={{ color: "var(--ink-500)" }}>Municípios</span><span>{dep.municipios}</span>
                {dep.mandatoInicio && <><span style={{ color: "var(--ink-500)" }}>Mandato</span><span>{dep.mandatoInicio} a {dep.mandatoFim || "atual"}</span></>}
                {dep.email && <><span style={{ color: "var(--ink-500)" }}>E-mail</span><span>{dep.email}</span></>}
                {dep.telefone && <><span style={{ color: "var(--ink-500)" }}>Telefone</span><span>{dep.telefone}</span></>}
              </div>
            </div>
            {dep.biografia && (
              <div className="cc-card p-4">
                <h4 className="text-xs font-semibold mb-2">Biografia</h4>
                <p className="text-xs leading-relaxed" style={{ color: "var(--ink-500)" }}>{dep.biografia}</p>
              </div>
            )}
            {/* Dashboard rápido */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Ações" value={depAcoes.length} sub={`${depAcoes.filter(a => a.status === "Concluída").length} concluídas`} tone="blue" />
              <StatCard label="Propostas" value={depProps.length} sub={`${depProps.filter(p => p.status === "Aprovada" || p.status === "Executada" || p.status === "Concluída").length} aprovadas`} tone="green" />
              <StatCard label="Recursos" value={`R$ ${depAcoes.reduce((s, a) => s + (Number(a.valor) || 0), 0).toLocaleString("pt-BR")}`} tone="amber" />
              <StatCard label="Áreas" value={new Set(depAcoes.map(a => a.categoria)).size} tone="teal" />
            </div>
          </div>
        )}

        {/* Tab: Ações */}
        {detalheTab === "acoes" && (
          <div className="flex flex-col gap-3">
            <button onClick={() => { setFormAcao({ ...acaoVazia }); setEditAcao(null); setShowAcaoForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white w-full justify-center"
              style={{ background: "var(--blue-600)" }}><Plus size={16} /> Nova Ação</button>
            {formAcaoUI}
            {depAcoes.map(a => (
              <div key={a.id} className="cc-card p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{a.titulo}</p>
                    <div className="flex gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px]" style={{ color: "var(--ink-500)" }}>{a.categoria}</span>
                      <span className="text-[10px]" style={{ color: "var(--ink-500)" }}>{a.data}</span>
                      <span className={`text-[10px] px-1.5 rounded-full ${badgeAcaoDep(a.status)}`}>{a.status}</span>
                    </div>
                    {a.descricao && <p className="text-[10px] mt-1" style={{ color: "var(--ink-500)" }}>{a.descricao}</p>}
                    {a.valor > 0 && <p className="text-[10px] mt-1 font-medium" style={{ color: "var(--green-500)" }}>R$ {Number(a.valor).toLocaleString("pt-BR")}</p>}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => { setFormAcao({ ...a }); setEditAcao(a); setShowAcaoForm(true); }} className="p-1"><Pencil size={12} style={{ color: "var(--blue-600)" }} /></button>
                    <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(excluirAcao(a.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
                  </div>
                </div>
              </div>
            ))}
            {depAcoes.length === 0 && !showAcaoForm && <p className="text-sm text-center py-8" style={{ color: "var(--ink-300)" }}>Nenhuma ação cadastrada</p>}
          </div>
        )}

        {/* Tab: Propostas */}
        {detalheTab === "propostas" && (
          <div className="flex flex-col gap-3">
            <button onClick={() => { setFormProp({ ...propVazia }); setEditProp(null); setShowPropForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white w-full justify-center"
              style={{ background: "var(--blue-600)" }}><Plus size={16} /> Nova Proposta</button>
            {formPropUI}
            {depProps.map(p => (
              <div key={p.id} className="cc-card p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{p.titulo}</p>
                    <div className="flex gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px]" style={{ color: "var(--ink-500)" }}>{p.area}</span>
                      <span className="text-[10px]" style={{ color: "var(--ink-500)" }}>{p.dataApresentacao}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badgePropDep(p.status)}`}>{p.status}</span>
                    </div>
                    {p.descricao && <p className="text-[10px] mt-1" style={{ color: "var(--ink-500)" }}>{p.descricao}</p>}
                    {p.impacto && <p className="text-[10px] mt-1 italic" style={{ color: "var(--blue-600)" }}>Impacto: {p.impacto}</p>}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => { setFormProp({ ...p }); setEditProp(p); setShowPropForm(true); }} className="p-1"><Pencil size={12} style={{ color: "var(--blue-600)" }} /></button>
                    <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(excluirProposta(p.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
                  </div>
                </div>
              </div>
            ))}
            {depProps.length === 0 && !showPropForm && <p className="text-sm text-center py-8" style={{ color: "var(--ink-300)" }}>Nenhuma proposta cadastrada</p>}
          </div>
        )}

        {/* Tab: Página pública */}
        {detalheTab === "pagina" && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button onClick={() => gerarPDF(dep)} className="flex-1 flex items-center gap-2 justify-center py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: "var(--green-500)" }}>
                <Download size={14} /> Gerar PDF
              </button>
              <button onClick={() => compartilhar(dep)} className="flex-1 flex items-center gap-2 justify-center py-2.5 rounded-xl text-xs font-semibold text-white" style={{ background: "var(--blue-600)" }}>
                <Share2 size={14} /> Compartilhar
              </button>
            </div>
            <PaginaPublica dep={dep} />
          </div>
        )}
      </div>
    );
  }

  // ---- LISTA DE DEPUTADOS ----
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="cc-display font-semibold text-base">Propostas de Deputados</h3>
        <button onClick={() => { setFormDep(depVazio); setEditDep(null); setShowForm(true); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--blue-600)" }}>
          <Plus size={14} /> Deputado
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-300)" }} />
        <input placeholder="Buscar deputado..." className={inputCls} style={{ ...inputStyle, paddingLeft: "2.2rem" }} value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      {formDeputadoUI}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="cc-card p-3 text-center">
          <p className="cc-display text-lg font-bold" style={{ color: "var(--blue-600)" }}>{deputados.length}</p>
          <p className="text-[10px]" style={{ color: "var(--ink-500)" }}>Deputados</p>
        </div>
        <div className="cc-card p-3 text-center">
          <p className="cc-display text-lg font-bold" style={{ color: "var(--green-500)" }}>{acoes.length}</p>
          <p className="text-[10px]" style={{ color: "var(--ink-500)" }}>Ações</p>
        </div>
        <div className="cc-card p-3 text-center">
          <p className="cc-display text-lg font-bold" style={{ color: "var(--amber-500)" }}>{propostas.length}</p>
          <p className="text-[10px]" style={{ color: "var(--ink-500)" }}>Propostas</p>
        </div>
      </div>

      {/* Lista */}
      {depsFiltrados.map(dep => {
        const depAcoes = acoes.filter(a => a.deputadoId === dep.id);
        const depProps = propostas.filter(p => p.deputadoId === dep.id);
        return (
          <div key={dep.id} className="cc-card p-4">
            <div className="flex items-center gap-3">
              {dep.foto ? (
                <img src={dep.foto} alt={dep.nome} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: "#EAF1FE", color: "var(--blue-600)" }}>
                  {dep.nome?.charAt(0)}
                </div>
              )}
              <div className="flex-1" onClick={() => { setSelecionado(dep); setSubView("detalhe"); setDetalheTab("perfil"); }}>
                <p className="text-sm font-semibold">{dep.nome}</p>
                <p className="text-[10px]" style={{ color: "var(--ink-500)" }}>{dep.cargo} • {dep.partido} • {dep.estado}</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-[10px]" style={{ color: "var(--blue-600)" }}>{depAcoes.length} ações</span>
                  <span className="text-[10px]" style={{ color: "var(--green-500)" }}>{depProps.length} propostas</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <IconBtn label="Editar" onClick={() => iniciarEdicaoDep(dep)}><Pencil size={18} /></IconBtn>
                <IconBtn danger label="Excluir" onClick={() => confirmar("Esse registro será excluído. Deseja continuar?").then((ok) => ok && Promise.resolve(excluirDeputado(dep.id)).then((r) => r !== false && toast("Excluído")))}><Trash2 size={18} /></IconBtn>
              </div>
            </div>
          </div>
        );
      })}

      {depsFiltrados.length === 0 && !showForm && (
        <div className="cc-card p-8 text-center">
          <Landmark size={32} className="mx-auto mb-3" style={{ color: "var(--ink-300)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--ink-500)" }}>Nenhum deputado cadastrado</p>
          <p className="text-xs mt-1" style={{ color: "var(--ink-300)" }}>Cadastre deputados para gerenciar ações e propostas</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// App shell
// ---------------------------------------------------------------------------
const VIEWS_VALIDAS = new Set(NAV_ITEMS.map((i) => i.key));
const viewDaUrl = () => { const v = (window.location.hash || "").replace(/^#\/?/, ""); return VIEWS_VALIDAS.has(v) ? v : "dashboard"; };

export default function App() {
  const [view, setViewState] = useState(viewDaUrl);
  const [profundidade, setProfundidade] = useState(0);
  const [menuAberto, setMenuAberto] = useState(false);
  const [acoesAbertas, setAcoesAbertas] = useState(false);
  const [alertasAbertos, setAlertasAbertos] = useState(false);
  // navegação com histórico: o botão "voltar" do celular volta para a tela anterior
  const setView = useCallback((v) => {
    if (!VIEWS_VALIDAS.has(v)) return;
    setViewState((atual) => {
      if (atual !== v) { window.history.pushState({ v }, "", "#/" + v); setProfundidade((p) => p + 1); }
      return v;
    });
    window.scrollTo({ top: 0 });
  }, []);
  useEffect(() => {
    const onPop = () => { setViewState(viewDaUrl()); setProfundidade((p) => Math.max(0, p - 1)); window.scrollTo({ top: 0 }); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const eleitoresTable = useSupabaseTable("eleitores", []);
  const liderancasTable = useSupabaseTable("liderancas", []);
  const demandasTable = useSupabaseTable("demandas", []);
  const agendaTable = useSupabaseTable("agenda", []);
  const gastosTable = useSupabaseTable("gastos", []);
  const materialTable = useSupabaseTable("material", []);
  const visitasTable = useSupabaseTable("visitas", []);
  const eventosTable = useSupabaseTable("eventos", []);
  const tarefasTable = useSupabaseTable("tarefas", []);
  const metasVotosKV = useSupabaseKV("metas_votos", {});
  const candidatosKV = useSupabaseKV("candidatos", {});
  const pesquisasTable = useSupabaseTable("pesquisas", []);
  const documentosTable = useSupabaseTable("documentos", []);
  const whatsGruposTable = useSupabaseTable("whats_grupos", []);
  const instagramTable = useSupabaseTable("instagram", []);
  const visitasCasaTable = useSupabaseTable("visitas_casa", []);
  const votosPublicosTable = useSupabaseTable("votos_publicos", []);
  const candidatosVotacaoKV = useSupabaseKV("candidatos_votacao", {});
  const cabosTable = useSupabaseTable("cabos_eleitorais", []);
  const fiscaisTable = useSupabaseTable("fiscais_diad", []);
  const historicoTable = useSupabaseTable("historico_contato", []);
  const deputadosTable = useSupabaseTable("deputados", []);
  const eleitoresAdrianoTable = useSupabaseTable("eleitores_adriano", []);
  const eleitoresParanhosTable = useSupabaseTable("eleitores_paranhos", []);
  const mensagensKV = useSupabaseKV("mensagens_config", {}, "chave", "valor");
  const [importando, setImportando] = useState(false);
  const tabelasEleitores = { eleitores: eleitoresTable, adriano: eleitoresAdrianoTable, paranhos: eleitoresParanhosTable };
  const fecharImport = (msg) => { setImportando(false); if (msg) toast(msg); };
  const exportar = () => exportarPlanilha({ liderancas: liderancasTable.items, tables: tabelasEleitores });
  const depAcoesTable = useSupabaseTable("deputado_acoes", []);
  const depPropostasTable = useSupabaseTable("deputado_propostas", []);

  const eleitores = eleitoresTable.items;
  const setEleitores = eleitoresTable.setItems;
  const liderancas = liderancasTable.items;
  const setLiderancas = liderancasTable.setItems;
  const demandas = demandasTable.items;
  const setDemandas = demandasTable.setItems;
  const agenda = agendaTable.items;
  const setAgenda = agendaTable.setItems;
  const gastos = gastosTable.items;
  const setGastos = gastosTable.setItems;
  const material = materialTable.items;
  const setMaterial = materialTable.setItems;
  const visitas = visitasTable.items;
  const setVisitas = visitasTable.setItems;
  const eventos = eventosTable.items;
  const setEventos = eventosTable.setItems;
  const tarefas = tarefasTable.items;
  const setTarefas = tarefasTable.setItems;
  const [metasVotos, setMetasVotos] = [metasVotosKV.data, metasVotosKV.setData];
  const candidatos = candidatosKV.data;
  const pesquisas = pesquisasTable.items;
  const setPesquisas = pesquisasTable.setItems;
  const documentos = documentosTable.items;
  const setDocumentos = documentosTable.setItems;
  const candidatosVotacao = candidatosVotacaoKV.data;
  const cabos = cabosTable.items;
  const setCabos = cabosTable.setItems;

  const carregando = [eleitoresTable, liderancasTable, eleitoresAdrianoTable, eleitoresParanhosTable].some((t) => t.loading);
  const [splash, setSplash] = useState("on");
  useEffect(() => {
    if (splash !== "on") return;
    const minimo = setTimeout(() => { if (!carregando) setSplash("saindo"); }, 700);
    const maximo = setTimeout(() => setSplash("saindo"), 5000);
    return () => { clearTimeout(minimo); clearTimeout(maximo); };
  }, [carregando, splash]);
  useEffect(() => { if (splash === "saindo") { const t = setTimeout(() => setSplash("off"), 380); return () => clearTimeout(t); } }, [splash]);

  const alertas = useAlertas({ agenda, tarefas, demandas });
  const [seq, setSeq] = useState(0);
  const escolherAcao = (a) => { setAcoesAbertas(false); pedirAcao(a.view, a.acao); if (view === a.view) setSeq((n) => n + 1); else setView(a.view); };

  return (
    <div className="cc-root min-h-screen cc-with-sidebar">
      <style>{THEME}</style>
      <Sidebar view={view} onNavigate={setView} />
      <Header view={view} podeVoltar={profundidade > 0} onVoltar={() => window.history.back()} onMenu={() => setMenuAberto(true)}
        alertas={alertas} onAlertas={() => setAlertasAbertos(true)} />

      <main className="cc-main">
        <div key={view + ":" + seq} className="cc-page">

          {view === "dashboard" && <DashboardView listas={{ eleitores, adriano: eleitoresAdrianoTable.items, paranhos: eleitoresParanhosTable.items }} liderancas={liderancas} demandas={demandas} agenda={agenda} gastos={gastos} onNavigate={setView} carregando={carregando} />}
          {view === "eleitores" && <EleitoresPlanilhaView tables={tabelasEleitores} liderancas={liderancas} msgKV={mensagensKV} onImportar={() => setImportando(true)} />}
          {view === "mensagens" && <MensagensPlanilhaView liderancasTable={liderancasTable} tables={tabelasEleitores} msgKV={mensagensKV} onExportar={exportar} />}
          {view === "whatsgrupos" && <WhatsGruposView items={whatsGruposTable.items} setItems={whatsGruposTable.setItems} table={whatsGruposTable} />}
          {view === "instagram" && <InstagramView items={instagramTable.items} setItems={instagramTable.setItems} table={instagramTable} />}
          {view === "visitascasa" && <VisitaCasaView items={visitasCasaTable.items} setItems={visitasCasaTable.setItems} table={visitasCasaTable} />}
          {view === "liderancas" && <LiderancasPlanilhaView table={liderancasTable} msgKV={mensagensKV} onImportar={() => setImportando(true)} />}
          {view === "demandas" && <DemandasView items={demandas} setItems={setDemandas} table={demandasTable} />}
          {view === "agenda" && <AgendaView items={agenda} setItems={setAgenda} table={agendaTable} />}
          {view === "gastos" && <GastosView items={gastos} setItems={setGastos} table={gastosTable} />}
          {view === "material" && <MaterialView items={material} setItems={setMaterial} table={materialTable} />}
          {view === "visitas" && <VisitasView items={visitas} setItems={setVisitas} table={visitasTable} />}
          {view === "eventos" && <EventosView items={eventos} setItems={setEventos} table={eventosTable} />}
          {view === "tarefas" && <TarefasView items={tarefas} setItems={setTarefas} table={tarefasTable} />}
          {view === "relatorios" && <RelatoriosView eleitores={eleitores} metas={metasVotos} setMetas={setMetasVotos} metasKV={metasVotosKV} candidatos={candidatos} candidatosKV={candidatosKV} />}
          {view === "pesquisas" && <PesquisasView items={pesquisas} setItems={setPesquisas} table={pesquisasTable} eleitores={eleitores} />}
          {view === "documentos" && <DocumentosView items={documentos} setItems={setDocumentos} table={documentosTable} />}
          {view === "votacao" && <VotacaoPublicaView candidatosConfig={candidatosVotacao} candidatosConfigKV={candidatosVotacaoKV} votosTable={votosPublicosTable} />}
          {view === "cabos" && <CabosEleitoraisView items={cabos} setItems={setCabos} table={cabosTable} />}
          {view === "diad" && <DiaDView eleitores={eleitores} cabos={cabos} fiscaisTable={fiscaisTable} />}
          {view === "historico" && <HistoricoContatoView eleitores={eleitores} setEleitores={setEleitores} eleitoresTable={eleitoresTable} historicoTable={historicoTable} />}
          {view === "exportar" && <ExportarView eleitores={eleitores} cabos={cabos} liderancas={liderancas} />}
          {view === "deputados" && <DeputadosView deputadosTable={deputadosTable} acoesTable={depAcoesTable} propostasTable={depPropostasTable} />}
              </div>
      </main>

      <BottomNav view={view} onNavigate={setView} onMenu={() => setMenuAberto(true)} onFab={() => setAcoesAbertas(true)} />
      <Drawer open={menuAberto} view={view} onNavigate={setView} onClose={() => setMenuAberto(false)} />
      {acoesAbertas && <AcoesRapidas onClose={() => setAcoesAbertas(false)} onEscolher={escolherAcao} />}
      {alertasAbertos && <PainelAlertas alertas={alertas} onClose={() => setAlertasAbertos(false)} onNavigate={setView} />}
      <InstallPrompt />
      {importando && <ImportarPlanilha liderancasTable={liderancasTable} tables={tabelasEleitores} msgKV={mensagensKV} onClose={fecharImport} />}
      <ToastHost />
      <ConfirmHost />
      {splash !== "off" && <LoadingScreen saindo={splash === "saindo"} />}
    </div>
  );
}
