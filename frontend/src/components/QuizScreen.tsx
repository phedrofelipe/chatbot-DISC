import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { questions } from '../data/questions';

interface QuizScreenProps {
  currentQ: number;
  onSelect: (type: 'D' | 'I' | 'S' | 'C', text: string) => void;
}

export function QuizScreen({ currentQ, onSelect }: QuizScreenProps) {
  const q = questions[currentQ];
  const pct = Math.round((currentQ / questions.length) * 100);

  const shuffledOptions = useMemo(() => {
    return [...q.opts].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ]);

  return (
    <motion.div
      className="quiz"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      key={currentQ}
    >
      <div className="quiz-header">
        <div className="quiz-progress-info">
          <span>
            Pergunta {currentQ + 1} de {questions.length}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }}></div>
        </div>
      </div>

      <div className="question-card">
        <div className="question-num">Pergunta {currentQ + 1}</div>
        <div className="question-text">{q.text}</div>
        <div className="options-grid">
          {shuffledOptions.map((opt, i) => (
            <button
              key={i}
              className="option-btn"
              onClick={() => onSelect(opt.type, opt.text)}
            >
              <span className="opt-label">{String.fromCharCode(65 + i)}</span>
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
