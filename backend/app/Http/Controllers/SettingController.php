<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => Setting::singleton()->toSettingsObject(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $settings = Setting::singleton();

        foreach (Setting::SECTIONS as $section) {
            if ($request->has($section) && is_array($request->input($section))) {
                $settings->{$section} = array_merge($settings->{$section} ?? [], $request->input($section));
            }
        }

        $settings->save();

        return response()->json([
            'success' => true,
            'data' => $settings->toSettingsObject(),
        ]);
    }

    public function updateSection(Request $request, string $section): JsonResponse
    {
        if (! in_array($section, Setting::SECTIONS, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Not found.',
            ], 404);
        }

        $settings = Setting::singleton();
        $settings->{$section} = array_merge($settings->{$section} ?? [], $request->all());
        $settings->save();

        return response()->json([
            'success' => true,
            'data' => $settings->toSettingsObject(),
        ]);
    }
}
