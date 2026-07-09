import { Component, effect, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';

// PrimeNG Modules
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
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { PasswordModule } from 'primeng/password';
import { SelectButtonModule } from 'primeng/selectbutton';

// State and Services
import { UserManageStore } from '../../core/stores/user-manage.store';
import { UserInfoEntryModel } from '../../core/models/usermanage/usermanage.model';
import { UserManageService } from '../../core/services/usermanage/usermanage';
import { ExportService } from '../../shared/services/export.service';
import { SharedService } from '../../shared/services/shared.service';

@Component({
    selector: 'app-usermanage',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
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
        MessageModule,
        SelectModule,
        PasswordModule,
        SelectButtonModule
    ],
    providers: [ConfirmationService, ExportService, DatePipe],
    templateUrl: './usermanage.html',
})
export class UserManage implements OnInit {
    readonly userManageStore$ = inject(UserManageStore);
    private readonly userManageService = inject(UserManageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly translateService = inject(TranslateService);
    private readonly messageService = inject(MessageService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly shareService = inject(SharedService);

    selectedValue: UserInfoEntryModel | null = null;
    items!: MenuItem[] | undefined;

    roles = [
        { label: 'Admin', value: 'Admin' },
        { label: 'Cashier', value: 'Cashier' },
    ];

    userManageForm = this.formBuilder.group({
        userName: [''],
        email: ['', [Validators.required, Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]],
        phoneNumber: ['', [Validators.required, Validators.pattern("^((\\+95-?)|0)?[0-9]{8,10}$")]],
        password: [''],
        roleName: ['', Validators.required],
        userId: [''],
        name: [''],
        fullName: ['', Validators.required],
        address: ['', Validators.required],
        status: [true],
        terminateDate: [null],
        createdOn: [null],
        createdBy: [null],
        updatedOn: [null],
        updatedBy: [null]
    });

    resetPasswordForm = this.formBuilder.group({
        newPassword: ['', Validators.required]
    });

    constructor() {
        effect(() => {
            this.selectedValue = this.userManageStore$.selectedValue$();
        });
    }

    ngOnInit(): void {
        this.loadMenu();
        this.translateService.onLangChange.subscribe(() => this.loadMenu());
        this.userManageStore$.loadAll();
    }

    loadMenu(): void {
        this.items = [
            {
                label: this.translateService.instant('COMMON.EDIT'),
                icon: 'pi pi-pen-to-square',
                command: () => this.update(),
            },
            {
                label: 'Reset Password',
                icon: 'pi pi-key',
                command: () => this.openResetPasswordDialog(),
            }
        ];
    }

    onRoleChange(newRole: string): void {
        this.userManageStore$.setRole(newRole);
        this.clearSection();
        this.userManageStore$.loadAll();
    }

    create(): void {
        this.userManageForm.reset({ status: true });
        this.userManageForm.enable();
        this.userManageForm.get('password')?.setValidators([Validators.required]);
        this.userManageStore$.createDialog();
    }

    update(): void {
        if (!this.selectedValue) {
            this.messageService.add({
                key: 'globalMessage',
                severity: 'warn',
                summary: this.translateService.instant('COMMON.WARNING'),
                detail: this.translateService.instant('USER_MANAGE.PLEASE_CHOOSE_USER'),
            });
            return;
        }
        this.userManageStore$.updateDialog(this.selectedValue);
        this.userManageForm.reset();
         this.userManageForm.controls['userId'].setValue(
        this.selectedValue.userId,
      );
      this.userManageForm.controls.userId.disable();
        this.userManageForm.patchValue(this.selectedValue);
    }

    openResetPasswordDialog(): void {
        if (!this.selectedValue) {
            this.messageService.add({
                key: 'globalMessage',
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please select an User to reset password.'
            });
            return;
        }
        this.resetPasswordForm.reset();
        this.userManageStore$.openResetPasswordDialog(this.selectedValue);
    }

    confirmResetPassword(): void {
        if (this.resetPasswordForm.invalid) {
            this.resetPasswordForm.markAllAsTouched();
            return;
        }

        this.confirmationService.confirm({
            key: 'resetPasswordDialog',
            message: `Are you sure you want to reset password for ${this.selectedValue?.userName}?`,
            header: 'Reset Password Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const userName = this.selectedValue?.userName;
                const newPassword = this.resetPasswordForm.get('newPassword')?.value;
                if (userName && newPassword) {
                    this.userManageStore$.resetPassword({ userName, newPassword });
                }
            }
        });
    }

    checkUserName() {
        const username = this.userManageForm.get('userName')?.value;
        if (!username || this.userManageStore$.isEdit$()) return;

        this.userManageService.checkUserName(username).subscribe({
            next: (res: any) => {
                if (!res.success) {
                    this.userManageForm.get('userName')?.setErrors({ exists: true });
                }
            }
        });
    }

    onActiveChange(user: UserInfoEntryModel, currentStatus: boolean): void {
        this.confirmationService.confirm({
            message: 'Are you sure you want to change this user\'s status?',
            header: 'Terminate Confirmation',
            icon: 'pi pi-info-circle',
            accept: () => {
                this.userManageStore$.terminate({ userId: user.userId, status: currentStatus });
            },
            reject: () => {
                // Roll back toggle layout state locally
                user.status = !currentStatus;
            }
        });
    }

    // submit(): void {
    //     if (this.userManageForm.invalid) {
    //         this.userManageForm.markAllAsTouched();
    //         return;
    //     }
    //     // const model = this.userManageForm.getRawValue() as any;
    //     let model = this.userManageForm.value as UserInfoEntryModel;

    //     if (!this.userManageStore$.isEdit$()) {
    //         this.userManageStore$.add(model);
    //     } else {
    //         model.userId = this.userManageStore$.selectedValue()?.userId ?? '';
    //         this.userManageStore$.update(model);
    //     }
    // }

    submit(): void {
        if (this.userManageForm.valid) {
            let model = this.userManageForm.value as UserInfoEntryModel;

            if (!this.userManageStore$.isEdit()) {
                this.userManageStore$.add(model);
            } else {
                model.userId = this.userManageStore$.selectedValue()?.userId ?? '';
                this.userManageStore$.update(model);
            }
        } else {
            Object.keys(this.userManageForm.controls).forEach((field) => {
                const control = this.userManageForm.get(field);
                control?.markAsDirty({ onlySelf: true });
            });
        }
    }

    clearSection(): void {
        this.selectedValue = null;
    }

    DialogHide():void{
        if(this.shareService.getUserRole()!='Admin'){
            this.userManageForm.disable();
        }
    }

    onDialogHide(): void {
        this.userManageStore$.reset();
        this.userManageForm.reset();
        this.userManageForm.enable();
        this.clearSection();
    }

    onResetPasswordDialogHide(): void {
        this.userManageStore$.reset();
        this.resetPasswordForm.reset();
    }
}