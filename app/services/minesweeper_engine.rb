class MinesweeperEngine
  CONFIG = {
    'beginner'     => { rows: 9, cols: 9, mines: 10 },
    'intermediate' => { rows: 16, cols: 16, mines: 40 },
    'expert'       => { rows: 16, cols: 30, mines: 99 }
  }.freeze

  def self.create_game!(difficulty)
    conf = CONFIG[difficulty] || CONFIG['beginner']
    
    game = Game.create!(
      difficulty: difficulty,
      rows: conf[:rows],
      cols: conf[:cols],
      mines: conf[:mines]
    )

    # Inserção em massa das células para otimizar o banco SQLite
    cells_data = []
    game.rows.times do |r|
      game.cols.times do |c|
        cells_data << {
          game_id: game.id,
          row: r,
          col: c,
          state: 'hidden',
          is_mine: false,
          neighbor_mines: 0,
          created_at: Time.current,
          updated_at: Time.current
        }
      end
    end
    Cell.insert_all(cells_data)

    game
  end

  def self.play!(game, row, col, action_type)
    return if game.state != 'playing'

    cell = game.cells.find_by(row: row, col: col)
    return unless cell

    # Incrementa cliques e inicia o tempo no primeiro clique
    game.increment!(:clicks)
    game.update!(started_at: Time.current) if game.clicks == 1

    case action_type
    when 'flag'
      cell.update!(state: 'flagged') if cell.state == 'hidden'
    when 'unflag'
      cell.update!(state: 'hidden') if cell.state == 'flagged'
    when 'reveal'
      return if cell.state == 'flagged' || cell.state == 'revealed'

      if game.clicks == 1
        place_mines!(game, row, col)
        cell.reload # Recarrega a célula após as minas serem plantadas
      end

      reveal_cell!(game, cell)
    end
  end

  private

  def self.place_mines!(game, safe_r, safe_c)
    all_cells = game.cells.to_a
    safe_cell = all_cells.find { |c| c.row == safe_r && c.col == safe_c }
    
    # Sorteia as minas ignorando a célula clicada
    available_cells = all_cells - [safe_cell]
    mine_cells = available_cells.sample(game.mines)
    mine_cells.each { |c| c.is_mine = true }

    # Calcula vizinhos
    all_cells.each do |c|
      next if c.is_mine

      neighbors_count = all_cells.count do |n|
        (n.row - c.row).abs <= 1 && (n.col - c.col).abs <= 1 && n.is_mine
      end
      c.neighbor_mines = neighbors_count
    end

    # Salva o estado inicial do tabuleiro (Transação para velocidade)
    Cell.transaction do
      all_cells.each(&:save!)
    end
  end

  def self.reveal_cell!(game, cell)
    if cell.is_mine
      # Game Over
      cell.update!(state: 'revealed')
      game.update!(state: 'lost', finished_at: Time.current)
      game.cells.where(is_mine: true).update_all(state: 'revealed')
    else
      # Flood Fill BFS (Oil Spill)
      flood_fill!(game, cell)
      check_win!(game)
    end
  end

  def self.flood_fill!(game, start_cell)
    queue = [start_cell]
    cells_matrix = game.cells.index_by { |c| [c.row, c.col] }
    visited = {}

    # Usando Breadth-First Search (BFS) com fila para evitar Stack Overflow
    while queue.any?
      curr = queue.shift
      pos = [curr.row, curr.col]
      
      next if visited[pos]
      visited[pos] = true

      next if curr.state == 'flagged' || curr.is_mine
      curr.update!(state: 'revealed')

      if curr.neighbor_mines == 0
        (-1..1).each do |r_offset|
          (-1..1).each do |c_offset|
            next if r_offset == 0 && c_offset == 0
            
            neighbor = cells_matrix[[curr.row + r_offset, curr.col + c_offset]]
            if neighbor && neighbor.state == 'hidden' && !visited[[neighbor.row, neighbor.col]]
              queue << neighbor
            end
          end
        end
      end
    end
  end

  def self.check_win!(game)
    # Se a quantidade de células que NÃO são minas e que continuam escondidas for 0, o jogador ganhou!
    hidden_safe_cells = game.cells.where(is_mine: false).where.not(state: 'revealed').count
    
    if hidden_safe_cells == 0
      game.update!(state: 'won', finished_at: Time.current)
      game.cells.where(is_mine: true).update_all(state: 'flagged') # Bandeira em todas as minas
    end
  end
end