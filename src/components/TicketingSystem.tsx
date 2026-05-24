import React, { useState } from "react";
import { NetworkTicket } from "../types";
import { 
  Wrench, AlertCircle, MessageSquare, Check, Star, RefreshCw, Send, Plus, Award, ArrowUpRight 
} from "lucide-react";

interface TicketingSystemProps {
  tickets: NetworkTicket[];
  onReplyTicket: (id: string, text: string, sender: "Technician" | "Operator") => Promise<void>;
  onResolveTicket: (id: string, rating: number) => Promise<void>;
  onCreateTicket: (customerName: string, issue: string, message: string) => Promise<void>;
}

export default function TicketingSystem({ tickets, onReplyTicket, onResolveTicket, onCreateTicket }: TicketingSystemProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(tickets[0]?.id || null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // New Ticket form
  const [newCustName, setNewCustName] = useState("");
  const [newIssue, setNewIssue] = useState("Koneksi Lambat / RTO");
  const [newMsg, setNewMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resolution rating
  const [selectedRating, setSelectedRating] = useState(5);

  const activeTicket = tickets.find(t => t.id === activeTicketId);

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newMsg) return;
    setIsSubmitting(true);
    try {
      await onCreateTicket(newCustName, newIssue, newMsg);
      setNewCustName("");
      setNewMsg("");
      setShowAddForm(false);
      // Auto select new ticket
      if (tickets.length > 0) {
        setActiveTicketId(tickets[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicketId) return;
    setIsReplying(true);
    try {
      await onReplyTicket(activeTicketId, replyText, "Technician");
      setReplyText("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsReplying(false);
    }
  };

  const handleResolve = async (id: string) => {
    await onResolveTicket(id, selectedRating);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight uppercase flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            Sistem Tiket Gangguan Pelanggan (ISP Support)
          </h2>
          <p className="text-xs text-slate-400">
            Pusat penanganan komplain pelanggan, progress perbaikan lapangan, dan chat teknisi NOC realtime
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-slate-100 font-bold px-4 py-2 rounded-lg text-sm transition-all focus:outline-none cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" />
          {showAddForm ? "Batal" : "Buat Tiket Baru"}
        </button>
      </div>

      {/* Add Ticket Form */}
      {showAddForm && (
        <form onSubmit={handleCreateTicketSubmit} className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4 glow-cyan">
          <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-1.5 uppercase">
            <AlertCircle className="w-4 h-4" />
            Buka Masalah Gangguan Baru Pelanggan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nama / Akun Pelanggan</label>
              <input
                type="text"
                placeholder="Andi Wijaya"
                value={newCustName}
                onChange={e => setNewCustName(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Klasifikasi Masalah</label>
              <select
                value={newIssue}
                onChange={e => setNewIssue(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="Internet Lambat / High Latency">Internet Lambat / High Latency</option>
                <option value="LOS Merah / Redaman Drop">LOS Merah / Redaman Drop (Kabel Optik Putus)</option>
                <option value="Sering Request Time Out (RTO)">Sering Request Time Out (RTO)</option>
                <option value="Config Router Bermasalah">Config Router / Wifi Bermasalah</option>
                <option value="Aktivasi Isolir Billing Terhambat">Aktivasi Isolir Billing Terhambat</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Detail Deskripsi Komplain Teknis</label>
            <textarea
              placeholder="Tulis kendala lengkap pelanggan, contoh: Wi-Fi mati total indikasi lampu PON berkedip..."
              value={newMsg}
              required
              rows={3}
              onChange={e => setNewMsg(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 hover:bg-cyan-400 bg-cyan-500 text-slate-950 text-sm font-bold rounded-lg transition-all cursor-pointer"
            >
              {isSubmitting ? "Memproses..." : "Buka Tiket NOC"}
            </button>
          </div>
        </form>
      )}

      {/* Ticket Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Complaints List */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">
            Antrean Tiket Masuk
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {tickets.map(t => (
              <div
                key={t.id}
                onClick={() => setActiveTicketId(t.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  activeTicketId === t.id
                    ? "bg-gradient-to-tr from-cyan-950/20 to-slate-900/60 border-cyan-500/60 glow-cyan"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/10">
                    {t.id}
                  </span>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                    t.status === "open"
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/15 animate-pulse"
                      : t.status === "in_progress"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                  }`}>
                    {t.status === "open" ? "Baru" : t.status === "in_progress" ? "Proses" : "Selesai"}
                  </span>
                </div>

                <div className="font-semibold text-slate-200 mt-2 text-xs truncate">
                  {t.customerName}
                </div>
                <div className="text-xs text-slate-400 mt-1 truncate">
                  {t.issue}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-3 text-right">
                  {new Date(t.createdAt).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}

            {tickets.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-500 font-medium">
                Tidak ada tiket komplain aktif. Jaringan 100% aman!
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Ticket Chat Details */}
        <div className="lg:col-span-8">
          {activeTicket ? (
            <div className="glass-panel rounded-xl border border-slate-800 flex flex-col justify-between h-[520px]">
              <div className="flex flex-col h-full justify-between">
                {/* Active Chat Header */}
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3 h-14 bg-slate-900/30">
                  <div>
                    <h4 className="font-semibold text-xs text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                      Percakapan Tiket {activeTicket.id}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate max-w-[400px]">
                      {activeTicket.customerName} • {activeTicket.issue}
                    </p>
                  </div>

                  {activeTicket.status !== "resolved" ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Rating Solusi:</span>
                      <select
                        value={selectedRating}
                        onChange={e => setSelectedRating(Number(e.target.value))}
                        className="bg-slate-950 border border-slate-800 rounded text-slate-100 px-1 py-1 text-xs"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                        <option value={4}>⭐⭐⭐⭐ (4)</option>
                        <option value={3}>⭐⭐⭐ (3)</option>
                      </select>
                      <button
                        onClick={() => handleResolve(activeTicket.id)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Tutup & Selesaikan
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1.5 border border-emerald-500/20 rounded-full font-semibold">
                      <Award className="w-3.5 h-3.5" />
                      Resolved • Rating {activeTicket.rating || 5}/5
                    </div>
                  )}
                </div>

                {/* Message Log */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {activeTicket.messages.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className={`flex ${m.sender === "Customer" ? "justify-start" : "justify-end"}`}
                    >
                      <div className={`max-w-[75%] rounded-xl p-3 text-xs leading-relaxed ${
                        m.sender === "Customer"
                          ? "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                          : "bg-blue-600 text-slate-100 rounded-tr-none font-medium"
                      }`}>
                        <div className="font-mono text-[9px] opacity-60 mb-1">
                          {m.sender === "Customer" ? `${activeTicket.customerName}` : `NOC Technician`} • {new Date(m.timestamp).toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <p>{m.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                {activeTicket.status !== "resolved" ? (
                  <form onSubmit={handleReplySubmit} className="border-t border-slate-800 p-4 flex gap-2 h-16 bg-slate-900/10">
                    <input
                      type="text"
                      placeholder="Ketik balasan solusi teknis ke pelanggan di lapangan..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      disabled={isReplying}
                      className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-lg px-4 focus:outline-none focus:border-cyan-500 font-sans"
                    />
                    <button
                      type="submit"
                      disabled={isReplying || !replyText.trim()}
                      className="p-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg flex items-center justify-center transition-all cursor-pointer font-bold shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="border-t border-slate-800 p-4 text-center text-xs text-slate-500 font-medium">
                    Tiket ini telah diselesaikan dan diarsipkan.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-700/60 rounded-xl py-24 text-center text-slate-500 font-medium text-xs">
              Mulai dengan meng-klik salah satu tiket antrean di sebelah kiri.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
