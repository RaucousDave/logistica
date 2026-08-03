from django.views.generic import TemplateView


class LandingView(TemplateView):
    """Public. Renders the test-console landing page with links to each role's login."""

    template_name = "frontend/index.html"


class LoginPageView(TemplateView):
    """Public. Renders the shared login template for one role (admin/driver/client)."""

    template_name = "frontend/login.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["role"] = self.kwargs["role"]
        return ctx


class AdminDashboardView(TemplateView):
    """Public shell. Client-side JS checks localStorage and redirects to /admin-login/ if not authenticated as admin."""

    template_name = "frontend/admin.html"


class DriverDashboardView(TemplateView):
    """Public shell. Client-side JS checks localStorage and redirects to /driver-login/ if not authenticated as driver."""

    template_name = "frontend/driver.html"


class ClientDashboardView(TemplateView):
    """Public shell. Client-side JS checks localStorage and redirects to /client-login/ if not authenticated as client."""

    template_name = "frontend/client.html"
