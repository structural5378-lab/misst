import React, { useState, useEffect } from "react";
import { X, Share, MoreVertical, PlusSquare } from "lucide-react";

function detectDevice() {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [device, setDevice] = useState("desktop");

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    const dismissed = sessionStorage.getItem("install_banner_dismissed");
    if (!isStandalone && !dismissed) {
      setDevice(detectDevice());
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("install_banner_dismissed", "1");
    setVisible(false);
  };

  if (!visible) return null;

  const steps = {
    ios: [
      { icon: <Share className="w-4 h-4 text-blue-400 shrink-0" />, text: 'Tap the Share button at the bottom of Safari' },
      { icon: <PlusSquare className="w-4 h-4 text-blue-400 shrink-0" />, text: 'Scroll down and tap "Add to Home Screen"' },
      { icon: <span className="text-blue-400 font-bold text-sm shrink-0">✓</span>, text: 'Tap "Add" — the app icon will appear on your home screen!' },
    ],
    android: [
      { icon: <MoreVertical className="w-4 h-4 text-blue-400 shrink-0" />, text: 'Tap the 3-dot menu in the top-right of Chrome' },
      { icon: <PlusSquare className="w-4 h-4 text-blue-400 shrink-0" />, text: 'Tap "Add to Home Screen" or "Install App"' },
      { icon: <span className="text-blue-400 font-bold text-sm shrink-0">✓</span>, text: 'Tap "Install" — you\'re all set!' },
    ],
    desktop: [
      { icon: <span className="text-blue-400 font-bold shrink-0">⊕</span>, text: 'Look for the install icon (⊕) in the address bar' },
      { icon: <PlusSquare className="w-4 h-4 text-blue-400 shrink-0" />, text: 'Click it, then click "Install"' },
      { icon: <span className="text-blue-400 font-bold text-sm shrink-0">✓</span>, text: 'The app opens in its own window — no browser needed!' },
    ],
  };

  const titles = {
    ios: "📱 Add to Your Home Screen",
    android: "📱 Install the App",
    desktop: "💻 Install the App",
  };

  const notes = {
    ios: "⚠️ Must be using Safari on iPhone/iPad",
    android: "⚠️ Must be using Chrome on Android",
    desktop: null,
  };

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-blue-500/30 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        <div className="bg-blue-500/10 px-4 py-3 flex items-center justify-between border-b border-blue-500/20">
          <p className="text-sm font-bold text-foreground">{titles[device]}</p>
          <button onClick={dismiss} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-3 space-y-2.5">
          <p className="text-xs text-muted-foreground">Save this app to your home screen for quick one-tap access — just like a real app!</p>
          {steps[device].map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-400">{i + 1}</span>
              </div>
              <div className="flex items-center gap-2 flex-1">
                {step.icon}
                <p className="text-xs text-foreground leading-snug">{step.text}</p>
              </div>
            </div>
          ))}
          {notes[device] && (
            <p className="text-[11px] text-amber-400 bg-amber-500/10 rounded-lg px-3 py-1.5">{notes[device]}</p>
          )}
          <button
            onClick={dismiss}
            className="w-full text-xs text-muted-foreground hover:text-foreground py-1.5 transition-colors"
          >
            I already have it — dismiss
          </button>
        </div>
      </div>
    </div>
  );
}