import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProductStockStore } from '../../core/stores/product-stock.store';
import { ProductStockSummaryStore } from '../../core/stores/product-stock-summary';
import { SharedService } from '../../shared/services/shared.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, ButtonModule, TagModule],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  readonly productStore = inject(ProductStockStore);
  readonly movementStore = inject(ProductStockSummaryStore);
  private readonly sharedService = inject(SharedService);

  get userName(): string { return this.sharedService.getUserName() || 'there'; }
  get greeting(): string { const hour = new Date().getHours(); return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'; }
  get products() { return this.productStore.getAll$(); }
  get movements() { return this.movementStore.getAll$(); }
  get totalUnits(): number { return this.products.reduce((sum, product) => sum + Number(product.currentStock || 0), 0); }
  get totalTransactions(): number { return this.products.reduce((sum, product) => sum + Number(product.totalTransactionsCount || 0), 0); }
  get lowStockCount(): number { return this.products.filter((product) => Number(product.currentStock || 0) <= 10).length; }
  get recentMovements() { return [...this.movements].sort((a, b) => new Date(b.movementDate || 0).getTime() - new Date(a.movementDate || 0).getTime()).slice(0, 6); }
  get attentionProducts() { return [...this.products].filter((product) => Number(product.currentStock || 0) <= 10).sort((a, b) => Number(a.currentStock || 0) - Number(b.currentStock || 0)).slice(0, 5); }

  ngOnInit(): void {
    this.productStore.loadAll();
    this.movementStore.loadAll();
  }
}
