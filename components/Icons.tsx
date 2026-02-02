import React from 'react';

// Base Icon component for consistent styling
const Icon: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    {children}
  </svg>
);

// Dashboard Icons
export const ServerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3V7.5a3 3 0 013-3h13.5a3 3 0 013 3v3.75a3 3 0 01-3 3m-13.5 0h13.5m-6.75-3.75h.008v.008h-.008v-.008z" /></Icon>
);
export const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></Icon>
);
export const ThermometerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m0 0l-3-3m3 3l3-3M12 6a3 3 0 100-6 3 3 0 000 6z" /></Icon>
);
export const HumidityIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" /></Icon>
);
export const PressureIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>
);
export const BlockchainIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></Icon>
);
export const MoistureIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075 5.925m3.075-5.925v3m-3.15-3l-1.25-3m1.25 3l-1.25-3m0 0l-1.25 3m-1.25-3l-1.25 3m0 0l-1.25-3m2.5 3l-1.25 3" /></Icon>
);
export const JoystickIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h3m-3 3h3m-3 3h3M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></Icon>
);
export const PhIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></Icon>
);
export const NutrientIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.563A.562.562 0 019 14.437V9.564z" /></Icon>
);
export const CogIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5m-15 0a7.5 7.5 0 1115 0m-15 0H3m18 0h-1.5" /></Icon>
);
export const AlertIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></Icon>
);
export const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></Icon>
);
export const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" /></Icon>
);
export const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);
export const ArchitectIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.03 1.123 0 1.131.094 1.976 1.057 1.976 2.192V7.5M8.25 7.5h7.5M8.25 7.5v3.75c0 1.135.845-2.098 1.976-2.192.373-.03.748-.03 1.123 0 1.131.094 1.976-1.057 1.976-2.192V18.75M15.75 14.25v5.25c0 1.135-.845 2.098-1.976-2.192a48.424 48.424 0 01-1.123 0c-1.131-.094-1.976-1.057-1.976-2.192v-5.25M15.75 14.25H8.25" /></Icon>
);
export const PermacultureIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM18 15.75l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 18l-1.035.259a3.375 3.375 0 00-2.456 2.456L18 21.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 18l1.035-.259a3.375 3.375 0 002.456-2.456L18 15.75z" /></Icon>
);
export const LightBulbIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 0h10.5c.621 0 1.125-.504 1.125-1.125v-2.625c0-.621-.504-1.125-1.125-1.125H6.375c-.621 0-1.125.504-1.125 1.125v2.625c0 .621.504 1.125 1.125 1.125zM10.5 19.5V12M13.5 19.5V12m0 0a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zm-3 0a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zm6.75-4.5v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a3.375 3.375 0 00-3.375 3.375V12m6.75 0h-6.75" /></Icon>
);


// Device Component Icons
export const MicrochipIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5M19.5 8.25H21M19.5 12H21m-3.75 3.75H21m-9-1.5h1.5m-1.5 3h1.5m-1.5-6h1.5m-1.5 3h1.5m-1.5-6h1.5m-1.5 3h1.5M12 9v1.5m-3 0h3m-3 0V9" /></Icon>
);
export const HardDriveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7.5a3 3 0 00-3-3H6a3 3 0 00-3 3v10.5a3 3 0 003 3h6m3-4.5h.008v.008H18V12zm3 0h.008v.008H21V12z" /></Icon>
);
export const WrenchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.471-2.471a.563.563 0 01.796 0l2.471 2.471a.563.563 0 010 .796l-2.471 2.471a.563.563 0 01-.796 0l-2.471-2.471a.563.563 0 010-.796M11.42 15.17L5.877 21A2.652 2.652 0 012.25 17.25l5.877-5.877m0 0a2.25 2.25 0 100-3.182 2.25 2.25 0 000 3.182z" /></Icon>
);
export const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M9 3.75H6.75A2.25 2.25 0 004.5 6v12a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0019.5 18V6a2.25 2.25 0 00-2.25-2.25H15M9 3.75a3 3 0 013-3h.008a3 3 0 013 3v.375M9 3.75a3 3 0 00-3 3v.375" /></Icon>
);
export const BeakerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.629.507-1.137 1.137-1.137h1.503a1.125 1.125 0 010 2.25H15.387c-.63 0-1.137-.508-1.137-1.137zM14.25 12a1.125 1.125 0 00-1.125 1.125v2.625c0 .621.504 1.125 1.125 1.125h1.5a1.125 1.125 0 001.125-1.125v-2.625a1.125 1.125 0 00-1.125-1.125h-1.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h8.25a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0114.25 21H6a2.25 2.25 0 01-2.25-2.25V6z" /></Icon>
);
export const CreditCardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z" /></Icon>
);
export const ShoppingCartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962-.328 1.093-.822l.383-1.437a1.125 1.125 0 00-1.093-1.472H4.5M5.25 9h13.5" /></Icon>
);