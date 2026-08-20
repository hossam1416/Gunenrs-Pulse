import json
from django.core.management.base import BaseCommand
from medical.models import Player


class Command(BaseCommand):
    help = "Load injury meta data for medical center"

    def handle(self, *args, **options):
        json_data = """
        {
          "Ben White": {
            "injury": "Knee Sprain",
            "grade": "Grade 1",
            "severity": "medium",
            "status": "doubtful",
            "statusLabel": "Doubtful",
            "statusClass": "status-doubtful",
            "injuryDate": "08 Mar 2026",
            "returnDate": "25 Mar 2026",
            "recovery": 60,
            "daysLeft": 8,
            "daysClass": "days-warning",
            "progClass": "prog-yellow",
            "cardClass": "inj-card--medium",
            "badgeClass": "badge-medium",
            "badgeLabel": "Medium Severity"
          },
          "Jurriën Timber": {
            "injury": "Hamstring Strain",
            "grade": "Grade 2",
            "severity": "high",
            "status": "absent",
            "statusLabel": "Fully Absent",
            "statusClass": "status-absent",
            "injuryDate": "01 Mar 2026",
            "returnDate": "28 Mar 2026",
            "recovery": 35,
            "daysLeft": 14,
            "daysClass": "days-urgent",
            "progClass": "prog-red",
            "cardClass": "inj-card--high",
            "badgeClass": "badge-high",
            "badgeLabel": "High Severity"
          },
          "Mikel Merino": {
            "injury": "Shoulder Knock",
            "grade": "Grade 1",
            "severity": "low",
            "status": "light",
            "statusLabel": "Light Training",
            "statusClass": "status-light",
            "injuryDate": "10 Mar 2026",
            "returnDate": "18 Mar 2026",
            "recovery": 85,
            "daysLeft": 4,
            "daysClass": "days-ok",
            "progClass": "prog-green",
            "cardClass": "inj-card--low",
            "badgeClass": "badge-low",
            "badgeLabel": "Low Severity"
          }
        }
        """

        data = json.loads(json_data)

        self.stdout.write("جاري تحميل تفاصيل الإصابات...")

        for player_name, meta in data.items():
            try:
                player = Player.objects.get(name=player_name)

                player.injury_meta = meta
                player.medical_status = "injured"
                player.fitness_percentage = meta.get("recovery", 0)
                player.save()

                self.stdout.write(
                    self.style.SUCCESS(f"تمت إضافة تفاصيل إصابة: {player.name}")
                )

            except Player.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f"اللاعب {player_name} غير موجود في الداتابيز!")
                )

        self.stdout.write(
            self.style.SUCCESS("تم ربط تفاصيل الإصابات بنجاح.")
        )