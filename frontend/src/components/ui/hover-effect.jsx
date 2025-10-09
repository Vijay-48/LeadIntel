import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export const HoverEffect = ({
  items,
  className,
}) => {
  let [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 py-10 gap-4",
        className
      )}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          className="relative group block p-2 h-full w-full"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-neutral-200 dark:bg-slate-800/[0.8] block rounded-3xl"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
              />
            )}
          </AnimatePresence>
          <Card>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
            {item.enrichment && (
              <EnrichmentData data={item.enrichment} />
            )}
          </Card>
        </div>
      ))}
    </div>
  );
};

export const Card = ({
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl h-full w-full p-4 overflow-hidden bg-white dark:bg-black border border-transparent dark:border-white/[0.2] group-hover:border-slate-700 relative z-20",
        className
      )}
    >
      <div className="relative z-50">
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export const CardTitle = ({
  className,
  children,
}) => {
  return (
    <h4 className={cn("text-zinc-800 dark:text-zinc-100 font-bold tracking-wide mt-4", className)}>
      {children}
    </h4>
  );
};

export const CardDescription = ({
  className,
  children,
}) => {
  return (
    <p
      className={cn(
        "mt-4 text-zinc-600 dark:text-zinc-400 tracking-wide leading-relaxed text-sm",
        className
      )}
    >
      {children}
    </p>
  );
};

export const EnrichmentData = ({ data }) => {
  return (
    <div className="mt-4 space-y-2 text-xs">
      {data.email && (
        <div className="flex items-center gap-2">
          <span className="font-semibold">📧 Email:</span>
          <span className="text-blue-600">{data.email}</span>
        </div>
      )}
      {data.linkedin && (
        <div className="flex items-center gap-2">
          <span className="font-semibold">💼 LinkedIn:</span>
          <a href={data.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            View Profile
          </a>
        </div>
      )}
      {data.contact_number && (
        <div className="flex items-center gap-2">
          <span className="font-semibold">📞 Phone:</span>
          <span>{data.contact_number}</span>
        </div>
      )}
      {data.prospect_full_name && (
        <div className="flex items-center gap-2">
          <span className="font-semibold">👤 Contact:</span>
          <span>{data.prospect_full_name}</span>
        </div>
      )}
    </div>
  );
};
