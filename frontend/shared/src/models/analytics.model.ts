export interface DailyMetric {
  date: string;
  visitorCount: number;
  orderCount: number;
  loggedInCustomerCount: number;
}

export interface DailySales {
  date: string;
  orderCount: number;
  revenue: number;
}

export interface CategorySales {
  category: string;
  orderCount: number;
  revenue: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface AnalyticsOverview {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
  averageOrderValue: number;
  salesToday: number;
}
