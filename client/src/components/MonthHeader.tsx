import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface MonthHeaderProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export default function MonthHeader({
  currentDate,
  onPreviousMonth,
  onNextMonth,
}: MonthHeaderProps) {
  const monthYear = format(currentDate, "MMMM yyyy");

  return (
    <header className="flex items-center justify-center gap-4 py-8" role="banner">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPreviousMonth}
        aria-label="Previous month"
        data-testid="button-previous-month"
        className="rounded-full"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <h1
        className="text-3xl font-bold tracking-tight min-w-64 text-center"
        data-testid="text-month-year"
        aria-live="polite"
      >
        {monthYear}
      </h1>
      <Button
        variant="ghost"
        size="icon"
        onClick={onNextMonth}
        aria-label="Next month"
        data-testid="button-next-month"
        className="rounded-full"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </header>
  );
}
