import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { TaskItem } from '../types';
import { Check, ExternalLink, Info, X } from 'lucide-react';
import Markdown from 'react-markdown';

interface Props {
  task: TaskItem;
  isChecked: boolean;
  onToggle: () => void;
}

export const CheckboxItem: React.FC<Props> = ({ task, isChecked, onToggle }) => {
  const [justChecked, setJustChecked] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isChecked) {
      setJustChecked(true);
      setTimeout(() => setJustChecked(false), 1500);
    }
    onToggle();
  }, [isChecked, onToggle]);

  if (task.isHeader) {
    return (
      <div className="mt-4 mb-2">
        <h4 className="font-bold text-gray-800 flex items-center gap-2">
          <span className="w-1 h-4 bg-gray-500 rounded-full"></span>
          {task.label}
        </h4>
        {task.subtext && <p className="text-xs text-gray-500 ml-3 whitespace-pre-wrap">{task.subtext}</p>}
      </div>
    );
  }

  return (
    <div
      className={`
        group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 relative overflow-hidden flex-wrap
        ${isChecked
          ? 'bg-blue-50 border-blue-200 shadow-sm'
          : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'}
      `}
    >
      {/* Dopamine ripple effect */}
      {justChecked && (
        <div className="dopamine-ripple" />
      )}


      {/* Checkbox - only this is clickable for toggling */}
      <div
        onClick={handleCheckboxClick}
        className={`
          flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer
          transition-all duration-200 relative z-10
          ${isChecked
            ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-300/50'
            : 'border-gray-300 group-hover:border-blue-400 hover:scale-110'}
          ${justChecked ? 'checkbox-pop' : ''}
        `}
      >
        {isChecked && (
          <Check
            size={16}
            className={`text-white ${justChecked ? 'check-draw' : ''}`}
            strokeWidth={3}
          />
        )}
      </div>

      {/* Content area - not clickable for toggle */}
      <div className="flex-grow min-w-0">
        <div className={`text-base leading-snug select-none whitespace-pre-wrap ${isChecked ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
          {task.label}
        </div>
        {task.subtext && (
          <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{task.subtext}</div>
        )}
      </div>

      {/* Action icons - inline */}
      {(task.notes || task.link) && (
        <div className="flex-shrink-0 flex items-center gap-1 ml-1">
          {task.notes && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowNotes(!showNotes); }}
              className={`p-1.5 rounded-md transition-colors ${showNotes
                ? 'text-amber-600 bg-amber-50'
                : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                }`}
              title="查看筆記"
            >
              <Info size={16} />
            </button>
          )}
          {task.link && (() => {
            const urls = task.link!.split('\n').map(u => u.trim()).filter(u => u.length > 0);
            return (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  // 先開後面的分頁（背景），再開第一個（前景）
                  for (let i = urls.length - 1; i >= 0; i--) {
                    window.open(urls[i], '_blank');
                  }
                  if (!isChecked) {
                    setJustChecked(true);
                    setTimeout(() => setJustChecked(false), 1500);
                    onToggle();
                  }
                }}
                className="text-gray-400 hover:text-blue-600 p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                title={urls.length > 1 ? `開啟 ${urls.length} 個連結` : '開啟連結'}
              >
                <ExternalLink size={16} />
              </button>
            );
          })()}
        </div>
      )}

      {/* Notes popup modal */}
      {showNotes && task.notes && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowNotes(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-amber-500" />
                <span className="font-bold text-gray-800 text-sm">{task.label}</span>
              </div>
              <button onClick={() => setShowNotes(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 text-gray-700 text-sm leading-relaxed">
              <Markdown components={{
                h1: ({ children }) => <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.8em 0 0.4em', color: '#1f2937' }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0.7em 0 0.3em', color: '#1f2937' }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0.6em 0 0.2em', color: '#374151' }}>{children}</h3>,
                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{children}</a>,
                code: ({ children }) => <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 4, fontSize: '0.85em' }}>{children}</code>,
                ul: ({ children }) => <ul style={{ paddingLeft: '1.2em', margin: '0.4em 0' }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ paddingLeft: '1.2em', margin: '0.4em 0' }}>{children}</ol>,
                li: ({ children }) => <li style={{ margin: '0.2em 0' }}>{children}</li>,
                p: ({ children }) => <p style={{ margin: '0.4em 0' }}>{children}</p>,
              }}>{task.notes}</Markdown>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CSS animations */}
      <style>{`
        .dopamine-ripple {
          position: absolute;
          left: 12px;
          top: 12px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.5), rgba(147, 51, 234, 0.3), transparent 70%);
          animation: rippleExpand 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          pointer-events: none;
          z-index: 0;
        }

        @keyframes rippleExpand {
          0% { transform: scale(0); opacity: 1; }
          50% { opacity: 0.6; }
          100% { transform: scale(50); opacity: 0; }
        }

        .checkbox-pop {
          animation: popBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes popBounce {
          0% { transform: scale(1); }
          20% { transform: scale(1.5); }
          40% { transform: scale(0.85); }
          60% { transform: scale(1.2); }
          80% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }

        .check-draw {
          animation: drawCheck 0.5s ease-out 0.1s both;
        }

        @keyframes drawCheck {
          0% { opacity: 0; transform: scale(0) rotate(-45deg); }
          50% { opacity: 1; transform: scale(1.3) rotate(5deg); }
          75% { transform: scale(0.95) rotate(-2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }

        .sparkle {
          position: absolute;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 5;
        }

        .sparkle-1 {
          background: #fbbf24;
          left: 18px; top: 8px;
          animation: sparkleShoot1 1.1s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        .sparkle-2 {
          background: #a78bfa;
          left: 10px; top: 6px;
          animation: sparkleShoot2 1.0s cubic-bezier(0.22, 0.61, 0.36, 1) 0.08s forwards;
        }
        .sparkle-3 {
          background: #34d399;
          left: 22px; top: 18px;
          animation: sparkleShoot3 1.15s cubic-bezier(0.22, 0.61, 0.36, 1) 0.15s forwards;
        }
        .sparkle-4 {
          background: #f472b6;
          left: 6px; top: 20px;
          animation: sparkleShoot4 1.1s cubic-bezier(0.22, 0.61, 0.36, 1) 0.12s forwards;
        }
        .sparkle-5 {
          background: #60a5fa;
          left: 26px; top: 12px;
          animation: sparkleShoot5 1.0s cubic-bezier(0.22, 0.61, 0.36, 1) 0.2s forwards;
        }
        .sparkle-6 {
          background: #fb923c;
          left: 14px; top: 24px;
          animation: sparkleShoot6 1.05s cubic-bezier(0.22, 0.61, 0.36, 1) 0.05s forwards;
        }

        @keyframes sparkleShoot1 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          60% { opacity: 0.8; }
          100% { transform: translate(28px, -24px) scale(1.8); opacity: 0; }
        }
        @keyframes sparkleShoot2 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          60% { opacity: 0.8; }
          100% { transform: translate(-22px, -28px) scale(1.5); opacity: 0; }
        }
        @keyframes sparkleShoot3 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          60% { opacity: 0.8; }
          100% { transform: translate(30px, 20px) scale(1.6); opacity: 0; }
        }
        @keyframes sparkleShoot4 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          60% { opacity: 0.8; }
          100% { transform: translate(-24px, 22px) scale(1.4); opacity: 0; }
        }
        @keyframes sparkleShoot5 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          60% { opacity: 0.8; }
          100% { transform: translate(32px, -10px) scale(1.7); opacity: 0; }
        }
        @keyframes sparkleShoot6 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          60% { opacity: 0.8; }
          100% { transform: translate(-18px, 26px) scale(1.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
};