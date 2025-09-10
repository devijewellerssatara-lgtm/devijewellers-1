import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

type AcceptObject = Record<string, string[]>;
type AcceptProp = string | string[] | AcceptObject | undefined;

interface FileUploadProps {
  onDrop: (files: File[]) => void;
  accept?: AcceptProp;
  multiple?: boolean;
  maxSize?: number;
  className?: string;
  children?: React.ReactNode;
}

function buildAccept(accept?: AcceptProp): AcceptObject | undefined {
  if (!accept) return undefined;

  // If already an object (react-dropzone format), pass through.
  if (typeof accept === 'object' && !Array.isArray(accept)) {
    return accept as AcceptObject;
  }

  const types = Array.isArray(accept)
    ? accept
    : typeof accept === 'string'
      ? accept.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  if (types.length === 0) return undefined;

  return types.reduce<AcceptObject>((acc, mime) => {
    acc[mime] = [];
    return acc;
  }, {});
}

export function FileUpload({
  onDrop,
  accept,
  multiple = true,
  maxSize = 50 * 1024 * 1024, // 50MB
  className,
  children
}: FileUploadProps) {
  const handleDrop = useCallback((acceptedFiles: File[]) => {
    onDrop(acceptedFiles);
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: buildAccept(accept),
    multiple,
    maxSize
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer",
        isDragActive && "border-purple-500 bg-purple-50",
        className
      )}
    >
      <input {...getInputProps()} />
      {children || (
        <div>
          <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
          <p className="text-lg font-semibold text-gray-700">
            {isDragActive ? "Drop files here..." : "Drop files here or click to upload"}
          </p>
        </div>
      )}
    </div>
  );
}
