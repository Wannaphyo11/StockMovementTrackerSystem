import { DatePipe } from '@angular/common';
import { ElementRef, Injectable } from '@angular/core';
import { Nullable } from 'primeng/ts-helpers';
import * as ExcelJS from 'exceljs';
import saveAs from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor(private datePipe: DatePipe) { }

  public async excel(fileName: string, element: Nullable<ElementRef>): Promise<void> {
    return new Promise(async (resolve) => {
      const xlsx = await import('xlsx');
      const worksheet = xlsx.utils.table_to_sheet(element?.nativeElement);
      var range = xlsx.utils.decode_range(worksheet['!ref'] as string);
      for (var C = range.s.r; C <= range.e.c; ++C) {
        var address = xlsx.utils.encode_col(C) + '1'; // <-- first row, column number C
        if (!worksheet[address]) continue;
        worksheet[address].v = worksheet[address].v.toUpperCase();
      }
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, fileName);
      setTimeout(() => {
        resolve();
      }, 500);
    })
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    let EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE
    });
    saveAs(data, fileName + " " + this.datePipe.transform(new Date(), "dd-MMM-yy") + EXCEL_EXTENSION);
  }

  public excel_blob(fileName: string, response: Blob): void {
    let EXCEL_EXTENSION = '.xlsx';
    const a = document.createElement('a');
    const objectUrl = URL.createObjectURL(response);
    a.href = objectUrl;
    a.download = fileName + " " + this.datePipe.transform(new Date(), "dd-MMM-yy") + EXCEL_EXTENSION;
    a.click();
    URL.revokeObjectURL(objectUrl);
  }

  public exportSelectColsWithDynamicHeader(
    data: any[],
    columns: { key: string; value: string }[],
    fileName: string
  ): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(fileName);

    // Step 1: Create headers
    this.createHeaders(worksheet, columns);

    // Step 2: Add data rows
    this.addDataRows(worksheet, data, columns);

    // Step 3: Adjust column widths dynamically based on data length
    worksheet.columns = columns.map((col) => {
      const maxDataLength = data.reduce((max, item) => {
        const cellValue = item[col.key] ? item[col.key].toString() : '';
        return Math.max(max, cellValue.length);
      }, col.value.length);

      return {
        key: col.key,
        width: Math.max(15, maxDataLength + 5), // Ensures minimum width of 15
      };
    });

    // Step 4: Export the Excel file
    workbook.xlsx
      .writeBuffer()
      .then((buffer) => {
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        this.saveAsExcelFile(blob, fileName);
      })
      .catch((error) => {
        console.error('Error generating Excel file:', error);
      });
  }

  private createHeaders(
    worksheet: ExcelJS.Worksheet,
    columns: { key: string; value: string }[]
  ): void {
    const headerRow = worksheet.addRow(columns.map((col) => col.value));

    // Style for headers
    headerRow.font = { bold: true };
  }

  private addDataRows(
    worksheet: ExcelJS.Worksheet,
    data: any[],
    columns: { key: string; value: string }[]
  ): void {
    data.forEach((item, index) => {
      const rowData = columns.map((col) =>
        col.key === 'no' ? index + 1 : item[col.key] ?? ''
      );
      worksheet.addRow(rowData);
    });
  }

}

