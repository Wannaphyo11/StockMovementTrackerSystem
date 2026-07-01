import { inject } from "@angular/core";
import { ProductStockModel, ViProductStockSummaryModel } from "../models/master/stock-movement.model";
import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";
import { ProductStockService } from "../services/master/product-stock.service";
import { TranslateService } from "@ngx-translate/core";
import { MessageService } from "primeng/api";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { catchError, of, pipe, switchMap, tap } from "rxjs";
import { setAllEntities, withEntities, addEntity, SelectEntityId } from "@ngrx/signals/entities";
import { environment } from "../../../environments/environment";

export interface ProductStockState {
    selectedValue: ViProductStockSummaryModel | null;
    isSubmitting: boolean;
    isModalVisible: boolean;
    isEdit: boolean;
    isLoading: boolean;
    error: string | null;
}

const initialState: ProductStockState = {
    selectedValue: null,
    isSubmitting: false,
    isModalVisible: false,
    isEdit: false,
    isLoading: false,
    error: null
};

const selectId: SelectEntityId<ViProductStockSummaryModel> = (productStock) => productStock.movementId;

export const ProductStockStore = signalStore(
    { providedIn: 'root' },

    withEntities<ViProductStockSummaryModel>(),
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
            productStockService = inject(ProductStockService),
            translateService = inject(TranslateService),
            messageService = inject(MessageService),
        ) => ({
            loadAll: rxMethod<void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap(() =>
                        productStockService.get().pipe(
                            tap((res) => {
                                const productStock = res.data as ViProductStockSummaryModel[];
                                patchState(store, setAllEntities(productStock, { selectId }));
                                patchState(store, { isLoading: false });
                            }),
                            catchError((error) => {
                                console.error('Error loading Service Type:', error);
                                patchState(store, {
                                    isLoading: false,
                                    error: 'Failed to load Service Type.',
                                });
                                return of(null);
                            }),
                        ),
                    ),
                ),
            ),

            // CREATE DIALOG
            createDialog: rxMethod<void>(
                pipe(tap(() => patchState(store, { isEdit: false, isModalVisible: true }))),
            ),

            // CREATE
            add: rxMethod<ProductStockModel>(
                pipe(
                    tap(() => patchState(store, { isSubmitting: true, error: null })),
                    switchMap((productStock) =>
                        productStockService.create(productStock).pipe(
                            tap((res) => {
                                const created = res.data.currentViewData as ViProductStockSummaryModel;
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
                                console.error('Error adding service Type:', error);
                                patchState(store, {
                                    isLoading: false,
                                    isModalVisible: false,
                                    error: 'Failed to add service Type.',
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
            selectedChange: rxMethod<ViProductStockSummaryModel>(
                switchMap((value) => {
                    patchState(store, { selectedValue: value });
                    return of(null);
                }),
            ),

        }),
    ),
);
