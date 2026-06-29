
let wsClient = null;
let currentView = 'dashboard';
let appState = {
  farms: [],
  fields: [],
  cropCycles: [],
  soilReadings: [],
  plantHealthReadings: [],
  irrigationEvents: [],
  tasks: [],
  dashboard: null,
};

function navigate(view) {
  currentView = view;
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  switch (view) {
    case 'dashboard': renderDashboard(); break;
    case 'fields': renderFields(); break;
    case 'soil': renderSoil(); break;
    case 'plants': renderPlants(); break;
    case 'irrigation': renderIrrigation(); break;
    case 'chat': renderChat(); break;
    case 'bom': renderBOM(); break;
    default: renderDashboard();
  }
}

function showAlert(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const colors = {
    info: 'border-agri-green bg-agri-med',
    success: 'border-agri-green bg-agri-med',
    error: 'border-red-500 bg-agri-med',
    warning: 'border-yellow-500 bg-agri-med',
  };
  const icons = {
    info: '&#x24D8;',
    success: '&#x2713;',
    error: '&#x2717;',
    warning: '&#x26A0;',
  };
  const toast = document.createElement('div');
  toast.className = `flex items-start gap-3 px-4 py-3 rounded-lg border ${colors[type] || colors.info} shadow-lg animate-slide-in`;
  toast.innerHTML = `<span class="text-lg flex-shrink-0">${icons[type] || icons.info}</span><span class="text-sm flex-1">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

function openModal(id) {
  document.getElementById(id)?.classList.remove('hidden');
}

async function loadDashboard() {
  try {
    const data = await api.getDashboardSummary();
    appState.dashboard = data;
    return data;
  } catch (e) {
    showAlert('Failed to load dashboard: ' + e.message, 'error');
    return null;
  }
}

async function loadFarms() {
  try {
    appState.farms = await api.getFarms();
    return appState.farms;
  } catch (e) {
    showAlert('Failed to load farms: ' + e.message, 'error');
    return [];
  }
}

async function loadFields(farmId) {
  try {
    appState.fields = await api.getFields(farmId);
    return appState.fields;
  } catch (e) {
    showAlert('Failed to load fields: ' + e.message, 'error');
    return [];
  }
}

async function loadCropCycles(fieldId, status) {
  try {
    appState.cropCycles = await api.getCropCycles(fieldId, status);
    return appState.cropCycles;
  } catch (e) {
    return [];
  }
}

async function loadSoilReadings(fieldId) {
  try {
    appState.soilReadings = await api.getSoilReadings(fieldId);
    return appState.soilReadings;
  } catch (e) {
    return [];
  }
}

async function loadPlantHealth(fieldId) {
  try {
    appState.plantHealthReadings = await api.getPlantHealth(fieldId);
    return appState.plantHealthReadings;
  } catch (e) {
    return [];
  }
}

async function loadIrrigation(fieldId) {
  try {
    appState.irrigationEvents = await api.getIrrigation(fieldId);
    return appState.irrigationEvents;
  } catch (e) {
    return [];
  }
}

async function loadTasks(status, priority, fieldId) {
  try {
    appState.tasks = await api.getTasks(status, priority, fieldId);
    return appState.tasks;
  } catch (e) {
    return [];
  }
}

// ===== RENDERERS =====

function renderDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="text-center py-12"><div class="inline-block w-8 h-8 border-2 border-agri-green border-t-transparent rounded-full animate-spin"></div><p class="mt-3 text-agri-text-muted text-sm">Loading dashboard...</p></div>';

  Promise.all([loadDashboard(), loadFields(), loadTasks()]).then(() => {
    const d = appState.dashboard;
    if (!d) {
      app.innerHTML = '<div class="text-center py-12 text-agri-text-muted">No dashboard data available. Add some farms and fields to get started.</div>';
      return;
    }

    const summaryCards = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div class="bg-agri-med border border-agri-border rounded-lg p-4 hover:border-agri-green/40 transition-all">
          <div class="text-xs text-agri-text-muted uppercase tracking-wider font-medium mb-1">Total Farms</div>
          <div class="text-3xl font-bold text-agri-green">${d.total_farms}</div>
        </div>
        <div class="bg-agri-med border border-agri-border rounded-lg p-4 hover:border-agri-green/40 transition-all">
          <div class="text-xs text-agri-text-muted uppercase tracking-wider font-medium mb-1">Total Fields</div>
          <div class="text-3xl font-bold text-agri-text">${d.total_fields}</div>
        </div>
        <div class="bg-agri-med border border-agri-border rounded-lg p-4 hover:border-agri-green/40 transition-all">
          <div class="text-xs text-agri-text-muted uppercase tracking-wider font-medium mb-1">Active Crops</div>
          <div class="text-3xl font-bold text-yellow-400">${d.active_crops}</div>
        </div>
        <div class="bg-agri-med border border-agri-border rounded-lg p-4 hover:border-agri-green/40 transition-all">
          <div class="text-xs text-agri-text-muted uppercase tracking-wider font-medium mb-1">Pending Tasks</div>
          <div class="text-3xl font-bold text-agri-text">${d.pending_tasks}</div>
        </div>
        <div class="bg-agri-med border border-agri-border rounded-lg p-4 hover:border-agri-green/40 transition-all">
          <div class="text-xs text-agri-text-muted uppercase tracking-wider font-medium mb-1">Total Harvest</div>
          <div class="text-3xl font-bold text-agri-green">${(d.total_harvest_kg || 0).toFixed(0)} <span class="text-sm font-normal text-agri-text-muted">kg</span></div>
        </div>
      </div>`;

    let alertsHtml = '';
    if (d.critical_alerts > 0) {
      alertsHtml = `<div class="bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
        <span class="text-red-400 text-lg">&#x26A0;</span>
        <span class="text-sm text-red-300">${d.critical_alerts} critical task${d.critical_alerts > 1 ? 's' : ''} require immediate attention</span>
      </div>`;
    }

    const recentSoil = __HTML__.DataTable(
      ['Field', 'Time', 'Moisture', 'Temp', 'pH'],
      (d.recent_soil_readings || []).map(r => [
        r.field_name || `Field #${r.field_id}`,
        new Date(r.timestamp).toLocaleString(),
        r.moisture_pct != null ? r.moisture_pct.toFixed(1) + '%' : '-',
        r.temperature_c != null ? r.temperature_c.toFixed(1) + '°C' : '-',
        r.ph != null ? r.ph.toFixed(1) : '-',
      ])
    );

    const fieldCards = (d.field_status || []).map(f => {
      const statusColors = { healthy: 'text-agri-green', water_stress: 'text-blue-400', disease_risk: 'text-red-400', suboptimal_moisture: 'text-yellow-400' };
      const healthDots = { good: 'green', fair: 'yellow', critical: 'red', poor: 'yellow' };
      return `<div class="bg-agri-med border border-agri-border rounded-lg p-4 hover:border-agri-green/40 transition-all">
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-semibold text-sm">${f.field_name}</h4>
          ${__HTML__.StatusIndicator(healthDots[f.health] || 'yellow')}
        </div>
        <div class="text-xs text-agri-text-muted space-y-1">
          <div class="flex justify-between"><span>Crop:</span><span class="text-agri-text">${f.crop}</span></div>
          <div class="flex justify-between"><span>Moisture:</span><span class="${statusColors[f.status] || ''}">${f.moisture.toFixed(1)}%</span></div>
          <div class="flex justify-between"><span>Health:</span><span class="capitalize">${f.health}</span></div>
        </div>
      </div>`;
    }).join('');

    const tasksHtml = (d.upcoming_tasks || []).map(t => {
      const priorityColors = { critical: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-agri-text-muted' };
      return `<div class="flex items-center justify-between py-2 border-b border-agri-border last:border-0">
        <div>
          <div class="text-sm">${t.title}</div>
          <div class="text-xs text-agri-text-muted">${t.assigned_to || 'Unassigned'}${t.due_date ? ' - Due: ' + new Date(t.due_date).toLocaleDateString() : ''}</div>
        </div>
        <span class="text-xs font-medium ${priorityColors[t.priority] || ''} capitalize">${t.priority}</span>
      </div>`;
    }).join('') || '<div class="text-sm text-agri-text-muted py-2">No upcoming tasks</div>';

    app.innerHTML = `
      ${summaryCards}
      ${alertsHtml}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 class="text-lg font-semibold mb-3">Recent Soil Readings</h3>
          ${recentSoil}
        </div>
        <div>
          <h3 class="text-lg font-semibold mb-3">Upcoming Tasks</h3>
          <div class="bg-agri-med border border-agri-border rounded-lg p-4">${tasksHtml}</div>
        </div>
      </div>
      <div>
        <h3 class="text-lg font-semibold mb-3">Field Status</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">${fieldCards}</div>
      </div>`;
  });
}

