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
import { ProductStockSummaryService } from "../services/process/product-stock-summary.service";

export interface ProductStockSummaryState {
    selectedValue: ViProductStockSummaryModel | null;
    isSubmitting: boolean;
    isLoading: boolean;
    error: string | null;
}

const initialState: ProductStockSummaryState = {
    selectedValue: null,
    isSubmitting: false,
    isLoading: false,
    error: null
};

const selectId: SelectEntityId<ViProductStockSummaryModel> = (productStock) => productStock.productId;

export const ProductStockSummaryStore = signalStore(
    { providedIn: 'root' },

    withEntities<ViProductStockSummaryModel>(),
    withState(initialState),

    // Computed selectors
    withComputed((store) => ({
        totalItems: () => store.entities().length,

        // Signal-style selectors (for easy binding)
        error$: () => store.error,
        getAll$: () => store.entities(),
        selectedValue$: store.selectedValue,
    })),

    withMethods(
        (
            store,
            productStockSummaryService = inject(ProductStockSummaryService),
            translateService = inject(TranslateService),
            messageService = inject(MessageService),
        ) => ({
            // READ
            loadAll: rxMethod<void>(
                pipe(
                    tap(() => patchState(store, { isLoading: true, error: null })),
                    switchMap(() =>
                        productStockSummaryService.get().pipe(
                            tap((res) => {
                                const productStockSummaries = res.data as ViProductStockSummaryModel[];
                                patchState(store, setAllEntities(productStockSummaries, { selectId }));
                                patchState(store, { isLoading: false });
                            }),
                            catchError((error) => {
                                console.error('Error loading product stock summaries:', error);
                                patchState(store, {
                                    isLoading: false,
                                    error: 'Failed to load product stock summaries.',
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
