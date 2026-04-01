class Game < ApplicationRecord
  has_many :cells, dependent: :destroy
  has_one :score, dependent: :destroy

  validates :difficulty, presence: true, inclusion: { in: %w[beginner intermediate expert] }
  validates :rows, :cols, :mines, presence: true, numericality: { greater_than: 0 }
  validates :state, presence: true, inclusion: { in: %w[playing won lost] }
end