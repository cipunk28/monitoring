import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, Sparkles, Activity, AlertOctagon, Terminal, Copy, Check, MessageSquare, Send, RotateCw, RefreshCw 
} from "lucide-react";
const cipunkLogo = "/src/assets/images/cipunk_cool_logo_1779637124584.png";

// Robust, high-fidelity custom parser to render Gemini markdown formatted text beautifully 
// without needing extra node libraries that might break installations
function FormattedAiContent({ text }: { text: string }) {
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedScript(code);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  // Split lines and parse blocks
  const parts: React.JSX.Element[] = [];
  const lines = text.split("\n");
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeLang = "";

  lines.forEach((line, idx) => {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        const fullCode = codeBlockLines.join("\n");
        parts.push(
          <div key={`code-${idx}`} className="my-4 border border-slate-700 rounded-lg overflow-hidden bg-slate-950 glow-cyan">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 flex items-center justify-between text-[11px] font-mono font-bold text-slate-400">
              <span className="flex items-center gap-1.5 uppercase">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                {codeLang || "RouterOS Script"}
              </span>
              <button
                onClick={() => handleCopy(fullCode)}
                className="flex items-center gap-1 hover:text-cyan-400 text-slate-400 transition-colors cursor-pointer"
              >
                {copiedScript === fullCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Script
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-xs text-cyan-400 font-mono leading-relaxed select-all">
              <code>{fullCode}</code>
            </pre>
          </div>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
        codeLang = line.replace("```", "").trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    const trimmed = line.trim();
    if (trimmed === "") {
      parts.push(<div key={`empty-${idx}`} className="h-2" />);
      return;
    }

    // Bold tags & bullet replacement
    if (trimmed.startsWith("###")) {
      parts.push(
        <h4 key={`h4-${idx}`} className="text-sm font-semibold text-slate-100 mt-4 mb-2 border-b border-slate-800 pb-1 uppercase tracking-wide flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          {trimmed.replace("###", "").trim()}
        </h4>
      );
    } else if (trimmed.startsWith("##") || trimmed.startsWith("#")) {
      parts.push(
        <h3 key={`h3-${idx}`} className="text-base font-bold text-cyan-400 mt-5 mb-2.5 flex items-center gap-1.5">
          <Bot className="w-5 h-5" />
          {trimmed.replace(/^[#]+/, "").trim()}
        </h3>
      );
    } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      // Bold matches inside bullets
      const cleanBullet = trimmed.replace(/^[-*]\s*/, "");
      parts.push(
        <li key={`bullet-${idx}`} className="text-slate-300 text-xs ml-4 list-disc pl-1 py-1.5 leading-relaxed">
          {parseInlineFormatting(cleanBullet)}
        </li>
      );
    } else {
      parts.push(
        <p key={`p-${idx}`} className="text-slate-300 text-xs leading-relaxed py-1">
          {parseInlineFormatting(trimmed)}
        </p>
      );
    }
  });

  return <div className="space-y-1">{parts}</div>;
}

// Simple bold matches helper
function parseInlineFormatting(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.substring(2, part.length - 2)}
        </strong>
      );
    }
    return part;
  });
}

