import { useState } from "react";
import HabitNameInput from "../HabitNameInput";

export default function HabitNameInputExample() {
  const [value, setValue] = useState("Morning Exercise");

  return (
    <div className="w-48 border border-border rounded">
      <HabitNameInput
        value={value}
        onChange={setValue}
        onDelete={() => console.log("Delete clicked")}
      />
    </div>
  );
}
