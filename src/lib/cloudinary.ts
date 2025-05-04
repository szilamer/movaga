import { v2 as cloudinary } from 'cloudinary';

// Cloudinary konfigurálása
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo', // Alapértelmezett 'demo' cloud a teszteléshez
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Kép feltöltése Cloudinary-ra
 * @param file Fájl buffer tartalma
 * @param fileName Fájl neve
 * @returns Az URL és az ID, ahol a kép elérhető
 */
export async function uploadImageToCloudinary(
  file: Buffer,
  fileName: string
): Promise<{ url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    // Egyedi folder név generálása a képekhez (termékenként csoportosítva)
    const folderName = `movaga_products`;
    
    // Feltöltés a Cloudinary-ra
    cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        filename_override: fileName,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error('Unknown Cloudinary upload error'));
        }
      }
    ).end(file);
  });
}

/**
 * Kép törlése a Cloudinary-ról
 * @param publicId A kép public_id-ja
 * @returns Boolean, hogy sikeres volt-e a törlés
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
} 