<?php

namespace App\Http\Controllers;

use App\Models\Enquiry;
use App\Models\EnquiryItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnquiryItemController extends Controller
{
    // GET /enquiries/{enquiry}/items
    public function index($enquiryId): JsonResponse
    {
        $enquiry = Enquiry::find($enquiryId);
        if (! $enquiry) {
            return response()->json(['success' => false, 'message' => 'Enquiry not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $enquiry->itemsRelation()->get()]);
    }

    // POST /enquiries/{enquiry}/items
    public function store(Request $request, $enquiryId): JsonResponse
    {
        $enquiry = Enquiry::find($enquiryId);
        if (! $enquiry) {
            return response()->json(['success' => false, 'message' => 'Enquiry not found'], 404);
        }

        $data = $request->validate([
            'product_id' => 'nullable|integer',
            'name' => 'nullable|string',
            'quantity' => 'nullable|integer|min:1',
            'price' => 'nullable|numeric',
            'meta' => 'nullable|array',
        ]);

        $data['enquiry_id'] = $enquiry->id;

        $item = EnquiryItem::create($data);

        return response()->json(['success' => true, 'data' => $item], 201);
    }

    // GET /enquiry_items/{id}
    public function show($id): JsonResponse
    {
        $item = EnquiryItem::find($id);
        if (! $item) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $item]);
    }

    // PUT/PATCH /enquiry_items/{id}
    public function update(Request $request, $id): JsonResponse
    {
        $item = EnquiryItem::find($id);
        if (! $item) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        $data = $request->validate([
            'product_id' => 'nullable|integer',
            'name' => 'nullable|string',
            'quantity' => 'nullable|integer|min:1',
            'price' => 'nullable|numeric',
            'meta' => 'nullable|array',
        ]);

        $item->fill($data);
        $item->save();

        return response()->json(['success' => true, 'data' => $item]);
    }

    // DELETE /enquiry_items/{id}
    public function destroy($id): JsonResponse
    {
        $deleted = EnquiryItem::destroy($id);
        return response()->json(['success' => true, 'deleted' => $deleted > 0]);
    }
}
