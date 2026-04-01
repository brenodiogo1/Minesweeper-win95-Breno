class ScoresController < ApplicationController
  def index
    @scores = Score.includes(:game).order(time_taken: :asc).limit(20)
  end

  def create
    game = Game.find(params[:score][:game_id])
    time_taken = (game.finished_at - game.started_at).to_i

    Score.create!(
      game: game,
      player_name: params[:score][:player_name].presence || "Anonymous",
      time_taken: time_taken,
      clicks: game.clicks
    )

    redirect_to scores_path
  end
end