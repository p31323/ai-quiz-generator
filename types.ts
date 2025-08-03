export enum AppPhase {
  UPLOAD = 'upload',
  QUIZ = 'quiz',
  RESULTS = 'results',
}

export enum QuestionTypeId {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  MULTIPLE_ANSWER = 'multiple_answer',
}

export interface QuestionType {
  id: QuestionTypeId;
  name: string;
  name_en: string;
  count: number;
}

export interface BaseQuestion {
  type: QuestionTypeId;
  explanation: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: QuestionTypeId.MULTIPLE_CHOICE;
  question: string;
  options: string[];
  answer: string;
  shuffledOptions?: string[]; // To maintain option order during quiz
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: QuestionTypeId.TRUE_FALSE;
  statement: string;
  answer: boolean;
}

export interface MultipleAnswerQuestion extends BaseQuestion {
  type: QuestionTypeId.MULTIPLE_ANSWER;
  question: string;
  options: string[];
  answers: string[];
  shuffledOptions?: string[]; // To maintain option order during quiz
}

export type QuizQuestion = MultipleChoiceQuestion | TrueFalseQuestion | MultipleAnswerQuestion;

export type UserAnswer = string | boolean | string[] | null;

export interface ModalState {
  isOpen: boolean;
  title: string;
  content: string;
  isConfirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}