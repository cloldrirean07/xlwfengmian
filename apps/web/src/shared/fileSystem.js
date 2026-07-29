import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function writeTextFile(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf-8");
}

export async function readTextFile(path) {
  return readFile(path, "utf-8");
}
