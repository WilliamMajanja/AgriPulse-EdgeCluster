from datetime import datetime, date, timedelta
from typing import List, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select, func, desc, and_
from sqlalchemy.orm import Session, joinedload
from backend.database import get_db
from backend.models import (
    Farm, FieldPlot, CropCycle, SoilReading, PlantHealthReading,
    IrrigationEvent, FertilizationEvent, HarvestRecord, Task,
    SensorNode, SensorReading,
    ActuatorCommandLog,
    CreateFarm, UpdateFarm, ReadFarm,
    CreateField, UpdateField, ReadField,
    CreateCropCycle, UpdateCropCycle, ReadCropCycle,
    CreateSoilReading, UpdateSoilReading, ReadSoilReading,
    CreatePlantHealthReading, UpdatePlantHealthReading, ReadPlantHealthReading,
    CreateIrrigationEvent, UpdateIrrigationEvent, ReadIrrigationEvent,
    CreateFertilizationEvent, UpdateFertilizationEvent, ReadFertilizationEvent,
    CreateHarvestRecord, UpdateHarvestRecord, ReadHarvestRecord,
    CreateTask, UpdateTask, ReadTask,
    CropCycleStatus, TaskStatus, Priority,
)

farms_router = APIRouter(prefix="/farms", tags=["Farms"])
fields_router = APIRouter(prefix="/fields", tags=["Fields"])
crop_cycles_router = APIRouter(prefix="/crop-cycles", tags=["Crop Cycles"])
soil_readings_router = APIRouter(prefix="/soil-readings", tags=["Soil Readings"])
plant_health_router = APIRouter(prefix="/plant-health", tags=["Plant Health"])
irrigation_router = APIRouter(prefix="/irrigation", tags=["Irrigation"])
fertilization_router = APIRouter(prefix="/fertilization", tags=["Fertilization"])
harvests_router = APIRouter(prefix="/harvests", tags=["Harvests"])
tasks_router = APIRouter(prefix="/tasks", tags=["Tasks"])
dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# ── Farms ─────────────────────────────────────────────────────────────────────


