# API Reference

Base URL: `http://host:8000/api/v1`

All endpoints return JSON. Standard CRUD follows REST conventions.

## Farms

### List Farms
```
GET /farms/
```
Returns all farms ordered by creation date (newest first).

### Create Farm
```
POST /farms/
```
```json
{ "name": "Green Acres", "latitude": 44.052, "longitude": -123.086 }
```

### Get Farm
```
GET /farms/{id}
```
Returns farm details with `fields_count`.

### Update Farm
```
PUT /farms/{id}
```

### Delete Farm
```
DELETE /farms/{id}
```

## Fields

### List Fields
```
GET /fields/?farm_id={farm_id}
```
Returns fields, optionally filtered by farm.

### Create Field
```
POST /fields/
```
```json
{ "farm_id": 1, "name": "North Field", "area_hectares": 5.2, "soil_type": "loam" }
```

Soil types: `clay`, `loam`, `sandy`, `silt`, `peat`, `chalk`, `clay_loam`

### Get Field
```
GET /fields/{id}
```
Returns field with `latest_soil_reading`, `active_crop`, `total_harvest_kg`.

### Update / Delete Field
```
PUT /fields/{id}
DELETE /fields/{id}
```

## Crop Cycles

### List
```
GET /crop-cycles/?field_id={id}&status=growing
```

### Create
```
POST /crop-cycles/
```
```json
{ "field_id": 1, "crop_type": "Tomato", "variety": "Brandywine", "status": "planned" }
```

Statuses: `planned`, `planted`, `growing`, `harvested`, `failed`

### Get / Update / Delete
```
GET /crop-cycles/{id}
PUT /crop-cycles/{id}
DELETE /crop-cycles/{id}
```

## Soil Readings

### List
```
GET /soil-readings/?field_id={id}&start={iso_datetime}&end={iso_datetime}
```

### Create
```
POST /soil-readings/
```
```json
{
  "field_id": 1,
  "temperature_c": 22.5,
  "moisture_pct": 65.0,
  "ph": 6.8,
  "nitrogen_ppm": 100,
  "phosphorus_ppm": 50,
  "potassium_ppm": 120,
  "organic_matter_pct": 3.5,
  "cation_exchange_capacity": 15.0,
  "microbial_activity": 0.75
}
```

### Get Latest
```
GET /soil-readings/latest/{field_id}
```

### Delete
```
DELETE /soil-readings/{id}
```

## Plant Health

### List
```
GET /plant-health/?field_id={id}&start={iso_datetime}&end={iso_datetime}
```

### Create
```
POST /plant-health/
```
```json
{
  "field_id": 1,
  "growth_stage": "flowering",
  "canopy_cover_pct": 85.0,
  "leaf_area_index": 4.2,
  "chlorophyll_content": 45.0,
  "disease_risk": 0.15,
  "pest_pressure": 0.05,
  "nutrient_deficiency": "none"
}
```

Nutrient deficiencies: `none`, `N`, `P`, `K`, `Mg`, `Fe`

### Get Latest
```
GET /plant-health/latest/{field_id}
```

### Delete
```
DELETE /plant-health/{id}
```

## Irrigation

### List
```
GET /irrigation/?field_id={id}
```

### Create
```
POST /irrigation/
```
```json
{
  "field_id": 1,
  "method": "drip",
  "duration_minutes": 30,
  "water_volume_liters": 500,
  "source": "well"
}
```

Methods: `drip`, `sprinkler`, `flood`, `Manual`
Sources: `well`, `rainwater`, `municipal`

### Schedule
```
POST /irrigation/schedule
```
Same payload as create. If `timestamp` is in the past, it's automatically set to 1 hour from now.

### Get / Delete
```
GET /irrigation/{id}
DELETE /irrigation/{id}
```

## Fertilization

### List
```
GET /fertilization/?field_id={id}
```

### Create
```
POST /fertilization/
```
```json
{
  "field_id": 1,
  "nutrient_type": "NPK",
  "amount_kg": 50.0,
  "application_method": "broadcast"
}
```

Nutrient types: `N`, `P`, `K`, `NPK`, `compost`, `manure`

### Get / Delete
```
GET /fertilization/{id}
DELETE /fertilization/{id}
```

## Harvests

### List
```
GET /harvests/?field_id={id}&crop_cycle_id={id}
```

### Create
```
POST /harvests/
```
```json
{ "field_id": 1, "crop_cycle_id": 1, "harvest_date": "2026-06-15", "yield_kg": 250.0 }
```

### Get / Update / Delete
```
GET /harvests/{id}
PUT /harvests/{id}
DELETE /harvests/{id}
```

## Tasks

### List
```
GET /tasks/?status=pending&priority=critical&field_id={id}
```

### Create
```
POST /tasks/
```
```json
{ "title": "Check irrigation lines", "priority": "high", "field_id": 1, "due_date": "2026-07-01T10:00:00" }
```

Priorities: `low`, `medium`, `high`, `critical`
Statuses: `pending`, `in_progress`, `completed`, `cancelled`

### Get / Update / Delete
```
GET /tasks/{id}
PUT /tasks/{id}
DELETE /tasks/{id}
```
Updating status to `completed` auto-sets `completed_at`.

## Dashboard

### Summary
```
GET /dashboard/summary
```
Returns aggregated stats: farm/field counts, active crops, pending/critical tasks, total harvest, recent soil readings, upcoming tasks, field status matrix.

### Alerts
```
GET /dashboard/alerts
```
Returns active alerts: low moisture (< 15%), high disease risk (> 70%), overdue tasks.

### Weather
```
GET /dashboard/weather/{field_id}
```
Returns current weather from Open-Meteo API (free, no key required).
