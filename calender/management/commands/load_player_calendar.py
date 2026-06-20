import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from calender.models import CalendarEvent, CalendarTypeConfig


class Command(BaseCommand):
    help = "Load player calendar data from static/data/player_calendar.json"

    def handle(self, *args, **options):
        file_path = (
            Path(settings.BASE_DIR)
            / "static"
            / "data"
            / "player_calendar.json"
        )

        if not file_path.exists():
            self.stderr.write(
                self.style.ERROR(f"File not found: {file_path}")
            )
            return

        with open(file_path, "r", encoding="utf-8") as file:
            data = json.load(file)

        type_config = data.get("typeConfig", {})
        events = data.get("events", [])

        if not isinstance(type_config, dict):
            self.stderr.write(
                self.style.ERROR("typeConfig must be an object in JSON.")
            )
            return

        if not isinstance(events, list):
            self.stderr.write(
                self.style.ERROR("events must be a list in JSON.")
            )
            return

        type_count = 0

        for type_key, config in type_config.items():
            CalendarTypeConfig.objects.update_or_create(
                type_key=type_key,
                defaults={
                    "label": config.get("label", ""),
                    "icon": config.get("icon", ""),
                    "badge": config.get("badge", ""),
                    "short": config.get("short", ""),
                },
            )

            type_count += 1

        event_count = 0

        for item in events:
            event_id = item.get("id")

            if not event_id:
                self.stderr.write(
                    self.style.WARNING(
                        f"Skipped event without id: {item}"
                    )
                )
                continue

            CalendarEvent.objects.update_or_create(
                event_id=event_id,
                defaults={
                    "title": item.get("title", ""),
                    "event_type": item.get("type", "training"),
                    "date": item.get("date"),
                    "time": item.get("time"),
                    "venue": item.get("venue", ""),
                    "notes": item.get("notes", ""),
                },
            )

            event_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Calendar loaded successfully. "
                f"Types: {type_count}, Events: {event_count}"
            )
        )