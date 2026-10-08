export type LegalSection = { heading: string; body: string[] };

export function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted">Last updated {updated}</p>

      <p className="mt-6 rounded-lg border border-accent bg-soft p-4 text-sm">
        <strong>Draft for legal review.</strong> This page is a working draft and has not yet been
        reviewed by a lawyer. Items in [square brackets] still need to be completed.
      </p>

      <div className="mt-8 space-y-8">
        {sections.map((s, i) => (
          <section key={s.heading}>
            <h2 className="text-lg font-semibold">
              {i + 1}. {s.heading}
            </h2>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-foreground/85">
              {s.body.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
