# Sincronización en vivo con Cloudflare D1

La página guarda los cambios en el navegador y se sincroniza con una base de datos D1 mediante un Cloudflare Worker. No hace falta JSONBin ni guardar claves en el código.

## Preparar la base de datos

Desde una terminal abierta en la carpeta del proyecto:

1. Instala Node.js si todavía no está instalado.
2. Inicia sesión en Cloudflare:

   ```sh
   npx wrangler login
   ```

3. Crea la base D1:

   ```sh
   npx wrangler d1 create roadmap-soluciones-sync
   ```

4. Copia el `database_id` que devuelve Wrangler en `wrangler.toml`, reemplazando `REPLACE_WITH_D1_DATABASE_ID`.
5. Crea la tabla en la base remota:

   ```sh
   npx wrangler d1 migrations apply roadmap-soluciones-sync --remote
   ```

6. Publica el Worker:

   ```sh
   npx wrangler deploy
   ```

   Wrangler mostrará una URL similar a `https://roadmap-soluciones-sync.<subdominio>.workers.dev`.

7. En `index.html`, asigna la URL del Worker (sin barra final) a `SYNC_API_URL`. Luego publica los cambios del repositorio para actualizar GitHub Pages.

El Worker solo acepta solicitudes del origen `https://lauraizarra.github.io` y envía respuestas sin caché. El control de origen ayuda a limitar el uso casual desde otras páginas, pero no es autenticación: el sitio es público y cualquier persona que conozca la URL del Worker puede consultar o cambiar el roadmap. Para restringirlo a personas concretas habría que añadir inicio de sesión.
