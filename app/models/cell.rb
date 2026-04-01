class Cell < ApplicationRecord
  belongs_to :game

  validates :row, :col, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :state, presence: true, inclusion: { in: %w[hidden revealed flagged] }
  validates :neighbor_mines, numericality: { greater_than_or_equal_to: 0 }
end