import { Component, OnInit, signal } from '@angular/core';
import { getDate, getDecimal, hasDate, hasDecimal, isObject } from '../../../../core/services/audit-log.utils';
import { AuditLogModel } from '../../../../core/models/audit-log.model';
import { ActivatedRoute } from '@angular/router';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Toast } from "primeng/toast";
import { StockMovementService } from '../../../../core/services/process/stock-movement.service';
import { ProductStocksModel } from '../../../../core/models/master/stock-movement.model';

@Component({
    selector: 'app-audit-log',
    imports: [
        CommonModule,
        FormsModule,
        // PrimeNG
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        CardModule,
        TableModule,
        DialogModule,
        ButtonModule,
        TagModule,
        Toast
    ],
    templateUrl: './audit-log.html',
})
export class AuditLog implements OnInit {


    id!: string;
    productid!: string;

    auditLogs = signal<AuditLogModel[]>([]);
    selectedLog = signal<AuditLogModel | null>(null);
    currentProductStockType = signal<ProductStocksModel | null>(null);

    loading: boolean = false;
    loadingServiceType: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private StockMovementService: StockMovementService,
        private loggerService: LoggerService,
    ) { }
    ngOnInit(): void {
        this.route.paramMap.subscribe((params) => {
            this.productid = params.get('productId') ?? '';
            if (this.productid) {
                this.loadData();
            }
        });
    }

    loadData(): void {
        this.loading = true;

        this.StockMovementService.getAuditLog(this.productid).subscribe({
            next: (res) => {
                this.loading = false;
                this.auditLogs.set(res.data as AuditLogModel[]);
                this.loggerService.info('AuditLog loaded');
                this.loggerService.info(this.auditLogs);
            },
            error: (err) => {
                this.loggerService.error(err);
                this.loading = false;
            },
        });

        this.loadingServiceType = true;
    }

    // --- Actions ---
    selectLog(log: AuditLogModel) {
        this.selectedLog.set(log);
    }

    closeDialog() {
        this.selectedLog.set(null);
    }

    toggleExpand(log: AuditLogModel) {
        this.auditLogs.update((logs) =>
            logs.map((l) => (l.auditLogId === log.auditLogId ? { ...l, expanded: !l.expanded } : l)),
        );
    }

    // --- Style Helpers (Mimic PrimeNG severities) ---
    // getBadgeClass(state: string): string {
    //     switch (state) {
    //         case 'Added':
    //             return 'bg-green-100 text-green-700 ring-1 ring-green-600/10';
    //         case 'Modified':
    //             return 'bg-orange-100 text-orange-700 ring-1 ring-orange-600/10';
    //         case 'Deleted':
    //             return 'bg-red-100 text-red-700 ring-1 ring-red-600/10';
    //         default:
    //             return 'bg-slate-100 text-slate-600';
    //     }
    // }
}
