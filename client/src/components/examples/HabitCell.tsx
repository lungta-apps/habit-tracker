import { useState } from "react";
import HabitCell from "../HabitCell";

export default function HabitCellExample() {
  const [completed1, setCompleted1] = useState(false);
  const [completed2, setCompleted2] = useState(true);

  return (
    <div className="flex gap-2">
      <div className="w-10 border border-border rounded">
        <HabitCell
          isCompleted={completed1}
          onToggle={() => setCompleted1(!completed1)}
          habitName="Exercise"
          dayNumber={1}
        />
      </div>
      <div className="w-10 border border-border rounded">
        <HabitCell
          isCompleted={completed2}
          onToggle={() => setCompleted2(!completed2)}
          habitName="Reading"
          dayNumber={2}
        />
      </div>
    </div>
  );
}
