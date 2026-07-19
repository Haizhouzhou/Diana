import { generateProgramFiles, type ProgramFileMap } from "./program-files";

const FIXED_DATE = new Date("2000-01-01T00:00:00.000Z");
const MAX_FILES = 64;
const MAX_UNCOMPRESSED_BYTES = 8 * 1024 * 1024;

export async function generateZipFromFiles(files: ProgramFileMap): Promise<Blob> {
  const names = Object.keys(files).sort();
  if (names.length > MAX_FILES) throw new Error("Generated kit exceeds the file-count safety limit");
  const total = names.reduce((sum, name) => sum + files[name].byteLength, 0);
  if (total > MAX_UNCOMPRESSED_BYTES) throw new Error("Generated kit exceeds the size safety limit");
  const { default: JSZip } = await import("jszip"); const zip = new JSZip();
  for (const name of names) {
    if (!name.startsWith("diana-benchmark-program/") || name.includes("..") || name.includes("\\") || /^[A-Za-z]:/.test(name)) throw new Error(`Unsafe internal ZIP path: ${name}`);
    const stableBytes = new Uint8Array(files[name]);
    zip.file(name, stableBytes.buffer, { date: FIXED_DATE, createFolders: false, unixPermissions: name.endsWith("run.sh") ? 0o100755 : 0o100644 });
  }
  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 }, platform: "UNIX", streamFiles: false });
}

export async function generateZip(input: unknown): Promise<Blob> {
  return generateZipFromFiles((await generateProgramFiles(input)).files);
}
