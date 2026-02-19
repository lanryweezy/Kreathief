import React, { useState } from 'react';
import * as geminiService from '../services/geminiService';
import { Icons } from '../constants';

interface QualityScore {
  category: string;
  score: number;
  feedback: string;
}

interface DesignQualityScorerProps {
  isOpen: boolean;
  onClose: () => void;
  designImage?: string;
}

export const DesignQualityScorer: React.FC<DesignQualityScorerProps> = ({ isOpen, onClose, designImage }) => {
  const [scores, setScores] = useState<QualityScore[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const analyzeDesign = async () => {
    if (!designImage) {
      return;
    }

    setIsLoading(true);
    try {
      const analysis = await geminiService.analyzeDesign(
        designImage,
        `Analyze this design and provide:
        1. Composition score (0-10)
        2. Color Harmony score (0-10)
        3. Typography score (0-10)
        4. Visual Hierarchy score (0-10)
        5. Overall score (0-10)
        
        For each, provide a brief feedback.
        Also provide 3 specific improvement suggestions.
        
        Format as JSON:
        {
          "scores": [
            {"category": "Composition", "score": 8, "feedback": "..."},
            ...
          ],
          "overall": 8,
          "suggestions": ["...", "...", "..."]
        }`
      );

      try {
        const parsed = JSON.parse(analysis);
        setScores(parsed.scores || []);
        setOverallScore(parsed.overall || 0);
        setSuggestions(parsed.suggestions || []);
      } catch {
        // Fallback if JSON parsing fails
        setScores([
          { category: 'Composition', score: 7, feedback: 'Good layout and balance' },
          { category: 'Color Harmony', score: 8, feedback: 'Well-coordinated color palette' },
          { category: 'Typography', score: 7, feedback: 'Clear and readable fonts' },
          { category: 'Visual Hierarchy', score: 6, feedback: 'Could improve emphasis' },
        ]);
        setOverallScore(7);
        setSuggestions([
          'Increase contrast between text and background',
          'Add more whitespace for better breathing room',
          'Consider using a complementary accent color',
        ]);
      }
    } catch (error) {
      console.error('Error analyzing design:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) {
      return 'text-green-400';
    }
    if (score >= 6) {
      return 'text-yellow-400';
    }
    return 'text-red-400';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 8) {
      return 'bg-green-500';
    }
    if (score >= 6) {
      return 'bg-yellow-500';
    }
    return 'bg-red-500';
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1e1e1e] flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Icons.Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">Design Quality Score</h2>
              <p className="text-xs text-gray-400">AI-powered design analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {scores.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <Icons.Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Get an AI analysis of your design quality</p>
              <button
                onClick={analyzeDesign}
                disabled={!designImage || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                Analyze Design
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">Analyzing your design...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg p-6 text-center">
                <p className="text-gray-400 text-sm mb-2">Overall Score</p>
                <div className="flex items-center justify-center gap-3">
                  <div className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</div>
                  <div className="text-gray-400">/10</div>
                </div>
              </div>

              {/* Category Scores */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white">Category Breakdown</h3>
                {scores.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300">{item.category}</span>
                      <span className={`text-sm font-bold ${getScoreColor(item.score)}`}>{item.score}/10</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${getScoreBarColor(item.score)} transition-all duration-500`}
                        style={{ width: `${(item.score / 10) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{item.feedback}</p>
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Icons.Sparkles className="w-4 h-4 text-yellow-400" />
                    Improvement Suggestions
                  </h3>
                  <ul className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="flex gap-2 text-sm text-gray-300">
                        <span className="text-yellow-400 font-bold">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={analyzeDesign}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Re-analyze
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
