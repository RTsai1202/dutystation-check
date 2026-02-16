import React from 'react';
import { TaskItem } from '../types';
import { Check, ExternalLink } from 'lucide-react';

interface Props {
  task: TaskItem;
  isChecked: boolean;
  onToggle: () => void;
}

export const CheckboxItem: React.FC<Props> = ({ task, isChecked, onToggle }) => {
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
        group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer
        ${isChecked 
          ? 'bg-blue-50 border-blue-200 shadow-sm' 
          : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'}
      `}
      onClick={onToggle}
    >
      <div className={`
        flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors duration-200
        ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}
      `}>
        {isChecked && <Check size={16} className="text-white" strokeWidth={3} />}
      </div>
      
      <div className="flex-grow">
        <div className={`text-base leading-snug select-none ${isChecked ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
          {task.label}
        </div>
        {task.subtext && (
          <div className="text-xs text-gray-500 mt-1">{task.subtext}</div>
        )}
      </div>

      {task.link && (
        <a 
          href={task.link} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-gray-400 hover:text-blue-600 p-1"
          title="Open Link"
        >
          <ExternalLink size={16} />
        </a>
      )}
    </div>
  );
};