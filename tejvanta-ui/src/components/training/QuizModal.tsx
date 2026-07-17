import { useState, useMemo } from 'react'
import { getQuestionsForTile, evaluateQuiz, hasPassedQuiz } from '../../services/quizEngine'
import type { QuizQuestion } from '../../services/quizEngine'
import { addDailyActivity, addXP, checkAndAwardAchievements } from '../../services/learningEngine'

interface QuizModalProps {
  tileId: string
  onClose: () => void
  onComplete: (passed: boolean, xp: number, achievements: string[]) => void
}

export function QuizModal({ tileId, onClose, onComplete }: QuizModalProps) {
  const questions = useMemo(() => getQuestionsForTile(tileId), [tileId])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
        <div className="bg-surface border border-gray-600 rounded-lg shadow-xl p-6 w-96 text-xs" onClick={e => e.stopPropagation()}>
          <h3 className="text-sm font-bold text-white mb-2">No Quiz Available</h3>
          <p className="text-gray-400">This module has no questions yet.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-tej-600 rounded text-white font-medium text-xs">Close</button>
        </div>
      </div>
    )
  }

  const q = questions[current]
  const selected = answers[q.id]
  const hasPrevPass = hasPassedQuiz(tileId)

  const handleAnswer = (idx: number) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [q.id]: idx }))
  }

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) return
    const result = evaluateQuiz(tileId, Object.entries(answers).map(([questionId, selectedIndex]) => ({ questionId, selectedIndex })))
    setResult(result)
    setSubmitted(true)
    if (result.passed) {
      addDailyActivity('quizzes')
      addXP(25)
    }
    const newAchs = checkAndAwardAchievements()
    onComplete(result.passed, result.passed ? 25 : 0, newAchs.map(a => a.name))
  }

  const handleNext = () => {
    if (current < questions.length - 1) setCurrent(c => c + 1)
  }

  const handlePrev = () => {
    if (current > 0) setCurrent(c => c - 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-surface border border-gray-600 rounded-lg shadow-xl w-[480px] max-h-[85vh] flex flex-col text-xs" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h3 className="font-semibold text-white">Strategy Quiz</h3>
          <div className="flex items-center gap-2">
            {hasPrevPass && <span className="text-[9px] text-green-400 bg-green-600/20 px-1.5 py-0.5 rounded">✓ Passed before</span>}
            <span className="text-gray-400">{current + 1}/{questions.length}</span>
            <button onClick={onClose} className="text-gray-500 hover:text-white">&times;</button>
          </div>
        </div>

        {!submitted ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${q.difficulty === 1 ? 'bg-green-600/20 text-green-400' : q.difficulty === 2 ? 'bg-yellow-600/20 text-yellow-400' : 'bg-red-600/20 text-red-400'}`}>
                {'●'.repeat(q.difficulty)}{'○'.repeat(3 - q.difficulty)}
              </span>
              <span className="text-gray-500 text-[9px]">{q.type.replace(/-/g, ' ')}</span>
            </div>

            <p className="text-sm text-white font-medium">{q.prompt}</p>

            <div className="space-y-1.5">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className={`w-full text-left px-3 py-2 rounded border text-xs transition ${
                    selected === i
                      ? 'border-tej-500 bg-tej-600/20 text-white'
                      : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <span className="font-mono mr-2 text-gray-500">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className={`text-center py-4 ${result?.passed ? 'text-green-400' : 'text-red-400'}`}>
              <div className="text-2xl font-bold">{result?.score.toFixed(0)}%</div>
              <div className="text-sm mt-1">{result?.passed ? '✓ Passed!' : '✗ Try Again'}</div>
            </div>

            <div className="space-y-2">
              {questions.map((question, i) => {
                const ans = answers[question.id]
                const isCorrect = ans === question.correctIndex
                return (
                  <div key={question.id} className={`px-3 py-2 rounded border ${isCorrect ? 'border-green-700 bg-green-600/10' : 'border-red-700 bg-red-600/10'}`}>
                    <div className="text-[10px] text-gray-300 font-medium mb-1">Q{i + 1}: {question.prompt}</div>
                    <div className="text-[10px] text-gray-500">Your answer: {question.options[ans]}</div>
                    {!isCorrect && <div className="text-[10px] text-green-400 mt-0.5">Correct: {question.options[question.correctIndex]}</div>}
                    <div className="text-[9px] text-gray-600 mt-1 italic">{question.explanation}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
          <div>
            {!submitted && current > 0 && (
              <button onClick={handlePrev} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300">← Prev</button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300">Close</button>
            {!submitted ? (
              current < questions.length - 1 ? (
                <button onClick={handleNext} disabled={selected === undefined} className="px-3 py-1.5 bg-tej-600 hover:bg-tej-500 rounded text-xs text-white disabled:opacity-40">Next →</button>
              ) : (
                <button onClick={handleSubmit} disabled={Object.keys(answers).length < questions.length} className="px-3 py-1.5 bg-tej-600 hover:bg-tej-500 rounded text-xs text-white font-bold disabled:opacity-40">Submit</button>
              )
            ) : (
              <button onClick={onClose} className="px-3 py-1.5 bg-tej-600 hover:bg-tej-500 rounded text-xs text-white font-bold">Done</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
