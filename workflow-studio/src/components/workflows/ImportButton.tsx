import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import type { WorkflowFile } from '../../domain/schema';
import { Dialog, DialogClose } from '../ui/Dialog';

const MAX_BYTES = 1_000_000;

export function ImportButton({ onImport }: { onImport: (data: WorkflowFile['workflow']) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      setErrors(['The file is larger than 1 MB, which is too big for a workflow definition.']);
      return;
    }
    setBusy(true);
    try {
      // The validator (zod) is loaded only when someone imports a file.
      const { parseWorkflowFile } = await import('../../domain/schema');
      const result = parseWorkflowFile(await file.text());
      if (result.ok) onImport(result.data);
      else setErrors(result.errors);
    } catch {
      setErrors(['The file could not be read.']);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-busy={busy}
      >
        <Upload size={16} aria-hidden="true" />
        {busy ? 'Importing…' : 'Import JSON'}
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="import-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void handleFile(file);
        }}
      />
      <Dialog
        open={errors !== null}
        onOpenChange={(o) => !o && setErrors(null)}
        title="This file can’t be imported"
        description="Workflow Studio checked the file and found these problems. Nothing was changed."
        role="alertdialog"
      >
        <ul className="m-0 mb-5 list-disc space-y-1 pl-5 text-sm text-danger">
          {errors?.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        <div className="flex justify-end">
          <DialogClose className="btn btn-primary">OK</DialogClose>
        </div>
      </Dialog>
    </>
  );
}
