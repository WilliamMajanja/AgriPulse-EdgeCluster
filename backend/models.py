from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, Time, Text, Enum,
    ForeignKey, JSON, Numeric, Boolean
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
import enum

from backend.database import Base


# ── ENUMS ────────────────────────────────────────────────────────────────────

class SoilType(str, enum.Enum):
    clay = "clay"
    loam = "loam"
    sandy = "sandy"
    silt = "silt"
    peat = "peat"
    chalk = "chalk"
    clay_loam = "clay_loam"

class CropCycleStatus(str, enum.Enum):
    planned = "planned"
    planted = "planted"
    growing = "growing"
    harvested = "harvested"
    failed = "failed"

class NutrientDeficiency(str, enum.Enum):
    none_ = "none"
    n = "N"
    p = "P"
    k = "K"
    mg = "Mg"
    fe = "Fe"

class IrrigationMethod(str, enum.Enum):
    drip = "drip"
    sprinkler = "sprinkler"
    flood = "flood"
    manual = "Manual"

class IrrigationSource(str, enum.Enum):
    well = "well"
    rainwater = "rainwater"
    municipal = "municipal"

class NutrientType(str, enum.Enum):
    n = "N"
    p = "P"
    k = "K"
    npk = "NPK"
    compost = "compost"
    manure = "manure"

class Priority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class TaskStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"

class NodeType(str, enum.Enum):
    master = "master"
    sentry = "sentry"
    telemetry = "telemetry"

class NodeStatus(str, enum.Enum):
    online = "online"
    warning = "warning"
    offline = "offline"

class SensorType(str, enum.Enum):
    temp = "temp"
    humidity = "humidity"
    moisture = "moisture"
    ph = "ph"
    npk = "npk"
    light = "light"
    co2 = "co2"

class ActuatorType(str, enum.Enum):
    pump = "pump"
    mister = "mister"
    light = "light"
    fan = "fan"
    valve = "valve"

class ActuatorCmd(str, enum.Enum):
    on = "on"
    off = "off"

class TriggerSource(str, enum.Enum):
    manual = "manual"
    schedule = "schedule"
    ai = "ai"

class ActuatorStatus(str, enum.Enum):
    pending = "pending"
    executed = "executed"
    failed = "failed"


# ── SQLAlchemy ORM MODELS ────────────────────────────────────────────────────

class Farm(Base):
    __tablename__ = "farms"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float)
    longitude: Mapped[Optional[float]] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    fields: Mapped[List["FieldPlot"]] = relationship("FieldPlot", back_populates="farm", cascade="all, delete-orphan")


class FieldPlot(Base):
    __tablename__ = "fields"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farms.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    area_hectares: Mapped[float] = mapped_column(Float, nullable=False)
    soil_type: Mapped[Optional[SoilType]] = mapped_column(Enum(SoilType))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    farm: Mapped["Farm"] = relationship("Farm", back_populates="fields")
    crop_cycles: Mapped[List["CropCycle"]] = relationship("CropCycle", back_populates="field", cascade="all, delete-orphan")
    soil_readings: Mapped[List["SoilReading"]] = relationship("SoilReading", back_populates="field", cascade="all, delete-orphan")
    plant_health_readings: Mapped[List["PlantHealthReading"]] = relationship("PlantHealthReading", back_populates="field", cascade="all, delete-orphan")
    irrigation_events: Mapped[List["IrrigationEvent"]] = relationship("IrrigationEvent", back_populates="field", cascade="all, delete-orphan")
    fertilization_events: Mapped[List["FertilizationEvent"]] = relationship("FertilizationEvent", back_populates="field", cascade="all, delete-orphan")
    harvest_records: Mapped[List["HarvestRecord"]] = relationship("HarvestRecord", back_populates="field", cascade="all, delete-orphan")
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="field", cascade="all, delete-orphan")


class CropCycle(Base):
    __tablename__ = "crop_cycles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    field_id: Mapped[int] = mapped_column(ForeignKey("fields.id"), nullable=False)
    crop_type: Mapped[str] = mapped_column(String(255), nullable=False)
    variety: Mapped[Optional[str]] = mapped_column(String(255))
    planting_date: Mapped[Optional[date]] = mapped_column(Date)
    expected_harvest_date: Mapped[Optional[date]] = mapped_column(Date)
    actual_harvest_date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[CropCycleStatus] = mapped_column(Enum(CropCycleStatus), default=CropCycleStatus.planned)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    field: Mapped["FieldPlot"] = relationship("FieldPlot", back_populates="crop_cycles")
    harvest_records: Mapped[List["HarvestRecord"]] = relationship("HarvestRecord", back_populates="crop_cycle", cascade="all, delete-orphan")


