import { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: number | string;
  icon: ReactNode;
  bgColor: string;
  iconColor: string;
};

export function StatCard({
  title,
  value,
  icon,
  bgColor,
  iconColor,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center">
        <div className={`p-2 rounded-full ${bgColor}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-neutral-medium">{title}</h3>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}
