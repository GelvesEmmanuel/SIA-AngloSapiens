import fs from "fs/promises";

export const cleanupTemporaryFiles = async (filePaths: readonly string[]) => {
  await Promise.all(
    [...new Set(filePaths)].map(async (filePath) => {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          return;
        }

        console.error(`No se pudo eliminar el archivo temporal "${filePath}":`, error);
      }
    })
  );
};
