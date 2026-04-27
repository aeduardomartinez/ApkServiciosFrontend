/**
 * Mapa de nombres de servicios a sus íconos locales.
 * Las imágenes deben estar en: src/assets/services/
 * La coincidencia es parcial e insensible a mayúsculas.
 */
const SERVICE_ICONS: Record<string, string> = {
  'netflix':      'assets/services/netflix.png',
  'disney':       'assets/services/Disney.png',
  'disney+':      'assets/services/Disney.png',
  'hbo max':      'assets/services/max.png',
  'hbo':          'assets/services/max.png',
  'max':          'assets/services/max.png',
  'amazon prime': 'assets/services/prime.png',
  'prime video':  'assets/services/prime.png',
  'prime':        'assets/services/prime.png',
  'amazon':       'assets/services/prime.png',
  'spotify':      'assets/services/spotify.png',
  'vix':          'assets/services/vix.png',
};

const DEFAULT_ICON = 'assets/icon/favicon.png';

/**
 * Retorna la ruta del ícono PNG para el nombre de servicio dado.
 * Hace coincidencia parcial e insensible a mayúsculas.
 * Si no hay coincidencia, retorna el ícono por defecto.
 */
export function getServiceIcon(serviceName: string | null | undefined): string {
  if (!serviceName) return DEFAULT_ICON;
  const key = serviceName.toLowerCase().trim();
  const match = Object.keys(SERVICE_ICONS).find(k => key.includes(k));
  return match ? SERVICE_ICONS[match] : DEFAULT_ICON;
}

/**
 * Fallback para el evento (error) de <img>: reemplaza src con el ícono por defecto.
 */
export function onServiceImgError(event: Event): void {
  (event.target as HTMLImageElement).src = DEFAULT_ICON;
}
