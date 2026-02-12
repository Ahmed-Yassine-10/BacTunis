// ==========================================
// Types partagés pour BacTunis
// ==========================================

// Enums
export enum Branch {
    SCIENCES = 'SCIENCES',
    LETTRES = 'LETTRES',
    ECONOMIE = 'ECONOMIE',
    TECHNIQUE = 'TECHNIQUE',
    INFORMATIQUE = 'INFORMATIQUE',
    SPORT = 'SPORT'
}

export enum Grade {
    BAC = 'BAC',
    PREMIERE = 'PREMIERE',
    SECONDE = 'SECONDE'
}

export enum ScheduleType {
    SCHOOL = 'SCHOOL',
    REVISION = 'REVISION',
    PERSONAL = 'PERSONAL',
    LEISURE = 'LEISURE',
    EXAM = 'EXAM'
}

export enum Difficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD'
}

export enum LearningStyle {
    VISUAL = 'VISUAL',
    AUDITORY = 'AUDITORY',
    READING = 'READING',
    KINESTHETIC = 'KINESTHETIC'
}

export enum StudyRhythm {
    SLOW = 'SLOW',
    MODERATE = 'MODERATE',
    INTENSIVE = 'INTENSIVE'
}

export enum EmotionalState {
    GREAT = 'GREAT',
    GOOD = 'GOOD',
    OKAY = 'OKAY',
    STRESSED = 'STRESSED',
    OVERWHELMED = 'OVERWHELMED'
}

// User & Auth
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    birthDate: Date;
    grade: Grade;
    branch: Branch;
    school?: string;
    createdAt: Date;
}

export interface StudentProfile {
    id: string;
    studentId: string;
    learningStyle?: LearningStyle;
    strengths: string[];
    weaknesses: string[];
    goals: string[];
    studyRhythm: StudyRhythm;
    stressLevel: number;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    grade: Grade;
    branch: Branch;
    school?: string;
}

// Planning
export interface Schedule {
    id: string;
    studentId: string;
    title: string;
    type: ScheduleType;
    subject?: string;
    startTime: Date;
    endTime: Date;
    recurring: boolean;
    recurrence?: RecurrencePattern;
}

export interface RecurrencePattern {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    interval: number;
    daysOfWeek?: number[];
    endDate?: Date;
}

export interface CreateScheduleRequest {
    title: string;
    type: ScheduleType;
    subject?: string;
    startTime: string;
    endTime: string;
    recurring?: boolean;
    recurrence?: RecurrencePattern;
}

// Subjects & Content
export interface Subject {
    id: string;
    name: string;
    nameAr: string;
    branches: Branch[];
    coefficient: number;
}

export interface Chapter {
    id: string;
    subjectId: string;
    title: string;
    titleAr: string;
    order: number;
    duration: number;
    difficulty: Difficulty;
}

export interface Exercise {
    id: string;
    chapterId: string;
    question: string;
    questionAr?: string;
    type: 'QCM' | 'OPEN' | 'CALCULATION';
    options?: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: Difficulty;
}

// AI Chat
export interface ChatMessage {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    audioUrl?: string;
}

export interface Conversation {
    id: string;
    studentId: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    messages: ChatMessage[];
}

export interface SendMessageRequest {
    conversationId?: string;
    content: string;
    isVoice?: boolean;
}

export interface AIResponse {
    message: ChatMessage;
    suggestions?: string[];
    audioUrl?: string;
}

// Emotional Check-in
export interface EmotionalCheckIn {
    id: string;
    studentId: string;
    state: EmotionalState;
    note?: string;
    createdAt: Date;
}

// Study Session
export interface StudySession {
    id: string;
    studentId: string;
    subjectId: string;
    chapterId?: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    completed: boolean;
    score?: number;
}

// Recommendations
export interface Recommendation {
    id: string;
    type: 'REVISION' | 'EXERCISE' | 'BREAK' | 'MOTIVATION';
    title: string;
    description: string;
    subject?: Subject;
    chapter?: Chapter;
    priority: number;
    estimatedDuration: number;
}

// Documents
export interface Document {
    id: string;
    studentId: string;
    name: string;
    type: 'PDF' | 'IMAGE' | 'TEXT';
    url: string;
    analysis?: DocumentAnalysis;
    createdAt: Date;
}

export interface DocumentAnalysis {
    summary: string;
    keyPoints: string[];
    mindMap?: MindMapNode;
    exercises?: Exercise[];
}

export interface MindMapNode {
    id: string;
    label: string;
    children?: MindMapNode[];
}

// API Response wrapper
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Tunisian subjects for Bac
export const TUNISIAN_BAC_SUBJECTS: Record<Branch, string[]> = {
    [Branch.SCIENCES]: [
        'Mathématiques',
        'Physique',
        'Sciences naturelles',
        'Français',
        'Arabe',
        'Anglais',
        'Philosophie',
        'Informatique'
    ],
    [Branch.LETTRES]: [
        'Arabe',
        'Français',
        'Anglais',
        'Histoire-Géographie',
        'Philosophie',
        'Mathématiques'
    ],
    [Branch.ECONOMIE]: [
        'Économie',
        'Gestion',
        'Mathématiques',
        'Français',
        'Arabe',
        'Anglais',
        'Histoire-Géographie'
    ],
    [Branch.TECHNIQUE]: [
        'Technologie',
        'Mathématiques',
        'Physique',
        'Français',
        'Arabe',
        'Anglais'
    ],
    [Branch.INFORMATIQUE]: [
        'Algorithmique',
        'Bases de données',
        'Mathématiques',
        'Physique',
        'Français',
        'Arabe',
        'Anglais'
    ],
    [Branch.SPORT]: [
        'Éducation physique',
        'Sciences naturelles',
        'Français',
        'Arabe',
        'Anglais',
        'Mathématiques'
    ]
};
