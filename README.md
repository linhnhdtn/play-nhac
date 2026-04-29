This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database — Drizzle ORM + SQLite

Project dùng **Drizzle ORM** với **better-sqlite3** làm database layer.

### Cài đặt

```bash
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
```

### Cấu hình (`drizzle.config.ts`)

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './nhac.db',
  },
})
```

### Kết nối DB (`db/index.ts`)

```ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const sqlite = new Database('./nhac.db')
export const db = drizzle(sqlite, { schema })
```

### Định nghĩa schema (`db/schema.ts`)

```ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const tracks = sqliteTable('tracks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  artist: text('artist'),
  mediaType: text('media_type', { enum: ['mp3', 'mp4', 'youtube'] }).notNull(),
  src: text('src').notNull(),
  coverUrl: text('cover_url'),
  duration: real('duration'),
  lyrics: text('lyrics'),
  createdAt: integer('created_at').default(sql`(unixepoch())`),
})
```

### Các lệnh hay dùng

| Lệnh | Mô tả |
|------|-------|
| `npm run db:push` | Đồng bộ schema xuống database (không cần migration file) |
| `npm run db:studio` | Mở Drizzle Studio — UI xem/sửa dữ liệu tại `https://local.drizzle.studio` |

### Ví dụ query

```ts
import { db } from '@/db'
import { tracks } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Lấy tất cả tracks
const all = await db.select().from(tracks)

// Lấy theo id
const one = await db.select().from(tracks).where(eq(tracks.id, 'abc123')).get()

// Thêm mới
await db.insert(tracks).values({ id: '...', title: 'Bài hát', mediaType: 'mp3', src: '/uploads/...' })

// Cập nhật
await db.update(tracks).set({ title: 'Tên mới' }).where(eq(tracks.id, 'abc123'))

// Xoá
await db.delete(tracks).where(eq(tracks.id, 'abc123'))
```

### Workflow thêm bảng mới

1. Định nghĩa bảng trong `db/schema.ts`
2. Chạy `npm run db:push` để tạo bảng trong `nhac.db`
3. Import và dùng trong API routes

> **Lưu ý:** Project này khởi tạo bảng bằng `sqlite.exec(CREATE TABLE IF NOT EXISTS ...)` trong `db/index.ts`, nên `db:push` chỉ cần dùng khi thay đổi schema sau khi deploy.

---

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
