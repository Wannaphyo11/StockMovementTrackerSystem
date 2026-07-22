import { signalStore, patchState, withComputed, withMethods, withState } from "@ngrx/signals";
import { addEntity, setAllEntities, updateEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { computed, inject } from '@angular/core';
import { catchError, of, pipe, switchMap, tap } from "rxjs";
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { environment } from "../../../environments/environment.prod";
import { UserInfoEntryModel, UserInfoModel } from "../models/usermanage/usermanage.model";
import { UserManageService } from "../services/usermanage/usermanage";

export interface UserManageState {
    selectedValue: UserInfoEntryModel | null;
    isSubmitting: boolean;
    isModalVisible: boolean;
    isResetPasswordVisible: boolean;
    isEdit: boolean;
    isLoading: boolean;
    error: string | null;
    role: string;
}

export const initialState: UserManageState = {
    selectedValue: null,
    isSubmitting: false,
    isModalVisible: false,
    isResetPasswordVisible: false,
    isEdit: false,
    isLoading: false,
    error: null,
    role: 'Admin',
}

const selectId = (user: UserInfoEntryModel) => user.userId;

export const UserManageStore = signalStore(
    { providedIn: 'root' },

    withEntities<UserInfoEntryModel>(),
    withState(initialState),

    withComputed((store) => ({
        totalItems: computed(() => store.entities().length),
        error$: () => store.error,
        getAll$: () => store.entities(),
        isModalVisible$: store.isModalVisible,
        isResetPasswordVisible$: store.isResetPasswordVisible,
        selectedValue$: store.selectedValue,
        role$: store.role,
        isEdit$: store.isEdit,
        isLoading$: store.isLoading,
        isSubmitting$: store.isSubmitting
    })),
    withMethods(
        (
            store,
            userManageService = inject(UserManageService),
            messageService = inject(MessageService),
            translateService = inject(TranslateService),
        ) => ({
            setRole(role: string): void {
                patchState(store, { role });
            },

            loadAll: rxMethod<void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap(() =>
                        userManageService.get(store.role()).pipe(
                            tap((res) => {
                                const userInfo = res.data as UserInfoEntryModel[];
                                patchState(store, setAllEntities(userInfo, { selectId }));
                                patchState(store, { isLoading: false });
                            }),
                            catchError((error) => {
                                console.error('Error loading users:', error);
                                patchState(store, {
                                    isLoading: false,
                                    error: 'Failed to load user records.',
                                });
                                return of(null);
                            }),
                        ),
                    ),
                ),
            ),

            createDialog(): void {
                patchState(store, {
                    selectedValue: null,
                    isEdit: false,
                    isModalVisible: true,
                });
            },

            updateDialog(user: UserInfoEntryModel): void {
                patchState(store, {
                    isEdit: true,
                    isModalVisible: true,
                    selectedValue: user,
                });
            },

            openResetPasswordDialog(user: UserInfoEntryModel): void {
                patchState(store, {
                    selectedValue: user,
                    isResetPasswordVisible: true
                });
            },

            add: rxMethod<UserInfoEntryModel>(
                pipe(
                    tap(() => patchState(store, { isSubmitting: true, error: null })),
                    switchMap((user) =>
                        userManageService.create(user).pipe(
                            tap((res) => {
                                const created = res.data as UserInfoEntryModel;
                                patchState(store, addEntity(created, { selectId }));
                                patchState(store, { isSubmitting: false, isModalVisible: false });
                                messageService.add({
                                    key: environment.default_toastKey,
                                    severity: 'success',
                                    summary: translateService.instant('COMMON.SUCCESS'),
                                    detail: translateService.instant('COMMON.SUCCESSFULLY_CREATED'),
                                });
                            }),
                            catchError((error) => {
                                console.error('Error adding User Info:', error);
                                patchState(store, {
                                    isSubmitting: false,
                                    isLoading: false,
                                    isModalVisible: false,
                                    error: 'Failed to add User Information.',
                                });
                                return of(null);
                            }),
                        ),
                    ),
                ),
            ),

            update: rxMethod<UserInfoModel>(
                pipe(
                    tap(() => patchState(store, { isSubmitting: true, error: null })),
                    switchMap((user) =>
                        userManageService.update(user).pipe(
                            tap((res) => {
                                const updated = res.data as UserInfoModel;
                                patchState(
                                    store,
                                    updateEntity(
                                        {
                                            id: `${updated.userId}`,
                                            changes: { ...updated },
                                        },
                                        { selectId: (s) => s.userId },
                                    ),
                                );

                                patchState(store, {
                                    isSubmitting: false,
                                    isEdit: false,
                                    isModalVisible: false,
                                    selectedValue: null,
                                });

                                messageService.add({
                                    key: environment.default_toastKey,
                                    severity: 'success',
                                    summary: translateService.instant('COMMON.SUCCESS'),
                                    detail: translateService.instant('COMMON.SUCCESSFULLY_UPDATED'),
                                });
                            }),
                            catchError((error) => {
                                console.error('Error adding User Info:', error);
                                patchState(store, {
                                    isLoading: false,
                                    isModalVisible: false,
                                    error: 'Failed to add User Information.',
                                });
                                return of(null);
                            }),
                        ),
                    ),
                ),
            ),

            resetPassword: rxMethod<{
                userName: string,
                password: string
            }>(
                pipe(
                    tap(() => patchState(store, { isSubmitting: true })),
                    switchMap(({ userName, password }) =>
                        userManageService.resetPassword(userName, password).pipe(
                            tap(() => {
                                patchState(store, { isSubmitting: false, isResetPasswordVisible: false, selectedValue: null });
                                messageService.add({
                                    key: environment.default_toastKey,
                                    severity: 'success',
                                    summary: translateService.instant('COMMON.SUCCESS'),
                                    detail: 'Password reset successfully.',
                                });
                            }),
                            catchError((error) => {
                                patchState(store, { isSubmitting: false });
                                showErrorToast(messageService, translateService, 'USER_MANAGE.FAILED_TO_RESET', error);
                                return of(null);
                            })
                        )
                    )
                )
            ),

            terminate: rxMethod<{ userId: string }>(
                pipe(
                    tap(() =>
                        patchState(store, {
                            isSubmitting: true,
                            error: null
                        })
                    ),

                    switchMap(({ userId }) =>
                        userManageService.terminate(userId).pipe(
                            tap(() => {
                                patchState(
                                    store,
                                    updateEntity(
                                        {
                                            id: userId,
                                            changes: {
                                                status: false,
                                                terminateDate: new Date()
                                            }
                                        },
                                        { selectId }
                                    )
                                );

                                patchState(store, {
                                    isSubmitting: false
                                });

                                messageService.add({
                                    key: environment.default_toastKey,
                                    severity: 'success',
                                    summary:
                                        translateService.instant('COMMON.SUCCESS'),
                                    detail:
                                        'User terminated successfully.'
                                });
                            }),

                            catchError((error) => {
                                patchState(store, {
                                    isSubmitting: false,
                                    error: 'Failed to terminate user.'
                                });

                                showErrorToast(
                                    messageService,
                                    translateService,
                                    'USER_MANAGE.FAILED_TO_TERMINATE',
                                    error
                                );

                                return of(null);
                            })
                        )
                    )
                )
            ),

            unterminate: rxMethod<{ userId: string }>(
                pipe(
                    tap(() =>
                        patchState(store, {
                            isSubmitting: true,
                            error: null
                        })
                    ),

                    switchMap(({ userId }) =>
                        userManageService.unTerminate(userId).pipe(
                            tap(() => {
                                patchState(
                                    store,
                                    updateEntity(
                                        {
                                            id: userId,
                                            changes: {
                                                status: true,
                                                terminateDate: null
                                            }
                                        },
                                        { selectId }
                                    )
                                );

                                patchState(store, {
                                    isSubmitting: false
                                });
                                messageService.add({
                                    key: environment.default_toastKey,
                                    severity: 'success',
                                    summary:
                                        translateService.instant('COMMON.SUCCESS'),
                                    detail:
                                        'User activated successfully.'
                                });
                            }),

                            catchError((error) => {
                                patchState(store, {
                                    isSubmitting: false,
                                    error: 'Failed to activate user.'
                                });

                                showErrorToast(
                                    messageService,
                                    translateService,
                                    'USER_MANAGE.FAILED_TO_UNTERMINATE',
                                    error
                                );

                                return of(null);
                            })
                        )
                    )
                )
            ),


            reset(): void {
                patchState(store, {
                    isSubmitting: false,
                    isModalVisible: false,
                    isResetPasswordVisible: false,
                    isEdit: false,
                    isLoading: false,
                    error: null,
                });
            },
        })
    )
);

function showErrorToast(messageService: MessageService, translateService: TranslateService, detailKey: string, error: unknown): void {
    const serverMessage = getServerErrorMessage(error);
    const actionMessage = translateService.instant(detailKey);
    messageService.add({
        key: environment.default_toastKey,
        severity: 'error',
        summary: translateService.instant('COMMON.ERROR'),
        detail: serverMessage ? `${actionMessage} ${serverMessage}` : actionMessage,
    });
}

function getServerErrorMessage(error: unknown): string | null {
    if (!error || typeof error !== 'object' || !('error' in error)) return null;
    const body = (error as { error?: unknown }).error;
    if (!body || typeof body !== 'object') return typeof body === 'string' ? body : null;
    const record = body as Record<string, unknown>;
    if (typeof record['message'] === 'string') return record['message'];
    return null;
}
