import { ChangeDetectorRef, Component, effect, inject, OnInit } from '@angular/core';
import { ProductStockStore } from '../../../core/stores/product-stock.store';
import { ProductStockModel, ViProductStockSummaryModel } from '../../../core/models/master/stock-movement.model';
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
        TranslatePipe,
        SelectModule,
        MessageModule,
    ],
    providers: [ConfirmationService, ExportService, DatePipe],
    templateUrl: './product-stock.html',
})
export class ProductStock implements OnInit {
    productStockStore$ = inject(ProductStockStore);
    //models & variables
    selectedValue: ViProductStockSummaryModel | null | undefined;
    items!: MenuItem[] | undefined;
    isModalVisible!: boolean;
    typeOptions = [
        { label: 'Stock In', value: 'IN' },
        { label: 'Stock Out', value: 'OUT' },
    ];

    constructor(
        private translateService: TranslateService,
        private confirmationService: ConfirmationService,
        private exportService: ExportService,
        private datePipe: DatePipe,
        private loggerService: LoggerService,
        private messageService: MessageService,
        private router: Router,
        private cdr: ChangeDetectorRef,
    ) {
        effect(() => {
            this.selectedValue = this.productStockStore$.selectedValue$();
            this.isModalVisible = this.productStockStore$.isModalVisible$();
        });
    }

    private formBuilder = inject(FormBuilder);
    productStockForm = this.formBuilder.group({
        movementId: ['', { validators: [Validators.required] }],
        productId: ['', { validators: [Validators.required] }],
        quantity: [0, { validators: [Validators.required] }],
        type: ['', { validators: [Validators.required] }],
        movementDate: [null]
    });

    ngOnInit(): void {
        this.loadMenu();

        // refresh labels when language changes
        this.translateService.onLangChange.subscribe(() => this.loadMenu());
        this.productStockStore$.loadAll();
    }

    loadMenu() {
        this.items = [
            //   {
            //     label: this.translateService.instant('EDIT'),
            //     icon: 'pi pi-pen-to-square',
            //     command: () => this.update(),
            //   },
            //   {
            //     label: this.translateService.instant('DELETE'),
            //     icon: 'pi pi-trash',
            //     command: () => this.delete(),
            //   },
            //   {
            //     label: this.translateService.instant('EXCEL'),
            //     icon: 'pi pi-file-excel',
            //     command: () => this.excel(),
            //   },
            // {
            //     label: this.translateService.instant('AUDIT_LOG'),
            //     icon: 'pi pi-clock',
            //     command: () => this.auditLog(),
            // },
        ];
    }

    //#region create & update

    create(): void {
        this.productStockForm.reset({
            movementId: '',
            productId: '',
            quantity: 0,
            type: '',
        });
        this.productStockStore$.createDialog();
    }

    //#region audit log
    auditLog(productStock: ViProductStockSummaryModel | null | undefined = this.selectedValue): void {
        if (productStock) {
            this.router
                .navigate([
                    'master',
                    'product-stock',
                    productStock.movementId,
                    productStock.productId,
                    'audit-logs',
                ])
                .then(() => { });
        }
    }
    //#endregion

    submit(): void {
        if (this.productStockForm.valid) {
            let model = this.productStockForm.value as ProductStockModel;
            this.productStockStore$.add(model);
        } else {
            Object.keys(this.productStockForm.controls).forEach((field) => {
                const control = this.productStockForm.get(field);
                control?.markAsDirty({ onlySelf: true });
            });
        }
    }

    clearSection(): void {
        this.selectedValue = null as any;
    }

    selectProductStock(productStock: ViProductStockSummaryModel | ViProductStockSummaryModel[] | undefined): void {
        if (!productStock || Array.isArray(productStock)) return;
        this.productStockStore$.selectedChange(productStock);
    }

    onDialogHide(): void {
        this.productStockStore$.reset();
        this.selectedValue = null;
        this.productStockForm.controls['movementId'].enable();
    }

}
