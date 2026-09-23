// ---------------------------------------------------------------------------
// Estrutura do app: menu lateral (desktop), gaveta (celular), cabeçalho,
// barra inferior com botão central e central de alertas.
// ---------------------------------------------------------------------------
import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Users, Crown, Send, Vote, Menu, Bell, ArrowLeft, Plus, X,
  Calendar as CalendarIcon, ClipboardList, Wallet, Package, MapPin, PartyPopper, CheckSquare,
  BarChart3, FileText, Target, Shield, MessageSquare, Download, Landmark, UsersRound, Instagram, Home,
  UserPlus, ListPlus, Clock, AlertTriangle, ChevronRight,
} from "lucide-react";
import { Sheet } from "./ui";

// Estrutura única do menu — usada pela barra lateral, gaveta e cabeçalho.
export const NAV_GROUPS = [
  { titulo: "Principal", itens: [
    { key: "dashboard", label: "Início", icon: LayoutDashboard, sub: "Resumo da campanha" },
    { key: "eleitores", label: "Eleitores", icon: Users, sub: "Cadastro e intenção de voto" },
    { key: "liderancas", label: "Lideranças", icon: Crown, sub: "Cabos, lideranças e apoiadores" },
    { key: "mensagens", label: "Mensagens", icon: Send, sub: "Envio pelo WhatsApp" },
    { key: "relatorios", label: "Votos", icon: Vote, sub: "Metas e intenção por cargo" },
  ] },
  { titulo: "Organização", itens: [
    { key: "agenda", label: "Agenda", icon: CalendarIcon, sub: "Compromissos" },
    { key: "tarefas", label: "Tarefas", icon: CheckSquare, sub: "Pendências da equipe" },
    { key: "demandas", label: "Demandas", icon: ClipboardList, sub: "Pedidos da população" },
    { key: "visitas", label: "Visitas", icon: MapPin, sub: "Registro de visitas" },
    { key: "visitascasa", label: "Visita Casa", icon: Home, sub: "Porta a porta" },
    { key: "eventos", label: "Eventos", icon: PartyPopper, sub: "Eventos e reuniões" },
  ] },
  { titulo: "Campanha", itens: [
    { key: "cabos", label: "Cabos Eleitorais", icon: Target, sub: "Equipe de rua" },
    { key: "diad", label: "Dia D", icon: Shield, sub: "Fiscais e dia da eleição" },
    { key: "votacao", label: "Votação Pública", icon: Vote, sub: "Enquete pública" },
    { key: "pesquisas", label: "Pesquisas", icon: BarChart3, sub: "Pesquisas de opinião" },
    { key: "deputados", label: "Deputados", icon: Landmark, sub: "Candidatos apoiados" },
  ] },
  { titulo: "Comunicação", itens: [
    { key: "whatsgrupos", label: "Grupos WhatsApp", icon: UsersRound, sub: "Grupos da campanha" },
    { key: "instagram", label: "Instagram", icon: Instagram, sub: "Seguidores e interações" },
    { key: "historico", label: "Histórico Contato", icon: MessageSquare, sub: "Contatos feitos" },
  ] },
  { titulo: "Gestão", itens: [
    { key: "gastos", label: "Gastos", icon: Wallet, sub: "Despesas da campanha" },
    { key: "material", label: "Material", icon: Package, sub: "Estoque e distribuição" },
    { key: "documentos", label: "Documentos", icon: FileText, sub: "Onde está cada documento" },
    { key: "exportar", label: "Exportar", icon: Download, sub: "Baixar dados em planilha" },
  ] },
];
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.itens);
export const navItem = (key) => NAV_ITEMS.find((i) => i.key === key);

// Ações rápidas do botão central (+)
export const ACOES_RAPIDAS = [
  { view: "eleitores", acao: "novo", label: "Novo eleitor", icon: UserPlus },
  { view: "eleitores", acao: "lote", label: "Vários eleitores", icon: ListPlus },
  { view: "agenda", acao: "novo", label: "Compromisso", icon: CalendarIcon },
  { view: "tarefas", acao: "novo", label: "Tarefa", icon: CheckSquare },
  { view: "demandas", acao: "novo", label: "Demanda", icon: ClipboardList },
  { view: "gastos", acao: "novo", label: "Gasto", icon: Wallet },
];

