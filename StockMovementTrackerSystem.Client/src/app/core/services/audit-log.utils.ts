export function isObject(val: any): boolean {
  return val && typeof val === 'object';
}

export function hasDate(val: any): boolean {
  return val && val['$date'];
}

export function extractDate(dateObj: any): Date | null {
  if (dateObj && dateObj['$date']) return new Date(dateObj['$date']);
  return null;
}

export function getDate(val: any): string {
  return val['$date'];
}

export function hasDecimal(val: any): boolean {
  if (val['$numberDecimal']) return true;
  return !!(val['_v'] && val['_v']['$numberDecimal']);
}

export function getDecimal(val: any): string | number {
  if (val['_v'] && val['_v']['$numberDecimal']) {
    return val['_v']['$numberDecimal'];
  }
  if (val['$numberDecimal']) {
    return val['$numberDecimal'];
  }
  return 0;
}