class SoilReading(Base):
    __tablename__ = "soil_readings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    field_id: Mapped[int] = mapped_column(ForeignKey("fields.id"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    temperature_c: Mapped[Optional[float]] = mapped_column(Float)
    moisture_pct: Mapped[Optional[float]] = mapped_column(Float)
    ph: Mapped[Optional[float]] = mapped_column(Float)
    nitrogen_ppm: Mapped[Optional[float]] = mapped_column(Float)
    phosphorus_ppm: Mapped[Optional[float]] = mapped_column(Float)
    potassium_ppm: Mapped[Optional[float]] = mapped_column(Float)
    organic_matter_pct: Mapped[Optional[float]] = mapped_column(Float)
    cation_exchange_capacity: Mapped[Optional[float]] = mapped_column(Float)
    microbial_activity: Mapped[Optional[float]] = mapped_column(Float)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    field: Mapped["FieldPlot"] = relationship("FieldPlot", back_populates="soil_readings")


class PlantHealthReading(Base):
    __tablename__ = "plant_health_readings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    field_id: Mapped[int] = mapped_column(ForeignKey("fields.id"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    growth_stage: Mapped[Optional[str]] = mapped_column(String(255))
    canopy_cover_pct: Mapped[Optional[float]] = mapped_column(Float)
    leaf_area_index: Mapped[Optional[float]] = mapped_column(Float)
    chlorophyll_content: Mapped[Optional[float]] = mapped_column(Float)
    disease_risk: Mapped[Optional[float]] = mapped_column(Float)
    pest_pressure: Mapped[Optional[float]] = mapped_column(Float)
    nutrient_deficiency: Mapped[Optional[NutrientDeficiency]] = mapped_column(Enum(NutrientDeficiency))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    image_path: Mapped[Optional[str]] = mapped_column(String(512))

    field: Mapped["FieldPlot"] = relationship("FieldPlot", back_populates="plant_health_readings")


class IrrigationEvent(Base):
    __tablename__ = "irrigation_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    field_id: Mapped[int] = mapped_column(ForeignKey("fields.id"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    duration_minutes: Mapped[Optional[float]] = mapped_column(Float)
    water_volume_liters: Mapped[Optional[float]] = mapped_column(Float)
    method: Mapped[IrrigationMethod] = mapped_column(Enum(IrrigationMethod), nullable=False)
    source: Mapped[Optional[IrrigationSource]] = mapped_column(Enum(IrrigationSource))
    notes: Mapped[Optional[str]] = mapped_column(Text)

    field: Mapped["FieldPlot"] = relationship("FieldPlot", back_populates="irrigation_events")


class FertilizationEvent(Base):
    __tablename__ = "fertilization_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    field_id: Mapped[int] = mapped_column(ForeignKey("fields.id"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    nutrient_type: Mapped[NutrientType] = mapped_column(Enum(NutrientType), nullable=False)
    amount_kg: Mapped[Optional[float]] = mapped_column(Float)
    application_method: Mapped[Optional[str]] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)

    field: Mapped["FieldPlot"] = relationship("FieldPlot", back_populates="fertilization_events")


