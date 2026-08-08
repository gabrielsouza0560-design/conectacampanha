import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installed = () => {
      setDeferredPrompt(null);
      setDismissed(true);
    };
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "env(safe-area-inset-bottom, 16px)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: "linear-gradient(135deg, #1B5FC4 0%, #0F2540 100%)",
        color: "#fff",
        borderRadius: 14,
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        maxWidth: "calc(100vw - 32px)",
        fontFamily: "'Inter', sans-serif",
        fontSize: 14,
        animation: "cc-fade .3s ease",
        marginBottom: 16,
      }}
    >
      <span style={{ flex: 1 }}>Instalar o app no seu dispositivo</span>
      <button
        onClick={handleInstall}
        style={{
          background: "#38C6C8",
          color: "#0A1929",
          border: "none",
          borderRadius: 8,
          padding: "8px 16px",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Instalar
      </button>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.6)",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          padding: "4px",
        }}
        aria-label="Fechar"
      >
        ✕
      </button>
    </div>
  );
}
