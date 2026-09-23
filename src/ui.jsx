// ---------------------------------------------------------------------------
// Componentes de interface reutilizáveis (estilo app): toast, confirmação,
// botões de ícone, modal/bottom-sheet, skeleton, tela de carregamento.
// ---------------------------------------------------------------------------
import React, { useEffect, useState, useCallback, useRef } from "react";
import { X, CheckCircle2, AlertTriangle, Info, Inbox } from "lucide-react";

// ---------- hook: tela pequena ----------
export function useIsMobile(bp = 768) {
  const q = `(max-width: ${bp - 1}px)`;
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, [q]);
  return m;
}

// ---------- Toast (mensagens de sucesso/erro) ----------
// Qualquer parte do app pode chamar toast("Salvo") ou toast("Erro…", "erro").
export function toast(texto, tipo = "ok") {
  window.dispatchEvent(new CustomEvent("cc-toast", { detail: { texto, tipo } }));
}
export function ToastHost() {
  const [itens, setItens] = useState([]);
  useEffect(() => {
    const on = (e) => {
      const id = Math.random().toString(36).slice(2);
      setItens((l) => [...l.slice(-2), { id, ...e.detail }]);
      setTimeout(() => setItens((l) => l.filter((t) => t.id !== id)), e.detail.tipo === "erro" ? 5000 : 2600);
    };
    window.addEventListener("cc-toast", on);
    return () => window.removeEventListener("cc-toast", on);
  }, []);
  if (!itens.length) return null;
  return (
    <div className="cc-toasts" role="status" aria-live="polite">
      {itens.map((t) => {
        const Icon = t.tipo === "erro" ? AlertTriangle : t.tipo === "info" ? Info : CheckCircle2;
        return (
          <div key={t.id} className={`cc-toast cc-toast-${t.tipo}`}>
            <Icon size={18} aria-hidden /> <span>{t.texto}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Confirmação (substitui exclusão sem aviso) ----------
let abrirConfirm = null;
export function confirmar(mensagem = "Tem certeza que deseja excluir?", { titulo = "Confirmar exclusão", botao = "Excluir" } = {}) {
  if (!abrirConfirm) return Promise.resolve(window.confirm(mensagem));
  return new Promise((resolve) => abrirConfirm({ mensagem, titulo, botao, resolve }));
}
export function ConfirmHost() {
  const [pedido, setPedido] = useState(null);
  useEffect(() => { abrirConfirm = setPedido; return () => { abrirConfirm = null; }; }, []);
  const fechar = (ok) => { pedido?.resolve(ok); setPedido(null); };
  if (!pedido) return null;
  return (
    <Sheet title={pedido.titulo} onClose={() => fechar(false)} small>
      <p className="text-sm mb-5" style={{ color: "var(--ink-500)" }}>{pedido.mensagem}</p>
      <div className="grid grid-cols-2 gap-2">
        <button className="cc-btn cc-btn-secondary" onClick={() => fechar(false)}>Cancelar</button>
        <button className="cc-btn cc-btn-danger" autoFocus onClick={() => fechar(true)}>{pedido.botao}</button>
      </div>
    </Sheet>
  );
}

// ---------- Modal responsivo: bottom-sheet no celular, janela no desktop ----------
export function Sheet({ title, onClose, children, small, footer }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="cc-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}
        className={`cc-sheet ${small ? "cc-sheet-sm" : ""}`}>
        <div className="cc-sheet-grab" aria-hidden />
        <div className="cc-sheet-head">
          <h3 className="cc-display font-semibold text-base truncate">{title}</h3>
          <button onClick={onClose} className="cc-iconbtn" aria-label="Fechar"><X size={20} /></button>
        </div>
        <div className="cc-sheet-body">{children}</div>
        {footer && <div className="cc-sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- Botão de ícone com área de toque de 40px ----------
export function IconBtn({ label, onClick, children, danger, className = "", ...rest }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className={`cc-iconbtn ${danger ? "cc-iconbtn-danger" : ""} ${className}`} {...rest}>
      {children}
    </button>
  );
}

// ---------- Estado vazio ----------
export function Vazio({ texto, acao }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3" style={{ color: "var(--ink-500)" }}>
      <span className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#EAF1FE", color: "var(--blue-600)" }}><Inbox size={22} /></span>
      <p className="text-sm">{texto}</p>
      {acao}
    </div>
  );
}

// ---------- Skeleton ----------
export function Skeleton({ linhas = 4 }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <div key={i} className="cc-skel h-20" />)}
      </div>
      {Array.from({ length: linhas }).map((_, i) => <div key={i} className="cc-skel h-16" />)}
    </div>
  );
}

// ---------- Tela de carregamento inicial ----------
export function LoadingScreen({ saindo }) {
  return (
    <div className={`cc-splash ${saindo ? "cc-splash-out" : ""}`} aria-label="Carregando o CONecta Campanha">
      <img src="/icon-192.png" alt="" width={84} height={84} className="cc-splash-logo" />
      <p className="cc-display font-bold text-xl text-white mt-5">CONecta <span style={{ color: "var(--teal-400)" }}>Campanha</span></p>
      <div className="cc-splash-bar" aria-hidden><span /></div>
      <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,.7)" }}>Carregando…</p>
    </div>
  );
}

// ---------- Hook: executar ação com estado de carregamento ----------
export function useAcao() {
  const [ocupado, setOcupado] = useState(false);
  const run = useCallback(async (fn) => {
    setOcupado(true);
    try { return await fn(); } finally { setOcupado(false); }
  }, []);
  return [ocupado, run];
}
