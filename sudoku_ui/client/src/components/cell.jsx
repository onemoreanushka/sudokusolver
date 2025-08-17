export default function Cell({ value, isSelected, onSelect, row, col }) {
  // Determine border thickness for Sudoku 3x3 grids
  const borders = [];

  borders.push("border"); // default thin border

  // Thicker lines at 3x3 boundaries
  if (col === 0) borders.push("border-l-3 border-black");
  if (row === 0) borders.push("border-t-3 border-black");
  if (col === 2 || col === 5) borders.push("border-r-3 border-black");
  if (row === 2 || row === 5) borders.push("border-b-3 border-black");
  if (col === 8) borders.push("border-r-3 border-black");
  if (row === 8) borders.push("border-b-3 border-black");

  return (
    <div
      onClick={onSelect}
      className={`
        flex items-center justify-center w-[70px] h-[70px] text-xl font-bold cursor-pointer select-none
        ${isSelected ? "bg-yellow-200" : "bg-white"}
        ${borders.join(" ")}
      `}
    >
      {value !== 0 ? value : ""}
    </div>
  );
}