import json
import os
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from performance.models import Player

class Command(BaseCommand):
    help = "Load basic player data from static/data/Perf_players_data.json to Player Model"
    def handle(self, *args, **kwargs):
        file_path = os.path.join(
            settings.BASE_DIR,
            "static",
            "data",
            "Perf_players_data.json"
        )
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f"❌ الملف غير موجود في: {file_path}"))
            return

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        def parse_date(date_str):
            if not date_str or date_str == "—":
                return None
            try:
                return datetime.strptime(date_str, "%d/%m/%Y").date()
            except ValueError:
                return None

        def clean_int(value, default=0):
            if value in [None, "", "—"]:
                return default
            try:
                return int(float(str(value).replace(",", "").replace("%", "").strip()))
            except (TypeError, ValueError):
                return default

        def clean_float(value, default=0.0):
            if value in [None, "", "—"]:
                return default
            try:
                return float(str(value).replace(",", "").replace("%", "").strip())
            except (TypeError, ValueError):
                return default

        def clean_text(value, default=""):
            if value in [None, "", "—"]:
                return default
            return str(value).strip()

        for item in data:
            if "name" not in item:
                continue

            try:
                player, created = Player.objects.update_or_create(
                    name=item["name"],
                    defaults={
                        "number": clean_int(item.get("number"), 0),
                        "position": clean_text(item.get("posGroup"), "DEF"),
                        "secondary_position": clean_text(item.get("secondary"), ""),

                        "birth_date": parse_date(item.get("dob")) or "2000-01-01",
                        "height": clean_int(item.get("height"), 0),
                        "weight": clean_int(item.get("weight"), 0),
                        "preferred_foot": clean_text(item.get("foot"), "Right"),

                        "market_value": clean_float(item.get("valueNum"), 0.0),

                        "trend": clean_text(item.get("trend"), "€0"),
                        "trend_type": clean_text(item.get("trendType"), "neutral"),

                        "contract_start": parse_date(item.get("startDate")) or "2020-01-01",
                        "contract_expiry": parse_date(item.get("expiry")) or "2025-01-01",

                        "fitness_percentage": clean_int(item.get("fitness"), 100),
                        "medical_status": clean_text(item.get("medicalType"), "fit"),

                        "yellow_cards": clean_int(item.get("yellowCards"), 0),
                        "red_cards": clean_int(item.get("redCards"), 0),

                        # هذا أهم تعديل:
                        # يأخذ مسار الصورة من JSON مثل /static/images/raya.jpg
                        "image_url": clean_text(
                            item.get("img"),
                            "/static/images/white_gun.jpg"
                        ),
                    },
                )

                if created:
                    self.stdout.write(self.style.SUCCESS(f"تم إضافة لاعب جديد: {player.name}"))
                else:
                    self.stdout.write(self.style.SUCCESS(f"تم تحديث بيانات اللاعب: {player.name}"))
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"حدث خطأ مع {item.get('name')}: {str(e)}")
                )

        self.stdout.write(
            self.style.SUCCESS("تم رفع جميع بيانات اللاعبين الأساسية بنجاح إلى قاعدة البيانات!")
        )