import { z } from "zod";
import { isValidCPF } from "@/lib/cpf";

// RN-101.4/RN-104.5: mínimo 8 caracteres, com pelo menos uma letra e um número.
const PASSWORD_MESSAGE = "A senha precisa ter ao menos 8 caracteres, com letras e números.";
const passwordSchema = z
  .string()
  .min(8, PASSWORD_MESSAGE)
  .regex(/[A-Za-z]/, PASSWORD_MESSAGE)
  .regex(/[0-9]/, PASSWORD_MESSAGE);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: passwordSchema,
  phone: z.string().trim().min(8, "Informe um telefone válido."),
  termsAccepted: z
    .boolean()
    .refine((v) => v === true, "É preciso aceitar os termos de uso e a política de privacidade."),
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
    password: passwordSchema,
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
  cpf: z
    .string()
    .trim()
    .regex(cpfRegex, "CPF inválido.")
    .refine(isValidCPF, "Confira o CPF digitado."),
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
