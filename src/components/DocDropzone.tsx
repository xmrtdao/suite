import React, { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface DocDropzoneProps {
  onUploadSuccess: (filePath: string, text: string, fileName?: string) => void;
  isUploading?: boolean;
}

export const DocDropzone = ({ onUploadSuccess, isUploading }: DocDropzoneProps) => {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const uploading = Boolean(isUploading) || busy;

  const handleFiles = async (files: File[]) => {
    if (files.length === 0 || uploading) return;
    const file = files[0];

    try {
      setBusy(true);
      // Raw body upload — the relay route /api/upload-temp stores the file in
      // Desktop/xmrtdao/temp and returns extracted text as JSON.
      const response = await fetch('/api/upload-temp', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'X-File-Name': encodeURIComponent(file.name),
        },
        body: file,
      });

      const data = await response.json().catch(() => null);
      if (data && data.success) {
        onUploadSuccess(data.filePath, data.text, data.fileName || file.name);
        toast({ title: 'Document Loaded', description: `${file.name} — ${data.size} bytes` });
      } else {
        throw new Error((data && data.error) || `Upload failed (HTTP ${response.status})`);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload Error', description: error.message });
    } finally {
      setBusy(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => setDragActive(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "relative group cursor-pointer transition-all duration-300 border-2 border-dashed rounded-xl p-8 text-center",
        dragActive
          ? "border-indigo-500 bg-indigo-50/50 scale-[1.02]"
          : "border-border/60 hover:border-indigo-300 bg-card/50"
      )}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <div className={cn(
          "p-4 rounded-full transition-all duration-300",
          dragActive ? "bg-indigo-500 text-white scale-110" : "bg-muted text-muted-foreground group-hover:text-indigo-500"
        )}>
          {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">Drop a document here</p>
          <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT (Max 15MB)</p>
        </div>

        <input
          type="file"
          className="hidden"
          id="doc-upload"
          accept=".pdf,.docx,.txt,.md"
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
        />
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => document.getElementById('doc-upload')?.click()}
          disabled={uploading}
        >
          Select File
        </Button>
      </div>
    </div>
  );
};
