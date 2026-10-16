// GENERATED from apex-form-renderer/src — do not edit here. Edit there, then run `npm run sync`.
import { Upload } from "lucide-react";

/** A file-upload question, until uploads are built: says so plainly instead of a dead picker. */
export function UploadNotice() {
  return (
    <div className="apx-upload">
      <div className="flex w-full flex-col items-center text-center">
        <Upload className="h-6 w-6 opacity-50" />
        <span className="mt-1.5">File upload isn&apos;t available yet.</span>
        <span className="text-[12px] opacity-70">This screen can&apos;t be submitted until uploads are enabled.</span>
      </div>
    </div>
  );
}
