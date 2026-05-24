import React, { useState } from "react";
import { NotificationAlert } from "../types";
import { 
  Send, Check, Bot, Settings, RefreshCw, AlertCircle, HelpCircle, Lock, Eye, EyeOff, ExternalLink, MessageSquare, Terminal
} from "lucide-react";

interface TelegramBotManagerProps {
  alerts: NotificationAlert[];
  settings: {
    whatsappEnabled: boolean;
    whatsappApiUrl: string;
    whatsappToken: string;
    telegramEnabled: boolean;
    telegramBotToken: string;
    telegramChatId: string;
    autoIsolirEnabled: boolean;
    autoBackupEnabled: boolean;
  };
  onUpdateSettings: (settings: any) => Promise<void>;
}

export default function TelegramBotManager({ alerts, settings, onUpdateSettings }: TelegramBotManagerProps) {
  const [tgEnabled, setTgEnabled] = useState(settings.telegramEnabled);
  const [tgToken, setTgToken] = useState(settings.telegramBotToken);
  const [tgChatId, setTgChatId] = useState(settings.telegramChatId);
  const [showToken, setShowToken] = useState(false);

  // Testing message states
  const [testMessage, setTestMessage] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateSettings({
        ...settings,
        telegramEnabled: tgEnabled,
        telegramBotToken: tgToken,
        telegramChatId: tgChatId
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!tgToken || !tgChatId) {
      setTestResult({
        success: false,
        message: "Bot Token dan Chat ID wajib diisi sebelum mengirimkan pesan tes."
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: tgToken,
          chatId: tgChatId,
          message: testMessage || undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: "Notifikasi tes berhasil dikirimkan ke Telegram!"
        });
        setTestMessage("");
      } else {
        setTestResult({
          success: false,
          message: data.message || "Gagal mengirimkan notifikasi tes."
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: "Koneksi bermasalah: " + err.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const telegramLogs = alerts.filter(a => a.type === "telegram");

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40 relative overflow-hidden">
        {/* Decorative ambient light */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-tight uppercase">
                Kontrol Integrasi Bot Telegram NOC
              </h2>
              <p className="text-[11px] text-slate-400">
                Hubungkan Logger MikroTik PPPoE & Alert System otomatis langsung ke Grup Telegram Anda
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <a 
              href="https://t.me/BotFather" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 text-[11px] font-bold rounded-lg transition-all cursor-pointer font-sans"
            >
              Hubungi @BotFather <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Settings Form */}
          <form onSubmit={handleSaveSettings} className="lg:col-span-7 space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Status Integrasi Telegram Bot</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Aktifkan untuk mulai menyalurkan notifikasi router offline, log PPP, dan info billing</p>
                </div>
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={tgEnabled}
                    onChange={e => setTgEnabled(e.target.checked)}
                    className="hidden peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 peer-checked:after:bg-slate-950 peer-checked:after:border-slate-950 relative"></div>
                  <span className="text-[10px] text-blue-400 font-bold ml-2.5 min-w-[35px]">{tgEnabled ? "ACTIVE" : "OFF"}</span>
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>TELEGRAM BOT TOKEN</span>
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="text-slate-400 hover:text-slate-200 text-[10px] flex items-center gap-1 focus:outline-none cursor-pointer font-bold font-sans uppercase"
                    >
                      {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showToken ? "Sembunyikan" : "Tampilkan"}
                    </button>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showToken ? "text" : "password"}
                      required={tgEnabled}
                      placeholder="Contoh: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      value={tgToken}
                      onChange={e => setTgToken(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-9 pr-4 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500 font-medium h-[38px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">GROUP CHAT ID (ID GRUP / CHANNEL)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-bold font-mono text-[10px]">
                      ID
                    </div>
                    <input
                      type="text"
                      required={tgEnabled}
                      placeholder="Contoh: -100123456789 (Diawali tanda minus untuk Grup)"
                      value={tgChatId}
                      onChange={e => setTgChatId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-9 pr-4 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-blue-500 font-medium h-[38px]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer uppercase tracking-wider h-[38px] shadow-[0_0_15px_rgba(59,130,246,0.25)]"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {saving ? "Menyimpan..." : saveSuccess ? "Pengaturan Tersimpan!" : "Simpan Token & Chat ID"}
                </button>
              </div>
            </div>

            {/* Test Transmission Suite */}
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3.5">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  Tes Transmisi (Direct API Gateway)
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Kirimkan pesan instan lewat API untuk menguji konektivitas token dan chat ID Anda</p>
              </div>

              <div className="space-y-3">
                <textarea
                  placeholder="Ketikkan teks pesan tes Anda di sini... (Contoh: Halo NOC CiPUNK Net!)"
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2.5 rounded-lg text-xs focus:outline-none focus:border-blue-500 font-sans"
                />

                <button
                  type="button"
                  onClick={handleSendTestMessage}
                  disabled={isTesting}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 font-bold text-xs rounded-lg transition-all cursor-pointer uppercase tracking-wider h-[34px]"
                >
                  {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {isTesting ? "Memproses Kirim..." : "Kirim Pesan Tes"}
                </button>

                {testResult && (
                  <div className={`p-3 rounded-lg flex items-start gap-2 text-[11px] font-sans ${
                    testResult.success 
                      ? "bg-emerald-950/20 border border-emerald-500/20 text-emerald-400" 
                      : "bg-rose-950/20 border border-rose-500/20 text-rose-400"
                  }`}>
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>{testResult.message}</div>
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Setup Tutorial */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                Panduan Setup Bot Telegram
              </h3>

              <div className="space-y-3.5 text-[11px] text-slate-300 leading-relaxed font-sans">
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <p>
                    Ketik <strong>@BotFather</strong> di pencarian Telegram, kirim pesan <strong>/newbot</strong>, beri nama bot & username unik Anda.
                  </p>
                </div>

                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <p>
                    Anda akan mendapatkan <strong>Bot Token</strong> dari BotFather. Salin lalu masukkan ke form Telegram Bot Token di halaman ini.
                  </p>
                </div>

                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <p>
                    Buat Grup Chat baru di Telegram (misal: <i>Log NOC CiPUNK</i>), undang Bot buatan Anda serta akun <strong>@userinfobot</strong> ke grup tersebut.
                  </p>
                </div>

                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    4
                  </span>
                  <p>
                    Lihat pesan ID yang dikirim oleh <strong>@userinfobot</strong> di grup. Format Group ID biasanya diawali dengan minus (contoh: <code>-10048392019</code>). Masukkan pada kolom Group Chat ID.
                  </p>
                </div>
              </div>
            </div>

            {/* Telegram logs stream */}
            <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/80">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                Histori Transmisi Bot Telegram ({telegramLogs.length})
              </h4>
              <div className="max-h-[170px] overflow-y-auto space-y-2 pr-1 font-mono text-[10px] divide-y divide-slate-900">
                {telegramLogs.length === 0 ? (
                  <div className="text-slate-600 text-center py-6">Belum ada histori pengiriman Telegram.</div>
                ) : (
                  telegramLogs.map(log => (
                    <div key={log.id} className="pt-2 flex justify-between gap-1 items-start text-slate-300">
                      <div>
                        <span className="text-emerald-400 font-bold">[SENT]</span> {log.message}
                      </div>
                      <span className="text-slate-500 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
