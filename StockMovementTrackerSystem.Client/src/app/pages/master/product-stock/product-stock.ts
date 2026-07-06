import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
//primeNg Moudeles import
import { CommonModule, DatePipe } from '@angular/common';
import { Component, effect, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { SplitButtonModule } from 'primeng/splitbutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
//service import
import { TranslateService } from '@ngx-translate/core';
import { MessageModule } from 'primeng/message';
import { Router } from '@angular/router';
import { ExportService } from '../../../shared/services/export.service';
import { ProductStockStore } from '../../../core/stores/product-stock.store';
import { ProductStocksModel } from '../../../core/models/master/stock-movement.model';
import { environment } from '../../../../environments/environment';

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
    InputIconModule,
    IconFieldModule,
    TagModule,
    TableModule,
    DialogModule,
    ConfirmDialogModule,
    MessageModule
  ],
  providers: [ConfirmationService, ExportService, DatePipe],
  templateUrl: './product-stock.html',
})
export class ProductStock implements OnInit {
  productStockStore$ = inject(ProductStockStore);
  selectedValue: ProductStocksModel | null | undefined;
  items!: MenuItem[] | undefined;
  isModalVisible: boolean = false;

  constructor(
    private translateService: TranslateService,
    private messageService: MessageService,
  ) {
    effect(() => {
      this.selectedValue = this.productStockStore$.selectedValue$();
      this.isModalVisible = this.productStockStore$.isModalVisible$();
    });
  }

  //#region FormBuilder
  private formBuilder = inject(FormBuilder);
  productStockForm = this.formBuilder.group({
    productId: ['', { validators: [Validators.required] }],
    productName: ['', { validators: [Validators.required] }],
    currentStock: [0, { validators: [Validators.required] }],
    totalTransactionsCount: [0, { validators: [Validators.required] }],
  });

  //#endregion

  ngOnInit(): void {
    this.loadMenu();

    // refresh labels when language changes
    this.translateService.onLangChange.subscribe(() => this.loadMenu());

    this.productStockStore$.loadAll();
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
      //   {
      //     label: this.translateService.instant('AUDIT_LOG'),
      //     icon: 'pi pi-clock',
      //     command: () => this.auditLog(),
      //   },
    ];
  }

  create(): void {
    this.productStockForm.reset({
      productId: '',
      productName: '',
      currentStock: 0,
      totalTransactionsCount: 0,
    });
    this.productStockForm.controls.productId.enable();
    this.productStockStore$.createDialog();
  }

  update(): void {
    if (this.selectedValue != null) {
      this.productStockStore$.updateDialog(this.selectedValue);
      console.log(this.selectedValue);

      // Assign value to form
      this.productStockForm.controls['productId'].setValue(
        this.selectedValue.productId,
      );
      this.productStockForm.controls.productId.disable();
      this.productStockForm.controls['productName'].setValue(this.selectedValue.productName);
      this.productStockForm.controls['currentStock'].setValue(this.selectedValue.currentStock);
      this.productStockForm.controls['totalTransactionsCount'].setValue(this.selectedValue.totalTransactionsCount);
    } else {
      this.messageService.add({
        key: environment.default_toastKey,
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please choose Product',
      });
    }
  }

  //   delete(): void {
  //     if (this.selectedValue != null) {
  //       this.confirmationService.confirm({
  //         message: 'Are You Sure Want To Delete?',
  //         header: 'Delete Confirmation',
  //         icon: 'pi pi-info-circle',
  //         accept: () => {
  //           this.productStockStore$.delete({
  //             productId: this.selectedValue!.productId,
  //           });
  //         },
  //         reject: () => {
  //           this.selectedValue = null as any;
  //         },
  //         key: 'productStockDeleteDialog',
  //       });
  //     } else {
  //       this.messageService.add({
  //         key: 'globalMessage',
  //         severity: 'warn',
  //         summary: 'Warning',
  //         detail: 'Please choose Product Stock.',
  //       });
  //     }
  //   }

  //#region submit

  submit(): void {
    if (this.productStockForm.valid) {
      let model = this.productStockForm.value as ProductStocksModel;

      if (!this.productStockStore$.isEdit()) {
        this.productStockStore$.add(model);
      } else {
        model.productId = this.productStockStore$.selectedValue()?.productId ?? '';
        this.productStockStore$.update(model);
      }
    } else {
      Object.keys(this.productStockForm.controls).forEach((field) => {
        const control = this.productStockForm.get(field);
        control?.markAsDirty({ onlySelf: true });
      });
    }
  }

  //#endregion

  clearSection(): void {
    this.selectedValue = null as any;
  }

  onDialogHide(): void {
    this.productStockStore$.reset();
    this.selectedValue = null;
    this.productStockForm.controls['productId'].enable();
  }

  //   excel(): void {
  //     const exportColumns: ExportColumnModel[] = [
  //       { key: 'productStockId', value: 'ID' },
  //       { key: 'productStockName', value: 'Product Stock' },
  //       { key: 'status', value: 'Status' },
  //       { key: 'createdOn', value: 'Created On' },
  //       { key: 'createdBy', value: 'Created By' },
  //       { key: 'updatedOn', value: 'Updated On' },
  //       { key: 'updatedBy', value: 'Updated By' },
  //     ];

  //     const exportData = this.productStockStore$.getAll$().map((productStock) => ({
  //       ...productStock,
  //       status: productStock.status ? 'Active' : 'Inactive',
  //       createdOn: productStock.createdOn
  //         ? this.datePipe.transform(productStock.createdOn, 'dd/MMM/yyyy hh:mm a')
  //         : '',
  //       updatedOn: productStock.updatedOn
  //         ? this.datePipe.transform(productStock.updatedOn, 'dd/MMM/yyyy hh:mm a')
  //         : '',
  //     }));

  //     this.exportService.exportSelectColsWithDynamicHeader(
  //       exportData,
  //       exportColumns,
  //       'ProductStock_Export_' + this.datePipe.transform(new Date(), 'ddMMyyyy_hhmmss')
  //     );
  //   }
  // }
}
