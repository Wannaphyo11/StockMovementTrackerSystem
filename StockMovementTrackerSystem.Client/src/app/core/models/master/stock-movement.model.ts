export interface ProductStockModel {
    movementId: string;
    productId: string;
    quantity: number | null;
    type: string | null;
    movementDate: string | null;
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
}