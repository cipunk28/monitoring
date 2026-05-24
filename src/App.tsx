import { useState, useEffect } from "react";
import { 
  Activity, Server, Users, CreditCard, Wrench, BellRing, Flame, ShieldCheck, 
  MapPin, RotateCw, Play, Search, FileText, CheckCircle, TrendingUp, Bot, 
  Zap, ArrowUpRight, Cpu, Moon, Sun, AlertTriangle, Smartphone, ChevronRight 
} from "lucide-react";
import NetworkGraph from "./components/NetworkGraph";
import RouterList from "./components/RouterList";
import CustomerManager from "./components/CustomerManager";
import AiAdvisor from "./components/AiAdvisor";
import TicketingSystem from "./components/TicketingSystem";
import AlertSettings from "./components/AlertSettings";
import TelegramBotManager from "./components/TelegramBotManager";
import { 
  DashboardStats, RouterConnection, Customer, NetworkTicket, ActivityLog, 
  NotificationAlert, NetworkInterface, SimpleQueue 
} from "./types";

const cipunkLogo = "/src/assets/images/cipunk_cool_logo_1779637124584.png";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "routers" | "customers" | "tickets" | "settings" | "billing" | "telegram">("dashboard");
  const [darkMode, setDarkMode] = useState(true);

  // Core backend stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [routers, setRouters] = useState<RouterConnection[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tickets, setTickets] = useState<NetworkTicket[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [alerts, setAlerts] = useState<NotificationAlert[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Extra realtime parameters fetched form sub endpoints
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [queues, setQueues] = useState<SimpleQueue[]>([]);

  // QRIS Billing payment simulation modal
  const [payingInvoice, setPayingInvoice] = useState<Customer | null>(null);
  const [paymentStep, setPaymentStep] = useState<"pending" | "success">("pending");

  // Fetch all initial data
  const fetchData = async () => {
    try {
      const [
        statsRes, routersRes, customersRes, ticketsRes, 
        logsRes, alertsRes, settingsRes, interfacesRes, queuesRes
      ] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/routers"),
        fetch("/api/customers"),
        fetch("/api/tickets"),
        fetch("/api/logs"),
        fetch("/api/alerts"),
        fetch("/api/notifications/settings"),
        fetch("/api/interfaces"),
        fetch("/api/queues")
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (routersRes.ok) setRouters(await routersRes.json());
      if (customersRes.ok) setCustomers(await customersRes.json());
      if (ticketsRes.ok) setTickets(await ticketsRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (interfacesRes.ok) setInterfaces(await interfacesRes.json());
      if (queuesRes.ok) setQueues(await queuesRes.json());
    } catch (error) {
      console.error("Error drawing live telemetry data:", error);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup 4 second poll interval for active metrics (makes line graph & stats extremely dynamic!)
    const statsInterval = setInterval(async () => {
      try {
        const statsRes = await fetch("/api/dashboard/stats");
        const interfacesRes = await fetch("/api/interfaces");
        const queuesRes = await fetch("/api/queues");
        
        if (statsRes.ok) setStats(await statsRes.json());
        if (interfacesRes.ok) setInterfaces(await interfacesRes.json());
        if (queuesRes.ok) setQueues(await queuesRes.json());
      } catch (err) {
        console.warn("Polling stats error (server restarting or offline):", err);
      }
    }, 4000);

    return () => clearInterval(statsInterval);
  }, []);

  // Router Handlers
  const handleAddRouter = async (routerData: any) => {
    const resp = await fetch("/api/routers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(routerData)
    });
    if (resp.ok) fetchData();
  };

  const handleTestRouter = async (id: string): Promise<any> => {
    try {
      const resp = await fetch(`/api/routers/${id}/test`, { method: "POST" });
      if (resp.ok) {
        fetchData();
        return await resp.json();
      }
      return { success: false, message: "Gagal menyambungkan API. Perangkat tidak merespons." };
    } catch (e: any) {
      return { success: false, message: "Kesalahan jaringan: " + e.message };
    }
  };

  const handleSyncRouter = async (id: string): Promise<any> => {
    try {
      const resp = await fetch(`/api/routers/${id}/sync`, { method: "POST" });
      if (resp.ok) {
        fetchData();
        return await resp.json();
      }
      return { success: false, message: "Gagal sinkronisasi data dengan RouterOS." };
    } catch (e: any) {
      return { success: false, message: "Kesalahan jaringan: " + e.message };
    }
  };

  const handleRebootRouter = async (id: string) => {
    const resp = await fetch(`/api/routers/${id}/reboot`, { method: "POST" });
    if (resp.ok) {
      alert("Sinyal reboot terkirim. Uptime router di-reset menjadi 0.");
      fetchData();
    }
  };

  const handleDeleteRouter = async (id: string) => {
    const resp = await fetch(`/api/routers/${id}`, { method: "DELETE" });
    if (resp.ok) fetchData();
  };

  // Customer Handlers
  const handleAddCustomer = async (custData: any) => {
    const resp = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(custData)
    });
    if (resp.ok) fetchData();
  };

  const handleUpdateCustomer = async (id: string, custData: any) => {
    const resp = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(custData)
    });
    if (resp.ok) fetchData();
  };

  const handleToggleCustomerStatus = async (id: string, newStatus: "active" | "isolated") => {
    const resp = await fetch(`/api/customers/${id}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    if (resp.ok) fetchData();
  };

  const handleDeleteCustomer = async (id: string) => {
    const resp = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (resp.ok) fetchData();
  };

  // Ticket Handlers
  const handleCreateTicket = async (customerName: string, issue: string, message: string) => {
    const resp = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName, issue, message })
    });
    if (resp.ok) fetchData();
  };

  const handleReplyTicket = async (id: string, text: string, sender: "Technician" | "Operator") => {
    const resp = await fetch(`/api/tickets/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sender })
    });
    if (resp.ok) fetchData();
  };

  const handleResolveTicket = async (id: string, rating: number) => {
    const resp = await fetch(`/api/tickets/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating })
    });
    if (resp.ok) fetchData();
  };

  // Notification Settings Handlers
  const handleUpdateSettings = async (settingsData: any) => {
    const resp = await fetch("/api/notifications/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settingsData)
    });
    if (resp.ok) fetchData();
  };

  // Simulated QRIS Complete Procedure
  const triggerQrisPayment = (cust: Customer) => {
    setPayingInvoice(cust);
    setPaymentStep("pending");
  };

  const confirmQrisPayment = async () => {
    if (!payingInvoice) return;
    const resp = await fetch(`/api/customers/${payingInvoice.id}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" })
    });
    
    if (resp.ok) {
      setPaymentStep("success");
      setTimeout(() => {
        setPayingInvoice(null);
        fetchData();
      }, 2000);
    }
  };

  // Auto detect if dark/light classes need to be on index body
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen font-sans ${darkMode ? "bg-slate-950 text-slate-300" : "bg-slate-50 text-slate-800"} transition-all duration-300`}>
      {/* Outer master wrapper */}
      <div className="flex h-screen overflow-hidden">
        
        {/* SIDE BAR: NOC Modern Dock */}
        <aside className="hidden lg:flex flex-col justify-between w-64 bg-slate-900 border-r border-cyan-500/20 p-5 shrink-0 select-none">
          <div className="space-y-8">
            {/* Branding Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-cyan-500/30 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.35)] flex items-center justify-center shrink-0">
                <img 
                  src={cipunkLogo} 
                  alt="CiPUNK Logo" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain rounded-lg" 
                />
              </div>
              <div>
                <h1 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  CiPUNK Monitor
                </h1>
                <p className="text-[10px] text-cyan-400 font-semibold font-mono tracking-widest uppercase">
                  NOC Core ROS Integrated
                </p>
              </div>
            </div>

            {/* Main Tabs Navigation */}
            <nav className="space-y-1.5">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                  activeTab === "dashboard"
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "border-transparent text-slate-400 hover:text-cyan-400 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4" />
                  Dashboard Realtime
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setActiveTab("routers")}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                  activeTab === "routers"
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "border-transparent text-slate-400 hover:text-cyan-400 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4" />
                  Gateway Mikrotik
                </div>
                {routers.length > 0 && (
                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full ${
                    activeTab === "routers" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/25" : "bg-slate-800 text-slate-300"
                  }`}>
                    {routers.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("customers")}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                  activeTab === "customers"
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "border-transparent text-slate-400 hover:text-cyan-400 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  Pelanggan ISP List
                </div>
                {customers.length > 0 && (
                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full ${
                    activeTab === "customers" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/25" : "bg-slate-800 text-slate-300"
                  }`}>
                    {customers.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("billing")}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                  activeTab === "billing"
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "border-transparent text-slate-400 hover:text-cyan-400 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4" />
                  Billing & QRIS Gateway
                </div>
                {customers.filter(c => c.paymentStatus === "unpaid").length > 0 && (
                  <span className="text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-full font-mono animate-pulse">
                    {customers.filter(c => c.paymentStatus === "unpaid").length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("tickets")}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                  activeTab === "tickets"
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "border-transparent text-slate-400 hover:text-cyan-400 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Wrench className="w-4 h-4" />
                  Tiket Gangguan
                </div>
                {tickets.filter(t => t.status === "open").length > 0 && (
                  <span className="text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-full font-mono">
                    {tickets.filter(t => t.status === "open").length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("telegram")}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                  activeTab === "telegram"
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "border-transparent text-slate-400 hover:text-cyan-400 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bot className="w-4 h-4 text-blue-400" />
                  Bot Telegram NOC
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer border ${
                  activeTab === "settings"
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "border-transparent text-slate-400 hover:text-cyan-400 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BellRing className="w-4 h-4" />
                  WhatsApp & Billing
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </nav>
          </div>

          {/* Footer User Info */}
          <div className="border-t border-slate-800 pt-4 space-y-3 font-mono text-[10px]">
            <div className="flex items-center justify-between text-slate-500">
              <span>NOC OPERATOR:</span>
              <strong className="text-slate-300">cipunknet@</strong>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>ROS DRIVER:</span>
              <strong className="text-cyan-400">RouterOS v7+ OK</strong>
            </div>
          </div>
        </aside>

        {/* MAIN BODY WINDOW */}
        <main className="flex-1 flex flex-col justify-between overflow-hidden relative">
          
          {/* HEADER BAR */}
          <header className="bg-slate-900 border-b border-cyan-500/10 px-6 py-4 flex items-center justify-between relative z-20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="lg:hidden w-8 h-8 rounded-lg overflow-hidden bg-slate-950 border border-cyan-500/30 p-0.5">
                <img 
                  src={cipunkLogo} 
                  alt="CiPUNK Logo" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain" 
                />
              </div>
              <span className="inline-flex items-center text-[10px] bg-cyan-500/10 text-cyan-400 font-mono font-bold px-2.5 py-1 rounded-full border border-cyan-500/25">
                ● LIVE MONITOR
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                IP: <strong className="text-slate-200">103.155.10.254</strong> (Surabaya Core NOC Gateway)
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg border border-cyan-500/15 text-slate-400 hover:text-white transition-all cursor-pointer bg-slate-800/20"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              </button>

              <button
                onClick={fetchData}
                className="flex items-center gap-1 bg-slate-900 border border-cyan-500/20 shadow-md shadow-cyan-950/20 px-3 py-1.5 text-xs text-cyan-400 hover:text-white hover:border-cyan-400 rounded-lg transition-all cursor-pointer font-bold font-mono"
              >
                <RotateCw className="w-3.5 h-3.5 animate-pulse" />
                REFRESH
              </button>
            </div>
          </header>

          {/* ACTIVE VIEW WRAPPER */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 relative z-10">
            
            {/* MOBILE NAVIGATION PILLS */}
            <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 select-none">
              {[
                { id: "dashboard", label: "NOC Monitor", icon: Activity },
                { id: "routers", label: "RouterOS", icon: Server },
                { id: "customers", label: "Pelanggan", icon: Users },
                { id: "billing", label: "Billing ISP", icon: CreditCard },
                { id: "tickets", label: "Tiket Support", icon: Wrench },
                { id: "telegram", label: "Bot Telegram", icon: Bot },
                { id: "settings", label: "Seting Billing", icon: BellRing }
              ].map(pill => {
                const IconComp = pill.icon;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setActiveTab(pill.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg whitespace-nowrap cursor-pointer shrink-0 ${
                      activeTab === pill.id
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: 1. DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                
                {/* 5-Metrics Bento Widget Section */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  
                  {/* Agg 1: Router Status */}
                  <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between hover:bg-slate-900/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mikrotik Gateways</span>
                      <Server className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="mt-2.5">
                      <div className="text-2xl font-black font-mono text-slate-50">
                        {stats?.onlineRouters}/{stats?.totalRouters}
                      </div>
                      <p className="text-[10px] text-emerald-400 font-bold mt-0.5">Online Status: Connected</p>
                    </div>
                  </div>

                  {/* Agg 2: Active Clients */}
                  <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between hover:bg-slate-900/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pelanggan Aktif</span>
                      <Users className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="mt-2.5">
                      <div className="text-2xl font-black font-mono text-slate-50">
                        {stats?.activeCustomers}/{stats?.totalCustomers}
                      </div>
                      <p className="text-[10px] text-indigo-400 font-medium mt-0.5">PPPoE & Hotspot leases</p>
                    </div>
                  </div>

                  {/* Agg 3: Gateway CPU load */}
                  <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between hover:bg-slate-900/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Surabaya Core CPU</span>
                      <Cpu className="w-4 h-4 text-violet-400 animate-pulse" />
                    </div>
                    <div className="mt-2.5">
                      <div className="text-2xl font-black font-mono text-slate-50">
                        {stats?.metrics.cpuLoad}%
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Dual-Core CCR Arm64</p>
                    </div>
                  </div>

                  {/* Agg 4: Realtime Upstream Latency */}
                  <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between hover:bg-slate-900/40 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Upstream Latency</span>
                      <Zap className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="mt-2.5">
                      <div className="text-2xl font-black font-mono text-emerald-400 flex items-baseline">
                        {stats?.metrics.pingMs}
                        <span className="text-xs font-semibold ml-0.5 text-slate-400">ms</span>
                      </div>
                      <p className="text-[10px] text-emerald-400 font-bold mt-0.5">Gateway SG IX / RTO 0%</p>
                    </div>
                  </div>

                  {/* Agg 5: Automated Alert Indicator */}
                  <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between hover:bg-slate-900/40 transition-all col-span-2 md:col-span-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Isolir Terhitung</span>
                      <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                    </div>
                    <div className="mt-2.5">
                      <div className="text-2xl font-black font-mono text-rose-400">
                        {stats?.isolatedCustomers}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Blokir PPPoE Overdue</p>
                    </div>
                  </div>

                </div>

                {/* Live Realtime Bandwidth Graphic Component */}
                {stats && (
                  <NetworkGraph 
                    history={stats.metrics.history} 
                    currentTx={stats.metrics.bandwidthTx} 
                    currentRx={stats.metrics.bandwidthRx} 
                  />
                )}

                {/* Sub-Flex Module (Core diagnostic recommendation + Live Interfaces logs) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left: AI Quick Diagnose advice */}
                  <div className="lg:col-span-6 glass-panel p-5 rounded-xl border border-slate-800/80 space-y-4 hover:bg-slate-900/10 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-cyan-400" />
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-100">
                          AI NOC Diagnostic Advisor (Gemini)
                        </h3>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-2.5 py-0.5 rounded-full uppercase">
                        Active Assistant
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      AI mendeteksi router <strong>Bandung IPS</strong> mengalami putus koneksi link. Redaman optical pelanggan <strong>Andi Wijaya</strong> berada di level rawan (-28.1 dBm).
                    </p>

                    <div className="font-mono text-[10px] px-3.5 py-2.5 bg-slate-950 border border-slate-900/80 rounded text-cyan-400">
                      Recommendation: Run ONU laser power sweep calibration immediately.
                    </div>

                    <button
                      onClick={() => setActiveTab("settings")}
                      className="text-xs text-cyan-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Buka Dashboard AI Analis <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Right: Interfaces Traffic Stats */}
                  <div className="lg:col-span-6 glass-panel p-5 rounded-xl border border-slate-800/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-100">
                        Mikrotik RouterOS Interface Traffic Leases
                      </h3>
                      <span className="text-[9px] font-bold font-mono text-slate-400">
                        Active Eth/Fiber Ports
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                      {interfaces.map(int => (
                        <div key={int.name} className="flex items-center justify-between bg-slate-950/40 border border-slate-900/60 p-2.5 rounded-lg font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${int.disabled ? "bg-slate-600" : "bg-emerald-500 animate-pulse"}`}></span>
                            <div>
                              <strong className="text-slate-200 block">{int.name}</strong>
                              <span className="text-[10px] text-slate-500">{int.mac}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-cyan-400 font-semibold flex items-center justify-end">
                              TX: {int.tx} Mbps
                            </div>
                            <div className="text-emerald-400 font-semibold flex items-center justify-end">
                              RX: {int.rx} Mbps
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Realtime NOC Activity Logs */}
                <div className="glass-panel p-5 rounded-xl border border-slate-800/85">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-slate-100 mb-4 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                    Live Administrator Activity Logs (NOC Systems)
                  </h3>

                  <div className="space-y-3 font-mono text-[11px] select-all max-h-[220px] overflow-y-auto">
                    {logs.map(log => (
                      <div 
                        key={log.id} 
                        className="bg-slate-950/40 p-2.5 rounded border border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-slate-900/30 transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            log.status === "success" ? "bg-emerald-400" : "bg-amber-400"
                          }`}></span>
                          <div>
                            <strong className="text-slate-300">[{log.action}]</strong>
                            <span className="text-slate-400 ml-1.5">{log.details}</span>
                          </div>
                        </div>
                        <div className="text-slate-500 text-right shrink-0">
                          by {log.user} • {new Date(log.timestamp).toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: 2. ROUTERS */}
            {activeTab === "routers" && (
              <RouterList
                routers={routers}
                onAddRouter={handleAddRouter}
                onTestConnection={handleTestRouter}
                onSyncSecrets={handleSyncRouter}
                onReboot={handleRebootRouter}
                onDeleteRouter={handleDeleteRouter}
              />
            )}

            {/* TAB CONTENT: 3. CUSTOMER MANAGER */}
            {activeTab === "customers" && (
              <CustomerManager
                customers={customers}
                onAddCustomer={handleAddCustomer}
                onUpdateCustomer={handleUpdateCustomer}
                onToggleStatus={handleToggleCustomerStatus}
                onDeleteCustomer={handleDeleteCustomer}
              />
            )}

            {/* TAB CONTENT: 4. BILLING SECTION & QRIS MODAL */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight uppercase flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-cyan-400" />
                    billing & invoice otomatis pelanggan isp
                  </h2>
                  <p className="text-xs text-slate-400">
                    Keluarkan invoice, bayar qris instan otomatis realtime sync ke RouterOS, isolir/unblock otomatis.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customers.map(c => (
                    <div 
                      key={c.id} 
                      className={`glass-panel p-5 rounded-xl border flex flex-col justify-between hover:bg-slate-900/60 transition-all ${
                        c.paymentStatus === "unpaid" ? "border-rose-500/40 glow-rose" : "border-slate-800"
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-extrabold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            INVOICE-ISP-{c.account.toUpperCase()}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            c.paymentStatus === "paid" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" 
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/15 animate-pulse"
                          }`}>
                            {c.paymentStatus === "paid" ? "LUNAS" : "TERTUNGGAK"}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-100">{c.name}</h4>
                          <p className="text-xs text-slate-400 font-mono mt-1">PPPoE Account: {c.account}</p>
                        </div>

                        <div className="border-t border-b border-slate-800 py-3 flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-400">Total Tagihan:</span>
                          <span className="text-slate-200">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(c.packagePrice)}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 space-y-1 font-mono">
                          <div>Metode: otomatis QRIS / Transfer / Cash</div>
                          <div>Due Jatuh Tempo: <strong className="text-slate-200">{c.billingDue}</strong></div>
                        </div>
                      </div>

                      {c.paymentStatus === "unpaid" ? (
                        <button
                          onClick={() => triggerQrisPayment(c)}
                          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold py-2 rounded-lg text-xs transition-all mt-5 cursor-pointer"
                        >
                          Bayar via QRIS Instan
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold py-2 rounded-lg mt-5 select-none uppercase">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          Tagihan Lunas
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* QRIS POPUP MODAL */}
                {payingInvoice && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-6 animate-scale-up shadow-2xl relative">
                      
                      <div className="absolute top-4 right-4">
                        <button 
                          onClick={() => setPayingInvoice(null)}
                          className="text-slate-500 hover:text-slate-100 font-semibold cursor-pointer text-sm"
                        >
                          Close
                        </button>
                      </div>

                      {paymentStep === "pending" ? (
                        <>
                          <div className="space-y-1">
                            <h3 className="font-bold text-slate-100 text-base uppercase font-mono">QRIS INTAN MULTIPAY</h3>
                            <p className="text-xs text-slate-400">Scan QRIS menggunakan GoPay, OVO, Dana, linkAja, m-Banking</p>
                          </div>

                          {/* QR Code Graphic Frame */}
                          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center">
                            {/* Standard generated dummy QR code placeholder that is stylized for NOC look */}
                            <div className="w-44 h-44 bg-slate-100 rounded-lg p-2 flex items-center justify-center relative overflow-hidden">
                              <img 
                                referrerPolicy="no-referrer"
                                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=CIPUNK_PAYMENT_SIMULATOR" 
                                alt="QR Code" 
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="text-[11px] text-cyan-400 font-bold font-mono mt-3 uppercase tracking-widest">
                              TOTAL: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(payingInvoice.packagePrice)}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <button
                              onClick={confirmQrisPayment}
                              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Konfirmasi Pembayaran Sukses (Simulasi)
                            </button>
                            <p className="text-[10px] text-slate-400">
                              Layanan PPPoE akan segera di-unban di RouterOS secara realtime sewaktu sukses terkonfirmasi.
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="py-8 space-y-4 flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center text-emerald-400 animate-bounce">
                            <CheckCircle className="w-10 h-10" />
                          </div>
                          <div className="text-center">
                            <h3 className="font-bold text-slate-100 text-base uppercase">Pembayaran Diterima!</h3>
                            <p className="text-xs text-slate-400 mt-1">
                              Meluncurkan perintah API Routeros untuk meng-unblock akun {payingInvoice.account} otomatis ...
                            </p>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB CONTENT: 5. TICKETS */}
            {activeTab === "tickets" && (
              <TicketingSystem
                tickets={tickets}
                onCreateTicket={handleCreateTicket}
                onReplyTicket={handleReplyTicket}
                onResolveTicket={handleResolveTicket}
              />
            )}

            {/* TAB CONTENT: 6. SETTINGS & TelegramBot Alerts */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                {/* AI smart modules */}
                <AiAdvisor />

                {/* Automation & Gateway endpoints */}
                {settings && (
                  <AlertSettings
                    alerts={alerts}
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                  />
                )}
              </div>
            )}

            {/* TAB CONTENT: 7. BOT TELEGRAM NOC */}
            {activeTab === "telegram" && settings && (
              <TelegramBotManager
                alerts={alerts}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            )}

          </div>

          {/* LOWER STATUS FOOTER BAR */}
          <footer className="bg-slate-900 border-t border-cyan-500/10 px-6 py-3 select-none text-[9px] tracking-widest uppercase flex flex-col sm:flex-row items-center justify-between shrink-0 relative z-20 font-bold text-slate-500 gap-2">
            <div className="flex flex-wrap gap-4 items-center justify-center">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> API Gateway: OK
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> WebSocket: Realtime
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> AI Analyzer: Ready
              </div>
            </div>
            <div className="text-cyan-600 font-mono">System ID: 0xFF-711-2026 • CiPUNK Monitor PRO</div>
          </footer>

        </main>
      </div>
    </div>
  );
}