export default function AiAdvisor() {
  const [report, setReport] = useState<string>("");
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnoseError, setDiagnoseError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const [chatMessages, setChatMessages] = useState<Array<{ sender: "User" | "AI"; text: string; timestamp: string }>>([
    {
      sender: "AI",
      text: "Halo! Saya **CiPUNK AI NOC Bot**. Saya siap membantu menganalisis konfigurasi RouterOS Anda, troubleshooting rute BGP, setting Queue Tree parent, maupun masalah isolir billing. Silakan tanyakan hal-hal terkait konfigurasi Mikrotik atau troubleshooting OLT/ONU fiber optic Anda!",
      timestamp: new Date().toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const runDiagnostic = async () => {
    setIsDiagnosing(true);
    setDiagnoseError("");
    setReport("");
    
    // Animate diagnostic phases
    const phases = [
      "Mengumpulkan telemetry perangkat Surabaya Core...",
      "Menganalisa status bandwidth utilisasi upload/download...",
      "Scraping log isolir pelanggan PPPoE...",
      "Mengekstrak parameter ONU/OLT redaman fiber optik...",
      "Meluncurkan analis otomatis Gemini 3.5 Flash NOC Engine..."
    ];

    let pIdx = 0;
    setStatusMessage(phases[0]);
    const timer = setInterval(() => {
      pIdx++;
      if (pIdx < phases.length) {
        setStatusMessage(phases[pIdx]);
      }
    }, 1500);

    try {
      const resp = await fetch("/api/ai/diagnose", { method: "POST" });
      const data = await resp.json();
      if (resp.ok) {
        setReport(data.text);
      } else {
        setDiagnoseError(data.error || "Gagal melakukan scan.");
      }
    } catch (err: any) {
      setDiagnoseError("Koneksi gagal: " + err.message);
    } finally {
      clearInterval(timer);
      setIsDiagnosing(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;

    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(prev => [
      ...prev,
      {
        sender: "User",
        text: userMsg,
        timestamp: new Date().toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    
    setIsChatSending(true);

    try {
      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          chatHistory: chatMessages.slice(-8) // send last few for context
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        setChatMessages(prev => [
          ...prev,
          {
            sender: "AI",
            text: data.text,
            timestamp: new Date().toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            sender: "AI",
            text: "Maaf Kak, saya mengalami gangguan komunikasi dengan server pusat NOC. Mohon dicoba beberapa saat lagi.",
            timestamp: new Date().toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: "AI",
          text: "Gagal menghubungkan ke AI Engine backend. Pastikan server dev server online.",
          timestamp: new Date().toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* LEFT: Complete Diagnosis Dashboard */}
      <div className="lg:col-span-7 flex flex-col justify-between glass-panel p-5 rounded-xl border border-slate-800">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 border border-cyan-500/30 p-0.5 flex-shrink-0">
              <img 
                src={cipunkLogo} 
                alt="CiPUNK Logo" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 uppercase tracking-wide">
                Diagnostik & Optimasi Otomatis AI (Gemini)
              </h3>
              <p className="text-xs text-slate-400">
                Pindai gangguan redaman serat optik, overload bandwidth, & generasikan script auto-recovery Mikrotik
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-normal bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
            Modul AI ini membaca seluruh visual data telemetry secara live (CPU load, active PPPoE, laser parameters ONU, status isolir billings) untuk memberikan audit performa server NOC yang siap pakai.
          </p>

          {/* Diagnosis output body */}
          {isDiagnosing ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 space-y-4">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-cyan-400 font-mono tracking-wider">PROSES SCANNING SEDANG JALAN...</p>
                <p className="text-xs text-slate-400 mt-1 animate-pulse">{statusMessage}</p>
              </div>
            </div>
          ) : report ? (
            <div className="border border-slate-800 rounded-lg bg-slate-950/40 p-5 overflow-y-auto max-h-[500px]">
              <FormattedAiContent text={report} />
            </div>
          ) : diagnoseError ? (
            <div className="flex gap-2 items-start p-4 bg-rose-950/20 border border-rose-900/40 rounded-lg text-rose-400 text-xs">
              <AlertOctagon className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold mb-1">Gagal Pindai Jaringan via AI</strong>
                {diagnoseError}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-700/60 rounded-xl py-14 text-center text-slate-500 font-medium text-xs">
              Sistem bersandiwara dalam NOC status normal. Klik tombol di bawah ini untuk menginstruksikan AI melakukan diagnostic mendalam.
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-slate-800 pt-4 flex justify-end">
          <button
            onClick={runDiagnostic}
            disabled={isDiagnosing}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            Mulai Kirim Diagnostik AI
          </button>
        </div>
      </div>

      {/* RIGHT: AI Tech Assistant Chatbot */}
      <div className="lg:col-span-5 glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between h-[650px]">
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3 h-12">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 border border-emerald-500/30 p-0.5 flex-shrink-0 animate-pulse">
              <img 
                src={cipunkLogo} 
                alt="CiPUNK Logo" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
                CiPUNK AI NOC Bot
              </h3>
              <p className="text-[10px] text-emerald-400 font-semibold font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                ACTIVE NOC ASSISTANT
              </p>
            </div>
          </div>

          {/* Message log wrapper */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto py-4 space-y-4 px-1"
          >
            {chatMessages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.sender === "User" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                  msg.sender === "User"
                    ? "bg-cyan-600 text-slate-950 font-medium rounded-tr-none"
                    : "bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none font-normal"
                }`}>
                  <div className="font-mono text-[9px] opacity-60 mb-1">
                    {msg.sender === "User" ? "NOC Admin" : "CiPUNK NOC Support AI"} • {msg.timestamp}
                  </div>
                  <FormattedAiContent text={msg.text} />
                </div>
              </div>
            ))}

            {isChatSending && (
              <div className="flex justify-start">
                <div className="bg-slate-900 text-slate-300 border border-slate-800 rounded-xl rounded-tl-none p-3.5 flex items-center gap-2 text-xs">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  AI NOC sedang merumuskan solusi RouterOS...
                </div>
              </div>
            )}
          </div>

          {/* Form wrapper */}
          <form onSubmit={handleSendChat} className="border-t border-slate-800 pt-3 flex gap-2 h-12">
            <input
              type="text"
              placeholder="Tanya hal teknis (misal: script backup, limit PPPoE)..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              disabled={isChatSending}
              className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-lg px-3.5 text-xs focus:outline-none focus:border-cyan-500 font-sans"
            />
            <button
              type="submit"
              disabled={isChatSending || !chatInput.trim()}
              className="p-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
