class CreateScores < ActiveRecord::Migration[7.0]
  def change
    create_table :scores do |t|
      t.references :game, null: false, foreign_key: true
      t.string :player_name, null: false
      t.integer :time_taken, null: false
      t.integer :clicks, null: false

      t.timestamps
    end
  end
end