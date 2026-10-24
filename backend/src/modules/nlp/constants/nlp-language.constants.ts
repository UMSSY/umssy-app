// Spanish stopwords (plus a few English ones), written without accents because the text is normalized first.
// Negation words are not stopwords: the detector needs them to read the context of a mention.
export const NLP_STOPWORDS: ReadonlySet<string> = new Set([
  'a', 'al', 'algo', 'algun', 'alguna', 'algunas', 'alguno', 'algunos', 'ante', 'antes', 'asi', 'cada',
  'como', 'con', 'contra', 'cual', 'cuales', 'cuando', 'de', 'del', 'desde', 'donde', 'durante', 'e',
  'el', 'ella', 'ellas', 'ellos', 'en', 'entre', 'era', 'eran', 'es', 'esa', 'esas', 'ese', 'eso', 'esos',
  'esta', 'estaba', 'estado', 'estan', 'estar', 'este', 'esto', 'estos', 'fue', 'fueron', 'ha', 'han',
  'hasta', 'hay', 'la', 'las', 'le', 'les', 'lo', 'los', 'me', 'mi', 'mis', 'muy', 'mas', 'nos', 'nuestra',
  'nuestras', 'nuestro', 'nuestros', 'o', 'otra', 'otras', 'otro', 'otros', 'para', 'por', 'porque', 'que',
  'se', 'ser', 'si', 'sido', 'sobre', 'su', 'sus', 'tambien', 'te', 'tiene', 'tienen', 'tu', 'tus', 'un',
  'una', 'unas', 'uno', 'unos', 'y', 'ya', 'yo',
  'an', 'and', 'as', 'at', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with',
]);

export const NLP_NEGATION_CUES: ReadonlySet<string> = new Set([
  'no', 'sin', 'nunca', 'jamas', 'ni', 'tampoco', 'ningun', 'ninguna', 'ninguno', 'desconozco', 'carezco',
  'excepto', 'not', 'without', 'never',
]);

// "no solo Java" does not deny Java.
export const NLP_NEGATION_EXCEPTIONS: ReadonlySet<string> = new Set(['solo', 'solamente', 'unicamente']);

// Words that open a new clause, so a negation before them does not reach the mentions after them.
export const NLP_CLAUSE_BREAKERS: ReadonlySet<string> = new Set([
  'pero', 'aunque', 'sino', 'mientras', 'embargo', 'obstante', 'but', 'however', 'although',
]);

// A wish to learn a technology is not evidence of using it.
export const NLP_INTENTION_CUES: ReadonlySet<string> = new Set(['aprender', 'estudiar', 'conocer', 'learn']);

// Terms that confirm a technical context for ambiguous aliases such as "go" or "node".
export const NLP_TECH_CONTEXT_TERMS: ReadonlySet<string> = new Set([
  'lenguaje', 'lenguajes', 'programacion', 'programar', 'programador', 'programadora', 'desarrollo',
  'desarrollador', 'desarrolladora', 'desarrolle', 'desarrollar', 'framework', 'frameworks', 'libreria',
  'librerias', 'backend', 'frontend', 'fullstack', 'full-stack', 'api', 'apis', 'rest', 'microservicios',
  'servidor', 'servidores', 'codigo', 'software', 'aplicacion', 'aplicaciones', 'scripts', 'developer',
  'development', 'programming', 'language', 'server', 'code',
]);

export const NLP_NEGATION_WINDOW = 4;
export const NLP_INTENTION_WINDOW = 3;
