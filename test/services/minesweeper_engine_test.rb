# rails_solution/test/services/minesweeper_engine_test.rb

require 'test_helper'

class MinesweeperEngineTest < ActiveSupport::TestCase
  def setup
    @game = Game.create!(difficulty: 'beginner', rows: 9, cols: 9, mines: 10, state: 'playing')
    @engine = MinesweeperEngine.new(@game)
  end

  test "initializes board with correct dimensions and mine count" do
    @engine.initialize_board(0, 0)
    
    assert_equal 81, @game.cells.count
    assert_equal 10, @game.cells.where(is_mine: true).count
  end

  test "first click is never a mine" do
    10.times do
      game = Game.create!(difficulty: 'beginner', rows: 5, cols: 5, mines: 24, state: 'playing')
      engine = MinesweeperEngine.new(game)
      
      # Since there are 24 mines on a 25 cell board, only 1 safe cell exists.
      engine.initialize_board(2, 2)
      
      first_cell = game.cells.find_by(row: 2, col: 2)
      assert_not first_cell.is_mine
    end
  end

  test "flood fill opens correct neighbors" do
    @engine.initialize_board(4, 4)
    # Removing all mines to simulate a full flood fill
    @game.cells.update_all(is_mine: false, neighbor_mines: 0)
    
    # Place one mine in the corner
    @game.cells.find_by(row: 0, col: 0).update(is_mine: true)
    
    # Trigger flood fill on opposite corner
    @engine.reveal_cell(8, 8)
    
    revealed_count = @game.cells.where(state: 'revealed').count
    assert revealed_count > 1, "Flood fill should reveal multiple cells"
    
    mine_cell = @game.cells.find_by(row: 0, col: 0)
    assert_equal 'hidden', mine_cell.state, "Mine should remain hidden"
  end

  test "hitting a mine loses the game" do
    @engine.initialize_board(0, 0)
    mine_cell = @game.cells.where(is_mine: true).first
    
    @engine.reveal_cell(mine_cell.row, mine_cell.col)
    
    @game.reload
    assert_equal 'lost', @game.state
    assert_equal 'revealed', mine_cell.reload.state
  end
end