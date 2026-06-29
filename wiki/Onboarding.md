# Farm Onboarding

## Overview

The onboarding workflow lets you create an entire farm — fields, crop cycles, and tasks — from a single free-text description. The AI Architect analyzes your spec, streams its reasoning in real time, and presents a structured template for review.

## How It Works

```
1. Describe your farm in plain language
2. AI streams its analysis thought-by-thought
3. Review and edit the generated template
4. Confirm — everything is created in one transaction
```

## Example Specs

### Simple
```
200-acre organic farm in Oregon's Willamette Valley.
North Field: 20 acres, loam soil, Roma tomatoes planted June 1 2026
South Field: 35 acres, clay loam, hard red winter wheat planted April 15 2026
Need drip irrigation in North Field by June 1.
Order tomato cages and wheat seed.
```

### Detailed
```
Green Acres Farm, Latitude: 44.052, Longitude: -123.086

Fields:
- North (20 acres, loam, tomatoes 'Brandywine' planted 2026-06-01)
- South (35 acres, clay loam, winter wheat planted 2026-04-15)
- East (15 acres, sandy, carrots planted 2026-05-15)
- West (30 acres, silt, pasture - no crop this season)

Tasks:
- Install drip irrigation in North Field (high priority, due 2026-06-01)
- Soil test all fields (medium priority, due 2026-05-01)
- Order 500 tomato cages (medium priority, due 2026-05-15)
```

## What the AI Extracts

| Entity       | Fields                                                       |
|-------------|--------------------------------------------------------------|
| Farm        | Name, latitude, longitude                                    |
| Fields      | Name, area (hectares, auto-converted from acres), soil type  |
| Crop Cycles | Crop type, variety, planting date, expected harvest, status  |
| Tasks       | Title, description, priority, due date                       |

## Confirmation API

`POST /api/v1/farms/onboard/confirm`

The review screen lets you:
- Edit all field values inline
- Toggle crop cycle on/off per field
- Add or remove fields and tasks
- Uncheck individual items via the `create` boolean

## Fallback

If Ollama is unavailable, a deterministic parser extracts:
- Farm name from the first line
- Field count from patterns like "N fields"
- Acreage from "N acres" patterns
- Organic/certified keywords create an organic certification task
