import * as XLSX from "xlsx";

export interface ListRow {
  [key: string]: string | number | undefined;
}

export interface ProcessedResult {
  listA: ListRow[];
  listB: ListRow[];
  listC: ListRow[];
}

function getColumnValue(row: ListRow, colIndex: number): string {
  const colLetter = XLSX.utils.encode_col(colIndex);
  const val = row[colLetter] ?? row[colIndex] ?? Object.values(row)[colIndex];
  return val !== undefined && val !== null ? String(val).trim() : "";
}

function parseSheet(workbook: XLSX.WorkBook, sheetIndex: number = 0): ListRow[] {
  const sheetName = workbook.SheetNames[sheetIndex];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<ListRow>(sheet, { header: "A", defval: "" });
}

function parseSheetRaw(workbook: XLSX.WorkBook, sheetIndex: number = 0): string[][] {
  const sheetName = workbook.SheetNames[sheetIndex];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
}

export function processLists(
  list1Wb: XLSX.WorkBook,
  list2Wb: XLSX.WorkBook,
  list3Wb: XLSX.WorkBook,
  list4Wb: XLSX.WorkBook
): ProcessedResult {
  const list1 = parseSheet(list1Wb);
  const list2 = parseSheet(list2Wb);
  const list3 = parseSheet(list3Wb);
  const list4Raw = parseSheetRaw(list4Wb);

  const headerRow1 = list1[0];
  const headerRow2 = list2[0];
  const headerRow3 = list3[0];

  const dataList1 = list1.slice(1);
  const dataList2 = list2.slice(1);
  const dataList3 = list3.slice(1);

  const list2Map = new Map<string, ListRow[]>();
  for (const row of dataList2) {
    const custNum = String(row["A"] ?? "").trim();
    if (custNum) {
      if (!list2Map.has(custNum)) list2Map.set(custNum, []);
      list2Map.get(custNum)!.push(row);
    }
  }

  const listA: ListRow[] = [];
  for (const row of dataList1) {
    const custNum = String(row["A"] ?? "").trim();
    const name = String(row["B"] ?? "").trim();
    const zipCode = String(row["D"] ?? "").trim();
    const colO = String(row["O"] ?? "").trim();

    const matchedVehicles = list2Map.get(custNum);
    if (matchedVehicles && matchedVehicles.length > 0) {
      for (const vRow of matchedVehicles) {
        listA.push({
          "Customer Number": custNum,
          "Name": name,
          "Zip Code": zipCode,
          "Column O": colO,
          "Registration Number": String(vRow["C"] ?? "").trim(),
          "Matched": "Yes",
        });
      }
    } else {
      listA.push({
        "Customer Number": custNum,
        "Name": name,
        "Zip Code": zipCode,
        "Column O": colO,
        "Registration Number": "",
        "Matched": "No",
      });
    }
  }

  const kundeMap = new Map<string, string>();
  let currentKundeNumber = "";
  for (let i = 0; i < list4Raw.length; i++) {
    const rawRow = list4Raw[i];
    const firstCell = String(rawRow[0] ?? "").trim();

    const kundeMatch = firstCell.match(/^Kunde\s+(\d+)/i);
    if (kundeMatch) {
      currentKundeNumber = kundeMatch[1];
      continue;
    }

    if (currentKundeNumber && rawRow.length > 3) {
      const colD = String(rawRow[3] ?? "").trim();
      if (colD) {
        kundeMap.set(colD, currentKundeNumber);
      }
    }
  }

  const listB: ListRow[] = [];
  for (const row of dataList3) {
    const colAF = String(row["AF"] ?? "").trim();
    const colE = String(row["E"] ?? "").trim();
    const colF = String(row["F"] ?? "").trim();

    if (colAF && kundeMap.has(colAF)) {
      const customerNumber = kundeMap.get(colAF)!;
      listB.push({
        "Invoice Number": colAF,
        "Car Model (List 3 Col E)": colE,
        "Vehicle Info (List 3 Col F)": colF,
        "Customer Number": customerNumber,
      });
    }
  }

  const listBCustMap = new Map<string, ListRow[]>();
  for (const row of listB) {
    const cn = String(row["Customer Number"] ?? "").trim();
    if (cn) {
      if (!listBCustMap.has(cn)) listBCustMap.set(cn, []);
      listBCustMap.get(cn)!.push(row);
    }
  }

  const listC: ListRow[] = [];
  for (const rowA of listA) {
    const custNum = String(rowA["Customer Number"] ?? "").trim();
    const matchedB = listBCustMap.get(custNum);

    if (matchedB && matchedB.length > 0) {
      for (const rowB of matchedB) {
        listC.push({
          "Customer Number": rowA["Customer Number"],
          "Name": rowA["Name"],
          "Zip Code": rowA["Zip Code"],
          "Column O": rowA["Column O"],
          "Registration Number": rowA["Registration Number"],
          "Car Model": rowB["Car Model (List 3 Col E)"],
          "Vehicle Info": rowB["Vehicle Info (List 3 Col F)"],
          "Invoice Number": rowB["Invoice Number"],
        });
      }
    } else {
      listC.push({
        "Customer Number": rowA["Customer Number"],
        "Name": rowA["Name"],
        "Zip Code": rowA["Zip Code"],
        "Column O": rowA["Column O"],
        "Registration Number": rowA["Registration Number"],
        "Car Model": "",
        "Vehicle Info": "",
        "Invoice Number": "",
      });
    }
  }

  return { listA, listB, listC };
}

export function exportToExcel(data: ListRow[], fileName: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Results");
  XLSX.writeFile(wb, fileName);
}

export function exportAllToExcel(result: ProcessedResult, fileName: string) {
  const wb = XLSX.utils.book_new();

  const wsA = XLSX.utils.json_to_sheet(result.listA);
  XLSX.utils.book_append_sheet(wb, wsA, "List A - Customers & Vehicles");

  const wsB = XLSX.utils.json_to_sheet(result.listB);
  XLSX.utils.book_append_sheet(wb, wsB, "List B - Sold Vehicles");

  const wsC = XLSX.utils.json_to_sheet(result.listC);
  XLSX.utils.book_append_sheet(wb, wsC, "List C - Final Combined");

  XLSX.writeFile(wb, fileName);
}

export function readWorkbook(file: File): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        resolve(wb);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export function getSheetPreview(wb: XLSX.WorkBook, maxRows: number = 5): string[][] {
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return [];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  return rows.slice(0, maxRows + 1);
}
