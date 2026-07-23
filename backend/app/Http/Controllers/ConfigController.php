<?php

namespace App\Http\Controllers;

use App\Models\Deal;
use App\Models\HeroConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConfigController extends Controller
{
    public function showHero(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => HeroConfig::singleton()->toConfigObject(),
        ]);
    }

    public function updateHero(Request $request): JsonResponse
    {
        $config = HeroConfig::singleton();

        if ($request->has('enabled')) {
            $config->enabled = filter_var($request->input('enabled'), FILTER_VALIDATE_BOOLEAN);
        }
        if ($request->has('autoplayMs')) {
            $config->autoplay_ms = (int) $request->input('autoplayMs');
        }
        if ($request->has('autoplay_ms')) {
            $config->autoplay_ms = (int) $request->input('autoplay_ms');
        }
        if ($request->has('slides') && is_array($request->input('slides'))) {
            $config->slides = $request->input('slides');
        }

        $config->save();

        return response()->json([
            'success' => true,
            'data' => $config->fresh()->toConfigObject(),
        ]);
    }

    public function showDeals(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => Deal::singleton()->toConfigObject(),
        ]);
    }

    public function updateDeals(Request $request): JsonResponse
    {
        $config = Deal::singleton();

        if ($request->has('enabled')) {
            $config->enabled = filter_var($request->input('enabled'), FILTER_VALIDATE_BOOLEAN);
        }
        if ($request->has('headerCtaEnabled')) {
            $config->header_cta_enabled = filter_var($request->input('headerCtaEnabled'), FILTER_VALIDATE_BOOLEAN);
        }
        if ($request->has('header_cta_enabled')) {
            $config->header_cta_enabled = filter_var($request->input('header_cta_enabled'), FILTER_VALIDATE_BOOLEAN);
        }

        $config->save();

        return response()->json([
            'success' => true,
            'data' => $config->fresh()->toConfigObject(),
        ]);
    }
}
