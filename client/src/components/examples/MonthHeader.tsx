import MonthHeader from "../MonthHeader";

export default function MonthHeaderExample() {
  return (
    <MonthHeader
      currentDate={new Date()}
      onPreviousMonth={() => console.log("Previous month clicked")}
      onNextMonth={() => console.log("Next month clicked")}
    />
  );
}
