import { CheckCircle2Icon } from "lucide-react";

const points = [
  "Sensitive data hidden by Postgres RLS",
  "Sign NDAs with a typed signature",
  "Download documents via expiring signed URLs",
  "Every access written to an audit log",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-8">
      <div className="flex items-start justify-center lg:justify-end">
        <div className="w-full max-w-md animate-fade-up">{children}</div>
      </div>
      <div className="relative hidden overflow-hidden rounded-3xl border bg-gradient-to-br from-brand via-violet-600 to-fuchsia-600 p-10 text-white shadow-2xl shadow-brand/20 lg:block">
        <div className="absolute inset-0 bg-grid opacity-20 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative flex h-full flex-col justify-between gap-12">
          <div>
            <p className="text-sm font-medium tracking-wide text-white/70 uppercase">Vaultmarket</p>
            <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-balance">
              Confidential deals, unlocked by signature — enforced by the database.
            </h2>
          </div>
          <ul className="space-y-4">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-white/90">
                <CheckCircle2Icon className="size-5 shrink-0 text-white" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
