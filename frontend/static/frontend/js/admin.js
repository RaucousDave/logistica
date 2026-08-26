(() => {
  const session = Auth.guard("admin");
  if (!session) return;

  const state = {
    tab: "deliveries",
    filter: "all",
    deliveries: [],
    driversPage: 1,
    conflictedDeliveryIds: new Set(),
    expandedId: null,
    maps: {}, // deliveryId -> {map, driverMarker}
  };

  $("admin-username").textContent = session.username;

  /* ---------------- Sidebar / tabs ---------------- */
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });

  function setTab(tab) {
    state.tab = tab;
    document.querySelectorAll(".nav-item").forEach((btn) => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle("border-green", active);
      btn.classList.toggle("text-green", active);
      btn.classList.toggle("bg-surface2", active);
      btn.classList.toggle("border-transparent", !active);
      btn.classList.toggle("text-ink2", !active);
    });
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
    $(`tab-${tab}`).classList.remove("hidden");
    $("page-title").textContent = { deliveries: "Deliveries", drivers: "Drivers", priority: "Priority List" }[tab];
    if (tab === "drivers") loadDrivers();
    if (tab === "priority") loadPriority();
  }
  setTab("deliveries");

  $("logout-btn").addEventListener("click", () => {
    Auth.clear();
    window.location.href = "/admin-login/";
  });

  /* ---------------- Clock ---------------- */
  function tickClock() {
    $("live-clock").textContent = new Date().toLocaleTimeString();
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------------- Filter pills ---------------- */
  const FILTERS = [
    ["all", "All"],
    ["pending", "Pending"],
    ["accepted", "Accepted"],
    ["in_transit", "In Transit"],
    ["delivered", "Delivered"],
    ["cancelled", "Cancelled"],
  ];
  const pillsEl = $("filter-pills");
  FILTERS.forEach(([value, label]) => {
    const pill = el(
      "button",
      "px-3 py-1.5 rounded-full border transition " +
        (value === "all" ? "bg-green text-base border-green" : "border-edge text-ink2 hover:border-ink3")
    );
    pill.textContent = label;
    pill.dataset.value = value;
    pill.addEventListener("click", () => {
      state.filter = value;
      document.querySelectorAll("#filter-pills button").forEach((p) => {
        const active = p.dataset.value === value;
        p.className =
          "px-3 py-1.5 rounded-full border transition " +
          (active ? "bg-green text-base border-green" : "border-edge text-ink2 hover:border-ink3");
      });
      renderDeliveries();
    });
    pillsEl.appendChild(pill);
  });

  /* ---------------- Hybrid Search + Select Controls ---------------- */
  let clientsList = [];
  let driversList = [];

  function setupHybridControl({ selectId, searchInputId, hiddenId, getItems }) {
    const select = $(selectId);
    const input = $(searchInputId);
    const hidden = $(hiddenId);

    if (!select || !input || !hidden) return;

    function populateSelect(filteredItems) {
      select.innerHTML = '<option value="">Select option...</option>' +
        filteredItems.map(item => `<option value="${item.id}">${escapeHtml(item.username)}</option>`).join("");
    }

    select.addEventListener("change", () => {
      const selectedId = select.value;
      hidden.value = selectedId;
      const found = getItems().find(item => String(item.id) === String(selectedId));
      if (found) {
        input.value = found.username;
      } else {
        input.value = "";
      }
    });

    input.addEventListener("input", () => {
      const query = input.value.trim().toLowerCase();
      const filtered = getItems().filter(item => item.username.toLowerCase().includes(query));
      populateSelect(filtered);
      
      const exactMatch = getItems().find(item => item.username.toLowerCase() === query);
      if (exactMatch) {
        hidden.value = exactMatch.id;
        select.value = exactMatch.id;
      } else if (filtered.length === 1) {
        hidden.value = filtered[0].id;
        select.value = filtered[0].id;
      } else {
        hidden.value = "";
        select.value = "";
      }
    });
  }

  setupHybridControl({
    selectId: "modal-client-select",
    searchInputId: "modal-client-search",
    hiddenId: "modal-client-id",
    getItems: () => clientsList,
  });

  setupHybridControl({
    selectId: "modal-driver-select",
    searchInputId: "modal-driver-search",
    hiddenId: "modal-driver-id",
    getItems: () => driversList,
  });

  async function loadClientOptions() {
    $("modal-client-search").value = "";
    $("modal-client-id").value = "";
    const select = $("modal-client-select");
    select.innerHTML = '<option value="">Loading clients...</option>';
    try {
      const res = await API.adminUsers(session.access, "?role=client&page_size=200");
      clientsList = res.results || [];
      select.innerHTML = '<option value="">Select client...</option>' +
        clientsList.map(c => `<option value="${c.id}">${escapeHtml(c.username)}</option>`).join("");
    } catch (e) {
      clientsList = [];
      select.innerHTML = '<option value="">Failed to load clients</option>';
    }
  }

  async function loadDriverOptions() {
    $("modal-driver-search").value = "";
    $("modal-driver-id").value = "";
    const select = $("modal-driver-select");
    select.innerHTML = '<option value="">Loading drivers...</option>';
    try {
      const res = await API.adminUsers(session.access, "?role=driver&page_size=200");
      driversList = res.results || [];
      select.innerHTML = '<option value="">Select driver...</option>' +
        driversList.map(d => `<option value="${d.id}">${escapeHtml(d.username)}</option>`).join("");
    } catch (e) {
      driversList = [];
      select.innerHTML = '<option value="">Failed to load drivers</option>';
    }
  }

  $("new-delivery-btn").addEventListener("click", () => {
    $("delivery-modal").classList.remove("hidden");
    $("delivery-modal").classList.add("flex");
    loadClientOptions();
  });
  $("modal-cancel").addEventListener("click", closeModal);

  document.querySelectorAll('input[name="modal-notify"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.value === "specific") {
        $("modal-driver-select-container").classList.remove("hidden");
        loadDriverOptions();
      } else {
        $("modal-driver-select-container").classList.add("hidden");
      }
    });
  });

  function closeModal() {
    $("delivery-modal").classList.add("hidden");
    $("delivery-modal").classList.remove("flex");
    $("modal-client-search").value = "";
    $("modal-client-id").value = "";
    $("modal-pickup").value = "";
    $("modal-dropoff").value = "";
    $("modal-pickup-lat").value = "";
    $("modal-pickup-lng").value = "";
    $("modal-dropoff-lat").value = "";
    $("modal-dropoff-lng").value = "";
    $("modal-msg").classList.add("hidden");
    $("modal-driver-select-container").classList.add("hidden");
    $("modal-driver-search").value = "";
    $("modal-driver-id").value = "";
    document.querySelector('input[name="modal-notify"][value="priority"]').checked = true;
  }

  $("modal-create").addEventListener("click", () => {
    withBusyButton("modal-create", async () => {
      const msg = $("modal-msg");
      const clientId = $("modal-client-id").value;
      const notifyMode = document.querySelector('input[name="modal-notify"]:checked').value;
      const notifyDriverId = $("modal-driver-id").value;

      if (!clientId) {
        msg.className = "mt-3 text-xs rounded-lg px-3 py-2 bg-red-500/10 border border-red-500/40 text-red-400";
        msg.textContent = "Please search and select a client.";
        msg.classList.remove("hidden");
        return;
      }
      if (notifyMode === "specific" && !notifyDriverId) {
        msg.className = "mt-3 text-xs rounded-lg px-3 py-2 bg-red-500/10 border border-red-500/40 text-red-400";
        msg.textContent = "Please search and select a driver to notify.";
        msg.classList.remove("hidden");
        return;
      }

      const coordPair = (latId, lngId, label) => {
        const lat = $(latId).value.trim();
        const lng = $(lngId).value.trim();
        if (!lat && !lng) return { lat: null, lng: null };
        if (!lat || !lng) throw new Error(`Provide both latitude and longitude for ${label}, or leave both empty.`);
        const nLat = Number(lat),
          nLng = Number(lng);
        if (isNaN(nLat) || nLat < -90 || nLat > 90) throw new Error(`${label} latitude must be between -90 and 90.`);
        if (isNaN(nLng) || nLng < -180 || nLng > 180) throw new Error(`${label} longitude must be between -180 and 180.`);
        return { lat: nLat, lng: nLng };
      };

      let pickupCoords, dropoffCoords;
      try {
        pickupCoords = coordPair("modal-pickup-lat", "modal-pickup-lng", "Pickup");
        dropoffCoords = coordPair("modal-dropoff-lat", "modal-dropoff-lng", "Dropoff");
      } catch (err) {
        msg.className = "mt-3 text-xs rounded-lg px-3 py-2 bg-red-500/10 border border-red-500/40 text-red-400";
        msg.textContent = err.message;
        msg.classList.remove("hidden");
        return;
      }

      try {
        const delivery = await API.createDelivery(session.access, {
          client: Number(clientId),
          pickup_location: $("modal-pickup").value,
          dropoff_location: $("modal-dropoff").value,
          pickup_lat: pickupCoords.lat,
          pickup_lng: pickupCoords.lng,
          dropoff_lat: dropoffCoords.lat,
          dropoff_lng: dropoffCoords.lng,
        });

        let notifyText = "";
        try {
          if (notifyMode === "priority") {
            await API.notifyAll(session.access, delivery.id);
            notifyText = " Notified priority drivers.";
          } else if (notifyMode === "everyone") {
            await API.notifyEveryone(session.access, delivery.id);
            notifyText = " Notified every driver.";
          } else if (notifyMode === "specific") {
            await API.notifyOne(session.access, delivery.id, Number(notifyDriverId));
            notifyText = " Driver notified.";
          }
        } catch (notifyErr) {
          notifyText = ` (created, but notify failed: ${notifyErr.message})`;
        }

        msg.className = "mt-3 text-xs rounded-lg px-3 py-2 bg-green/10 border border-green/40 text-green font-medium";
        msg.innerHTML = `Delivery created! Unique Key: <strong class="font-mono bg-green/20 px-1.5 py-0.5 rounded">${delivery.tracking_key || delivery.id}</strong>` + notifyText;
        msg.classList.remove("hidden");
        loadDeliveries();
        setTimeout(closeModal, 3000);
      } catch (e) {
        msg.className = "mt-3 text-xs rounded-lg px-3 py-2 bg-red-500/10 border border-red-500/40 text-red-400";
        msg.textContent = e.message;
        msg.classList.remove("hidden");
      }
    });
  });

  /** Fills a <select> with every registered driver by name — used by the
   *  Resolve Conflict picker, since any driver may have attempted the
   *  accept, not just priority ones. */
  async function populateDriverOptions(select) {
    try {
      const res = await API.adminUsers(session.access, "?role=driver&page_size=200");
      if (res.results.length === 0) {
        select.innerHTML = '<option value="">No drivers registered</option>';
        return;
      }
      select.innerHTML =
        '<option value="">Select driver…</option>' +
        res.results.map((drv) => `<option value="${drv.id}">${escapeHtml(drv.username)}</option>`).join("");
    } catch (e) {
      select.innerHTML = '<option value="">Failed to load drivers</option>';
    }
  }

  /* ---------------- Deliveries ---------------- */
  async function loadDeliveries() {
    try {
      const res = await API.adminDeliveries(session.access);
      state.deliveries = res.results;
      renderStats();
      renderDeliveries();
    } catch (e) {
      Toast.error("Failed to load deliveries: " + e.message);
    }
  }

  function renderStats() {
    const d = state.deliveries;
    $("stat-total").textContent = d.length;
    $("stat-active").textContent = d.filter((x) => x.status === "in_transit").length;
    $("stat-pending").textContent = d.filter((x) => x.status === "pending").length;
  }

  function bumpConflictStat() {
    const el2 = $("stat-conflicts");
    el2.textContent = state.conflictedDeliveryIds.size;
    el2.classList.add("scale-125", "text-red-400");
    setTimeout(() => el2.classList.remove("scale-125", "text-red-400"), 400);
  }

  function renderDeliveries() {
    const listEl = $("delivery-list");
    let items = state.deliveries;
    if (state.filter !== "all") items = items.filter((d) => d.status === state.filter);

    if (items.length === 0) {
      emptyState(listEl, ICONS.box, "No deliveries match this filter yet.");
      return;
    }

    listEl.innerHTML = "";
    items.forEach((d) => listEl.appendChild(renderDeliveryCard(d)));
  }

  function renderDeliveryCard(d) {
    const isConflict = state.conflictedDeliveryIds.has(d.id) && d.status === "pending";
    const badge = isConflict ? statusBadge("conflict") : statusBadge(d.status);
    const expanded = state.expandedId === d.id;

    const card = el("div", "bg-surface border border-edge rounded-card overflow-hidden" + (isConflict ? " ring-1 ring-red-500/50" : ""));
    const header = el(
      "div",
      "flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface2 transition"
    );
    header.innerHTML = `
      <div class="flex flex-col gap-0.5 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-ink3 text-[11px]">#${d.id}</span>
          ${d.tracking_key ? `<span class="bg-green/15 text-green text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-wider border border-green/30">${d.tracking_key}</span>` : ""}
        </div>
        <span class="text-ink text-sm truncate flex items-center gap-1.5 mt-0.5">
          ${escapeHtml(d.pickup_location)}
          <span class="text-green">→</span>
          ${escapeHtml(d.dropoff_location)}
        </span>
      </div>
      <div class="flex items-center gap-6 shrink-0 ml-4">
        ${badge}
        <div class="text-right hidden sm:block">
          <div class="text-ink2 text-xs">${d.driver ? escapeHtml(d.driver.username) : "Unassigned"}</div>
          <div class="text-ink3 text-[11px]">${timeAgo(d.created_at)}</div>
        </div>
        <span class="text-ink3 transition-transform ${expanded ? "rotate-90" : ""}">${ICONS.chevron}</span>
      </div>
    `;
    header.addEventListener("click", () => {
      state.expandedId = expanded ? null : d.id;
      renderDeliveries();
    });
    card.appendChild(header);

    const panelWrap = el("div", "accordion-panel" + (expanded ? " open" : ""));
    const panelInner = el("div", "");
    panelInner.appendChild(renderDeliveryDetail(d, isConflict));
    panelWrap.appendChild(panelInner);
    card.appendChild(panelWrap);

    return card;
  }

  function renderDeliveryDetail(d, isConflict) {
    const wrap = el("div", "px-5 pb-5 border-t border-edge pt-4 flex flex-col gap-4");

    const infoGrid = el("div", "grid grid-cols-2 gap-3 text-xs text-ink2");
    infoGrid.innerHTML = `
      <div><span class="text-ink3">Tracking Key:</span> <strong class="font-mono text-green font-bold select-all">${d.tracking_key || d.id}</strong></div>
      <div><span class="text-ink3">Client:</span> ${d.client.username}</div>
      <div><span class="text-ink3">Driver:</span> ${d.driver ? d.driver.username : "—"}</div>
      <div><span class="text-ink3">Created:</span> ${new Date(d.created_at).toLocaleString()}</div>
    `;
    wrap.appendChild(infoGrid);

    if (isConflict) {
      const banner = el(
        "div",
        "bg-red-500/10 border border-red-500/40 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-2"
      );
      banner.innerHTML = `<span class="text-red-400 text-xs flex-1">⚠ Accept conflict — two drivers attempted to accept simultaneously.</span>`;
      const select = el("select", "bg-base border border-edge rounded px-2 py-1 text-xs text-ink max-w-[160px]");
      select.innerHTML = '<option value="">Loading drivers…</option>';
      populateDriverOptions(select);
      const resolveBtn = el("button", "bg-green hover:bg-green-600 text-base text-xs font-semibold rounded px-3 py-1.5 whitespace-nowrap");
      resolveBtn.textContent = "Resolve";
      resolveBtn.addEventListener("click", () =>
        withBusyButton(resolveBtn, async () => {
          if (!select.value) {
            Toast.warning("Select a driver first.");
            return;
          }
          try {
            await API.resolveConflict(session.access, d.id, Number(select.value));
            state.conflictedDeliveryIds.delete(d.id);
            bumpConflictStat();
            Toast.success(`Delivery #${d.id} resolved`);
            loadDeliveries();
          } catch (e) {
            Toast.error(e.message);
          }
        })
      );
      banner.append(select, resolveBtn);
      wrap.appendChild(banner);
    }

    if (d.status === "pending") {
      const row = el("div", "flex flex-wrap items-center gap-2");
      const notifyAllBtn = el("button", "bg-green hover:bg-green-600 text-base text-xs font-semibold rounded-lg px-3 py-1.5");
      notifyAllBtn.textContent = "Notify All Priority Drivers";
      notifyAllBtn.addEventListener("click", () =>
        withBusyButton(notifyAllBtn, async () => {
          try {
            const res = await API.notifyAll(session.access, d.id);
            Toast.success(res.detail);
          } catch (e) {
            Toast.error(e.message);
          }
        })
      );
      const driverSelect = el("select", "bg-base border border-edge rounded px-2 py-1.5 text-xs text-ink max-w-[180px]");
      driverSelect.innerHTML = '<option value="">Loading drivers…</option>';
      populateDriverOptions(driverSelect);
      const notifyOneBtn = el("button", "border border-edge hover:bg-surface2 text-ink2 text-xs font-medium rounded-lg px-3 py-1.5");
      notifyOneBtn.textContent = "Notify Driver";
      notifyOneBtn.addEventListener("click", () =>
        withBusyButton(notifyOneBtn, async () => {
          if (!driverSelect.value) {
            Toast.warning("Select a driver first.");
            return;
          }
          try {
            await API.notifyOne(session.access, d.id, Number(driverSelect.value));
            Toast.success("Notification sent");
          } catch (e) {
            Toast.error(e.message);
          }
        })
      );
      row.append(notifyAllBtn, driverSelect, notifyOneBtn);
      wrap.appendChild(row);
    }

    if (d.status === "pending" || d.status === "accepted") {
      const cancelBtn = el("button", "self-start border border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs font-medium rounded-lg px-3 py-1.5");
      cancelBtn.textContent = "Cancel Delivery";
      cancelBtn.addEventListener("click", () =>
        withBusyButton(cancelBtn, async () => {
          try {
            await API.cancelDelivery(session.access, d.id);
            Toast.success(`Delivery #${d.id} cancelled`);
            loadDeliveries();
          } catch (e) {
            Toast.error(e.message);
          }
        })
      );
      wrap.appendChild(cancelBtn);
    }

    if (d.status === "in_transit") {
      const mapDiv = el("div", "rounded-lg overflow-hidden border border-edge", "");
      mapDiv.style.height = "280px";
      const mapId = `map-${d.id}`;
      mapDiv.id = mapId;
      wrap.appendChild(mapDiv);
      setupDeliveryMap(mapId, d);
    }

    if (d.status === "delivered") {
      const summaryBtn = el("button", "self-start border border-edge hover:bg-surface2 text-ink2 text-xs font-medium rounded-lg px-3 py-1.5");
      summaryBtn.textContent = "View Trip Summary";
      const summaryBox = el("div", "hidden bg-surface2 rounded-lg px-3 py-2 text-xs text-ink2 flex-col gap-1");
      summaryBtn.addEventListener("click", () =>
        withBusyButton(summaryBtn, async () => {
          try {
            const summary = await API.adminTripSummary(session.access, d.id);
            summaryBox.innerHTML = `
              <div>Duration: ${formatDuration(parseDuration(summary.total_duration))}</div>
              <div>Started: ${new Date(summary.start_time).toLocaleString()}</div>
              <div>Ended: ${new Date(summary.end_time).toLocaleString()}</div>
              <div>GPS points recorded: ${(summary.route_snapshot || []).length}</div>
            `;
            summaryBox.classList.remove("hidden");
            summaryBox.classList.add("flex");
          } catch (e) {
            Toast.error("Trip summary not available: " + e.message);
          }
        })
      );
      wrap.append(summaryBtn, summaryBox);
    }

    return wrap;
  }

  /* Pickup/dropoff use real coordinates when the admin supplied them at
   * creation time; otherwise a stable deterministic placeholder near Uyo,
   * since the address text itself isn't geocoded. */
  function placeholderCoords(deliveryId, salt) {
    const seed = deliveryId * 97 + salt;
    const dLat = (((seed * 7) % 40) - 20) / 1500;
    const dLng = (((seed * 13) % 40) - 20) / 1500;
    return [UYO_CENTER[0] + dLat, UYO_CENTER[1] + dLng];
  }

  async function setupDeliveryMap(mapId, delivery) {
    if (state.maps[delivery.id]) return; // already initialized
    const map = await initMap(mapId, { zoom: 13 });
    const driverMarker = L.marker(UYO_CENTER, { icon: driverMarkerIcon() }).addTo(map);
    const pickup = delivery.pickup_lat != null ? [delivery.pickup_lat, delivery.pickup_lng] : placeholderCoords(delivery.id, 1);
    const dropoff = delivery.dropoff_lat != null ? [delivery.dropoff_lat, delivery.dropoff_lng] : placeholderCoords(delivery.id, 2);
    L.marker(pickup, { icon: pinIcon("#3B82F6") }).addTo(map).bindPopup("Pickup");
    L.marker(dropoff, { icon: pinIcon("#EF4444") }).addTo(map).bindPopup("Dropoff");
    state.maps[delivery.id] = { map, driverMarker };

    try {
      const latest = await API.latestLocation(session.access, delivery.id);
      if (latest && latest.latitude) {
        driverMarker.setLatLng([latest.latitude, latest.longitude]);
        map.setView([latest.latitude, latest.longitude], 14);
      } else {
        map.fitBounds(L.latLngBounds([pickup, dropoff]), { padding: [40, 40] });
      }
    } catch (e) {
      map.fitBounds(L.latLngBounds([pickup, dropoff]), { padding: [40, 40] });
    }
  }

  /* ---------------- Drivers tab ---------------- */
  async function loadDrivers(page = 1) {
    state.driversPage = page;
    try {
      const [driversRes, priorityRes] = await Promise.all([
        API.adminUsers(session.access, `?role=driver&page=${page}`),
        API.priorityList(session.access, "?page_size=200"),
      ]);
      const priorityIds = new Set(priorityRes.results.map((p) => p.driver.id));
      renderDrivers(driversRes.results, priorityIds);
      renderDriversPagination(driversRes);
    } catch (e) {
      Toast.error("Failed to load drivers: " + e.message);
    }
  }

  function renderDrivers(drivers, priorityIds) {
    const tbody = $("drivers-tbody");
    if (drivers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-10"></td></tr>`;
      emptyState(tbody.querySelector("td"), ICONS.users, "No drivers registered yet.");
      return;
    }
    tbody.innerHTML = "";
    drivers.forEach((driver, i) => {
      const isPriority = priorityIds.has(driver.id);
      const row = el("tr", i % 2 === 0 ? "" : "bg-base/30");
      row.innerHTML = `
        <td class="px-5 py-3 text-ink">${escapeHtml(driver.username)}</td>
        <td class="px-5 py-3 text-ink2">${driver.phone_number || "—"}</td>
        <td class="px-5 py-3">
          <span class="inline-flex items-center gap-1.5 text-xs ${driver.is_active ? "text-green" : "text-red-400"}">
            <span class="w-2 h-2 rounded-full ${driver.is_active ? "bg-green" : "bg-red-500"}"></span>
            ${driver.is_active ? "Active" : "Inactive"}
          </span>
        </td>
        <td class="px-5 py-3">
          <span class="inline-flex items-center gap-1.5 text-xs ${driver.is_available ? "text-green" : "text-ink3"}">
            <span class="w-2 h-2 rounded-full ${driver.is_available ? "bg-green" : "bg-ink3"}"></span>
            ${driver.is_available ? "On Duty" : "Off Duty"}
          </span>
        </td>
        <td class="px-5 py-3">${isPriority ? '<span class="bg-green/15 text-green text-[10px] font-bold px-2 py-0.5 rounded-full">Priority</span>' : ""}</td>
      `;
      const actionsTd = el("td", "px-5 py-3 text-right");
      const actionsWrap = el("div", "flex items-center justify-end gap-2");

      const starBtn = el(
        "button",
        `p-1.5 rounded hover:bg-surface2 ${isPriority ? "text-green" : "text-ink3"}`,
        ICONS.star
      );
      starBtn.title = isPriority ? "Remove from priority list" : "Add to priority list";
      starBtn.addEventListener("click", () =>
        withBusyButton(starBtn, async () => {
          try {
            if (isPriority) {
              await API.priorityRemove(session.access, driver.id);
              Toast.success(`${driver.username} removed from priority list`);
            } else {
              await API.priorityAdd(session.access, driver.id);
              Toast.success(`${driver.username} added to priority list`);
            }
            loadDrivers(state.driversPage);
          } catch (e) {
            Toast.error(e.message);
          }
        })
      );

      const powerBtn = el(
        "button",
        `p-1.5 rounded hover:bg-surface2 ${driver.is_active ? "text-green" : "text-red-400"}`,
        ICONS.power
      );
      powerBtn.title = driver.is_active ? "Deactivate driver" : "Activate driver";
      powerBtn.addEventListener("click", () =>
        withBusyButton(powerBtn, async () => {
          try {
            if (driver.is_active) {
              await API.deactivateUser(session.access, driver.id);
              Toast.warning(`${driver.username} deactivated`);
            } else {
              await API.activateUser(session.access, driver.id);
              Toast.success(`${driver.username} activated`);
            }
            loadDrivers(state.driversPage);
          } catch (e) {
            Toast.error(e.message);
          }
        })
      );

      actionsWrap.append(starBtn, powerBtn);
      actionsTd.appendChild(actionsWrap);
      row.appendChild(actionsTd);
      tbody.appendChild(row);
    });
  }

  function renderDriversPagination(res) {
    const wrap = $("drivers-pagination");
    wrap.innerHTML = "";
    if (!res.next && !res.previous) return;
    if (res.previous) {
      const prev = el("button", "px-3 py-1 border border-edge rounded text-ink2 hover:bg-surface2");
      prev.textContent = "Previous";
      prev.addEventListener("click", () => loadDrivers(state.driversPage - 1));
      wrap.appendChild(prev);
    }
    if (res.next) {
      const next = el("button", "px-3 py-1 border border-edge rounded text-ink2 hover:bg-surface2");
      next.textContent = "Next";
      next.addEventListener("click", () => loadDrivers(state.driversPage + 1));
      wrap.appendChild(next);
    }
  }

  /* ---------------- Priority tab ---------------- */
  async function loadPriority() {
    try {
      const res = await API.priorityList(session.access, "?page_size=200");
      renderPriority(res.results);
    } catch (e) {
      Toast.error("Failed to load priority list: " + e.message);
    }
  }

  function renderPriority(items) {
    const wrap = $("priority-list");
    if (items.length === 0) {
      emptyState(wrap, ICONS.users, "No priority drivers added yet. Go to Drivers tab to add some.");
      return;
    }
    wrap.innerHTML = "";
    items.forEach((entry) => {
      const row = el("div", "bg-surface border border-edge rounded-lg px-4 py-3 flex items-center justify-between");
      row.innerHTML = `
        <span class="text-ink text-sm">${escapeHtml(entry.driver.username)}</span>
        <span class="text-ink3 text-xs">Added by ${escapeHtml(entry.added_by.username)} · ${new Date(entry.created_at).toLocaleDateString()}</span>
      `;
      const trashBtn = el("button", "text-red-400 hover:text-red-300 p-1.5", ICONS.trash);
      trashBtn.addEventListener("click", () => {
        row.innerHTML = "";
        const confirmBar = el("div", "flex items-center justify-between w-full text-xs");
        confirmBar.innerHTML = `<span class="text-ink2">Remove ${escapeHtml(entry.driver.username)} from priority list?</span>`;
        const btns = el("div", "flex gap-2");
        const yesBtn = el("button", "text-red-400 hover:underline");
        yesBtn.textContent = "Remove";
        yesBtn.addEventListener("click", async () => {
          try {
            await API.priorityRemove(session.access, entry.driver.id);
            Toast.success("Removed from priority list");
            loadPriority();
          } catch (e) {
            Toast.error(e.message);
          }
        });
        const noBtn = el("button", "text-ink2 hover:underline");
        noBtn.textContent = "Keep";
        noBtn.addEventListener("click", () => renderPriority(items));
        btns.append(yesBtn, noBtn);
        confirmBar.appendChild(btns);
        row.appendChild(confirmBar);
      });
      row.appendChild(trashBtn);
      wrap.appendChild(row);
    });
  }

  /* ---------------- Conflict banner ---------------- */
  function showConflictBanner(deliveryId) {
    const container = $("conflict-banner-container");
    if (document.getElementById(`conflict-banner-${deliveryId}`)) return;
    const banner = el(
      "div",
      "absolute top-0 left-0 right-0 z-40 bg-red-500 text-white text-sm px-6 py-3 flex items-center justify-between animate-[slide-down_0.3s_ease-out]"
    );
    banner.id = `conflict-banner-${deliveryId}`;
    banner.innerHTML = `<span>⚠ Accept Conflict — Delivery #${deliveryId}. Two drivers attempted to accept simultaneously. Resolve now.</span>`;
    const btns = el("div", "flex items-center gap-3");
    const resolveBtn = el("button", "bg-white text-red-600 font-semibold rounded px-3 py-1 text-xs");
    resolveBtn.textContent = "Resolve";
    resolveBtn.addEventListener("click", () => {
      setTab("deliveries");
      state.filter = "pending";
      document.querySelector('#filter-pills button[data-value="pending"]').click();
      state.expandedId = deliveryId;
      renderDeliveries();
      banner.remove();
    });
    const dismissBtn = el("button", "text-white/80 hover:text-white text-lg leading-none");
    dismissBtn.innerHTML = "&times;";
    dismissBtn.addEventListener("click", () => banner.remove());
    btns.append(resolveBtn, dismissBtn);
    banner.appendChild(btns);
    container.appendChild(banner);
  }

  /* ---------------- WebSocket ---------------- */
  connectWS("/ws/admin/", session.access, {
    onStatus: (status) => {
      const connected = status === "connected";
      $("ws-dot").className = `w-2 h-2 rounded-full ${connected ? "bg-green animate-pulse" : "bg-red-500"}`;
      $("ws-label").textContent = connected ? "Live" : "Disconnected";
    },
    onMessage: (msg) => {
      if (msg.event === "conflict_alert") {
        state.conflictedDeliveryIds.add(msg.payload.delivery_id);
        bumpConflictStat();
        showConflictBanner(msg.payload.delivery_id);
        renderDeliveries();
      } else if (msg.event === "job_taken") {
        state.conflictedDeliveryIds.delete(msg.payload.delivery_id);
        document.getElementById(`conflict-banner-${msg.payload.delivery_id}`)?.remove();
        loadDeliveries();
      }
    },
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  /* ---------------- Boot ---------------- */
  loadDeliveries();
  setInterval(loadDeliveries, 15000);
})();
