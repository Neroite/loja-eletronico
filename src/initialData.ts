import { Product, Sale, Client } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '#SSD-1TB',
    name: 'SSD NVMe 1TB - Kingston NV2',
    category: 'Armazenamento',
    stockLevel: 85,
    maxStock: 100,
    status: 'Em Estoque',
    costPrice: 210.00,
    salePrice: 329.90,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQNAH35bT8TYHJMah_F1NxiH_lGtTtSpxhBxjEIYruUdl1wK5uSJ2LgZPz6alsh980shLikhwbbKEb0V4uxai0_Bi9CSxmM7uT2FDCp4wCCLbMcLqpv39PdagQlRELK_4ubhjiKC2X9C2az0otlmXeO3CdrrtC0jEraayXDb3XRmKHXBFeOqRvPCdvD6dyLgF52TudrXlSvVWYiioQw9RcCmUwpDoBCys5BGaxK0Rd_s7fdDrLr8O94mez0MWje51FNCF8XeYDIQA'
  },
  {
    id: '#KYB-MECH',
    name: 'Teclado Mecânico RGB - Redragon',
    category: 'Periféricos',
    stockLevel: 12,
    maxStock: 50,
    status: 'Em Estoque',
    costPrice: 110.00,
    salePrice: 189.00,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkKrCpkKq-nnkcH51vIbNit3vs9sXJ4xHzdD_tLX6MIaAKsjg_c7wPqiCgMRFADp02sKKPowG_n0p5TzKYa6MaNn8VUMJpGigUwlisi3y15Dfwa--CwDkNdAi3qWIkHSOVy2vDLg5RtwyI3EZ7OezyGSNRHaeBdzPVMVoSzLtE_qVhQrpwrR6i-flumCoOqD0pSar_EGxldk9uiUuhMtclfhsu0Rf5NcEQoKk4o0O5NR5BexvQQH0-gAvNK3nPPiR4OwoQtZ4-Q_g'
  },
  {
    id: '#GPU-RTX',
    name: 'Placa de Vídeo RTX 4060 - ASUS',
    category: 'Hardware',
    stockLevel: 2,
    maxStock: 40,
    status: 'Crítico',
    costPrice: 1450.00,
    salePrice: 2199.00,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKLwCAbu1KsdnOzPuHJVP26tcRq_IPJc-EyJP9YlxGpHa_zsXJFSrTJHzDdlb1QOaNP-40_ziqKJD11i4SCOIawV4nWSI44RTBwXNimpF0hkGUrvPBABOOSC1s30cf7h_zcXDZRrJitqWzcm-L2ld-DVBHwygi75YCbIGnalR1GorEuhTwT1n8TUlljVcOAFbPTcBJhdy8ugO_AX705X_U9tH8dmhCdxkg15yqZ4xGuTJq249Q74632_DtCbE-GNcbyh22NF_qtOo'
  },
  {
    id: '#MON-144',
    name: 'Monitor IPS 144Hz - LG UltraGear',
    category: 'Monitores',
    stockLevel: 18,
    maxStock: 45,
    status: 'Em Estoque',
    costPrice: 620.00,
    salePrice: 949.00,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCw_JoS8czCZ266khX3vsYlW76uz63kaNWVerNtLQamgTRl126ldUtRcXIslRy-yPDXntfOrZENYfEv2pZV6goi55CXEdxRAFWhzzD_byIlN7XdZ6xtEGrekxnjCu876Caa21Ug6kmRyLr4cQKtfZjlSryzjQItad1t7JSMMPJd9OWK6eG_a-Fp0_xXaQRekyEBrhPNqjR0NeskyBaReYSg_oLLiyaxrsq-rRriVK4Biy9Igf341EJRiCWOeOEuE1Vx4b6Ry5CRFtk'
  },
  {
    id: '#MOU-WRL',
    name: 'Mouse Gamer G305 - Logitech',
    category: 'Periféricos',
    stockLevel: 8,
    maxStock: 50,
    status: 'Estoque Baixo',
    costPrice: 140.00,
    salePrice: 229.00,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzml5T4YBMp-54hVzzrnlDqcjKIuyu1s0A0fggokDL7hqES27VkYGV568zRVZpE7QwfCogmL3585f-5EpkcemahHK_rqSMGX-t6pb__PClKSRaZzrdTkrFaGTEyAqDbz9tS9IVcjWEXWcA2GqbvkvfWBge5-BxnZm4YDP5QN3OwzHTLibEXthJ-fPEaIyF0Q9vDGOPAyzfckKx3Rfin5Pu4cw69Kj9_4ljzx-0A9kS4L6YEUf0tVqbsm6wr_BKZyfrQzcTzpDsm2I'
  },
  {
    id: '#SSD-2TB',
    name: 'SSD NVMe 2TB - WD Black SN770',
    category: 'Armazenamento',
    stockLevel: 40,
    maxStock: 60,
    status: 'Em Estoque',
    costPrice: 480.00,
    salePrice: 729.90,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQNAH35bT8TYHJMah_F1NxiH_lGtTtSpxhBxjEIYruUdl1wK5uSJ2LgZPz6alsh980shLikhwbbKEb0V4uxai0_Bi9CSxmM7uT2FDCp4wCCLbMcLqpv39PdagQlRELK_4ubhjiKC2X9C2az0otlmXeO3CdrrtC0jEraayXDb3XRmKHXBFeOqRvPCdvD6dyLgF52TudrXlSvVWYiioQw9RcCmUwpDoBCys5BGaxK0Rd_s7fdDrLr8O94mez0MWje51FNCF8XeYDIQA'
  },
  {
    id: '#HDD-4TB',
    name: 'HD 4TB 5400rpm - Seagate Barracuda',
    category: 'Armazenamento',
    stockLevel: 6,
    maxStock: 30,
    status: 'Estoque Baixo',
    costPrice: 380.00,
    salePrice: 549.90,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQNAH35bT8TYHJMah_F1NxiH_lGtTtSpxhBxjEIYruUdl1wK5uSJ2LgZPz6alsh980shLikhwbbKEb0V4uxai0_Bi9CSxmM7uT2FDCp4wCCLbMcLqpv39PdagQlRELK_4ubhjiKC2X9C2az0otlmXeO3CdrrtC0jEraayXDb3XRmKHXBFeOqRvPCdvD6dyLgF52TudrXlSvVWYiioQw9RcCmUwpDoBCys5BGaxK0Rd_s7fdDrLr8O94mez0MWje51FNCF8XeYDIQA'
  },
  {
    id: '#CPU-R5',
    name: 'Processador Ryzen 5 5600 - AMD',
    category: 'Hardware',
    stockLevel: 2,
    maxStock: 25,
    status: 'Crítico',
    costPrice: 720.00,
    salePrice: 1099.00,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKLwCAbu1KsdnOzPuHJVP26tcRq_IPJc-EyJP9YlxGpHa_zsXJFSrTJHzDdlb1QOaNP-40_ziqKJD11i4SCOIawV4nWSI44RTBwXNimpF0hkGUrvPBABOOSC1s30cf7h_zcXDZRrJitqWzcm-L2ld-DVBHwygi75YCbIGnalR1GorEuhTwT1n8TUlljVcOAFbPTcBJhdy8ugO_AX705X_U9tH8dmhCdxkg15yqZ4xGuTJq249Q74632_DtCbE-GNcbyh22NF_qtOo'
  },
  {
    id: '#RAM-16',
    name: 'Memória RAM 16GB DDR4 3200MHz - Corsair Vengeance',
    category: 'Hardware',
    stockLevel: 30,
    maxStock: 80,
    status: 'Em Estoque',
    costPrice: 170.00,
    salePrice: 279.90,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKLwCAbu1KsdnOzPuHJVP26tcRq_IPJc-EyJP9YlxGpHa_zsXJFSrTJHzDdlb1QOaNP-40_ziqKJD11i4SCOIawV4nWSI44RTBwXNimpF0hkGUrvPBABOOSC1s30cf7h_zcXDZRrJitqWzcm-L2ld-DVBHwygi75YCbIGnalR1GorEuhTwT1n8TUlljVcOAFbPTcBJhdy8ugO_AX705X_U9tH8dmhCdxkg15yqZ4xGuTJq249Q74632_DtCbE-GNcbyh22NF_qtOo'
  },
  {
    id: '#PSU-650',
    name: 'Fonte 650W 80 Plus Bronze - Corsair CV650',
    category: 'Hardware',
    stockLevel: 14,
    maxStock: 40,
    status: 'Em Estoque',
    costPrice: 290.00,
    salePrice: 449.90,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKLwCAbu1KsdnOzPuHJVP26tcRq_IPJc-EyJP9YlxGpHa_zsXJFSrTJHzDdlb1QOaNP-40_ziqKJD11i4SCOIawV4nWSI44RTBwXNimpF0hkGUrvPBABOOSC1s30cf7h_zcXDZRrJitqWzcm-L2ld-DVBHwygi75YCbIGnalR1GorEuhTwT1n8TUlljVcOAFbPTcBJhdy8ugO_AX705X_U9tH8dmhCdxkg15yqZ4xGuTJq249Q74632_DtCbE-GNcbyh22NF_qtOo'
  },
  {
    id: '#HST-7.1',
    name: 'Headset Gamer 7.1 - HyperX Cloud II',
    category: 'Periféricos',
    stockLevel: 9,
    maxStock: 45,
    status: 'Em Estoque',
    costPrice: 280.00,
    salePrice: 429.00,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkKrCpkKq-nnkcH51vIbNit3vs9sXJ4xHzdD_tLX6MIaAKsjg_c7wPqiCgMRFADp02sKKPowG_n0p5TzKYa6MaNn8VUMJpGigUwlisi3y15Dfwa--CwDkNdAi3qWIkHSOVy2vDLg5RtwyI3EZ7OezyGSNRHaeBdzPVMVoSzLtE_qVhQrpwrR6i-flumCoOqD0pSar_EGxldk9uiUuhMtclfhsu0Rf5NcEQoKk4o0O5NR5BexvQQH0-gAvNK3nPPiR4OwoQtZ4-Q_g'
  },
  {
    id: '#WBC-FHD',
    name: 'Webcam Full HD 1080p - Logitech C920',
    category: 'Periféricos',
    stockLevel: 5,
    maxStock: 30,
    status: 'Estoque Baixo',
    costPrice: 220.00,
    salePrice: 349.90,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkKrCpkKq-nnkcH51vIbNit3vs9sXJ4xHzdD_tLX6MIaAKsjg_c7wPqiCgMRFADp02sKKPowG_n0p5TzKYa6MaNn8VUMJpGigUwlisi3y15Dfwa--CwDkNdAi3qWIkHSOVy2vDLg5RtwyI3EZ7OezyGSNRHaeBdzPVMVoSzLtE_qVhQrpwrR6i-flumCoOqD0pSar_EGxldk9uiUuhMtclfhsu0Rf5NcEQoKk4o0O5NR5BexvQQH0-gAvNK3nPPiR4OwoQtZ4-Q_g'
  },
  {
    id: '#MON-27',
    name: 'Monitor 27" 4K UHD - Samsung ViewFinity',
    category: 'Monitores',
    stockLevel: 7,
    maxStock: 20,
    status: 'Estoque Baixo',
    costPrice: 1180.00,
    salePrice: 1799.00,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCw_JoS8czCZ266khX3vsYlW76uz63kaNWVerNtLQamgTRl126ldUtRcXIslRy-yPDXntfOrZENYfEv2pZV6goi55CXEdxRAFWhzzD_byIlN7XdZ6xtEGrekxnjCu876Caa21Ug6kmRyLr4cQKtfZjlSryzjQItad1t7JSMMPJd9OWK6eG_a-Fp0_xXaQRekyEBrhPNqjR0NeskyBaReYSg_oLLiyaxrsq-rRriVK4Biy9Igf341EJRiCWOeOEuE1Vx4b6Ry5CRFtk'
  },
  {
    id: '#MON-ULT',
    name: 'Monitor Ultrawide 34" - Dell S3422DWG',
    category: 'Monitores',
    stockLevel: 1,
    maxStock: 12,
    status: 'Crítico',
    costPrice: 1990.00,
    salePrice: 2899.00,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCw_JoS8czCZ266khX3vsYlW76uz63kaNWVerNtLQamgTRl126ldUtRcXIslRy-yPDXntfOrZENYfEv2pZV6goi55CXEdxRAFWhzzD_byIlN7XdZ6xtEGrekxnjCu876Caa21Ug6kmRyLr4cQKtfZjlSryzjQItad1t7JSMMPJd9OWK6eG_a-Fp0_xXaQRekyEBrhPNqjR0NeskyBaReYSg_oLLiyaxrsq-rRriVK4Biy9Igf341EJRiCWOeOEuE1Vx4b6Ry5CRFtk'
  },
  {
    id: '#CAB-HDMI',
    name: 'Cabo HDMI 2.1 2m 8K - UGREEN',
    category: 'Acessórios',
    stockLevel: 60,
    maxStock: 120,
    status: 'Em Estoque',
    costPrice: 25.00,
    salePrice: 59.90,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzml5T4YBMp-54hVzzrnlDqcjKIuyu1s0A0fggokDL7hqES27VkYGV568zRVZpE7QwfCogmL3585f-5EpkcemahHK_rqSMGX-t6pb__PClKSRaZzrdTkrFaGTEyAqDbz9tS9IVcjWEXWcA2GqbvkvfWBge5-BxnZm4YDP5QN3OwzHTLibEXthJ-fPEaIyF0Q9vDGOPAyzfckKx3Rfin5Pu4cw69Kj9_4ljzx-0A9kS4L6YEUf0tVqbsm6wr_BKZyfrQzcTzpDsm2I'
  },
  {
    id: '#HUB-USBC',
    name: 'Hub USB-C 7 em 1 - UGREEN',
    category: 'Acessórios',
    stockLevel: 16,
    maxStock: 50,
    status: 'Em Estoque',
    costPrice: 95.00,
    salePrice: 169.90,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzml5T4YBMp-54hVzzrnlDqcjKIuyu1s0A0fggokDL7hqES27VkYGV568zRVZpE7QwfCogmL3585f-5EpkcemahHK_rqSMGX-t6pb__PClKSRaZzrdTkrFaGTEyAqDbz9tS9IVcjWEXWcA2GqbvkvfWBge5-BxnZm4YDP5QN3OwzHTLibEXthJ-fPEaIyF0Q9vDGOPAyzfckKx3Rfin5Pu4cw69Kj9_4ljzx-0A9kS4L6YEUf0tVqbsm6wr_BKZyfrQzcTzpDsm2I'
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: '#CLI-001',
    name: 'Ricardo Almeida',
    contactName: 'Ricardo Almeida',
    doc: 'CPF: ***.442.118-**',
    email: 'ricardo.almeida@email.com',
    phone: '(11) 98842-1180',
    createdAt: '2026-01-12T09:30:00'
  },
  {
    id: '#CLI-002',
    name: 'Oficina TechMec',
    contactName: 'Roberto Mendes',
    doc: 'CNPJ: **.***.***/0001-**',
    email: 'compras@techmec.com.br',
    phone: '(11) 3344-7788',
    createdAt: '2026-02-03T11:00:00'
  },
  {
    id: '#CLI-003',
    name: 'Juliana Costa',
    contactName: 'Juliana Costa',
    doc: 'CPF: ***.182.993-**',
    email: 'ju.costa@email.com',
    phone: '(11) 99182-9930',
    createdAt: '2026-03-21T16:45:00'
  },
  {
    id: '#CLI-004',
    name: 'Studio Pixel Design',
    contactName: 'Marina Lopes',
    doc: 'CNPJ: **.***.***/0001-**',
    email: 'marina@studiopixel.com',
    phone: '(21) 98765-4321',
    createdAt: '2026-05-08T14:20:00'
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: '#BF-10828',
    createdAt: '2026-06-25T14:25:30',
    clientId: '#CLI-001',
    clientName: 'Ricardo Almeida',
    clientDoc: 'CPF: ***.442.118-**',
    seller: 'Marcos Silva',
    paymentMethod: 'Cartão Crédito',
    totalValue: 888.80,
    status: 'Pago',
    items: [
      { productId: '#SSD-1TB', name: 'SSD NVMe 1TB - Kingston NV2', quantity: 2, price: 329.90 },
      { productId: '#MOU-WRL', name: 'Mouse Gamer G305 - Logitech', quantity: 1, price: 229.00 }
    ]
  },
  {
    id: '#BF-10827',
    createdAt: '2026-06-25T13:10:15',
    clientId: '#CLI-002',
    clientName: 'Oficina TechMec',
    clientDoc: 'CNPJ: **.***.***/0001-**',
    seller: 'Balcão Auxiliar',
    paymentMethod: 'PIX',
    totalValue: 558.90,
    status: 'Aguard. Retirada',
    items: [
      { productId: '#SSD-1TB', name: 'SSD NVMe 1TB - Kingston NV2', quantity: 1, price: 329.90 },
      { productId: '#MOU-WRL', name: 'Mouse Gamer G305 - Logitech', quantity: 1, price: 229.00 }
    ]
  },
  {
    id: '#BF-10826',
    createdAt: '2026-06-18T12:05:00',
    clientName: 'Consumidor Final',
    clientDoc: 'N/A',
    seller: 'Balcão Auxiliar',
    paymentMethod: 'Dinheiro',
    totalValue: 329.90,
    status: 'Pago',
    items: [
      { productId: '#SSD-1TB', name: 'SSD NVMe 1TB - Kingston NV2', quantity: 1, price: 329.90 }
    ]
  },
  {
    id: '#BF-10825',
    createdAt: '2026-06-10T11:50:22',
    clientId: '#CLI-003',
    clientName: 'Juliana Costa',
    clientDoc: 'CPF: ***.182.993-**',
    seller: 'Balcão Auxiliar',
    paymentMethod: 'Debito',
    totalValue: 189.00,
    status: 'Cancelado',
    items: [
      { productId: '#KYB-MECH', name: 'Teclado Mecânico RGB - Redragon', quantity: 1, price: 189.00 }
    ]
  },
  {
    id: '#BF-10824',
    createdAt: '2026-06-03T10:15:40',
    clientId: '#CLI-004',
    clientName: 'Studio Pixel Design',
    clientDoc: 'CNPJ: **.***.***/0001-**',
    seller: 'Marcos Silva',
    paymentMethod: 'Cartão Crédito',
    totalValue: 2199.00,
    status: 'Pago',
    items: [
      { productId: '#GPU-RTX', name: 'Placa de Vídeo RTX 4060 - ASUS', quantity: 1, price: 2199.00 }
    ]
  },
  {
    id: '#BF-10823',
    createdAt: '2026-05-22T15:30:00',
    clientId: '#CLI-001',
    clientName: 'Ricardo Almeida',
    clientDoc: 'CPF: ***.442.118-**',
    seller: 'Balcão Auxiliar',
    paymentMethod: 'PIX',
    totalValue: 949.00,
    status: 'Pago',
    items: [
      { productId: '#MON-144', name: 'Monitor IPS 144Hz - LG UltraGear', quantity: 1, price: 949.00 }
    ]
  },
  {
    id: '#BF-10822',
    createdAt: '2026-05-09T17:05:10',
    clientId: '#CLI-002',
    clientName: 'Oficina TechMec',
    clientDoc: 'CNPJ: **.***.***/0001-**',
    seller: 'Marcos Silva',
    paymentMethod: 'Cartão Crédito',
    totalValue: 378.00,
    status: 'Pago',
    items: [
      { productId: '#KYB-MECH', name: 'Teclado Mecânico RGB - Redragon', quantity: 2, price: 189.00 }
    ]
  },
  {
    id: '#BF-10821',
    createdAt: '2026-03-14T13:40:55',
    clientId: '#CLI-004',
    clientName: 'Studio Pixel Design',
    clientDoc: 'CNPJ: **.***.***/0001-**',
    seller: 'Balcão Auxiliar',
    paymentMethod: 'PIX',
    totalValue: 1898.00,
    status: 'Pago',
    items: [
      { productId: '#MON-144', name: 'Monitor IPS 144Hz - LG UltraGear', quantity: 2, price: 949.00 }
    ]
  }
];

