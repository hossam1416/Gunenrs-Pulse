from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages
from django.contrib.auth.forms import AuthenticationForm


def user_in_group(user, group_name):
    """
    Check if the user belongs to a specific Django group.
    """
    return user.groups.filter(name=group_name).exists()


def get_redirect_url_for_user(user):
    """
    Redirect user based on Django Admin Groups.

    Players -> player_home
    Coaches -> home
    Superuser -> home
    Default -> home
    """

    if user.is_superuser:
        return "home"

    if hasattr(user, "player") or user_in_group(user, "Players"):
        return "player_home"

    if user_in_group(user, "Coaches"):
        return "home"

    return "home"


def login_view(request):
    """
    Coach Login Page.
    Template: templates/login/login.html
    """

    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)

        if form.is_valid():
            username = form.cleaned_data.get("username")
            password = form.cleaned_data.get("password")

            user = authenticate(
                request,
                username=username,
                password=password,
            )

            if user is not None:
                login(request, user)
                messages.success(request, f"Welcome back, {username}!")
                return redirect(get_redirect_url_for_user(user))

            messages.error(request, "Invalid username or password.")

        else:
            messages.error(request, "Invalid username or password.")

    else:
        form = AuthenticationForm()

    return render(request, "login/login.html", {"form": form})


def player_login_view(request):
    """
    Player Login Page.
    Template: templates/login/login_p.html
    """

    if request.method == "POST":
        form = AuthenticationForm(request, data=request.POST)

        if form.is_valid():
            username = form.cleaned_data.get("username")
            password = form.cleaned_data.get("password")

            user = authenticate(
                request,
                username=username,
                password=password,
            )

            if user is not None:
                login(request, user)
                messages.success(request, f"Welcome back, {username}!")
                return redirect(get_redirect_url_for_user(user))

            messages.error(request, "Invalid username or password.")

        else:
            messages.error(request, "Invalid username or password.")

    else:
        form = AuthenticationForm()

    return render(request, "login/login_p.html", {"form": form})


def custom_logout(request):
    """
    Logout user and return to login page.
    """

    logout(request)
    messages.success(request, "You have been logged out successfully.")
    return redirect("login")
