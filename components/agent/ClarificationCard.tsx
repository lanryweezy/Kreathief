/**
 * ============================================
 * CLARIFICATION CARD — the agent asks, briefly
 * ============================================
 * Rendered inside the editor's Agent panel when the Clarification Engine
 * decides a prompt is materially underspecified. One round, max 3 questions,
 * option chips for one-tap answers, free text for everything else, and a
 * permanent escape hatch: "Use your judgment" proceeds on DISCLOSED
 * assumptions (the Assumption Ledger below the questions).
 */
import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Icons as AgentIcons } from '../../constants';
import { ClarificationQuestion } from '../../services/clarificationEngine';

const QuestionBlock: React.FC<{
  question: ClarificationQuestion;
  answered?: string;
  onAnswer: (key: ClarificationQuestion['requirementKey'], answer: string) => void;
}> = ({ question, answered, onAnswer }) => {
  const [text, setText] = useState('');

  if (answered) {
    return (
      <div className="flex items-start gap-2 text-left">
        <AgentIcons.Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[10px] text-gray-500 font-medium leading-snug">{question.question}</p>
          <p className="text-[11px] font-bold text-white leading-snug mt-0.5">{answered}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-left">
      <p className="text-[11px] font-bold text-gray-200 leading-snug">{question.question}</p>
      {question.options.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {question.options.map((opt) => (
            <button
              key={opt}
              onClick={() => onAnswer(question.requirementKey, opt)}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-brand-500/25 border border-white/10 hover:border-brand-500/40 rounded-lg text-[10px] font-bold text-gray-300 hover:text-white transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      {question.allowFreeText && (
        <div className="flex gap-1.5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && text.trim()) {
                onAnswer(question.requirementKey, text.trim());
                setText('');
              }
            }}
            placeholder={question.options.length ? 'Or type your own answer…' : 'Type the exact details…'}
            className="flex-1 min-w-0 bg-black/30 border border-white/10 focus:border-brand-500/50 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-gray-600 focus:outline-none"
          />
          <button
            onClick={() => {
              if (text.trim()) {
                onAnswer(question.requirementKey, text.trim());
                setText('');
              }
            }}
            disabled={!text.trim()}
            aria-label={`Answer: ${question.question}`}
            className="px-2.5 py-1.5 bg-brand-600/30 hover:bg-brand-600 disabled:opacity-30 rounded-lg text-[10px] font-black text-brand-200 hover:text-white uppercase transition-colors"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
};

export const ClarificationCard: React.FC = () => {
  const { agentClarification, agentAnswers, answerClarification, proceedWithAssumptions, dismissClarification } =
    useStore(
      useShallow((state) => ({
        agentClarification: state.agentClarification,
        agentAnswers: state.agentAnswers,
        answerClarification: state.answerClarification,
        proceedWithAssumptions: state.proceedWithAssumptions,
        dismissClarification: state.dismissClarification,
      }))
    );

  if (!agentClarification || agentClarification.questions.length === 0) return null;

  const hasBlocking = agentClarification.executionMode === 'require_clarification';

  return (
    <div className="bg-surface-dark-2 border border-brand-500/25 rounded-2xl p-4 space-y-4 shadow-xl shadow-brand-900/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
          <AgentIcons.Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <h4 className="text-[10px] font-black text-white uppercase tracking-widest">
            Before I design — {agentClarification.questions.length} quick question
            {agentClarification.questions.length > 1 ? 's' : ''}
          </h4>
          <p className="text-[10px] text-gray-400 font-medium mt-1 leading-relaxed">
            {hasBlocking
              ? 'Your brief is missing something that would materially change the result. Answer, or let me draft on disclosed assumptions.'
              : 'I can already start — these answers just sharpen the first draft.'}
          </p>
        </div>
      </div>

      <div className="space-y-4 pl-1">
        {agentClarification.questions.map((question, i) => (
          <div key={question.requirementKey} className="space-y-1.5">
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
              {agentAnswers[question.requirementKey] ? '✓' : `${i + 1}.`}
            </span>
            <QuestionBlock
              question={question}
              answered={agentAnswers[question.requirementKey]}
              onAnswer={(key, answer) => answerClarification(key, answer)}
            />
          </div>
        ))}
      </div>

      {/* Assumption Ledger — full transparency on what we'd assume */}
      {agentClarification.assumptions.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-gray-300 transition-colors list-none flex items-center gap-1.5">
            <AgentIcons.Zap className="w-3 h-3 text-amber-400/80" />
            What I'd assume if you skip
            <span className="group-open:rotate-90 transition-transform text-[8px]">▸</span>
          </summary>
          <ul className="mt-2 space-y-1.5 pl-1 border-l border-white/5 ml-1">
            {agentClarification.assumptions.map((a) => (
              <li key={a.id} className="pl-2.5 pr-1 py-0.5">
                <p className="text-[10px] text-gray-400 leading-snug">
                  <span className="font-black text-gray-300 uppercase tracking-tight">{a.category}:</span>{' '}
                  {a.statement}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
        <button
          onClick={dismissClarification}
          className="px-2.5 py-1.5 text-[9px] font-black text-gray-500 hover:text-gray-300 uppercase tracking-widest transition-colors"
        >
          Edit prompt
        </button>
        <button
          onClick={proceedWithAssumptions}
          className="px-3 py-1.5 bg-white/10 hover:bg-brand-600 border border-white/10 rounded-lg text-[10px] font-bold text-white transition-colors flex items-center gap-1.5"
        >
          Use your judgment
          <AgentIcons.Sparkles className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default ClarificationCard;
