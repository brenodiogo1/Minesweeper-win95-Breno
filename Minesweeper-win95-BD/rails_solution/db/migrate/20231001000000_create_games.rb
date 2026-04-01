class CreateGames < ActiveRecord::Migration[7.0]
  def change
    create_table :games do |t|
      t.string :difficulty, null: false, default: 'beginner'
      t.integer :rows, null: false
      t.integer :cols, null: false
      t.integer :mines, null: false
      t.string :state, null: false, default: 'playing' # playing, won, lost
      t.integer :clicks, null: false, default: 0
      t.datetime :started_at
      t.datetime :finished_at

      t.timestamps
    end
  end
end