export interface DeliveryCity {
  id: string;
  name: string;
  sortOrder: number;
}

export interface CreateDeliveryCityRequest {
  name: string;
}
