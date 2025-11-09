// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const uploadToCloudinary = async (
  file: File,
  folder: string = 'posts'
): Promise<{ url: string; publicId: string; duration?: string }> => {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        transformation: file.type.startsWith('video/')
          ? [
              { width: 1920, height: 1080, crop: 'limit' },
              { quality: 'auto' },
              { duration: 180 }, // 3 minutes max
            ]
          : [
              { width: 1920, height: 1080, crop: 'fill', gravity: 'center' },
              { quality: 'auto:good' },
            ],
      },
      (error, result) => {
        if (error) reject(error);
        else
          resolve({
            url: result!.secure_url,
            publicId: result!.public_id,
            duration: result!.duration
              ? `${Math.floor(result!.duration / 60)}:${(result!.duration % 60)
                  .toString()
                  .padStart(2, '0')}`
              : undefined,
          });
      }
    );

    uploadStream.end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId: string) => {
  return cloudinary.uploader.destroy(publicId);
};

export default cloudinary;