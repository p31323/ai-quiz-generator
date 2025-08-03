import React, { useState, useEffect } from 'react';
import { QuizQuestion, UserAnswer, QuestionTypeId, MultipleChoiceQuestion, MultipleAnswerQuestion } from '../types';
import { QUESTION_TYPE_DISPLAY_NAMES } from '../constants';

interface ResultsPhaseProps {
    quizData: QuizQuestion[];
    userAnswers: UserAnswer[];
    markedQuestions: boolean[];
    onRestart: () => void;
    onDownload: (type: 'questions' | 'answers') => void;
}

const AnalysisCard: React.FC<{ question: QuizQuestion, userAnswer: UserAnswer, isCorrect: boolean, isMarked: boolean, index: number }> = ({ question, userAnswer, isCorrect, isMarked, index }) => {
    const typeName = QUESTION_TYPE_DISPLAY_NAMES[question.type] || 'Unknown Type';
    
    const formatAnswerWithLabel = (q: QuizQuestion, ans: UserAnswer): string => {
        if (ans === null || (Array.isArray(ans) && ans.length === 0)) {
            return '<i class="opacity-70">未作答 / Not Answered</i>';
        }

        switch(q.type) {
            case QuestionTypeId.TRUE_FALSE:
                return ans === true ? '(A) 是 (True)' : '(B) 非 (False)';
            
            case QuestionTypeId.MULTIPLE_CHOICE: {
                const options = q.shuffledOptions || q.options;
                const answerIndex = options.findIndex(opt => opt === ans);
                if (answerIndex !== -1) {
                    return `(${String.fromCharCode(65 + answerIndex)}) ${ans}`;
                }
                return String(ans);
            }
                
            case QuestionTypeId.MULTIPLE_ANSWER: {
                if (Array.isArray(ans)) {
                     const options = q.shuffledOptions || q.options;
                     return ans.map(a => {
                        const answerIndex = options.findIndex(opt => opt === a);
                        if (answerIndex !== -1) {
                            return `(${String.fromCharCode(65 + answerIndex)}) ${a}`;
                        }
                        return a;
                    }).join(', ');
                }
                return '';
            }
            default:
                return String(ans);
        }
    };

    const correctAnswer = question.type === QuestionTypeId.MULTIPLE_ANSWER ? question.answers : question.answer;
    
    const userAnswerHtml = formatAnswerWithLabel(question, userAnswer);
    const correctAnswerHtml = formatAnswerWithLabel(question, correctAnswer);
    
    return (
        <div className={`analysis-card p-5 rounded-lg border-l-4 bg-white dark:bg-slate-800 ${isCorrect ? 'border-blue-500' : 'border-red-500'}`}>
            <p className="font-bold text-lg mb-2">
                {index + 1}. {'question' in question ? question.question : question.statement}
                <span className="text-sm font-normal text-inherit opacity-70 ml-2">({typeName})</span>
                {isMarked && <span className="text-[#f5c544] font-bold ml-2">(★ 已標記 / Marked)</span>}
            </p>
            <div className={`text-sm mb-2 ${isCorrect ? 'text-blue-500' : 'text-red-500'}`}>
                <strong className="font-semibold text-gray-800 dark:text-gray-200">您的答案 / Your Answer: </strong>
                <span dangerouslySetInnerHTML={{ __html: userAnswerHtml }} />
            </div>
            <div className="text-sm text-blue-500 mt-2">
                <strong className="font-semibold text-gray-800 dark:text-gray-200">正確答案 / Correct Answer: </strong>
                <span dangerouslySetInnerHTML={{ __html: correctAnswerHtml }} />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/20">
                <strong className="font-semibold text-gray-800 dark:text-gray-200">答案解析 / Explanation:</strong>
                <p className="text-sm text-inherit opacity-90">{question.explanation}</p>
            </div>
        </div>
    );
};

const ResultsPhase: React.FC<ResultsPhaseProps> = ({ quizData, userAnswers, markedQuestions, onRestart, onDownload }) => {
    const [animatedScore, setAnimatedScore] = useState(0);

    const correctCount = quizData.reduce((count, q, index) => {
        const userAnswer = userAnswers[index];
        let isCorrect = false;
        switch (q.type) {
            case QuestionTypeId.TRUE_FALSE:
            case QuestionTypeId.MULTIPLE_CHOICE:
                if (userAnswer === q.answer) isCorrect = true;
                break;
            case QuestionTypeId.MULTIPLE_ANSWER:
                if (userAnswer && q.answers && Array.isArray(userAnswer) && userAnswer.length === q.answers.length && [...userAnswer].sort().toString() === [...q.answers].sort().toString()) {
                    isCorrect = true;
                }
                break;
        }
        return isCorrect ? count + 1 : count;
    }, 0);

    const score = quizData.length > 0 ? Math.round((correctCount / quizData.length) * 100) : 0;
    
    useEffect(() => {
        if (score === 0) {
            setAnimatedScore(0);
            return;
        };
        let start = 0;
        const end = score;
        const duration = 1000;
        const stepTime = Math.abs(Math.floor(duration / end));
        const timer = setInterval(() => {
            start += 1;
            setAnimatedScore(start);
            if (start === end) {
                clearInterval(timer);
            }
        }, stepTime);
        return () => clearInterval(timer);
    }, [score]);
    
    let scoreFeedback = "別氣餒，從錯誤中學習！ / Don't be discouraged, learn from your mistakes!";
    if (score === 100) scoreFeedback = "太棒了，完美作答！ / Perfect Score!";
    else if (score >= 80) scoreFeedback = "表現優異，繼續努力！ / Excellent work, keep it up!";
    else if (score >= 60) scoreFeedback = "不錯的嘗試，再接再厲！ / Good try, keep practicing!";

    return (
        <div>
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4">測驗結果 / Quiz Results</h2>
            <div className="text-center mb-8">
                <p className="text-xl text-inherit opacity-80">您的分數 / Your Score</p>
                <p className="text-7xl font-bold my-2 text-blue-400">{animatedScore}</p>
                <p className="text-lg text-inherit opacity-70">{scoreFeedback}</p>
            </div>

            <div className="flex justify-center gap-4 my-6">
                <button onClick={() => onDownload('questions')} className="bg-[#3d84c6] hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition">下載題目卷 (PDF)</button>
                <button onClick={() => onDownload('answers')} className="bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-inherit font-bold py-3 px-6 rounded-lg transition">下載答案卷 (PDF)</button>
            </div>

            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                 {quizData.map((q, index) => {
                     const userAnswer = userAnswers[index];
                     let isCorrect = false;
                     switch (q.type) {
                        case QuestionTypeId.MULTIPLE_CHOICE:
                        case QuestionTypeId.TRUE_FALSE:
                            isCorrect = userAnswer === q.answer;
                            break;
                        case QuestionTypeId.MULTIPLE_ANSWER:
                            isCorrect = userAnswer && q.shuffledOptions && Array.isArray(userAnswer) && userAnswer.length === q.answers.length && [...userAnswer].sort().toString() === [...q.answers].sort().toString();
                            break;
                    }
                     return <AnalysisCard key={index} index={index} question={q} userAnswer={userAnswer} isCorrect={isCorrect} isMarked={markedQuestions[index]} />;
                 })}
            </div>
             <button onClick={onRestart} className="w-full mt-8 bg-[#3d84c6] hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg text-xl transition-all duration-300">
                重新開始 / Restart
            </button>
        </div>
    );
};

export default ResultsPhase;