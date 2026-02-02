import React, { useEffect, useRef } from 'react';
import { MasterNode, SentryNode, TelemetryNode } from '../types';
import { ServerIcon, CameraIcon, ThermometerIcon, HumidityIcon, PressureIcon, BlockchainIcon, PlayIcon, StopIcon, MoistureIcon, JoystickIcon, PhIcon, NutrientIcon, CogIcon, PermacultureIcon, LightBulbIcon } from './Icons';
import { formatDistanceToNow } from 'date-fns';

type NodeCardProps = {
  node: MasterNode | SentryNode | TelemetryNode;
  onToggleCamera?: () => void;
};

const StatusIndicator: React.FC<{ status: 'online' | 'warning' | 'offline' }> = ({ status }) => {
    const baseClasses = "w-3 h-3 rounded-full";
    const color = status === 'online' ? 'bg-green-400' : status === 'warning' ? 'bg-yellow-400' : 'bg-red-500';
    const glow = status === 'online' ? 'shadow-[0_0_8px_#28a745]' : status === 'warning' ? 'shadow-[0_0_8px_#f59e0b]' : 'shadow-[0_0_8px_#ef4444]';
    const pulseClass = status === 'online' ? 'animate-[pulse_1.5s_ease-in-out_infinite]' : '';
    return <div className={`${baseClasses} ${color} ${glow} ${pulseClass}`}></div>;
}

const ActuatorStatusIndicator: React.FC<{ active: boolean }> = ({ active }) => (
    <span className={`px-3 py-1 text-xs font-bold rounded-full ${active ? 'bg-green-400/20 text-green-300' : 'bg-white/5 text-agri-text-muted'}`}>
        {active ? 'ACTIVE' : 'IDLE'}
    </span>
);

const DataRow: React.FC<{ label: string, value: string | number, unit?: string, icon?: React.ReactNode }> = ({ label, value, unit, icon }) => (
    <div className="flex justify-between items-center text-agri-text">
        <div className="flex items-center gap-2">
            {icon}
            <span className="text-agri-text-muted text-sm">{label}</span>
        </div>
        <span className="font-mono font-semibold text-agri-text">{value} {unit}</span>
    </div>
);

