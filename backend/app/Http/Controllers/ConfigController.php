<?php

namespace App\Http\Controllers;

use App\Models\CareersPage;
use App\Models\Deal;
use App\Models\HeroConfig;
use App\Models\TestimonialPage;
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
            $config->syncSlidesRelation($request->input('slides'));
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

    public function showCareersPage(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => CareersPage::singleton()->toConfigObject(),
        ]);
    }

    public function updateCareersPage(Request $request): JsonResponse
    {
        $page = CareersPage::singleton();
        $this->applyPageSections($page, CareersPage::SECTIONS, $request);

        return response()->json([
            'success' => true,
            'data' => $page->fresh()->toConfigObject(),
        ]);
    }

    public function showTestimonialsPage(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => TestimonialPage::singleton()->toConfigObject(),
        ]);
    }

    public function updateTestimonialsPage(Request $request): JsonResponse
    {
        $page = TestimonialPage::singleton();
        $this->applyPageSections($page, TestimonialPage::SECTIONS, $request);

        return response()->json([
            'success' => true,
            'data' => $page->fresh()->toConfigObject(),
        ]);
    }

    private function applyPageSections($page, array $sections, Request $request): void
    {
        if ($request->has('enabled')) {
            $page->enabled = filter_var($request->input('enabled'), FILTER_VALIDATE_BOOLEAN);
        }

        foreach ($sections as $camel => $column) {
            if ($request->has($camel) && is_array($request->input($camel))) {
                $page->{$column} = $request->input($camel);
            }
        }

        $page->save();
    }
}
