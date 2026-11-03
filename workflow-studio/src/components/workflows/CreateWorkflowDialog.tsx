import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { TEMPLATES } from '../../domain/templates';
import { Dialog, DialogClose } from '../ui/Dialog';

const schema = z.object({
  name: z.string().trim().min(1, 'Enter a workflow name.').max(80, 'Use 80 characters or fewer.'),
  templateKey: z.string(),
});
type Values = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: Values) => void;
}

export function CreateWorkflowDialog({ open, onOpenChange, onCreate }: Props) {
  const id = useId();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', templateKey: 'blank' },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title="New workflow"
      description="Start from a blank canvas or adapt one of the example processes."
      wide
    >
      <form
        noValidate
        onSubmit={handleSubmit((v) => {
          onCreate(v);
          reset();
        })}
      >
        <label htmlFor={`${id}-name`} className="field-label">
          Workflow name
        </label>
        <input
          id={`${id}-name`}
          className="input"
          autoComplete="off"
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? `${id}-name-error` : undefined}
          {...register('name')}
        />
        {errors.name ? (
          <p id={`${id}-name-error`} className="field-error">
            {errors.name.message}
          </p>
        ) : null}

        <fieldset className="mt-5 border-0 p-0">
          <legend className="field-label">Starting point</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                key: 'blank',
                name: 'Blank workflow',
                description: 'Just a Start and an End step.',
              },
              ...TEMPLATES,
            ].map((t) => (
              <label
                key={t.key}
                className="flex cursor-pointer gap-3 rounded-lg border border-line-strong p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--focus)]"
              >
                <input
                  type="radio"
                  value={t.key}
                  className="mt-1 accent-[var(--accent)]"
                  {...register('templateKey')}
                />
                <span>
                  <span className="block font-semibold">{t.name}</span>
                  <span className="block text-muted">{t.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 flex justify-end gap-2">
          <DialogClose className="btn">Cancel</DialogClose>
          <button type="submit" className="btn btn-primary">
            Create workflow
          </button>
        </div>
      </form>
    </Dialog>
  );
}
