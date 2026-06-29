# Frontend Pages

## Dashboard (`/`)

The main landing page. Shows:
- Farm selector dropdown (filter by farm)
- Stats grid (total fields, active crops, pending tasks, alerts)
- Field status cards with color-coded moisture indication
- Quick action buttons (soil reading, irrigate, new task, AI chat)
- Recent activity feed
- Active alerts section
- Notification badge for real-time alerts via WebSocket

## Fields (`/fields.html`)

Dual-mode page with list and detail views:
- **List**: Filterable farm selector, field cards with crop name, moisture bar, health status
- **Detail**: Header with field info, three tabs:
  - **Crops**: Crop cycles + harvest records
  - **Soil**: Latest soil reading + reading history
  - **Activity**: Irrigation events + fertilization events
- Overlays for: Add Field, Add Crop Cycle, Add Soil Reading

## Soil (`/soil.html`)

Field-specific soil health monitoring:
- Field selector (URL parameter `?field_id=` pre-selects)
- Alert thresholds: moisture < 30%, pH < 5.5 or > 8.0, nutrient deficiency
- Latest reading with temperature, moisture, pH, NPK total
- NPK detail cards (N, P, K)
- Reading history (last 30 readings)
- Add Reading overlay with all soil parameters

## Plants (`/plants.html`)

Field-specific plant health monitoring:
- Current status: growth stage, canopy cover, chlorophyll, leaf area index
- Risk indicators: disease risk (0-1), pest pressure (0-1), nutrient deficiency
- Reading history
- Add Reading overlay with growth stage dropdown, range sliders

## Tasks (`/tasks.html`)

Task management:
- Filter tabs: All, Pending, In Progress, Completed
- Task cards with priority chip, status chip, field, due date
- Circular complete button for quick status update
- Floating action button to add tasks
- Add/Edit overlay with all task fields
- URL param `?action=add` opens add overlay immediately

## Irrigation (`/irrigation.html`)

Irrigation and fertilization tracking:
- Three tabs: Irrigation, Fertilization, Schedule
- Event cards with method, nutrient type, duration, volume
- Floating action button opens context-aware add overlay
- Schedule tab shows upcoming irrigation events
- Overlays: Log Irrigation, Log Fertilization, Schedule Irrigation

## AI Architect (`/chat.html`)

WebSocket-based LLM chat interface:
- Message bubbles with markdown rendering
- Suggestion chips for common queries
- Tool confirmation bar for actuator commands
- Auto-resizing textarea input
- Maintains conversation history

## Bill of Materials (`/bom.html`)

Reference page with hardware inventory:
- Cluster node status cards (live via WebSocket)
- Hardware tables: Core, Sensors, Storage, Power, Actuators, Enclosure
- Static reference (not editable via UI)
