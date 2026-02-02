import React from 'react';
import { MicrochipIcon, BeakerIcon, HardDriveIcon, WrenchIcon, ShieldIcon, ShoppingCartIcon, CogIcon } from './Icons';

const bomData = {
    coreHardware: {
        title: 'Core Cluster Hardware (Owned Assets)',
        icon: <MicrochipIcon className="w-6 h-6 text-agri-green" />,
        items: [
            { item: 'Raspberry Pi 5 (16GB)', spec: '3x Compute Nodes' },
            { item: 'Raspberry Pi AI HAT+ 2', spec: 'Hailo-10H (40 TOPS)' },
            { item: 'Raspberry Pi Sense HAT', spec: 'Env Sensors + 8x8 LED' },
            { item: 'Raspberry Pi NVMe HAT', spec: 'M.2 M-Key Adapter' },
        ],
    },
    periphery: [
        {
            title: 'Sensors & Vision',
            icon: <BeakerIcon className="w-6 h-6 text-agri-green" />,
            items: [
                { item: 'Global Shutter Camera', spec: '120FPS / Wide-Angle', qty: 1 },
                { item: 'Capacitive Soil Moisture', spec: 'Corrosion Resistant', qty: 3 },
                { item: 'Industrial Soil pH Probe', spec: 'BNC + I2C Interface', qty: 1 },
                { item: 'ADS1115 ADC Module', spec: '16-bit 4-Ch I2C', qty: 1 },
                { item: 'Waterproof Temp Probe', spec: 'DS18B20 (1-Wire)', qty: 2 },
            ]
        },
        {
            title: 'Storage & Networking',
            icon: <HardDriveIcon className="w-6 h-6 text-agri-green" />,
            items: [
                { item: 'NVMe SSD (512GB)', spec: 'PCIe Gen 3', qty: 1 },
                { item: 'Gigabit Network Switch', spec: '5-Port Unmanaged', qty: 1 },
                { item: 'Ethernet Cables', spec: '0.5m Cat6 Flat', qty: 4 },
            ]
        },
        {
            title: 'Power & Thermal',
            icon: <WrenchIcon className="w-6 h-6 text-agri-green" />,
            items: [
                { item: 'Official 27W Power Supply', spec: '5V 5A USB-C PD', qty: 3 },
                { item: 'RPi 5 Active Cooler', spec: 'PWM Fan + Heatsink', qty: 3 },
                { item: 'Stacking Headers', spec: 'Extra Long', qty: 3 },
            ]
        },
        {
            title: 'Actuators & Control',
            icon: <CogIcon className="w-6 h-6 text-agri-green" />,
            items: [
                { item: 'LED Grow Lights', spec: 'Full Spectrum Quantum Board', qty: 2 },
                { item: 'Ventilation Fans', spec: '120mm PWM High-Pressure', qty: 2 },
                { item: 'Peristaltic Dosing Pump', spec: '3-Channel for N/P/K', qty: 1 },
                { item: '12V Solenoid Valve', spec: 'Normally Closed (Irrigation)', qty: 1 },
                { item: 'Atomizing Mister Nozzles', spec: 'High-Pressure Brass', qty: 4 },
                { item: '8-Channel Relay Module', spec: '5V High/Low Trigger', qty: 1 },
            ]
        },
        {
            title: 'Enclosure & Rigging',
            icon: <ShieldIcon className="w-6 h-6 text-agri-green" />,
            items: [
                { item: 'IP65 Vented Enclosure', spec: 'Polycarbonate', qty: 1 },
                { item: 'Cable Glands (PG7/PG9)', spec: 'Waterproof Nylon', qty: 4 },
                { item: 'Nylon Standoff Kit', spec: 'M2.5 Assorted', qty: 1 },
            ]
        },
    ],
};

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <div className="flex items-center gap-3 mb-4">
        {icon}
        <h2 className="text-xl font-bold text-white tracking-wider">{title}</h2>
    </div>
);

const BomDisplay: React.FC = () => {
    return (
        <main className="h-full p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Core Hardware */}
                <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-white/10 shadow-lg">
                    <SectionHeader icon={bomData.coreHardware.icon} title={bomData.coreHardware.title} />
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-white/10 text-agri-text-muted">
                            <tr>
                                <th className="p-2">Item</th>
                                <th className="p-2">Specification</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bomData.coreHardware.items.map((item, i) => (
                                <tr key={i} className="border-b border-white/5">
                                    <td className="p-2 font-semibold text-agri-text">{item.item}</td>
                                    <td className="p-2 text-agri-text-muted">{item.spec}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Periphery & Sensors */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {bomData.periphery.map(section => (
                         <div key={section.title} className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-white/10 shadow-lg">
                            <SectionHeader icon={section.icon} title={section.title} />
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-white/10 text-agri-text-muted">
                                    <tr>
                                        <th className="p-2">Item</th>
                                        <th className="p-2">Specification</th>
                                        <th className="p-2 text-center">Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {section.items.map((item, i) => (
                                        <tr key={i} className="border-b border-white/5">
                                            <td className="p-2 font-semibold text-agri-text">{item.item}</td>
                                            <td className="p-2 text-agri-text-muted">{item.spec}</td>
                                            <td className="p-2 text-center font-mono">{item.qty}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
                
                 {/* Product Link Section */}
                 <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6 border border-white/10 shadow-lg text-center">
                    <SectionHeader icon={<ShoppingCartIcon className="w-6 h-6 text-agri-green" />} title="Product & Pricing Information" />
                    <p className="text-agri-text-muted mb-4">For the latest pricing, availability, and to purchase the components for the AgriPulse Edge-Cluster Kit, please visit our recommended suppliers.</p>
                    <div className="flex flex-wrap justify-center items-center gap-4">
                        <a 
                            href="https://www.raspberrypi.com/products/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-agri-green text-white font-bold rounded-lg shadow-lg hover:bg-green-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-opacity-50"
                        >
                            Raspberry Pi Store
                        </a>
                        <a 
                            href="https://www.adafruit.com/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-agri-light border border-white/10 text-white font-bold rounded-lg shadow-lg hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-opacity-50"
                        >
                            Adafruit Industries
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default BomDisplay;