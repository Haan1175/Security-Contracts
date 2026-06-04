import { useRef, useState } from "react";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";

interface ImportResult {
  imported: number;
  errors: { row: number; error: string }[];
}

interface Props {
  label: string;
  onImport: (file: File) => Promise<ImportResult>;
  onSuccess: () => void;
}

export default function CsvImportButton({ label, onImport, onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!inputRef.current) return;
    inputRef.current.value = "";
    if (!file) return;

    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await onImport(file);
      setResult(res);
      if (res.imported > 0) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setResult(null);
    setError(null);
  }

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        title={`Import ${label} from CSV`}
      >
        <Upload size={15} />
        {loading ? "Importing…" : "Import CSV"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFile}
      />

      {(result || error) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Import Results</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {result && (
              <>
                <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-4 text-sm">
                  <CheckCircle size={16} className="shrink-0" />
                  {result.imported} {label.toLowerCase()} imported successfully
                </div>

                {result.errors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} skipped:
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {result.errors.map((e, i) => (
                        <div key={i} className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                          Row {e.row}: {e.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              onClick={closeModal}
              className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
