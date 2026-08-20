from django.urls import path
from . import views


urlpatterns = [
    path("calendar/", views.calendar_month, name="calendar_month"),
    path("calendar/agenda/", views.calendar_agenda, name="calendar_agenda"),
    path("calendar/add/", views.add_calendar_event, name="calendar_add"),
    path(
        "calendar/update/<int:event_id>/",
        views.update_calendar_event,
        name="calendar_update",
    ),
    path(
        "calendar/delete/<int:event_id>/",
        views.delete_calendar_event,
        name="calendar_delete",
    ),

    path("player-calendar/", views.player_calendar, name="player_calendar"),
    path(
        "player-calendar-agenda/",
        views.player_calendar_agenda,
        name="player_calendar_agenda",
    ),
]
