class CreateCells < ActiveRecord::Migration[7.0]
  def change
    create_table :cells do |t|
      t.references :game, null: false, foreign_key: true
      t.integer :row, null: false
      t.integer :col, null: false
      t.boolean :is_mine, null: false, default: false
      t.string :state, null: false, default: 'hidden' # hidden, revealed, flagged
      t.integer :neighbor_mines, null: false, default: 0

      t.timestamps
    end
    
    add_index :cells, [:game_id, :row, :col], unique: true
  end
end