export const AVATAR_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHOlvbJ7P_4uC4bjA-MsyxkZQvqghn_GYv0a7fOeLwO_yGQclZpUvtizdsLh565dVE_xTzmmqpmZCGjH5e8RfhiQdBcK4Lzv-gQiA2_gMM1xgRdLYowEzcUiePOTxHSfh_NpxY1V7a-f3BvPJqIYtIUoTHBGAnAmLlWgg_DuN3d3htAFrEX-ZV-92XWWfuxXt5Em8X9k72NsvNTH2mATUkNAt0buccOGltcPS3p6Nav0nYoWs6sGUJ4ihlfwEOM0LXnX3ycoWEvXY';

export const STOCK_BANNER_BG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuChqN4uuEu0fRTYGjXrkgv-R9i5HGqKNLA2_g9Lmct36IbVZDuzdQreb2D2qKvtAicy_b5N3Qt776pwgpsmztJkNFKQ8YBM5hRVltmfDcydgJjo4bWMuVIU0opr2Xx4c3aXvfOd0Ras-H0I436B_sDBNNXBZbf6d_UnuvDzjDP3Qc93GzxDTH5WXqaCHZfrjyDcf2-jsP4gzHqvpV_wmdebla6lrMq1MHgRP5WLIu-B-LjoB28b8PzdkM1Th94v9ad_ohCqzBxoaV8';

