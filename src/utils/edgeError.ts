// Extrai a mensagem real retornada por uma edge function (FunctionsHttpError esconde o corpo)
export const getEdgeFunctionError = async (error: any, fallback = 'Erro inesperado.') => {
  try {
    const res = error?.context;
    if (res && typeof res.json === 'function') {
      const body = await res.clone().json();
      if (body?.error) return String(body.error);
    }
    if (res && typeof res.text === 'function') {
      const text = await res.clone().text();
      if (text) return text;
    }
  } catch {
    // corpo indisponível — usa a mensagem padrão
  }
  return error?.message || fallback;
};
