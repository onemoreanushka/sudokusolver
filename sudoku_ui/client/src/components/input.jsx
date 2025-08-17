export default function Input({ onNumberClick, onClear }) {
  return (
    <div className="mt-40 h-40 grid grid-cols-3 gap-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <button
          key={num}
          onClick={() => onNumberClick(num)}
          className="w-14 h-14 bg-gray-200 rounded hover:bg-gray-300"
        >
          {num}
        </button>
      ))}
    </div>
  );
}
