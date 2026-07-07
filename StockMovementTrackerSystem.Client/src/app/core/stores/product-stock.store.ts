import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";
import { ProductStocksModel, StockMovementModel } from "../models/master/stock-movement.model";
import {
    addEntity,
    SelectEntityId,
    setAllEntities,
    updateEntity,
    removeEntity,
    withEntities,
} from "@ngrx/signals/entities";
import { catchError, of, pipe, switchMap, tap } from "rxjs";
import { inject } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { MessageService } from "primeng/api";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { environment } from "../../../environments/environment.staging";
import { ProductStockService } from "../services/master/product-stock.service";

export interface ProductStockState {
    selectedValue: ProductStocksModel | null;
    isSubmitting: boolean;
    isModalVisible: boolean;
    currentEvent: 'CREATE' | 'UPDATE' | 'DELETE' | 'AUDIT_LOG';
    isEdit: boolean;
    isLoading: boolean;
    error: string | null;
}
export const initialState: ProductStockState = {
    selectedValue: null,
    isSubmitting: false,
    isModalVisible: false,
    currentEvent: 'CREATE',
    isEdit: false,
    isLoading: false,
    error: null
};

const selectId: SelectEntityId<ProductStocksModel> = (x) => x.productId;

export const ProductStockStore = signalStore(
    { providedIn: 'root' },
    withEntities<ProductStocksModel>(),
    withState(initialState),

    withComputed((store) => ({
        totalItems: () => store.entities().length,
        error$: () => store.error,
        getAll$: () => store.entities(),
        isModalVisible$: store.isModalVisible,
        selectedValue$: store.selectedValue,
        currentEvent$: store.currentEvent,
    })),

    withMethods(
        (
            store,
            productStockService = inject(ProductStockService),
            translateService = inject(TranslateService),
            messageService = inject(MessageService),
        ) => ({
            //Load all product stocks
            loadAll: rxMethod<void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null, selectedValue: null })),
                    switchMap(() =>
                        productStockService.get().pipe(
                            tap((res) => {
                                const created = res.data as ProductStocksModel[];
                                created.forEach((item) => {
                                    item.menuItems = [
                                        {
                                            label: translateService.instant('EDIT'),
                                            icon: 'pi pi-pen-to-square',
                                            command: () =>
                                                patchState(store, {
                                                    currentEvent: 'UPDATE',
                                                    isModalVisible: true,
                                                    selectedValue: item,
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
                                patchState(store, {
                                    isLoading: false,
                                    error: 'Failed to load Product Stocks.',
                                });
                                return of(null);
                            }),
                        ),
                    ),
                ),
            ),

            //Createdialog
            createDialog: rxMethod<void>(
                pipe(tap(() => patchState(store, { currentEvent: 'CREATE', isModalVisible: true }))),
            ),

            //Add new product stock
            add: rxMethod<ProductStocksModel>(
                pipe(
                    tap(() => patchState(store, { isSubmitting: true, error: null })),
                    switchMap((productStock) =>
                        productStockService.create(productStock).pipe(
                            tap((res) => {
                                const created = res.data as ProductStocksModel;
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
                                console.error('Error adding Product Stock:', error);
                                patchState(store, {
                                    isLoading: false,
                                    isModalVisible: false,
                                    error: 'Failed to add Product Stock.',
                                });
                                return of(null);
                            }),
                        ),
                    ),
                ),
            ),

            // UPDATE DIALOG
            updateDialog: rxMethod<ProductStocksModel>(
                pipe(
                    tap(() => patchState(store, { isEdit: true })),
                    switchMap((productStock) => {
                        if (productStock == null) {
                            patchState(store, { isEdit: false, isModalVisible: false });
                            return of(null);
                        } else {
                            patchState(store, {
                                isEdit: true,
                                isModalVisible: true,
                                selectedValue: productStock,
                            });
                            return of(null);
                        }
                    }),
                ),
            ),

            //Update
            update: rxMethod<ProductStocksModel>(
                pipe(
                    tap(() => patchState(store, { isSubmitting: true, error: null })),
                    switchMap((productStock) =>
                        productStockService.update(productStock.productId, productStock).pipe(
                            tap((res) => {
                                const updated = res.data as ProductStocksModel;
                                patchState(
                                    store,
                                    updateEntity(
                                        {
                                            id: `${updated.productId}`,
                                            changes: { ...updated },
                                        },
                                        { selectId: (s) => s.productId },
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
                        currentEvent: 'CREATE',
                        isLoading: false,
                    }),
                ),
            ),
            // SELECTED VALUE CHANGE
            selectedChange: rxMethod<ProductStocksModel | undefined | null>(
                switchMap((value) => {
                    patchState(store, { selectedValue: value });
                    return of(null);
                }),
            ),
        }),
    ),
);
