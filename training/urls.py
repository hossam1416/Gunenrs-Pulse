from django.urls import path
from . import views

urlpatterns = [
    path("train/", views.coach_training_page, name="training"),
    path("train/", views.coach_training_page, name="coach_training"),

    path("train/add-players/", views.training_modal_page, name="training_modal"),
    path("train/history/", views.training_history_page, name="training_history"),
    path("train/full-drill/", views.training_full_drill_page, name="training_full_drill"),

    path("train/save-session/", views.save_training_session, name="save_training_session"),

    path("player-training/", views.player_training_page, name="player_training"),
]
