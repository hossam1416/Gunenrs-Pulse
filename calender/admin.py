from django.contrib import admin

from .models import CalendarEvent, CalendarTypeConfig


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = (
        "event_id",
        "title",
        "event_type",
        "date",
        "time",
        "venue",
    )

    list_filter = (
        "event_type",
        "date",
    )

    search_fields = (
        "event_id",
        "title",
        "venue",
        "notes",
    )

    ordering = (
        "date",
        "time",
    )
@admin.register(CalendarTypeConfig)
class CalendarTypeConfigAdmin(admin.ModelAdmin):
    list_display = (
        "type_key",
        "label",
        "icon",
        "badge",
        "short",
    )

    search_fields = (
        "type_key",
        "label",
        "badge",
        "short",
    )

    ordering = (
        "type_key",
    )