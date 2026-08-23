export interface CustomerListItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  points: number;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

export type CustomerDetail = CustomerListItem;
