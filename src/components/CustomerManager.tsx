import React, { useState } from "react";
import { Customer } from "../types";
import { 
  Users, UserCheck, ShieldAlert, CreditCard, Search, Plus, Filter, Tag, Check, MapPin, BadgeInfo, SignalHigh, CheckCircle, Ban, UploadCloud, FileText, Edit3
} from "lucide-react";

interface CustomerManagerProps {
  customers: Customer[];
  onAddCustomer: (customerData: any) => Promise<void>;
  onUpdateCustomer: (id: string, customerData: any) => Promise<void>;
  onToggleStatus: (id: string, status: "active" | "isolated") => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
}

export default function CustomerManager({ customers, onAddCustomer, onUpdateCustomer, onToggleStatus, onDeleteCustomer }: CustomerManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"All" | "PPPoE" | "Hotspot">("All");
  const [filterStatus, setFilterStatus] = useState<"All" | "active" | "isolated">("All");

  // PDF Autopopulate states
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);
  const [pdfErrorMessage, setPdfErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Edit Customer state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<"PPPoE" | "Hotspot" | "Static">("PPPoE");
  const [account, setAccount] = useState("");
  const [secret, setSecret] = useState("");
  const [speedLimit, setSpeedLimit] = useState("10M/10M");
  const [packagePrice, setPackagePrice] = useState("150000");
  const [onuOlt, setOnuOlt] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clean and format a beautiful human readable name from arbitrary filenames
  const cleanNameFromFile = (filename: string): string => {
    let name = filename.replace(/\.[^/.]+$/, "");
    name = name.replace(/[_-]/g, " ");
    name = name.replace(/(pendaftaran|pelanggan|register|reg|kontrak|pdf|docx|contract|invoice|form|formulir|customer|new)/gi, "");
    name = name.replace(/\s+/g, " ").trim();
    if (!name) return "Pelanggan Baru " + Math.floor(10 + Math.random() * 90);
    return name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  };

  // PDF Handler Function - Highly resilient autopopulate adding engine
  const handlePdfUpload = async (file: File) => {
    if (!file) return;
    setIsParsingPdf(true);
    setPdfSuccessMessage(null);
    setPdfErrorMessage(null);

    // Prepare default values based on filename first for failsafe fallback
    const fallbackName = cleanNameFromFile(file.name);
    const cleanNameForAcc = fallbackName.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 16);
    const fallbackAccount = cleanNameForAcc ? `${cleanNameForAcc}_ros` : `acc_${Math.floor(100 + Math.random() * 900)}`;
    const fallbackSecret = `wifi${Math.floor(100 + Math.random() * 900)}`;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        let finalName = fallbackName;
        let finalType: "PPPoE" | "Hotspot" | "Static" = "PPPoE";
        let finalAccount = fallbackAccount;
        let finalSecret = fallbackSecret;
        let finalSpeed = "10M/10M";
        let finalPrice = "150000";
        let finalOnu = "OLT-ZTE-GPON-01 / port 1/1/4";
        let isFallback = false;

        try {
          const rawResult = reader.result as string;
          const cleanBase64 = rawResult.split(",")[1];

          const response = await fetch("/api/ai/parse-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileBase64: cleanBase64,
              mimeType: file.type || "application/pdf",
              fileName: file.name
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data) {
              finalName = data.name || fallbackName;
              finalType = (data.type === "PPPoE" || data.type === "Hotspot" || data.type === "Static") ? data.type : "PPPoE";
              
              const cleanParsedName = finalName.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 16);
              finalAccount = data.account || `${cleanParsedName}_ros`;
              finalSecret = data.secret || `wifi${Math.floor(100 + Math.random() * 900)}`;
              finalSpeed = data.speedLimit || "10M/10M";
              finalPrice = String(data.packagePrice || "150000");
              finalOnu = data.onuOlt || "OLT-ZTE-GPON-01 / port 1/1/4";
            } else {
              isFallback = true;
            }
          } else {
            isFallback = true;
          }
        } catch (innerErr) {
          console.warn("AI extraction encountered a temporary issue. Initiating smart fallback registration.", innerErr);
          isFallback = true;
        }

        // Immediately add customer matching any state of completeness!
        try {
          await onAddCustomer({
            name: finalName,
            type: finalType,
            account: finalAccount,
            secret: finalSecret,
            speedLimit: finalSpeed,
            packagePrice: finalPrice,
            onuOlt: finalOnu,
            latitude: "",
            longitude: ""
          });

          if (isFallback) {
            setPdfSuccessMessage(`Otomatis (Failsafe): Berhasil menambahkan "${finalName}" (${finalAccount}) dari file "${file.name}". Silakan melengkapi detailnya lewat tombol edit ✎.`);
          } else {
            setPdfSuccessMessage(`AIS Smart Ingestion SUKSES: Pelanggan "${finalName}" dengan akun "${finalAccount}" berhasil dimasukkan otomatis ke database & Mikrotik.`);
          }
        } catch (addError: any) {
          setPdfErrorMessage(`Pendaftaran otomatis gagal: ${addError.message || addError}`);
        } finally {
          setIsParsingPdf(false);
        }
      };

      reader.onerror = () => {
        // Even file reader errors don't prevent us from registering from filename details!
        onAddCustomer({
          name: fallbackName,
          type: "PPPoE",
          account: fallbackAccount,
          secret: fallbackSecret,
          speedLimit: "10M/10M",
          packagePrice: "150000",
          onuOlt: "OLT-ZTE-GPON-01 / port 1/1/4",
          latitude: "",
          longitude: ""
        }).then(() => {
          setPdfSuccessMessage(`Otomatis (Failsafe): Gagal membaca file lengkap tapi berhasil mendaftarkan "${fallbackName}" (${fallbackAccount}) berdasarkan nama file.`);
        }).catch(err => {
          setPdfErrorMessage("Pendaftaran gagal sepenuhnya: " + err.message);
        }).finally(() => {
          setIsParsingPdf(false);
        });
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      // Catch overall handler error and still proceed with fallback!
      try {
        await onAddCustomer({
          name: fallbackName,
          type: "PPPoE",
          account: fallbackAccount,
          secret: fallbackSecret,
          speedLimit: "10M/10M",
          packagePrice: "150000",
          onuOlt: "OLT-ZTE-GPON-01 / port 1/1/4",
          latitude: "",
          longitude: ""
        });
        setPdfSuccessMessage(`Otomatis (Failsafe): Terjadi galat tapi pendaftaran "${fallbackName}" tetap berhasil diproses dari nama berkas.`);
      } catch (e: any) {
        setPdfErrorMessage("Gagal memproses berkas: " + e.message);
      } finally {
        setIsParsingPdf(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handlePdfUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !account || !secret) return;
    setIsSubmitting(true);
    try {
      await onAddCustomer({
        name,
        type,
        account,
        secret,
        speedLimit,
        packagePrice,
        onuOlt: onuOlt || "OLT-ZTE-GPON-01 / Port 1/1/3 (Redaman -19.5 dBm)",
        latitude,
        longitude
      });
      setName("");
      setType("PPPoE");
      setAccount("");
      setSecret("");
      setSpeedLimit("10M/10M");
      setPackagePrice("150000");
      setOnuOlt("");
      setLatitude("");
      setLongitude("");
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      await onUpdateCustomer(editingCustomer.id, {
        name: editingCustomer.name,
        type: editingCustomer.type,
        account: editingCustomer.account,
        secret: editingCustomer.secret,
        speedLimit: editingCustomer.speedLimit,
        packagePrice: editingCustomer.packagePrice,
        onuOlt: editingCustomer.onuOlt,
        latitude: String(editingCustomer.coordinate[0]),
        longitude: String(editingCustomer.coordinate[1])
      });
      setEditingCustomer(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.account.toLowerCase().includes(search.toLowerCase()) ||
                          c.ip.includes(search);
    const matchesType = filterType === "All" || c.type === filterType;
    const matchesStatus = filterStatus === "All" || c.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Overview stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase">Total Pelanggan</span>
            <span className="text-2xl font-bold text-slate-100 font-mono">{customers.length}</span>
          </div>
          <div className="p-2.5 bg-blue-950/40 border border-blue-900/40 rounded-lg text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase">Pelanggan Aktif</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono">
              {customers.filter(c => c.status === "active").length}
            </span>
          </div>
          <div className="p-2.5 bg-emerald-950/40 border border-emerald-900/40 rounded-lg text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase">Layanan Terisolir</span>
            <span className="text-2xl font-bold text-rose-400 font-mono">
              {customers.filter(c => c.status === "isolated").length}
            </span>
          </div>
          <div className="p-2.5 bg-rose-950/40 border border-rose-900/40 rounded-lg text-rose-400">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase">Unpaid Billing</span>
            <span className="text-2xl font-bold text-amber-400 font-mono">
              {customers.filter(c => c.paymentStatus === "unpaid").length}
            </span>
          </div>
          <div className="p-2.5 bg-amber-950/40 border border-amber-900/40 rounded-lg text-amber-400">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Primary Actions / Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Cari nama, account, atau IP address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 select-none">
          {/* Filter Type */}
          <div className="flex border border-slate-700 rounded-lg overflow-hidden text-xs bg-slate-900">
            <button
              onClick={() => setFilterType("All")}
              className={`px-3 py-2 font-medium ${filterType === "All" ? "bg-cyan-500 text-slate-950 font-semibold" : "text-slate-300 hover:bg-slate-800"}`}
            >
              Semua Jenis
            </button>
            <button
              onClick={() => setFilterType("PPPoE")}
              className={`px-3 py-2 font-medium ${filterType === "PPPoE" ? "bg-cyan-500 text-slate-950 font-semibold" : "text-slate-300 hover:bg-slate-800"}`}
            >
              PPPoE
            </button>
            <button
              onClick={() => setFilterType("Hotspot")}
              className={`px-3 py-2 font-medium ${filterType === "Hotspot" ? "bg-cyan-500 text-slate-950 font-semibold" : "text-slate-300 hover:bg-slate-800"}`}
            >
              Hotspot
            </button>
          </div>

          {/* Filter Status */}
          <div className="flex border border-slate-700 rounded-lg overflow-hidden text-xs bg-slate-900">
            <button
              onClick={() => setFilterStatus("All")}
              className={`px-3 py-2 font-medium ${filterStatus === "All" ? "bg-cyan-500 text-slate-950 font-semibold" : "text-slate-300 hover:bg-slate-800"}`}
            >
              Tingkat Status
            </button>
            <button
              onClick={() => setFilterStatus("active")}
              className={`px-3 py-2 font-medium ${filterStatus === "active" ? "bg-emerald-500 text-slate-950 font-semibold" : "text-slate-300 hover:bg-slate-800"}`}
            >
              Aktif
            </button>
            <button
              onClick={() => setFilterStatus("isolated")}
              className={`px-3 py-2 font-medium ${filterStatus === "isolated" ? "bg-rose-500 text-slate-950 font-semibold" : "text-slate-300 hover:bg-slate-800"}`}
            >
              Isolir
            </button>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition-all focus:outline-none cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? "Urungkan" : "Tambah Pelanggan"}
          </button>
        </div>
      </div>

      {/* Register Customer Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4 glow-emerald">
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Registrasi Pelanggan Baru & Sync ke Mikrotik Router
          </h3>

          {/* Interactive PDF Autopopulate Dropzone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
              isDragging 
                ? "border-emerald-400 bg-emerald-950/20 text-emerald-400" 
                : "border-slate-700 bg-slate-900/50 hover:border-emerald-500/50"
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="p-3 bg-slate-950 rounded-full border border-slate-800 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                <UploadCloud className={`w-6 h-6 ${isParsingPdf ? "animate-bounce" : ""}`} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Unggah Formulir / PDF Kontrak Pelanggan
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Seret & taruh berkas PDF pendaftaran untuk mengisi isian secara Instan otomatis via Gemini AI
                </span>
              </div>
              
              <div className="flex items-center gap-2 pt-1">
                <label className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-emerald-400 font-bold text-[10px] tracking-wide uppercase rounded-lg cursor-pointer transition-all">
                  Pilih Berkas PDF / Image
                  <input 
                    type="file" 
                    accept=".pdf,image/*" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handlePdfUpload(e.target.files[0]);
                      }
                    }} 
                    className="hidden" 
                  />
                </label>
              </div>

              {/* Status messages indicator */}
              {isParsingPdf && (
                <div className="flex items-center justify-center gap-2 pt-2 text-cyan-400 animate-pulse text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
                  Gemini AI sedang membaca dan mengekstrak isian kontrak...
                </div>
              )}

              {pdfSuccessMessage && (
                <div className="p-2 px-4 bg-emerald-950/30 border border-emerald-500/20 rounded-md text-emerald-400 text-[10px] font-medium leading-relaxed max-w-lg mt-2 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {pdfSuccessMessage}
                </div>
              )}

              {pdfErrorMessage && (
                <div className="p-2 px-4 bg-rose-950/30 border border-rose-500/20 rounded-md text-rose-400 text-[10px] font-medium leading-relaxed max-w-lg mt-2 flex items-center gap-1.5">
                  <Ban className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  {pdfErrorMessage}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Indra Lesmana"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Jenis Layanan</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="PPPoE">PPP Secret (PPPoE)</option>
                <option value="Hotspot">User Hotspot</option>
                <option value="Static">Static IP Bind</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Username Secret / Hotspot</label>
              <input
                type="text"
                placeholder="indra_cipunk_net"
                value={account}
                onChange={e => setAccount(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Password</label>
              <input
                type="text"
                placeholder="passindra33"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Profile Bandwidth (Upload/Download)</label>
              <select
                value={speedLimit}
                onChange={e => setSpeedLimit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="2M/2M">2 Mbps Economy Voucher</option>
                <option value="5M/5M">5 Mbps Home Saver</option>
                <option value="10M/10M">10 Mbps Standard Family</option>
                <option value="20M/20M">20 Mbps Premium Corporate</option>
                <option value="50M/50M">50 Mbps Gamer Ultra</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Biaya Tagihan Bulanan (Rp)</label>
              <input
                type="number"
                placeholder="150000"
                value={packagePrice}
                onChange={e => setPackagePrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Informasi ONU / OLT Port (Fiber Optic)</label>
              <input
                type="text"
                placeholder="Port OLT 1/2/4 (ZTE) - redaman target -19 dBm"
                value={onuOlt}
                onChange={e => setOnuOlt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Latitude Koordinat (Lokasi Maps)</label>
              <input
                type="text"
                placeholder="-7.2575"
                value={latitude}
                onChange={e => setLatitude(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Longitude Koordinat (Lokasi Maps)</label>
              <input
                type="text"
                placeholder="112.7521"
                value={longitude}
                onChange={e => setLongitude(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-lg transition-all cursor-pointer"
            >
              {isSubmitting ? "Syncing..." : "Simpan & Create di Routeros"}
            </button>
          </div>
        </form>
      )}

      {/* Customers Table / Cards */}
      <div className="glass-panel rounded-xl border border-slate-800/80 overflow-hidden shadow-lg">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-900/80 text-[10px] font-bold tracking-wider text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Nama Pelanggan</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4">Account (Secret)</th>
                <th className="py-3 px-4">IP & MAC Address</th>
                <th className="py-3 px-4">Speed Limit</th>
                <th className="py-3 px-4">Redaman Optik (ONU)</th>
                <th className="py-3 px-4">Tagihan Bulanan</th>
                <th className="py-3 px-4">Status Layanan</th>
                <th className="py-3 px-4 text-right">Aksi Kontrol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      <div className="font-semibold text-slate-100">{c.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        Lat: {c.coordinate[0].toFixed(4)}, Lng: {c.coordinate[1].toFixed(4)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        c.type === "PPPoE" 
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {c.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-slate-300 font-bold">{c.account}</div>
                      <div className="font-mono text-[10px] text-slate-500 mt-0.5">pass: {c.secret}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-slate-300 font-semibold">{c.ip}</div>
                      <div className="font-mono text-[10px] text-slate-500 mt-0.5">{c.mac}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-cyan-400 font-bold">{c.speedLimit}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Quota: {c.usageGB.toFixed(1)} GB</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-300">{c.onuOlt}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <SignalHigh className={`w-3.5 h-3.5 ${
                          c.onuOlt.includes("Tinggi") ? "text-rose-400" : "text-emerald-400"
                        }`} />
                        Laser Parameter: OK
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-xs font-semibold text-slate-300">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(c.packagePrice)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Due: <span className="font-mono font-bold text-slate-300">{c.billingDue}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {c.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          TERHUBUNG
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/15 px-2 py-0.5 rounded-full animate-pulse">
                          <Ban className="w-3 h-3 text-rose-500" />
                          ISOLIR (OFF)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.status === "active" ? (
                          <button
                            onClick={() => onToggleStatus(c.id, "isolated")}
                            className="text-rose-400 hover:text-slate-100 bg-rose-950/20 hover:bg-rose-600 border border-rose-800/20 font-semibold px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
                            title="Isolir Pelanggan"
                          >
                            Isolir / Block
                          </button>
                        ) : (
                          <button
                            onClick={() => onToggleStatus(c.id, "active")}
                            className="text-emerald-400 hover:text-slate-950 bg-emerald-950/20 hover:bg-emerald-400 border border-emerald-800/20 font-bold px-2.5 py-1 rounded text-xs transition-colors cursor-pointer"
                            title="Aktivasi Pelanggan"
                          >
                            Buka Isolir
                          </button>
                        )}
                        <button
                          onClick={() => setEditingCustomer(c)}
                          className="bg-slate-800 hover:bg-cyan-950/40 text-slate-400 hover:text-cyan-400 p-1.5 rounded-lg border border-slate-700/80 transition-all cursor-pointer"
                          title="Edit Pelanggan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Hapus customer & hapus PPP secret di RouterOS?")) {
                              onDeleteCustomer(c.id);
                            }
                          }}
                          className="bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 p-1.5 rounded-lg border border-slate-700/80 transition-all cursor-pointer"
                          title="Hapus Dari DB"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-500 text-sm font-medium">
                    Pelanggan tidak ditemukan. Silakan tambahkan pelanggan baru.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Pelanggan */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 font-sans tracking-tight uppercase flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                Edit Data Pelanggan (Sync Mikrotik)
              </h3>
              <button 
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold text-slate-300">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.name}
                    onChange={e => setEditingCustomer({...editingCustomer, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold text-slate-300">Jenis Layanan</label>
                  <select
                    value={editingCustomer.type}
                    onChange={e => setEditingCustomer({...editingCustomer, type: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500 font-medium h-[38px]"
                  >
                    <option value="PPPoE">PPP Secret (PPPoE)</option>
                    <option value="Hotspot">User Hotspot</option>
                    <option value="Static">Static IP Bind</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold text-slate-300">Username / Account</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.account}
                    onChange={e => setEditingCustomer({...editingCustomer, account: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500 font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold text-slate-300">Password Secret</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.secret}
                    onChange={e => setEditingCustomer({...editingCustomer, secret: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500 font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold text-slate-300">Speed Profile</label>
                  <select
                    value={editingCustomer.speedLimit}
                    onChange={e => setEditingCustomer({...editingCustomer, speedLimit: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500 font-medium h-[38px]"
                  >
                    <option value="2M/2M">2 Mbps Economy Voucher</option>
                    <option value="5M/5M">5 Mbps Home Saver</option>
                    <option value="10M/10M">10 Mbps Standard Family</option>
                    <option value="20M/20M">20 Mbps Premium Corporate</option>
                    <option value="50M/50M">50 Mbps Gamer Ultra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold text-slate-300">Biaya Tagihan (Rp)</label>
                  <input
                    type="number"
                    value={editingCustomer.packagePrice}
                    onChange={e => setEditingCustomer({...editingCustomer, packagePrice: Number(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold text-slate-300">ONU / OLT Info</label>
                  <input
                    type="text"
                    value={editingCustomer.onuOlt}
                    onChange={e => setEditingCustomer({...editingCustomer, onuOlt: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold text-slate-300">Latitude</label>
                  <input
                    type="text"
                    value={editingCustomer.coordinate[0]}
                    onChange={e => setEditingCustomer({
                      ...editingCustomer, 
                      coordinate: [Number(e.target.value) || 0, editingCustomer.coordinate[1]]
                    })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500 font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold text-slate-300">Longitude</label>
                  <input
                    type="text"
                    value={editingCustomer.coordinate[1]}
                    onChange={e => setEditingCustomer({
                      ...editingCustomer, 
                      coordinate: [editingCustomer.coordinate[0], Number(e.target.value) || 0]
                    })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500 font-mono font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg transition-all cursor-pointer uppercase tracking-wider h-[38px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.25)] h-[38px]"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
