import { inject } from "@angular/core";
import { StockMovementModel, ViProductStockSummaryModel } from "../models/master/stock-movement.model";
import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";
import { TranslateService } from "@ngx-translate/core";
import { MessageService } from "primeng/api";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { catchError, of, pipe, switchMap, tap } from "rxjs";
import { setAllEntities, withEntities, addEntity, SelectEntityId, updateEntity } from "@ngrx/signals/entities";
import { environment } from "../../../environments/environment";
import { StockMovementService } from "../services/process/stock-movement.service";

export interface StockMovementState {
    selectedValue: StockMovementModel | null;
    isSubmitting: boolean;
    isModalVisible: boolean;
    currentEvent: 'CREATE' | 'UPDATE' | 'DELETE';
    isEdit: boolean;
    isLoading: boolean;
    error: string | null;
}

const initialState: StockMovementState = {
    selectedValue: null,
    isSubmitting: false,
    isModalVisible: false,
    currentEvent: 'CREATE',
    isEdit: false,
    isLoading: false,
    error: null
};

const selectId: SelectEntityId<StockMovementModel> = (productStock) => productStock.movementId;

export const StockMovementStore = signalStore(
    { providedIn: 'root' },

    withEntities<StockMovementModel>(),
    withState(initialState),

    // Computed selectors
    withComputed((store) => ({
        totalItems: () => store.entities().length,

        // Signal-style selectors (for easy binding)
        error$: () => store.error,
        getAll$: () => store.entities(),
        isModalVisible$: store.isModalVisible,
        selectedValue$: store.selectedValue,
    })),

    withMethods(
        (store,
            stockMovementService = inject(StockMovementService),
            translateService = inject(TranslateService),
            messageService = inject(MessageService),
        ) => ({
            loadAll: rxMethod<void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null, selectedValue: null })),
                    switchMap(() =>
                        stockMovementService.get().pipe(
                            tap((res) => {
                                const created = res.data as StockMovementModel[];
                                created.forEach((item) => {
                                    item.menuItems = [{
                                        label: translateService.instant('Update'),
                                        icon: 'pi pi-pencil',
                                        command: () =>
                                            patchState(store, {
                                                currentEvent: 'UPDATE',
                                                isModalVisible: true,
                                                selectedValue: item
                                            }),
                                    },
                                    {
                                        label: translateService.instant('DELETE'),
                                        icon: 'pi pi-trash',
                                        command: () => {
                                            patchState(store, {
                                                currentEvent: 'DELETE',
                                                selectedValue: item,
                                            });
                                        },
                                    },
                                    ];
                                });
                                patchState(store, setAllEntities(created, { selectId }));
                                patchState(store, { isLoading: false });
                            }),
                            catchError((error) => {
                                console.error('Error loading Stock Movement:', error);
                                patchState(store, {
                                    isLoading: false,
                                    error: 'Failed to load Stock Movement.',
                                });
                                return of(null);
                            }),
                        ),
                    ),
                ),
            ),

            // CREATE DIALOG
            createDialog: rxMethod<void>(
                pipe(tap(() => patchState(store, { currentEvent: 'CREATE', isModalVisible: true }))),
            ),

            // CREATE
            add: rxMethod<StockMovementModel>(
                pipe(
                    tap(() => patchState(store, { isSubmitting: true, error: null })),
                    switchMap((stockMovement) =>
                        stockMovementService.create(stockMovement).pipe(
                            tap((res) => {
                                const created = res.data as StockMovementModel;
                                patchState(store, addEntity(created, { selectId }));
                                patchState(store, { isSubmitting: false, isModalVisible: false });
                                messageService.add({
                                    key: environment.default_toastKey,
                                    severity: 'success',
                                    summary: 'Success',
                                    detail:
                                        translateService.getCurrentLang() == 'en' ? res.message.en : res.message.mm,
                                });
                            }),
                            catchError((error) => {
                                console.error('Error adding Stock Movement:', error);
                                patchState(store, {
                                    isLoading: false,
                                    isModalVisible: false,
                                    error: 'Failed to add Stock Movement.',
                                });
                                return of(null);
                            }),
                        ),
                    ),
                ),
            ),

            // UPDATE DIALOG
            updateDialog: rxMethod<StockMovementModel>(
                pipe(
                    tap(() => patchState(store, { isEdit: true })),
                    switchMap((stockMovement) => {
                        if (stockMovement == null) {
                            patchState(store, { isEdit: false, isModalVisible: false });
                            return of(null);
                        } else {
                            patchState(store, {
                                isEdit: true,
                                isModalVisible: true,
                                selectedValue: stockMovement,
                            });
                            return of(null);
                        }
                    }),
                ),
            ),

            //Update
            update: rxMethod<StockMovementModel>(
                pipe(
                    tap(() => patchState(store, { isSubmitting: true, error: null })),
                    switchMap((stockMovement) =>
                        stockMovementService.update(stockMovement.movementId, stockMovement).pipe(
                            tap((res) => {
                                const updated = res.data as StockMovementModel;
                                patchState(
                                    store,
                                    updateEntity(
                                        {
                                            id: `${updated.movementId}`,
                                            changes: { ...updated },
                                        },
                                        { selectId: (s) => s.movementId },
                                    ),
                                );
                                patchState(store, {
                                    isSubmitting: false,
                                    isEdit: false,
                                    isModalVisible: false,
                                    error: null,
                                });
                                messageService.add({
                                    key: environment.default_toastKey,
                                    severity: 'success',
                                    summary: 'Success',
                                    detail:
                                        translateService.getCurrentLang() == 'en' ? res.message.en : res.message.mm,
                                });
                            }),
                            catchError((error) => {
                                console.error('Error updating Product Stock:', error);
                                patchState(store, {
                                    isEdit: false,
                                    isSubmitting: false,
                                    isModalVisible: false,
                                    error: 'Failed to update Product Stock.',
                                });
                                return of(null);
                            }),
                        ),
                    ),
                ),
            ),

            // RESET
            reset: rxMethod<void>(
                tap(() =>
                    patchState(store, {
                        isSubmitting: false,
                        isModalVisible: false,
                        isEdit: false,
                        isLoading: false,
                    }),
                ),
            ),

            // SELECTED VALUE CHANGE
            selectedChange: rxMethod<StockMovementModel>(
                switchMap((value) => {
                    patchState(store, { selectedValue: value });
                    return of(null);
                }),
            ),

        }),
    ),
);
