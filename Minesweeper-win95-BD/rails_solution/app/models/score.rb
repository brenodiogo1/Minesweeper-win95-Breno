class Score < ApplicationRecord
  belongs_to :game

  validates :player_name, presence: true
  validates :time_taken, :clicks, presence: true, numericality: { greater_than_or_equal_to: 0 }
end