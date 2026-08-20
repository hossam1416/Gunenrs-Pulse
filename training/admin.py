from django.contrib import admin

from .models import (
    Team,
    Player,
    Coach,
    TrainingSection,
    TrainingDrill,
    PublishedTrainingSession,
)


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "short",
        "number",
        "primary",
        "posGroup",
        "fitness",
        "linked_username",
    )
    search_fields = ("name", "short", "primary", "posGroup", "user__username")
    list_filter = ("posGroup", "primary")
    autocomplete_fields = ("user",)

    @admin.display(description="Linked User")
    def linked_username(self, obj):
        return obj.user.username if obj.user else "Not linked"


@admin.register(Coach)
class CoachAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "role")
    search_fields = ("name", "role")


class TrainingDrillInline(admin.TabularInline):
    model = TrainingDrill
    extra = 0
    fields = (
        "drill_id",
        "name",
        "short_name",
        "focus_label",
        "intensity",
        "duration",
    )


@admin.register(TrainingSection)
class TrainingSectionAdmin(admin.ModelAdmin):
    list_display = ("section_id", "name", "icon")
    search_fields = ("section_id", "name")
    inlines = [TrainingDrillInline]


@admin.register(TrainingDrill)
class TrainingDrillAdmin(admin.ModelAdmin):
    list_display = (
        "drill_id",
        "name",
        "section",
        "intensity",
        "duration",
        "focus_label",
    )
    search_fields = ("drill_id", "name", "short_name", "focus_label")
    list_filter = ("section", "intensity")


@admin.register(PublishedTrainingSession)
class PublishedTrainingSessionAdmin(admin.ModelAdmin):
    list_display = ("name", "published_at")
    readonly_fields = ("published_at",)
