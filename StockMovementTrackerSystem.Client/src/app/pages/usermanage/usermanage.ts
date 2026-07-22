import { Component, effect, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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
import { UserInfoEntryModel, UserInfoModel } from '../../core/models/usermanage/usermanage.model';
import { UserManageService } from '../../core/services/usermanage/usermanage';
import { ExportService } from '../../shared/services/export.service';
import { SharedService } from '../../shared/services/shared.service';
import { Router } from '@angular/router';
import { AuthGuardService } from '../../shared/services/auth-guard.service';

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
    private readonly sharedService = inject(SharedService);
    private readonly authGuardService = inject(AuthGuardService);

    selectedValue: UserInfoEntryModel | null = null;
    items!: MenuItem[] | undefined;
    terminationSwitchStates: Partial<Record<string, boolean>> = {};

    roles = [
        { label: 'Admin', value: 'Admin' },
        { label: 'Cashier', value: 'Cashier' },
    ];

    get users(): UserInfoEntryModel[] {
        return this.userManageStore$.getAll$();
    }

    get activeUsers(): number {
        return this.users.filter((user) => user.status).length;
    }

    get inactiveUsers(): number {
        return this.users.filter((user) => !user.status).length;
    }

    getInitials(value: string | null | undefined): string {
        return (value || '?')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0))
            .join('')
            .toUpperCase();
    }

    getLastActivity(user: UserInfoEntryModel): string | null {
        return user.updatedOn || user.createdOn || null;
    }

    userManageForm = this.formBuilder.group({
        userName: ['', Validators.required],
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
        password: ['', Validators.required]
    });

    constructor() {
        effect(() => {
            this.selectedValue = this.userManageStore$.selectedValue$();
        });
    }

    ngOnInit(): void {
        this.authGuardService.checkRoleAccess();
        this.loadMenu();
        this.translateService.onLangChange.subscribe(() => this.loadMenu());
        this.userManageStore$.loadAll();
    }

    loadMenu(): void {
        this.items = [
            {
                label: this.translateService.instant('EDIT'),
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
        this.userManageForm.get('password')?.updateValueAndValidity();
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
        const passwordControl = this.userManageForm.controls.password;
        passwordControl.clearValidators();
        passwordControl.setValue(null);
        passwordControl.updateValueAndValidity({ emitEvent: false });

        this.userManageStore$.updateDialog(this.selectedValue);
        this.userManageForm.reset();
        this.userManageForm.controls['userId'].setValue(
            this.selectedValue.userId,
        );
        this.userManageForm.controls['roleName'].setValue(
            this.selectedValue.roleName,
        );
        this.userManageForm.controls.userId.disable();
        this.userManageForm.patchValue(this.selectedValue);
    }

    // Reset Password Dialog
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


    // Reset Password Dialog Confirm
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
                const password = this.resetPasswordForm.get('password')?.value;
                if (userName && password) {
                    this.userManageStore$.resetPassword({ userName, password });
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

    //Terminate User
    onActiveChange(user: any, event: any): void {
        const isTerminated = event.checked;
        const previousStatus = user.status;
        const previousTerminationState = !!user.terminateDate;
        // const previousTerminationState =
        //     user.terminateDate ? true : false;

        this.terminationSwitchStates[user.userId] = isTerminated;

        if (isTerminated) {
            this.confirmationService.confirm({
                message: 'Are you sure you want to terminate this user?',
                header: 'Terminate Confirmation',
                icon: 'pi pi-info-circle',

                accept: () => {
                    this.userManageStore$.terminate({
                        userId: user.userId
                    });

                    this.terminationSwitchStates[user.userId] = true;
                },

                reject: () => {
                    user.status = previousStatus;
                    this.terminationSwitchStates[user.userId] = previousTerminationState;
                }
            });
        } else {
            this.confirmationService.confirm({
                message: 'Are you sure you want to activate this user again?',
                header: 'Activate Confirmation',
                icon: 'pi pi-info-circle',

                accept: () => {
                    this.userManageStore$.unterminate({
                        userId: user.userId
                    });

                    this.terminationSwitchStates[user.userId] = false;
                },

                reject: () => {
                    user.status = previousStatus;
                    this.terminationSwitchStates[user.userId] = previousTerminationState;
                }
            });
        }
    }

    submit(): void {
        if (this.userManageForm.invalid) {
            Object.keys(this.userManageForm.controls).forEach((field) => {
                const control = this.userManageForm.get(field);
                control?.markAsDirty({ onlySelf: true });
            });
            return;
        }

        const formValue = this.userManageForm.getRawValue();

        if (!this.userManageStore$.isEdit()) {
            this.userManageStore$.add(formValue as UserInfoEntryModel);
            return;
        }

        const { password: _password, ...updateValue } = formValue;
        const model: UserInfoModel = {
            ...updateValue,
            userId: this.userManageStore$.selectedValue()?.userId ?? '',
            password: '',
        } as UserInfoModel;

        this.userManageStore$.update(model);
    }

    clearSection(): void {
        this.selectedValue = null;
    }

    DialogHide(): void {
        if (this.sharedService.getUserRole() != 'Admin') {
            this.userManageForm.disable();
        }
    }

    onDialogHide(): void {
        this.userManageStore$.reset();
        this.userManageForm.controls.password.clearValidators();
        this.userManageForm.controls.password.updateValueAndValidity({ emitEvent: false });
        this.userManageForm.reset();
        this.userManageForm.enable();
        this.clearSection();
    }

    onResetPasswordDialogHide(): void {
        this.userManageStore$.reset();
        this.resetPasswordForm.reset();
    }
}
