import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface DropdownStates {
  enabled: { [id: string]: boolean };
  selected: { [id: string]: any };
}

@Injectable({
  providedIn: 'root'
})
export class DropdownStateService {
  private enabledStates: { [id: string]: boolean } = {};
  private selectedValues: { [id: string]: any } = {};

  private statesSubject = new BehaviorSubject<DropdownStates>({
    enabled: {},
    selected: {},
  });

  dropdownStates$ = this.statesSubject.asObservable();

  // ✅ Enable/disable
  setEnabled(dropdownId: string, enabled: boolean): void {
    this.enabledStates[dropdownId] = enabled;
    this.emitStates();
  }

  getEnabled(dropdownId: string): boolean {
    return this.enabledStates[dropdownId] ?? true;
  }

  // ✅ Selected value
  setSelectedById(dropdownId: string, id: any): void {
    this.selectedValues[dropdownId] = id;
    this.emitStates();
  }

  getSelectedById(dropdownId: string): any {
    return this.selectedValues[dropdownId];
  }

  // 🔁 Emit latest states
  public emitStates(): void {
    console.log('[EmitStates]:', this.selectedValues);
    this.statesSubject.next({
      enabled: { ...this.enabledStates },
      selected: { ...this.selectedValues },
    });
  }
}
