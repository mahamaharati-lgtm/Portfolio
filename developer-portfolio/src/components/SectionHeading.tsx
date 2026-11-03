import type { ReactNode } from 'react';

export function SectionHeading({
  id,
  index,
  title,
  intro,
}: {
  id: string;
  index: string;
  title: string;
  intro?: ReactNode;
}) {
  return (
    <div className="mb-10 grid gap-3 md:grid-cols-[10rem_1fr] md:gap-8">
      <p className="eyebrow m-0 pt-2" aria-hidden="true">
        {index}
      </p>
      <div>
        <h2 id={id} className="m-0 text-3xl font-semibold sm:text-4xl">
          {title}
        </h2>
        {intro ? <p className="mt-3 mb-0 max-w-2xl text-lg text-muted">{intro}</p> : null}
      </div>
    </div>
  );
}
