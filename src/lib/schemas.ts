import { z } from "zod";

export const productSchema = z
  .object({
    id: z.string().min(1, "SKU obrigatório"),
    name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
    category: z.string().min(1, "Categoria obrigatória"),
    stockLevel: z.coerce.number().int().min(0, "Estoque não pode ser negativo"),
    maxStock: z.coerce.number().int().min(1, "Capacidade máxima deve ser ao menos 1"),
    costPrice: z.coerce.number().min(0, "Preço de custo não pode ser negativo"),
    salePrice: z.coerce.number().min(0, "Preço de venda não pode ser negativo"),
    imageUrl: z.string().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.stockLevel > data.maxStock) {
      ctx.addIssue({
        code: "custom",
        path: ["stockLevel"],
        message: "O estoque inicial não pode ser maior que a capacidade do box.",
      });
    }
    if (data.salePrice < data.costPrice) {
      ctx.addIssue({
        code: "custom",
        path: ["salePrice"],
        message: "O preço de venda não pode ser menor que o preço de custo.",
      });
    }
  });

export type ProductFormValues = z.infer<typeof productSchema>;

export const clientSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  contactName: z.string().optional(),
  doc: z.string().optional(),
  email: z
    .string()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export const saleItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.coerce.number().int().min(1),
  price: z.number().min(0),
});

export const saleSchema = z.object({
  clientChoice: z.string().default("walk-in"),
  seller: z.string().min(1, "Vendedor obrigatório"),
  paymentMethod: z.enum(["Cartão Crédito", "PIX", "Dinheiro", "Debito"]),
  status: z.enum(["Pago", "Aguard. Retirada", "Cancelado"]),
  items: z
    .array(saleItemSchema)
    .min(1, "Adicione ao menos um produto à venda"),
});

export type SaleFormValues = z.infer<typeof saleSchema>;

// Matches the payload `register-sale.ts`'s server action actually receives —
// distinct from `saleSchema`, which models the form step (raw `clientChoice`
// select value, not yet resolved into clientId/clientName/clientDoc).
export const registerSaleInputSchema = z.object({
  clientId: z.string().optional(),
  clientName: z.string().min(1),
  clientDoc: z.string().min(1),
  seller: z.string().min(1, "Vendedor obrigatório"),
  paymentMethod: z.enum(["Cartão Crédito", "PIX", "Dinheiro", "Debito"]),
  status: z.enum(["Pago", "Aguard. Retirada", "Cancelado"]),
  items: z
    .array(saleItemSchema)
    .min(1, "Adicione ao menos um produto à venda"),
});

export type RegisterSaleInputValues = z.infer<typeof registerSaleInputSchema>;

export const adjustStockSchema = z.object({
  mode: z.enum(["entrada", "saida"]),
  qty: z.coerce.number().int().min(1, "Quantidade deve ser ao menos 1"),
  reason: z.string().optional(),
});

export type AdjustStockFormValues = z.infer<typeof adjustStockSchema>;

export const storeSettingsSchema = z
  .object({
    storeName: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(80, "Nome muito longo"),
    storeSegment: z.enum([
      "Informática & Eletrônicos",
      "Celulares & Acessórios",
      "Games & Consoles",
      "Som & Áudio",
      "Outros",
    ]),
    stockCritical: z.coerce
      .number()
      .int("Use um número inteiro")
      .min(0, "Limite crítico não pode ser negativo"),
    stockLow: z.coerce
      .number()
      .int("Use um número inteiro")
      .min(0, "Limite de estoque baixo não pode ser negativo"),
  })
  .superRefine((data, ctx) => {
    if (data.stockLow < data.stockCritical) {
      ctx.addIssue({
        code: "custom",
        path: ["stockLow"],
        message: "O limite de estoque baixo deve ser maior ou igual ao limite crítico.",
      });
    }
  });

export type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>;

export const updateUserRoleSchema = z.object({
  userId: z.string().uuid("ID de usuário inválido"),
  role: z.enum(["admin", "editor", "user"]),
});

export type UpdateUserRoleValues = z.infer<typeof updateUserRoleSchema>;
