import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MenuItem } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class BreadCrumbStateService {
  private menuItemsSubject = new BehaviorSubject<MenuItem[]>([]);
  menuItems$ = this.menuItemsSubject.asObservable();

  setMenuItems(items: MenuItem[]) {
    this.menuItemsSubject.next(items);
  }

  clearMenuItems() {
    this.menuItemsSubject.next([]);
  }
}

