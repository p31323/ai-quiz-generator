import React, { useState, useEffect, useCallback } from 'react';
import { AppPhase, QuestionTypeId, QuizQuestion, UserAnswer, ModalState } from './types';
import { generateQuizFromText } from './services/geminiService';
import { parseFiles } from './services/fileParser';
import { downloadPdf } from './services/pdfGenerator';
import Header from './components/Header';
import LoadingOverlay from './components/LoadingOverlay';
import Modal from './components/Modal';
import UploadPhase from './components/UploadPhase';
import QuizPhase from './components/QuizPhase';
import ResultsPhase from './components/ResultsPhase';

const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [phase, setPhase] = useState<AppPhase>(AppPhase.UPLOAD);
    const [loading, setLoadingState] = useState<{ isLoading: boolean; text: string; progress?: number }>({ isLoading: false, text: '', progress: 0 });
    const [modal, setModal] = useState<ModalState>({ isOpen: false, title: '', content: '' });

    const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
    const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
    const [markedQuestions, setMarkedQuestions] = useState<boolean[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const initialTheme = savedTheme || 'dark';
        setTheme(initialTheme);
        if (initialTheme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(current => {
            const newTheme = current === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            if (newTheme === 'dark') {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
            return newTheme;
        });
    }, []);

    const setLoading = (isLoading: boolean, text: string, progress?: number) => {
        setLoadingState({ isLoading, text, progress });
    };

    const showModal = (title: string, content: string) => {
        setModal({ isOpen: true, title, content });
    };

    const showConfirm = (title: string, content: string, onConfirm: () => void) => {
        setModal({ 
            isOpen: true, 
            title, 
            content, 
            isConfirm: true, 
            onConfirm: () => {
                closeModal();
                onConfirm();
            },
            onCancel: closeModal 
        });
    };
    
    const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

    const handleGenerateQuiz = async (fileContent: string, questionTypes: { [key in QuestionTypeId]?: number }, language: string) => {
        const onProgress = (progress: number) => {
            const message = progress < 100 
                ? `AI 正在為您出題... (${progress}%)<br><span class="text-sm opacity-80">AI is generating your quiz... (${progress}%)</span>`
                : `正在處理題目...<br><span class="text-sm opacity-80">Processing questions...</span>`;
            setLoading(true, message, progress);
        };
        
        onProgress(0);
        
        let attempt = 0;
        const maxRetries = 3;

        while (attempt < maxRetries) {
            try {
                attempt++;
                const data = await generateQuizFromText(fileContent, questionTypes, language, onProgress);
                
                // Shuffle options for consistent answer labeling
                const processedData = data.map(q => {
                    if (q.type === QuestionTypeId.MULTIPLE_CHOICE || q.type === QuestionTypeId.MULTIPLE_ANSWER) {
                        return { ...q, shuffledOptions: [...q.options].sort(() => Math.random() - 0.5) };
                    }
                    return q;
                });

                // Shuffle all questions
                processedData.sort(() => Math.random() - 0.5);

                setQuizData(processedData);
                setUserAnswers(new Array(processedData.length).fill(null));
                setMarkedQuestions(new Array(processedData.length).fill(false));
                setCurrentQuestionIndex(0);
                setPhase(AppPhase.QUIZ);
                setLoading(false, '', 100);
                return; // Success, exit loop
            } catch (error: any) {
                console.error(`Attempt ${attempt} failed:`, error);
                if (attempt >= maxRetries) {
                    showModal('發生錯誤 / An Error Occurred', `AI 持續回傳無效的資料格式，請稍後再試或更換文件。<br><span class="text-sm opacity-80">${error.message}</span>`);
                    setLoading(false, '');
                } else {
                    setLoading(true, `AI 回應格式有誤，正在重試 (${attempt}/${maxRetries})...<br><span class="text-sm opacity-80">Invalid AI response, retrying (${attempt}/${maxRetries})...</span>`, loading.progress);
                }
            }
        }
    };

    const handleAnswer = (index: number, answer: UserAnswer) => {
        setUserAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[index] = answer;
            return newAnswers;
        });
    };
    
    const handleSubmit = () => {
        const unanswered = userAnswers.some(a => a === null || (Array.isArray(a) && a.length === 0));
        if (unanswered) {
            showConfirm(
                '請確認 / Please Confirm', 
                '您還有題目未作答，確定要提交嗎？<br><span class="text-sm opacity-80">You have unanswered questions. Are you sure you want to submit?</span>',
                () => setPhase(AppPhase.RESULTS)
            );
        } else {
            setPhase(AppPhase.RESULTS);
        }
    };
    
    const handleRestart = () => {
        setQuizData([]);
        setUserAnswers([]);
        setMarkedQuestions([]);
        setCurrentQuestionIndex(0);
        setPhase(AppPhase.UPLOAD);
    };

    const handleDownload = (type: 'questions' | 'answers') => {
        downloadPdf(type, quizData);
    };

    return (
        <div className={`w-full max-w-4xl mx-auto px-4 pb-12`}>
            {loading.isLoading && <LoadingOverlay text={loading.text} progress={loading.progress} />}
            <Modal modalState={modal} closeModal={closeModal} />
            <Header theme={theme} toggleTheme={toggleTheme} />
            
            <main className="bg-white dark:bg-[#2d3748] rounded-2xl shadow-2xl p-6 md:p-8 transition-colors duration-300 text-gray-800 dark:text-gray-200">
                {phase === AppPhase.UPLOAD && <UploadPhase onGenerate={handleGenerateQuiz} parseFiles={parseFiles} setLoading={setLoading} showModal={showModal} />}
                {phase === AppPhase.QUIZ && (
                    <QuizPhase 
                        quizData={quizData}
                        userAnswers={userAnswers}
                        markedQuestions={markedQuestions}
                        currentQuestionIndex={currentQuestionIndex}
                        onAnswer={handleAnswer}
                        onNavigate={setCurrentQuestionIndex}
                        onToggleMark={(index) => setMarkedQuestions(p => { const n = [...p]; n[index] = !n[index]; return n; })}
                        onSubmit={handleSubmit}
                    />
                )}
                {phase === AppPhase.RESULTS && <ResultsPhase quizData={quizData} userAnswers={userAnswers} markedQuestions={markedQuestions} onRestart={handleRestart} onDownload={handleDownload}/>}
            </main>
        </div>
    );
};

export default App;