// FIX: The NodeCard component was not returning any JSX, causing a type error.
// A proper card structure with a header and body has been added. The component is also
// now correctly exported as the default module export to fix import errors.
const NodeCard: React.FC<NodeCardProps> = ({ node, onToggleCamera }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const isSentryNode = (n: typeof node): n is SentryNode => n.id === 'sentry';
    if (isSentryNode(node) && node.isCameraActive) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Error accessing camera:", err);
          if(onToggleCamera) onToggleCamera(); // Toggle back on error
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [node.id, (node as SentryNode).isCameraActive, onToggleCamera]);

  const renderContent = () => {
    switch (node.id) {
      case 'master':
        return (
            <>
                <DataRow label="Uptime" value={node.uptime} />
                <DataRow label="PiNet Clients" value={node.pinetClients} />
                <hr className="border-white/10 my-2"/>
                <div className="text-agri-text-muted text-sm flex items-center gap-2">
                    <CogIcon className="w-5 h-5 text-agri-green"/>
                    <span className="font-medium">Farm Control Actuators</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-agri-text-muted font-medium text-sm ml-7">Water Pump</span>
                    <ActuatorStatusIndicator active={node.actuators.pump.on} />
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-agri-text-muted font-medium text-sm ml-7">Mister System</span>
                    <ActuatorStatusIndicator active={node.actuators.misters.on} />
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-agri-text-muted font-medium text-sm ml-7">LED Grow Lights</span>
                    <ActuatorStatusIndicator active={node.actuators.lights.on} />
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-agri-text-muted font-medium text-sm ml-7">Ventilation Fans</span>
                    <ActuatorStatusIndicator active={node.actuators.fans.on} />
                </div>
                <hr className="border-white/10 my-2"/>
                 <div className="text-agri-text-muted text-sm flex items-center gap-2">
                    <NutrientIcon className="w-5 h-5 text-agri-green"/>
                    <span className="font-medium">Fertilization</span>
                </div>
                {node.actuators.lastFertilization ? (
                    <div className="text-sm text-agri-text font-mono ml-7 mt-1">
                        <p>Last: {node.actuators.lastFertilization.amount}ml of {node.actuators.lastFertilization.nutrient}</p>
                        <p className="text-agri-text-muted text-xs">{formatDistanceToNow(node.actuators.lastFertilization.timestamp, { addSuffix: true })}</p>
                    </div>
                ) : (
                    <p className="text-sm text-agri-text-muted font-mono ml-7 mt-1">No events logged.</p>
                )}
            </>
        );
      case 'sentry':
        const sentryNode = node as SentryNode;
        const detectionColor = sentryNode.detection === 'Leaf Rust' ? 'text-red-400' : 'text-green-300';
        return (
          <>
            <div className="aspect-video bg-black/50 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden group border border-white/10">
                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-300 ${sentryNode.isCameraActive ? 'opacity-100' : 'opacity-0'}`}></video>
                <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-[2px] transition-opacity duration-300 ${sentryNode.isCameraActive ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                    { !sentryNode.isCameraActive ? (
                        <>
                            <p className="text-agri-text-muted text-sm mb-4 font-semibold">[ CAMERA FEED INACTIVE ]</p>
                            <button onClick={onToggleCamera} className="flex items-center gap-2 px-4 py-2 bg-agri-green/80 hover:bg-agri-green text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
                                <PlayIcon className="w-5 h-5" />
                                Start Feed
                            </button>
                        </>
                    ) : (
                        <button onClick={onToggleCamera} className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
                            <StopIcon className="w-5 h-5" />
                            Stop Feed
                        </button>
                    )}
                </div>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-agri-text-muted font-medium">Detection</span>
                <span className={`font-bold text-lg ${detectionColor}`}>{sentryNode.detection}</span>
            </div>
            <hr className="border-white/10 my-2"/>
            <DataRow label="Inference Latency" value={sentryNode.latency} unit="ms" />
            <DataRow label="Detections Today" value={sentryNode.detectionsToday} />
          </>
        );
      case 'telemetry':
        const telemetryNode = node as TelemetryNode;
        return (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <DataRow label="Temperature" value={telemetryNode.temperature} unit="°C" icon={<ThermometerIcon className="w-5 h-5 text-agri-green" />} />
                <DataRow label="Humidity" value={telemetryNode.humidity} unit="%" icon={<HumidityIcon className="w-5 h-5 text-agri-green" />} />
                <DataRow label="Pressure" value={telemetryNode.pressure} unit="mbar" icon={<PressureIcon className="w-5 h-5 text-agri-green" />} />
                <DataRow label="Moisture" value={telemetryNode.moisture} unit="%" icon={<MoistureIcon className="w-5 h-5 text-agri-green" />} />
                <DataRow label="Soil pH" value={telemetryNode.ph.toFixed(2)} icon={<PhIcon className="w-5 h-5 text-agri-green" />} />
                <DataRow label="Joystick" value={telemetryNode.joystick} icon={<JoystickIcon className="w-5 h-5 text-agri-green" />} />
                
                <div className="col-span-2"><hr className="border-white/10 my-1"/></div>

                <DataRow label="Nitrogen (N)" value={telemetryNode.nitrogen} unit="ppm" icon={<NutrientIcon className="w-5 h-5 text-agri-green" />} />
                <DataRow label="Phosphorus (P)" value={telemetryNode.phosphorus} unit="ppm" icon={<NutrientIcon className="w-5 h-5 text-agri-green" />} />
                <DataRow label="Potassium (K)" value={telemetryNode.potassium} unit="ppm" icon={<NutrientIcon className="w-5 h-5 text-agri-green" />} />
                <DataRow label="Ammonia (NH₃)" value={telemetryNode.ammonia} unit="ppm" icon={<NutrientIcon className="w-5 h-5 text-agri-green" />} />

                <div className="col-span-2"><hr className="border-white/10 my-1"/></div>
                
                <div className="col-span-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <PermacultureIcon className="w-5 h-5 text-agri-green" />
                        <span className="text-agri-text-muted text-sm">Permaculture Mode</span>
                    </div>
                    <ActuatorStatusIndicator active={telemetryNode.permacultureMode} />
                </div>

                <div className="col-span-2">
                    <DataRow label="Last TxID" value={`${telemetryNode.lastTxID.substring(0, 12)}...`} icon={<BlockchainIcon className="w-5 h-5 text-agri-green" />} />
                </div>
            </div>
        );
    }
  };

  const iconMap = {
    master: <ServerIcon className="w-6 h-6 text-agri-green" />,
    sentry: <CameraIcon className="w-6 h-6 text-agri-green" />,
    telemetry: <ThermometerIcon className="w-6 h-6 text-agri-green" />,
  };
  
  return (
    <div className="bg-black/20 backdrop-blur-lg rounded-xl p-4 flex flex-col gap-3 border border-white/10 shadow-lg transition-all duration-300 hover:border-white/20 hover:shadow-2xl h-full">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                {iconMap[node.id]}
                <h3 className="font-bold text-white tracking-wider">{node.name}</h3>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-agri-text-muted">{node.status}</span>
                <StatusIndicator status={node.status} />
            </div>
        </div>
        <div className="flex-1 space-y-2">
            {renderContent()}
        </div>
    </div>
  );
};

export default NodeCard;