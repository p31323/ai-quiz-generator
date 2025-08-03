import { QuizQuestion, UserAnswer, QuestionTypeId } from '../types';
import { QUESTION_TYPE_DISPLAY_NAMES } from '../constants';

declare const html2pdf: any;

/**
 * Inserts zero-width spaces into long, unbreakable strings to force word wrapping.
 * Made more aggressive to ensure wrapping under all conditions.
 * @param text The text to process.
 * @returns The processed text with potential break points.
 */
const forceWrapText = (text: string | null | undefined): string => {
    if (!text) return '';
    const MAX_WORD_LENGTH = 35; 
    
    const parts = text.split(/(\s+)/); 

    const processedParts = parts.map(part => {
        if (/^\s+$/.test(part)) {
            return part;
        }
        if (part.length > MAX_WORD_LENGTH) {
            let result = '';
            const breakInterval = 15; 
            for (let i = 0; i < part.length; i += breakInterval) {
                result += part.substring(i, i + breakInterval) + '\u200B';
            }
            return result;
        }
        
        return part;
    });

    return processedParts.join('');
};


// Helper function to create a styled element, reducing repetition
const createElement = (tag: string, styles: Partial<CSSStyleDeclaration> = {}, textContent?: string): HTMLElement => {
    const el = document.createElement(tag);
    Object.assign(el.style, styles);
    if (textContent) {
        el.textContent = forceWrapText(textContent);
    }
    return el;
};

const generateHtmlForPdf = (type: 'questions' | 'answers', quizData: QuizQuestion[]): HTMLElement => {
    const rootElement = document.createElement('div');

    const pageContainer = createElement('div', {
        width: '180mm',
        margin: '0 auto',
        fontFamily: "'Noto Sans TC', sans-serif",
        color: 'black',
        overflowWrap: 'break-word',
        wordWrap: 'break-word',
    });
    rootElement.appendChild(pageContainer);

    const titleText = type === 'questions' ? 'AI Quiz Questions' : 'AI Quiz Answers & Analysis';
    const title = createElement('h1', {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '12mm',
    }, titleText);
    pageContainer.appendChild(title);

    quizData.forEach((q, index) => {
        const typeName = QUESTION_TYPE_DISPLAY_NAMES[q.type] || 'Unknown Type';
        const questionTitleText = 'question' in q ? q.question : q.statement;

        const questionBlock = createElement('div', {
            marginBottom: '10mm',
            pageBreakInside: 'avoid',
        });

        const questionHeader = createElement('h2', {
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '4mm',
        }, `${index + 1}. (${typeName}) ${questionTitleText}`);
        questionBlock.appendChild(questionHeader);

        const optionsContainer = createElement('div', { paddingLeft: '10mm' });
        if (q.type === 'multiple_choice' || q.type === 'multiple_answer') {
            q.options.forEach((option, i) => {
                const label = String.fromCharCode(65 + i);
                const optionP = createElement('p', { margin: '2mm 0' }, `(${label}) ${option}`);
                optionsContainer.appendChild(optionP);
            });
        } else if (q.type === QuestionTypeId.TRUE_FALSE) {
            const trueOption = createElement('p', { margin: '2mm 0' }, `(A) 是 (True)`);
            const falseOption = createElement('p', { margin: '2mm 0' }, `(B) 非 (False)`);
            optionsContainer.appendChild(trueOption);
            optionsContainer.appendChild(falseOption);
        }
        questionBlock.appendChild(optionsContainer);


        if (type === 'answers') {
            let correctAnswerText = '';
            switch(q.type) {
                case QuestionTypeId.TRUE_FALSE:
                    correctAnswerText = q.answer ? '(A) 是 (True)' : '(B) 非 (False)';
                    break;
                case QuestionTypeId.MULTIPLE_ANSWER:
                    correctAnswerText = q.answers.map(ans => {
                        const answerIndex = q.options.findIndex(opt => opt === ans);
                        if (answerIndex > -1) {
                            return `(${String.fromCharCode(65 + answerIndex)}) ${ans}`;
                        }
                        return ans;
                    }).join(', ');
                    break;
                case QuestionTypeId.MULTIPLE_CHOICE: {
                    const answerIndex = q.options.findIndex(opt => opt === q.answer);
                    if (answerIndex > -1) {
                        correctAnswerText = `(${String.fromCharCode(65 + answerIndex)}) ${q.answer}`;
                    } else {
                        correctAnswerText = q.answer;
                    }
                    break;
                }
            }

            const answerP = createElement('p', {
                marginTop: '4mm',
                color: '#3d84c6',
            });
            const answerLabel = createElement('strong', {}, 'Correct Answer: ');
            answerP.appendChild(answerLabel);
            answerP.appendChild(document.createTextNode(forceWrapText(correctAnswerText)));
            questionBlock.appendChild(answerP);
            
            const explanationP = createElement('p', {
                marginTop: '2mm',
                color: 'black',
            });
            const explanationLabel = createElement('strong', {}, 'Explanation: ');
            const explanationText = document.createTextNode(forceWrapText(q.explanation));
            explanationP.appendChild(explanationLabel);
            explanationP.appendChild(explanationText);

            questionBlock.appendChild(explanationP);
        }
        
        pageContainer.appendChild(questionBlock);
    });

    return rootElement;
};


export const downloadPdf = (type: 'questions' | 'answers', quizData: QuizQuestion[]) => {
    const element = generateHtmlForPdf(type, quizData);
    
    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5],
      filename:     type === 'questions' ? 'quiz-questions.pdf' : 'quiz-answers.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save();
};