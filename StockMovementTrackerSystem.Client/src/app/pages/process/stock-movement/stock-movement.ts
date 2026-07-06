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
import { StockMovementModel, ViProductStockSummaryModel } from '../../../core/models/master/stock-movement.model';
import { StockMovementStore } from '../../../core/stores/stock-store.store';
import { ProductStockStore } from '../../../core/stores/product-stock.store';
import { environment } from '../../../../environments/environment.prod';

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
    templateUrl: './stock-movement.html',
})
export class StockMovement implements OnInit {
    stockMovementStore$ = inject(StockMovementStore);
    productStockStore$ = inject(ProductStockStore);
    //models & variables
    selectedValue: StockMovementModel | null | undefined;
    items!: MenuItem[] | undefined;
    isModalVisible!: boolean;
    typeOptions = [
        { label: 'Stock In', value: 'IN' },
        { label: 'Stock Out', value: 'OUT' },
    ];

    get productNames() {
        return this.productStockStore$.getAll$().map((product) => ({
            label: product.productName ?? product.productId,
            value: product.productId,
        }));
    }

    constructor(
        private translateService: TranslateService,
        private messageService: MessageService,
        private router: Router,
    ) {
        effect(() => {
            this.selectedValue = this.stockMovementStore$.selectedValue$();
            this.isModalVisible = this.stockMovementStore$.isModalVisible$();
        });
    }

    private formBuilder = inject(FormBuilder);
    stockMovementForm = this.formBuilder.group({
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
        this.stockMovementStore$.loadAll();
    }

    loadMenu() {
        this.items = [
            {
                label: this.translateService.instant('EDIT'),
                icon: 'pi pi-pen-to-square',
                command: () => this.update(),
            },
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
        this.stockMovementForm.reset({
            movementId: '',
            productId: '',
            quantity: 0,
            type: '',
            movementDate: null
        });
        this.stockMovementForm.controls['movementId'].enable();
        this.stockMovementStore$.createDialog();
    }

    update(): void {
        if (this.selectedValue != null) {
            this.stockMovementStore$.updateDialog(this.selectedValue);
            console.log(this.selectedValue);

            // Assign value to form
            this.stockMovementForm.controls['movementId'].setValue(this.selectedValue.movementId);
            this.stockMovementForm.controls['movementId'].disable();
            this.stockMovementForm.controls['productId'].setValue(this.selectedValue.productId);
            this.stockMovementForm.controls['quantity'].setValue(this.selectedValue.quantity);
            this.stockMovementForm.controls['type'].setValue(this.selectedValue.type);
        } else {
            this.messageService.add({
                key: environment.default_toastKey,
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please select a record to update.',
            });
        }
    }

    //#region audit log
    auditLog(): void {
        if (this.selectedValue) {
            this.router
                .navigate(['/process', 'stock-movement', 'auditlogs', this.selectedValue.productId])
                .then((r) => { });
        }
    }
    //#endregion

    submit(): void {
        if (this.stockMovementForm.valid) {
            let model = this.stockMovementForm.value as StockMovementModel;
            this.stockMovementStore$.add(model);
        } else {
            Object.keys(this.stockMovementForm.controls).forEach((field) => {
                const control = this.stockMovementForm.get(field);
                control?.markAsDirty({ onlySelf: true });
            });
        }
    }

    clearSection(): void {
        this.selectedValue = null as any;
    }

    onDialogHide(): void {
        this.stockMovementStore$.reset();
        this.selectedValue = null;
        this.stockMovementForm.controls['movementId'].enable();
    }

}
