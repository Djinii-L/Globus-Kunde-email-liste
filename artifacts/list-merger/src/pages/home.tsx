import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/FileUpload";
import { ResultsTable } from "@/components/ResultsTable";
import { processLists, exportAllToExcel, type ProcessedResult } from "@/lib/list-processing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Loader2, ListChecks } from "lucide-react";
import type * as XLSX from "xlsx";

export default function Home() {
  const [list1, setList1] = useState<XLSX.WorkBook | null>(null);
  const [list2, setList2] = useState<XLSX.WorkBook | null>(null);
  const [list3, setList3] = useState<XLSX.WorkBook | null>(null);
  const [list4, setList4] = useState<XLSX.WorkBook | null>(null);
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allUploaded = list1 && list2 && list3 && list4;

  const handleProcess = useCallback(() => {
    if (!list1 || !list2 || !list3 || !list4) return;
    setProcessing(true);
    setError(null);
    setTimeout(() => {
      try {
        const res = processLists(list1, list2, list3, list4);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred during processing.");
      } finally {
        setProcessing(false);
      }
    }, 50);
  }, [list1, list2, list3, list4]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <ListChecks className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold">List Merger</h1>
            <p className="text-xs text-muted-foreground">
              Upload your 4 lists, merge and compare them, then export to Excel
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section>
          <h2 className="text-sm font-semibold mb-3">Step 1: Upload your lists</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FileUpload
              label="List 1 — Customers"
              description="Customer numbers, names, emails, zip codes (Cols A, B, D, O used)"
              onFileLoaded={setList1}
              workbook={list1}
            />
            <FileUpload
              label="List 2 — Vehicles"
              description="Customer numbers, vehicle models, registration numbers (Cols A, C used)"
              onFileLoaded={setList2}
              workbook={list2}
            />
            <FileUpload
              label="List 3 — Sold Vehicles"
              description="Sold vehicles with registration number, car model, invoice number (Cols E, F, AF used)"
              onFileLoaded={setList3}
              workbook={list3}
            />
            <FileUpload
              label="List 4 — e-conomics Export"
              description="Customer info with 'Kunde' headers and invoice numbers (Col D used)"
              onFileLoaded={setList4}
              workbook={list4}
            />
          </div>
        </section>

        <section className="flex flex-col sm:flex-row gap-3 items-start">
          <Button
            onClick={handleProcess}
            disabled={!allUploaded || processing}
            size="lg"
            className="gap-2"
          >
            {processing && <Loader2 className="h-4 w-4 animate-spin" />}
            {processing ? "Processing..." : "Process & Merge Lists"}
          </Button>
          {result && (
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => exportAllToExcel(result, "merged-lists.xlsx")}
            >
              <Download className="h-4 w-4" />
              Download All as Excel
            </Button>
          )}
        </section>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <section>
            <h2 className="text-sm font-semibold mb-3">Step 2: Review Results</h2>
            <Tabs defaultValue="listC">
              <TabsList>
                <TabsTrigger value="listC">Final List (List C)</TabsTrigger>
                <TabsTrigger value="listA">List A</TabsTrigger>
                <TabsTrigger value="listB">List B</TabsTrigger>
              </TabsList>
              <TabsContent value="listC" className="mt-3">
                <ResultsTable
                  title="List C — Final Combined (All customers with matched car models)"
                  data={result.listC}
                  fileName="list-c-final.xlsx"
                />
              </TabsContent>
              <TabsContent value="listA" className="mt-3">
                <ResultsTable
                  title="List A — Customers matched with Vehicles"
                  data={result.listA}
                  fileName="list-a-customers-vehicles.xlsx"
                />
              </TabsContent>
              <TabsContent value="listB" className="mt-3">
                <ResultsTable
                  title="List B — Sold Vehicles matched with e-conomics data"
                  data={result.listB}
                  fileName="list-b-sold-vehicles.xlsx"
                />
              </TabsContent>
            </Tabs>
          </section>
        )}

        <section className="border rounded-lg p-4 bg-muted/30">
          <h3 className="text-sm font-semibold mb-2">How it works</h3>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li><strong>List A</strong> is created by matching List 1 (Col A) with List 2 (Col A). Keeps customer info (Cols A, B, D, O) and registration number (List 2, Col C). Unmatched rows are preserved.</li>
            <li><strong>List B</strong> is created by matching List 3 (Col AF - invoice number) with List 4 (Col D). The customer number is extracted from the "Kunde" header rows in List 4.</li>
            <li><strong>List C</strong> combines List A and List B by customer number, giving you a complete view of customers with their vehicle and invoice information.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
