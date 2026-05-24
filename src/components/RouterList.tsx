import React, { useState } from "react";
import { RouterConnection } from "../types";
import { 
  Plus, Server, Wifi, Cpu, Sliders, Play, Trash2, Power, ShieldAlert, CheckCircle2, RotateCw, AlertTriangle, RefreshCw
} from "lucide-react";

interface RouterListProps {
  routers: RouterConnection[];
  onAddRouter: (routerData: any) => Promise<void>;
  onTestConnection: (id: string) => Promise<any>;
  onSyncSecrets?: (id: string) => Promise<any>;
  onReboot: (id: string) => Promise<void>;
  onDeleteRouter: (id: string) => Promise<void>;
}

export default function RouterList({ routers, onAddRouter, onTestConnection, onSyncSecrets, onReboot, onDeleteRouter }: RouterListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [ip, setIp] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [apiPort, setApiPort] = useState("8728");
  const [ssl, setSsl] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [rebootingId, setRebootingId] = useState<string | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ip || !username) return;
    setIsSubmitting(true);
    try {
      await onAddRouter({ name, ip, username, password, apiPort, ssl });
      setName("");
      setIp("");
      setUsername("");
      setPassword("");
      setApiPort("8728");
      setSsl(false);
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    const result = await onTestConnection(id);
    setTestingId(null);
    if (result) {
      setDiagnosticResult(result);
    }
  };

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  const handleSync = async (id: string) => {
    if (!onSyncSecrets) return;
    setSyncingId(id);
    const result = await onSyncSecrets(id);
    setSyncingId(null);
    if (result) {
      setSyncResult(result);
    }
  };

  const handleReboot = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin melakukan reboot router ini?")) return;
    setRebootingId(id);
    await onReboot(id);
    setRebootingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Multi-Mikrotik Router Gateway
          </h2>
          <p className="text-sm text-slate-400">
            Daftar perangkat RouterOS aktif yang terhubung dalam sistem CiPUNK Monitor
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-all focus:outline-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? "Batal" : "Tambah Mikrotik"}
        </button>
      </div>

      {/* Add New Router Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4 glow-cyan">
          <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Integrasi Router Baru (Mikrotik RouterOS v6 / v7 API)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nama Identitas Router</label>
              <input
                type="text"
                placeholder="misal: Core Surabaya"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">IP Address / Domain</label>
              <input
                type="text"
                placeholder="misal: 103.155.10.254 atau router.cipunk.net"
                value={ip}
                onChange={e => setIp(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Username API RouterOS</label>
              <input
                type="text"
                placeholder="admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Password API</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Port API</label>
              <input
                type="number"
                placeholder="8728"
                value={apiPort}
                onChange={e => setApiPort(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ssl}
                  onChange={e => setSsl(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                />
                Gunakan API SSL (Port 8729 default)
              </label>
            </div>
          </div>

          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 hover:bg-cyan-400 bg-cyan-500 text-slate-950 text-sm font-semibold rounded-lg transition-all cursor-pointer"
            >
              {isSubmitting ? "Menyimpan..." : "Hubungkan & Sync"}
            </button>
          </div>
        </form>
      )}

      {/* Routers Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {routers.map(router => (
          <div 
            key={router.id} 
            className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between hover:bg-slate-900/60 transition-all group relative overflow-hidden"
          >
            {/* Status indicator border glow */}
            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
              router.status === "connected" ? "bg-emerald-500" : "bg-rose-500"
            }`}></div>

            <div className="space-y-4">
              {/* Header Title / IP */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg border ${
                    router.status === "connected" 
                      ? "bg-emerald-950/40 border-emerald-800/40 text-emerald-400" 
                      : "bg-rose-950/40 border-rose-800/40 text-rose-400"
                  }`}>
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                      {router.name}
                      {router.status === "connected" ? (
                        <span className="inline-flex items-center text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/25">
                          ONLINE
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-mono font-medium bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/25">
                          OFFLINE
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {router.ip}:{router.apiPort} • {router.username}
                    </p>
                  </div>
                </div>

                {router.status === "connected" && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Uptime</span>
                    <span className="text-xs text-slate-200 font-mono">{router.uptime}</span>
                  </div>
                )}
              </div>

              {/* Hardware Stats (CPU / RAM / Disk) */}
              {router.status === "connected" ? (
                <div className="grid grid-cols-3 gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800/60 font-mono text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] mb-1">
                      <Cpu className="w-3 h-3" />
                      CPU LOAD
                    </div>
                    <span className="text-sm font-semibold text-cyan-400">{router.cpu}%</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${router.cpu}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[10px] mb-1">RAM USED</div>
                    <span className="text-sm font-semibold text-emerald-400">{router.ram}%</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${router.ram}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[10px] mb-1">DISK TEMP</div>
                    <span className="text-sm font-semibold text-purple-400">{router.disk}%</span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-purple-400 h-full rounded-full" style={{ width: `${router.disk}%` }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-rose-950/10 border border-rose-950/40 rounded-lg text-rose-400 text-xs">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  Koneksi terputus. Harap verifikasi routing gateway, status server Mikrotik API, atau credentials login Anda.
                </div>
              )}

              {/* Hardware Details Footer */}
              {router.status === "connected" && (
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono bg-slate-950/30 p-2 rounded border border-slate-900">
                  <span>Hardware: <strong className="text-slate-300">{router.model}</strong></span>
                  <span>OS: <strong className="text-slate-300">{router.version}</strong></span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between border-t border-slate-800 mt-5 pt-4">
              <button
                onClick={() => onDeleteRouter(router.id)}
                className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-slate-800/50 rounded-lg transition-all"
                title="Hapus Koneksi Router"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTest(router.id)}
                  disabled={testingId === router.id}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${testingId === router.id ? "animate-spin" : ""}`} />
                  Test Koneksi
                </button>

                {router.status === "connected" && onSyncSecrets && (
                  <button
                    onClick={() => handleSync(router.id)}
                    disabled={syncingId === router.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)] animate-pulse"
                    title="Sinkronisasi & Impor Otomatis PPPoE Pelanggan dari Mikrotik"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingId === router.id ? "animate-spin" : ""}`} />
                    Sync PPPoE Mikrotik
                  </button>
                )}

                {router.status === "connected" && (
                  <button
                    onClick={() => handleReboot(router.id)}
                    disabled={rebootingId === router.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/40 text-rose-400 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    <Power className={`w-3.5 h-3.5 ${rebootingId === router.id ? "animate-pulse" : ""}`} />
                    Reboot Router
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Terminal Diagnostics Overlay Modal */}
      {diagnosticResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Window controls bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500 block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
                <span className="font-mono text-xs text-slate-400 font-bold ml-2">RouterOS Connection Terminal Analyser v1.2</span>
              </div>
              <button 
                onClick={() => setDiagnosticResult(null)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Console body content */}
            <div className="p-6 space-y-4 font-mono text-xs leading-relaxed text-slate-300">
              <div className="flex items-start gap-2 text-cyan-400">
                <span className="text-slate-500">{">"}</span>
                <span>system connection test --target={diagnosticResult.router?.ip}:{diagnosticResult.router?.apiPort}</span>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800">
                <p className="text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  STATUS SINKRONISASI: PROXY CONNECTED
                </p>
                <p className="text-slate-300">{diagnosticResult.message}</p>
              </div>

              {diagnosticResult.diagnostic && (
                <div className="p-4 bg-amber-950/10 border border-amber-900/30 rounded-lg space-y-3">
                  <p className="text-amber-400 font-bold uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    ANALISIS JARINGAN ({diagnosticResult.diagnostic.error})
                  </p>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {diagnosticResult.diagnostic.advice}
                  </p>
                  <div className="space-y-1.5 mt-2">
                    <p className="text-slate-400 font-bold text-[10px] uppercase">Rekomendasi Script Firewall Rule (Mikrotik Terminal):</p>
                    <pre className="p-2 bg-slate-950 rounded border border-slate-900 text-cyan-400 text-[10px] overflow-x-auto select-all">
{`/ip firewall filter
add chain=input protocol=tcp dst-port=${diagnosticResult.router?.apiPort} action=accept comment="Allow CiPUNK NOC"
/ip service
set api disabled=no port=${diagnosticResult.router?.apiPort}`}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setDiagnosticResult(null)}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-lg transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  Tutup Terminal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Results Modal */}
      {syncResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 font-sans tracking-tight uppercase flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                SINKRONISASI MIKROTIK SUKSES
              </h3>
              <button 
                onClick={() => setSyncResult(null)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-1">
                <h4 className="text-sm font-bold text-emerald-400">{syncResult.message}</h4>
                <p className="text-xs text-slate-300">{syncResult.details}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-center">
                  <div className="text-[10px] text-emerald-400 font-mono font-bold tracking-wider uppercase mb-0.5">Ditemukan & Ditambahkan</div>
                  <div className="text-2xl font-bold text-slate-100 font-sans">{syncResult.addedCount} <span className="text-xs text-slate-400 font-normal">Pelanggan Baru</span></div>
                </div>

                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-center">
                  <div className="text-[10px] text-cyan-400 font-mono font-bold tracking-wider uppercase mb-0.5">Disinkronkan & Diperbarui</div>
                  <div className="text-2xl font-bold text-slate-100 font-sans">{syncResult.updatedCount} <span className="text-xs text-slate-400 font-normal">Pelanggan</span></div>
                </div>
              </div>

              {syncResult.importedList && syncResult.importedList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Daftar Pelanggan Baru yang Diimpor Otomatis:</span>
                  <div className="max-h-[180px] overflow-y-auto bg-slate-950/80 p-3.5 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-300 divide-y divide-slate-900">
                    {syncResult.importedList.map((item: string, idx: number) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between text-slate-300">
                        <span className="font-semibold text-emerald-400">{idx + 1}. {item}</span>
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.2 rounded-full text-[10px] border border-emerald-500/20">READY (PPPoE)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  onClick={() => setSyncResult(null)}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-lg transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] text-xs uppercase tracking-wider h-[38px]"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
