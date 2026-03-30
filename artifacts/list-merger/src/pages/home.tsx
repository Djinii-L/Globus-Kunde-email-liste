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
  const [list5, setList5] = useState<XLSX.WorkBook | null>(null);
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
        const res = processLists(list1, list2, list3, list4, list5);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred during processing.");
      } finally {
        setProcessing(false);
      }
    }, 50);
  }, [list1, list2, list3, list4, list5]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <ListChecks className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold">List Merger</h1>
            <p className="text-xs text-muted-foreground">
              Upload your lists, merge and compare them, then export to Excel
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section>
          <h2 className="text-sm font-semibold mb-3">Step 1: Upload your lists</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <FileUpload
              label="List 1 - Kunde rapport"
              description="Customer numbers, names, emails, zip codes (Cols A, B, D, O used)"
              onFileLoaded={setList1}
              workbook={list1}
            />
            <FileUpload
              label="List 2 - Biler"
              description="Customer numbers, vehicle models, registration numbers (Cols A, C used)"
              onFileLoaded={setList2}
              workbook={list2}
            />
            <FileUpload
              label="List 3 - Brugtvognslisten"
              description="Sold vehicles with registration number, car model, invoice number (Cols E, F, AF used)"
              onFileLoaded={setList3}
              workbook={list3}
            />
            <FileUpload
              label="List 4 - Debitorkontokort"
              description="Customer info with 'Kunde' headers and invoice numbers (Col D used)"
              onFileLoaded={setList4}
              workbook={list4}
            />
            <FileUpload
              label="List 5 - EV database"
              description="Electric vehicle names for fuzzy matching (50% threshold). Optional."
              onFileLoaded={setList5}
              workbook={list5}
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
            <Tabs defaultValue="listD">
              <TabsList>
                <TabsTrigger value="listD">Final List D (with EV)</TabsTrigger>
                <TabsTrigger value="listC">List C</TabsTrigger>
                <TabsTrigger value="listA">List A</TabsTrigger>
                <TabsTrigger value="listB">List B</TabsTrigger>
              </TabsList>
              <TabsContent value="listD" className="mt-3">
                <ResultsTable
                  title="List D — Final with Electric Vehicle matching"
                  data={result.listD}
                  fileName="list-d-final-ev.xlsx"
                />
              </TabsContent>
              <TabsContent value="listC" className="mt-3">
                <ResultsTable
                  title="List C — All customers with matched car models"
                  data={result.listC}
                  fileName="list-c-combined.xlsx"
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
                  title="List B — Sold Vehicles matched with Debitorkontokort"
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
            <li><strong>List A</strong> — Matches Kunde rapport (Col A) with Biler (Col A). Keeps customer info (Cols A, B, D, O) and registration number (Biler, Col C). Unmatched rows preserved.</li>
            <li><strong>List B</strong> — Matches Brugtvognslisten (Col AF) with Debitorkontokort (Col D). Customer number extracted from "Kunde" header rows.</li>
            <li><strong>List C</strong> — Combines List A and List B by customer number for a complete view.</li>
            <li><strong>List D</strong> — Takes List C and fuzzy matches Column E (Registration Number) against the EV database (50% threshold). Adds an "Electric Vehicle" column.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
