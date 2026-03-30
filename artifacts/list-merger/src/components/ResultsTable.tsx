import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { exportToExcel, type ListRow } from "@/lib/list-processing";

interface ResultsTableProps {
  title: string;
  data: ListRow[];
  fileName: string;
}

export function ResultsTable({ title, data, fileName }: ResultsTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data to display.</p>
        </CardContent>
      </Card>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">{data.length} rows</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToExcel(data, fileName)}
          className="gap-1"
        >
          <Download className="h-3 w-3" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto rounded border">
          <table className="text-xs w-full border-collapse">
            <thead className="sticky top-0 bg-muted z-10">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="text-left px-3 py-2 font-semibold border-b whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 100).map((row, i) => (
                <tr key={i} className="hover:bg-muted/50">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-1.5 border-b whitespace-nowrap">
                      {String(row[col] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
              {data.length > 100 && (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-2 text-center text-muted-foreground">
                    Showing first 100 of {data.length} rows. Export to see all data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
