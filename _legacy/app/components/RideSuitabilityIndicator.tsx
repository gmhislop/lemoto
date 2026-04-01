'use client';

import { RideRecommendation } from '@/app/lib/rideEngine';

interface RideSuitabilityIndicatorProps {
  recommendation: RideRecommendation;
  title?: string;
}

export default function RideSuitabilityIndicator({ 
  recommendation, 
  title = "Ride Status" 
}: RideSuitabilityIndicatorProps) {
  const getIndicatorColor = () => {
    if (recommendation.suitable) return 'text-green-500';
    if (recommendation.score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getIndicatorIcon = () => {
    if (recommendation.suitable) return '✅';
    if (recommendation.score >= 40) return '⚠️';
    return '❌';
  };

  const getScoreColor = () => {
    if (recommendation.score >= 80) return 'bg-green-500';
    if (recommendation.score >= 60) return 'bg-yellow-500';
    if (recommendation.score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      {/* Main indicator */}
      <div className="flex items-center justify-center mb-6">
        <div className={`text-6xl ${getIndicatorColor()}`}>
          {getIndicatorIcon()}
        </div>
      </div>

      {/* Status text */}
      <div className="text-center mb-4">
        <p className={`text-xl font-bold ${getIndicatorColor()}`}>
          {recommendation.suitable ? 'Ride OK' : 'Not Recommended'}
        </p>
      </div>

      {/* Score bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Ride Score</span>
          <span>{recommendation.score}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getScoreColor()}`}
            style={{ width: `${recommendation.score}%` }}
          ></div>
        </div>
      </div>

      {/* Reasons */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700">Conditions:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          {recommendation.reasons.map((reason, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
        
        {recommendation.warnings && recommendation.warnings.length > 0 && (
          <div className="mt-3">
            <h4 className="font-medium text-yellow-700">Warnings:</h4>
            <ul className="text-sm text-yellow-600 space-y-1">
              {recommendation.warnings.map((warning, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">⚠️</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendation.bestTimeSlots && recommendation.bestTimeSlots.length > 0 && (
          <div className="mt-3">
            <h4 className="font-medium text-green-700">Best times today:</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {recommendation.bestTimeSlots.map((time, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded"
                >
                  {time}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}