export const REPORTS_BANNER_BG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3FRDR7q8WPb7FYin5C0O_EeFiFAWIoz7kpKrhIunThU2Iv___xeSNjRp3WPdjitBoUaVHUONzfXaHyBLlkZHUh2klovMOG6aY4ETaMVrnFXkiXWP8Pu8b-cTkJBvOAWM-OuRp8fmYkoayGY2RtVt2j63nmSa9YcZyY6K_IN-5pNPwrB8OPPl4USJppu-F3LgXIJOrzTogidEuhUDN8YG5-quQR-QZAx5nc7ReWAhAz5de53ic2MiFZFo0omDXJIVecGHr4tU4VEo';

export const PRODUCT_IMAGE_SAMPLES = [
  {
    name: 'Armazenamento (SSD/HDD)',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQNAH35bT8TYHJMah_F1NxiH_lGtTtSpxhBxjEIYruUdl1wK5uSJ2LgZPz6alsh980shLikhwbbKEb0V4uxai0_Bi9CSxmM7uT2FDCp4wCCLbMcLqpv39PdagQlRELK_4ubhjiKC2X9C2az0otlmXeO3CdrrtC0jEraayXDb3XRmKHXBFeOqRvPCdvD6dyLgF52TudrXlSvVWYiioQw9RcCmUwpDoBCys5BGaxK0Rd_s7fdDrLr8O94mez0MWje51FNCF8XeYDIQA'
  },
  {
    name: 'Periféricos (Teclados/Mouses)',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkKrCpkKq-nnkcH51vIbNit3vs9sXJ4xHzdD_tLX6MIaAKsjg_c7wPqiCgMRFADp02sKKPowG_n0p5TzKYa6MaNn8VUMJpGigUwlisi3y15Dfwa--CwDkNdAi3qWIkHSOVy2vDLg5RtwyI3EZ7OezyGSNRHaeBdzPVMVoSzLtE_qVhQrpwrR6i-flumCoOqD0pSar_EGxldk9uiUuhMtclfhsu0Rf5NcEQoKk4o0O5NR5BexvQQH0-gAvNK3nPPiR4OwoQtZ4-Q_g'
  },
  {
    name: 'Componentes e Hardware (GPUs/CPUs)',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKLwCAbu1KsdnOzPuHJVP26tcRq_IPJc-EyJP9YlxGpHa_zsXJFSrTJHzDdlb1QOaNP-40_ziqKJD11i4SCOIawV4nWSI44RTBwXNimpF0hkGUrvPBABOOSC1s30cf7h_zcXDZRrJitqWzcm-L2ld-DVBHwygi75YCbIGnalR1GorEuhTwT1n8TUlljVcOAFbPTcBJhdy8ugO_AX705X_U9tH8dmhCdxkg15yqZ4xGuTJq249Q74632_DtCbE-GNcbyh22NF_qtOo'
  },
  {
    name: 'Monitores e Displays',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCw_JoS8czCZ266khX3vsYlW76uz63kaNWVerNtLQamgTRl126ldUtRcXIslRy-yPDXntfOrZENYfEv2pZV6goi55CXEdxRAFWhzzD_byIlN7XdZ6xtEGrekxnjCu876Caa21Ug6kmRyLr4cQKtfZjlSryzjQItad1t7JSMMPJd9OWK6eG_a-Fp0_xXaQRekyEBrhPNqjR0NeskyBaReYSg_oLLiyaxrsq-rRriVK4Biy9Igf341EJRiCWOeOEuE1Vx4b6Ry5CRFtk'
  },
  {
    name: 'Acessórios e Cabos',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzml5T4YBMp-54hVzzrnlDqcjKIuyu1s0A0fggokDL7hqES27VkYGV568zRVZpE7QwfCogmL3585f-5EpkcemahHK_rqSMGX-t6pb__PClKSRaZzrdTkrFaGTEyAqDbz9tS9IVcjWEXWcA2GqbvkvfWBge5-BxnZm4YDP5QN3OwzHTLibEXthJ-fPEaIyF0Q9vDGOPAyzfckKx3Rfin5Pu4cw69Kj9_4ljzx-0A9kS4L6YEUf0tVqbsm6wr_BKZyfrQzcTzpDsm2I'
  }
];
