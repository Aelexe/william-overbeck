import path from "path";
import fs from "fs-extra"

export const PDF_DIR = path.resolve(process.cwd(), "pdf");
fs.ensureDirSync(PDF_DIR);