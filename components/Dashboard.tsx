import React from 'react';
import { AgriPulseData, LogEntry } from '../types';
import NodeCard from './NodeCard';
import { format } from 'date-fns';

interface DashboardProps {
  data: AgriPulseData;
  onToggleCamera: () => void;
}

const LogPanel: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
    const logContainerRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = 0;
        }
    }, [logs]);

    return (
        <div className="bg-black/20 backdrop-blur-lg rounded-xl p-4 border border-white/10 shadow-lg col-span-1 md:col-span-2 lg:col-span-4">
            <h3 className="font-bold text-white tracking-wider mb-3">System Logs</h3>
            <div ref={logContainerRef} className="h-48 overflow-y-auto font-mono text-sm text-agri-text-muted pr-2 flex flex-col-reverse">
                <div>
                {logs.map((log, index) => (
                    <div key={index} className="flex gap-4 items-start mb-1">
                        <span className="text-gray-500 whitespace-nowrap">{format(log.timestamp, 'HH:mm:ss')}</span>
                        <span className="text-agri-green w-20 flex-shrink-0 font-semibold">{`[${log.source}]`}</span>
                        <span className="flex-1 text-agri-text break-words">{log.message}</span>
                    </div>
                ))}
                </div>
            </div>
        </div>
    );
}

const Dashboard: React.FC<DashboardProps> = ({ data, onToggleCamera }) => {
  return (
    <main className="h-full p-6 overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        <NodeCard node={data.master} />
        <NodeCard node={data.sentry} onToggleCamera={onToggleCamera} />
        <NodeCard node={data.telemetry} />
        <LogPanel logs={data.logs} />
      </div>
    </main>
  );
};

export default Dashboard;