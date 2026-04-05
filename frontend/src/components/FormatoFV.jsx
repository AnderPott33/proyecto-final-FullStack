export const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatearFechaInput = (fecha) => {
    if (!fecha) return "";

    const date = new Date(fecha);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const formatearNumero = (numero, moneda = 'PYG') => {
  if (numero === null || numero === undefined) return '-';

  const configMonedas = {
    PYG: { locale: 'es-PY', currency: 'PYG', decimals: 0 },
    USD: { locale: 'en-US', currency: 'USD', decimals: 2 },
    BRL: { locale: 'pt-BR', currency: 'BRL', decimals: 2 },
  };

  const config = configMonedas[moneda] || configMonedas.PYG;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(numero);
};

export const formatearNumeroSimple = (numero) => {
  if (numero === null || numero === undefined) return '-';
  return new Intl.NumberFormat('es-PY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numero);
};

