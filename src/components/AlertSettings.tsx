import React, { useState } from "react";
import { NotificationAlert } from "../types";
import { 
  BellRing, MessageSquare, Send, Check, Settings, Save, AlertTriangle, HelpCircle, Key, RefreshCw 
} from "lucide-react";

interface AlertSettingsProps {
  alerts: NotificationAlert[];
  onUpdateSettings: (settings: any) => Promise<void>;
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
}

export default function AlertSettings({ alerts, onUpdateSettings, settings }: AlertSettingsProps) {
  const [waEnabled, setWaEnabled] = useState(settings.whatsappEnabled);
  const [waUrl, setWaUrl] = useState(settings.whatsappApiUrl);
  const [waToken, setWaToken] = useState(settings.whatsappToken);
  
  const [tgEnabled, setTgEnabled] = useState(settings.telegramEnabled);
  const [tgToken, setTgToken] = useState(settings.telegramBotToken);
  const [tgChatId, setTgChatId] = useState(settings.telegramChatId);

  const [autoIsolir, setAutoIsolir] = useState(settings.autoIsolirEnabled);
  const [autoBackup, setAutoBackup] = useState(settings.autoBackupEnabled);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateSettings({
        whatsappEnabled: waEnabled,
        whatsappApiUrl: waUrl,
        whatsappToken: waToken,
        telegramEnabled: tgEnabled,
        telegramBotToken: tgToken,
        telegramChatId: tgChatId,
        autoIsolirEnabled: autoIsolir,
        autoBackupEnabled: autoBackup
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Settings inputs */}
      <form onSubmit={handleSave} className="lg:col-span-7 glass-panel p-5 rounded-xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">
              Konfigurasi WhatsApp, Telegram, & Automasi Billing
            </h3>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Menyimpan" : saveSuccess ? "Tersimpan!" : "Simpan Settings"}
          </button>
        </div>

        {/* WhatsApp Gateway Integration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              WhatsApp Gateway Fonnte / Unofficial API
            </h4>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={waEnabled}
                onChange={e => setWaEnabled(e.target.checked)}
                className="hidden peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:height-4 after:width-4 after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950 peer-checked:after:border-slate-950 relative"></div>
              <span className="text-[10px] text-slate-300 font-bold ml-2">AKTIF</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">WhatsApp API URL</label>
              <input
                type="text"
                value={waUrl}
                disabled={!waEnabled}
                onChange={e => setWaUrl(e.target.value)}
                className="w-full bg-slate-900 disabled:opacity-40 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Auth Token API</label>
              <input
                type="password"
                value={waToken}
                disabled={!waEnabled}
                placeholder="Wa Token Fonnte..."
                onChange={e => setWaToken(e.target.value)}
                className="w-full bg-slate-900 disabled:opacity-40 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Telegram Bot NOC Alert */}
        <div className="space-y-4 border-t border-slate-800 pt-5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <BellRing className="w-4 h-4" />
              Telegram Bot Gateway (NOC Broadcast)
            </h4>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={tgEnabled}
                onChange={e => setTgEnabled(e.target.checked)}
                className="hidden peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:height-4 after:width-4 after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 peer-checked:after:bg-slate-950 peer-checked:after:border-slate-950 relative"></div>
              <span className="text-[10px] text-slate-300 font-bold ml-2">AKTIF</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Telegram Bot Token</label>
              <input
                type="password"
                value={tgToken}
                disabled={!tgEnabled}
                onChange={e => setTgToken(e.target.value)}
                className="w-full bg-slate-900 disabled:opacity-40 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Group Chat ID</label>
              <input
                type="text"
                value={tgChatId}
                disabled={!tgEnabled}
                onChange={e => setTgChatId(e.target.value)}
                className="w-full bg-slate-900 disabled:opacity-40 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Billing Automation Settings */}
        <div className="space-y-4 border-t border-slate-800 pt-5">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <Key className="w-4 h-4" />
            Automasi Billing & Keamanan Jaringan
          </h4>

          <div className="flex flex-col sm:flex-row gap-6">
            <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoIsolir}
                onChange={e => setAutoIsolir(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 w-4.5 h-4.5"
              />
              <div>
                <strong className="block text-slate-100">Auto-Isolir Tagihan Jatuh Tempo</strong>
                <span className="text-[10px] text-slate-400">Putuskan koneksi PPPoE otomatis jika telat bayar</span>
              </div>
            </label>

            <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={e => setAutoBackup(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 w-4.5 h-4.5"
              />
              <div>
                <strong className="block text-slate-100">Auto Cloud Backup Harian</strong>
                <span className="text-[10px] text-slate-400">Backup config harian Mikrotik (.backup & .rsc)</span>
              </div>
            </label>
          </div>
        </div>
      </form>

      {/* Alert dispatch log */}
      <div className="lg:col-span-5 glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between h-[510px]">
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 h-12">
            <h3 className="font-bold text-xs text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
              Pusat Logs Aliran Notifikasi Aktif
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-4 font-mono text-[11px] px-1 select-all">
            {alerts.map(alert => (
              <div 
                key={alert.id} 
                className="bg-slate-950/60 p-3 rounded border border-slate-900 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                    alert.type === "whatsapp" 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" 
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/10"
                  }`}>
                    {alert.type} • SENT
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {new Date(alert.timestamp).toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                
                <p className="text-slate-300 whitespace-pre-wrap">{alert.message}</p>
                
                <div className="text-[9px] text-slate-400 font-sans tracking-wide">
                  Recipient IP / Link: <strong>{alert.recipient}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900/40 p-3.5 rounded-lg border border-slate-800/60 text-[10px] text-slate-400 leading-normal flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            Sistem pengiriman notifikasi terhubung ke WhatsApp Fonnte API dan Telegram Bot Gateway. Isikan kredensial di form sebelah kiri untuk mengaktifkan integrasi realtime Anda.
          </div>
        </div>
      </div>
    </div>
  );
}
