import { supabase } from './supabase';

export const STORAGE_BUCKETS = {
  PRODUCTS: 'products',
  STAFF: 'staff',
  CUSTOMERS: 'customers',
  RECEIPTS: 'receipts',
  GALLERY: 'gallery',
};

export async function uploadFile(
  bucketName: string,
  filePath: string,
  file: File
): Promise<{ path: string; url: string } | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error(`Upload error: ${error.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl,
    };
  } catch (err) {
    console.error('Upload failed:', err);
    return null;
  }
}

export async function deleteFile(bucketName: string, filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error(`Delete error: ${error.message}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Delete failed:', err);
    return false;
  }
}

export function getPublicUrl(bucketName: string, filePath: string): string {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function initializeBuckets() {
  try {
    const buckets = Object.values(STORAGE_BUCKETS);

    for (const bucketName of buckets) {
      const { data: existingBuckets } = await supabase.storage.listBuckets();
      const bucketExists = existingBuckets?.some((b) => b.name === bucketName);

      if (!bucketExists) {
        await supabase.storage.createBucket(bucketName, {
          public: true,
        });
        console.log(`Created bucket: ${bucketName}`);
      }
    }
  } catch (err) {
    console.error('Bucket initialization error:', err);
  }
}
