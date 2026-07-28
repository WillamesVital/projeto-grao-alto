import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres."),
  phone: z.string().trim().min(8, "Informe um telefone válido."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(1, "Informe sua senha."),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;

// FormData.get() devolve `null` (não `undefined`) quando o campo não existe
// no DOM (ex: campos de cartão quando o método é Pix) — por isso os campos
// opcionais aqui usam `.nullish()` em vez de `.optional()`.
export const checkoutSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  cpf: z.string().trim().regex(cpfRegex, "CPF inválido."),
  deliveryMethod: z.enum(["DELIVERY", "PICKUP"]),
  cep: z.string().trim().nullish(),
  street: z.string().trim().nullish(),
  number: z.string().trim().nullish(),
  complement: z.string().trim().nullish(),
  neighborhood: z.string().trim().nullish(),
  city: z.string().trim().nullish(),
  state: z.string().trim().nullish(),
  couponCode: z.string().trim().nullish(),
  paymentMethod: z.enum(["PIX", "CARD"]),
  cardNumber: z.string().nullish(),
  cardName: z.string().nullish(),
  cardExpiry: z.string().nullish(),
  cardCvv: z.string().nullish(),
  installments: z.coerce.number().int().min(1).max(3).nullish(),
});