@farms_router.get("/", response_model=List[ReadFarm])
def list_farms(db: Session = Depends(get_db)):
    try:
        farms = db.execute(select(Farm).order_by(desc(Farm.created_at))).scalars().all()
        return farms
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@farms_router.post("/", status_code=201, response_model=ReadFarm)
def create_farm(data: CreateFarm, db: Session = Depends(get_db)):
    try:
        farm = Farm(**data.model_dump())
        db.add(farm)
        db.commit()
        db.refresh(farm)
        return farm
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@farms_router.get("/{farm_id}")
def get_farm(farm_id: int, db: Session = Depends(get_db)):
    try:
        farm = db.execute(select(Farm).where(Farm.id == farm_id)).scalar_one_or_none()
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found")
        fields_count = db.execute(
            select(func.count(FieldPlot.id)).where(FieldPlot.farm_id == farm_id)
        ).scalar()
        return {
            "id": farm.id,
            "name": farm.name,
            "latitude": farm.latitude,
            "longitude": farm.longitude,
            "created_at": farm.created_at,
            "updated_at": farm.updated_at,
            "fields_count": fields_count,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@farms_router.put("/{farm_id}", response_model=ReadFarm)
def update_farm(farm_id: int, data: UpdateFarm, db: Session = Depends(get_db)):
    try:
        farm = db.execute(select(Farm).where(Farm.id == farm_id)).scalar_one_or_none()
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found")
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(farm, key, value)
        db.commit()
        db.refresh(farm)
        return farm
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@farms_router.delete("/{farm_id}", status_code=204)
def delete_farm(farm_id: int, db: Session = Depends(get_db)):
    try:
        farm = db.execute(select(Farm).where(Farm.id == farm_id)).scalar_one_or_none()
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found")
        db.delete(farm)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── Fields ────────────────────────────────────────────────────────────────────


@fields_router.get("/", response_model=List[ReadField])
def list_fields(
    farm_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        query = select(FieldPlot)
        if farm_id is not None:
            query = query.where(FieldPlot.farm_id == farm_id)
        query = query.order_by(desc(FieldPlot.created_at))
        fields = db.execute(query).scalars().all()
        return fields
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@fields_router.post("/", status_code=201, response_model=ReadField)
def create_field(data: CreateField, db: Session = Depends(get_db)):
    try:
        farm = db.execute(select(Farm).where(Farm.id == data.farm_id)).scalar_one_or_none()
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found")
        field = FieldPlot(**data.model_dump())
        db.add(field)
        db.commit()
        db.refresh(field)
        return field
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@fields_router.get("/{field_id}")
def get_field(field_id: int, db: Session = Depends(get_db)):
    try:
        field = db.execute(select(FieldPlot).where(FieldPlot.id == field_id)).scalar_one_or_none()
        if not field:
            raise HTTPException(status_code=404, detail="Field not found")
        latest_soil = db.execute(
            select(SoilReading)
            .where(SoilReading.field_id == field_id)
            .order_by(desc(SoilReading.timestamp))
            .limit(1)
        ).scalar_one_or_none()
        active_crop = db.execute(
            select(CropCycle)
            .where(
                CropCycle.field_id == field_id,
                CropCycle.status.in_([CropCycleStatus.planned, CropCycleStatus.planted, CropCycleStatus.growing]),
            )
            .order_by(desc(CropCycle.planting_date))
            .limit(1)
        ).scalar_one_or_none()
        total_harvest = db.execute(
            select(func.coalesce(func.sum(HarvestRecord.yield_kg), 0.0))
            .where(HarvestRecord.field_id == field_id)
        ).scalar()
        return {
            "id": field.id,
            "farm_id": field.farm_id,
            "name": field.name,
            "area_hectares": field.area_hectares,
            "soil_type": field.soil_type,
            "created_at": field.created_at,
            "latest_soil_reading": ReadSoilReading.model_validate(latest_soil) if latest_soil else None,
            "active_crop": ReadCropCycle.model_validate(active_crop) if active_crop else None,
            "total_harvest_kg": total_harvest,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@fields_router.put("/{field_id}", response_model=ReadField)
def update_field(field_id: int, data: UpdateField, db: Session = Depends(get_db)):
    try:
        field = db.execute(select(FieldPlot).where(FieldPlot.id == field_id)).scalar_one_or_none()
        if not field:
            raise HTTPException(status_code=404, detail="Field not found")
        update_data = data.model_dump(exclude_unset=True)
        if "farm_id" in update_data and update_data["farm_id"] is not None:
            farm = db.execute(select(Farm).where(Farm.id == update_data["farm_id"])).scalar_one_or_none()
            if not farm:
                raise HTTPException(status_code=404, detail="Farm not found")
        for key, value in update_data.items():
            setattr(field, key, value)
        db.commit()
        db.refresh(field)
        return field
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@fields_router.delete("/{field_id}", status_code=204)
def delete_field(field_id: int, db: Session = Depends(get_db)):
    try:
        field = db.execute(select(FieldPlot).where(FieldPlot.id == field_id)).scalar_one_or_none()
        if not field:
            raise HTTPException(status_code=404, detail="Field not found")
        db.delete(field)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── Crop Cycles ───────────────────────────────────────────────────────────────


@crop_cycles_router.get("/", response_model=List[ReadCropCycle])
def list_crop_cycles(
    field_id: Optional[int] = Query(None),
    status: Optional[CropCycleStatus] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        query = select(CropCycle)
        if field_id is not None:
            query = query.where(CropCycle.field_id == field_id)
        if status is not None:
            query = query.where(CropCycle.status == status)
        query = query.order_by(desc(CropCycle.planting_date))
        cycles = db.execute(query).scalars().all()
        return cycles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@crop_cycles_router.post("/", status_code=201, response_model=ReadCropCycle)
def create_crop_cycle(data: CreateCropCycle, db: Session = Depends(get_db)):
    try:
        field = db.execute(select(FieldPlot).where(FieldPlot.id == data.field_id)).scalar_one_or_none()
        if not field:
            raise HTTPException(status_code=404, detail="Field not found")
        cycle = CropCycle(**data.model_dump())
        db.add(cycle)
        db.commit()
        db.refresh(cycle)
        return cycle
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@crop_cycles_router.get("/{id}")
def get_crop_cycle(id: int, db: Session = Depends(get_db)):
    try:
        cycle = db.execute(select(CropCycle).where(CropCycle.id == id)).scalar_one_or_none()
        if not cycle:
            raise HTTPException(status_code=404, detail="Crop cycle not found")
        harvests = db.execute(
            select(HarvestRecord)
            .where(HarvestRecord.crop_cycle_id == id)
            .order_by(desc(HarvestRecord.harvest_date))
        ).scalars().all()
        return {
            "id": cycle.id,
            "field_id": cycle.field_id,
            "crop_type": cycle.crop_type,
            "variety": cycle.variety,
            "planting_date": cycle.planting_date,
            "expected_harvest_date": cycle.expected_harvest_date,
            "actual_harvest_date": cycle.actual_harvest_date,
            "status": cycle.status,
            "notes": cycle.notes,
            "harvest_records": [ReadHarvestRecord.model_validate(h) for h in harvests],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@crop_cycles_router.put("/{id}", response_model=ReadCropCycle)
def update_crop_cycle(id: int, data: UpdateCropCycle, db: Session = Depends(get_db)):
    try:
        cycle = db.execute(select(CropCycle).where(CropCycle.id == id)).scalar_one_or_none()
        if not cycle:
            raise HTTPException(status_code=404, detail="Crop cycle not found")
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(cycle, key, value)
        db.commit()
        db.refresh(cycle)
        return cycle
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@crop_cycles_router.delete("/{id}", status_code=204)
def delete_crop_cycle(id: int, db: Session = Depends(get_db)):
    try:
        cycle = db.execute(select(CropCycle).where(CropCycle.id == id)).scalar_one_or_none()
        if not cycle:
            raise HTTPException(status_code=404, detail="Crop cycle not found")
        db.delete(cycle)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── Soil Readings ─────────────────────────────────────────────────────────────


@soil_readings_router.get("/", response_model=List[ReadSoilReading])
def list_soil_readings(
    field_id: Optional[int] = Query(None),
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        query = select(SoilReading)
        if field_id is not None:
            query = query.where(SoilReading.field_id == field_id)
        if start is not None:
            query = query.where(SoilReading.timestamp >= start)
        if end is not None:
            query = query.where(SoilReading.timestamp <= end)
        query = query.order_by(desc(SoilReading.timestamp))
        readings = db.execute(query).scalars().all()
        return readings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@soil_readings_router.post("/", status_code=201, response_model=ReadSoilReading)
def create_soil_reading(data: CreateSoilReading, db: Session = Depends(get_db)):
    try:
        field = db.execute(select(FieldPlot).where(FieldPlot.id == data.field_id)).scalar_one_or_none()
        if not field:
            raise HTTPException(status_code=404, detail="Field not found")
        reading = SoilReading(**data.model_dump())
        db.add(reading)
        db.commit()
        db.refresh(reading)
        return reading
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@soil_readings_router.get("/latest/{field_id}", response_model=ReadSoilReading)
def get_latest_soil_reading(field_id: int, db: Session = Depends(get_db)):
    try:
        field = db.execute(select(FieldPlot).where(FieldPlot.id == field_id)).scalar_one_or_none()
        if not field:
            raise HTTPException(status_code=404, detail="Field not found")
        reading = db.execute(
            select(SoilReading)
            .where(SoilReading.field_id == field_id)
            .order_by(desc(SoilReading.timestamp))
            .limit(1)
        ).scalar_one_or_none()
        if not reading:
            raise HTTPException(status_code=404, detail="No soil readings found for this field")
        return reading
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@soil_readings_router.delete("/{id}", status_code=204)
def delete_soil_reading(id: int, db: Session = Depends(get_db)):
    try:
        reading = db.execute(select(SoilReading).where(SoilReading.id == id)).scalar_one_or_none()
        if not reading:
            raise HTTPException(status_code=404, detail="Soil reading not found")
        db.delete(reading)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── Plant Health ──────────────────────────────────────────────────────────────


@plant_health_router.get("/", response_model=List[ReadPlantHealthReading])
def list_plant_health_readings(
    field_id: Optional[int] = Query(None),
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        query = select(PlantHealthReading)
        if field_id is not None:
            query = query.where(PlantHealthReading.field_id == field_id)
        if start is not None:
            query = query.where(PlantHealthReading.timestamp >= start)
        if end is not None:
            query = query.where(PlantHealthReading.timestamp <= end)
        query = query.order_by(desc(PlantHealthReading.timestamp))
        readings = db.execute(query).scalars().all()
        return readings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@plant_health_router.post("/", status_code=201, response_model=ReadPlantHealthReading)
def create_plant_health_reading(data: CreatePlantHealthReading, db: Session = Depends(get_db)):
    try:
        field = db.execute(select(FieldPlot).where(FieldPlot.id == data.field_id)).scalar_one_or_none()
        if not field:
            raise HTTPException(status_code=404, detail="Field not found")
        reading = PlantHealthReading(**data.model_dump())
        db.add(reading)
        db.commit()
        db.refresh(reading)
        return reading
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@plant_health_router.get("/latest/{field_id}", response_model=ReadPlantHealthReading)
def get_latest_plant_health_reading(field_id: int, db: Session = Depends(get_db)):
    try:
        field = db.execute(select(FieldPlot).where(FieldPlot.id == field_id)).scalar_one_or_none()
        if not field:
            raise HTTPException(status_code=404, detail="Field not found")
        reading = db.execute(
            select(PlantHealthReading)
            .where(PlantHealthReading.field_id == field_id)
            .order_by(desc(PlantHealthReading.timestamp))
            .limit(1)
        ).scalar_one_or_none()
        if not reading:
            raise HTTPException(status_code=404, detail="No plant health readings found for this field")
        return reading
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@plant_health_router.delete("/{id}", status_code=204)
def delete_plant_health_reading(id: int, db: Session = Depends(get_db)):
    try:
        reading = db.execute(select(PlantHealthReading).where(PlantHealthReading.id == id)).scalar_one_or_none()
        if not reading:
            raise HTTPException(status_code=404, detail="Plant health reading not found")
        db.delete(reading)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── Irrigation ────────────────────────────────────────────────────────────────


@irrigation_router.get("/", response_model=List[ReadIrrigationEvent])
def list_irrigation_events(
    field_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        query = select(IrrigationEvent)
        if field_id is not None:
            query = query.where(IrrigationEvent.field_id == field_id)
        query = query.order_by(desc(IrrigationEvent.timestamp))
        events = db.execute(query).scalars().all()
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@irrigation_router.post("/schedule", status_code=201, response_model=ReadIrrigationEvent)
def schedule_irrigation(data: CreateIrrigationEvent, db: Session = Depends(get_db)):
    try:
        field = db.execute(select(FieldPlot).where(FieldPlot.id == data.field_id)).scalar_one_or_none()
        if not field:
            raise HTTPException(status_code=404, detail="Field not found")
        event_data = data.model_dump()
        if event_data.get("timestamp") is None or event_data["timestamp"] <= datetime.utcnow():
            event_data["timestamp"] = datetime.utcnow() + timedelta(hours=1)
        event = IrrigationEvent(**event_data)
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@irrigation_router.post("/", status_code=201, response_model=ReadIrrigationEvent)
def create_irrigation_event(data: CreateIrrigationEvent, db: Session = Depends(get_db)):
    try:
        field = db.execute(select(FieldPlot).where(FieldPlot.id == data.field_id)).scalar_one_or_none()
        if not field:
            raise HTTPException(status_code=404, detail="Field not found")
        event = IrrigationEvent(**data.model_dump())
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@irrigation_router.get("/{id}", response_model=ReadIrrigationEvent)
def get_irrigation_event(id: int, db: Session = Depends(get_db)):
    try:
        event = db.execute(select(IrrigationEvent).where(IrrigationEvent.id == id)).scalar_one_or_none()
        if not event:
            raise HTTPException(status_code=404, detail="Irrigation event not found")
        return event
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@irrigation_router.delete("/{id}", status_code=204)
def delete_irrigation_event(id: int, db: Session = Depends(get_db)):
    try:
        event = db.execute(select(IrrigationEvent).where(IrrigationEvent.id == id)).scalar_one_or_none()
        if not event:
            raise HTTPException(status_code=404, detail="Irrigation event not found")
        db.delete(event)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── Fertilization ─────────────────────────────────────────────────────────────


@fertilization_router.get("/", response_model=List[ReadFertilizationEvent])
def list_fertilization_events(
    field_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        query = select(FertilizationEvent)
        if field_id is not None:
            query = query.where(FertilizationEvent.field_id == field_id)
        query = query.order_by(desc(FertilizationEvent.timestamp))
        events = db.execute(query).scalars().all()
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@fertilization_router.post("/", status_code=201, response_model=ReadFertilizationEvent)
def create_fertilization_event(data: CreateFertilizationEvent, db: Session = Depends(get_db)):
    try:
        field = db.execute(select(FieldPlot).where(FieldPlot.id == data.field_id)).scalar_one_or_none()
        if not field:
            raise HTTPException(status_code=404, detail="Field not found")
        event = FertilizationEvent(**data.model_dump())
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@fertilization_router.get("/{id}", response_model=ReadFertilizationEvent)
def get_fertilization_event(id: int, db: Session = Depends(get_db)):
    try:
        event = db.execute(select(FertilizationEvent).where(FertilizationEvent.id == id)).scalar_one_or_none()
        if not event:
            raise HTTPException(status_code=404, detail="Fertilization event not found")
        return event
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@fertilization_router.delete("/{id}", status_code=204)
def delete_fertilization_event(id: int, db: Session = Depends(get_db)):
    try:
        event = db.execute(select(FertilizationEvent).where(FertilizationEvent.id == id)).scalar_one_or_none()
        if not event:
            raise HTTPException(status_code=404, detail="Fertilization event not found")
        db.delete(event)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── Harvests ──────────────────────────────────────────────────────────────────


@harvests_router.get("/", response_model=List[ReadHarvestRecord])
def list_harvests(
    field_id: Optional[int] = Query(None),
    crop_cycle_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        query = select(HarvestRecord)
        if field_id is not None:
            query = query.where(HarvestRecord.field_id == field_id)
        if crop_cycle_id is not None:
            query = query.where(HarvestRecord.crop_cycle_id == crop_cycle_id)
        query = query.order_by(desc(HarvestRecord.harvest_date))
        records = db.execute(query).scalars().all()
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@harvests_router.post("/", status_code=201, response_model=ReadHarvestRecord)
def create_harvest(data: CreateHarvestRecord, db: Session = Depends(get_db)):
    try:
        field = db.execute(select(FieldPlot).where(FieldPlot.id == data.field_id)).scalar_one_or_none()
        if not field:
            raise HTTPException(status_code=404, detail="Field not found")
        crop_cycle = db.execute(select(CropCycle).where(CropCycle.id == data.crop_cycle_id)).scalar_one_or_none()
        if not crop_cycle:
            raise HTTPException(status_code=404, detail="Crop cycle not found")
        record = HarvestRecord(**data.model_dump())
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@harvests_router.get("/{id}", response_model=ReadHarvestRecord)
def get_harvest(id: int, db: Session = Depends(get_db)):
    try:
        record = db.execute(select(HarvestRecord).where(HarvestRecord.id == id)).scalar_one_or_none()
        if not record:
            raise HTTPException(status_code=404, detail="Harvest record not found")
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@harvests_router.put("/{id}", response_model=ReadHarvestRecord)
def update_harvest(id: int, data: UpdateHarvestRecord, db: Session = Depends(get_db)):
    try:
        record = db.execute(select(HarvestRecord).where(HarvestRecord.id == id)).scalar_one_or_none()
        if not record:
            raise HTTPException(status_code=404, detail="Harvest record not found")
        update_data = data.model_dump(exclude_unset=True)
        if "field_id" in update_data and update_data["field_id"] is not None:
            field = db.execute(select(FieldPlot).where(FieldPlot.id == update_data["field_id"])).scalar_one_or_none()
            if not field:
                raise HTTPException(status_code=404, detail="Field not found")
        if "crop_cycle_id" in update_data and update_data["crop_cycle_id"] is not None:
            crop_cycle = db.execute(select(CropCycle).where(CropCycle.id == update_data["crop_cycle_id"])).scalar_one_or_none()
            if not crop_cycle:
                raise HTTPException(status_code=404, detail="Crop cycle not found")
        for key, value in update_data.items():
            setattr(record, key, value)
        db.commit()
        db.refresh(record)
        return record
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@harvests_router.delete("/{id}", status_code=204)
def delete_harvest(id: int, db: Session = Depends(get_db)):
    try:
        record = db.execute(select(HarvestRecord).where(HarvestRecord.id == id)).scalar_one_or_none()
        if not record:
            raise HTTPException(status_code=404, detail="Harvest record not found")
        db.delete(record)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── Tasks ─────────────────────────────────────────────────────────────────────


@tasks_router.get("/", response_model=List[ReadTask])
def list_tasks(
    status: Optional[TaskStatus] = Query(None),
    priority: Optional[Priority] = Query(None),
    field_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        query = select(Task)
        if status is not None:
            query = query.where(Task.status == status)
        if priority is not None:
            query = query.where(Task.priority == priority)
        if field_id is not None:
            query = query.where(Task.field_id == field_id)
        query = query.order_by(desc(Task.created_at))
        tasks = db.execute(query).scalars().all()
        return tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@tasks_router.post("/", status_code=201, response_model=ReadTask)
def create_task(data: CreateTask, db: Session = Depends(get_db)):
    try:
        if data.field_id is not None:
            field = db.execute(select(FieldPlot).where(FieldPlot.id == data.field_id)).scalar_one_or_none()
            if not field:
                raise HTTPException(status_code=404, detail="Field not found")
        task = Task(**data.model_dump())
        db.add(task)
        db.commit()
        db.refresh(task)
        return task
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@tasks_router.get("/{id}", response_model=ReadTask)
def get_task(id: int, db: Session = Depends(get_db)):
    try:
        task = db.execute(select(Task).where(Task.id == id)).scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@tasks_router.put("/{id}", response_model=ReadTask)
def update_task(id: int, data: UpdateTask, db: Session = Depends(get_db)):
    try:
        task = db.execute(select(Task).where(Task.id == id)).scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        update_data = data.model_dump(exclude_unset=True)
        if "field_id" in update_data and update_data["field_id"] is not None:
            field = db.execute(select(FieldPlot).where(FieldPlot.id == update_data["field_id"])).scalar_one_or_none()
            if not field:
                raise HTTPException(status_code=404, detail="Field not found")
        status_changed_to_completed = (
            "status" in update_data
            and update_data["status"] == TaskStatus.completed
            and task.status != TaskStatus.completed
        )
        for key, value in update_data.items():
            setattr(task, key, value)
        if status_changed_to_completed and task.completed_at is None:
            task.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(task)
        return task
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@tasks_router.delete("/{id}", status_code=204)
def delete_task(id: int, db: Session = Depends(get_db)):
    try:
        task = db.execute(select(Task).where(Task.id == id)).scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        db.delete(task)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── Dashboard ─────────────────────────────────────────────────────────────────


@dashboard_router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    try:
        total_farms = db.execute(select(func.count(Farm.id))).scalar() or 0
        total_fields = db.execute(select(func.count(FieldPlot.id))).scalar() or 0
        active_crops = db.execute(
            select(func.count(CropCycle.id)).where(
                CropCycle.status.in_([CropCycleStatus.planned, CropCycleStatus.planted, CropCycleStatus.growing])
            )
        ).scalar() or 0
        pending_tasks = db.execute(
            select(func.count(Task.id)).where(Task.status == TaskStatus.pending)
        ).scalar() or 0
        critical_tasks = db.execute(
            select(func.count(Task.id)).where(
                Task.priority == Priority.critical,
                Task.status.in_([TaskStatus.pending, TaskStatus.in_progress]),
            )
        ).scalar() or 0
        total_harvest_kg = db.execute(
            select(func.coalesce(func.sum(HarvestRecord.yield_kg), 0.0))
        ).scalar() or 0.0

        recent_readings = db.execute(
            select(SoilReading)
            .options(joinedload(SoilReading.field))
            .order_by(desc(SoilReading.timestamp))
            .limit(5)
        ).scalars().all()

        recent_soil_readings = [
            {
                "id": r.id,
                "field_id": r.field_id,
                "field_name": r.field.name if r.field else None,
                "timestamp": r.timestamp,
                "moisture_pct": r.moisture_pct,
                "temperature_c": r.temperature_c,
                "ph": r.ph,
            }
            for r in recent_readings
        ]

        upcoming_tasks_rows = db.execute(
            select(Task)
            .where(Task.status.in_([TaskStatus.pending, TaskStatus.in_progress]))
            .order_by(Task.due_date.asc().nullslast())
            .limit(5)
        ).scalars().all()

        upcoming_tasks = [
            {
                "id": t.id,
                "title": t.title,
                "priority": t.priority,
                "status": t.status,
                "due_date": t.due_date,
                "assigned_to": t.assigned_to,
                "field_id": t.field_id,
            }
            for t in upcoming_tasks_rows
        ]

        fields_data = db.execute(select(FieldPlot)).scalars().all()
        field_status = []
        for f in fields_data:
            active = db.execute(
                select(CropCycle.crop_type)
                .where(
                    CropCycle.field_id == f.id,
                    CropCycle.status.in_([CropCycleStatus.planned, CropCycleStatus.planted, CropCycleStatus.growing]),
                )
                .order_by(desc(CropCycle.planting_date))
                .limit(1)
            ).scalar_one_or_none()

            latest_moisture = db.execute(
                select(SoilReading.moisture_pct)
                .where(SoilReading.field_id == f.id)
                .order_by(desc(SoilReading.timestamp))
                .limit(1)
            ).scalar_one_or_none()

            latest_health = db.execute(
                select(PlantHealthReading.disease_risk)
                .where(PlantHealthReading.field_id == f.id)
                .order_by(desc(PlantHealthReading.timestamp))
                .limit(1)
            ).scalar_one_or_none()

            moisture = latest_moisture or 0.0
            if moisture < 15.0:
                status_str = "water_stress"
            elif latest_health is not None and latest_health > 0.7:
                status_str = "disease_risk"
            elif moisture < 25.0:
                status_str = "suboptimal_moisture"
            else:
                status_str = "healthy"

            health_str = "good"
            if latest_health is not None:
                if latest_health > 0.7:
                    health_str = "critical"
                elif latest_health > 0.4:
                    health_str = "fair"
                elif latest_health > 0.2:
                    health_str = "poor"

            field_status.append({
                "field_id": f.id,
                "field_name": f.name,
                "crop": active or "fallow",
                "status": status_str,
                "moisture": moisture,
                "health": health_str,
            })

        return {
            "total_farms": total_farms,
            "total_fields": total_fields,
            "active_crops": active_crops,
            "pending_tasks": pending_tasks,
            "critical_alerts": critical_tasks,
            "total_harvest_kg": float(total_harvest_kg),
            "recent_soil_readings": recent_soil_readings,
            "upcoming_tasks": upcoming_tasks,
            "field_status": field_status,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@dashboard_router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    try:
        alerts = []

        low_moisture_fields = db.execute(
            select(SoilReading)
            .options(joinedload(SoilReading.field))
            .distinct(SoilReading.field_id)
            .order_by(SoilReading.field_id, desc(SoilReading.timestamp))
        ).scalars().all()

        latest_by_field = {}
        for r in low_moisture_fields:
            if r.field_id not in latest_by_field:
                latest_by_field[r.field_id] = r

        for reading in latest_by_field.values():
            if reading.moisture_pct is not None and reading.moisture_pct < 15.0:
                alerts.append({
                    "type": "low_moisture",
                    "severity": "high",
                    "field_id": reading.field_id,
                    "field_name": reading.field.name if reading.field else None,
                    "message": f"Field moisture is critically low ({reading.moisture_pct:.1f}%)",
                    "timestamp": reading.timestamp,
                })

        high_risk_fields = db.execute(
            select(PlantHealthReading)
            .options(joinedload(PlantHealthReading.field))
            .distinct(PlantHealthReading.field_id)
            .order_by(PlantHealthReading.field_id, desc(PlantHealthReading.timestamp))
        ).scalars().all()

        latest_health = {}
        for r in high_risk_fields:
            if r.field_id not in latest_health:
                latest_health[r.field_id] = r

        for reading in latest_health.values():
            if reading.disease_risk is not None and reading.disease_risk > 0.7:
                alerts.append({
                    "type": "high_disease_risk",
                    "severity": "high",
                    "field_id": reading.field_id,
                    "field_name": reading.field.name if reading.field else None,
                    "message": f"High disease risk detected ({reading.disease_risk:.0%})",
                    "timestamp": reading.timestamp,
                })

        now = datetime.utcnow()
        overdue_tasks = db.execute(
            select(Task)
            .options(joinedload(Task.field))
            .where(
                Task.due_date < now,
                Task.status.in_([TaskStatus.pending, TaskStatus.in_progress]),
            )
            .order_by(Task.due_date.asc())
        ).scalars().all()

        for t in overdue_tasks:
            alerts.append({
                "type": "overdue_task",
                "severity": "medium",
                "task_id": t.id,
                "field_id": t.field_id,
                "field_name": t.field.name if t.field else None,
                "message": f"Task '{t.title}' is overdue (due: {t.due_date})",
                "due_date": t.due_date,
            })

        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@dashboard_router.get("/weather/{field_id}")
async def get_weather(field_id: int, db: Session = Depends(get_db)):
    try:
        field = db.execute(select(FieldPlot).where(FieldPlot.id == field_id)).scalar_one_or_none()
        if not field:
            raise HTTPException(status_code=404, detail="Field not found")
        farm = db.execute(select(Farm).where(Farm.id == field.farm_id)).scalar_one_or_none()

        lat = farm.latitude if farm and farm.latitude else 40.0
        lon = farm.longitude if farm and farm.longitude else -95.0

        temperature = None
        humidity = None
        rainfall_probability = None

        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(
                    "https://api.open-meteo.com/v1/forecast",
                    params={
                        "latitude": lat,
                        "longitude": lon,
                        "current": "temperature_2m,relative_humidity_2m,precipitation_probability",
                        "forecast_days": 1,
                    },
                )
                if resp.is_success:
                    data = resp.json().get("current", {})
                    temperature = data.get("temperature_2m")
                    humidity = data.get("relative_humidity_2m")
                    rainfall_probability = data.get("precipitation_probability")
        except Exception:
            pass

        if temperature is None:
            temperature = 20.0
        if humidity is None:
            humidity = 60.0
        if rainfall_probability is None:
            rainfall_probability = 10.0

        return {
            "field_id": field_id,
            "field_name": field.name,
            "latitude": lat,
            "longitude": lon,
            "temperature_c": temperature,
            "humidity_pct": humidity,
            "rainfall_probability_pct": rainfall_probability,
            "forecast": "sunny" if (rainfall_probability or 0) < 30 else ("cloudy" if (rainfall_probability or 0) < 70 else "rainy"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Onboarding ────────────────────────────────────────────────────────────────


from pydantic import BaseModel
from backend.models import SoilType, CropCycleStatus, Priority, TaskStatus


class OnboardCropCycle(BaseModel):
    crop_type: str = ""
    variety: str | None = None
    planting_date: str | None = None
    expected_harvest_date: str | None = None
    status: str = "planned"


class OnboardField(BaseModel):
    name: str
    area_hectares: float = 10.0
    soil_type: str | None = "loam"
    create: bool = True
    crop_cycle: OnboardCropCycle | None = None


class OnboardTask(BaseModel):
    title: str
    description: str | None = ""
    priority: str = "medium"
    due_date: str | None = ""
    create: bool = True


class OnboardFarm(BaseModel):
    name: str
    latitude: float | None = None
    longitude: float | None = None


class OnboardConfirmRequest(BaseModel):
    farm: OnboardFarm
    fields: list[OnboardField] = []
    tasks: list[OnboardTask] = []


@farms_router.post("/onboard/confirm", status_code=201)
def confirm_onboard(data: OnboardConfirmRequest, db: Session = Depends(get_db)):
    try:
        farm = Farm(name=data.farm.name, latitude=data.farm.latitude, longitude=data.farm.longitude)
        db.add(farm)
        db.flush()

        fields_created = 0
        cycles_created = 0
        tasks_created = 0

        for f in data.fields:
            if not f.create:
                continue
            soil_type = None
            if f.soil_type:
                try:
                    soil_type = SoilType(f.soil_type)
                except ValueError:
                    pass
            field = FieldPlot(
                farm_id=farm.id,
                name=f.name,
                area_hectares=f.area_hectares,
                soil_type=soil_type,
            )
            db.add(field)
            db.flush()
            fields_created += 1

            if f.crop_cycle and f.crop_cycle.crop_type:
                cc = f.crop_cycle
                planting_date = None
                if cc.planting_date:
                    try:
                        planting_date = date.fromisoformat(cc.planting_date)
                    except ValueError:
                        pass
                expected_harvest_date = None
                if cc.expected_harvest_date:
                    try:
                        expected_harvest_date = date.fromisoformat(cc.expected_harvest_date)
                    except ValueError:
                        pass
                c_status = CropCycleStatus.planned
                if cc.status:
                    try:
                        c_status = CropCycleStatus(cc.status)
                    except ValueError:
                        pass
                cycle = CropCycle(
                    field_id=field.id,
                    crop_type=cc.crop_type,
                    variety=cc.variety,
                    planting_date=planting_date,
                    expected_harvest_date=expected_harvest_date,
                    status=c_status,
                )
                db.add(cycle)
                cycles_created += 1

        for t in data.tasks:
            if not t.create:
                continue
            t_priority = Priority.medium
            if t.priority:
                try:
                    t_priority = Priority(t.priority)
                except ValueError:
                    pass
            due = None
            if t.due_date:
                try:
                    due = datetime.fromisoformat(t.due_date)
                except (ValueError, TypeError):
                    pass
            task = Task(
                field_id=None,
                title=t.title,
                description=t.description or "",
                priority=t_priority,
                status=TaskStatus.pending,
                due_date=due,
            )
            db.add(task)
            tasks_created += 1

        db.commit()
        db.refresh(farm)

        return {
            "farm_id": farm.id,
            "farm_name": farm.name,
            "fields_created": fields_created,
            "cycles_created": cycles_created,
            "tasks_created": tasks_created,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ── Main Router ───────────────────────────────────────────────────────────────

router = APIRouter(prefix="/api/v1")
router.include_router(farms_router)
router.include_router(fields_router)
router.include_router(crop_cycles_router)
router.include_router(soil_readings_router)
router.include_router(plant_health_router)
router.include_router(irrigation_router)
router.include_router(fertilization_router)
router.include_router(harvests_router)
router.include_router(tasks_router)
router.include_router(dashboard_router)
