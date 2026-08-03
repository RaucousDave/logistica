/* ==========================================================================
   Logistica Tracking test console — shared runtime.
   Loaded by every dashboard/login page before the page-specific script.
   Sections: AUTH, TOAST, API, WS (reconnecting), UI helpers, MAP.
   ========================================================================== */

/* -------------------------------------------------------------------- */
/* AUTH — single shared identity across all pages (per spec: one role   */
/* logged in at a time per browser, not independent per-dashboard).     */
/* -------------------------------------------------------------------- */
const AUTH_KEYS = {
  access: "logistica_access",
  refresh: "logistica_refresh",
  userId: "logistica_user_id",
  username: "logistica_username",
  role: "logistica_role",
};

const Auth = {
  get() {
    const access = localStorage.getItem(AUTH_KEYS.access);
    const role = localStorage.getItem(AUTH_KEYS.role);
    if (!access || !role) return null;
    return {
      access,
      refresh: localStorage.getItem(AUTH_KEYS.refresh),
      userId: localStorage.getItem(AUTH_KEYS.userId),
      username: localStorage.getItem(AUTH_KEYS.username),
      role,
    };
  },

  set({ access, refresh, user }) {
    localStorage.setItem(AUTH_KEYS.access, access);
    localStorage.setItem(AUTH_KEYS.refresh, refresh);
    localStorage.setItem(AUTH_KEYS.userId, String(user.id));
    localStorage.setItem(AUTH_KEYS.username, user.username);
    localStorage.setItem(AUTH_KEYS.role, user.role);
  },

  clear() {
    Object.values(AUTH_KEYS).forEach((k) => localStorage.removeItem(k));
  },

  /** Call at the top of every dashboard page. Redirects if not logged in
   *  as the required role. Returns the session object if it's fine to render. */
  guard(requiredRole) {
    const session = this.get();
    if (!session || session.role !== requiredRole) {
      window.location.href = `/${requiredRole}-login/`;
      return null;
    }
    return session;
  },
};

/* -------------------------------------------------------------------- */
/* TOAST — bottom-right stacked notifications                           */
/* -------------------------------------------------------------------- */
const Toast = (() => {
  const COLORS = {
    success: "border-green-500 text-green-400",
    warning: "border-amber-500 text-amber-400",
    error: "border-red-500 text-red-400",
    info: "border-blue-500 text-blue-400",
  };

  function container() {
    let el = document.getElementById("toast-container");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast-container";
      el.className = "fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end";
      document.body.appendChild(el);
    }
    return el;
  }

  function show(type, message) {
    const el = document.createElement("div");
    el.className = `bg-surface2 border ${COLORS[type] || COLORS.info} rounded-lg px-4 py-3 text-sm shadow-lg max-w-xs animate-[toast-in_0.2s_ease-out]`;
    el.textContent = message;
    container().appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity 0.3s, transform 0.3s";
      el.style.opacity = "0";
      el.style.transform = "translateX(8px)";
      setTimeout(() => el.remove(), 300);
    }, 4000);
  }

  return {
    success: (m) => show("success", m),
    warning: (m) => show("warning", m),
    error: (m) => show("error", m),
    info: (m) => show("info", m),
  };
})();

