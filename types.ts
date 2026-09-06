
export interface Chapter {
  id: number;
  name: string;
  description: string;
}

export interface GradeData {
  grade: number;
  chapters: Chapter[];
}

export interface MCQQuestion {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export interface TrueFalseQuestion {
  id: number;
  context: string;
  statements: {
    id: string; // a, b, c, d
    text: string;
    isCorrect: boolean;
  }[];
}

export interface ExamData {
  title: string;
  grade: number;
  chapter: string;
  unitName?: string;
  mcqs: MCQQuestion[];
  trueFalse: TrueFalseQuestion[];
}
