export function TicketHeader({
  kind,
  number,
  title,
  meta,
  status,
  action,
}: {
  kind: string;
  number: string;
  title: string;
  meta?: React.ReactNode;
  status?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative rounded-xl border border-[#E3DDD0] bg-white shadow-sm">
      <div className="flex items-start justify-between px-5 pt-4 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5B6B82]">
            {kind}
          </p>
          <p className="tabular-nums mt-1 font-mono text-3xl font-semibold tracking-tight text-[#16233A]">
            {number}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {status}
          {action}
        </div>
      </div>
      <div className="ticket-perforation" />
      <div className="px-5 pt-4 pb-5">
        <h1 className="text-lg font-semibold text-[#16233A]">{title}</h1>
        {meta && <p className="mt-1 text-sm text-[#5B6B82]">{meta}</p>}
      </div>
    </div>
  );
}
