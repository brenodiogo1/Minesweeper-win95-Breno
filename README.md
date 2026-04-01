## 🎮 Preview

[![Watch the video](https://github.com/user-attachments/assets/901fe50d-85a1-4bcb-af4f-b9bacaaf0105)](https://github.com/user-attachments/assets/6e8819ab-6bab-420e-9f1b-118414a3abfb)

# Minesweeper - Boxture Tech Challenge

Welcome! This is a complete Ruby on Rails implementation of the classic Minesweeper game, built specifically for the Boxture technical challenge.

As requested, this application is built entirely with server-side logic in Ruby, without the use of custom JavaScript, utilizing standard Rails conventions, SQLite for database storage, and Minitest for the test suite.

---

## 🏗️ Architectural Decisions & Answers to the Prompt

### 1. How would you approach this?
My approach relies on traditional Server-Side Rendering (SSR) combined with Rails 7's Hotwire (Turbo) capabilities. This allows the game to feel instantaneous and interactive (like a modern app) while strictly adhering to the "No JavaScript" rule for the game logic. Every click on a cell sends a standard HTTP/Turbo request to the controller, the Ruby service processes the game state, and the server renders the updated HTML for the specific cells changed.

### 2. Which models would you use?
I kept the domain model focused and normalized for SQLite:

1. **`Game`**: Stores the game metadata (`difficulty`, `rows`, `cols`, `mines`, `state` [playing, won, lost], `clicks`, `started_at`, `finished_at`).
2. **`Cell`**: Belongs to `Game`. Stores grid coordinates (`row`, `col`), `is_mine` (boolean), `state` (hidden, revealed, flagged), and `neighbor_mines` (integer).
3. **`Score`**: Stores the high scores at the end of a game (`player_name`, `clicks`, `time_taken`, `total_score`).

### 3. What would you do in each model? (Separation of Concerns)
*   **Models (`Game`, `Cell`, `Score`)**: Strictly responsible for data persistence, associations, and basic validations (e.g., ensuring rows/cols are within valid limits). They *do not* hold complex game logic.
*   **Controllers (`GamesController`)**: Responsible for handling user inputs (clicks), routing requests, tracking time/clicks, and responding with the correct HTML views.
*   **Service Objects (`MinesweeperEngine`)**: The core game logic lives here. I created a dedicated service to handle board initialization, mine placement (ensuring the first click is always safe), neighbor calculation, and the flood fill logic. This keeps the models skinny and the logic easily testable.

### 4. What would you test and how?
Using **Minitest**, the focus is heavily on the `MinesweeperEngine` service, as it's the brain of the app:
*   **Board Generation**: Test if the correct dimensions and exact number of mines are created.
*   **First Click Safety**: Test that clicking `(0,0)` on a new board never results in a mine on `(0,0)`.
*   **Neighbor Calculation**: Manually place mines in a test and verify the adjacent numbers are correct.
*   **Win/Loss Conditions**: Assert that revealing a mine triggers a loss, and revealing all non-mine cells triggers a win.
*   **Flood Fill**: Test that clicking a `0` cell correctly opens all adjacent safe cells and stops at the borders of numbered cells.

### 5. How would you handle the "oil spill" (clicking a cell without adjacent mines)?
The "oil spill" (Flood Fill algorithm) is implemented in the `MinesweeperEngine` using an iterative **Breadth-First Search (BFS)** with an Array as a Queue, rather than recursion. 
Recursion in Ruby can lead to `SystemStackError` (Stack Overflow) on large boards (like Expert or Custom). By using a queue, we safely process cells:
1. Reveal the clicked cell.
2. If it has 0 neighbor mines, find all hidden neighbors and push them to the queue.
3. Shift the first cell from the queue, reveal it, and if it's also a 0, queue its neighbors.
4. Repeat until the queue is empty.

---

## 🚀 Setup & Deploy Instructions

### Prerequisites
*   Ruby 3.x
*   Rails 7.x
*   SQLite3

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd minesweeper-boxture
   ```

2. Install dependencies:
   ```bash
   bundle install
   ```

3. Setup the database:
   ```bash
   rails db:create
   rails db:migrate
   ```

4. Run the test suite (Minitest):
   ```bash
   rails test
   ```

5. Start the Rails server:
   ```bash
   rails server
   ```

Visit `http://localhost:3000` to play the game!
<img width="1846" height="877" alt="image" src="https://github.com/user-attachments/assets/a0a604d2-668c-465d-b004-d97856cb5932" />

