class GamesController < ApplicationController
  def index
    # Renderiza a área de trabalho
  end

  def create
    difficulty = params.dig(:game, :difficulty) || 'beginner'
    game = MinesweeperEngine.create_game!(difficulty)
    
    redirect_to game_path(game, mode: 'reveal')
  end

  def show
    @game = Game.includes(:cells).find(params[:id])
  end

  def play
    @game = Game.find(params[:id])
    row = params[:row].to_i
    col = params[:col].to_i
    action_type = params[:action_type]

    MinesweeperEngine.play!(@game, row, col, action_type)
    
    # Mantém a ferramenta selecionada (Cavadeira ou Bandeira)
    current_mode = action_type == 'unflag' ? 'flag' : (action_type || 'reveal')
    redirect_to game_path(@game, mode: current_mode)
  end
end