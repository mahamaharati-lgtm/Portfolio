import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Dialog, DialogClose } from '../ui/Dialog';

const schema = z.object({
  name: z.string().trim().min(1, 'Enter a workflow name.').max(80, 'Use 80 characters or fewer.'),
});

interface Props {
  open: boolean;
  currentName: string;
  onOpenChange: (open: boolean) => void;
  onRename: (name: string) => void;
}

export function RenameDialog({ open, currentName, onOpenChange, onRename }: Props) {
  const id = useId();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ name: string }>({
    resolver: zodResolver(schema),
    defaultValues: { name: currentName },
  });

  useEffect(() => {
    if (open) reset({ name: currentName });
  }, [open, currentName, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Rename workflow">
      <form noValidate onSubmit={handleSubmit((v) => onRename(v.name.trim()))}>
        <label htmlFor={`${id}-name`} className="field-label">
          Workflow name
        </label>
        <input
          id={`${id}-name`}
          className="input"
          autoComplete="off"
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? `${id}-error` : undefined}
          {...register('name')}
        />
        {errors.name ? (
          <p id={`${id}-error`} className="field-error">
            {errors.name.message}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <DialogClose className="btn">Cancel</DialogClose>
          <button type="submit" className="btn btn-primary">
            Save name
          </button>
        </div>
      </form>
    </Dialog>
  );
}
