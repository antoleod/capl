import React from 'react';
import { Upload, X } from 'lucide-react';

function formatBytes(bytes: number | undefined) {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

interface UploadBlockProps {
  photoInputRef: React.RefObject<HTMLInputElement>;
  handlePhotos: (files: FileList | null) => void;
  photos: { id: string; file: File; name: string; size: number; url: string; }[];
  removePhoto: (id: string) => void;
}

const UploadBlock: React.FC<UploadBlockProps> = ({ photoInputRef, handlePhotos, photos, removePhoto }) => {
  return (
    <div>
      <button
        onClick={() => photoInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handlePhotos(e.dataTransfer.files);
        }}
        className="group flex w-full flex-col items-center justify-center rounded-3xl border border-dashed border-cyan-300/30 bg-cyan-300/[0.05] p-6 text-center transition hover:border-cyan-300/70 hover:bg-cyan-300/[0.08] active:scale-[0.99]"
      >
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/25">
          <Upload className="h-5 w-5" />
        </div>
        <p className="font-black">Add Photos</p>
        <p className="mt-1 text-xs text-slate-400">Drop images or tap to browse</p>
      </button>
    </div>
  );
};

export default UploadBlock;