<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => Admin::query()->get()]);
    }

    public function show(string $id): JsonResponse
    {
        $admin = Admin::find($id);

        if (! $admin) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        return response()->json(['success' => true, 'data' => $admin]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => 'nullable|string',
            'last_name' => 'nullable|string',
            'email' => 'required|email|unique:admins,email',
            'password' => 'required|string|min:6',
            'role' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $data['password'] = Hash::make($data['password']);

        $admin = Admin::create($data);

        return response()->json(['success' => true, 'data' => $admin], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $admin = Admin::find($id);

        if (! $admin) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $data = $request->validate([
            'first_name' => 'nullable|string',
            'last_name' => 'nullable|string',
            'email' => 'nullable|email|unique:admins,email,' . $admin->id,
            'password' => 'nullable|string|min:6',
            'role' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $admin->fill($data);
        $admin->save();

        return response()->json(['success' => true, 'data' => $admin]);
    }

    public function destroy(string $id): JsonResponse
    {
        $deleted = Admin::destroy($id);

        return response()->json(['success' => true, 'deleted' => $deleted > 0]);
    }
}
