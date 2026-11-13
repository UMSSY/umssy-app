export const MAX_MY_APPOINTMENTS_SEARCH_LENGTH = 100;

// Ambas cadenas deben tener la misma longitud: translate() reemplaza por posición.
// Incluyen las mayúsculas porque con la configuración regional C, lower() no
// convierte las letras con tilde («Á» queda igual).
export const ACCENTED_SEARCH_CHARACTERS =
  'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ';
export const UNACCENTED_SEARCH_CHARACTERS =
  'aaaaaeeeeiiiiooooouuuuncaaaaaeeeeiiiiooooouuuunc';
