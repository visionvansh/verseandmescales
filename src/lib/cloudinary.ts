// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export interface UploadResult {
  url: string;
  publicId: string;
  thumbnailUrl?: string;
  duration?: number;
  format: string;
}

export async function uploadImage(
  file: Buffer | string,
  folder: string = 'posts/images'
): Promise<UploadResult> {
  try {
    const result = await cloudinary.uploader.upload(file as string, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
    };
  } catch (error) {
    console.error('Cloudinary image upload error:', error);
    throw new Error('Failed to upload image');
  }
}

export async function uploadVideo(
  file: Buffer | string,
  folder: string = 'posts/videos'
): Promise<UploadResult> {
  try {
    // Check video duration before uploading
    const result = await cloudinary.uploader.upload(file as string, {
      folder,
      resource_type: 'video',
      transformation: [
        { width: 1920, height: 1080, crop: 'limit', aspect_ratio: '16:9' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      eager: [
        { width: 640, height: 360, crop: 'fill', format: 'jpg' }
      ],
      eager_async: true,
    });

    // Check if video is longer than 3 minutes (180 seconds)
    if (result.duration && result.duration > 180) {
      // Delete the uploaded video
      await cloudinary.uploader.destroy(result.public_id, { resource_type: 'video' });
      throw new Error('Video must be less than 3 minutes');
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      thumbnailUrl: result.eager?.[0]?.secure_url,
      duration: result.duration,
      format: result.format,
    };
  } catch (error) {
    console.error('Cloudinary video upload error:', error);
    throw error;
  }
}

export async function deleteMedia(publicId: string, resourceType: 'image' | 'video' = 'image') {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete media');
  }
}

export default cloudinary;