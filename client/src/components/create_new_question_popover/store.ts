import { create } from "zustand";
import type { StateCreator } from "zustand";
import type { Difficulty, QuestionKind } from "@/types/questions";

export interface CreateNewQuestionStoreState {
    reset: () => void;
    difficulty: Difficulty;
    setDifficulty: (d: Difficulty) => void;

    questionText: string;
    setQuestionText: (t: string) => void;

    questionType: QuestionKind;
    setQuestionType: (t: QuestionKind) => void;

    mcq: { choices: string[]; correctAnswer: number };
    setChoice: (index: number, value: string) => void;
    setMcqCorrectAnswer: (index: number) => void;

    trueFalse: { correctAnswer: boolean };
    setTrueFalseCorrectAnswer: (ans: boolean) => void;

    fillInTheBlanks: { correctAnswers: string[] };
    addFillInTheBlanksAnswer: (answer: string) => void;

    shortAnswer: { estimatedCorrectAnswer: string };
    setShortAnswerEstimatedCorrectAnswer: (t: string) => void;

    answerExplanation: string;
    setAnswerExplanation: (t: string) => void;
}

const createNewQuestionStore: StateCreator<CreateNewQuestionStoreState> = (
    set,
    _get,
    store,
) => ({
    reset: () => set(store.getInitialState()),
    difficulty: "easy",
    setDifficulty: (d) => set({ difficulty: d }),

    questionText: "",
    setQuestionText: (t) => set({ questionText: t }),

    questionType: "multiple_choice_questions",
    setQuestionType: (t) => set({ questionType: t }),

    mcq: {
        choices: ["", "", "", ""],
        correctAnswer: Math.floor(Math.random() * 4),
    },
    setChoice: (index, value) =>
        set((state: CreateNewQuestionStoreState) => {
            const newChoices = [...state.mcq.choices];
            newChoices[index] = value;
            return { mcq: { ...state.mcq, choices: newChoices } };
        }),
    setMcqCorrectAnswer: (index) =>
        set((state: CreateNewQuestionStoreState) => ({
            mcq: { ...state.mcq, correctAnswer: index },
        })),

    trueFalse: {
        correctAnswer: false
    },
    setTrueFalseCorrectAnswer: (ans) =>
        set(() => ({
            trueFalse: { correctAnswer: ans }
        })),

    fillInTheBlanks: { correctAnswers: [] },
    addFillInTheBlanksAnswer: (answer) =>
        set((state: CreateNewQuestionStoreState) => ({
            fillInTheBlanks: {
                correctAnswers: [...state.fillInTheBlanks.correctAnswers, answer],
            },
        })),

    shortAnswer: { estimatedCorrectAnswer: "" },
    setShortAnswerEstimatedCorrectAnswer: (t) =>
        set((state: CreateNewQuestionStoreState) => ({
            shortAnswer: { ...state.shortAnswer, estimatedCorrectAnswer: t },
        })),

    answerExplanation: "",
    setAnswerExplanation: (t) => set({ answerExplanation: t }),
});

export const useCreateNewQuestionStore =
    create<CreateNewQuestionStoreState>(createNewQuestionStore);
