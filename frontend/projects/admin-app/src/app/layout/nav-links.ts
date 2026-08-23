// Single source of truth for the admin nav — shared by the desktop sidebar and the mobile
// hamburger menu so the two can never drift out of sync (they did once: the hamburger menu was
// missing Reviews and FAQ & Contact because it kept its own hand-copied list).
export interface NavLink {
  path: string;
  label: string;
  icon: string;
}

export const NAV_LINKS: NavLink[] = [
  { path: '/overview', label: 'Overview', icon: 'grid' },
  { path: '/analytics', label: 'Analytics', icon: 'chart' },
  { path: '/orders', label: 'Orders', icon: 'box' },
  { path: '/products', label: 'Products', icon: 'tag' },
  { path: '/homepage', label: 'Homepage', icon: 'home' },
  { path: '/customers', label: 'Customers', icon: 'users' },
  { path: '/reviews', label: 'Reviews', icon: 'star' },
  { path: '/faq', label: 'FAQ & Contact', icon: 'help' },
  { path: '/notifications', label: 'Notifications', icon: 'bell' },
];
