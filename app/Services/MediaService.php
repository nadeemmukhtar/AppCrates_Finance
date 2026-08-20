<?php

namespace App\Services;

use App\Models\Media;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class MediaService
{
    /**
     * Upload an attachment file and save Media database record.
     */
    public function upload(UploadedFile $file, ?User $user = null, ?string $customDisplayName = null): Media
    {
        $originalName = $file->getClientOriginalName();
        $displayName = $customDisplayName ?: $originalName;

        $folder = 'attachments/'.date('Y/m');
        $fileName = Str::uuid().'.'.$file->getClientOriginalExtension();

        $filePath = $file->storeAs($folder, $fileName, 'public');

        return Media::create([
            'file_name' => $fileName,
            'display_name' => $displayName,
            'file_path' => $filePath,
            'disk' => 'public',
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'created_by' => $user?->id ?? auth()->id(),
        ]);
    }
}
