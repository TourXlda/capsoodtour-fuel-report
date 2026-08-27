"use client";

import { StatCard, StatCardProps } from "./StatCard";

interface StatsGridProps {
  items: StatCardProps[];
}

export function StatsGrid({ items }: StatsGridProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 gap-3.5 sm:gap-4 md:gap-5 w-full">
      {items.map((item, index) => (
        <div key={index} className="col-span-1">
          <StatCard {...item} />
        </div>
      ))}
    </section>
  );
}
