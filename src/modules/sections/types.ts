export type YearLevel = '1ro' | '2do' | '3ro' | '4to' | '5to';

export interface Section {
  id: string;
  name: string;
  yearLevel: YearLevel;
  teacherId: string;
  synced: boolean;
  createdAt: number;
  updatedAt: number;
  studentCount: number;
}

export interface CreateSectionInput {
  name: string;
  yearLevel: YearLevel;
  teacherId: string;
}
