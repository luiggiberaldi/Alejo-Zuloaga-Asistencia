export interface Student {
  id: string;
  sectionId: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  synced: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CreateStudentInput {
  sectionId: string;
  cedula: string;
  nombres: string;
  apellidos: string;
}