/* -------------------------------------------------------------------- */
/* API — fetch wrapper. List endpoints return DRF's paginated envelope  */
/* ({count, next, previous, results}); callers read .results.           */
/* -------------------------------------------------------------------- */
const API = (() => {
  async function request(method, path, token, body) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    let res;
    try {
      res = await fetch(path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (networkErr) {
      const err = new Error("Network error — is the server reachable?");
      err.status = 0;
      throw err;
    }
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    if (!res.ok) {
      const detail =
        (data && (data.detail || (data.username && data.username[0]) || data.non_field_errors?.[0])) ||
        (data ? JSON.stringify(data) : res.statusText) ||
        "Request failed";
      const err = new Error(detail);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  return {
    registerDriver: (body) => request("POST", "/api/auth/register/driver/", null, body),
    registerClient: (body) => request("POST", "/api/auth/register/client/", null, body),
    login: (body) => request("POST", "/api/auth/login/", null, body),
    adminLogin: (body) => request("POST", "/api/auth/admin/login/", null, body),
    setDriverAvailability: (token, isAvailable) =>
      request("POST", "/api/auth/driver/availability/", token, { is_available: isAvailable }),

    listDeliveries: (token, query = "") => request("GET", `/api/deliveries/${query}`, token),
    createDelivery: (token, body) => request("POST", "/api/deliveries/", token, body),
    acceptDelivery: (token, id) => request("POST", `/api/deliveries/${id}/accept/`, token),
    confirmDelivery: (token, id) => request("POST", `/api/deliveries/${id}/confirm/`, token),

    sendLocation: (token, body) => request("POST", "/api/location/update/", token, body),
    latestLocation: (token, deliveryId) => request("GET", `/api/location/${deliveryId}/latest/`, token),

    adminDeliveries: (token, query = "") => request("GET", `/api/admin/deliveries/${query}`, token),
    adminUsers: (token, query = "") => request("GET", `/api/admin/users/${query}`, token),
    deactivateUser: (token, userId) => request("POST", `/api/admin/users/${userId}/deactivate/`, token),
    activateUser: (token, userId) => request("POST", `/api/admin/users/${userId}/activate/`, token),

    priorityList: (token, query = "") => request("GET", `/api/admin/priority/${query}`, token),
    priorityAdd: (token, driverId) => request("POST", "/api/admin/priority/", token, { driver: driverId }),
    priorityRemove: (token, driverId) => request("DELETE", `/api/admin/priority/${driverId}/`, token),

    notifyAll: (token, deliveryId) => request("POST", `/api/admin/deliveries/${deliveryId}/notify/all/`, token),
    notifyEveryone: (token, deliveryId) =>
      request("POST", `/api/admin/deliveries/${deliveryId}/notify/everyone/`, token),
    notifyOne: (token, deliveryId, driverId) =>
      request("POST", `/api/admin/deliveries/${deliveryId}/notify/${driverId}/`, token),
    resolveConflict: (token, deliveryId, driverId) =>
      request("POST", `/api/admin/deliveries/${deliveryId}/resolve/`, token, { driver_id: driverId }),
    cancelDelivery: (token, deliveryId) => request("POST", `/api/admin/deliveries/${deliveryId}/cancel/`, token),
    adminTripSummary: (token, deliveryId) => request("GET", `/api/admin/trips/${deliveryId}/summary/`, token),

    tripSummary: (token, deliveryId) => request("GET", `/api/trips/${deliveryId}/summary/`, token),
    driverTripSummary: (token, deliveryId) => request("GET", `/api/trips/${deliveryId}/driver-summary/`, token),
  };
})();

/* -------------------------------------------------------------------- */
/* WS — WebSocket wrapper with auto-reconnect every 5s on unexpected    */
/* close, surfacing connection state through toasts + a status callback.*/
/* -------------------------------------------------------------------- */
function wsUrl(path, token) {
  const scheme = location.protocol === "https:" ? "wss" : "ws";
  return `${scheme}://${location.host}${path}?token=${encodeURIComponent(token)}`;
}

function connectWS(path, token, { onMessage, onStatus } = {}) {
  let socket = null;
  let closedByUser = false;
  let everConnected = false;
  let reconnectTimer = null;

  const setStatus = (status) => onStatus && onStatus(status);

  function open() {
    socket = new WebSocket(wsUrl(path, token));

    socket.onopen = () => {
      setStatus("connected");
      if (everConnected) Toast.success("Connected");
      everConnected = true;
    };

    socket.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        onMessage && onMessage(msg);
      } catch (e) {
        /* ignore malformed frames */
      }
    };

    socket.onclose = () => {
      setStatus("disconnected");
      if (!closedByUser) {
        Toast.warning("Reconnecting to live feed...");
        reconnectTimer = setTimeout(open, 5000);
      }
    };

    socket.onerror = () => {
      socket.close();
    };
  }

  open();

  return {
    close() {
      closedByUser = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) socket.close();
    },
  };
}

/* -------------------------------------------------------------------- */
/* UI helpers                                                            */
/* -------------------------------------------------------------------- */
function $(id) {
  return document.getElementById(id);
}

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

const SPINNER_SVG =
  '<svg class="animate-spin h-4 w-4 inline-block" viewBox="0 0 24 24" fill="none">' +
  '<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>' +
  '<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>';

