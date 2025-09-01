/**
 * Saves a JSON object.
 * In a browser, it uses localStorage for persistence.
 * In Node.js, it writes to a file in a `data` directory.
 * @param filename The name of the file.
 * @param data The object to save.
 */
export async function saveJSON(filename: string, data: any): Promise<void> {
  const jsonString = JSON.stringify(data, null, 2)

  // Check if running in Node.js environment
  if (typeof process !== "undefined" && process.versions && process.versions.node) {
    try {
      const fs = await import("fs/promises")
      const path = await import("path")
      const dir = path.join(process.cwd(), "data")
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(path.join(dir, filename), jsonString, "utf-8")
      console.log(`[Persistence] Saved state to data/${filename}`)
    } catch (e) {
      console.error(`[Persistence] Node.js save failed: ${e}`)
    }
  } else {
    // Running in browser environment
    try {
      localStorage.setItem(filename, jsonString)
      console.log(`[Persistence] State for ${filename} saved to localStorage.`)
    } catch (e) {
      console.error(`[Persistence] localStorage save failed: ${e}`)
    }
  }
}
