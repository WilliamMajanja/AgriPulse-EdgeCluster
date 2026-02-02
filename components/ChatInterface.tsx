import React, { useRef, useEffect } from 'react';
import { Message, Role } from '../types';
import MessageComponent from './Message';
import ChatInput from './ChatInput';
import { ArchitectIcon } from './Icons';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-agri-dark">
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg, index) => (
            <MessageComponent key={index} message={msg} />
          ))}
          {isLoading && (
            <div className="flex items-start gap-4 py-4">
               <ArchitectIcon className="w-8 h-8 text-agri-green flex-shrink-0 mt-2" />
               <div className="max-w-2xl lg:max-w-3xl rounded-lg p-4 text-agri-text bg-agri-med">
                  <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-agri-green rounded-full animate-[pulse_0.8s_ease-in-out_infinite]"></div>
                      <div className="w-2 h-2 bg-agri-green rounded-full animate-[pulse_0.8s_0.1s_ease-in-out_infinite]"></div>
                      <div className="w-2 h-2 bg-agri-green rounded-full animate-[pulse_0.8s_0.2s_ease-in-out_infinite]"></div>
                  </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatInterface;
