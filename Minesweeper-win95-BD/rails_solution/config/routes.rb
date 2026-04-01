Rails.application.routes.draw do
  root "games#index"

  resources :games, only: [:index, :create, :show] do
    member do
      post :play
    end
  end

  resources :scores, only: [:index, :create]
end