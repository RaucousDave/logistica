from django.urls import path

from .views import AcceptDeliveryView, ConfirmDeliveryView, DeliveryListCreateView, DeliveryTrackBySearchKeyView

urlpatterns = [
    path("deliveries/", DeliveryListCreateView.as_view(), name="delivery-list-create"),
    path("deliveries/track/<str:tracking_key>/", DeliveryTrackBySearchKeyView.as_view(), name="delivery-track-key"),
    path("deliveries/<int:pk>/accept/", AcceptDeliveryView.as_view(), name="delivery-accept"),
    path("deliveries/<int:pk>/confirm/", ConfirmDeliveryView.as_view(), name="delivery-confirm"),
]
