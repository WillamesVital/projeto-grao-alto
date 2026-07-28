export type CepAddress = {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
};

/** Busca endereço por CEP via ViaCEP (gratuito, sem chave). Em caso de falha
 * de rede o checkout continua funcionando com preenchimento manual. */
export async function lookupCep(cep: string): Promise<CepAddress | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;

    return {
      street: data.logradouro ?? "",
      neighborhood: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
    };
  } catch {
    return null;
  }
}
