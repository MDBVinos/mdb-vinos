# MDB Wines Admin

Panel interno para gestionar vinos desde `/admin` con Next.js App Router, Supabase Auth/Storage y Prisma sobre Supabase Postgres.

## Variables

Crear `.env.local` a partir de `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
DATABASE_URL=
DIRECT_URL=
```

`DATABASE_URL` se usa en runtime por Prisma. Para deploys serverless, usar el connection string de Supabase Supavisor en transaction mode con `?pgbouncer=true`.

`DIRECT_URL` se usa para Prisma CLI/migraciones. Usar un connection string directo o Supavisor session mode.

## Base de datos

Prisma es la capa de acceso a datos para catalogo, busqueda y `/admin`. Supabase JS queda para Auth, cookies de sesion y Storage.

Comandos principales:

```bash
npm run prisma:generate
npm run db:migrate
npm run db:seed
```

## Rutas

- `/`: home publica con busqueda, momentos y destacados.
- `/discover`: recomendador guiado.
- `/wines`: catalogo con filtros y busqueda.
- `/wine/[id]`: detalle de producto con pedido por WhatsApp.
- `/login`: login con Supabase Auth email/password.
- `/admin`: listado de vinos y toggle activo/inactivo.
- `/admin/new`: alta de vino.
- `/admin/edit/[id]`: edicion completa de vino.

## Tablas Prisma

La migracion inicial crea estas tablas:

- `wines`: `id`, `name`, `description`, `price_unit`, `price_box`, `image_url`, `active`
- `moments`: `id`, `name`
- `wine_types`: `id`, `name`
- `intensities`: `id`, `name`
- `wine_moments`: `wine_id`, `moment_id`
- `wine_types_relation`: `wine_id`, `type_id`
- `wine_intensity`: `wine_id`, `intensity_id`

El seed inicial carga:

- Momentos: `Asado`, `Cita`, `Regalo`, `Juntada`, `Comida`
- Tipos: `Tinto`, `Blanco`, `Rosado`, `Espumante`
- Intensidades: `Suave`, `Medio`, `Intenso`

## Storage

El bucket usado es `wines`. Las imagenes se suben a paths del estilo:

```text
wines/{timestamp}-{filename}
```

Luego se guarda la public URL en `wines.image_url`. La migracion inicial crea el bucket publico `wines` y politicas para lectura publica y escritura autenticada.

## Marca

La interfaz toma del manual de marca:

- Colores: `#7c8356`, `#5d1417`, `#702c2c`, `#29473a`, `#241134`, `#ede1d8`
- Tipografia: Garamond para marca/titulos, Cormorant Garamond como base editorial y Arial/Helvetica para controles de administracion.
