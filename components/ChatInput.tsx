import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './Icons';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const SuggestionButton: React.FC<{ text: string, onClick: () => void, disabled: boolean }> = ({ text, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-agri-text-muted hover:text-agri-text text-xs rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {text}
    </button>
);


const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // A small buffer is added to prevent scrollbar flicker on single-line text
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSendMessage(text);
      setText('');
    }
  };
  
  const handleSuggestionClick = (suggestionText: string) => {
    if (!isLoading) {
      onSendMessage(suggestionText);
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-4 bg-black/10 backdrop-blur-sm border-t border-white/10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
            <SuggestionButton text="Turn on pump for 5 mins" onClick={() => handleSuggestionClick("The soil looks dry, turn on the pump for 5 minutes.")} disabled={isLoading} />
            <SuggestionButton text="Explain the ADC module's role" onClick={() => handleSuggestionClick("Explain the role of the ADS1115 ADC module in the telemetry node.")} disabled={isLoading} />
            <SuggestionButton text="How to calibrate sensors?" onClick={() => handleSuggestionClick("How do I calibrate the chemical soil sensor?")} disabled={isLoading} />
        </div>
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the architect..."
            className="flex-1 bg-agri-light border border-white/10 focus:border-agri-green focus:ring-1 focus:ring-agri-green rounded-lg p-3 resize-none max-h-48 transition-all duration-200 placeholder-agri-text-muted text-agri-text"
            rows={1}
            disabled={isLoading}
            />
            <button
            type="submit"
            disabled={isLoading || !text.trim()}
            className="bg-agri-green text-white p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-500 transition-all duration-200 flex-shrink-0 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-agri-green focus:ring-opacity-50"
            aria-label="Send message"
            >
            {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
            ) : (
                <SendIcon className="w-6 h-6" />
            )}
            </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;