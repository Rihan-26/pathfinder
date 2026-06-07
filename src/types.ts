export interface Resource {
  title: string;
  type: string; // 'video' | 'article' | 'course' | 'documentation'
  url: string;
}

export interface ActionItem {
  id: string;
  task: string;
  estimatedHours: number;
}

export interface Milestone {
  id: string;
  title: string;
  duration: string;
  description: string;
  topics: string[];
  actionItems: ActionItem[];
  keyResources: Resource[];
  recommendationReason: string;
}

export interface GapAnalysis {
  missingSkills: string[];
  cgpaFeedback: string;
  resumeStrengths: string[];
  interviewPreparationAdvice: string;
}

export interface RoadmapResponse {
  jobTitle: string;
  estimatedRemainingTime: string;
  difficultyLevel: string; // Beginner | Intermediate | Advanced
  gapAnalysis: GapAnalysis;
  milestones: Milestone[];
  overallStrategy: string;
}

export interface UserInput {
  cgpa: string;
  knownKnowledge: string;
  jobDescription: string;
}
