import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, X, Eye } from "lucide-react";
import { readWorkbook, getSheetPreview } from "@/lib/list-processing";
import type * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FileUploadProps {
  label: string;
  description: string;
  onFileLoaded: (wb: XLSX.WorkBook) => void;
  workbook: XLSX.WorkBook | null;
}

export function FileUpload({ label, description, onFileLoaded, workbook }: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[][] | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const wb = await readWorkbook(file);
      setFileName(file.name);
      setPreview(getSheetPreview(wb, 5));
      onFileLoaded(wb);
    } catch {
      setError("Failed to read file. Please upload a valid Excel or CSV file.");
    } finally {
      setLoading(false);
    }
  }, [onFileLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    setFileName(null);
    setPreview(null);
    setError(null);
    onFileLoaded(null as unknown as XLSX.WorkBook);
  }, [onFileLoaded]);

  return (
    <Card className={`transition-all ${workbook ? "border-green-300 bg-green-50/50" : ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{label}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {fileName ? (
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-green-600 shrink-0" />
            <span className="text-sm text-green-700 truncate flex-1">{fileName}</span>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Eye className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Preview: {fileName}</DialogTitle>
                </DialogHeader>
                {preview && (
                  <div className="overflow-x-auto">
                    <table className="text-xs border-collapse w-full">
                      <tbody>
                        {preview.map((row, i) => (
                          <tr key={i} className={i === 0 ? "bg-muted font-semibold" : ""}>
                            {row.map((cell, j) => (
                              <td key={j} className="border px-2 py-1 whitespace-nowrap">
                                {String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleRemove}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <label
            className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">
              {loading ? "Reading file..." : "Drop file or click to browse"}
            </span>
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleInputChange}
              disabled={loading}
            />
          </label>
        )}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </CardContent>
    </Card>
  );
}
