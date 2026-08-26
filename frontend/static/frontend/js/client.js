(() => {
  const session = Auth.guard("client");
  if (!session) return;

  const state = {
    deliveries: [],
    selectedId: null,
    ws: null,
    map: null,
    driverMarker: null,
    pickupMarker: null,
    dropoffMarker: null,
    routeLine: null,
  };

  $("client-username").textContent = session.username;

  $("logout-btn").addEventListener("click", () => {
    if (state.ws) state.ws.close();
    Auth.clear();
    window.location.href = "/client-login/";
  });

  $("refresh-btn").addEventListener("click", loadDeliveries);

  const searchBtn = $("search-key-btn");
  const searchInput = $("search-key-input");

  async function performKeySearch() {
    const key = searchInput.value.trim();
    if (!key) {
      Toast.warning("Enter a tracking key or delivery ID.");
      return;
    }
    try {
      const delivery = await API.trackBySearchKey(session.access, key);
      const exists = state.deliveries.find((x) => x.id === delivery.id);
      if (!exists) {
        state.deliveries.unshift(delivery);
      } else {
        Object.assign(exists, delivery);
      }
      selectDelivery(delivery.id);
      Toast.success(`Found delivery #${delivery.id} [${delivery.tracking_key || delivery.id}]`);
    } catch (e) {
      Toast.error("Delivery search failed: " + e.message);
    }
  }

  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", performKeySearch);
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") performKeySearch();
    });
  }

  initMap("client-map").then((map) => {
    state.map = map;
  });

  /* Pickup/dropoff use real coordinates when the admin supplied them at
   * creation time (Delivery.pickup_lat/lng, dropoff_lat/lng); otherwise a
   * stable deterministic placeholder near Uyo, since the address text
   * itself isn't geocoded. */
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

  /* ---------------- Delivery list ---------------- */
  async function loadDeliveries() {
    try {
      const res = await API.listDeliveries(session.access);
      state.deliveries = res.results;
      renderList();
    } catch (e) {
      Toast.error("Failed to load deliveries: " + e.message);
    }
  }

  function renderList() {
    const listEl = $("delivery-list");
    if (state.deliveries.length === 0) {
      emptyState(listEl, ICONS.package, "No deliveries yet.");
      return;
    }
    listEl.innerHTML = "";
    state.deliveries.forEach((d) => {
      const selected = d.id === state.selectedId;
      const card = el(
        "div",
        `bg-surface2 rounded-lg px-3 py-2.5 cursor-pointer transition border-l-2 ${
          selected ? "border-green bg-surface2" : "border-transparent hover:bg-surface2/60"
        }`
      );
      card.innerHTML = `
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1.5">
            ${statusBadge(d.status)}
            ${d.tracking_key ? `<span class="bg-green/15 text-green text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">${d.tracking_key}</span>` : ""}
          </div>
          <span class="text-ink3 text-[10px]">${timeAgo(d.created_at)}</span>
        </div>
        <div class="text-ink2 text-xs truncate">${escapeHtml(d.pickup_location)} → ${escapeHtml(d.dropoff_location)}</div>
      `;
      card.addEventListener("click", () => selectDelivery(d.id));
      listEl.appendChild(card);
    });
  }

  function selectDelivery(id) {
    state.selectedId = id;
    renderList();
    renderActivePanel();
    setupMapForSelected();
    if (state.ws) state.ws.close();
    const d = state.deliveries.find((x) => x.id === id);
    if (d && (d.status === "accepted" || d.status === "in_transit")) {
      connectTrackingWs(id);
    }
  }

  /* ---------------- Active panel ---------------- */
  function renderActivePanel() {
    const panel = $("active-panel");
    const d = state.deliveries.find((x) => x.id === state.selectedId);
    if (!d) {
      panel.classList.add("hidden");
      return;
    }
    panel.classList.remove("hidden");

    let statusLine = "";
    if (d.status === "pending" || d.status === "accepted") {
      statusLine = `<div class="flex items-center gap-1.5 text-amber-400 text-xs"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Preparing your delivery</div>`;
    } else if (d.status === "in_transit") {
      statusLine = `<div class="flex items-center gap-1.5 text-green text-xs"><span class="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></span>Driver is on the way<span class="animate-pulse">…</span></div>`;
    } else if (d.status === "delivered") {
      statusLine = `<div class="flex items-center gap-2 text-green text-xs"><span class="scale-in">${ICONS.check.replace('width="48" height="48"', 'width="16" height="16"')}</span>Delivered successfully</div>`;
    } else if (d.status === "cancelled") {
      statusLine = `<div class="flex items-center gap-1.5 text-red-400 text-xs"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Cancelled</div>`;
    }

    let driverCardHtml = "";
    if (d.driver) {
      driverCardHtml = `
        <div class="bg-surface2/80 border border-edge rounded-lg p-3 mb-3 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-green/20 text-green flex items-center justify-center font-bold text-xs">
              ${escapeHtml(d.driver.username.charAt(0).toUpperCase())}
            </div>
            <div>
              <div class="text-ink font-semibold text-xs">${escapeHtml(d.driver.username)}</div>
              <div class="text-ink3 text-[10px]">Assigned Driver</div>
            </div>
          </div>
          ${d.driver.phone_number ? `<a href="tel:${escapeHtml(d.driver.phone_number)}" class="text-green hover:underline text-xs flex items-center gap-1 font-medium">📞 ${escapeHtml(d.driver.phone_number)}</a>` : '<span class="text-green text-xs font-semibold">Active</span>'}
        </div>
      `;
    } else {
      driverCardHtml = `
        <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-3 text-xs text-amber-400 flex items-center justify-between">
          <span>Waiting for a driver to accept...</span>
          <span class="animate-pulse font-mono text-[10px]">PENDING</span>
        </div>
      `;
    }

    panel.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <div>
          <span class="text-ink font-bold text-sm">#${d.id}</span>
          ${d.tracking_key ? `<span class="ml-2 bg-green/15 text-green text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-green/30 select-all">${d.tracking_key}</span>` : ""}
        </div>
        ${statusBadge(d.status)}
      </div>

      <div class="bg-base/60 rounded-lg p-3 mb-3 border border-edge flex flex-col gap-2">
        <div class="flex items-start gap-2 text-xs text-ink2">
          <span class="text-blue-400 font-bold shrink-0">FROM:</span><span>${escapeHtml(d.pickup_location)}</span>
        </div>
        <div class="flex items-start gap-2 text-xs text-ink2">
          <span class="text-red-400 font-bold shrink-0">TO:</span><span>${escapeHtml(d.dropoff_location)}</span>
        </div>
      </div>

      ${driverCardHtml}
      <div class="mb-4">${statusLine}</div>
      ${d.status === "delivered" ? '<div id="trip-summary-box" class="text-ink3 text-[11px] mb-4">Loading trip summary…</div>' : ""}
    `;

    if (d.status === "delivered") {
      API.tripSummary(session.access, d.id)
        .then((summary) => {
          const box = $("trip-summary-box");
          if (!box) return;
          box.className = "bg-surface2 rounded-lg px-3 py-2 text-xs text-ink2 mb-4 flex flex-col gap-1";
          box.innerHTML = `
            <div class="text-ink3 text-[10px] font-bold tracking-wider">TRIP SUMMARY</div>
            <div>Duration: ${formatDuration(parseDuration(summary.total_duration))}</div>
            <div>Started: ${new Date(summary.start_time).toLocaleTimeString()}</div>
            <div>Ended: ${new Date(summary.end_time).toLocaleTimeString()}</div>
          `;
        })
        .catch(() => {
          const box = $("trip-summary-box");
          if (box) box.textContent = "Trip summary not available yet.";
        });
    }

    const confirmBtn = el(
      "button",
      "w-full bg-green hover:bg-green-600 text-base font-bold text-sm rounded-lg py-3 transition flex items-center justify-center " +
        (d.status !== "in_transit" ? "hidden" : "")
    );
    confirmBtn.textContent = "Confirm Delivery";
    confirmBtn.addEventListener("click", () =>
      withBusyButton(confirmBtn, async () => {
        try {
          await API.confirmDelivery(session.access, d.id);
          Toast.success("Delivery confirmed!");
          await loadDeliveries();
          renderActivePanel();
        } catch (e) {
          Toast.error(e.message);
        }
      })
    );
    panel.appendChild(confirmBtn);
  }

  /* ---------------- Map ---------------- */
  function clearMapLayers() {
    if (!state.map) return;
    [state.driverMarker, state.pickupMarker, state.dropoffMarker, state.routeLine].forEach(
      (m) => m && state.map.removeLayer(m)
    );
    state.driverMarker = state.pickupMarker = state.dropoffMarker = state.routeLine = null;
  }

  async function setupMapForSelected() {
    if (!state.map) return;
    clearMapLayers();
    const d = state.deliveries.find((x) => x.id === state.selectedId);
    if (!d) return;

    const pickup = pickupCoords(d);
    const dropoff = dropoffCoords(d);
    state.pickupMarker = L.marker(pickup, { icon: pinIcon("#3B82F6") }).addTo(state.map).bindPopup("Pickup");
    state.dropoffMarker = L.marker(dropoff, { icon: pinIcon("#EF4444") }).addTo(state.map).bindPopup("Dropoff");

    if (d.status === "delivered") {
      try {
        const summary = await API.tripSummary(session.access, d.id);
        const points = (summary.route_snapshot || []).map((p) => [p.latitude, p.longitude]);
        if (points.length > 1) {
          state.routeLine = L.polyline(points, { color: "#00C896", weight: 3 }).addTo(state.map);
          state.map.fitBounds(state.routeLine.getBounds(), { padding: [60, 60] });
        } else {
          state.map.fitBounds(L.latLngBounds([pickup, dropoff]), { padding: [60, 60] });
        }
      } catch (e) {
        state.map.fitBounds(L.latLngBounds([pickup, dropoff]), { padding: [60, 60] });
      }
      state.dropoffMarker.bindPopup("Delivered ✓").openPopup();
    } else {
      state.routeLine = L.polyline([pickup, dropoff], { color: "#00C896", weight: 3, opacity: 0.6, dashArray: "6 6" }).addTo(state.map);
      state.map.fitBounds(L.latLngBounds([pickup, dropoff]), { padding: [60, 60] });

      if (d.status === "in_transit") {
        try {
          const latest = await API.latestLocation(session.access, d.id);
          if (latest && latest.latitude) {
            state.driverMarker = L.marker([latest.latitude, latest.longitude], { icon: driverMarkerIcon() }).addTo(state.map);
          }
        } catch (e) {
          /* no location yet */
        }
      }
    }
  }

  function connectTrackingWs(deliveryId) {
    state.ws = connectWS(`/ws/tracking/${deliveryId}/`, session.access, {
      onMessage: (msg) => {
        if (msg.event === "location_update" && state.selectedId === deliveryId) {
          const pos = [msg.payload.latitude, msg.payload.longitude];
          if (!state.driverMarker && state.map) {
            state.driverMarker = L.marker(pos, { icon: driverMarkerIcon() }).addTo(state.map);
          } else if (state.driverMarker) {
            animateMarkerTo(state.driverMarker, pos);
          }
          const d = state.deliveries.find((x) => x.id === deliveryId);
          if (d && d.status !== "in_transit") {
            d.status = "in_transit";
            renderList();
            renderActivePanel();
          }
        } else if (msg.event === "delivery_confirmed" && state.selectedId === deliveryId) {
          Toast.info("Delivery marked as delivered.");
          loadDeliveries().then(() => {
            renderActivePanel();
            setupMapForSelected();
          });
        }
      },
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  loadDeliveries();
  setInterval(loadDeliveries, 15000);
})();
