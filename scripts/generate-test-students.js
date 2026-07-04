const XLSX = require('xlsx');
const path = require('path');

const students = [
  { cedula: 'V-30000001', nombres: 'Alejandro José', apellidos: 'García Pérez' },
  { cedula: 'V-30000002', nombres: 'María Fernanda', apellidos: 'Rodríguez Gómez' },
  { cedula: 'V-30000003', nombres: 'Juan Carlos', apellidos: 'Martínez Silva' },
  { cedula: 'V-30000004', nombres: 'Gabriela Sofía', apellidos: 'López Hernández' },
  { cedula: 'V-30000005', nombres: 'Diego Andrés', apellidos: 'González Ruiz' },
  { cedula: 'V-30000006', nombres: 'Camila Victoria', apellidos: 'Díaz Alvarez' },
  { cedula: 'V-30000007', nombres: 'Luis Felipe', apellidos: 'Torres Mendoza' },
  { cedula: 'V-30000008', nombres: 'Valentina Isabel', apellidos: 'Ramírez Castillo' },
  { cedula: 'V-30000009', nombres: 'Daniel Eduardo', apellidos: 'Sánchez Flores' },
  { cedula: 'V-30000010', nombres: 'Andrea Carolina', apellidos: 'Morales Ortiz' },
  { cedula: 'V-30000011', nombres: 'Javier Antonio', apellidos: 'Herrera Vargas' },
  { cedula: 'V-30000012', nombres: 'Isabella Beatriz', apellidos: 'Castro Rojas' },
  { cedula: 'V-30000013', nombres: 'Manuel Alejandro', apellidos: 'Medina Salazar' },
  { cedula: 'V-30000014', nombres: 'Sofia Alexandra', apellidos: 'Jiménez Acosta' },
  { cedula: 'V-30000015', nombres: 'Carlos Alberto', apellidos: 'Guzmán Delgado' },
  { cedula: 'V-30000016', nombres: 'Mariana Valentina', apellidos: 'Pinto Gutiérrez' },
  { cedula: 'V-30000017', nombres: 'Gabriel Enrique', apellidos: 'Mendoza Cabrera' },
  { cedula: 'V-30000018', nombres: 'Victoria Elena', apellidos: 'Miranda Ortega' },
  { cedula: 'V-30000019', nombres: 'Ricardo José', apellidos: 'Ortega Peña' },
  { cedula: 'V-30000020', nombres: 'Daniela Carolina', apellidos: 'Reyes Guerrero' },
  { cedula: 'V-30000021', nombres: 'José Rafael', apellidos: 'Cabrera Fuentes' },
  { cedula: 'V-30000022', nombres: 'Camila Sofía', apellidos: 'Cárdenas Rivas' },
  { cedula: 'V-30000023', nombres: 'Francisco Javier', apellidos: 'Bermúdez Blanco' },
  { cedula: 'V-30000024', nombres: 'Paula Andrea', apellidos: 'Ríos Aguilar' },
  { cedula: 'V-30000025', nombres: 'Miguel Angel', apellidos: 'Paredes Franco' },
  { cedula: 'V-30000026', nombres: 'Lucía Victoria', apellidos: 'Peralta Marín' },
  { cedula: 'V-30000027', nombres: 'Ángel David', apellidos: 'Machado Soto' },
  { cedula: 'V-30000028', nombres: 'Elena Patricia', apellidos: 'Mejías Parra' },
  { cedula: 'V-30000029', nombres: 'Samuel Eduardo', apellidos: 'Suárez Molina' },
  { cedula: 'V-30000030', nombres: 'Laura Valentina', apellidos: 'Bello Rondón' }
];

// Cabeceras exactas esperadas por el importador
const headers = [['cedula', 'nombres', 'apellidos']];
const rows = students.map(s => [s.cedula, s.nombres, s.apellidos]);
const data = [...headers, ...rows];

const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');

const outputPath = path.join(__dirname, '..', 'alumnos_prueba.xlsx');
XLSX.writeFile(wb, outputPath);
console.log('Archivo creado exitosamente en:', outputPath);
