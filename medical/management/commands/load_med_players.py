import json
from datetime import datetime
from django.core.management.base import BaseCommand
from medical.models import Player


class Command(BaseCommand):
    help = "Load medical players data with static images"

    def handle(self, *args, **options):
        json_data = """
        [
          {
            "name": "David Raya", "number": 22, "primary": "GK", "secondary": "—",
            "dob": "15/09/1995", "height": 183, "weight": 84, "foot": "Right",
            "valueNum": 35, "startDate": "01/07/2023", "expiry": "30/06/2028",
            "fitness": 100, "medicalType": "fit", "yellowCards": 0, "redCards": 0,
            "posGroup": "GK", "img": "/static/images/raya.jpg"
          },
          {
            "name": "William Saliba", "number": 2, "primary": "CB", "secondary": "RB",
            "dob": "24/03/2001", "height": 192, "weight": 92, "foot": "Right",
            "valueNum": 100, "startDate": "06/07/2023", "expiry": "30/06/2028",
            "fitness": 100, "medicalType": "fit", "yellowCards": 1, "redCards": 0,
            "posGroup": "DEF", "img": "/static/images/saliba.jpg"
          },
          {
            "name": "Ben White", "number": 4, "primary": "RB", "secondary": "CB",
            "dob": "08/10/1997", "height": 183, "weight": 76, "foot": "Right",
            "valueNum": 55, "startDate": "01/07/2021", "expiry": "30/06/2026",
            "fitness": 65, "medicalType": "injured", "yellowCards": 1, "redCards": 0,
            "posGroup": "DEF", "img": "/static/images/ben.jpg"
          },
          {
            "name": "Gabriel Magalhães", "number": 6, "primary": "CB", "secondary": "LB",
            "dob": "19/12/1997", "height": 191, "weight": 82, "foot": "Left",
            "valueNum": 90, "startDate": "01/09/2020", "expiry": "30/06/2029",
            "fitness": 96, "medicalType": "fit", "yellowCards": 2, "redCards": 0,
            "posGroup": "DEF", "img": "/static/images/gabi.jpg"
          },
          {
            "name": "Jurriën Timber", "number": 12, "primary": "RB", "secondary": "CB, LB",
            "dob": "17/06/2001", "height": 181, "weight": 74, "foot": "Right",
            "valueNum": 75, "startDate": "10/07/2023", "expiry": "30/06/2028",
            "fitness": 40, "medicalType": "injured", "yellowCards": 2, "redCards": 0,
            "posGroup": "DEF", "img": "/static/images/timber.jpg"
          },
          {
            "name": "Myles Lewis-Skelly", "number": 59, "primary": "LB", "secondary": "CM",
            "dob": "26/09/2006", "height": 183, "weight": 72, "foot": "Left",
            "valueNum": 40, "startDate": "01/07/2024", "expiry": "30/06/2029",
            "fitness": 88, "medicalType": "fit", "yellowCards": 3, "redCards": 1,
            "posGroup": "DEF", "img": "/static/images/skelly.jpg"
          },
          {
            "name": "Declan Rice", "number": 41, "primary": "CDM", "secondary": "CM, CB",
            "dob": "14/01/1999", "height": 188, "weight": 80, "foot": "Right",
            "valueNum": 120, "startDate": "15/07/2023", "expiry": "30/06/2028",
            "fitness": 100, "medicalType": "fit", "yellowCards": 3, "redCards": 0,
            "posGroup": "MID", "img": "/static/images/rice.jpg"
          },
          {
            "name": "Martín Zubimendi", "number": 16, "primary": "CDM", "secondary": "CM",
            "dob": "02/03/1999", "height": 182, "weight": 75, "foot": "Right",
            "valueNum": 80, "startDate": "01/07/2025", "expiry": "30/06/2030",
            "fitness": 100, "medicalType": "fit", "yellowCards": 1, "redCards": 0,
            "posGroup": "MID", "img": "/static/images/zubimendi.jpg"
          },
          {
            "name": "Mikel Merino", "number": 23, "primary": "CM", "secondary": "CDM, CAM",
            "dob": "22/06/1996", "height": 191, "weight": 84, "foot": "Right",
            "valueNum": 55, "startDate": "01/07/2024", "expiry": "30/06/2028",
            "fitness": 85, "medicalType": "injured", "yellowCards": 2, "redCards": 0,
            "posGroup": "MID", "img": "/static/images/zezo.jpg"
          },
          {
            "name": "Martin Ødegaard", "number": 8, "primary": "CAM", "secondary": "CM, RW",
            "dob": "17/12/1998", "height": 178, "weight": 68, "foot": "Left",
            "valueNum": 110, "startDate": "22/09/2023", "expiry": "30/06/2028",
            "fitness": 100, "medicalType": "fit", "yellowCards": 1, "redCards": 0,
            "posGroup": "MID", "img": "/static/images/ode.jpg"
          },
          {
            "name": "Bukayo Saka", "number": 7, "primary": "RW", "secondary": "LW, LWB",
            "dob": "05/09/2001", "height": 178, "weight": 72, "foot": "Left",
            "valueNum": 160, "startDate": "23/05/2023", "expiry": "30/06/2027",
            "fitness": 91, "medicalType": "fit", "yellowCards": 1, "redCards": 0,
            "posGroup": "FWD", "img": "/static/images/saka.jpg"
          },
          {
            "name": "Leandro Trossard", "number": 19, "primary": "LW", "secondary": "CAM, ST",
            "dob": "04/12/1994", "height": 173, "weight": 70, "foot": "Right",
            "valueNum": 35, "startDate": "13/01/2023", "expiry": "30/06/2026",
            "fitness": 87, "medicalType": "fit", "yellowCards": 0, "redCards": 0,
            "posGroup": "FWD", "img": "/static/images/leo.jpg"
          },
          {
            "name": "Gabriel Martinelli", "number": 11, "primary": "LW", "secondary": "ST, RW",
            "dob": "18/06/2001", "height": 178, "weight": 75, "foot": "Right",
            "valueNum": 70, "startDate": "01/07/2019", "expiry": "30/06/2027",
            "fitness": 84, "medicalType": "fit", "yellowCards": 1, "redCards": 0,
            "posGroup": "FWD", "img": "/static/images/mart.jpg"
          },
          {
            "name": "Viktor Gyökeres", "number": 14, "primary": "ST", "secondary": "LW",
            "dob": "04/06/1998", "height": 184, "weight": 85, "foot": "Right",
            "valueNum": 120, "startDate": "01/07/2025", "expiry": "30/06/2030",
            "fitness": 97, "medicalType": "fit", "yellowCards": 2, "redCards": 0,
            "posGroup": "FWD", "img": "/static/images/viktor.jpg"
          },
          {
            "name": "Ethan Nwaneri", "number": 53, "primary": "CAM", "secondary": "RW, LW",
            "dob": "21/03/2007", "height": 177, "weight": 66, "foot": "Right",
            "valueNum": 30, "startDate": "01/07/2024", "expiry": "30/06/2028",
            "fitness": 85, "medicalType": "fit", "yellowCards": 0, "redCards": 0,
            "posGroup": "FWD", "img": "/static/images/nwaneri.jpg"
          }
        ]
        """

        players_data = json.loads(json_data)

        self.stdout.write("جاري إضافة اللاعبين لقاعدة البيانات...")

        for item in players_data:
            birth_date = datetime.strptime(item["dob"], "%d/%m/%Y").date()
            start_date = datetime.strptime(item["startDate"], "%d/%m/%Y").date()
            expiry_date = datetime.strptime(item["expiry"], "%d/%m/%Y").date()

            secondary = item["secondary"] if item["secondary"] != "—" else ""

            player, created = Player.objects.update_or_create(
                number=item["number"],
                defaults={
                    "name": item["name"],
                    "position": item["posGroup"],
                    "secondary_position": secondary,
                    "birth_date": birth_date,
                    "height": item["height"],
                    "weight": item["weight"],
                    "preferred_foot": item["foot"],
                    "market_value": item["valueNum"],
                    "contract_start": start_date,
                    "contract_expiry": expiry_date,
                    "fitness_percentage": item["fitness"],
                    "medical_status": item["medicalType"],
                    "yellow_cards": item["yellowCards"],
                    "red_cards": item["redCards"],
                    "static_image": item.get("img", ""),
                },
            )

            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"تمت الإضافة: {player.name} (#{player.number})")
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f"تم التحديث: {player.name} (#{player.number})")
                )

        self.stdout.write(
            self.style.SUCCESS("تم تحميل جميع اللاعبين مع الصور بنجاح.")
        )