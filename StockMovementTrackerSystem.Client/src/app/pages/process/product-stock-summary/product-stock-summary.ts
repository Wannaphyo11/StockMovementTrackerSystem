import { ChangeDetectorRef, Component, effect, inject, OnInit } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ExportService } from '../../../shared/services/export.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ViProductStockSummaryModel } from '../../../core/models/master/stock-movement.model';
import { ProductStockSummaryStore } from '../../../core/stores/product-stock-summary';

@Component({
    selector: 'app-product-stock',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        //primeNG Modules
        ToastModule,
        ButtonModule,
        SplitButtonModule,
        ToggleSwitchModule,
        InputTextModule,
        InputNumberModule,
        InputIconModule,
        IconFieldModule,
        TagModule,
        TableModule,
        DialogModule,
        ConfirmDialogModule,
        SelectModule,
        MessageModule,
    ],
    providers: [ConfirmationService, ExportService, DatePipe],
    templateUrl: './product-stock-summary.html',
})
export class ProductStockSummary implements OnInit {
    productStockSummaryStore$ = inject(ProductStockSummaryStore);
    //models & variables
    selectedValue: ViProductStockSummaryModel | null | undefined;
    items!: MenuItem[] | undefined;
    isModalVisible!: boolean;

    constructor(
        private translateService: TranslateService,
        private messageService: MessageService,
        private router: Router,
    ) {
        effect(() => {
            this.selectedValue = this.productStockSummaryStore$.selectedValue$();
        });
    }

    private formBuilder = inject(FormBuilder);
    stockMovementForm = this.formBuilder.group({
        movementId: [''],
        productId: ['', { validators: [Validators.required] }],
        quantity: [0, { validators: [Validators.required] }],
        type: ['', { validators: [Validators.required] }],
        movementDate: [null]
    });

    ngOnInit(): void {
        // refresh labels when language changes
        this.productStockSummaryStore$.loadAll();
    }


    //#region audit log
    auditLog(productStock?: any): void {
        const selectedProduct = productStock || this.selectedValue;

        if (selectedProduct && selectedProduct.productId) {
            this.router
                .navigate(['/process', 'product-stock-summary', 'auditlogs', selectedProduct.productId])
                .then((r) => { });
        }
    }
    //#endregion

    clearSection(): void {
        this.selectedValue = null as any;
    }

    onDialogHide(): void {
        this.productStockSummaryStore$.reset();
        this.selectedValue = null;
        this.stockMovementForm.controls['movementId'].enable();
    }

}
