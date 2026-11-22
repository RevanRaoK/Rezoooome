type BrandWordmarkProps = {
  variant?: "full" | "compact";
  className?: string;
};

export function BrandWordmark({ variant = "full", className }: BrandWordmarkProps) {
  if (variant === "compact") {
    return (
      <img
        src="/brand/rezoooo-wordmark-compact.svg"
        alt="rezoooo.me"
        width={166}
        height={16}
        className={className ?? "block h-4 w-auto"}
      />
    );
  }

  return (
    <img
      src="/brand/rezoooo-wordmark.svg"
      alt="rezoooo.me"
      width={243}
      height={24}
      className={className ?? "block h-6 w-auto"}
    />
  );
}
