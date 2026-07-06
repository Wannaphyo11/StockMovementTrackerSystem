import { MenuItem } from "primeng/api";

export interface StockMovementModel {
    movementId: string;
    productId: string;
    quantity: number | null;
    type: string | null;
    movementDate: string | null;
}

export interface ProductStocksModel {
    productId: string;
    productName: string | null;
    currentStock: number | null;
    totalTransactionsCount: number | null;
    createdDate: string | null;
    lastUpdatedDate: string | null;
    menuItems: MenuItem[];
}

export interface ViProductStockSummaryModel {
    movementId: string;
    productId: string;
    productName: string | null;
    currentStock: number | null;
    quantity: number | null;
    type: string | null;
    totalTransactionsCount: number | null;
    movementDate: string | null;
    menuItems: MenuItem[];
}