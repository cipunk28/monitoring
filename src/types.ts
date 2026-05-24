export interface RouterConnection {
  id: string;
  name: string;
  ip: string;
  username: string;
  apiPort: number;
  ssl: boolean;
  status: "connected" | "disconnected" | "error";
  model: string;
  version: string;
  uptime: string;
  cpu: number;
  ram: number;
  disk: number;
}

export interface Customer {
  id: string;
  name: string;
  type: "PPPoE" | "Hotspot" | "Static";
  account: string;
  secret: string;
  speedLimit: string;
  status: "active" | "isolated";
  paymentStatus: "paid" | "unpaid";
  uptime: string;
  ip: string;
  mac: string;
  usageGB: number;
  billingDue: string;
  packagePrice: number;
  coordinate: [number, number];
  onuOlt: string;
  signalWireless?: string;
}

export interface NetworkTicket {
  id: string;
  customerName: string;
  status: "open" | "in_progress" | "resolved";
  issue: string;
  createdAt: string;
  messages: Array<{
    id: string;
    sender: "Customer" | "Technician" | "Operator";
    text: string;
    timestamp: string;
    photoUrl?: string;
  }>;
  rating?: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  status: "success" | "warning" | "error";
}

export interface NotificationAlert {
  id: string;
  timestamp: string;
  type: "whatsapp" | "telegram" | "email" | "system";
  recipient: string;
  message: string;
  status: "sent" | "failed";
}

export interface DashboardStats {
  onlineRouters: number;
  totalRouters: number;
  totalCustomers: number;
  activeCustomers: number;
  isolatedCustomers: number;
  metrics: {
    bandwidthTx: number;
    bandwidthRx: number;
    pingMs: number;
    lossPercent: number;
    cpuLoad: number;
    ramTotal: number;
    ramUsed: number;
    diskTotal: number;
    diskUsed: number;
    history: Array<{
      time: string;
      tx: number;
      rx: number;
    }>;
  };
}

export interface NetworkInterface {
  name: string;
  type: string;
  running: boolean;
  disabled: boolean;
  tx: number;
  rx: number;
  mac: string;
}

export interface SimpleQueue {
  name: string;
  target: string;
  maxLimit: string;
  bytes: number;
  packetRate: number;
  status: string;
}
