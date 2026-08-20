import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { UploadCloud, FileText, X, Paperclip, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface FileDropzoneProps {
    file: File | null;
    onFileSelect: (file: File | null) => void;
    displayName?: string;
    onDisplayNameChange?: (val: string) => void;
    accept?: string;
    maxSizeMB?: number;
    label?: string;
    description?: string;
}

export default function FileDropzone({
    file,
    onFileSelect,
    displayName = '',
    onDisplayNameChange,
    accept = 'image/*,.pdf',
    maxSizeMB = 10,
    label = 'Attachment / Loan Agreement (Optional)',
    description = 'Drag & drop image or PDF here, or click to browse',
}: FileDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const selectedFile = e.dataTransfer.files[0];
            onFileSelect(selectedFile);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const isImage = file && file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : null;

    return (
        <div className="space-y-3 w-full">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Paperclip className="size-4 text-indigo-600 dark:text-indigo-400" />
                    {label}
                </Label>
                {file && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" />
                        File Selected
                    </span>
                )}
            </div>

            <input
                type="file"
                ref={inputRef}
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
            />

            {!file ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-5 transition-all duration-200 text-center flex flex-col items-center justify-center gap-2 ${
                        isDragging
                            ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
                            : 'border-sidebar-border hover:border-indigo-500/50 hover:bg-muted/30 bg-background/50'
                    }`}
                >
                    <div className="size-11 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                        <UploadCloud className="size-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            {description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Supports JPG, PNG, WEBP, PDF (Max {maxSizeMB}MB)
                        </p>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-sidebar-border bg-card p-3 shadow-sm space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="size-12 rounded-lg object-cover border border-border shrink-0"
                                />
                            ) : (
                                <div className="size-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 border border-border">
                                    <FileText className="size-6" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">{file.name}</p>
                                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                                    {formatFileSize(file.size)} • {file.type || 'Document'}
                                </p>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                onFileSelect(null);
                                if (onDisplayNameChange) onDisplayNameChange('');
                                if (inputRef.current) inputRef.current.value = '';
                            }}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 rounded-full"
                        >
                            <X className="size-4" />
                        </Button>
                    </div>

                    {onDisplayNameChange && (
                        <div className="pt-2 border-t space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">Attachment Display Title (Optional)</Label>
                            <Input
                                placeholder="e.g. Loan Agreement signed PDF"
                                value={displayName}
                                onChange={(e) => onDisplayNameChange(e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
