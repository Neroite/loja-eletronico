import { z } from "zod";

export const productSchema = z.object({
  id: z.string().min(1, "SKU obrigatório"),
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  category: z.string().min(1, "Categoria obrigatória"),
  stockLevel: z.coerce.number().int().min(0, "Estoque não pode ser negativo"),
  maxStock: z.coerce.number().int().min(1, "Capacidade máxima deve ser ao menos 1"),
  costPrice: z.coerce.number().min(0, "Preço de custo não pode ser negativo"),
  salePrice: z.coerce.number().min(0, "Preço de venda não pode ser negativo"),
  imageUrl: z.string().default(""),
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

export const adjustStockSchema = z.object({
  mode: z.enum(["entrada", "saida"]),
  qty: z.coerce.number().int().min(1, "Quantidade deve ser ao menos 1"),
  reason: z.string().optional(),
});

export type AdjustStockFormValues = z.infer<typeof adjustStockSchema>;
