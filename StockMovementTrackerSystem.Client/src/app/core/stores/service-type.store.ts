// import { ServiceTypeModel, ViServiceTypeModel } from '@core_models/master/service-type.model';
// import {
//   addEntity,
//   removeEntity,
//   SelectEntityId,
//   setAllEntities,
//   updateEntity,
//   withEntities,
// } from '@ngrx/signals/entities';
// import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
// import { inject } from '@angular/core';
// import { TranslateService } from '@ngx-translate/core';
// import { MessageService } from 'primeng/api';
// import { ServiceTypeService } from '@core_services/master/service-type.service';
// import { rxMethod } from '@ngrx/signals/rxjs-interop';
// import { catchError, of, pipe, switchMap, tap } from 'rxjs';
// import { environment } from '@env/environment';

// export interface ServiceTypesState {
//   selectedValue: ServiceTypeModel | null;
//   isSubmitting: boolean;
//   isModalVisible: boolean;
//   isEdit: boolean;
//   isLoading: boolean;
//   error: string | null;
// }

// const initialState: ServiceTypesState = {
//   selectedValue: null,
//   isSubmitting: false,
//   isModalVisible: false,
//   isEdit: false,
//   isLoading: false,
//   error: null,
// };

// const selectId: SelectEntityId<ServiceTypeModel> = (serviceType) => serviceType.serviceTypeId;

// export const ServiceTypeStore = signalStore(
//   { providedIn: 'root' },

//   withEntities<ViServiceTypeModel>(),
//   withState(initialState),

//   // 🧠 Computed selectors
//   withComputed((store) => ({
//     totalItems: () => store.entities().length,

//     // 👇 Signal-style selectors (for easy binding)
//     error$: () => store.error,
//     getAll$: () => store.entities(),
//     isModalVisible$: store.isModalVisible,
//     selectedValue$: store.selectedValue,
//   })),

//   withMethods(
//     (
//       store,
//       serviceTypeService = inject(ServiceTypeService),
//       translateService = inject(TranslateService),
//       messageService = inject(MessageService),
//     ) => ({
//       // READ
//       loadAll: rxMethod<void>(
//         pipe(
//           tap(() => patchState(store, { isLoading: true, error: null })),
//           switchMap(() =>
//             serviceTypeService.get().pipe(
//               tap((res) => {
//                 const serviceType = res.data as ViServiceTypeModel[];
//                 patchState(store, setAllEntities(serviceType, { selectId }));
//                 patchState(store, { isLoading: false });
//               }),
//               catchError((error) => {
//                 console.error('Error loading Service Type:', error);
//                 patchState(store, {
//                   isLoading: false,
//                   error: 'Failed to load Service Type.',
//                 });
//                 return of(null);
//               }),
//             ),
//           ),
//         ),
//       ),

//       // CREATE DIALOG
//       createDialog: rxMethod<void>(
//         pipe(tap(() => patchState(store, { isEdit: false, isModalVisible: true }))),
//       ),

//       // CREATE
//       add: rxMethod<ServiceTypeModel>(
//         pipe(
//           tap(() => patchState(store, { isSubmitting: true, error: null })),
//           switchMap((serviceType) =>
//             serviceTypeService.create(serviceType).pipe(
//               tap((res) => {
//                 const created = res.data as ViServiceTypeModel;
//                 patchState(store, addEntity(created, { selectId }));
//                 patchState(store, { isSubmitting: false, isModalVisible: false });
//                 messageService.add({
//                   key: environment.default_toastKey,
//                   severity: 'success',
//                   summary: 'Success',
//                   detail:
//                     translateService.getCurrentLang() == 'en' ? res.message.en : res.message.mm,
//                 });
//               }),
//               catchError((error) => {
//                 console.error('Error adding service Type:', error);
//                 patchState(store, {
//                   isLoading: false,
//                   isModalVisible: false,
//                   error: 'Failed to add service Type.',
//                 });
//                 return of(null);
//               }),
//             ),
//           ),
//         ),
//       ),

//       // UPDATE DIALOG
//       updateDialog: rxMethod<ServiceTypeModel>(
//         pipe(
//           tap(() => patchState(store, { isEdit: true })),
//           switchMap((serviceType) => {
//             if (serviceType == null) {
//               patchState(store, { isEdit: false, isModalVisible: false });
//               return of(null);
//             } else {
//               patchState(store, { isEdit: true, isModalVisible: true, selectedValue: serviceType });
//               return of(null);
//             }
//           }),
//         ),
//       ),

//       // UPDATE
//       update: rxMethod<ServiceTypeModel>(
//         pipe(
//           tap(() => patchState(store, { isSubmitting: true, error: null })),
//           switchMap((serviceType) =>
//             serviceTypeService.update(serviceType.serviceTypeId, serviceType).pipe(
//               tap((res) => {
//                 const updated = res.data as ViServiceTypeModel;
//                 patchState(
//                   store,
//                   updateEntity(
//                     {
//                       id: `${updated.serviceTypeId}`,
//                       changes: { ...updated },
//                     },
//                     { selectId },
//                   ),
//                 );
//                 patchState(store, {
//                   isSubmitting: false,
//                   isEdit: false,
//                   isModalVisible: false,
//                   error: null,
//                 });
//                 messageService.add({
//                   key: environment.default_toastKey,
//                   severity: 'success',
//                   summary: 'Success',
//                   detail:
//                     translateService.getCurrentLang() == 'en' ? res.message.en : res.message.mm,
//                 });
//               }),
//               catchError((error) => {
//                 console.error('Error updating Unit of Measure:', error);
//                 patchState(store, {
//                   isEdit: false,
//                   isSubmitting: false,
//                   isModalVisible: false,
//                   error: 'Failed to update Unit of Measure.',
//                 });
//                 return of(null);
//               }),
//             ),
//           ),
//         ),
//       ),

//       // DELETE
//       delete: rxMethod<{ serviceTypeId: string }>(
//         pipe(
//           tap((id) => patchState(store, removeEntity(`${id.serviceTypeId}`))),
//           switchMap((serviceType) =>
//             serviceTypeService.delete(serviceType.serviceTypeId).pipe(
//               tap((res) => {
//                 patchState(store, { error: null });
//                 messageService.add({
//                   key: environment.default_toastKey,
//                   severity: 'success',
//                   summary: 'Success',
//                   detail:
//                     translateService.getCurrentLang() == 'en' ? res.message.en : res.message.mm,
//                 });
//               }),
//               catchError((error) => {
//                 console.error('Error deleting Unit of Measure:', error);
//                 patchState(store, { error: 'Failed to delete Unit of Measure.' });
//                 return of(null);
//               }),
//             ),
//           ),
//         ),
//       ),

//       // RESET
//       reset: rxMethod<void>(
//         tap(() =>
//           patchState(store, {
//             isSubmitting: false,
//             isModalVisible: false,
//             isEdit: false,
//             isLoading: false,
//           }),
//         ),
//       ),

//       // SELECTED VALUE CHANGE
//       selectedChange: rxMethod<ViServiceTypeModel>(
//         switchMap((value) => {
//           patchState(store, { selectedValue: value });
//           return of(null);
//         }),
//       ),
//     }),
//   ),
// );
