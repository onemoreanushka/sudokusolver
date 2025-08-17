import { useState, useEffect } from "react";
import Board from "./components/board.jsx";
import Input from "./components/input.jsx";
import initSolver from "./wasm/solver.js";

// fresh empty board each time
const makeEmptyBoard = () => Array.from({ length: 9 }, () => Array(9).fill(0));

export default function App() {
  const [board, setBoard] = useState(makeEmptyBoard());
  const [selectedCell, setSelectedCell] = useState(null); // { row, col }
  const [mod, setMod] = useState(null);
  const [isSolving, setIsSolving] = useState(false);
  const [message, setMessage] = useState("");

  // Load WASM module
  useEffect(() => {
    initSolver().then(setMod).catch((e) => {
      console.error(e);
      setMessage("Failed to load WASM module.");
    });
  }, []);

  // --- keypad handlers ---
  const handleNumberClick = (num) => {
    if (!selectedCell) return;
    setBoard((prev) => {
      const next = prev.map((row) => row.slice());
      next[selectedCell.row][selectedCell.col] = num; // 1..9
      return next;
    });
    setMessage("");
  };

  const handleClear = () => {
    if (!selectedCell) return;
    setBoard((prev) => {
      const next = prev.map((row) => row.slice());
      next[selectedCell.row][selectedCell.col] = 0;
      return next;
    });
  };

  const handleClearBoard = () => {
    setBoard(makeEmptyBoard());
    setSelectedCell(null);
    setMessage("");
  };

  // --- validation before calling WASM (prevents heavy backtracking freeze) ---
  const validateBoard = (b) => {
    const hasDup = (arr) => {
      const seen = new Set();
      for (const v of arr) {
        if (v === 0) continue;
        if (v < 1 || v > 9) return "Only digits 1–9 allowed.";
        if (seen.has(v)) return "Duplicate detected.";
        seen.add(v);
      }
      return null;
    };

    // rows
    for (let r = 0; r < 9; r++) {
      const err = hasDup(b[r]);
      if (err) return `Row ${r + 1}: ${err}`;
    }
    // cols
    for (let c = 0; c < 9; c++) {
      const col = Array.from({ length: 9 }, (_, r) => b[r][c]);
      const err = hasDup(col);
      if (err) return `Column ${c + 1}: ${err}`;
    }
    // boxes
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const box = [];
        for (let i = 0; i < 3; i++)
          for (let j = 0; j < 3; j++)
            box.push(b[br * 3 + i][bc * 3 + j]);
        const err = hasDup(box);
        if (err) return `Box (${br + 1}, ${bc + 1}): ${err}`;
      }
    }
    return null;
  };

  const solveSudoku = () => {
    if (!mod) {
      setMessage("WASM not ready yet.");
      return;
    }

    // quick validation first
    const vErr = validateBoard(board);
    if (vErr) {
      setMessage(`Invalid puzzle: ${vErr}`);
      return;
    }

    setIsSolving(true);
    setMessage("");

    // let UI update before running heavy WASM work
    setTimeout(() => {
      try {
        // Flatten board to 81 bytes (0..9)
        const flat = new Uint8Array(81);
        let k = 0;
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            const v = board[r][c] || 0;
            flat[k++] = v & 0xff;
          }
        }

        const ptr = mod._malloc(flat.length);
        if (!ptr) {
          setMessage("Memory allocation failed.");
          setIsSolving(false);
          return;
        }

        mod.HEAPU8.set(flat, ptr);

        let ok = 0;
        try {
          ok = mod._solveSudoku(ptr); // returns 1 if solved, 0 otherwise
        } catch (e) {
          console.error("Solver crashed:", e);
          mod._free(ptr);
          setMessage("Solver crashed on this puzzle.");
          setIsSolving(false);
          return;
        }

        // copy out before free (avoid referencing freed memory)
        const out = new Uint8Array(mod.HEAPU8.subarray(ptr, ptr + 81));
        mod._free(ptr);

        if (!ok) {
          setMessage("❌ No solution found for this puzzle.");
          setIsSolving(false);
          return;
        }

        // back to 9x9
        const solved = Array.from({ length: 9 }, () => Array(9).fill(0));
        let idx = 0;
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            solved[r][c] = out[idx++];
          }
        }
        setBoard(solved);
      } catch (err) {
        console.error("Unexpected solver error:", err);
        setMessage("Something went wrong while solving.");
      } finally {
        setIsSolving(false);
      }
    }, 0);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <div className="flex flex-col items-center space-y-4 pt-24">
          <h1 className="mb-4 text-4xl font-bold">Sudoku Solver</h1>

          {message && (
            <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded">
              {message}
            </div>
          )}

          <div className="flex gap-10 items-start">
            {/* BOARD */}
            <Board
              board={board}
              selectedCell={selectedCell}
              onSelectCell={setSelectedCell} // expects {row, col}
            />

            {/* KEYPAD + ACTIONS */}
            <div className="w-44">
              <Input onNumberClick={handleNumberClick} onClear={handleClear} />

              <div className="mt-8 space-y-3">
                <button
                  onClick={solveSudoku}
                  disabled={!mod || isSolving}
                  className={`w-full py-2 rounded text-white ${
                    !mod || isSolving
                      ? "bg-green-300 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {isSolving ? "Solving…" : "Solve"}
                </button>

                <button
                  onClick={handleClearBoard}
                  disabled={isSolving}
                  className={`w-full py-2 rounded text-white ${
                    isSolving
                      ? "bg-red-300 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Tip: Click a cell to select, then use the keypad.
          </p>
        </div>
      </div>
    </>
  );
}
