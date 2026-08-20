import json
from pathlib import Path
from datetime import datetime

from django.conf import settings
from django.core.management.base import BaseCommand

from calender.models import CalendarEvent, CalendarTypeConfig


class Command(BaseCommand):
    help = "Load calendar type config and seed events from JSON files."

    def load_type_config(self):
        file_path = (
            Path(settings.BASE_DIR)
            / "static"
            / "data"
            / "cal2_type_config.json"
        )

        if not file_path.exists():
            self.stderr.write(self.style.ERROR(f"File not found: {file_path}"))
            return

        with open(file_path, "r", encoding="utf-8") as file:
            config_data = json.load(file)

        created_count = 0
        updated_count = 0

        for type_key, values in config_data.items():
            obj, created = CalendarTypeConfig.objects.update_or_create(
                type_key=type_key,
                defaults={
                    "label": values.get("label", ""),
                    "icon": values.get("icon", ""),
                    "badge": values.get("badge", ""),
                    "short": values.get("short", ""),
                },
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Calendar type config loaded. Created: {created_count}, Updated: {updated_count}"
            )
        )

    def load_seed_events(self):
        file_path = (
            Path(settings.BASE_DIR)
            / "static"
            / "data"
            / "cal1_seed_events.json"
        )

        if not file_path.exists():
            self.stderr.write(self.style.ERROR(f"File not found: {file_path}"))
            return

        with open(file_path, "r", encoding="utf-8") as file:
            events = json.load(file)

        created_count = 0
        updated_count = 0

        for item in events:
            event_date = datetime.strptime(item["date"], "%Y-%m-%d").date()
            event_time = datetime.strptime(item["time"], "%H:%M").time()

            obj, created = CalendarEvent.objects.update_or_create(
                event_id=item["id"],
                defaults={
                    "event_type": item.get("type", "training"),
                    "date": event_date,
                    "time": event_time,
                    "title": item.get("title", ""),
                    "venue": item.get("venue", ""),
                    "notes": item.get("notes", ""),
                },
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Calendar seed events loaded. Created: {created_count}, Updated: {updated_count}"
            )
        )

    def handle(self, *args, **options):
        self.load_type_config()
        self.load_seed_events()

        self.stdout.write(
            self.style.SUCCESS("All calendar data loaded successfully.")
        )