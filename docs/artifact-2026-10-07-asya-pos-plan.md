# Asya POS - Implementation Plan (Artifact)

## Nama Proyek
- Brand: Asya POS (dari Astro + Elysia)
- Root project: `asya-pos` (monorepo Bun workspaces)
- Package scopes: `@asya-pos/*`

## 1. Tujuan
Membangun aplikasi POS (Point of Sale) dengan fitur:
- Landing page
- Dashboard user
- Dashboard admin
- Form register
- Form login
- RBAC pada form login

Fokus murni POS (tidak ada grosir khusus). Mengikuti antislop (Mode 1: During).

## 2. Tech Stack
| Layer | Tech | Alasan |
|---|---|---|
| Runtime | Bun (full) | Sesuai request |
| Monorepo | Bun workspaces | Konsisten full Bun |
| Frontend | Astro 7 + Tailwind CSS | Sesuai request |
| Interaktif | React (Astro Island) hanya `/cashier` | Sesuai request (UX keranjang lebih smooth) |
| Backend | ElysiaJS (Bun) | Cocok Bun, type-safe |
| DB | MySQL + Drizzle ORM + drizzle-kit | Sesuai request |
| Auth | HttpOnly cookie + JWT (argon2id) | Aman, RBAC support |
| Validasi | Zod (shared via `@asya-pos/types`) | Validator terpusat (API + form) |
| Utils/UI | Tailwind, clsx (opsional), date-fns (opsional) | Ringan |

## 3. Struktur Folder
```
asya-pos/
├── apps/
│   ├── web/                    # @asya-pos/web
│   └── api/                    # @asya-pos/api (Elysia)
├── packages/
│   ├── db/                     # @asya-pos/db (Drizzle)
│   ├── types/                  # @asya-pos/types (Zod + infer)
│   ├── utils/                  # @asya-pos/utils
│   └── config/                 # @asya-pos/config
├── docs/
└── package.json                # name: asya-pos, workspaces
```

## 4. DB Schema (log simpel)
Tabel: users, categories, products, stocks, orders, order_items, activity_logs. activity_logs: id, user_id(FK nullable), action, entity_type, entity_id, meta(JSON), created_at (tanpa ip/user_agent/old-new).

Atomic checkout: order + order_items + decrement stok dalam 1 transaksi DB.

## 5. RBAC
admin: semua | kasir: cashier+dashboard+transaksi+read produk/stok | user: dashboard terbatas. Redirect: admin→/admin, kasir→/cashier, user→/dashboard.

## 6. API (ringkas)
Auth (register/login/logout/me), Products/Categories/Stocks, Transactions (GET/POST), Users (admin), Reports (admin), Logs (admin). Write penting dicatat activity_logs.

## 7. Zod di @asya-pos/types
auth, user, product, order, log, common + z.infer. Dipakai di Elysia validation.

## 8. Scripts (Bun full)
dev (web+api), db:generate/push/migrate/studio/seed, build, preview.

## 9. Urutan Kerja
0-18 spt rencana fase bertahap. Wajib verify R-35 + Delivery Gate antislop.

## 10. Keputusan Khusus
- Log simpel dulu (bisa ditambah migrasi)
- Assets via reverse proxy (gzip/brotli) di prod
- Zod shared terpusat