function renderFields() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="text-center py-12"><div class="inline-block w-8 h-8 border-2 border-agri-green border-t-transparent rounded-full animate-spin"></div></div>';

  Promise.all([loadFarms(), loadFields()]).then(() => {
    const farms = appState.farms;
    const fields = appState.fields;

    const modalContent = `
      <form id="field-form" onsubmit="handleFieldSubmit(event)">
        ${__HTML__.FormField('Farm', 'field-farm', 'select', {
          required: true,
          options: farms.map(f => ({ value: f.id, label: f.name })),
          placeholder: 'Select farm...',
        })}
        ${__HTML__.FormField('Field Name', 'field-name', 'text', { required: true, placeholder: 'North Field' })}
        ${__HTML__.FormField('Area (hectares)', 'field-area', 'number', { required: true, step: '0.1', min: '0.1' })}
        ${__HTML__.FormField('Soil Type', 'field-soil', 'select', {
          options: [
            { value: 'clay', label: 'Clay' },
            { value: 'loam', label: 'Loam' },
            { value: 'sandy', label: 'Sandy' },
            { value: 'silt', label: 'Silt' },
            { value: 'peat', label: 'Peat' },
            { value: 'chalk', label: 'Chalk' },
            { value: 'clay_loam', label: 'Clay Loam' },
          ],
          placeholder: 'Select soil type...',
        })}
        <button type="submit" class="w-full bg-agri-green hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">Create Field</button>
      </form>`;
    const modalHtml = __HTML__.Modal('field-modal', 'New Field', modalContent);

    const farmFilterHtml = farms.length ? `<div class="mb-4 flex items-center gap-3">
      <label class="text-sm text-agri-text-muted">Filter by farm:</label>
      <select onchange="renderFieldsFilter(this.value)" class="bg-agri-dark border border-agri-border rounded-lg px-3 py-1.5 text-sm text-agri-text focus:outline-none focus:border-agri-green">
        <option value="">All Farms</option>
        ${farms.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
      </select>
    </div>` : '';

    const fieldsHtml = fields.map(f => {
      const farmName = farms.find(fa => fa.id === f.farm_id)?.name || `Farm #${f.farm_id}`;
      return `<div class="bg-agri-med border border-agri-border rounded-lg p-4 hover:border-agri-green/40 transition-all cursor-pointer" onclick="selectField(${f.id})">
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-semibold">${f.name}</h4>
          <span class="text-xs text-agri-text-muted">${f.area_hectares} ha</span>
        </div>
        <div class="text-xs text-agri-text-muted space-y-1">
          <div>Farm: ${farmName}</div>
          <div>Soil: ${f.soil_type || 'Not set'}</div>
          <div>Created: ${new Date(f.created_at).toLocaleDateString()}</div>
        </div>
      </div>`;
    }).join('') || '<div class="text-center py-8 text-agri-text-muted col-span-full">No fields yet. Add your first field above.</div>';

    const addBtn = `<button onclick="openModal('field-modal')" class="mb-4 bg-agri-green hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm inline-flex items-center gap-2">+ Add Field</button>`;

    app.innerHTML = `
      ${modalHtml}
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold">Fields &amp; Crops</h2>
        ${addBtn}
      </div>
      ${farmFilterHtml}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${fieldsHtml}</div>
      <div id="crop-cycles-panel" class="mt-8"></div>`;
  });
}

let selectedFieldId = null;

