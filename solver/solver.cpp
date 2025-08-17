// Sudoku solver for WebAssembly (flat 81-byte board).
// 0 = empty; 1..9 = filled. Solves in-place. Returns 1 on success, 0 on failure.

#include <cstdint>

extern "C" {

// Check whether the current board state is valid (no duplicates in any row/col/box)
static bool isValidBoard(uint8_t *b) {
    // check rows and cols
    for (int i = 0; i < 9; i++) {
        bool row[10] = {false};
        bool col[10] = {false};
        for (int j = 0; j < 9; j++) {
            uint8_t rv = b[i*9 + j];   // row value
            uint8_t cv = b[j*9 + i];   // col value
            if (rv != 0) {
                if (row[rv]) return false;
                row[rv] = true;
            }
            if (cv != 0) {
                if (col[cv]) return false;
                col[cv] = true;
            }
        }
    }

    // check 3x3 boxes
    for (int br = 0; br < 9; br += 3) {
        for (int bc = 0; bc < 9; bc += 3) {
            bool box[10] = {false};
            for (int i = 0; i < 3; i++) {
                for (int j = 0; j < 3; j++) {
                    uint8_t v = b[(br+i)*9 + (bc+j)];
                    if (v != 0) {
                        if (box[v]) return false;
                        box[v] = true;
                    }
                }
            }
        }
    }
    return true;
}

// Helpers
static inline bool isSafe(uint8_t *b, int r, int c, uint8_t v) {
    // row
    for (int j = 0; j < 9; ++j) if (b[r*9 + j] == v) return false;
    // col
    for (int i = 0; i < 9; ++i) if (b[i*9 + c] == v) return false;
    // box
    int sr = (r/3)*3, sc = (c/3)*3;
    for (int i = 0; i < 3; ++i)
        for (int j = 0; j < 3; ++j)
            if (b[(sr+i)*9 + (sc+j)] == v) return false;
    return true;
}

static bool solve(uint8_t *b, int r, int c) {
    if (r == 9) return true;
    int nr = r, nc = c + 1;
    if (nc == 9) { nc = 0; nr = r + 1; }

    uint8_t cur = b[r*9 + c];
    if (cur != 0) return solve(b, nr, nc);

    for (uint8_t v = 1; v <= 9; ++v) {
        if (isSafe(b, r, c, v)) {
            b[r*9 + c] = v;
            if (solve(b, nr, nc)) return true;
            b[r*9 + c] = 0;
        }
    }
    return false;
}

// Exported function: pointer to 81 bytes (uint8), in-place solve.
// Returns 1 if solved, 0 otherwise.
int solveSudoku(uint8_t *board) {
    if (!isValidBoard(board)) return 0; //  early exit if invalid
    return solve(board, 0, 0) ? 1 : 0;
}

} // extern "C"