class HarvestRecord(Base):
    __tablename__ = "harvest_records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    field_id: Mapped[int] = mapped_column(ForeignKey("fields.id"), nullable=False)
    crop_cycle_id: Mapped[int] = mapped_column(ForeignKey("crop_cycles.id"), nullable=False)
    harvest_date: Mapped[date] = mapped_column(Date, nullable=False)
    yield_kg: Mapped[Optional[float]] = mapped_column(Float)
    quality_grade: Mapped[Optional[str]] = mapped_column(String(50))
    notes: Mapped[Optional[str]] = mapped_column(Text)

    field: Mapped["FieldPlot"] = relationship("FieldPlot", back_populates="harvest_records")
    crop_cycle: Mapped["CropCycle"] = relationship("CropCycle", back_populates="harvest_records")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    field_id: Mapped[Optional[int]] = mapped_column(ForeignKey("fields.id"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    priority: Mapped[Priority] = mapped_column(Enum(Priority), default=Priority.medium)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.pending)
    assigned_to: Mapped[Optional[str]] = mapped_column(String(255))
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    field: Mapped[Optional["FieldPlot"]] = relationship("FieldPlot", back_populates="tasks")


class SensorNode(Base):
    __tablename__ = "sensor_nodes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    node_type: Mapped[NodeType] = mapped_column(Enum(NodeType), nullable=False)
    status: Mapped[NodeStatus] = mapped_column(Enum(NodeStatus), default=NodeStatus.online)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    last_seen: Mapped[Optional[datetime]] = mapped_column(DateTime)
    config: Mapped[Optional[dict]] = mapped_column(JSON)

    readings: Mapped[List["SensorReading"]] = relationship("SensorReading", back_populates="sensor_node", cascade="all, delete-orphan")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sensor_node_id: Mapped[int] = mapped_column(ForeignKey("sensor_nodes.id"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    sensor_type: Mapped[SensorType] = mapped_column(Enum(SensorType), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[Optional[str]] = mapped_column(String(50))

    sensor_node: Mapped["SensorNode"] = relationship("SensorNode", back_populates="readings")


class ActuatorCommandLog(Base):
    __tablename__ = "actuator_commands"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    actuator_type: Mapped[ActuatorType] = mapped_column(Enum(ActuatorType), nullable=False)
    command: Mapped[ActuatorCmd] = mapped_column(Enum(ActuatorCmd), nullable=False)
    duration_minutes: Mapped[Optional[float]] = mapped_column(Float)
    triggered_by: Mapped[TriggerSource] = mapped_column(Enum(TriggerSource), nullable=False)
    executed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    status: Mapped[ActuatorStatus] = mapped_column(Enum(ActuatorStatus), default=ActuatorStatus.pending)


# ── PYDANTIC SCHEMAS ─────────────────────────────────────────────────────────


# ── Farm ──

class FarmBase(BaseModel):
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class CreateFarm(FarmBase):
    pass

class UpdateFarm(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ReadFarm(FarmBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


# ── Field ──

class FieldBase(BaseModel):
    farm_id: int
    name: str
    area_hectares: float
    soil_type: Optional[SoilType] = None

class CreateField(FieldBase):
    pass

class UpdateField(BaseModel):
    farm_id: Optional[int] = None
    name: Optional[str] = None
    area_hectares: Optional[float] = None
    soil_type: Optional[SoilType] = None

class ReadField(FieldBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ── CropCycle ──

class CropCycleBase(BaseModel):
    field_id: int
    crop_type: str
    variety: Optional[str] = None
    planting_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    actual_harvest_date: Optional[date] = None
    status: CropCycleStatus = CropCycleStatus.planned
    notes: Optional[str] = None

class CreateCropCycle(CropCycleBase):
    pass

class UpdateCropCycle(BaseModel):
    field_id: Optional[int] = None
    crop_type: Optional[str] = None
    variety: Optional[str] = None
    planting_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    actual_harvest_date: Optional[date] = None
    status: Optional[CropCycleStatus] = None
    notes: Optional[str] = None

class ReadCropCycle(CropCycleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ── SoilReading ──

class SoilReadingBase(BaseModel):
    field_id: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    temperature_c: Optional[float] = None
    moisture_pct: Optional[float] = None
    ph: Optional[float] = None
    nitrogen_ppm: Optional[float] = None
    phosphorus_ppm: Optional[float] = None
    potassium_ppm: Optional[float] = None
    organic_matter_pct: Optional[float] = None
    cation_exchange_capacity: Optional[float] = None
    microbial_activity: Optional[float] = None
    notes: Optional[str] = None

class CreateSoilReading(SoilReadingBase):
    pass

class UpdateSoilReading(BaseModel):
    field_id: Optional[int] = None
    timestamp: Optional[datetime] = None
    temperature_c: Optional[float] = None
    moisture_pct: Optional[float] = None
    ph: Optional[float] = None
    nitrogen_ppm: Optional[float] = None
    phosphorus_ppm: Optional[float] = None
    potassium_ppm: Optional[float] = None
    organic_matter_pct: Optional[float] = None
    cation_exchange_capacity: Optional[float] = None
    microbial_activity: Optional[float] = None
    notes: Optional[str] = None

class ReadSoilReading(SoilReadingBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ── PlantHealthReading ──

class PlantHealthReadingBase(BaseModel):
    field_id: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    growth_stage: Optional[str] = None
    canopy_cover_pct: Optional[float] = None
    leaf_area_index: Optional[float] = None
    chlorophyll_content: Optional[float] = None
    disease_risk: Optional[float] = None
    pest_pressure: Optional[float] = None
    nutrient_deficiency: Optional[NutrientDeficiency] = None
    notes: Optional[str] = None
    image_path: Optional[str] = None

class CreatePlantHealthReading(PlantHealthReadingBase):
    pass

class UpdatePlantHealthReading(BaseModel):
    field_id: Optional[int] = None
    timestamp: Optional[datetime] = None
    growth_stage: Optional[str] = None
    canopy_cover_pct: Optional[float] = None
    leaf_area_index: Optional[float] = None
    chlorophyll_content: Optional[float] = None
    disease_risk: Optional[float] = None
    pest_pressure: Optional[float] = None
    nutrient_deficiency: Optional[NutrientDeficiency] = None
    notes: Optional[str] = None
    image_path: Optional[str] = None

class ReadPlantHealthReading(PlantHealthReadingBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ── IrrigationEvent ──

class IrrigationEventBase(BaseModel):
    field_id: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    duration_minutes: Optional[float] = None
    water_volume_liters: Optional[float] = None
    method: IrrigationMethod
    source: Optional[IrrigationSource] = None
    notes: Optional[str] = None

class CreateIrrigationEvent(IrrigationEventBase):
    pass

class UpdateIrrigationEvent(BaseModel):
    field_id: Optional[int] = None
    timestamp: Optional[datetime] = None
    duration_minutes: Optional[float] = None
    water_volume_liters: Optional[float] = None
    method: Optional[IrrigationMethod] = None
    source: Optional[IrrigationSource] = None
    notes: Optional[str] = None

class ReadIrrigationEvent(IrrigationEventBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ── FertilizationEvent ──

class FertilizationEventBase(BaseModel):
    field_id: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    nutrient_type: NutrientType
    amount_kg: Optional[float] = None
    application_method: Optional[str] = None
    notes: Optional[str] = None

class CreateFertilizationEvent(FertilizationEventBase):
    pass

class UpdateFertilizationEvent(BaseModel):
    field_id: Optional[int] = None
    timestamp: Optional[datetime] = None
    nutrient_type: Optional[NutrientType] = None
    amount_kg: Optional[float] = None
    application_method: Optional[str] = None
    notes: Optional[str] = None

class ReadFertilizationEvent(FertilizationEventBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ── HarvestRecord ──

class HarvestRecordBase(BaseModel):
    field_id: int
    crop_cycle_id: int
    harvest_date: date
    yield_kg: Optional[float] = None
    quality_grade: Optional[str] = None
    notes: Optional[str] = None

class CreateHarvestRecord(HarvestRecordBase):
    pass

class UpdateHarvestRecord(BaseModel):
    field_id: Optional[int] = None
    crop_cycle_id: Optional[int] = None
    harvest_date: Optional[date] = None
    yield_kg: Optional[float] = None
    quality_grade: Optional[str] = None
    notes: Optional[str] = None

class ReadHarvestRecord(HarvestRecordBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ── Task ──

class TaskBase(BaseModel):
    field_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    priority: Priority = Priority.medium
    status: TaskStatus = TaskStatus.pending
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None

class CreateTask(TaskBase):
    pass

class UpdateTask(BaseModel):
    field_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[TaskStatus] = None
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class ReadTask(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    completed_at: Optional[datetime] = None
    created_at: datetime


# ── SensorNode ──

class SensorNodeBase(BaseModel):
    name: str
    node_type: NodeType
    status: NodeStatus = NodeStatus.online
    ip_address: Optional[str] = None
    last_seen: Optional[datetime] = None
    config: Optional[dict] = None

class CreateSensorNode(SensorNodeBase):
    pass

class UpdateSensorNode(BaseModel):
    name: Optional[str] = None
    node_type: Optional[NodeType] = None
    status: Optional[NodeStatus] = None
    ip_address: Optional[str] = None
    last_seen: Optional[datetime] = None
    config: Optional[dict] = None

class ReadSensorNode(SensorNodeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ── SensorReading ──

class SensorReadingBase(BaseModel):
    sensor_node_id: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    sensor_type: SensorType
    value: float
    unit: Optional[str] = None

class CreateSensorReading(SensorReadingBase):
    pass

class UpdateSensorReading(BaseModel):
    sensor_node_id: Optional[int] = None
    timestamp: Optional[datetime] = None
    sensor_type: Optional[SensorType] = None
    value: Optional[float] = None
    unit: Optional[str] = None

class ReadSensorReading(SensorReadingBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ── ActuatorCommand ──

class ActuatorCommandBase(BaseModel):
    actuator_type: ActuatorType
    command: ActuatorCmd
    duration_minutes: Optional[float] = None
    triggered_by: TriggerSource
    executed_at: Optional[datetime] = None
    status: ActuatorStatus = ActuatorStatus.pending

class CreateActuatorCommand(ActuatorCommandBase):
    pass

class UpdateActuatorCommand(BaseModel):
    actuator_type: Optional[ActuatorType] = None
    command: Optional[ActuatorCmd] = None
    duration_minutes: Optional[float] = None
    triggered_by: Optional[TriggerSource] = None
    executed_at: Optional[datetime] = None
    status: Optional[ActuatorStatus] = None

class ReadActuatorCommand(ActuatorCommandBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
