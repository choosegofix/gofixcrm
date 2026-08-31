export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-[#E3DDD0] bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  action,
  subtitle,
}: {
  title: string;
  action?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#E3DDD0] px-5 py-4">
      <div>
        <h2 className="text-base font-semibold text-[#16233A]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-[#5B6B82]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}
