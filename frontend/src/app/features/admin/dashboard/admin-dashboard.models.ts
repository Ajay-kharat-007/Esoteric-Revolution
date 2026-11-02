export interface DashboardQueues {
  works: number;
  support: number;
  reports: number;
  products: number;
  users: number;
}
export interface DashboardQueueResponse {
  generatedAt: string;
  roles: string[];
  queues: DashboardQueues;
}
export interface DashboardOverview {
  generatedAt: string;
  users: number;
  activeUsers: number;
  publishedWorks: number;
  paidOrders: number;
  activeEntitlements: number;
  openSupportCases: number;
  openReports: number;
}
export interface DashboardAuditEvent {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  reason: string | null;
  createdAt: string;
  actor: {
    id: string;
    email: string | null;
    profile: { displayName: string | null } | null;
  } | null;
}
export interface DashboardHealth {
  status: 'ready' | 'not_ready';
  checks: { database: boolean; redis: boolean };
}
export interface AdminDashboardData {
  queues: DashboardQueueResponse;
  overview: DashboardOverview;
  activity: DashboardAuditEvent[];
  health: DashboardHealth;
}