async function selectField(fieldId) {
  selectedFieldId = fieldId;
  const panel = document.getElementById('crop-cycles-panel');
  if (!panel) return;
  panel.innerHTML = '<div class="text-center py-8"><div class="inline-block w-6 h-6 border-2 border-agri-green border-t-transparent rounded-full animate-spin"></div></div>';
  try {
    const [cycles, fieldData] = await Promise.all([
      api.getCropCycles(fieldId),
      api.getField(fieldId),
    ]);
    const field = appState.fields.find(f => f.id === fieldId);
    const farmName = appState.farms.find(fa => fa.id === (field?.farm_id))?.name || '';

    const modalCropContent = `
      <form id="crop-cycle-form" onsubmit="handleCropCycleSubmit(event)">
        ${__HTML__.FormField('Crop Type', 'crop-type', 'text', { required: true, placeholder: 'Corn' })}
        ${__HTML__.FormField('Variety', 'crop-variety', 'text', { placeholder: 'DKC 62-08' })}
        ${__HTML__.FormField('Planting Date', 'crop-planting', 'date')}
        ${__HTML__.FormField('Expected Harvest Date', 'crop-harvest', 'date')}
        ${__HTML__.FormField('Status', 'crop-status', 'select', {
          options: [
            { value: 'planned', label: 'Planned' },
            { value: 'planted', label: 'Planted' },
            { value: 'growing', label: 'Growing' },
            { value: 'harvested', label: 'Harvested' },
            { value: 'failed', label: 'Failed' },
          ],
        })}
        ${__HTML__.FormField('Notes', 'crop-notes', 'textarea', { placeholder: 'Any notes...' })}
        <button type="submit" class="w-full bg-agri-green hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">Create Crop Cycle</button>
      </form>`;
    const modalCropHtml = __HTML__.Modal('crop-modal', 'New Crop Cycle', modalCropContent);

    const cyclesHtml = cycles.map(c => {
      const statusColors = { planned: 'text-blue-400', planted: 'text-yellow-400', growing: 'text-agri-green', harvested: 'text-agri-text-muted', failed: 'text-red-400' };
      return `<div class="bg-agri-med border border-agri-border rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <h5 class="font-semibold text-sm">${c.crop_type}${c.variety ? ' (' + c.variety + ')' : ''}</h5>
          <span class="text-xs font-medium ${statusColors[c.status] || ''} capitalize">${c.status}</span>
        </div>
        <div class="text-xs text-agri-text-muted space-y-1">
          ${c.planting_date ? '<div>Planted: ' + new Date(c.planting_date).toLocaleDateString() + '</div>' : ''}
          ${c.expected_harvest_date ? '<div>Expected: ' + new Date(c.expected_harvest_date).toLocaleDateString() + '</div>' : ''}
          ${c.notes ? '<div>' + c.notes + '</div>' : ''}
        </div>
      </div>`;
    }).join('') || '<div class="text-center py-8 text-agri-text-muted">No crop cycles for this field</div>';

    panel.innerHTML = `
      ${modalCropHtml}
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold">${fieldData.name || `Field #${fieldId}`} - Crop Cycles</h3>
        <button onclick="openModal('crop-modal')" class="bg-agri-green hover:bg-green-600 text-white font-medium py-1.5 px-3 rounded-lg transition-colors text-xs">+ Add Cycle</button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">${cyclesHtml}</div>`;
  } catch (e) {
    panel.innerHTML = `<div class="text-center py-8 text-red-400">Error: ${e.message}</div>`;
  }
}

function renderFieldsFilter(farmId) {
  loadFields(farmId || undefined).then(() => renderFields());
}

async function handleFieldSubmit(e) {
  e.preventDefault();
  const data = {
    farm_id: parseInt(document.getElementById('field-farm').value),
    name: document.getElementById('field-name').value.trim(),
    area_hectares: parseFloat(document.getElementById('field-area').value),
    soil_type: document.getElementById('field-soil').value || undefined,
  };
  if (!data.farm_id || !data.name || !data.area_hectares) {
    showAlert('Please fill in all required fields', 'error');
    return;
  }
  try {
    await api.createField(data);
    showAlert('Field created successfully', 'success');
    closeModal('field-modal');
    renderFields();
  } catch (e) {
    showAlert('Failed to create field: ' + e.message, 'error');
  }
}

async function handleCropCycleSubmit(e) {
  e.preventDefault();
  if (!selectedFieldId) return;
  const data = {
    field_id: selectedFieldId,
    crop_type: document.getElementById('crop-type').value.trim(),
    variety: document.getElementById('crop-variety').value.trim() || undefined,
    planting_date: document.getElementById('crop-planting').value || undefined,
    expected_harvest_date: document.getElementById('crop-harvest').value || undefined,
    status: document.getElementById('crop-status').value || 'planned',
    notes: document.getElementById('crop-notes').value.trim() || undefined,
  };
  if (!data.crop_type) {
    showAlert('Crop type is required', 'error');
    return;
  }
  try {
    await api.createCropCycle(data);
    showAlert('Crop cycle created', 'success');
    closeModal('crop-modal');
    selectField(selectedFieldId);
  } catch (e) {
    showAlert('Failed to create crop cycle: ' + e.message, 'error');
  }
}

// ===== SOIL HEALTH =====

