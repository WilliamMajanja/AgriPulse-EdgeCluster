import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, Role } from '../types';
import { ArchitectIcon } from './Icons';

interface MessageProps {
  message: Message;
}

const MarkdownStyles: React.FC<{ children: string }> = ({ children }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 text-white" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3 text-white" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-2 text-white" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 pl-4" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 pl-4" {...props} />,
                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                code: ({node, inline, ...props}) => {
                    if (inline) {
                        return <code className="bg-agri-dark text-amber-300 px-1.5 py-1 rounded text-sm font-mono" {...props} />;
                    }
                    return <pre className="bg-agri-dark/80 p-4 rounded-md overflow-x-auto my-4 text-sm"><code className="text-amber-300 font-mono" {...props} /></pre>;
                },
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-agri-green pl-4 italic text-agri-text-muted my-4" {...props} />,
                a: ({node, ...props}) => <a className="text-sky-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
            }}
        >
            {children}
        </ReactMarkdown>
    );
};


const MessageComponent: React.FC<MessageProps> = ({ message }) => {
  const isArchitect = message.role === Role.ARCHITECT;

  return (
    <div className={`flex items-start gap-4 py-4 ${isArchitect ? '' : 'flex-row-reverse'}`}>
      {isArchitect && (
        <div className="w-10 h-10 bg-agri-med border border-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <ArchitectIcon className="w-6 h-6 text-agri-green" />
        </div>
      )}
      <div className={`max-w-2xl lg:max-w-3xl rounded-xl p-4 text-agri-text border border-white/10 shadow-lg ${isArchitect ? 'bg-black/20 backdrop-blur-lg' : 'bg-agri-green/10'}`}>
        <MarkdownStyles>{message.content}</MarkdownStyles>
      </div>
    </div>
  );
};

export default MessageComponent;