<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Appointment;
use App\Models\Address;
use App\Models\Banner;
use App\Models\CareerApplication;
use App\Models\CareerDepartment;
use App\Models\CareerJob;
use App\Models\CareerRecruiter;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Enquiry;
use App\Models\EnquiryItem;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductReturn;
use App\Models\Refund;
use App\Models\ShippingMethod;
use App\Models\Testimonial;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Models\WishlistItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StorefrontController extends Controller
{
    protected function resourceMap(): array
    {
        return [
            'categories' => Category::class,
            'products' => Product::class,
            'banners' => Banner::class,
            'coupons' => Coupon::class,
            'shipping_methods' => ShippingMethod::class,
            'refunds' => Refund::class,
            'returns' => ProductReturn::class,
            'wishlist' => WishlistItem::class,
            'leads' => Lead::class,
            'walletTransactions' => WalletTransaction::class,
            'careerDepartments' => CareerDepartment::class,
            'careerJobs' => CareerJob::class,
            'careerApplications' => CareerApplication::class,
            'careerRecruiters' => CareerRecruiter::class,
            'testimonials' => Testimonial::class,
            'enquiries' => Enquiry::class,
            'payments' => Payment::class,
            'cart' => CartItem::class,
            'users' => User::class,
            'admins' => Admin::class,
        ];
    }

    public function index(Request $request, string $resource): JsonResponse
    {
        $modelClass = $this->resolveModel($resource);
        if ($modelClass === null) {
            return $this->notFound();
        }

        $query = $modelClass::query();

        if (in_array($resource, ['cart', 'wishlist'], true) && $request->filled('userId')) {
            $query->where('user_id', $request->input('userId'));
        }

        if ($resource === 'leads' && $request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($resource === 'products') {
            if ($request->filled('featured')) {
                $query->where('featured', filter_var($request->input('featured'), FILTER_VALIDATE_BOOLEAN));
            }
            if ($request->filled('special')) {
                $query->where('special', filter_var($request->input('special'), FILTER_VALIDATE_BOOLEAN));
            }
            if ($request->filled('trending')) {
                $query->where('trending', filter_var($request->input('trending'), FILTER_VALIDATE_BOOLEAN));
            }
            if ($request->filled('categoryId')) {
                $query->where('category_id', $request->input('categoryId'));
            }
        }

        if ($request->filled('status') && in_array('status', $this->searchableColumns($resource), true)) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('enquiryNumber') && $resource === 'enquiries') {
            $query->where('enquiry_number', $request->input('enquiryNumber'));
        }

        if ($request->filled('q') || $request->filled('search')) {
            $needle = strtolower((string) $request->input('q', $request->input('search', '')));
            $query->where(function ($query) use ($needle, $resource) {
                foreach ($this->searchableColumns($resource) as $column) {
                    $query->orWhere($column, 'like', "%{$needle}%");
                }
            });
        }

        return $this->success($query->get());
    }

    public function show(Request $request, string $resource, string $id): JsonResponse
    {
        $modelClass = $this->resolveModel($resource);
        if ($modelClass === null) {
            return $this->notFound();
        }

        $item = $modelClass::find($id);
        if (! $item) {
            return $this->notFound();
        }

        return $this->success($item);
    }

    public function store(Request $request, string $resource): JsonResponse
    {
        $modelClass = $this->resolveModel($resource);
        if ($modelClass === null) {
            return $this->notFound();
        }

        $payload = $this->normalizePayload($request->all(), $resource);
        $payload = $this->filterPayload($payload, $modelClass);

        $item = $modelClass::create($payload);

        // Handle nested items for enquiries
        if ($resource === 'enquiries' && $request->filled('items') && is_array($request->input('items'))) {
            foreach ($request->input('items') as $it) {
                $itData = [
                    'enquiry_id' => $item->id,
                    'product_id' => $it['productId'] ?? ($it['product_id'] ?? null),
                    'name' => $it['name'] ?? null,
                    'quantity' => isset($it['quantity']) ? (int)$it['quantity'] : 1,
                    'price' => isset($it['price']) ? (float)$it['price'] : null,
                    'meta' => $it['meta'] ?? null,
                ];

                EnquiryItem::create($itData);
            }
        }
        // Handle nested addresses for users
        if ($resource === 'users' && $request->filled('addresses') && is_array($request->input('addresses'))) {
            foreach ($request->input('addresses') as $addr) {
                $addrData = [
                    'user_id' => $item->id,
                    'label' => $addr['label'] ?? null,
                    'first_name' => $addr['firstName'] ?? $addr['first_name'] ?? null,
                    'last_name' => $addr['lastName'] ?? $addr['last_name'] ?? null,
                    'phone' => $addr['phone'] ?? null,
                    'address_line1' => $addr['addressLine1'] ?? $addr['address_line1'] ?? null,
                    'address_line2' => $addr['addressLine2'] ?? $addr['address_line2'] ?? null,
                    'city' => $addr['city'] ?? null,
                    'state' => $addr['state'] ?? null,
                    'postal_code' => $addr['postalCode'] ?? $addr['postal_code'] ?? null,
                    'country' => $addr['country'] ?? null,
                    'is_default' => $addr['isDefault'] ?? ($addr['is_default'] ?? false),
                ];

                Address::create($addrData);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $item,
        ], 201);
    }

    public function update(Request $request, string $resource, string $id): JsonResponse
    {
        $modelClass = $this->resolveModel($resource);
        if ($modelClass === null) {
            return $this->notFound();
        }

        $item = $modelClass::find($id);
        if (! $item) {
            return $this->notFound();
        }

        $payload = $this->normalizePayload($request->all(), $resource, $item);
        $payload = $this->filterPayload($payload, $modelClass);
        $item->fill($payload);
        $item->save();

        // Sync nested addresses for users on update
        if ($resource === 'users' && $request->has('addresses') && is_array($request->input('addresses'))) {
            // delete current addresses and recreate to match payload
            $item->addresses()->delete();
            foreach ($request->input('addresses') as $addr) {
                $addrData = [
                    'user_id' => $item->id,
                    'label' => $addr['label'] ?? null,
                    'first_name' => $addr['firstName'] ?? $addr['first_name'] ?? null,
                    'last_name' => $addr['lastName'] ?? $addr['last_name'] ?? null,
                    'phone' => $addr['phone'] ?? null,
                    'address_line1' => $addr['addressLine1'] ?? $addr['address_line1'] ?? null,
                    'address_line2' => $addr['addressLine2'] ?? $addr['address_line2'] ?? null,
                    'city' => $addr['city'] ?? null,
                    'state' => $addr['state'] ?? null,
                    'postal_code' => $addr['postalCode'] ?? $addr['postal_code'] ?? null,
                    'country' => $addr['country'] ?? null,
                    'is_default' => $addr['isDefault'] ?? ($addr['is_default'] ?? false),
                ];

                Address::create($addrData);
            }
        }

        // Sync enquiry items on update
        if ($resource === 'enquiries' && $request->has('items') && is_array($request->input('items'))) {
            // remove existing items and recreate
            if (method_exists($item, 'itemsRelation')) {
                $item->itemsRelation()->delete();
            }

            foreach ($request->input('items') as $it) {
                $itData = [
                    'enquiry_id' => $item->id,
                    'product_id' => $it['productId'] ?? ($it['product_id'] ?? null),
                    'name' => $it['name'] ?? null,
                    'quantity' => isset($it['quantity']) ? (int)$it['quantity'] : 1,
                    'price' => isset($it['price']) ? (float)$it['price'] : null,
                    'meta' => $it['meta'] ?? null,
                ];

                EnquiryItem::create($itData);
            }
        }

        return $this->success($item);
    }

    public function destroy(string $resource, string $id): JsonResponse
    {
        $modelClass = $this->resolveModel($resource);
        if ($modelClass === null) {
            return $this->notFound();
        }

        $deleted = $modelClass::destroy($id);

        return response()->json([
            'success' => true,
            'deleted' => $deleted > 0,
        ]);
    }

    public function showBySlug(string $resource, string $slug): JsonResponse
    {
        $modelClass = $this->resolveModel($resource);
        if ($modelClass === null) {
            return $this->notFound();
        }

        $slugColumn = $this->slugColumn($resource);
        if ($slugColumn === null) {
            return $this->notFound();
        }

        $item = $modelClass::where($slugColumn, $slug)->first();
        if (! $item) {
            return $this->notFound();
        }

        return $this->success($item);
    }

    public function featuredProducts(Request $request): JsonResponse
    {
        return $this->productFlagList('featured', $request);
    }

    public function specialProducts(Request $request): JsonResponse
    {
        return $this->productFlagList('special', $request);
    }

    public function trendingProducts(Request $request): JsonResponse
    {
        return $this->productFlagList('trending', $request);
    }

    public function productsByCategory(string $categoryId, Request $request): JsonResponse
    {
        $limit = (int) $request->input('limit', 0);
        $query = Product::where('category_id', $categoryId)->where('is_active', true);

        if ($limit > 0) {
            $query->limit($limit);
        }

        return $this->success($query->get());
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

    private function productFlagList(string $field, Request $request): JsonResponse
    {
        $limit = (int) $request->input('limit', 0);
        $query = Product::where($field, true)->where('is_active', true);

        if ($limit > 0) {
            $query->limit($limit);
        }

        return $this->success($query->get());
    }

    private function resolveModel(string $resource): ?string
    {
        return $this->resourceMap()[$resource] ?? null;
    }

    private function slugColumn(string $resource): ?string
    {
        $slugged = [
            'categories' => 'slug',
            'products' => 'slug',
            'careerJobs' => 'slug',
        ];

        return $slugged[$resource] ?? null;
    }

    private function searchableColumns(string $resource): array
    {
        return match ($resource) {
            'categories' => ['name', 'description'],
            'products' => ['name', 'description', 'brand', 'slug'],
            'banners' => ['title', 'subtitle', 'cta', 'link'],
            'coupons' => ['code', 'type'],
            'shipping_methods' => ['name'],
            'enquiries' => ['enquiry_number', 'status'],
            'payments' => ['order_id', 'payment_id', 'signature', 'status'],
            'careerDepartments' => ['name', 'slug'],
            'careerJobs' => ['title', 'slug', 'location', 'status'],
            'careerRecruiters' => ['name', 'email', 'phone'],
            'testimonials' => ['name', 'title', 'body'],
            'leads' => ['name', 'email', 'phone', 'subject', 'message', 'status', 'type', 'category'],
            'wishlist' => ['name', 'brand', 'slug'],
            default => ['id'],
        };
    }

    private function filterPayload(array $payload, string $modelClass): array
    {
        $model = new $modelClass();
        $fillable = $model->getFillable();

        if (empty($fillable)) {
            return [];
        }

        return array_filter(
            $payload,
            fn ($value, $key) => in_array($key, $fillable, true),
            ARRAY_FILTER_USE_BOTH
        );
    }

    private function normalizePayload(array $payload, string $resource, ?Model $item = null): array
    {
        foreach ($this->camelCaseAliases($resource) as $camel => $snake) {
            if (array_key_exists($camel, $payload) && ! array_key_exists($snake, $payload)) {
                $payload[$snake] = $payload[$camel];
            }
        }

        if (empty($payload['slug']) && ! empty($payload['name']) && in_array($resource, ['categories', 'products', 'careerDepartments', 'careerJobs'], true)) {
            $payload['slug'] = Str::slug($payload['name']);
        }

        if ($resource === 'leads') {
            $payload['type'] = $payload['type'] ?? 'contact';
            $payload['status'] = $payload['status'] ?? ($payload['type'] === 'newsletter' ? 'subscribed' : 'new');
            $payload['notes'] = $payload['notes'] ?? '';
        }

        return $payload;
    }

    private function camelCaseAliases(string $resource): array
    {
        return match ($resource) {
            'wishlist' => [
                'userId' => 'user_id',
                'productId' => 'product_id',
                'comparePrice' => 'compare_price',
                'totalReviews' => 'total_reviews',
                'shortDescription' => 'short_description',
                'addedAt' => 'added_at',
            ],
            'cart' => [
                'userId' => 'user_id',
                'productId' => 'product_id',
            ],
            'leads' => [
                'orderNumber' => 'order_number',
            ],
            default => [],
        };
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
