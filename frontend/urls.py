from django.urls import path

from .views import AdminDashboardView, ClientDashboardView, DriverDashboardView, LandingView, LoginPageView

urlpatterns = [
    path("", LandingView.as_view(), name="landing"),
    path("admin-login/", LoginPageView.as_view(), {"role": "admin"}, name="admin-login-page"),
    path("driver-login/", LoginPageView.as_view(), {"role": "driver"}, name="driver-login-page"),
    path("client-login/", LoginPageView.as_view(), {"role": "client"}, name="client-login-page"),
    path("admin/", AdminDashboardView.as_view(), name="admin-dashboard"),
    path("driver/", DriverDashboardView.as_view(), name="driver-dashboard"),
    path("client/", ClientDashboardView.as_view(), name="client-dashboard"),
]
