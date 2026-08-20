import json

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required

from .models import CalendarEvent, CalendarTypeConfig
from training.views import get_current_player_context


def get_events_json():
    """
    داتا صفحات الكوتش.
    تستخدم CalendarEvent وتحولها إلى JSON.
    """

    events = CalendarEvent.objects.all()

    events_list = []

    for event in events:
        events_list.append(
            {
                "id": event.id,
                "sourceId": event.event_id or "",
                "title": event.title,
                "type": event.event_type,
                "date": event.date.strftime("%Y-%m-%d"),
                "time": event.time.strftime("%H:%M"),
                "venue": event.venue,
                "notes": event.notes,
            }
        )

    return json.dumps(events_list, ensure_ascii=False)


def get_player_calendar_json():
    """
    داتا صفحات اللاعب.
    ترجع نفس شكل player_calendar.json:
    {
      "typeConfig": {},
      "events": []
    }
    """

    type_configs = CalendarTypeConfig.objects.all()

    type_config_data = {}

    for config in type_configs:
        type_config_data[config.type_key] = {
            "label": config.label,
            "icon": config.icon,
            "badge": config.badge,
            "short": config.short,
        }

    events = CalendarEvent.objects.all()

    events_data = []

    for event in events:
        events_data.append(
            {
                "id": event.id,
                "sourceId": event.event_id or "",
                "type": event.event_type,
                "date": event.date.strftime("%Y-%m-%d"),
                "time": event.time.strftime("%H:%M"),
                "title": event.title,
                "venue": event.venue,
                "notes": event.notes,
            }
        )

    data = {
        "typeConfig": type_config_data,
        "events": events_data,
    }

    return json.dumps(data, ensure_ascii=False)


def calendar_month(request):
    """
    صفحة Calendar Month للكوتش.
    URL name: calendar_month
    Template: templates/8-calendar/Cal-1.html
    """

    context = {
        "events_json": get_events_json(),
    }

    return render(
        request,
        "8-calendar/Cal-1.html",
        context,
    )


def calendar_agenda(request):
    """
    صفحة Calendar Agenda للكوتش.
    URL name: calendar_agenda
    Template: templates/8-calendar/Cal-add.html
    """

    context = {
        "events_json": get_events_json(),
    }

    return render(
        request,
        "8-calendar/Cal-add.html",
        context,
    )


@login_required
def player_calendar(request):
    """
    صفحة Calendar Month للاعب.
    URL name: player_calendar
    Template: templates/8-calendar/Cal-1_player.html
    """

    context = {
        "player_calendar_json": get_player_calendar_json(),
    }
    context.update(get_current_player_context(request.user))

    return render(
        request,
        "8-calendar/Cal-1_player.html",
        context,
    )


@login_required
def player_calendar_agenda(request):
    """
    صفحة Calendar Agenda للاعب.
    URL name: player_calendar_agenda
    Template: templates/8-calendar/Cal-add_player.html
    """

    context = {
        "player_calendar_json": get_player_calendar_json(),
    }
    context.update(get_current_player_context(request.user))

    return render(
        request,
        "8-calendar/Cal-add_player.html",
        context,
    )


def add_calendar_event(request):
    """
    إضافة حدث جديد للكوتش.
    """

    if request.method != "POST":
        return redirect("calendar_month")

    title = request.POST.get("title")
    event_type = request.POST.get("event_type")
    date = request.POST.get("date")
    time = request.POST.get("time")
    venue = request.POST.get("venue")
    notes = request.POST.get("notes")
    next_page = request.POST.get("next_page")

    if title and date and time:
        CalendarEvent.objects.create(
            title=title,
            event_type=event_type or "training",
            date=date,
            time=time,
            venue=venue or "",
            notes=notes or "",
        )

    if next_page == "agenda":
        return redirect("calendar_agenda")

    return redirect("calendar_month")


def update_calendar_event(request, event_id):
    """
    تحديث حدث موجود من لوحة التقويم.
    """

    event = get_object_or_404(CalendarEvent, id=event_id)

    if request.method != "POST":
        return redirect("calendar_month")

    title = request.POST.get("title")
    event_type = request.POST.get("event_type")
    date = request.POST.get("date")
    time = request.POST.get("time")
    venue = request.POST.get("venue")
    notes = request.POST.get("notes")
    next_page = request.POST.get("next_page")

    if title:
        event.title = title

    if event_type:
        event.event_type = event_type

    if date:
        event.date = date

    if time:
        event.time = time

    event.venue = venue or ""
    event.notes = notes or ""
    event.save()

    if next_page == "agenda":
        return redirect("calendar_agenda")

    return redirect("calendar_month")


def delete_calendar_event(request, event_id):
    """
    حذف حدث من صفحة الكوتش.
    """

    event = get_object_or_404(
        CalendarEvent,
        id=event_id,
    )

    event.delete()

    referer = request.META.get("HTTP_REFERER", "")

    if "/calendar/agenda/" in referer:
        return redirect("calendar_agenda")

    return redirect("calendar_month")
