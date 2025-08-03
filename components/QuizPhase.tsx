import React, { useRef, useEffect } from 'react';
import { QuizQuestion, UserAnswer, QuestionTypeId, MultipleChoiceQuestion, MultipleAnswerQuestion } from '../types';
import { QUESTION_TYPE_DISPLAY_NAMES } from '../constants';

interface QuizPhaseProps {
    quizData: QuizQuestion[];
    userAnswers: UserAnswer[];
    markedQuestions: boolean[];
    currentQuestionIndex: number;
    onAnswer: (index: number, answer: UserAnswer) => void;
    onNavigate: (index: number) => void;
    onToggleMark: (index: number) => void;
    onSubmit: () => void;
}

const StarIcon: React.FC<{ filled?: boolean, className?: string }> = ({ filled, className }) => (
    <svg className={className} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.05 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.95-.69L11.049 2.927z" />
    </svg>
);

const QuizPhase: React.FC<QuizPhaseProps> = ({ quizData, userAnswers, markedQuestions, currentQuestionIndex, onAnswer, onNavigate, onToggleMark, onSubmit }) => {
    const question = quizData[currentQuestionIndex];
    const directoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const currentButton = directoryRef.current?.children[currentQuestionIndex] as HTMLElement;
        if (currentButton) {
            currentButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [currentQuestionIndex]);
    
    if (!question) return <div>Loading question...</div>;

    const answeredCount = userAnswers.filter(a => a !== null && (!Array.isArray(a) || a.length > 0)).length;

    const handleSelectAnswer = (answer: string | boolean) => {
        onAnswer(currentQuestionIndex, answer);
    };

    const handleMultiSelectAnswer = (option: string) => {
        const currentSelection = (userAnswers[currentQuestionIndex] as string[] | null) || [];
        const newSelection = currentSelection.includes(option)
            ? currentSelection.filter(item => item !== option)
            : [...currentSelection, option];
        onAnswer(currentQuestionIndex, newSelection);
    };
    
    const getOptionClass = (isSelected: boolean, align: 'left' | 'center' = 'left') => {
        const baseClasses = 'option-btn w-full p-2 rounded-lg border-2 flex items-center transition-all duration-200 ease-in-out hover:transform hover:-translate-y-0.5 hover:shadow-lg';
        const textAlignClass = align === 'left' ? 'text-left' : 'text-center justify-center';

        if (isSelected) {
            return `${baseClasses} ${textAlignClass} bg-[#3d84c6] text-white border-[#3d84c6]`;
        } else {
            return `${baseClasses} ${textAlignClass} bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 hover:border-[#3d84c6]/50 dark:hover:border-[#3d84c6]/50`;
        }
    };
    
    return (
        <div>
            <div className="mb-6 p-4 bg-gray-200/50 dark:bg-black/20 rounded-lg">
                <div className="text-right text-sm text-inherit opacity-70 mb-2">已作答 (Answered): {answeredCount} / {quizData.length}</div>
                <div ref={directoryRef} className="flex items-center space-x-2 overflow-x-auto pb-2">
                    {quizData.map((_, index) => {
                        const answer = userAnswers[index];
                        const isAnswered = answer !== null && (!Array.isArray(answer) || answer.length > 0);
                        let btnClass = 'dir-unanswered bg-gray-300 dark:bg-slate-700 text-gray-800 dark:text-gray-300';
                        if (index === currentQuestionIndex) btnClass = 'dir-current bg-[#3d84c6] text-white scale-110 shadow-lg';
                        else if (isAnswered) btnClass = 'dir-answered bg-[#3d84c6]/80 text-white';
                        
                        return (
                            <button 
                                key={index} 
                                onClick={() => onNavigate(index)}
                                aria-label={`Go to question ${index + 1}, ${isAnswered ? 'answered' : 'unanswered'}`}
                                className={`directory-btn w-10 h-10 flex-shrink-0 font-bold rounded-md flex items-center justify-center relative transition-all duration-200 ${btnClass}`}
                            >
                                {index + 1}
                                {markedQuestions[index] && <span className="absolute -top-1.5 -right-1.5 text-[#f5c544] text-lg">★</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    問題 {currentQuestionIndex + 1} / {quizData.length} <span className="text-lg text-inherit opacity-80">({QUESTION_TYPE_DISPLAY_NAMES[question.type]})</span>
                </h2>
                <button onClick={() => onToggleMark(currentQuestionIndex)} title="標記此題 / Mark this question" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                    <StarIcon filled={markedQuestions[currentQuestionIndex]} className="w-6 h-6 text-[#f5c544]" />
                </button>
            </div>

            <div className="quiz-section bg-white dark:bg-[#394252] p-6 rounded-lg min-h-[250px]">
                <p className="text-xl md:text-2xl leading-relaxed mb-8">{ 'question' in question ? question.question : question.statement }</p>
                <div className="space-y-4">
                    {question.type === QuestionTypeId.MULTIPLE_CHOICE && (question.shuffledOptions || question.options).map((option, i) => (
                        <button key={i} onClick={() => handleSelectAnswer(option)} className={getOptionClass(userAnswers[currentQuestionIndex] === option)}>
                            <span className="font-bold mr-3 py-2 px-3 bg-gray-200 dark:bg-slate-600 rounded-md text-gray-800 dark:text-gray-200">{String.fromCharCode(65 + i)}</span>
                            <span>{option}</span>
                        </button>
                    ))}
                    {question.type === QuestionTypeId.TRUE_FALSE && (
                        [
                            {text: '是 (True)', value: true, label: 'A'}, 
                            {text: '非 (False)', value: false, label: 'B'}
                        ].map(opt => (
                            <button key={opt.text} onClick={() => handleSelectAnswer(opt.value)} className={getOptionClass(userAnswers[currentQuestionIndex] === opt.value)}>
                               <span className="font-bold mr-3 py-2 px-3 bg-gray-200 dark:bg-slate-600 rounded-md text-gray-800 dark:text-gray-200">{opt.label}</span>
                               <span>{opt.text}</span>
                            </button>
                        ))
                    )}
                    {question.type === QuestionTypeId.MULTIPLE_ANSWER && (question.shuffledOptions || question.options).map((option, i) => (
                        <button key={i} onClick={() => handleMultiSelectAnswer(option)} className={getOptionClass((userAnswers[currentQuestionIndex] as string[] | null || []).includes(option))}>
                           <span className="font-bold mr-3 py-2 px-3 bg-gray-200 dark:bg-slate-600 rounded-md text-gray-800 dark:text-gray-200">{String.fromCharCode(65 + i)}</span>
                           <span>{option}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <button onClick={() => onNavigate(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0} className="bg-gray-400 hover:bg-gray-500 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50">上一題 / Previous</button>
                {currentQuestionIndex === quizData.length - 1 ? (
                    <button onClick={onSubmit} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition">提交試卷 / Submit</button>
                ) : (
                    <button onClick={() => onNavigate(currentQuestionIndex + 1)} className="bg-[#3d84c6] hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition">下一題 / Next</button>
                )}
            </div>
        </div>
    );
};

export default QuizPhase;