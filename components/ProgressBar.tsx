import React from 'react';

interface Props {
  current: number;
  total: number;
}

export const ProgressBar: React.FC<Props> = ({ current, total }) => {
  const percentage = Math.min(100, (current / total) * 100);

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-indigo-600 transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
