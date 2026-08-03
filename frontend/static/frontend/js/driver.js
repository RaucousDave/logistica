(() => {
  const session = Auth.guard("driver");
  if (!session) return;

  const state = {
    available: false,
    activeDelivery: null, // {id, pickup_location, dropoff_location, status}
    gpsTimer: null,
    baseLat: UYO_CENTER[0],
    baseLng: UYO_CENTER[1],
    map: null,
    driverMarker: null,
    pickupMarker: null,
    dropoffMarker: null,
    routeLine: null,
  };

  $("driver-username").textContent = session.username;

  $("logout-btn").addEventListener("click", () => {
    stopGps();
    Auth.clear();
    window.location.href = "/driver-login/";
  });

  function renderAvailability(isAvailable) {
    state.available = isAvailable;
    $("availability-label").textContent = isAvailable ? "Available" : "Off Duty";
    $("availability-track").className = `w-9 h-5 rounded-full relative transition ${isAvailable ? "bg-green" : "bg-ink3/40"}`;
    $("availability-dot").className = `absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isAvailable ? "translate-x-4" : ""}`;
  }

  $("availability-toggle").addEventListener("click", async () => {
    const btn = $("availability-toggle");
    if (btn.disabled) return;
    btn.disabled = true;
    const next = !state.available;
    try {
      await API.setDriverAvailability(session.access, next);
      renderAvailability(next);
    } catch (e) {
      Toast.error("Failed to update availability: " + e.message);
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------------- Map ---------------- */
  initMap("driver-map").then((map) => {
    state.map = map;
    state.driverMarker = L.marker(UYO_CENTER, { icon: driverMarkerIcon(), opacity: 0 }).addTo(map);
  });

  /* Pickup/dropoff are stored as real coordinates when the admin supplied
   * them at creation time (Delivery.pickup_lat/lng, dropoff_lat/lng). Not
   * every delivery has them (the address text itself isn't geocoded), so
   * fall back to a stable deterministic placeholder near Uyo when absent —
   * better than an empty map, but not a real address lookup. */
  function placeholderCoords(deliveryId, salt) {
    const seed = deliveryId * 97 + salt;
    const dLat = (((seed * 7) % 40) - 20) / 1500;
    const dLng = (((seed * 13) % 40) - 20) / 1500;
    return [UYO_CENTER[0] + dLat, UYO_CENTER[1] + dLng];
  }

  function pickupCoords(delivery) {
    return delivery.pickup_lat != null ? [delivery.pickup_lat, delivery.pickup_lng] : placeholderCoords(delivery.id, 1);
  }

  function dropoffCoords(delivery) {
    return delivery.dropoff_lat != null ? [delivery.dropoff_lat, delivery.dropoff_lng] : placeholderCoords(delivery.id, 2);
  }

  function drawRoute(delivery) {
    if (!state.map) return;
    const pickup = pickupCoords(delivery);
    const dropoff = dropoffCoords(delivery);
    clearRoute();
    state.pickupMarker = L.marker(pickup, { icon: pinIcon("#3B82F6") }).addTo(state.map).bindPopup("Pickup");
    state.dropoffMarker = L.marker(dropoff, { icon: pinIcon("#EF4444") }).addTo(state.map).bindPopup("Dropoff");
    state.routeLine = L.polyline([pickup, dropoff], { color: "#00C896", weight: 3, opacity: 0.7, dashArray: "6 6" }).addTo(state.map);
    state.map.fitBounds(L.latLngBounds([pickup, dropoff]), { padding: [60, 60] });
  }

  function clearRoute() {
    [state.pickupMarker, state.dropoffMarker, state.routeLine].forEach((m) => m && state.map.removeLayer(m));
    state.pickupMarker = state.dropoffMarker = state.routeLine = null;
  }

  /* ---------------- Job cards ---------------- */
  function renderJobCard(delivery) {
    if ($(`job-${delivery.id}`)) return;
    const card = el(
      "div",
      "bg-surface border border-edge rounded-card p-4 relative overflow-hidden animate-[slide-in-top_0.3s_ease-out]"
    );
    card.id = `job-${delivery.id}`;
    card.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <span class="text-ink3 text-[11px]">#${delivery.id}</span>
      </div>
      <div class="text-ink text-sm flex items-center gap-1.5 mb-3">
        <span class="truncate">${escapeHtml(delivery.pickup_location)}</span>
        <span class="text-green shrink-0">→</span>
        <span class="truncate">${escapeHtml(delivery.dropoff_location)}</span>
      </div>
    `;
    const acceptBtn = el("button", "w-full bg-green hover:bg-green-600 text-base font-semibold text-sm rounded-lg py-2.5 transition flex items-center justify-center");
    acceptBtn.textContent = "Accept Job";
    acceptBtn.addEventListener("click", () =>
      withBusyButton(acceptBtn, async () => {
        try {
          await API.acceptDelivery(session.access, delivery.id);
          Toast.info("Accept request sent — waiting for confirmation…");
        } catch (e) {
          Toast.error(e.message);
        }
      })
    );
    card.appendChild(acceptBtn);

    const timerBar = el("div", "absolute bottom-0 left-0 h-0.5 bg-green transition-[width] ease-linear");
    timerBar.style.width = "100%";
    timerBar.style.transitionDuration = "30s";
    card.appendChild(timerBar);
    requestAnimationFrame(() => (timerBar.style.width = "0%"));

    $("job-cards").appendChild(card);
    refreshEmptyState();
  }

  function markJobTaken(deliveryId) {
    const card = $(`job-${deliveryId}`);
    if (!card) return;
    card.className = "bg-surface/40 border border-edge rounded-card p-4 relative overflow-hidden opacity-60";
    const btn = card.querySelector("button");
    if (btn) {
      btn.outerHTML = '<div class="text-center text-ink3 text-xs py-2.5">Taken by another driver</div>';
    }
    setTimeout(() => {
      card.remove();
      refreshEmptyState();
    }, 3000);
  }

  function refreshEmptyState() {
    const container = $("job-cards");
    if (container.children.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center text-center py-14 text-green/50">
          <div class="relative w-16 h-16 flex items-center justify-center mb-4">
            <span class="radar-pulse absolute inset-0 rounded-full bg-green/10"></span>
            ${ICONS.radar}
          </div>
          <p class="text-ink3 text-sm">Waiting for jobs...</p>
        </div>`;
    }
  }
  refreshEmptyState();

  /* ---------------- Active delivery ---------------- */
  function setActiveDelivery(delivery) {
    state.activeDelivery = delivery;
    document.querySelectorAll("#job-cards > div").forEach((c) => c.remove());
    refreshEmptyState();
    renderActiveDelivery();
    drawRoute(delivery);
    startGps();
  }

  function renderActiveDelivery() {
    const d = state.activeDelivery;
    const section = $("active-delivery-section");
    if (!d) {
      section.classList.add("hidden");
      return;
    }
    section.classList.remove("hidden");

    const stages = ["accepted", "in_transit", "delivered"];
    const currentIdx = Math.max(0, stages.indexOf(d.status));

    section.innerHTML = `
      <div class="bg-surface2 border-l-4 border-green rounded-card p-4 mb-4">
        <div class="text-green text-[10px] font-bold tracking-wider mb-2">ACTIVE DELIVERY</div>
        <div class="text-ink text-sm flex items-center gap-1.5 mb-2">
          <span class="truncate">${escapeHtml(d.pickup_location)}</span>
          <span class="text-green shrink-0">→</span>
          <span class="truncate">${escapeHtml(d.dropoff_location)}</span>
        </div>
        <div class="mb-3">${statusBadge(d.status)}</div>
        <div id="tracking-indicator" class="flex items-center gap-1.5 text-xs text-ink2 mb-3">
          <span class="w-1.5 h-1.5 rounded-full bg-ink3"></span><span>GPS idle</span>
        </div>
        <div class="flex items-center gap-1">
          ${stages
            .map(
              (s, i) =>
                `<div class="h-1 flex-1 rounded-full ${i <= currentIdx ? "bg-green" : "bg-edge"}"></div>`
            )
            .join('<div class="w-1"></div>')}
        </div>
        <div class="flex justify-between text-[10px] text-ink3 mt-1">
          <span>Accepted</span><span>In Transit</span><span>Delivered</span>
        </div>
      </div>
    `;
  }

  function setTrackingIndicator(active) {
    const indicator = $("tracking-indicator");
    if (!indicator) return;
    indicator.innerHTML = active
      ? '<span class="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></span><span class="text-green">Tracking Active</span>'
      : '<span class="w-1.5 h-1.5 rounded-full bg-ink3"></span><span>GPS idle</span>';
  }

  /* ---------------- GPS simulation ---------------- */
  function startGps() {
    if (state.gpsTimer) return;
    state.baseLat = UYO_CENTER[0] + (Math.random() - 0.5) * 0.01;
    state.baseLng = UYO_CENTER[1] + (Math.random() - 0.5) * 0.01;
    setTrackingIndicator(true);
    if (state.driverMarker) {
      state.driverMarker.setOpacity(1);
      state.driverMarker.setLatLng([state.baseLat, state.baseLng]);
    }

    const ping = async () => {
      state.baseLat += (Math.random() - 0.5) * 0.0015;
      state.baseLng += (Math.random() - 0.5) * 0.0015;
      if (state.driverMarker) animateMarkerTo(state.driverMarker, [state.baseLat, state.baseLng]);
      try {
        const res = await API.sendLocation(session.access, {
          delivery_id: state.activeDelivery.id,
          latitude: state.baseLat,
          longitude: state.baseLng,
        });
        if (state.activeDelivery && res.status !== state.activeDelivery.status) {
          state.activeDelivery.status = res.status;
          renderActiveDelivery();
          setTrackingIndicator(true);
        }
      } catch (e) {
        Toast.error("GPS ping failed: " + e.message);
      }
    };

    ping();
    state.gpsTimer = setInterval(ping, 8000);
  }

  function stopGps() {
    if (state.gpsTimer) {
      clearInterval(state.gpsTimer);
      state.gpsTimer = null;
    }
    setTrackingIndicator(false);
    if (state.driverMarker) state.driverMarker.setOpacity(0);
  }

  function clearActiveDelivery() {
    stopGps();
    state.activeDelivery = null;
    renderActiveDelivery();
    clearRoute();
  }

  /* ---------------- WebSocket ---------------- */
  connectWS("/ws/driver/", session.access, {
    onStatus: (status) => {
      $("ws-dot").className = `w-2 h-2 rounded-full ${status === "connected" ? "bg-green animate-pulse" : "bg-red-500"}`;
    },
    onMessage: (msg) => {
      if (msg.event === "job_request") {
        renderJobCard(msg.payload.delivery);
      } else if (msg.event === "job_accepted" && String(msg.payload.driver_id) === String(session.userId)) {
        Toast.success(`Job #${msg.payload.delivery_id} accepted!`);
        // We only get delivery_id/driver_id in this event; fetch full delivery via the list.
        API.listDeliveries(session.access, `?status=accepted`).then((res) => {
          const delivery = res.results.find((d) => d.id === msg.payload.delivery_id);
          if (delivery) setActiveDelivery(delivery);
        });
      } else if (msg.event === "job_taken") {
        markJobTaken(msg.payload.delivery_id);
      } else if (msg.event === "job_cancelled") {
        if (state.activeDelivery && state.activeDelivery.id === msg.payload.delivery_id) {
          Toast.warning("This delivery was cancelled by admin.");
          clearActiveDelivery();
        } else {
          markJobTaken(msg.payload.delivery_id);
        }
      } else if (msg.event === "delivery_confirmed") {
        const finishedId = msg.payload.delivery_id;
        Toast.success("Delivery confirmed by client — GPS stopped.");
        API.driverTripSummary(session.access, finishedId)
          .then((summary) => {
            Toast.info(`Trip #${finishedId} took ${formatDuration(parseDuration(summary.total_duration))}.`);
          })
          .catch(() => {
            /* summary not ready yet — not critical, skip the extra toast */
          });
        clearActiveDelivery();
      }
    },
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }
})();
