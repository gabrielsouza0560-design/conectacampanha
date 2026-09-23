import { useState, useEffect } from "react";

// Aviso para instalar o app na tela inicial do celular.
// Android/Chrome: botão "Instalar" (prompt nativo).
// iPhone/iPad (Safari): instruções "Compartilhar → Adicionar à Tela de Início".
const CHAVE = "cc-install-dispensado";
const DIAS = 7;

function jaInstalado() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
function dispensadoRecente() {
  try { const t = Number(localStorage.getItem(CHAVE) || 0); return Date.now() - t < DIAS * 864e5; } catch { return false; }
}
function ehIOS() {
  const ua = navigator.userAgent || "";
  return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [ios, setIos] = useState(false);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (jaInstalado() || dispensadoRecente()) return;
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setVisivel(true); };
    window.addEventListener("beforeinstallprompt", handler);
    const installed = () => { setDeferredPrompt(null); setVisivel(false); };
    window.addEventListener("appinstalled", installed);
    if (ehIOS()) { setIos(true); const t = setTimeout(() => setVisivel(true), 1500); return () => clearTimeout(t); }
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  if (!visivel) return null;

  const fechar = () => { setVisivel(false); try { localStorage.setItem(CHAVE, String(Date.now())); } catch { /* sem armazenamento */ } };
  const instalar = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") setVisivel(false);
  };

  return (
    <div role="dialog" aria-label="Instalar o app"
      style={{
        position: "fixed", left: 12, right: 12, zIndex: 40,
        bottom: "calc(76px + env(safe-area-inset-bottom, 0px))",
        margin: "0 auto", maxWidth: 440,
        background: "linear-gradient(135deg, #1B5FC4 0%, #0F2540 100%)", color: "#fff",
        borderRadius: 14, padding: "12px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        display: "flex", alignItems: "center", gap: 12, fontFamily: "'Inter', sans-serif", fontSize: 14,
        animation: "cc-fade .3s ease",
      }}>
      <img src="/icon-192.png" alt="" width={40} height={40} style={{ borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, lineHeight: 1.35 }}>
        <div style={{ fontWeight: 700 }}>Instale o CONecta no celular</div>
        {ios ? (
          <div style={{ fontSize: 12.5, opacity: 0.9 }}>
            Toque em <b>Compartilhar</b> <span aria-hidden>⬆︎</span> e depois em <b>Adicionar à Tela de Início</b>.
          </div>
        ) : (
          <div style={{ fontSize: 12.5, opacity: 0.9 }}>Abra direto da tela inicial, como um app.</div>
        )}
      </div>
      {!ios && (
        <button onClick={instalar}
          style={{ background: "#38C6C8", color: "#0A1929", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
          Instalar
        </button>
      )}
      <button onClick={fechar} aria-label="Fechar"
        style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4 }}>
        ✕
      </button>
    </div>
  );
}
