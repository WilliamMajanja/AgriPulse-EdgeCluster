import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import Alert from './components/Alert';
import BomDisplay from './components/BomDisplay';
import { AgriPulseData, LogEntry, Message, Role, TelemetryNode } from './types';
import { format, differenceInSeconds } from 'date-fns';
import { getArchitectResponse } from './services/geminiService';

type View = 'dashboard' | 'chat' | 'components';
type AlertType = 'info' | 'warning';

const App: React.FC = () => {
  const [startTime] = useState(new Date());
  const [view, setView] = useState<View>('dashboard');
  const [alert, setAlert] = useState<{ message: string; type: AlertType } | null>(null);
  
  // Dashboard state
  const [data, setData] = useState<AgriPulseData>({
    master: {
      id: 'master',
      name: 'PI-NET MASTER NODE',
      status: 'online',
      uptime: '0d 0h 0m 0s',
      pinetClients: 2,
      actuators: {
        pump: { on: false },
        misters: { on: false },
        lights: { on: false },
        fans: { on: false },
        lastFertilization: null,
      },
    },
    sentry: {
      id: 'sentry',
      name: 'SENTRY NODE (HAILO AI)',
      status: 'online',
      detection: 'Healthy',
      latency: 42,
      detectionsToday: 0,
      isCameraActive: false,
    },
    telemetry: {
      id: 'telemetry',
      name: 'TELEMETRY NODE (SENSORS)',
      status: 'online',
      temperature: 24.1,
      humidity: 68.2,
      pressure: 1012.5,
      moisture: 75.3,
      ph: 6.8,
      nitrogen: 120,
      phosphorus: 65,
      potassium: 150,
      ammonia: 5.2,
      permacultureMode: false,
      joystick: 'idle',
      lastFingerprint: '...',
      lastTxID: '...',
    },
    logs: [],
  });
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: Role.ARCHITECT,
      content: "I am the Lead Systems Architect for AgriPulse. My knowledge base is configured for your specific hardware Bill of Materials. How can I help you with your edge-computing implementation today?"
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const showAlert = (message: string, type: AlertType) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  // Dashboard logic
  const addLog = useCallback((source: LogEntry['source'], message: string) => {
    setData(prev => ({
      ...prev,
      logs: [{ timestamp: new Date(), source, message }, ...prev.logs.slice(0, 100)],
    }));
  }, []);

  const handleToggleCamera = useCallback((newState?: boolean) => {
    setData(prev => {
      const isNowActive = newState ?? !prev.sentry.isCameraActive;
      if (prev.sentry.isCameraActive === isNowActive) return prev; // No change
      addLog('SYSTEM', `Sentry node camera feed ${isNowActive ? 'activated' : 'deactivated'}.`);
      return {
        ...prev,
        sentry: { ...prev.sentry, isCameraActive: isNowActive },
      };
    });
  }, [addLog]);

  const handleLoadAIModel = (modelName: string) => {
    addLog('SENTRY', `AI command received: Load model '${modelName}'.`);
  };
  
  const handleControlPump = (state: boolean, duration: number) => {
    setData(prev => ({ ...prev, master: { ...prev.master, actuators: { ...prev.master.actuators, pump: { on: state } } } }));
    addLog('SYSTEM', `Water pump turned ${state ? 'ON' : 'OFF'}${duration > 0 ? ` for ${duration} minutes` : ''}.`);
    if (state && duration > 0) {
        setTimeout(() => {
            setData(prev => ({ ...prev, master: { ...prev.master, actuators: { ...prev.master.actuators, pump: { on: false } } } }));
            addLog('SYSTEM', 'Water pump cycle finished.');
        }, duration * 1000); // Using seconds instead of minutes for demo
    }
  };

  const handleControlMisters = (state: boolean, duration: number) => {
    setData(prev => ({ ...prev, master: { ...prev.master, actuators: { ...prev.master.actuators, misters: { on: state } } } }));
    addLog('SYSTEM', `Mister system turned ${state ? 'ON' : 'OFF'}${duration > 0 ? ` for ${duration} minutes` : ''}.`);
     if (state && duration > 0) {
        setTimeout(() => {
            setData(prev => ({ ...prev, master: { ...prev.master, actuators: { ...prev.master.actuators, misters: { on: false } } } }));
            addLog('SYSTEM', 'Mister cycle finished.');
        }, duration * 1000); // Using seconds instead of minutes for demo
    }
  };

  const handleControlFertilizer = (nutrient: 'N'|'P'|'K', amount: number) => {
      setData(prev => ({ ...prev, master: { ...prev.master, actuators: { ...prev.master.actuators, lastFertilization: { nutrient, amount, timestamp: new Date() } } } }));
      addLog('SYSTEM', `Fertilizer line activated. Dispensing ${amount}ml of ${nutrient}.`);
  };

  const handleTogglePermacultureMode = (state: boolean) => {
      setData(prev => ({ ...prev, telemetry: { ...prev.telemetry, permacultureMode: state } }));
      addLog('TELEMETRY', `Permaculture Enforcement mode has been ${state ? 'ACTIVATED' : 'DEACTIVATED'}.`);
  };

  const handleControlLights = (state: boolean) => {
    setData(prev => ({ ...prev, master: { ...prev.master, actuators: { ...prev.master.actuators, lights: { on: state } } } }));
    addLog('SYSTEM', `LED Grow Lights turned ${state ? 'ON' : 'OFF'}.`);
  };

  const handleControlFans = (state: boolean) => {
    setData(prev => ({ ...prev, master: { ...prev.master, actuators: { ...prev.master.actuators, fans: { on: state } } } }));
    addLog('SYSTEM', `Ventilation Fans turned ${state ? 'ON' : 'OFF'}.`);
  };

  // Dashboard simulation effect
  useEffect(() => {
    addLog('SYSTEM', 'AgriPulse Viable Product BOM v1.0 configured.');
    addLog('MASTER', 'PiNet server online. 2 clients connected.');
    addLog('SENTRY', 'Hailo-10H NPU initialized. Global Shutter Camera active.');
    addLog('TELEMETRY', 'Sense Hat, ADS1115 ADC, and Soil Probes online. Minima node synced.');

    const interval = setInterval(() => {
      setData(prev => {
        const now = new Date();
        const totalSeconds = differenceInSeconds(now, startTime);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        let newTemp = parseFloat((prev.telemetry.temperature + (Math.random() - 0.5) * 0.2).toFixed(1));
        let newHumidity = parseFloat((prev.telemetry.humidity + (Math.random() - 0.5) * 0.5).toFixed(1));
        
        let newMoisture = prev.telemetry.moisture;
        if(prev.master.actuators.pump.on) {
            newMoisture = Math.min(100, newMoisture + 1.5);
        } else {
            newMoisture = Math.max(0, parseFloat((prev.telemetry.moisture - (Math.random() * 0.2)).toFixed(1)));
        }
        
        if(newMoisture < 30 && (totalSeconds % 30) < 3) {
            showAlert('Soil moisture is critically low!', 'warning');
        }

        // Chemical sensor simulation
        let { ph, nitrogen, phosphorus, potassium, ammonia } = prev.telemetry;
        ph = parseFloat((ph + (Math.random() - 0.5) * 0.02).toFixed(2));
        nitrogen = Math.max(0, parseFloat((nitrogen - Math.random() * 0.1).toFixed(1)));
        phosphorus = Math.max(0, parseFloat((phosphorus - Math.random() * 0.05).toFixed(1)));
        potassium = Math.max(0, parseFloat((potassium - Math.random() * 0.08).toFixed(1)));
        ammonia = Math.max(0, parseFloat((ammonia + (Math.random() - 0.55) * 0.3).toFixed(1)));

        // Simulate nutrient replenishment every 2 simulated hours
        if (minutes > 0 && minutes % 120 === 0 && seconds < 3) {
            addLog('SYSTEM', 'Nutrient replenishment cycle triggered.');
            nitrogen = 120 + (Math.random() * 10);
            phosphorus = 65 + (Math.random() * 5);
            potassium = 150 + (Math.random() * 8);
        }

        let newDetection = prev.sentry.detection;
        let newDetectionsToday = prev.sentry.detectionsToday;
        if (prev.sentry.isCameraActive && Math.random() < 0.05) {
          newDetection = 'Leaf Rust';
          newDetectionsToday++;
          addLog('SENTRY', `Threat detected: Leaf Rust. Latency: ${prev.sentry.latency}ms.`);
          showAlert(`Sentry Node Alert: ${newDetection} detected!`, 'warning');
        } else if (!prev.sentry.isCameraActive && newDetection === 'Leaf Rust') {
           newDetection = 'Healthy';
        }

        let newTxID = prev.telemetry.lastTxID;
        if (minutes > 0 && minutes % 5 === 0 && seconds < 3) {
            const hash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random()*16).toString(16)).join('');
            addLog('TELEMETRY', `Farm Fingerprint committed to Minima. TxID: ${hash.substring(0, 16)}...`);
            newTxID = hash;
        }
        
        let newJoystick: TelemetryNode['joystick'] = 'idle';
        if (prev.telemetry.joystick !== 'idle') {
            newJoystick = 'idle';
        } else if (Math.random() < 0.03) { // 3% chance to trigger an event
            const events: TelemetryNode['joystick'][] = ['up', 'down', 'left', 'right', 'click'];
            newJoystick = events[Math.floor(Math.random() * events.length)];
            addLog('TELEMETRY', `Joystick Event: ${newJoystick.toUpperCase()}. Manual override triggered.`);
        }

        return {
          ...prev,
          master: { ...prev.master, uptime },
          sentry: { ...prev.sentry, detection: newDetection, detectionsToday: newDetectionsToday, latency: 38 + Math.floor(Math.random() * 10) },
          telemetry: { ...prev.telemetry, temperature: newTemp, humidity: newHumidity, moisture: newMoisture, ph, nitrogen, phosphorus, potassium, ammonia, joystick: newJoystick, lastTxID: newTxID },
        };
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [startTime, addLog]);
  
  // Chat logic
  const handleSendMessage = async (text: string) => {
    const newUserMessage: Message = { role: Role.USER, content: text };
    const currentHistory = [...messages, newUserMessage];
    setMessages(currentHistory);
    setIsLoading(true);

    try {
        const response = await getArchitectResponse(currentHistory);

        if (response.functionCalls) {
            const functionCall = response.functionCalls[0];
            const functionName = functionCall.name;
            let functionResultPayload;

            const argsString = JSON.stringify(functionCall.args);
            addLog('SYSTEM', `Architect is executing: ${functionName}(${argsString})`);

            switch(functionName) {
                case 'toggle_sentry_camera':
                    const state = functionCall.args.state === 'on';
                    handleToggleCamera(state);
                    functionResultPayload = { status: 'ok', detail: `Camera has been turned ${functionCall.args.state}.` };
                    break;
                case 'load_ai_model':
                    const model = functionCall.args.model_name;
                    handleLoadAIModel(model);
                    functionResultPayload = { status: 'ok', detail: `Model ${model} has been loaded.` };
                    break;
                case 'control_pump':
                    handleControlPump(functionCall.args.state === 'on', functionCall.args.duration_minutes || 0);
                    functionResultPayload = { status: 'ok', detail: 'Pump command executed.' };
                    break;
                case 'control_misters':
                    handleControlMisters(functionCall.args.state === 'on', functionCall.args.duration_minutes || 0);
                    functionResultPayload = { status: 'ok', detail: 'Mister command executed.' };
                    break;
                case 'control_fertilizer_line':
                    handleControlFertilizer(functionCall.args.nutrient, functionCall.args.amount_ml);
                    functionResultPayload = { status: 'ok', detail: 'Fertilizer command executed.' };
                    break;
                case 'toggle_permaculture_mode':
                    handleTogglePermacultureMode(functionCall.args.state);
                    functionResultPayload = { status: 'ok', detail: `Permaculture mode set to ${functionCall.args.state}.` };
                    break;
                case 'control_lights':
                    handleControlLights(functionCall.args.state === 'on');
                    functionResultPayload = { status: 'ok', detail: 'Lights command executed.' };
                    break;
                case 'control_fans':
                    handleControlFans(functionCall.args.state === 'on');
                    functionResultPayload = { status: 'ok', detail: 'Fans command executed.' };
                    break;
                default:
                    functionResultPayload = { status: 'error', detail: 'Unknown function call.' };
            }

            const historyForNextCall: Message[] = [
                ...currentHistory,
                { role: Role.ARCHITECT, content: '', _functionCall: response.functionCalls },
                { role: Role.USER, content: '', _functionResponse: { name: functionName, response: functionResultPayload } }
            ];

            const finalResponse = await getArchitectResponse(historyForNextCall);
            if (finalResponse.text) {
                const architectMessage: Message = { role: Role.ARCHITECT, content: finalResponse.text };
                setMessages(prev => [...prev, architectMessage]);
            }
        } else if (response.text) {
            const architectMessage: Message = { role: Role.ARCHITECT, content: response.text };
            setMessages(prev => [...prev, architectMessage]);
        }
    } catch (error) {
        console.error(error);
        const errorMessage: Message = { role: Role.ARCHITECT, content: "Sorry, I encountered an error. Please try again." };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  const NavButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${active ? 'bg-agri-green text-white shadow-md' : 'text-agri-text-muted hover:bg-agri-light hover:text-white'}`}>
        {children}
    </button>
  );

  return (
    // FIX: The 'tailwind' object is not available at runtime. Replaced the dynamic
    // color lookup with hardcoded hex values that match the application's theme
    // to resolve the error while preserving the intended gradient background.
    <div className="h-screen w-screen flex flex-col bg-agri-dark font-sans" style={{ backgroundImage: `radial-gradient(circle at top left, #161B22 0%, #0D1117 40%)`}}>
      <Alert alert={alert} onClose={() => setAlert(null)} />
      <header className="bg-gradient-to-r from-agri-med to-agri-dark p-4 border-b border-white/10 shadow-lg flex justify-between items-center flex-shrink-0">
        <h1 className="text-xl md:text-2xl font-bold text-center text-white tracking-wide">
          <span className="text-agri-green font-black">AgriPulse</span> Dashboard
        </h1>
        <div className="flex items-center gap-2">
            <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')}>Dashboard</NavButton>
            <NavButton active={view === 'chat'} onClick={() => setView('chat')}>Architect Chat</NavButton>
            <NavButton active={view === 'components'} onClick={() => setView('components')}>Device Components</NavButton>
            <div className="text-agri-text-muted text-xs font-mono hidden md:block ml-4">{format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        {view === 'dashboard' && <Dashboard data={data} onToggleCamera={handleToggleCamera} />}
        {view === 'chat' && <ChatInterface messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />}
        {view === 'components' && <BomDisplay />}
      </div>
    </div>
  );
};

export default App;