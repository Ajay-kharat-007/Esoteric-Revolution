export interface AdminNavigationItem {
  label: string;
  route: string;
  icon: string;
  enabled: boolean;
}

export interface AdminNavigationGroup {
  label: string;
  items: AdminNavigationItem[];
}

export const ADMIN_NAVIGATION: AdminNavigationGroup[] = [
  {
    label: '',
    items: [{ label: 'Dashboard', route: '/admin/dashboard', icon: '⌂', enabled: true }],
  },
  {
    label: 'Content',
    items: [
      { label: 'Works', route: '/admin/content/works', icon: '◫', enabled: false },
      { label: 'Media Library', route: '/admin/content/media', icon: '▧', enabled: false },
      { label: 'Categories', route: '/admin/catalogue/categories', icon: '◇', enabled: false },
      { label: 'Topics', route: '/admin/catalogue/topics', icon: '◎', enabled: false },
      { label: 'Contributors', route: '/admin/catalogue/contributors', icon: '♙', enabled: false },
      { label: 'Editorial', route: '/admin/editorial/sources', icon: '✦', enabled: false },
      {
        label: 'Learning Paths',
        route: '/admin/discovery/learning-paths',
        icon: '⌁',
        enabled: false,
      },
      { label: 'Insights', route: '/admin/discovery/insights', icon: '◈', enabled: false },
      { label: 'Quizzes', route: '/admin/quizzes', icon: '✓', enabled: false },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { label: 'Products', route: '/admin/commerce/products', icon: '□', enabled: false },
      { label: 'Bundles', route: '/admin/commerce/bundles', icon: '▦', enabled: false },
      { label: 'Coupons', route: '/admin/commerce/coupons', icon: '%', enabled: false },
      { label: 'Orders', route: '/admin/commerce/orders', icon: '≡', enabled: false },
      { label: 'Refunds', route: '/admin/commerce/refunds', icon: '↶', enabled: false },
    ],
  },
  {
    label: 'People',
    items: [{ label: 'Learners', route: '/admin/learners', icon: '♧', enabled: false }],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Support Cases',
        route: '/admin/operations/support-cases',
        icon: '?',
        enabled: false,
      },
      {
        label: 'Content Reports',
        route: '/admin/operations/content-reports',
        icon: '!',
        enabled: false,
      },
      {
        label: 'Notifications',
        route: '/admin/operations/notifications',
        icon: '◌',
        enabled: false,
      },
      { label: 'Campaigns', route: '/admin/operations/campaigns', icon: '◇', enabled: false },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Overview', route: '/admin/analytics/overview', icon: '⌗', enabled: false },
      { label: 'Commerce', route: '/admin/analytics/commerce', icon: '⌁', enabled: false },
      { label: 'Learning', route: '/admin/analytics/learning', icon: '◒', enabled: false },
    ],
  },
  {
    label: 'Governance',
    items: [
      { label: 'Audit Log', route: '/admin/governance/audit-log', icon: '☷', enabled: false },
      {
        label: 'Account Deletions',
        route: '/admin/governance/deletion-requests',
        icon: '⊘',
        enabled: false,
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Platform', route: '/admin/settings/platform', icon: '⚙', enabled: false },
      { label: 'Feature Flags', route: '/admin/settings/feature-flags', icon: '⚑', enabled: false },
      { label: 'Profile', route: '/admin/settings/profile', icon: '○', enabled: false },
      { label: 'Security', route: '/admin/settings/security', icon: '◇', enabled: false },
    ],
  },
];
