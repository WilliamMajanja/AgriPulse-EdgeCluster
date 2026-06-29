const API_BASE = '';

const api = {
  async _fetch(method, path, data = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    };
    if (data) opts.body = JSON.stringify(data);
    try {
      const res = await fetch(`${API_BASE}${path}`, opts);
      if (res.status === 204) return null;
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail || `HTTP ${res.status}`);
      return body;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Network error - is the server running?');
      }
      throw err;
    }
  },

  // Farms
  getFarms: () => api._fetch('GET', '/api/v1/farms/'),
  getFarm: (id) => api._fetch('GET', `/api/v1/farms/${id}`),
  createFarm: (d) => api._fetch('POST', '/api/v1/farms/', d),
  updateFarm: (id, d) => api._fetch('PUT', `/api/v1/farms/${id}`, d),
  deleteFarm: (id) => api._fetch('DELETE', `/api/v1/farms/${id}`),

  // Fields
  getFields: (farmId) => api._fetch('GET', `/api/v1/fields/${farmId ? `?farm_id=${farmId}` : ''}`),
  getField: (id) => api._fetch('GET', `/api/v1/fields/${id}`),
  createField: (d) => api._fetch('POST', '/api/v1/fields/', d),
  updateField: (id, d) => api._fetch('PUT', `/api/v1/fields/${id}`, d),
  deleteField: (id) => api._fetch('DELETE', `/api/v1/fields/${id}`),

  // Crop Cycles
  getCropCycles: (fieldId, status) => {
    let p = '/api/v1/crop-cycles/';
    const q = [];
    if (fieldId) q.push(`field_id=${fieldId}`);
    if (status) q.push(`status=${status}`);
    if (q.length) p += '?' + q.join('&');
    return api._fetch('GET', p);
  },
  createCropCycle: (d) => api._fetch('POST', '/api/v1/crop-cycles/', d),
  updateCropCycle: (id, d) => api._fetch('PUT', `/api/v1/crop-cycles/${id}`, d),
  deleteCropCycle: (id) => api._fetch('DELETE', `/api/v1/crop-cycles/${id}`),

  // Soil Readings
  getSoilReadings: (fieldId, start, end) => {
    let p = '/api/v1/soil-readings/';
    const q = [];
    if (fieldId) q.push(`field_id=${fieldId}`);
    if (start) q.push(`start=${start}`);
    if (end) q.push(`end=${end}`);
    if (q.length) p += '?' + q.join('&');
    return api._fetch('GET', p);
  },
  getLatestSoilReading: (fieldId) => api._fetch('GET', `/api/v1/soil-readings/latest/${fieldId}`),
  createSoilReading: (d) => api._fetch('POST', '/api/v1/soil-readings/', d),

  // Plant Health
  getPlantHealth: (fieldId, start, end) => {
    let p = '/api/v1/plant-health/';
    const q = [];
    if (fieldId) q.push(`field_id=${fieldId}`);
    if (start) q.push(`start=${start}`);
    if (end) q.push(`end=${end}`);
    if (q.length) p += '?' + q.join('&');
    return api._fetch('GET', p);
  },
  getLatestPlantHealth: (fieldId) => api._fetch('GET', `/api/v1/plant-health/latest/${fieldId}`),
  createPlantHealth: (d) => api._fetch('POST', '/api/v1/plant-health/', d),

  // Irrigation
  getIrrigation: (fieldId) => api._fetch('GET', `/api/v1/irrigation/${fieldId ? `?field_id=${fieldId}` : ''}`),
  createIrrigation: (d) => api._fetch('POST', '/api/v1/irrigation/', d),
  scheduleIrrigation: (d) => api._fetch('POST', '/api/v1/irrigation/schedule', d),

  // Fertilization
  getFertilization: (fieldId) => api._fetch('GET', `/api/v1/fertilization/${fieldId ? `?field_id=${fieldId}` : ''}`),
  createFertilization: (d) => api._fetch('POST', '/api/v1/fertilization/', d),

  // Harvests
  getHarvests: (fieldId, cropCycleId) => {
    let p = '/api/v1/harvests/';
    const q = [];
    if (fieldId) q.push(`field_id=${fieldId}`);
    if (cropCycleId) q.push(`crop_cycle_id=${cropCycleId}`);
    if (q.length) p += '?' + q.join('&');
    return api._fetch('GET', p);
  },
  createHarvest: (d) => api._fetch('POST', '/api/v1/harvests/', d),
  updateHarvest: (id, d) => api._fetch('PUT', `/api/v1/harvests/${id}`, d),

  // Tasks
  getTasks: (status, priority, fieldId) => {
    let p = '/api/v1/tasks/';
    const q = [];
    if (status) q.push(`status=${status}`);
    if (priority) q.push(`priority=${priority}`);
    if (fieldId) q.push(`field_id=${fieldId}`);
    if (q.length) p += '?' + q.join('&');
    return api._fetch('GET', p);
  },
  createTask: (d) => api._fetch('POST', '/api/v1/tasks/', d),
  updateTask: (id, d) => api._fetch('PUT', `/api/v1/tasks/${id}`, d),
  deleteTask: (id) => api._fetch('DELETE', `/api/v1/tasks/${id}`),

  // Onboarding
  onboardConfirm: (data) => api._fetch('POST', '/api/v1/farms/onboard/confirm', data),

  // Dashboard
  getDashboardSummary: () => api._fetch('GET', '/api/v1/dashboard/summary'),
  getDashboardAlerts: () => api._fetch('GET', '/api/v1/dashboard/alerts'),
  getWeather: (fieldId) => api._fetch('GET', `/api/v1/dashboard/weather/${fieldId}`),
};

