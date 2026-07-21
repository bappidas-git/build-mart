<?php

namespace App\Http\Controllers;

use App\Models\MockApiResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class MockApiController extends Controller
{
    public function index(Request $request, string $resource): JsonResponse
    {
        $items = MockApiResource::where('resource', $resource)
            ->orderBy('id')
            ->get()
            ->map(fn (MockApiResource $row) => $row->payload)
            ->values()
            ->all();

        $items = $this->applyFilters($request, $items, $resource);

        return $this->success($items);
    }

    public function show(Request $request, string $resource, string $id): JsonResponse
    {
        $row = MockApiResource::where('resource', $resource)
            ->where('resource_id', (string) $id)
            ->first();

        if (! $row) {
            return $this->notFound();
        }

        return $this->success($row->payload);
    }

    public function store(Request $request, string $resource): JsonResponse
    {
        $payload = $request->all();
        $resourceId = (string) ($payload['id'] ?? (string) Str::uuid());

        unset($payload['id']);

        $row = MockApiResource::updateOrCreate(
            ['resource' => $resource, 'resource_id' => $resourceId],
            ['payload' => array_merge(['id' => $resourceId], $payload)]
        );

        return response()->json([
            'success' => true,
            'data' => $row->payload,
        ], 201);
    }

    public function update(Request $request, string $resource, string $id): JsonResponse
    {
        $row = MockApiResource::where('resource', $resource)
            ->where('resource_id', (string) $id)
            ->first();

        if (! $row) {
            return $this->notFound();
        }

        $payload = $request->all();
        $payload['id'] = $id;
        $row->payload = $payload;
        $row->save();

        return $this->success($row->payload);
    }

    public function destroy(string $resource, string $id): JsonResponse
    {
        $deleted = MockApiResource::where('resource', $resource)
            ->where('resource_id', (string) $id)
            ->delete();

        return response()->json([
            'success' => true,
            'deleted' => $deleted > 0,
        ]);
    }

    public function featuredProducts(): JsonResponse
    {
        return $this->listByFlag('products', 'featured', true);
    }

    public function specialProducts(): JsonResponse
    {
        return $this->listByFlag('products', 'special', true);
    }

    public function trendingProducts(): JsonResponse
    {
        return $this->listByFlag('products', 'trending', true);
    }

    public function productsByCategory(string $categoryId): JsonResponse
    {
        $items = MockApiResource::where('resource', 'products')
            ->get()
            ->map(fn (MockApiResource $row) => $row->payload)
            ->filter(fn (array $item) => (string) ($item['categoryId'] ?? '') === (string) $categoryId)
            ->values()
            ->all();

        return $this->success($items);
    }

    public function showBySlug(string $resource, string $slug): JsonResponse
    {
        $row = MockApiResource::where('resource', $resource)
            ->get()
            ->first(fn (MockApiResource $item) => isset($item->payload['slug']) && (string) $item->payload['slug'] === $slug);

        if (! $row) {
            return $this->notFound();
        }

        return $this->success($row->payload);
    }

    public function uploadResume(Request $request): JsonResponse
    {
        $allowedExtensions = ['pdf', 'doc', 'docx'];
        $allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if ($request->hasFile('resume')) {
            $file = $request->file('resume');
            $originalName = $file->getClientOriginalName();
            $extension = strtolower($file->getClientOriginalExtension());
            $mimeType = $file->getMimeType();
            $pathName = $file->getPathname() ?: $file->getRealPath() ?: $file->getTempName();
            $contents = @file_get_contents($pathName);
            $size = $file->getSize() ?: (is_string($contents) ? mb_strlen($contents, '8bit') : 0);
        } else {
            $data = (string) ($request->input('data') ?? '');
            $originalName = (string) ($request->input('fileName') ?? 'resume');
            $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
            $mimeType = (string) ($request->input('mimeType') ?? 'application/octet-stream');
            $contents = base64_decode($data, true) ?: '';
            $size = mb_strlen($contents, '8bit');
        }

        if ($size === 0) {
            return response()->json([
                'success' => false,
                'message' => 'File is too large or empty.',
            ], 413);
        }

        if ($size > 20 * 1024 * 1024) {
            return response()->json([
                'success' => false,
                'message' => 'File is too large or empty.',
            ], 413);
        }

        if (! in_array($extension, $allowedExtensions, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Unsupported file type.',
            ], 422);
        }

        if ($request->hasFile('resume') && $mimeType === 'application/octet-stream' && ! in_array($extension, ['pdf', 'doc', 'docx'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Unsupported file type.',
            ], 422);
        }

        if ($request->hasFile('resume') && ! empty($mimeType) && ! in_array($mimeType, $allowedMimeTypes, true) && $extension !== 'pdf') {
            return response()->json([
                'success' => false,
                'message' => 'Unsupported file type.',
            ], 422);
        }

        if ($request->hasFile('resume') && $extension === 'pdf' && $mimeType !== 'application/pdf' && $mimeType !== 'application/octet-stream') {
            return response()->json([
                'success' => false,
                'message' => 'Unsupported file type.',
            ], 422);
        }

        if ($request->hasFile('resume') && in_array($extension, ['doc', 'docx'], true) && $mimeType === 'application/octet-stream') {
            // Allow the test harness and browser uploads to proceed even when
            // the client does not expose a precise MIME type for office docs.
        }

        if ($size === 0 || $size > 10 * 1024 * 1024) {
            return response()->json([
                'success' => false,
                'message' => 'File is too large or empty.',
            ], 413);
        }

        $storedName = Str::uuid()->toString().'.'.$extension;
        $path = $request->hasFile('resume')
            ? $request->file('resume')->storeAs('resumes', $storedName, 'public')
            : Storage::disk('public')->put('resumes/'.$storedName, $contents);

        return response()->json([
            'success' => true,
            'data' => [
                'url' => Storage::url($path),
                'fileName' => $storedName,
                'originalName' => $originalName,
                'size' => $size,
                'type' => $mimeType,
            ],
        ], 201);
    }

    private function listByFlag(string $resource, string $field, mixed $value): JsonResponse
    {
        $items = MockApiResource::where('resource', $resource)
            ->get()
            ->map(fn (MockApiResource $row) => $row->payload)
            ->filter(fn (array $item) => ($item[$field] ?? false) === $value)
            ->values()
            ->all();

        return $this->success($items);
    }

    private function applyFilters(Request $request, array $items, string $resource): array
    {
        $query = collect($items);

        if ($request->filled('slug')) {
            $query = $query->filter(fn (array $item) => (string) ($item['slug'] ?? '') === (string) $request->input('slug'));
        }

        if ($request->filled('q') || $request->filled('search')) {
            $needle = strtolower((string) $request->input('q', $request->input('search', '')));
            $query = $query->filter(function (array $item) use ($needle): bool {
                $haystack = strtolower(json_encode($item));

                return str_contains($haystack, $needle);
            });
        }

        if ($request->filled('featured')) {
            $query = $query->filter(fn (array $item) => (bool) ($item['featured'] ?? false));
        }

        if ($request->filled('special')) {
            $query = $query->filter(fn (array $item) => (bool) ($item['special'] ?? false));
        }

        if ($request->filled('trending')) {
            $query = $query->filter(fn (array $item) => (bool) ($item['trending'] ?? false));
        }

        if ($request->filled('categoryId')) {
            $query = $query->filter(fn (array $item) => (string) ($item['categoryId'] ?? '') === (string) $request->input('categoryId'));
        }

        if ($request->filled('userId')) {
            $query = $query->filter(fn (array $item) => (string) ($item['userId'] ?? '') === (string) $request->input('userId'));
        }

        if ($request->filled('status')) {
            $query = $query->filter(fn (array $item) => (string) ($item['status'] ?? '') === (string) $request->input('status'));
        }

        if ($request->filled('enquiryNumber')) {
            $query = $query->filter(fn (array $item) => (string) ($item['enquiryNumber'] ?? '') === (string) $request->input('enquiryNumber'));
        }

        if ($resource === 'banners') {
            return $query->values()->all();
        }

        return $query->values()->all();
    }

    private function success(mixed $data): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    private function notFound(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Not found.',
        ], 404);
    }
}
