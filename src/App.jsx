import React, { useState, useMemo, useCallback } from "react";
import { useSupabaseTable, useSupabaseKV } from "./useSupabase";
import {
  LayoutDashboard, Users, Crown, MapPin,
  ClipboardList, Calendar as CalendarIcon, PartyPopper, Map,
  BarChart3, MessageCircle, CheckSquare, FileText, Printer,
  Bell, Settings, Search, Plus, X, Pencil, Trash2, Phone,
  ChevronRight, Clock, TrendingUp, Activity,
  Wallet, Package, Vote, ExternalLink
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
const BAIRROS = ["Centro", "Jardim das Flores", "Vila Nova", "Bela Vista", "São José", "Industrial"];
const CIDADE_REDUTO = "Ivatuba";
const CARGOS = ["Presidente", "Governador", "Senador", "Deputado Federal", "Deputado Estadual"];
const INTENCOES = ["Nosso candidato", "Outro candidato", "Indeciso"];

const seedMetasVotos = {
  "Presidente": 5000,
  "Governador": 4200,
  "Senador": 3800,
  "Deputado Federal": 3000,
  "Deputado Estadual": 2500,
};

function intencoesPadrao() {
  return { "Presidente": "Indeciso", "Governador": "Indeciso", "Senador": "Indeciso", "Deputado Federal": "Indeciso", "Deputado Estadual": "Indeciso" };
}

const seedEleitores = [
  { id: 1, nome: "Marta Aparecida Silva", telefone: "(45) 99911-2233", bairro: "Centro", lideranca: "João Ferreira", status: "Confirmado", tags: ["saúde"], cadastro: "2026-06-02",
    intencoes: { "Presidente": "Nosso candidato", "Governador": "Nosso candidato", "Senador": "Indeciso", "Deputado Federal": "Nosso candidato", "Deputado Estadual": "Nosso candidato" } },
  { id: 2, nome: "Carlos Eduardo Santos", telefone: "(45) 99922-3344", bairro: "Vila Nova", lideranca: "Rosa Lima", status: "Pendente", tags: ["educação"], cadastro: "2026-06-10",
    intencoes: { "Presidente": "Outro candidato", "Governador": "Indeciso", "Senador": "Nosso candidato", "Deputado Federal": "Indeciso", "Deputado Estadual": "Nosso candidato" } },
  { id: 3, nome: "Fernanda Costa", telefone: "(45) 99933-4455", bairro: "Bela Vista", lideranca: "João Ferreira", status: "Confirmado", tags: ["infraestrutura"], cadastro: "2026-06-18",
    intencoes: { "Presidente": "Nosso candidato", "Governador": "Nosso candidato", "Senador": "Nosso candidato", "Deputado Federal": "Nosso candidato", "Deputado Estadual": "Nosso candidato" } },
  { id: 4, nome: "Roberto Almeida", telefone: "(45) 99944-5566", bairro: "São José", lideranca: "Rosa Lima", status: "Indeciso", tags: [], cadastro: "2026-07-01",
    intencoes: { "Presidente": "Indeciso", "Governador": "Indeciso", "Senador": "Indeciso", "Deputado Federal": "Indeciso", "Deputado Estadual": "Indeciso" } },
  { id: 5, nome: "Juliana Pereira", telefone: "(45) 99955-6677", bairro: "Industrial", lideranca: "Marcos Souza", status: "Confirmado", tags: ["saúde"], cadastro: "2026-07-14",
    intencoes: { "Presidente": "Nosso candidato", "Governador": "Outro candidato", "Senador": "Nosso candidato", "Deputado Federal": "Nosso candidato", "Deputado Estadual": "Nosso candidato" } },
];

const seedGastos = [
  { id: 1, descricao: "Impressão de santinhos", categoria: "Material gráfico", valor: 1850, data: "2026-07-10", observacoes: "Lote inicial" },
  { id: 2, descricao: "Combustível carreata Paulista", categoria: "Logística", valor: 620, data: "2026-07-18", observacoes: "" },
  { id: 3, descricao: "Faixas de rua", categoria: "Material gráfico", valor: 1957, data: "2026-07-25", observacoes: "Centro e Vila Nova" },
];

const seedMaterial = [
  { id: 1, nome: "Santinhos", quantidadeTotal: 5000, quantidadeDistribuida: 1200, custoUnitario: 0.35, observacoes: "" },
  { id: 2, nome: "Faixas de rua", quantidadeTotal: 40, quantidadeDistribuida: 12, custoUnitario: 45, observacoes: "" },
  { id: 3, nome: "Adesivos de carro", quantidadeTotal: 2000, quantidadeDistribuida: 344, custoUnitario: 0.5, observacoes: "" },
];

const seedVisitas = [
  { id: 1, pessoa: "Marta Aparecida Silva", endereco: "Rua das Palmeiras, 120 - Centro", data: "2026-08-05", hora: "10:00", assessor: "Paula Nunes", assunto: "Acompanhamento de demanda de saúde", resultado: "Positiva", proximosPassos: "Retornar em 15 dias" },
  { id: 2, pessoa: "Roberto Almeida", endereco: "Av. São José, 45", data: "2026-08-06", hora: "15:30", assessor: "Diego Martins", assunto: "Apresentação de propostas", resultado: "Indeciso", proximosPassos: "Enviar material impresso" },
  { id: 3, pessoa: "Fernanda Costa", endereco: "Rua Bela Vista, 88", data: "2026-08-07", hora: "09:15", assessor: "Paula Nunes", assunto: "Confirmação de apoio", resultado: "Positiva", proximosPassos: "Convidar para caminhada" },
];

const seedEventos = [
  { id: 1, nome: "Caminhada Bela Vista", data: "2026-08-09", hora: "17:00", local: "Praça Bela Vista", responsavel: "Assessoria", publicoEstimado: 300, observacoes: "Confirmar carro de som" },
  { id: 2, nome: "Encontro com lideranças do Centro", data: "2026-08-15", hora: "19:00", local: "Sede da campanha", responsavel: "João Ferreira", publicoEstimado: 60, observacoes: "" },
  { id: 3, nome: "Feira de saúde comunitária", data: "2026-08-22", hora: "08:00", local: "Vila Nova", responsavel: "Rosa Lima", publicoEstimado: 500, observacoes: "Parceria com posto de saúde" },
];

const seedTarefas = [
  { id: 1, titulo: "Preparar material da caminhada de Bela Vista", responsavel: "Paula Nunes", prazo: "2026-08-08", prioridade: "Alta", status: "Em andamento" },
  { id: 2, titulo: "Atualizar planilha de apoiadores do Centro", responsavel: "Diego Martins", prazo: "2026-08-09", prioridade: "Média", status: "Pendente" },
  { id: 3, titulo: "Confirmar carro de som para o evento", responsavel: "Camila Rocha", prazo: "2026-08-08", prioridade: "Alta", status: "Pendente" },
  { id: 4, titulo: "Fechar prestação de contas da semana", responsavel: "Gabriel Souza", prazo: "2026-08-10", prioridade: "Média", status: "Concluída" },
];

const seedPesquisas = [
  {
    id: 1, titulo: "Avaliação da gestão atual", data: "2026-07-20", responsavel: "Equipe de campo",
    opcoes: [
      { texto: "Ótima/boa", respostas: 62 },
      { texto: "Regular", respostas: 41 },
      { texto: "Ruim/péssima", respostas: 27 },
    ],
  },
  {
    id: 2, titulo: "Principal problema do bairro", data: "2026-07-28", responsavel: "Equipe de campo",
    opcoes: [
      { texto: "Saúde", respostas: 58 },
      { texto: "Infraestrutura", respostas: 44 },
      { texto: "Educação", respostas: 22 },
      { texto: "Segurança", respostas: 19 },
    ],
  },
];

const seedDocumentos = [
  { id: 1, nome: "Registro de candidatura", categoria: "Jurídico", data: "2026-06-15", link: "", observacoes: "Protocolo no cartório eleitoral" },
  { id: 2, nome: "Prestação de contas - julho", categoria: "Financeiro", data: "2026-08-01", link: "", observacoes: "" },
  { id: 3, nome: "Roteiro da caminhada Bela Vista", categoria: "Comunicação", data: "2026-08-05", link: "", observacoes: "" },
];

const seedLiderancas = [
  { id: 1, nome: "João Ferreira", bairro: "Centro / Bela Vista", telefone: "(45) 99101-0001", apoiadores: 128, status: "Ativa" },
  { id: 2, nome: "Rosa Lima", bairro: "Vila Nova / São José", telefone: "(45) 99101-0002", apoiadores: 96, status: "Ativa" },
  { id: 3, nome: "Marcos Souza", bairro: "Industrial", telefone: "(45) 99101-0003", apoiadores: 54, status: "Ativa" },
];

const seedDemandas = [
  { id: 1, solicitante: "Marta Aparecida Silva", categoria: "Saúde", descricao: "Falta de médico no posto do Centro", bairro: "Centro", prioridade: "Alta", status: "Em andamento", prazo: "2026-08-15" },
  { id: 2, solicitante: "Roberto Almeida", categoria: "Infraestrutura", descricao: "Buraco na rua principal", bairro: "São José", prioridade: "Média", status: "Nova", prazo: "2026-08-20" },
  { id: 3, solicitante: "Fernanda Costa", categoria: "Educação", descricao: "Vaga em creche municipal", bairro: "Bela Vista", prioridade: "Alta", status: "Em análise", prazo: "2026-08-10" },
  { id: 4, solicitante: "Juliana Pereira", categoria: "Saúde", descricao: "Encaminhamento para especialista", bairro: "Industrial", prioridade: "Baixa", status: "Resolvida", prazo: "2026-07-30" },
];

const seedAgenda = [
  { id: 1, titulo: "Reunião com lideranças do Centro", data: "2026-08-08", hora: "09:00", local: "Sede da campanha", responsavel: "João Ferreira" },
  { id: 2, titulo: "Visita ao bairro Vila Nova", data: "2026-08-08", hora: "14:30", local: "Vila Nova", responsavel: "Rosa Lima" },
  { id: 3, titulo: "Caminhada Bela Vista", data: "2026-08-09", hora: "17:00", local: "Praça Bela Vista", responsavel: "Assessoria" },
  { id: 4, titulo: "Reunião de equipe", data: "2026-08-10", hora: "10:00", local: "Sede da campanha", responsavel: "Coordenação" },
];

const chartData = [
  { dia: "Seg", cadastros: 12, visitas: 8 },
  { dia: "Ter", cadastros: 19, visitas: 11 },
  { dia: "Qua", cadastros: 14, visitas: 9 },
  { dia: "Qui", cadastros: 22, visitas: 15 },
  { dia: "Sex", cadastros: 27, visitas: 18 },
  { dia: "Sáb", cadastros: 31, visitas: 21 },
  { dia: "Dom", cadastros: 18, visitas: 10 },
];

const bairroData = BAIRROS.map((b, i) => ({ bairro: b, apoiadores: [128, 40, 96, 62, 54, 54][i] }));

const MENU = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, active: true },
  { key: "eleitores", label: "Eleitores", icon: Users, active: true },
  { key: "liderancas", label: "Lideranças", icon: Crown, active: true },
  { key: "demandas", label: "Demandas", icon: ClipboardList, active: true },
  { key: "agenda", label: "Agenda", icon: CalendarIcon, active: true },
  { key: "gastos", label: "Gastos", icon: Wallet, active: true },
  { key: "material", label: "Material", icon: Package, active: true },
  { key: "visitas", label: "Visitas", icon: MapPin, active: true },
  { key: "eventos", label: "Eventos", icon: PartyPopper, active: true },
  { key: "tarefas", label: "Tarefas", icon: CheckSquare, active: true },
  { key: "relatorios", label: "Relatórios", icon: Printer, active: true },
  { key: "pesquisas", label: "Pesquisas", icon: BarChart3, active: true },
  { key: "documentos", label: "Documentos", icon: FileText, active: true },
  { key: "mapa", label: "Mapa Eleitoral", icon: Map, active: false },
  { key: "comunicacao", label: "Comunicação", icon: MessageCircle, active: false },
];

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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(10,25,41,0.55)" }}>
      <div className="cc-card cc-fade-in w-full max-w-lg max-h-[85vh] overflow-y-auto cc-scroll" style={{ background: "var(--surface)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="cc-display font-semibold text-base">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
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
function DashboardView({ eleitores, liderancas, demandas, agenda, gastos, material }) {
  const abertas = demandas.filter(d => d.status !== "Resolvida" && d.status !== "Cancelada").length;
  const concluidas = demandas.filter(d => d.status === "Resolvida").length;
  const apoiadoresCount = eleitores.filter(e => e.status === "Confirmado").length;
  const votosEsperados = apoiadoresCount * 30 + eleitores.filter(e => e.status === "Pendente").length * 10;
  const totalGasto = gastos.reduce((s, g) => s + g.valor, 0);
  const materialRestante = material.reduce((s, m) => s + (m.quantidadeTotal - m.quantidadeDistribuida), 0);
  const fmt = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  const niveis = [
    { nivel: "Confirmado", cor: "#1E8E5F", bg: "#E6F7EF" },
    { nivel: "Pendente", cor: "#9A6300", bg: "#FFF3DC" },
    { nivel: "Indeciso", cor: "#B3402C", bg: "#FBE9E7" },
  ].map(n => ({ ...n, total: eleitores.filter(e => e.status === n.nivel).length }));
  const totalEleitores = eleitores.length || 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Eleitores cadastrados" value={eleitores.length} sub="+3 esta semana" tone="blue" />
        <StatCard label="Apoiadores" value={apoiadoresCount} sub="confirmados" tone="teal" />
        <StatCard label="Lideranças ativas" value={liderancas.length} tone="green" />
        <StatCard label="Demandas abertas" value={abertas} sub={`${concluidas} concluídas`} tone="amber" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Votos esperados" value={votosEsperados.toLocaleString("pt-BR")} tone="teal" />
        <StatCard label="Total gasto" value={fmt(totalGasto)} tone="amber" />
        <StatCard label="Material restante" value={materialRestante.toLocaleString("pt-BR")} tone="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="cc-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="cc-display font-semibold text-sm">Cadastros e visitas na semana</h3>
            <TrendingUp size={16} style={{ color: "var(--blue-600)" }} />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gCad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2E86D8" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2E86D8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E9F1" />
              <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#5B6B7C" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#5B6B7C" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="cadastros" stroke="#2E86D8" fill="url(#gCad)" strokeWidth={2} />
              <Area type="monotone" dataKey="visitas" stroke="#38C6C8" fillOpacity={0} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="cc-card p-5">
          <h3 className="cc-display font-semibold text-sm mb-4">Apoiadores por bairro</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bairroData} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="bairro" type="category" width={90} tick={{ fontSize: 11, fill: "#5B6B7C" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="apoiadores" fill="#1B5FC4" radius={[0, 6, 6, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="cc-card p-5">
        <h3 className="cc-display font-semibold text-sm mb-4">Nível de votação dos eleitores</h3>
        <div className="flex flex-col gap-4">
          {niveis.map(n => {
            const pct = Math.round((n.total / totalEleitores) * 100);
            return (
              <div key={n.nivel} className="flex items-center gap-3">
                <span className="text-xs font-medium w-24 flex-shrink-0" style={{ color: "var(--ink-900)" }}>{n.nivel}</span>
                <div className="flex-1 h-3 rounded-full" style={{ background: "var(--border)" }}>
                  <div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, background: n.cor }} />
                </div>
                <span className="text-xs w-20 text-right cc-display font-bold" style={{ color: n.cor }}>{n.total} <span className="font-normal" style={{ color: "var(--ink-500)" }}>({pct}%)</span></span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          {niveis.map(n => (
            <div key={n.nivel} className="flex-1 rounded-lg px-3 py-2 text-center" style={{ background: n.bg }}>
              <p className="cc-display font-bold text-lg" style={{ color: n.cor }}>{n.total}</p>
              <p className="text-[11px] font-medium" style={{ color: n.cor }}>{n.nivel}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="cc-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="cc-pulse w-2 h-2 rounded-full" style={{ background: "var(--teal-400)" }} />
          <h3 className="cc-display font-semibold text-sm">Compromissos de hoje</h3>
        </div>
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
          {agenda.filter(a => a.data === "2026-08-08").map(a => (
            <div key={a.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: "#EAF1FE", color: "var(--blue-600)" }}>
                  <Clock size={14} />
                </div>
                <div>
                  <p className="text-sm font-medium">{a.titulo}</p>
                  <p className="text-xs" style={{ color: "var(--ink-500)" }}>{a.local} • {a.responsavel}</p>
                </div>
              </div>
              <span className="text-sm font-semibold cc-display">{a.hora}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EleitoresView({ items, setItems, liderancas, table }) {
  const [query, setQuery] = useState("");
  const [bairroFiltro, setBairroFiltro] = useState("Todos");
  const [modal, setModal] = useState(null);

  const filtered = useMemo(() => items.filter(e =>
    (bairroFiltro === "Todos" || e.bairro === bairroFiltro) &&
    e.nome.toLowerCase().includes(query.toLowerCase())
  ), [items, query, bairroFiltro]);

  function openNew() { setModal({ mode: "new", data: { nome: "", telefone: "", bairro: BAIRROS[0], lideranca: liderancas[0]?.nome || "", status: "Pendente", tags: "", intencoes: intencoesPadrao() } }); }
  function openEdit(item) { setModal({ mode: "edit", data: { ...item, tags: (item.tags || []).join(", "), intencoes: { ...intencoesPadrao(), ...(item.intencoes || {}) } } }); }

  function save(form) {
    const tagsArr = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    if (modal.mode === "new") {
      table.insert({ ...form, tags: tagsArr, cadastro: new Date().toISOString().slice(0, 10) });
    } else {
      table.update(form.id, { ...form, tags: tagsArr });
    }
    setModal(null);
  }
  function remove(id) { table.remove(id); }
  function changeNivel(id, status) { table.update(id, { status }); }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-300)" }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nome..."
              className={inputCls} style={{ ...inputStyle, paddingLeft: "2rem" }} />
          </div>
          <select value={bairroFiltro} onChange={e => setBairroFiltro(e.target.value)} className={inputCls} style={inputStyle}>
            <option>Todos</option>
            {BAIRROS.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--blue-600)" }}>
          <Plus size={16} /> Novo eleitor
        </button>
      </div>

      <div className="cc-card overflow-x-auto cc-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: "var(--ink-500)" }}>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium">Bairro</th>
              <th className="px-4 py-3 font-medium">Liderança</th>
              <th className="px-4 py-3 font-medium">Nível de votação</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => {
              const nivelTone = {
                "Confirmado": { bg: "#E6F7EF", fg: "#1E8E5F" },
                "Pendente": { bg: "#FFF3DC", fg: "#9A6300" },
                "Indeciso": { bg: "#FBE9E7", fg: "#B3402C" },
              }[e.status] || { bg: "#EAF1FE", fg: "var(--blue-600)" };
              return (
              <tr key={e.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-3 font-medium">{e.nome}</td>
                <td className="px-4 py-3" style={{ color: "var(--ink-500)" }}>{e.telefone}</td>
                <td className="px-4 py-3">{e.bairro}</td>
                <td className="px-4 py-3">{e.lideranca}</td>
                <td className="px-4 py-3">
                  <select
                    value={e.status}
                    onChange={ev => changeNivel(e.id, ev.target.value)}
                    className="text-xs font-medium rounded-full px-2 py-1 border-0 outline-none"
                    style={{ background: nivelTone.bg, color: nivelTone.fg }}
                  >
                    <option>Confirmado</option>
                    <option>Pendente</option>
                    <option>Indeciso</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(e)} className="p-1.5 rounded-md hover:bg-gray-100"><Pencil size={14} /></button>
                    <button onClick={() => remove(e.id)} className="p-1.5 rounded-md hover:bg-gray-100"><Trash2 size={14} style={{ color: "var(--red-500)" }} /></button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState text="Nenhum eleitor encontrado com esse filtro." />}
      </div>

      {modal && (
        <Modal title={modal.mode === "new" ? "Novo eleitor" : "Editar eleitor"} onClose={() => setModal(null)}>
          <FormEleitor data={modal.data} liderancas={liderancas} onSave={save} />
        </Modal>
      )}
    </div>
  );
}

function FormEleitor({ data, liderancas, onSave }) {
  const [form, setForm] = useState(data);
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <Field label="Nome completo">
        <input required className={inputCls} style={inputStyle} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefone / WhatsApp">
          <input required className={inputCls} style={inputStyle} value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
        </Field>
        <Field label="CPF (opcional)">
          <input className={inputCls} style={inputStyle} value={form.cpf || ""} onChange={e => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
        </Field>
      </div>
      <Field label="Bairro">
        <select className={inputCls} style={inputStyle} value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })}>
          {BAIRROS.map(b => <option key={b}>{b}</option>)}
        </select>
      </Field>
      <Field label="Nível de votação">
        <select className={inputCls} style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          <option>Confirmado</option><option>Pendente</option><option>Indeciso</option>
        </select>
      </Field>
      <Field label="Liderança responsável">
        <select className={inputCls} style={inputStyle} value={form.lideranca} onChange={e => setForm({ ...form, lideranca: e.target.value })}>
          {liderancas.map(l => <option key={l.id}>{l.nome}</option>)}
        </select>
      </Field>
      <Field label="Tags (separadas por vírgula)">
        <input className={inputCls} style={inputStyle} value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="saúde, educação..." />
      </Field>
      <div className="mt-1 mb-3">
        <span className="text-sm font-medium block mb-2" style={{ color: "var(--ink-500)" }}>Intenção de voto por cargo</span>
        <div className="flex flex-col gap-2">
          {CARGOS.map(cargo => (
            <div key={cargo} className="flex items-center justify-between gap-2">
              <span className="text-xs flex-1">{cargo}</span>
              <select
                className="text-xs border rounded-lg px-2 py-1.5"
                style={inputStyle}
                value={form.intencoes[cargo]}
                onChange={e => setForm({ ...form, intencoes: { ...form.intencoes, [cargo]: e.target.value } })}
              >
                {INTENCOES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
      <button type="submit" className="w-full mt-2 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>
        Salvar
      </button>
    </form>
  );
}

function LiderancasView({ items, setItems, eleitores, table }) {
  const [modal, setModal] = useState(null);

  function openNew() { setModal({ mode: "new", data: { nome: "", bairro: "", telefone: "", status: "Ativa" } }); }
  function openEdit(item) { setModal({ mode: "edit", data: item }); }
  function save(form) {
    if (modal.mode === "new") {
      table.insert({ ...form, apoiadores: 0 });
    } else {
      table.update(form.id, form);
    }
    setModal(null);
  }
  function remove(id) { table.remove(id); }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>
          <Plus size={16} /> Nova liderança
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(l => {
          const vinculados = eleitores.filter(e => e.lideranca === l.nome).length;
          return (
            <div key={l.id} className="cc-card p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold cc-display" style={{ background: "#EAF1FE", color: "var(--blue-600)" }}>
                    {l.nome.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{l.nome}</p>
                    <p className="text-xs" style={{ color: "var(--ink-500)" }}>{l.bairro}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(l)} className="p-1.5 rounded-md hover:bg-gray-100"><Pencil size={13} /></button>
                  <button onClick={() => remove(l.id)} className="p-1.5 rounded-md hover:bg-gray-100"><Trash2 size={13} style={{ color: "var(--red-500)" }} /></button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ink-500)" }}>
                <Phone size={12} /> {l.telefone}
              </div>
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <span className="text-xs" style={{ color: "var(--ink-500)" }}>Apoiadores vinculados</span>
                <span className="cc-display font-bold text-sm">{vinculados}</span>
              </div>
            </div>
          );
        })}
      </div>
      {modal && (
        <Modal title={modal.mode === "new" ? "Nova liderança" : "Editar liderança"} onClose={() => setModal(null)}>
          <FormLideranca data={modal.data} onSave={save} />
        </Modal>
      )}
    </div>
  );
}

function FormLideranca({ data, onSave }) {
  const [form, setForm] = useState(data);
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <Field label="Nome"><input required className={inputCls} style={inputStyle} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></Field>
      <Field label="Bairro / Região"><input required className={inputCls} style={inputStyle} value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })} /></Field>
      <Field label="Telefone"><input required className={inputCls} style={inputStyle} value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></Field>
      <Field label="Status">
        <select className={inputCls} style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          <option>Ativa</option><option>Inativa</option>
        </select>
      </Field>
      <button type="submit" className="w-full mt-2 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>Salvar</button>
    </form>
  );
}

function DemandasView({ items, setItems, table }) {
  const [modal, setModal] = useState(null);
  const statuses = ["Nova", "Em análise", "Em andamento", "Resolvida", "Cancelada"];

  function openNew() { setModal({ mode: "new", data: { solicitante: "", categoria: "Saúde", descricao: "", bairro: BAIRROS[0], prioridade: "Média", status: "Nova", prazo: "" } }); }
  function openEdit(item) { setModal({ mode: "edit", data: item }); }
  function save(form) {
    if (modal.mode === "new") {
      table.insert(form);
    } else {
      table.update(form.id, form);
    }
    setModal(null);
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
                {d.solicitante} • {d.categoria} • {d.bairro} • prazo {d.prazo}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select value={d.status} onChange={e => changeStatus(d.id, e.target.value)}
                className="text-xs font-medium rounded-full px-2 py-1 border" style={{ borderColor: "var(--border)" }}>
                {statuses.map(s => <option key={s}>{s}</option>)}
              </select>
              <button onClick={() => openEdit(d)} className="p-1.5 rounded-md hover:bg-gray-100"><Pencil size={14} /></button>
              <button onClick={() => remove(d.id)} className="p-1.5 rounded-md hover:bg-gray-100"><Trash2 size={14} style={{ color: "var(--red-500)" }} /></button>
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
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoria">
          <select className={inputCls} style={inputStyle} value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
            <option>Saúde</option><option>Educação</option><option>Infraestrutura</option><option>Assistência social</option><option>Outros</option>
          </select>
        </Field>
        <Field label="Bairro">
          <select className={inputCls} style={inputStyle} value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })}>
            {BAIRROS.map(b => <option key={b}>{b}</option>)}
          </select>
        </Field>
      </div>
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
  function openEdit(item) { setModal({ mode: "edit", data: item }); }
  function save(form) {
    if (modal.mode === "new") {
      table.insert(form);
    } else {
      table.update(form.id, form);
    }
    setModal(null);
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
                    <button onClick={() => openEdit(a)} className="p-1.5 rounded-md hover:bg-gray-100"><Pencil size={14} /></button>
                    <button onClick={() => remove(a.id)} className="p-1.5 rounded-md hover:bg-gray-100"><Trash2 size={14} style={{ color: "var(--red-500)" }} /></button>
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
  function openEdit(item) { setModal({ mode: "edit", data: item }); }
  function save(form) {
    const payload = { ...form, valor: Number(form.valor) || 0 };
    if (modal.mode === "new") {
      table.insert(payload);
    } else {
      table.update(form.id, payload);
    }
    setModal(null);
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
      <div className="cc-card overflow-x-auto cc-scroll">
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
                <td className="px-4 py-3 cc-display font-semibold">{fmt(g.valor)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(g)} className="p-1.5 rounded-md hover:bg-gray-100"><Pencil size={14} /></button>
                    <button onClick={() => remove(g.id)} className="p-1.5 rounded-md hover:bg-gray-100"><Trash2 size={14} style={{ color: "var(--red-500)" }} /></button>
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
                  <button onClick={() => openEdit(m)} className="p-1.5 rounded-md hover:bg-gray-100"><Pencil size={13} /></button>
                  <button onClick={() => remove(m.id)} className="p-1.5 rounded-md hover:bg-gray-100"><Trash2 size={13} style={{ color: "var(--red-500)" }} /></button>
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
                <button onClick={() => openEdit(v)} className="p-1.5 rounded-md hover:bg-gray-100"><Pencil size={14} /></button>
                <button onClick={() => remove(v.id)} className="p-1.5 rounded-md hover:bg-gray-100"><Trash2 size={14} style={{ color: "var(--red-500)" }} /></button>
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
                <button onClick={() => openEdit(ev)} className="p-1.5 rounded-md hover:bg-gray-100"><Pencil size={13} /></button>
                <button onClick={() => remove(ev.id)} className="p-1.5 rounded-md hover:bg-gray-100"><Trash2 size={13} style={{ color: "var(--red-500)" }} /></button>
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
  function openEdit(item) { setModal({ mode: "edit", data: item }); }
  function save(form) {
    if (modal.mode === "new") {
      table.insert(form);
    } else {
      table.update(form.id, form);
    }
    setModal(null);
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
              <button onClick={() => openEdit(t)} className="p-1.5 rounded-md hover:bg-gray-100"><Pencil size={14} /></button>
              <button onClick={() => remove(t.id)} className="p-1.5 rounded-md hover:bg-gray-100"><Trash2 size={14} style={{ color: "var(--red-500)" }} /></button>
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

function RelatoriosView({ eleitores, metas, setMetas, metasKV }) {
  const [editingMeta, setEditingMeta] = useState(null);

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

  return (
    <div className="flex flex-col gap-4">
      <div className="cc-card p-4 flex items-start gap-2" style={{ background: "#EAF1FE" }}>
        <BarChart3 size={16} style={{ color: "var(--blue-600)" }} className="mt-0.5 flex-shrink-0" />
        <p className="text-xs" style={{ color: "var(--navy-900)" }}>
          Relatório de votos por cargo — meta definida pela campanha × intenção de voto declarada pelos {eleitores.length} eleitores/apoiadores cadastrados. Total geral, sem quebra por cidade/bairro.
        </p>
      </div>

      <div className="cc-card overflow-x-auto cc-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: "var(--ink-500)" }}>
              <th className="px-4 py-3 font-medium">Cargo</th>
              <th className="px-4 py-3 font-medium">Meta de votos</th>
              <th className="px-4 py-3 font-medium">Intenção declarada</th>
              <th className="px-4 py-3 font-medium">% da meta</th>
              <th className="px-4 py-3 font-medium">Indecisos</th>
              <th className="px-4 py-3 font-medium">Outro candidato</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(l => (
              <tr key={l.cargo} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-3 font-semibold">{l.cargo}</td>
                <td className="px-4 py-3">
                  {editingMeta === l.cargo ? (
                    <input
                      autoFocus type="number" defaultValue={l.meta}
                      className="w-24 border rounded-lg px-2 py-1 text-sm" style={inputStyle}
                      onBlur={e => saveMeta(l.cargo, e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveMeta(l.cargo, e.target.value); }}
                    />
                  ) : (
                    <button onClick={() => setEditingMeta(l.cargo)} className="cc-display font-semibold flex items-center gap-1.5 hover:underline" style={{ color: "var(--ink-900)" }}>
                      {l.meta.toLocaleString("pt-BR")} <Pencil size={11} style={{ color: "var(--ink-300)" }} />
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 cc-display font-bold" style={{ color: "var(--blue-600)" }}>{l.nosso.toLocaleString("pt-BR")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 rounded-full" style={{ background: "var(--border)" }}>
                      <div className="h-2 rounded-full" style={{ width: `${l.pct}%`, background: l.pct >= 100 ? "var(--green-500)" : "var(--blue-600)" }} />
                    </div>
                    <span className="text-xs font-medium">{l.pct}%</span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: "var(--amber-500)" }}>{l.indeciso}</td>
                <td className="px-4 py-3" style={{ color: "var(--ink-500)" }}>{l.outro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cc-card p-5">
        <h3 className="cc-display font-semibold text-sm mb-4">Meta × intenção declarada por cargo</h3>
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

function PesquisasView({ items, setItems, table }) {
  const [modal, setModal] = useState(null);

  function openNew() { setModal({ mode: "new", data: { titulo: "", data: "", responsavel: "", opcoes: [{ texto: "", respostas: 0 }, { texto: "", respostas: 0 }] } }); }
  function openEdit(item) { setModal({ mode: "edit", data: { ...item, opcoes: (item.opcoes || []).map(o => ({ ...o })) } }); }
  function save(form) {
    const opcoes = form.opcoes.filter(o => o.texto.trim());
    const payload = { ...form, opcoes };
    if (modal.mode === "new") {
      table.insert(payload);
    } else {
      table.update(form.id, payload);
    }
    setModal(null);
  }
  function remove(id) { table.remove(id); }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--blue-600)" }}>
          <Plus size={16} /> Nova pesquisa
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {items.map(p => {
          const total = p.opcoes.reduce((s, o) => s + Number(o.respostas || 0), 0);
          return (
            <div key={p.id} className="cc-card p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{p.titulo}</p>
                  <p className="text-xs" style={{ color: "var(--ink-500)" }}>{p.data} • {p.responsavel} • {total} respostas</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-gray-100"><Pencil size={14} /></button>
                  <button onClick={() => remove(p.id)} className="p-1.5 rounded-md hover:bg-gray-100"><Trash2 size={14} style={{ color: "var(--red-500)" }} /></button>
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
        {items.length === 0 && <EmptyState text="Nenhuma pesquisa registrada." />}
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
      <span className="text-sm font-medium block mb-2" style={{ color: "var(--ink-500)" }}>Opções de resposta e contagem</span>
      <div className="flex flex-col gap-2 mb-2">
        {form.opcoes.map((o, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input placeholder="Opção de resposta" className={inputCls} style={{ ...inputStyle, flex: 2 }} value={o.texto} onChange={e => updateOpcao(idx, "texto", e.target.value)} />
            <input type="number" placeholder="0" className={inputCls} style={{ ...inputStyle, width: "5rem" }} value={o.respostas} onChange={e => updateOpcao(idx, "respostas", e.target.value)} />
            <button type="button" onClick={() => removeOpcao(idx)} className="p-2 rounded-md hover:bg-gray-100"><Trash2 size={14} style={{ color: "var(--red-500)" }} /></button>
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
      <div className="cc-card overflow-x-auto cc-scroll">
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
                    <button onClick={() => openEdit(d)} className="p-1.5 rounded-md hover:bg-gray-100"><Pencil size={14} /></button>
                    <button onClick={() => remove(d.id)} className="p-1.5 rounded-md hover:bg-gray-100"><Trash2 size={14} style={{ color: "var(--red-500)" }} /></button>
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

function EmBreveView({ label }) {
  return (
    <div className="cc-card p-10 flex flex-col items-center text-center gap-2">
      <ChevronRight size={20} style={{ color: "var(--ink-300)" }} />
      <p className="cc-display font-semibold">{label}</p>
      <p className="text-sm max-w-sm" style={{ color: "var(--ink-500)" }}>
        Módulo previsto no plano do CONecta Campanha. Ainda não implementado neste protótipo — entra na próxima etapa junto com a integração ao Supabase.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App shell
// ---------------------------------------------------------------------------
export default function App() {
  const [view, setView] = useState("dashboard");
  const eleitoresTable = useSupabaseTable("eleitores", seedEleitores);
  const liderancasTable = useSupabaseTable("liderancas", seedLiderancas);
  const demandasTable = useSupabaseTable("demandas", seedDemandas);
  const agendaTable = useSupabaseTable("agenda", seedAgenda);
  const gastosTable = useSupabaseTable("gastos", seedGastos);
  const materialTable = useSupabaseTable("material", seedMaterial);
  const visitasTable = useSupabaseTable("visitas", seedVisitas);
  const eventosTable = useSupabaseTable("eventos", seedEventos);
  const tarefasTable = useSupabaseTable("tarefas", seedTarefas);
  const metasVotosKV = useSupabaseKV("metas_votos", seedMetasVotos);
  const pesquisasTable = useSupabaseTable("pesquisas", seedPesquisas);
  const documentosTable = useSupabaseTable("documentos", seedDocumentos);

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
  const pesquisas = pesquisasTable.items;
  const setPesquisas = pesquisasTable.setItems;
  const documentos = documentosTable.items;
  const setDocumentos = documentosTable.setItems;

  const current = MENU.find(m => m.key === view);

  return (
    <div className="cc-root min-h-screen flex flex-col">
      <style>{THEME}</style>

      {/* Topbar */}
      <header className="cc-sash text-white relative z-20">
        <div className="px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between relative z-10">
          <div className="flex items-baseline gap-2">
            <p className="cc-display font-bold text-lg leading-tight">CONecta</p>
            <p className="cc-display font-bold text-lg leading-tight" style={{ color: "var(--teal-400)" }}>Campanha</p>
          </div>
          <button className="p-2 rounded-full hover:bg-white/10 relative">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "var(--red-500)" }} />
          </button>
        </div>

        {/* Tabs — sempre visíveis, rolagem horizontal */}
        <nav className="flex gap-1 overflow-x-auto cc-scroll px-4 sm:px-6 pb-3 relative z-10">
          {MENU.map(m => {
            const Icon = m.icon;
            const activeView = view === m.key;
            return (
              <button
                key={m.key}
                onClick={() => { if (m.active) setView(m.key); }}
                className={`cc-navlink flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${m.active ? "" : "opacity-40 cursor-not-allowed"}`}
                style={{ background: activeView ? "rgba(255,255,255,0.16)" : "transparent" }}
              >
                <Icon size={14} />
                {m.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="cc-card border-x-0 border-t-0 rounded-none px-4 sm:px-6 py-3 flex items-center justify-between" style={{ background: "var(--surface)" }}>
          <div>
            <h1 className="cc-display font-bold text-lg">{current?.label}</h1>
            <p className="text-xs" style={{ color: "var(--ink-500)" }}>Campanha 2026 • {CIDADE_REDUTO} • dados de demonstração</p>
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 cc-fade-in">
          {view === "dashboard" && <DashboardView eleitores={eleitores} liderancas={liderancas} demandas={demandas} agenda={agenda} gastos={gastos} material={material} />}
          {view === "eleitores" && <EleitoresView items={eleitores} setItems={setEleitores} liderancas={liderancas} table={eleitoresTable} />}
          {view === "liderancas" && <LiderancasView items={liderancas} setItems={setLiderancas} eleitores={eleitores} table={liderancasTable} />}
          {view === "demandas" && <DemandasView items={demandas} setItems={setDemandas} table={demandasTable} />}
          {view === "agenda" && <AgendaView items={agenda} setItems={setAgenda} table={agendaTable} />}
          {view === "gastos" && <GastosView items={gastos} setItems={setGastos} table={gastosTable} />}
          {view === "material" && <MaterialView items={material} setItems={setMaterial} table={materialTable} />}
          {view === "visitas" && <VisitasView items={visitas} setItems={setVisitas} table={visitasTable} />}
          {view === "eventos" && <EventosView items={eventos} setItems={setEventos} table={eventosTable} />}
          {view === "tarefas" && <TarefasView items={tarefas} setItems={setTarefas} table={tarefasTable} />}
          {view === "relatorios" && <RelatoriosView eleitores={eleitores} metas={metasVotos} setMetas={setMetasVotos} metasKV={metasVotosKV} />}
          {view === "pesquisas" && <PesquisasView items={pesquisas} setItems={setPesquisas} table={pesquisasTable} />}
          {view === "documentos" && <DocumentosView items={documentos} setItems={setDocumentos} table={documentosTable} />}
          {current && !current.active && <EmBreveView label={current.label} />}
        </main>
      </div>
    </div>
  );
}
