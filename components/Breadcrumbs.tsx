import Link from "next/link";
import { ChevronRight } from "lucide-react";

type BreadcrumbItem = { label: string; href: string; current?: boolean };

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-3 h-3 text-zinc-700" />}
          {item.current ? (
            <span aria-current="page" className="text-emerald-400">
              {item.label}
            </span>
          ) : (
            <Link href={item.href} className="hover:text-zinc-300 transition-colors">
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}