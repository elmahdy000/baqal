import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function extFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

let cloudinaryConfigured = false;
function ensureCloudinary() {
  if (cloudinaryConfigured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  cloudinaryConfigured = true;
}

async function uploadToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<string> {
  ensureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `baqal/${folder}`, resource_type: "image" },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("upload failed"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export async function saveImage(
  file: File,
  folder: "products" | "logos"
): Promise<string> {
  if (!ALLOWED.has(file.type)) {
    throw new Error("نوع الملف غير مدعوم");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("الصورة كبيرة");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    return uploadToCloudinary(buffer, folder);
  }

  const ext = extFromMime(file.type);
  const id = crypto.randomUUID();
  const filename = `${id}.${ext}`;

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await mkdir(path.join(process.cwd(), "public", "uploads", "products"), {
    recursive: true,
  });
  await mkdir(path.join(process.cwd(), "public", "uploads", "logos"), {
    recursive: true,
  });

  const filepath = path.join(dir, filename);
  await writeFile(filepath, buffer);

  return `/uploads/${folder}/${filename}`;
}