function renderSoil() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="text-center py-12"><div class="inline-block w-8 h-8 border-2 border-agri-green border-t-transparent rounded-full animate-spin"></div></div>';

  Promise.all([loadFields(), loadSoilReadings()]).then(() => {
    const fields = appState.fields;
    const readings = appState.soilReadings;

    const fieldOpts = fields.map(f => ({ value: f.id, label: f.name }));

    const modalContent = `
      <form id="soil-form" onsubmit="handleSoilSubmit(event)">
        ${__HTML__.FormField('Field', 'soil-field', 'select', { required: true, options: fieldOpts, placeholder: 'Select field...' })}
        ${__HTML__.FormField('Temperature (°C)', 'soil-temp', 'number', { step: '0.1', placeholder: '24.5' })}
        ${__HTML__.FormField('Moisture (%)', 'soil-moisture', 'number', { step: '0.1', min: '0', max: '100', placeholder: '65.0' })}
        ${__HTML__.FormField('pH', 'soil-ph', 'number', { step: '0.1', min: '0', max: '14', placeholder: '7.0' })}
        ${__HTML__.FormField('Nitrogen (ppm)', 'soil-n', 'number', { step: '1', placeholder: '100' })}
        ${__HTML__.FormField('Phosphorus (ppm)', 'soil-p', 'number', { step: '1', placeholder: '50' })}
        ${__HTML__.FormField('Potassium (ppm)', 'soil-k', 'number', { step: '1', placeholder: '120' })}
        ${__HTML__.FormField('Organic Matter (%)', 'soil-om', 'number', { step: '0.1', placeholder: '3.5' })}
        ${__HTML__.FormField('Notes', 'soil-notes', 'textarea', { placeholder: 'Any observations...' })}
        <button type="submit" class="w-full bg-agri-green hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">Add Reading</button>
      </form>`;
    const modalHtml = __HTML__.Modal('soil-modal', 'New Soil Reading', modalContent);

    const latestByField = {};
    readings.forEach(r => {
      if (!latestByField[r.field_id] || new Date(r.timestamp) > new Date(latestByField[r.field_id].timestamp)) {
        latestByField[r.field_id] = r;
      }
    });

    const fieldCards = fields.map(f => {
      const r = latestByField[f.field_id];
      return `<div class="bg-agri-med border border-agri-border rounded-lg p-4 hover:border-agri-green/40 transition-all">
        <h4 class="font-semibold text-sm mb-3">${f.name}</h4>
        ${r ? `
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-agri-dark/50 rounded p-2"><span class="text-agri-text-muted block">Temp</span><span class="font-medium">${r.temperature_c != null ? r.temperature_c.toFixed(1) + '°C' : '-'}</span></div>
          <div class="bg-agri-dark/50 rounded p-2"><span class="text-agri-text-muted block">Moisture</span><span class="font-medium">${r.moisture_pct != null ? r.moisture_pct.toFixed(1) + '%' : '-'}</span></div>
          <div class="bg-agri-dark/50 rounded p-2"><span class="text-agri-text-muted block">pH</span><span class="font-medium">${r.ph != null ? r.ph.toFixed(1) : '-'}</span></div>
          <div class="bg-agri-dark/50 rounded p-2"><span class="text-agri-text-muted block">N-P-K</span><span class="font-medium">${r.nitrogen_ppm != null ? r.nitrogen_ppm.toFixed(0) : '-'} / ${r.phosphorus_ppm != null ? r.phosphorus_ppm.toFixed(0) : '-'} / ${r.potassium_ppm != null ? r.potassium_ppm.toFixed(0) : '-'}</span></div>
        </div>
        <div class="text-xs text-agri-text-muted mt-2">${new Date(r.timestamp).toLocaleString()}</div>` : '<div class="text-xs text-agri-text-muted">No readings yet</div>'}
      </div>`;
    }).join('');

    app.innerHTML = `
      ${modalHtml}
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold">Soil Health</h2>
        <button onclick="openModal('soil-modal')" class="bg-agri-green hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">+ Add Reading</button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">${fieldCards}</div>
      <h3 class="text-lg font-semibold mb-3">All Soil Readings</h3>
      ${__HTML__.DataTable(
        ['Field', 'Time', 'Temp', 'Moisture', 'pH', 'N', 'P', 'K'],
        readings.map(r => {
          const field = fields.find(f => f.id === r.field_id);
          return [
            field?.name || `Field #${r.field_id}`,
            new Date(r.timestamp).toLocaleString(),
            r.temperature_c != null ? r.temperature_c.toFixed(1) + '°C' : '-',
            r.moisture_pct != null ? r.moisture_pct.toFixed(1) + '%' : '-',
            r.ph != null ? r.ph.toFixed(1) : '-',
            r.nitrogen_ppm != null ? r.nitrogen_ppm.toFixed(0) : '-',
            r.phosphorus_ppm != null ? r.phosphorus_ppm.toFixed(0) : '-',
            r.potassium_ppm != null ? r.potassium_ppm.toFixed(0) : '-',
          ];
        })
      )}`;
  });
}

async function handleSoilSubmit(e) {
  e.preventDefault();
  const data = {
    field_id: parseInt(document.getElementById('soil-field').value),
    temperature_c: parseFloat(document.getElementById('soil-temp').value) || undefined,
    moisture_pct: parseFloat(document.getElementById('soil-moisture').value) || undefined,
    ph: parseFloat(document.getElementById('soil-ph').value) || undefined,
    nitrogen_ppm: parseFloat(document.getElementById('soil-n').value) || undefined,
    phosphorus_ppm: parseFloat(document.getElementById('soil-p').value) || undefined,
    potassium_ppm: parseFloat(document.getElementById('soil-k').value) || undefined,
    organic_matter_pct: parseFloat(document.getElementById('soil-om').value) || undefined,
    notes: document.getElementById('soil-notes').value.trim() || undefined,
  };
  if (!data.field_id) { showAlert('Select a field', 'error'); return; }
  try {
    await api.createSoilReading(data);
    showAlert('Soil reading recorded', 'success');
    closeModal('soil-modal');
    renderSoil();
  } catch (e) {
    showAlert('Failed: ' + e.message, 'error');
  }
}

// ===== PLANT HEALTH =====

function renderPlants() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="text-center py-12"><div class="inline-block w-8 h-8 border-2 border-agri-green border-t-transparent rounded-full animate-spin"></div></div>';

  Promise.all([loadFields(), loadPlantHealth()]).then(() => {
    const fields = appState.fields;
    const readings = appState.plantHealthReadings;
    const fieldOpts = fields.map(f => ({ value: f.id, label: f.name }));

    const modalContent = `
      <form id="plant-form" onsubmit="handlePlantSubmit(event)">
        ${__HTML__.FormField('Field', 'plant-field', 'select', { required: true, options: fieldOpts, placeholder: 'Select field...' })}
        ${__HTML__.FormField('Growth Stage', 'plant-stage', 'text', { placeholder: 'Vegetative, Flowering, etc.' })}
        ${__HTML__.FormField('Canopy Cover (%)', 'plant-canopy', 'number', { step: '0.1', min: '0', max: '100' })}
        ${__HTML__.FormField('Leaf Area Index', 'plant-lai', 'number', { step: '0.01' })}
        ${__HTML__.FormField('Chlorophyll Content', 'plant-chloro', 'number', { step: '0.1' })}
        ${__HTML__.FormField('Disease Risk (0-1)', 'plant-disease', 'number', { step: '0.01', min: '0', max: '1' })}
        ${__HTML__.FormField('Pest Pressure (0-1)', 'plant-pest', 'number', { step: '0.01', min: '0', max: '1' })}
        ${__HTML__.FormField('Nutrient Deficiency', 'plant-nutrient', 'select', {
          options: [
            { value: 'none', label: 'None' },
            { value: 'N', label: 'Nitrogen (N)' },
            { value: 'P', label: 'Phosphorus (P)' },
            { value: 'K', label: 'Potassium (K)' },
            { value: 'Mg', label: 'Magnesium (Mg)' },
            { value: 'Fe', label: 'Iron (Fe)' },
          ],
        })}
        ${__HTML__.FormField('Notes', 'plant-notes', 'textarea', { placeholder: 'Observations...' })}
        <button type="submit" class="w-full bg-agri-green hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">Add Reading</button>
      </form>`;
    const modalHtml = __HTML__.Modal('plant-modal', 'New Plant Health Reading', modalContent);

    const latestByField = {};
    readings.forEach(r => {
      if (!latestByField[r.field_id] || new Date(r.timestamp) > new Date(latestByField[r.field_id].timestamp)) {
        latestByField[r.field_id] = r;
      }
    });

    const fieldCards = fields.map(f => {
      const r = latestByField[f.field_id];
      const riskColor = r?.disease_risk != null ? (r.disease_risk > 0.7 ? 'text-red-400' : r.disease_risk > 0.4 ? 'text-yellow-400' : 'text-agri-green') : 'text-agri-text-muted';
      return `<div class="bg-agri-med border border-agri-border rounded-lg p-4 hover:border-agri-green/40 transition-all">
        <h4 class="font-semibold text-sm mb-3">${f.name}</h4>
        ${r ? `
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-agri-dark/50 rounded p-2"><span class="text-agri-text-muted block">Stage</span><span class="font-medium">${r.growth_stage || '-'}</span></div>
          <div class="bg-agri-dark/50 rounded p-2"><span class="text-agri-text-muted block">Canopy</span><span class="font-medium">${r.canopy_cover_pct != null ? r.canopy_cover_pct.toFixed(1) + '%' : '-'}</span></div>
          <div class="bg-agri-dark/50 rounded p-2"><span class="text-agri-text-muted block">LAI</span><span class="font-medium">${r.leaf_area_index != null ? r.leaf_area_index.toFixed(2) : '-'}</span></div>
          <div class="bg-agri-dark/50 rounded p-2"><span class="text-agri-text-muted block">Chlorophyll</span><span class="font-medium">${r.chlorophyll_content != null ? r.chlorophyll_content.toFixed(1) : '-'}</span></div>
          <div class="bg-agri-dark/50 rounded p-2"><span class="text-agri-text-muted block">Disease Risk</span><span class="font-medium ${riskColor}">${r.disease_risk != null ? (r.disease_risk * 100).toFixed(0) + '%' : '-'}</span></div>
          <div class="bg-agri-dark/50 rounded p-2"><span class="text-agri-text-muted block">Deficiency</span><span class="font-medium">${r.nutrient_deficiency && r.nutrient_deficiency !== 'none' ? r.nutrient_deficiency : 'None'}</span></div>
        </div>
        <div class="text-xs text-agri-text-muted mt-2">${new Date(r.timestamp).toLocaleString()}</div>` : '<div class="text-xs text-agri-text-muted">No readings yet</div>'}
      </div>`;
    }).join('');

    app.innerHTML = `
      ${modalHtml}
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold">Plant Health</h2>
        <button onclick="openModal('plant-modal')" class="bg-agri-green hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">+ Add Reading</button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">${fieldCards}</div>
      <h3 class="text-lg font-semibold mb-3">All Plant Health Readings</h3>
      ${__HTML__.DataTable(
        ['Field', 'Time', 'Stage', 'Canopy', 'LAI', 'Disease Risk', 'Deficiency'],
        readings.map(r => {
          const field = fields.find(f => f.id === r.field_id);
          return [
            field?.name || `Field #${r.field_id}`,
            new Date(r.timestamp).toLocaleString(),
            r.growth_stage || '-',
            r.canopy_cover_pct != null ? r.canopy_cover_pct.toFixed(1) + '%' : '-',
            r.leaf_area_index != null ? r.leaf_area_index.toFixed(2) : '-',
            r.disease_risk != null ? (r.disease_risk * 100).toFixed(0) + '%' : '-',
            r.nutrient_deficiency && r.nutrient_deficiency !== 'none' ? r.nutrient_deficiency : 'None',
          ];
        })
      )}`;
  });
}

async function handlePlantSubmit(e) {
  e.preventDefault();
  const data = {
    field_id: parseInt(document.getElementById('plant-field').value),
    growth_stage: document.getElementById('plant-stage').value.trim() || undefined,
    canopy_cover_pct: parseFloat(document.getElementById('plant-canopy').value) || undefined,
    leaf_area_index: parseFloat(document.getElementById('plant-lai').value) || undefined,
    chlorophyll_content: parseFloat(document.getElementById('plant-chloro').value) || undefined,
    disease_risk: parseFloat(document.getElementById('plant-disease').value) || undefined,
    pest_pressure: parseFloat(document.getElementById('plant-pest').value) || undefined,
    nutrient_deficiency: document.getElementById('plant-nutrient').value || undefined,
    notes: document.getElementById('plant-notes').value.trim() || undefined,
  };
  if (!data.field_id) { showAlert('Select a field', 'error'); return; }
  try {
    await api.createPlantHealth(data);
    showAlert('Plant health reading recorded', 'success');
    closeModal('plant-modal');
    renderPlants();
  } catch (e) {
    showAlert('Failed: ' + e.message, 'error');
  }
}

// ===== IRRIGATION =====

function renderIrrigation() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="text-center py-12"><div class="inline-block w-8 h-8 border-2 border-agri-green border-t-transparent rounded-full animate-spin"></div></div>';

  Promise.all([loadFields(), loadIrrigation()]).then(() => {
    const fields = appState.fields;
    const events = appState.irrigationEvents;
    const fieldOpts = fields.map(f => ({ value: f.id, label: f.name }));

    const modalContent = `
      <form id="irrigation-form" onsubmit="handleIrrigationSubmit(event)">
        ${__HTML__.FormField('Field', 'irr-field', 'select', { required: true, options: fieldOpts, placeholder: 'Select field...' })}
        ${__HTML__.FormField('Method', 'irr-method', 'select', { required: true, options: [
          { value: 'drip', label: 'Drip' },
          { value: 'sprinkler', label: 'Sprinkler' },
          { value: 'flood', label: 'Flood' },
          { value: 'manual', label: 'Manual' },
        ]})}
        ${__HTML__.FormField('Duration (minutes)', 'irr-duration', 'number', { step: '1', min: '1' })}
        ${__HTML__.FormField('Water Volume (liters)', 'irr-volume', 'number', { step: '1', min: '1' })}
        ${__HTML__.FormField('Source', 'irr-source', 'select', {
          options: [
            { value: 'well', label: 'Well' },
            { value: 'rainwater', label: 'Rainwater' },
            { value: 'municipal', label: 'Municipal' },
          ],
          placeholder: 'Select source...',
        })}
        ${__HTML__.FormField('Notes', 'irr-notes', 'textarea', { placeholder: 'Any notes...' })}
        <button type="submit" class="w-full bg-agri-green hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">Record Irrigation</button>
      </form>`;
    const modalHtml = __HTML__.Modal('irr-modal', 'Record Irrigation Event', modalContent);

    const eventsHtml = events.map(e => {
      const field = fields.find(f => f.id === e.field_id);
      return `<div class="bg-agri-med border border-agri-border rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-semibold text-sm">${field?.name || `Field #${e.field_id}`}</h4>
          <span class="text-xs text-agri-text-muted capitalize">${e.method}</span>
        </div>
        <div class="text-xs text-agri-text-muted space-y-1">
          <div>${new Date(e.timestamp).toLocaleString()}</div>
          ${e.duration_minutes ? '<div>Duration: ' + e.duration_minutes + ' min</div>' : ''}
          ${e.water_volume_liters ? '<div>Volume: ' + e.water_volume_liters.toFixed(0) + ' L</div>' : ''}
          ${e.source ? '<div>Source: <span class="capitalize">' + e.source + '</span></div>' : ''}
          ${e.notes ? '<div>' + e.notes + '</div>' : ''}
        </div>
      </div>`;
    }).join('') || '<div class="text-center py-8 text-agri-text-muted col-span-full">No irrigation events recorded</div>';

    app.innerHTML = `
      ${modalHtml}
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold">Irrigation</h2>
        <button onclick="openModal('irr-modal')" class="bg-agri-green hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">+ Record Event</button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${eventsHtml}</div>`;
  });
}

async function handleIrrigationSubmit(e) {
  e.preventDefault();
  const data = {
    field_id: parseInt(document.getElementById('irr-field').value),
    method: document.getElementById('irr-method').value,
    duration_minutes: parseFloat(document.getElementById('irr-duration').value) || undefined,
    water_volume_liters: parseFloat(document.getElementById('irr-volume').value) || undefined,
    source: document.getElementById('irr-source').value || undefined,
    notes: document.getElementById('irr-notes').value.trim() || undefined,
  };
  if (!data.field_id || !data.method) { showAlert('Field and method are required', 'error'); return; }
  try {
    await api.createIrrigation(data);
    showAlert('Irrigation event recorded', 'success');
    closeModal('irr-modal');
    renderIrrigation();
  } catch (e) {
    showAlert('Failed: ' + e.message, 'error');
  }
}

// ===== AI ARCHITECT (CHAT) =====

let chatMessages = [];
let chatHistory = [];
let isProcessing = false;

function renderChat() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="flex flex-col h-[calc(100vh-8rem)]">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold">AI Farm Architect</h2>
        <button onclick="clearChat()" class="text-xs text-agri-text-muted hover:text-agri-text transition-colors">Clear Chat</button>
      </div>
      <div class="flex-1 overflow-y-auto mb-4 space-y-3 pr-2" id="chat-messages">
        <div class="text-center py-4 text-agri-text-muted text-sm">Loading messages...</div>
      </div>
      <div class="flex gap-2 flex-wrap mb-3" id="suggestion-buttons"></div>
      <div class="flex gap-2">
        <input type="text" id="chat-input" placeholder="Ask the AI Architect about your farm..." class="flex-1 bg-agri-dark border border-agri-border rounded-lg px-4 py-2.5 text-agri-text focus:outline-none focus:border-agri-green focus:ring-1 focus:ring-agri-green/30 transition-colors text-sm" onkeydown="if(event.key==='Enter') sendChatMessage()">
        <button onclick="sendChatMessage()" class="bg-agri-green hover:bg-green-600 text-white font-medium px-4 py-2.5 rounded-lg transition-colors text-sm flex items-center gap-2" id="chat-send-btn">
          <span>Send</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
        </button>
      </div>
    </div>`;

  appendSystemMessage('Welcome to AgriPulse AI Architect. I can help you manage your farm, analyze sensor data, control actuators, and optimize operations. Try one of the suggestions below.');
  renderSuggestions();
  renderChatMessages();
}

