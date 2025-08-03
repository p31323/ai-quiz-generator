import React, { useState, useMemo, useCallback, ChangeEvent, DragEvent } from 'react';
import { QuestionType, QuestionTypeId } from '../types';
import { SUPPORTED_LANGUAGES, INITIAL_QUESTION_TYPES } from '../constants';

interface UploadPhaseProps {
    onGenerate: (fileContent: string, questionTypes: { [key in QuestionTypeId]?: number }, language: string) => void;
    parseFiles: (files: File[], onProgress: (message: string) => void) => Promise<string>;
    setLoading: (loading: boolean, text: string, progress?: number) => void;
    showModal: (title: string, content: string) => void;
}

const QuestionTypeCard: React.FC<{type: QuestionType, onCountChange: (id: QuestionTypeId, count: number) => void;}> = ({ type, onCountChange }) => {
    const isSelected = type.count > 0;

    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).tagName !== 'INPUT') {
            onCountChange(type.id, isSelected ? 0 : 5);
        }
    };

    const cardClasses = isSelected
        ? 'bg-[#3d84c6] text-white transform -translate-y-0.5 shadow-lg'
        : 'bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-500';

    const inputClasses = isSelected
        ? 'bg-black/20 text-white'
        : 'bg-slate-300 dark:bg-slate-700 text-gray-800 dark:text-white';
    
    return (
        <div
            onClick={handleCardClick}
            className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${cardClasses}`}
        >
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-bold">{type.name}</p>
                    <p className="text-sm opacity-90">{type.name_en}</p>
                </div>
                <input 
                    type="number" 
                    min="0"
                    max="20" 
                    value={type.count} 
                    onChange={(e) => onCountChange(type.id, parseInt(e.target.value, 10) || 0)}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-16 p-1 rounded text-center font-bold border-2 border-transparent focus:border-blue-400 focus:outline-none ${inputClasses}`}
                />
            </div>
        </div>
    );
};


const UploadPhase: React.FC<UploadPhaseProps> = ({ onGenerate, parseFiles, setLoading, showModal }) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(INITIAL_QUESTION_TYPES);
    const [language, setLanguage] = useState<string>(SUPPORTED_LANGUAGES[0].value);
    const [isDragging, setIsDragging] = useState(false);

    const totalQuestions = useMemo(() => questionTypes.reduce((sum, type) => sum + type.count, 0), [questionTypes]);
    const canGenerate = useMemo(() => totalQuestions > 0 && selectedFiles.length > 0, [totalQuestions, selectedFiles]);

    const handleFileChange = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        
        if (files.length > 3) {
            showModal('檔案數量過多 / Too Many Files', '您一次最多只能上傳 3 個檔案。<br><span class="text-sm opacity-80">You can only upload a maximum of 3 files at a time.</span>');
            return;
        }
        setSelectedFiles(Array.from(files));
    };

    const handleDragEvent = (e: DragEvent<HTMLDivElement>, dragging: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(dragging);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        handleDragEvent(e, false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileChange(files);
        }
    };
    
    const handleGenerateClick = async () => {
        setLoading(true, "準備開始...");
        try {
            const fileContent = await parseFiles(selectedFiles, (progressText) => setLoading(true, progressText));
            if (fileContent.trim().length < 100) {
                showModal('內容過短 / Content Too Short', '所有檔案的總內容過短，可能無法生成高品質的內容。<br><span class="text-sm opacity-80">The total content from all files is too short to generate high-quality questions.</span>');
                setLoading(false, "");
                return;
            }
            const requestedTypes = questionTypes.reduce((acc, type) => {
                if (type.count > 0) acc[type.id] = type.count;
                return acc;
            }, {} as { [key in QuestionTypeId]?: number });
            
            onGenerate(fileContent, requestedTypes, language);
        } catch(error: any) {
            showModal('檔案讀取錯誤 / File Read Error', `讀取檔案時發生錯誤: ${error.message}<br><span class="text-sm opacity-80">Error reading file: ${error.message}</span>`);
            setLoading(false, "");
        }
    };

    const updateQuestionTypeCount = (id: QuestionTypeId, count: number) => {
        setQuestionTypes(prev => prev.map(t => t.id === id ? {...t, count: Math.min(Math.max(0, count), 20)} : t));
    };

    return (
        <div>
            <div 
                onDragOver={(e) => handleDragEvent(e, true)}
                onDragLeave={(e) => handleDragEvent(e, false)}
                onDrop={handleDrop}
                className={`upload-zone border-4 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 border-gray-400 dark:border-gray-600 ${isDragging ? 'border-[#3d84c6] bg-[#3d84c6]/10' : 'hover:border-gray-500 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
                <input type="file" id="file-input" className="hidden" accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg,.doc,.ppt" multiple onChange={(e) => handleFileChange(e.target.files)} />
                <label htmlFor="file-input" className="cursor-pointer">
                    <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">點擊此處選擇檔案，或將檔案拖曳到這裡 (最多3個)</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Click or drag & drop files here (Max 3 files)</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">支援圖片、PDF, DOCX, PPTX, TXT</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Supports Images, PDF, DOCX, PPTX, TXT</p>
                    <p className="mt-2 text-xs text-yellow-600 dark:text-[#f5c544]">提醒：為確保最佳效能，建議上傳小於 10MB 的檔案。<br />Reminder: For best performance, files under 10MB are recommended.</p>
                    {selectedFiles.length > 0 && <p className="mt-4 text-blue-400 font-medium">{`已選擇 ${selectedFiles.length} 個檔案: ${selectedFiles.map(f => f.name).join(', ')}`}</p>}
                </label>
            </div>
            
            <div className="mt-6">
                <label className="block text-md font-medium mb-2 text-gray-700 dark:text-gray-300">選擇題型與數量 / Select Question Types & Quantities:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {questionTypes.map(type => <QuestionTypeCard key={type.id} type={type} onCountChange={updateQuestionTypeCount} />)}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-6">
                 <div>
                    <label htmlFor="total-questions" className="block text-md font-medium mb-2 text-gray-700 dark:text-gray-300">總題目數 / Total Questions:</label>
                    <input type="number" id="total-questions" value={totalQuestions} className="input-field bg-gray-200 dark:bg-slate-700 border-transparent text-sm rounded-lg block w-full p-2.5" readOnly />
                </div>
                <div>
                    <label htmlFor="language-select" className="block text-md font-medium mb-2 text-gray-700 dark:text-gray-300">考題語言 / Quiz Language:</label>
                    <select id="language-select" value={language} onChange={(e) => setLanguage(e.target.value)} className="select-field bg-gray-200 dark:bg-slate-700 border-transparent text-sm rounded-lg focus:ring-[#3d84c6] focus:border-[#3d84c6] block w-full p-2.5">
                        {SUPPORTED_LANGUAGES.map(lang => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="mt-6">
                <button onClick={handleGenerateClick} disabled={!canGenerate} className="w-full bg-gray-300 hover:bg-gray-400 dark:bg-slate-600 dark:hover:bg-slate-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-800 dark:text-gray-100 font-bold py-4 px-4 rounded-lg text-xl transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/50">
                    開始生成考題 / Generate Quiz
                </button>
            </div>
        </div>
    );
};

export default UploadPhase;