// ─── Toast Notification System ───
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { info: 'ℹ️', warning: '⚠️', error: '❌', success: '✅' };
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 4000);
}

// ─── Loading Spinner ───
function showLoading(container) {
  container.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;padding:40px;gap:12px"><div class="spinner"></div><span class="text-muted text-sm">Loading...</span></div>';
}

// ─── Format Helpers ───
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function fmtDateTime(iso) {
  if (!iso) return '—';
  return `${fmtDate(iso)} ${fmtTime(iso)}`;
}
function fmtNum(n, d = 1) {
  if (n == null) return '—';
  return Number(n).toFixed(d);
}
function pctClass(val, low = 30, high = 80) {
  if (val == null) return '';
  if (val < low) return 'chip-red';
  if (val > high) return 'chip-yellow';
  return 'chip-green';
}
function statusClass(s) {
  if (s === 'online' || s === 'completed' || s === 'healthy' || s === 'harvested') return 'chip-green';
  if (s === 'warning' || s === 'in_progress' || s === 'growing') return 'chip-yellow';
  if (s === 'offline' || s === 'failed' || s === 'pending') return 'chip-gray';
  if (s === 'critical' || s === 'Leaf Rust') return 'chip-red';
  return 'chip-gray';
}

// ─── WebSocket Client ───
class WsClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxDelay = 30000;
    this.listeners = {};
    this._shouldReconnect = true;
  }
  on(event, fn) {
    (this.listeners[event] ||= []).push(fn);
    return () => { this.listeners[event] = this.listeners[event]?.filter(f => f !== fn); };
  }
  _emit(event, data) { this.listeners[event]?.forEach(fn => fn(data)); }
  connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${location.host}/ws`;
    this._shouldReconnect = true;
    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      console.error('WebSocket connection failed:', e);
      this._scheduleReconnect();
      return;
    }
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.ws.send(JSON.stringify({ action: 'subscribe' }));
      this._emit('connected');
    };
    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'data') this._emit('data', msg);
        else if (msg.type === 'alert') this._emit('alert', msg.alert);
        else if (msg.type === 'chat_response') this._emit('chat_response', msg);
        else if (msg.type === 'onboard_thought') this._emit('onboard_thought', msg);
        else if (msg.type === 'onboard_template') this._emit('onboard_template', msg.data);
        else if (msg.type === 'onboard_error') this._emit('onboard_error', msg);
        else if (msg.type === 'tool_result') this._emit('tool_result', msg);
      } catch (err) { console.error('WS parse error:', err); }
    };
    this.ws.onclose = () => {
      this._emit('disconnected');
      if (this._shouldReconnect) this._scheduleReconnect();
    };
    this.ws.onerror = () => { this.ws?.close(); };
  }
  disconnect() {
    this._shouldReconnect = false;
    this.ws?.close();
    this.ws = null;
  }
  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }
  chat(messages) { return this.send({ action: 'chat', messages }); }
  execTool(name, args) { return this.send({ action: 'exec_tool', name, args }); }
  onboard(spec) {
    if (!this.send({ action: 'onboard', spec: spec })) {
      this._emit('onboard_error', { detail: 'Not connected to server. Please wait and try again.' });
      return false;
    }
    return true;
  }
  _scheduleReconnect() {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxDelay);
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), delay);
  }
}

// ─── Initialize WebSocket on all pages ───
const ws = new WsClient();
ws.on('alert', (alert) => showToast(alert.message, alert.type === 'warning' ? 'warning' : 'info'));
document.addEventListener('DOMContentLoaded', () => ws.connect());
