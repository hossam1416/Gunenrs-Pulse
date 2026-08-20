from django.db import models


class CalendarEvent(models.Model):
    EVENT_TYPE_CHOICES = [
        ("match", "Match"),
        ("training", "Training"),
        ("set", "Set Pieces"),
        ("recovery", "Recovery"),
    ]

    event_id = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        help_text="Unique ID from JSON file, مثل s01 أو m01",
    )

    title = models.CharField(
        max_length=150,
    )

    event_type = models.CharField(
        max_length=20,
        choices=EVENT_TYPE_CHOICES,
        default="training",
    )

    date = models.DateField()

    time = models.TimeField()

    venue = models.CharField(
        max_length=150,
        blank=True,
        default="",
    )

    notes = models.TextField(
        blank=True,
        default="",
    )

    class Meta:
        ordering = [
            "date",
            "time",
        ]

        verbose_name = "Calendar Event"
        verbose_name_plural = "Calendar Events"

    def __str__(self):
        return f"{self.title} - {self.date}"


class CalendarTypeConfig(models.Model):
    type_key = models.CharField(
        max_length=30,
        unique=True,
        help_text="Type key from JSON file مثل match أو training",
    )

    label = models.CharField(
        max_length=100,
    )

    icon = models.CharField(
        max_length=100,
    )

    badge = models.CharField(
        max_length=100,
    )

    short = models.CharField(
        max_length=50,
    )

    class Meta:
        ordering = [
            "type_key",
        ]

        verbose_name = "Calendar Type Config"
        verbose_name_plural = "Calendar Type Configs"

    def __str__(self):
        return self.label