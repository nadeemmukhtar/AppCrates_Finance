<?php

namespace App\Services;

use App\Models\Media;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class MediaService
{
    /**
     * Upload an attachment file and save Media database record.
     * Uses Intervention Image to compress and optimize image uploads to lower file size.
     */
    public function upload(UploadedFile $file, ?User $user = null, ?string $customDisplayName = null): Media
    {
        $originalName = $file->getClientOriginalName();
        $displayName = $customDisplayName ?: $originalName;

        $folder = 'attachments/'.date('Y/m');
        $ext = strtolower($file->getClientOriginalExtension());
        $mimeType = $file->getClientMimeType();

        $fileName = Str::uuid().'.'.($ext ?: 'bin');
        $filePath = $folder.'/'.$fileName;

        $isImage = str_starts_with($mimeType, 'image/') || in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp']);

        if ($isImage) {
            try {
                $manager = new ImageManager(new Driver);
                $image = $manager->decodePath($file->getRealPath());

                // Scale down dimensions if larger than 1600px while preserving aspect ratio
                $image->scaleDown(width: 1600, height: 1600);

                // Encode image with compressed low quality (65%)
                $qualityExt = in_array($ext, ['jpg', 'jpeg', 'png', 'webp']) ? $ext : 'jpg';
                $encoded = $image->encodeUsingFileExtension($qualityExt, quality: 65);

                Storage::disk('public')->put($filePath, (string) $encoded);
                $fileSize = strlen((string) $encoded);
            } catch (\Throwable $e) {
                // Fallback to standard upload if image processing encounters an issue
                $filePath = $file->storeAs($folder, $fileName, 'public');
                $fileSize = $file->getSize();
            }
        } else {
            $filePath = $file->storeAs($folder, $fileName, 'public');
            $fileSize = $file->getSize();
        }

        return Media::create([
            'file_name' => $fileName,
            'display_name' => $displayName,
            'file_path' => $filePath,
            'disk' => 'public',
            'mime_type' => $mimeType,
            'file_size' => $fileSize,
            'created_by' => $user?->id ?? auth()->id(),
        ]);
    }
}
