
export interface Node {
  id: 'master' | 'sentry' | 'telemetry';
  name: string;
  status: 'online' | 'warning' | 'offline';
}

export interface ActuatorState {
    pump: { on: boolean; };
    misters: { on: boolean; };
    lights: { on: boolean; };
    fans: { on: boolean; };
    lastFertilization: { nutrient: 'N' | 'P' | 'K', amount: number, timestamp: Date } | null;
}

export interface MasterNode extends Node {
  id: 'master';
  uptime: string;
  pinetClients: number;
  actuators: ActuatorState;
}

export interface SentryNode extends Node {
  id: 'sentry';
  detection: 'Healthy' | 'Leaf Rust';
  latency: number; // in ms
  detectionsToday: number;
  isCameraActive: boolean;
}

export interface TelemetryData {
  temperature: number; // celsius
  humidity: number; // percent
  pressure: number; // mbar
  moisture: number; // percent
  ph: number;
  nitrogen: number; // ppm
  phosphorus: number; // ppm
  potassium: number; // ppm
  ammonia: number; // ppm
}

export interface TelemetryNode extends Node, TelemetryData {
  id: 'telemetry';
  lastFingerprint: string;
  lastTxID: string;
  joystick: 'idle' | 'up' | 'down' | 'left' | 'right' | 'click';
  permacultureMode: boolean;
}

export interface LogEntry {
  timestamp: Date;
  source: 'MASTER' | 'SENTRY' | 'TELEMETRY' | 'SYSTEM';
  message: string;
}

export interface AgriPulseData {
  master: MasterNode;
  sentry: SentryNode;
  telemetry: TelemetryNode;
  logs: LogEntry[];
}

export enum Role {
  USER,
  ARCHITECT,
}

export interface Message {
  role: Role;
  content: string;
  // Internal properties for function calling history
  _functionCall?: any;
  _functionResponse?: any;
}