import Cell from "./cell.jsx";

export default function Board({ board, selectedCell, onSelectCell }) {
  return (
    <div className="grid grid-cols-9 border-2 border-black rounded-md">
      {board.map((row, r) =>
        row.map((value, c) => {
          const isSelected =
            selectedCell?.row === r && selectedCell?.col === c;
          return (
            <Cell
              key={`${r}-${c}`}
              value={value}
              row={r}
              col={c}
              isSelected={isSelected}
              onSelect={() => onSelectCell({ row: r, col: c })}
            />
          );
        })
      )}
    </div>
  );
}
