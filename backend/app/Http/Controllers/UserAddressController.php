<?php

namespace App\Http\Controllers;

use App\Models\Address;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserAddressController extends Controller
{
    public function index($userId): JsonResponse
    {
        $user = User::find($userId);
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $user->addresses]);
    }

    public function store(Request $request, $userId): JsonResponse
    {
        $user = User::find($userId);
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        $data = $request->validate([
            'label' => 'nullable|string',
            'first_name' => 'nullable|string',
            'last_name' => 'nullable|string',
            'phone' => 'nullable|string',
            'address_line1' => 'nullable|string',
            'address_line2' => 'nullable|string',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'postal_code' => 'nullable|string',
            'country' => 'nullable|string',
            'is_default' => 'nullable|boolean',
        ]);

        $data['user_id'] = $user->id;

        $address = Address::create($data);

        return response()->json(['success' => true, 'data' => $address], 201);
    }

    public function show($userId, $id): JsonResponse
    {
        $address = Address::where('user_id', $userId)->where('id', $id)->first();
        if (! $address) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $address]);
    }

    public function update(Request $request, $userId, $id): JsonResponse
    {
        $address = Address::where('user_id', $userId)->where('id', $id)->first();
        if (! $address) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        $data = $request->validate([
            'label' => 'nullable|string',
            'first_name' => 'nullable|string',
            'last_name' => 'nullable|string',
            'phone' => 'nullable|string',
            'address_line1' => 'nullable|string',
            'address_line2' => 'nullable|string',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'postal_code' => 'nullable|string',
            'country' => 'nullable|string',
            'is_default' => 'nullable|boolean',
        ]);

        $address->fill($data);
        $address->save();

        return response()->json(['success' => true, 'data' => $address]);
    }

    public function destroy($userId, $id): JsonResponse
    {
        $deleted = Address::where('user_id', $userId)->where('id', $id)->delete();
        return response()->json(['success' => true, 'deleted' => $deleted > 0]);
    }
}
