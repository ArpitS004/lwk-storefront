// One-off script: updates the "lowkey-always" collection's hero_image.
// Run with:  pnpm exec tsx --env-file=.env update-hero-image.ts
import { Pool } from "pg"

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const result = await pool.query(
    `UPDATE collections SET hero_image = $1 WHERE slug = $2 RETURNING slug, hero_image`,
    ["/lwk-collection-banner.jpg", "lowkey-always"]
  )
  console.log("Updated row(s):", result.rows)
  await pool.end()
}

main().catch((err) => {
  console.error("Failed to update:", err)
  process.exit(1)
})
