
import { QuestionType, QuestionTypeId } from './types';

export const INITIAL_QUESTION_TYPES: QuestionType[] = [
  { id: QuestionTypeId.MULTIPLE_CHOICE, name: '單選題', name_en: 'Multiple Choice', count: 5 },
  { id: QuestionTypeId.TRUE_FALSE, name: '是非題', name_en: 'True/False', count: 5 },
  { id: QuestionTypeId.MULTIPLE_ANSWER, name: '多選題', name_en: 'Multiple Answer', count: 0 },
];

export const SUPPORTED_LANGUAGES = [
  { value: '繁體中文', label: '繁體中文 (Traditional Chinese)' },
  { value: 'English', label: '英文 (English)' },
  { value: '日本語', label: '日文 (Japanese)' },
  { value: 'Tiếng Việt', label: '越南文 (Vietnamese)' },
  { value: 'Bahasa Indonesia', label: '印尼文 (Indonesian)' },
  { value: 'ภาษาไทย', label: '泰文 (Thai)' },
];

export const QUESTION_TYPE_DISPLAY_NAMES: { [key in QuestionTypeId]: string } = {
  [QuestionTypeId.MULTIPLE_CHOICE]: '單選題',
  [QuestionTypeId.TRUE_FALSE]: '是非題',
  [QuestionTypeId.MULTIPLE_ANSWER]: '多選題',
};
