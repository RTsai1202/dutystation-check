import React, { useState, useCallback } from 'react';
import { TaskItem } from '../types';
import { Check, ExternalLink } from 'lucide-react';

interface Props {
  task: TaskItem;
  isChecked: boolean;
  onToggle: () => void;
}

export const CheckboxItem: React.FC<Props> = ({ task, isChecked, onToggle }) => {
  const [justChecked, setJustChecked] = useState(false);

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isChecked) {
      setJustChecked(true);
      setTimeout(() => setJustChecked(false), 700);
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
        {task.subtext && <p className="text-xs text-gray-500 ml-3">{task.subtext}</p>}
      </div>
    );
  }

  return (
    <div
      className={`
        group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 relative overflow-hidden
        ${isChecked
          ? 'bg-blue-50 border-blue-200 shadow-sm'
          : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'}
      `}
    >
      {/* Dopamine ripple effect */}
      {justChecked && (
        <div className="dopamine-ripple" />
      )}

      {/* Sparkle particles */}
      {justChecked && (
        <>
          <div className="sparkle sparkle-1" />
          <div className="sparkle sparkle-2" />
          <div className="sparkle sparkle-3" />
          <div className="sparkle sparkle-4" />
          <div className="sparkle sparkle-5" />
          <div className="sparkle sparkle-6" />
        </>
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
        <div className={`text-base leading-snug select-none ${isChecked ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
          {task.label}
        </div>
        {task.subtext && (
          <div className="text-xs text-gray-500 mt-1">{task.subtext}</div>
        )}
      </div>

      {/* External link icon - pushed right with margin */}
      {task.link && (
        <a
          href={task.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 text-gray-400 hover:text-blue-600 p-1.5 ml-2 rounded-md hover:bg-blue-50 transition-colors"
          title="開啟連結"
        >
          <ExternalLink size={16} />
        </a>
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
          background: radial-gradient(circle, rgba(59, 130, 246, 0.4), rgba(147, 51, 234, 0.2), transparent 70%);
          animation: rippleExpand 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          pointer-events: none;
          z-index: 0;
        }

        @keyframes rippleExpand {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(40); opacity: 0; }
        }

        .checkbox-pop {
          animation: popBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes popBounce {
          0% { transform: scale(1); }
          30% { transform: scale(1.4); }
          50% { transform: scale(0.9); }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        .check-draw {
          animation: drawCheck 0.3s ease-out 0.1s both;
        }

        @keyframes drawCheck {
          0% { opacity: 0; transform: scale(0) rotate(-45deg); }
          60% { opacity: 1; transform: scale(1.2) rotate(0deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }

        .sparkle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 5;
        }

        .sparkle-1 {
          background: #fbbf24;
          left: 18px; top: 8px;
          animation: sparkleShoot1 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .sparkle-2 {
          background: #a78bfa;
          left: 10px; top: 6px;
          animation: sparkleShoot2 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.05s forwards;
        }
        .sparkle-3 {
          background: #34d399;
          left: 22px; top: 18px;
          animation: sparkleShoot3 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s forwards;
        }
        .sparkle-4 {
          background: #f472b6;
          left: 6px; top: 20px;
          animation: sparkleShoot4 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.08s forwards;
        }
        .sparkle-5 {
          background: #60a5fa;
          left: 26px; top: 12px;
          animation: sparkleShoot5 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.12s forwards;
        }
        .sparkle-6 {
          background: #fb923c;
          left: 14px; top: 24px;
          animation: sparkleShoot6 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.03s forwards;
        }

        @keyframes sparkleShoot1 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(20px, -18px) scale(1.5); opacity: 0; }
        }
        @keyframes sparkleShoot2 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(-16px, -20px) scale(1.2); opacity: 0; }
        }
        @keyframes sparkleShoot3 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(22px, 14px) scale(1.3); opacity: 0; }
        }
        @keyframes sparkleShoot4 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(-18px, 16px) scale(1.1); opacity: 0; }
        }
        @keyframes sparkleShoot5 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(24px, -6px) scale(1.4); opacity: 0; }
        }
        @keyframes sparkleShoot6 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(-12px, 20px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};