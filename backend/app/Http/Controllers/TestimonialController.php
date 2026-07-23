<?php

namespace App\Http\Controllers;

use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TestimonialController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Testimonial::query()->orderBy('sort_order');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('featured')) {
            $query->where('featured', filter_var($request->input('featured'), FILTER_VALIDATE_BOOLEAN));
        }

        return $this->success($query->get()->map->toApiObject()->values());
    }

    public function show(string $id): JsonResponse
    {
        $testimonial = Testimonial::find($id);
        if (! $testimonial) {
            return $this->notFound();
        }

        return $this->success($testimonial->toApiObject());
    }

    public function store(Request $request): JsonResponse
    {
        $testimonial = Testimonial::create(Testimonial::payloadFromRequest($request->all()));

        return response()->json([
            'success' => true,
            'data' => $testimonial->fresh()->toApiObject(),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $testimonial = Testimonial::find($id);
        if (! $testimonial) {
            return $this->notFound();
        }

        $testimonial->fill(Testimonial::payloadFromRequest($request->all()));
        $testimonial->save();

        return $this->success($testimonial->fresh()->toApiObject());
    }

    public function destroy(string $id): JsonResponse
    {
        $deleted = Testimonial::destroy($id);

        return response()->json([
            'success' => true,
            'deleted' => $deleted > 0,
        ], $deleted > 0 ? 200 : 404);
    }

    public function bulkPatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);

        $patch = Testimonial::payloadFromRequest($request->except('ids'));
        $testimonials = Testimonial::whereIn('id', $validated['ids'])->get();

        foreach ($testimonials as $testimonial) {
            $testimonial->fill($patch);
            $testimonial->save();
        }

        return $this->success($testimonials->map->toApiObject()->values());
    }

    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);

        foreach ($validated['ids'] as $index => $id) {
            Testimonial::where('id', $id)->update(['sort_order' => $index + 1]);
        }

        $testimonials = Testimonial::whereIn('id', $validated['ids'])
            ->orderBy('sort_order')
            ->get();

        return $this->success($testimonials->map->toApiObject()->values());
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