function renderSuggestions() {
  const container = document.getElementById('suggestion-buttons');
  if (!container) return;
  const suggestions = [
    'What is the status of all my fields?',
    'Show me soil health summary',
    'Check for any critical alerts',
    'Summarize recent irrigation events',
    'What crops are currently growing?',
    'List pending tasks',
  ];
  container.innerHTML = suggestions.map(s =>
    `<button onclick="suggestionClicked('${s.replace(/'/g, "\\'")}')" class="text-xs bg-agri-light border border-agri-border rounded-full px-3 py-1.5 text-agri-text-muted hover:text-agri-text hover:border-agri-green/50 transition-colors">${s}</button>`
  ).join('');
}

function suggestionClicked(text) {
  document.getElementById('chat-input').value = text;
  sendChatMessage();
}

function clearChat() {
  chatMessages = [];
  chatHistory = [];
  const container = document.getElementById('chat-messages');
  if (container) container.innerHTML = '';
  appendSystemMessage('Chat cleared. How can I help you?');
}

function appendMessage(role, content) {
  chatMessages.push({ role, content, timestamp: new Date().toISOString() });
  renderChatMessages();
}

function appendSystemMessage(content) {
  appendMessage('assistant', content);
}

function renderChatMessages() {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  container.innerHTML = chatMessages.map(msg => {
    const isUser = msg.role === 'user';
    return `<div class="flex ${isUser ? 'justify-end' : 'justify-start'}">
      <div class="max-w-[80%] ${isUser ? 'bg-agri-green/20 border border-agri-green/30' : 'bg-agri-med border border-agri-border'} rounded-lg px-4 py-3">
        ${isUser ? `<div class="text-sm text-agri-text">${escapeHtml(msg.content)}</div>` : `<div class="text-sm text-agri-text prose-custom">${renderMarkdown(msg.content)}</div>`}
        <div class="text-xs text-agri-text-muted mt-1">${new Date(msg.timestamp).toLocaleTimeString()}</div>
      </div>
    </div>`;
  }).join('');
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderMarkdown(text) {
  if (!text) return '';
  let html = escapeHtml(text);
  html = html.replace(/### (.+)/g, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>');
  html = html.replace(/## (.+)/g, '<h2 class="text-lg font-bold mt-3 mb-1">$1</h2>');
  html = html.replace(/# (.+)/g, '<h1 class="text-xl font-bold mt-3 mb-1">$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-agri-dark px-1 py-0.5 rounded text-agri-green text-xs">$1</code>');
  html = html.replace(/^- (.+)/gm, '<li class="ml-4 list-disc text-agri-text">$1</li>');
  html = html.replace(/\n\n/g, '</p><p class="mb-2">');
  html = '<p class="mb-2">' + html + '</p>';
  html = html.replace(/<li>/g, '<ul class="mb-2"><li>').replace(/<\/li>(?!.*<li>)/g, '</li></ul>');
  return html;
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || isProcessing) return;
  input.value = '';
  isProcessing = true;
  const sendBtn = document.getElementById('chat-send-btn');
  if (sendBtn) sendBtn.disabled = true;

  appendMessage('user', text);
  chatHistory.push({ role: 'user', content: text });

  const loadingId = 'loading-' + Date.now();
  chatMessages.push({ role: 'assistant', content: '...', timestamp: new Date().toISOString(), _loading: true, _id: loadingId });
  renderChatMessages();

  try {
    const resp = await fetch(`${API_BASE}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: chatHistory.slice(-20) }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.detail || 'Request failed');

    const idx = chatMessages.findIndex(m => m._id === loadingId);
    if (idx !== -1) {
      chatMessages[idx] = { role: 'assistant', content: data.response || data.message || 'No response', timestamp: new Date().toISOString() };
    }
    chatHistory.push({ role: 'assistant', content: data.response || data.message || '' });
    renderChatMessages();
  } catch (e) {
    const idx = chatMessages.findIndex(m => m._id === loadingId);
    if (idx !== -1) {
      chatMessages[idx] = { role: 'assistant', content: 'Error: ' + e.message, timestamp: new Date().toISOString() };
      renderChatMessages();
    }
    showAlert('Chat error: ' + e.message, 'error');
  } finally {
    isProcessing = false;
    if (sendBtn) sendBtn.disabled = false;
    input.focus();
  }
}

// ===== BOM =====

function renderBOM() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h2 class="text-xl font-bold mb-6">Bill of Materials</h2>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-agri-med border border-agri-border rounded-lg p-5">
        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
          <span class="text-agri-green">&#x1F4BB;</span> Edge Compute
        </h3>
        <table class="w-full text-sm">
          <thead><tr class="text-agri-text-muted text-xs uppercase tracking-wider border-b border-agri-border"><th class="py-2 text-left">Component</th><th class="py-2 text-right">Qty</th><th class="py-2 text-right">Cost</th></tr></thead>
          <tbody class="divide-y divide-agri-border">
            <tr><td class="py-2">Raspberry Pi 5 (8GB)</td><td class="py-2 text-right">1</td><td class="py-2 text-right">$80.00</td></tr>
            <tr><td class="py-2">Hailo-10H NPU</td><td class="py-2 text-right">1</td><td class="py-2 text-right">$129.00</td></tr>
            <tr><td class="py-2">Global Shutter Camera</td><td class="py-2 text-right">1</td><td class="py-2 text-right">$45.00</td></tr>
            <tr><td class="py-2">Raspberry Pi Zero 2W</td><td class="py-2 text-right">2</td><td class="py-2 text-right">$30.00</td></tr>
          </tbody>
        </table>
      </div>
      <div class="bg-agri-med border border-agri-border rounded-lg p-5">
        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
          <span class="text-agri-green">&#x1F3E0;</span> Sensors
        </h3>
        <table class="w-full text-sm">
          <thead><tr class="text-agri-text-muted text-xs uppercase tracking-wider border-b border-agri-border"><th class="py-2 text-left">Component</th><th class="py-2 text-right">Qty</th><th class="py-2 text-right">Cost</th></tr></thead>
          <tbody class="divide-y divide-agri-border">
            <tr><td class="py-2">Sense HAT</td><td class="py-2 text-right">1</td><td class="py-2 text-right">$45.00</td></tr>
            <tr><td class="py-2">ADS1115 ADC Module</td><td class="py-2 text-right">1</td><td class="py-2 text-right">$14.00</td></tr>
            <tr><td class="py-2">Soil Moisture Probes</td><td class="py-2 text-right">4</td><td class="py-2 text-right">$40.00</td></tr>
            <tr><td class="py-2">pH Sensor Kit</td><td class="py-2 text-right">2</td><td class="py-2 text-right">$38.00</td></tr>
            <tr><td class="py-2">NPK Sensor (RS485)</td><td class="py-2 text-right">2</td><td class="py-2 text-right">$110.00</td></tr>
            <tr><td class="py-2">DHT22 Temp/Humidity</td><td class="py-2 text-right">3</td><td class="py-2 text-right">$18.00</td></tr>
            <tr><td class="py-2">BMP280 Pressure Sensor</td><td class="py-2 text-right">2</td><td class="py-2 text-right">$12.00</td></tr>
            <tr><td class="py-2">DS18B20 Temp Sensors</td><td class="py-2 text-right">4</td><td class="py-2 text-right">$16.00</td></tr>
            <tr><td class="py-2">Capacitive Moisture v2.0</td><td class="py-2 text-right">4</td><td class="py-2 text-right">$28.00</td></tr>
          </tbody>
        </table>
      </div>
      <div class="bg-agri-med border border-agri-border rounded-lg p-5">
        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
          <span class="text-agri-green">&#x2699;</span> Actuators &amp; Control
        </h3>
        <table class="w-full text-sm">
          <thead><tr class="text-agri-text-muted text-xs uppercase tracking-wider border-b border-agri-border"><th class="py-2 text-left">Component</th><th class="py-2 text-right">Qty</th><th class="py-2 text-right">Cost</th></tr></thead>
          <tbody class="divide-y divide-agri-border">
            <tr><td class="py-2">4-Channel Relay Module</td><td class="py-2 text-right">2</td><td class="py-2 text-right">$24.00</td></tr>
            <tr><td class="py-2">Water Pump (12V)</td><td class="py-2 text-right">1</td><td class="py-2 text-right">$35.00</td></tr>
            <tr><td class="py-2">Solenoid Valves (12V)</td><td class="py-2 text-right">4</td><td class="py-2 text-right">$48.00</td></tr>
            <tr><td class="py-2">Mister Nozzle Kit</td><td class="py-2 text-right">1</td><td class="py-2 text-right">$22.00</td></tr>
            <tr><td class="py-2">LED Grow Light Strip</td><td class="py-2 text-right">2</td><td class="py-2 text-right">$60.00</td></tr>
            <tr><td class="py-2">12V Fans (80mm)</td><td class="py-2 text-right">2</td><td class="py-2 text-right">$18.00</td></tr>
            <tr><td class="py-2">Peristaltic Dosing Pump</td><td class="py-2 text-right">1</td><td class="py-2 text-right">$42.00</td></tr>
          </tbody>
        </table>
      </div>
      <div class="bg-agri-med border border-agri-border rounded-lg p-5">
        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
          <span class="text-agri-green">&#x1F50C;</span> Power &amp; Connectivity
        </h3>
        <table class="w-full text-sm">
          <thead><tr class="text-agri-text-muted text-xs uppercase tracking-wider border-b border-agri-border"><th class="py-2 text-left">Component</th><th class="py-2 text-right">Qty</th><th class="py-2 text-right">Cost</th></tr></thead>
          <tbody class="divide-y divide-agri-border">
            <tr><td class="py-2">12V Power Supply (10A)</td><td class="py-2 text-right">1</td><td class="py-2 text-right">$28.00</td></tr>
            <tr><td class="py-2">5V Power Supply (3A)</td><td class="py-2 text-right">2</td><td class="py-2 text-right">$20.00</td></tr>
            <tr><td class="py-2">USB-C Cables</td><td class="py-2 text-right">3</td><td class="py-2 text-right">$15.00</td></tr>
            <tr><td class="py-2">RS485 to USB Adapter</td><td class="py-2 text-right">1</td><td class="py-2 text-right">$12.00</td></tr>
            <tr><td class="py-2">Breadboard &amp; Jumper Wires</td><td class="py-2 text-right">2</td><td class="py-2 text-right">$16.00</td></tr>
            <tr><td class="py-2">Ethernet Cable (Cat6)</td><td class="py-2 text-right">3</td><td class="py-2 text-right">$15.00</td></tr>
            <tr><td class="py-2">Waterproof Enclosure</td><td class="py-2 text-right">1</td><td class="py-2 text-right">$35.00</td></tr>
            <tr><td class="py-2">IP65 Junction Box</td><td class="py-2 text-right">2</td><td class="py-2 text-right">$24.00</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="bg-agri-green/10 border border-agri-green/30 rounded-lg p-5">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Total BOM Cost</h3>
        <span class="text-2xl font-bold text-agri-green">$1,004.00</span>
      </div>
      <p class="text-xs text-agri-text-muted mt-1">Estimated hardware cost per PiNet cluster node (excluding labor &amp; shipping)</p>
    </div>`;
}

// ===== INIT =====

async function init() {
  const style = document.createElement('style');
  style.textContent = `
    .nav-btn { color: #8B949E; }
    .nav-btn:hover { color: #C9D1D9; background: #21262D; }
    .nav-btn.active { color: #28A745; background: rgba(40, 167, 69, 0.1); }
    @keyframes slide-in { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
    .animate-slide-in { animation: slide-in 0.3s ease; }
    .prose-custom p { margin-bottom: 0.5rem; }
    .prose-custom ul, .prose-custom ol { margin-bottom: 0.5rem; padding-left: 1.5rem; }
    .prose-custom li { margin-bottom: 0.25rem; }
    .prose-custom code { background: #161B22; padding: 1px 4px; border-radius: 3px; font-size: 0.8em; color: #28A745; }
    .prose-custom h1, .prose-custom h2, .prose-custom h3 { margin-top: 1rem; margin-bottom: 0.5rem; }
    .prose-custom strong { color: #C9D1D9; }
  `;
  document.head.appendChild(style);

  wsClient = new api.WebSocketClient();
  wsClient.addEventListener('data', (data) => {
    if (currentView === 'dashboard') {
      const moistureEl = document.getElementById('live-moisture');
      if (moistureEl && data.telemetry) {
        moistureEl.textContent = (data.telemetry.moisture || 0).toFixed(1) + '%';
      }
    }
  });
  wsClient.addEventListener('alert', (alert) => {
    showAlert(alert.message || 'Alert received', alert.severity === 'high' ? 'error' : 'warning');
  });
  wsClient.addEventListener('chat_response', (data) => {
    if (currentView === 'chat') {
      chatMessages.push({ role: 'assistant', content: data.response || data.message || 'No response', timestamp: new Date().toISOString() });
      chatHistory.push({ role: 'assistant', content: data.response || data.message || '' });
      const loadingIdx = chatMessages.findIndex(m => m._loading);
      if (loadingIdx !== -1) chatMessages.splice(loadingIdx, 1);
      isProcessing = false;
      const sendBtn = document.getElementById('chat-send-btn');
      if (sendBtn) sendBtn.disabled = false;
      renderChatMessages();
    }
  });
  wsClient.connect();

  navigate('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
