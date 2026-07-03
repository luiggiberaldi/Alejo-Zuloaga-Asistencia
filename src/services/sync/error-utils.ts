/**
 * Extrae de forma robusta el código de estado HTTP de un error retornado
 * por el cliente de Supabase JS o excepciones de red.
 *
 * TODO: verificar forma real del error 401 ejecutando un test manual con JWT expirado
 * (cerrar sesión en otro dispositivo o esperar expiración) y confirmar que extractHttpStatus
 * lo detecta correctamente.
 */
export function extractHttpStatus(error: any): number | null {
  if (!error) return null;

  const candidates = [
    error.status,
    error.statusCode,
    error?.originalError?.status,
    error?.cause?.status,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'number') {
      return candidate;
    }
  }

  // Supabase/PostgREST a veces usa códigos string como 'PGRST301' para JWT expirado
  if (error.code === 'PGRST301' || error.message?.includes('JWT expired')) {
    return 401;
  }

  return null;
}