// Ação pendente: o botão central navega para a tela e a tela abre o formulário.
let pendente = null;
export function pedirAcao(view, acao) { pendente = { view, acao }; }
export function consumirAcao(view) {
  if (pendente?.view !== view) return null;
  const a = pendente.acao; pendente = null; return a;
}
export function useAcaoPendente(view, handlers) {
  useEffect(() => {
    const a = consumirAcao(view);
    if (a && handlers[a]) setTimeout(() => handlers[a](), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function NavLista({ view, onNavigate }) {
  return NAV_GROUPS.map((g) => (
    <div key={g.titulo}>
      <p className="cc-navgroup">{g.titulo}</p>
      <div className="flex flex-col gap-0.5 px-2">
        {g.itens.map((it) => {
          const Icon = it.icon;
          return (
            <button key={it.key} className="cc-navitem" aria-current={view === it.key ? "page" : undefined} onClick={() => onNavigate(it.key)}>
              <Icon size={19} aria-hidden /> <span className="truncate">{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  ));
}

function Marca() {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <img src="/icon-192.png" alt="" width={32} height={32} className="rounded-[9px] flex-shrink-0" />
      <p className="cc-display font-bold text-[17px] leading-none whitespace-nowrap">CONecta <span style={{ color: "var(--teal-400)" }}>Campanha</span></p>
    </div>
  );
}

export function Sidebar({ view, onNavigate }) {
  return (
    <aside className="cc-sidebar" aria-label="Menu principal">
      <div className="px-5 py-5 text-white"><Marca /></div>
      <nav className="flex-1 pb-6"><NavLista view={view} onNavigate={onNavigate} /></nav>
      <p className="px-5 pb-5 text-[11px]" style={{ color: "#6F829A" }}>Ivatuba/PR · Adriano José 55.900</p>
    </aside>
  );
}

export function Drawer({ open, view, onNavigate, onClose }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="cc-overlay" style={{ zIndex: 79, alignItems: "stretch" }} onClick={onClose} />
      <aside className="cc-drawer" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="flex items-center justify-between pl-5 pr-2 py-3 text-white">
          <Marca />
          <button className="cc-iconbtn" style={{ color: "#fff" }} onClick={onClose} aria-label="Fechar menu"><X size={20} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto pb-8"><NavLista view={view} onNavigate={(k) => { onNavigate(k); onClose(); }} /></nav>
      </aside>
    </>
  );
}

export function Header({ view, podeVoltar, onVoltar, onMenu, alertas, onAlertas }) {
  const it = navItem(view);
  const home = view === "dashboard";
  return (
    <header className="cc-header">
      <div className="cc-header-inner">
        {home ? (
          <button className="cc-iconbtn cc-hide-desktop" onClick={onMenu} aria-label="Abrir menu"><Menu size={22} /></button>
        ) : podeVoltar ? (
          <button className="cc-iconbtn cc-hide-desktop" onClick={onVoltar} aria-label="Voltar"><ArrowLeft size={22} /></button>
        ) : (
          <button className="cc-iconbtn cc-hide-desktop" onClick={onMenu} aria-label="Abrir menu"><Menu size={22} /></button>
        )}
        <div className="flex-1 min-w-0 pl-1">
          {home ? <div className="cc-hide-desktop"><Marca /></div> : null}
          <div className={home ? "cc-hide-mobile" : ""}>
            <p className="cc-display font-bold text-[17px] leading-tight truncate">{it?.label || "CONecta Campanha"}</p>
            {it?.sub && <p className="text-[12px] leading-tight truncate" style={{ color: "#BFD0E6" }}>{it.sub}</p>}
          </div>
        </div>
        <button className="cc-iconbtn relative" onClick={onAlertas} aria-label={`Alertas${alertas.length ? `: ${alertas.length}` : ""}`}>
          <Bell size={21} />
          {!!alertas.length && <span className="cc-badge-dot">{alertas.length > 9 ? "9+" : alertas.length}</span>}
        </button>
      </div>
    </header>
  );
}

const TABS = [
  { key: "dashboard", label: "Início", icon: LayoutDashboard },
  { key: "eleitores", label: "Eleitores", icon: Users },
  { key: "__fab" },
  { key: "mensagens", label: "Mensagens", icon: Send },
  { key: "__menu", label: "Menu", icon: Menu },
];
export function BottomNav({ view, onNavigate, onMenu, onFab }) {
  const noMenu = !TABS.some((t) => t.key === view);
  return (
    <nav className="cc-bottomnav" aria-label="Navegação principal">
      {TABS.map((t) => {
        if (t.key === "__fab") return (
          <div key="fab" className="flex-1 flex justify-center">
            <button className="cc-fab" onClick={onFab} aria-label="Cadastrar"><Plus size={26} strokeWidth={2.5} /></button>
          </div>
        );
        const Icon = t.icon;
        const ativo = t.key === "__menu" ? noMenu : view === t.key;
        return (
          <button key={t.key} className="cc-tab" aria-current={ativo ? "page" : undefined}
            onClick={() => (t.key === "__menu" ? onMenu() : onNavigate(t.key))}>
            <span className="cc-tab-pill"><Icon size={22} strokeWidth={ativo ? 2.4 : 1.9} aria-hidden /></span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function AcoesRapidas({ onClose, onEscolher }) {
  return (
    <Sheet title="Cadastrar" onClose={onClose}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {ACOES_RAPIDAS.map((a) => {
          const Icon = a.icon;
          return (
            <button key={a.label} onClick={() => onEscolher(a)} className="cc-card cc-card-hover flex flex-col items-start gap-3 p-4 text-left">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--blue-50)", color: "var(--blue-600)" }}><Icon size={20} /></span>
              <span className="text-sm font-semibold">{a.label}</span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

// ---------- Central de alertas (a partir dos dados reais) ----------
const hojeISO = () => new Date().toLocaleDateString("sv-SE");
const maisDias = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString("sv-SE"); };
const fmtData = (s) => (s ? s.split("-").reverse().join("/") : "");

export function useAlertas({ agenda, tarefas, demandas }) {
  return useMemo(() => {
    const hoje = hojeISO(), amanha = maisDias(1);
    const out = [];
    agenda.filter((a) => a.data === hoje || a.data === amanha)
      .sort((a, b) => (a.data + (a.hora || "")).localeCompare(b.data + (b.hora || "")))
      .forEach((a) => out.push({ id: "ag" + a.id, view: "agenda", icon: Clock, tom: "blue",
        titulo: a.titulo, texto: `${a.data === hoje ? "Hoje" : "Amanhã"}${a.hora ? " às " + a.hora : ""}${a.local ? " · " + a.local : ""}` }));
    tarefas.filter((t) => t.status !== "Concluída" && t.prazo && t.prazo <= amanha)
      .forEach((t) => out.push({ id: "ta" + t.id, view: "tarefas", icon: CheckSquare, tom: t.prazo < hoje ? "bad" : "warn",
        titulo: t.titulo, texto: t.prazo < hoje ? `Tarefa atrasada (prazo ${fmtData(t.prazo)})` : `Tarefa vence ${t.prazo === hoje ? "hoje" : "amanhã"}` }));
    demandas.filter((d) => d.status !== "Resolvida" && d.status !== "Cancelada" && d.prazo && d.prazo <= amanha)
      .forEach((d) => out.push({ id: "de" + d.id, view: "demandas", icon: AlertTriangle, tom: d.prazo < hoje ? "bad" : "warn",
        titulo: d.descricao || d.solicitante, texto: d.prazo < hoje ? `Demanda atrasada (prazo ${fmtData(d.prazo)})` : "Demanda com prazo próximo" }));
    return out;
  }, [agenda, tarefas, demandas]);
}

export function PainelAlertas({ alertas, onClose, onNavigate }) {
  const cor = { blue: ["var(--blue-50)", "var(--blue-600)"], warn: ["#FFF3DC", "#9A6300"], bad: ["#FBE9E7", "#B3402C"] };
  return (
    <Sheet title="Alertas" onClose={onClose}>
      {!alertas.length ? (
        <div className="flex flex-col items-center text-center gap-2 py-8" style={{ color: "var(--ink-500)" }}>
          <span className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--blue-50)", color: "var(--blue-600)" }}><Bell size={22} /></span>
          <p className="text-sm">Nada para hoje ou amanhã. Compromissos, tarefas e demandas com prazo aparecem aqui.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {alertas.map((a) => {
            const Icon = a.icon; const [bg, fg] = cor[a.tom];
            return (
              <button key={a.id} onClick={() => { onNavigate(a.view); onClose(); }} className="cc-card cc-card-hover flex items-center gap-3 p-3 text-left">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg, color: fg }}><Icon size={19} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold truncate">{a.titulo}</span>
                  <span className="block text-xs" style={{ color: "var(--ink-500)" }}>{a.texto}</span>
                </span>
                <ChevronRight size={18} style={{ color: "var(--ink-300)" }} />
              </button>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}
