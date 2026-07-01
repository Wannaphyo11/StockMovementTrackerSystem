import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeFormat'
})
export class TimeFormatPipe implements PipeTransform {

  constructor(private datePipe: DatePipe) {

  }

  transform(value: string, format: string): string | null {

    if (value === '' || value === null) return null;

    const date = new Date('2000-01-01T' + value + '.000');
    return this.datePipe.transform(date, format)?.toString() ?? null;
  }

  transformFromDate(value: Date, format: string): string | null {

    if (value === null) return null;

    return this.datePipe.transform(value, format)?.toString() ?? null;
  }

  //
  // Transform Time String to Date()
  //
  transformToDate(value: string): Date {
    // Get today's date
    const today = new Date();

    // Format the time string to match the Date constructor
    const time = new Date(`${today.toDateString()} ${value}`);

    return time;
  }
}