/** Disables a button, swaps its label for a spinner, and guarantees it's
 *  never double-submitted while the async fn is in flight. */
async function withBusyButton(btnOrId, fn) {
  const btn = typeof btnOrId === "string" ? $(btnOrId) : btnOrId;
  if (btn.disabled) return;
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = SPINNER_SVG;
  try {
    await fn();
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

const STATUS_META = {
  pending: { dot: "bg-amber-500", text: "text-amber-400", label: "Pending", pulse: false },
  accepted: { dot: "bg-blue-500", text: "text-blue-400", label: "Accepted", pulse: false },
  in_transit: { dot: "bg-green-500", text: "text-green-400", label: "In Transit", pulse: true },
  delivered: { dot: "bg-green-500", text: "text-ink2", label: "Delivered", pulse: false },
  cancelled: { dot: "bg-red-500", text: "text-ink3", label: "Cancelled", pulse: false },
  conflict: { dot: "bg-red-500", text: "text-red-400 font-bold", label: "Conflict", pulse: true },
};

function statusBadge(status) {
  const m = STATUS_META[status] || STATUS_META.pending;
  const pulseClass = m.pulse ? "animate-pulse" : "";
  return (
    `<span class="inline-flex items-center gap-1.5 text-xs ${m.text}">` +
    `<span class="w-2 h-2 rounded-full ${m.dot} ${pulseClass}"></span>${m.label}</span>`
  );
}

function timeAgo(isoString) {
  if (!isoString) return "";
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Parses DRF's DurationField string ("[D ]HH:MM:SS[.ffffff]") into seconds. */
function parseDuration(durationStr) {
  if (!durationStr) return 0;
  const [dayPart, rest] = durationStr.includes(" ") ? durationStr.split(" ") : [null, durationStr];
  const days = dayPart ? parseInt(dayPart, 10) : 0;
  const [h, m, s] = rest.split(":").map(Number);
  return days * 86400 + h * 3600 + m * 60 + s;
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

/** Renders a centered empty-state block into a container. */
function emptyState(container, iconSvg, text) {
  container.innerHTML =
    `<div class="flex flex-col items-center justify-center text-center py-10 text-ink3">` +
    `<div class="mb-3 opacity-60">${iconSvg}</div><p class="text-sm">${text}</p></div>`;
}

const ICONS = {
  box: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
  radar:
    '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',
  users:
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
  star: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  power:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18.36 6.64a9 9 0 11-12.73 0"/><path d="M12 2v10"/></svg>',
  shield:
    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  bike: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 100-2 1 1 0 000 2zM12 17.5V14l-3-3 4-3 2 3h2"/></svg>',
  package:
    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
  pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>',
  chevron:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>',
  check:
    '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>',
  trash:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
};

/* -------------------------------------------------------------------- */
/* MAP — Leaflet on CartoDB dark tiles, centered on Uyo, Nigeria.        */
/* Initialized after a 100ms delay to dodge Leaflet's "container has no  */
/* height" bug when the container isn't visible/sized yet on first paint.*/
/* -------------------------------------------------------------------- */
const UYO_CENTER = [4.9757, 7.3986];

function initMap(containerId, { center = UYO_CENTER, zoom = 13 } = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const map = L.map(containerId, { zoomControl: true, attributionControl: false }).setView(center, zoom);
      L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png", {
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);
      resolve(map);
    }, 100);
  });
}

function pinIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2px solid #0F1117;box-shadow:0 0 6px ${color}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 14],
  });
}

function driverMarkerIcon() {
  return L.divIcon({
    className: "",
    html: '<div style="width:16px;height:16px;border-radius:50%;background:#00C896;border:2px solid #0F1117;box-shadow:0 0 12px 4px rgba(0,200,150,0.7)"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

/** Smoothly steps a Leaflet marker from its current position to a new one. */
function animateMarkerTo(marker, [lat, lng], durationMs = 1000) {
  const start = marker.getLatLng();
  const startTime = performance.now();
  function step(now) {
    const t = Math.min(1, (now - startTime) / durationMs);
    const curLat = start.lat + (lat - start.lat) * t;
    const curLng = start.lng + (lng - start.lng) * t;
    marker.setLatLng([curLat, curLng]);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
