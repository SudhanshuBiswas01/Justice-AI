"use client";

interface FileUploadPreviewProps {
  fileName: string;
  fileSize: number;
  status: "idle" | "uploading" | "ready" | "error";
  errorMessage: string | null;
  onRemove: () => void;
  metadata?: any;
}

export function FileUploadPreview({
  fileName,
  fileSize,
  status,
  errorMessage,
  onRemove,
  metadata
}: FileUploadPreviewProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isPdf = fileName.toLowerCase().endsWith(".pdf");

  return (
    <div className="p-3.5 mb-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col gap-2 max-w-xl animate-fade-in transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* File Icon */}
          <div className={`p-2.5 rounded-lg shrink-0 ${
            isPdf ? "bg-red-500/10 text-red-400" : "bg-cyan-500/10 text-cyan-400"
          }`}>
            {isPdf ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 3.75 0 11-.75 0 .375 3.75 0 01.75 0z" />
              </svg>
            )}
          </div>

          {/* File Name & Size */}
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate max-w-[280px] sm:max-w-[360px]">
              {fileName}
            </p>
            <p className="text-[10px] text-zinc-400 font-mono">
              {formatSize(fileSize)}
            </p>
          </div>
        </div>

        {/* Action button: Remove or Status indicator */}
        <div className="flex items-center gap-2">
          {status === "uploading" && (
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono font-medium">
              <svg className="animate-spin h-3 w-3 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Extracting...
            </div>
          )}

          {status === "ready" && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Ready
            </div>
          )}

          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-white/5 transition-all"
            title="Remove document"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {status === "error" && errorMessage && (
        <div className="text-[11px] text-rose-400 mt-1 flex items-start gap-1 font-mono border-t border-rose-500/20 pt-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span className="flex-1 leading-snug">{errorMessage}</span>
        </div>
      )}

      {/* Document Categorization Info on Ready */}
      {status === "ready" && metadata && (
        <div className="mt-2 border-t border-white/5 pt-2 flex flex-wrap gap-2 text-[10px] text-zinc-300 font-mono">
          <span className="bg-cyan-500/10 px-2 py-0.5 rounded text-cyan-300 border border-cyan-500/10">
            Category: {metadata.document_category?.replace("_", " ")}
          </span>
          <span className="bg-violet-500/10 px-2 py-0.5 rounded text-violet-300 border border-violet-500/10">
            Type: {metadata.document_type}
          </span>
          {metadata.fine_amount && (
            <span className="bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-300 border border-emerald-500/10">
              Amt: {metadata.fine_amount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
