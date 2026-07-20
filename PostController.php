<?php

/**
 * @file plugins/generic/publishToFacebook/PostController.php
 *
 * @class PostController
 *
 * @brief OJS 3.5 API controller for manually posting articles to Facebook.
 */

namespace APP\plugins\generic\publishToFacebook;

use APP\plugins\generic\publishToFacebook\classes\Constants;
use APP\plugins\generic\publishToFacebook\classes\FacebookService;
use APP\plugins\generic\publishToFacebook\classes\PostLogDAO;
use APP\plugins\generic\publishToFacebook\classes\PublicationPostBuilder;
use APP\facades\Repo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use PKP\core\PKPBaseController;
use PKP\plugins\Plugin;
use PKP\security\Role;

class PostController extends PKPBaseController
{
    protected Plugin $plugin;

    public function __construct(Plugin $plugin)
    {
        parent::__construct();
        $this->plugin = $plugin;
    }

    /**
     * URL path segment for API routing.
     */
    public function getHandlerPath(): string
    {
        return 'publishToFacebookPost';
    }

    /**
     * Middleware for the route group.
     */
    public function getRouteGroupMiddleware(): array
    {
        return [
            'has.user',
            'has.context',
            self::roleAuthorizer([Role::ROLE_ID_MANAGER, Role::ROLE_ID_SITE_ADMIN]),
        ];
    }

    /**
     * Register routes: POST for submit, GET for history.
     */
    public function getGroupRoutes(): void
    {
        Route::post('', $this->submit(...))->name('plugin.publishToFacebook.post.submit');
        Route::get('history/{submissionId}', $this->history(...))
            ->where('submissionId', '[0-9]+')
            ->name('plugin.publishToFacebook.post.history');
    }

    /**
     * Whether this controller is site-wide.
     */
    public function isSiteWide(): bool
    {
        return $this->plugin->isSitePlugin();
    }

    /**
     * POST handler — validates the request and posts the article to Facebook.
     *
     * Expects JSON body: { "submissionId": <int> }
     */
    public function submit(Request $request): JsonResponse
    {
        $context = $request->getContext();
        $contextId = $context->getId();

        $submissionId = filter_var($request->input('submissionId'), FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1],
        ]);
        if ($submissionId === false) {
            return response()->json([
                'success' => false,
                'error' => __('plugins.generic.publishToFacebook.post.error.noSubmissionId'),
            ], 400);
        }

        // Load the submission via current repo API
        $submission = Repo::submission()->get($submissionId);
        if (!$submission || $submission->getData('contextId') !== $contextId) {
            return response()->json([
                'success' => false,
                'error' => __('plugins.generic.publishToFacebook.post.error.notFound'),
            ], 404);
        }

        // Verify submission is published
        $publication = $submission->getCurrentPublication();
        if (!$publication || !$publication->getData('datePublished')) {
            return response()->json([
                'success' => false,
                'error' => __('plugins.generic.publishToFacebook.post.error.notPublished'),
            ], 400);
        }

        // Check for duplicate posting
        $postLogDAO = app(PostLogDAO::class);
        if ($postLogDAO->hasExistingPost($submissionId, $contextId)) {
            return response()->json([
                'success' => false,
                'error' => __('plugins.generic.publishToFacebook.post.alreadyPosted'),
            ], 409);
        }

        // Get configured settings
        $pageId = $this->plugin->getSetting($contextId, Constants::PAGE_ID);
        $accessToken = $this->plugin->getSetting($contextId, Constants::ACCESS_TOKEN);
        $messageFormat = $this->plugin->getSetting($contextId, Constants::MESSAGE_FORMAT_ARTICLE);

        if (empty($pageId) || empty($accessToken)) {
            return response()->json([
                'success' => false,
                'error' => __('plugins.generic.publishToFacebook.post.error.notConfigured'),
            ], 400);
        }

        // Build the message from the configured format
        $builder = new PublicationPostBuilder($submission, $context, $messageFormat ?: '');
        $message = $builder->buildMessage();
        $articleUrl = $builder->getArticleUrl();

        $postLogId = $postLogDAO->reserveArticlePost($submissionId, $contextId, $message, $articleUrl);
        if ($postLogId === null) {
            return response()->json([
                'success' => false,
                'error' => __('plugins.generic.publishToFacebook.post.alreadyPosted'),
            ], 409);
        }

        try {
            // Post to Facebook
            $service = new FacebookService();
            $result = $service->postLink($pageId, $accessToken, $message, $articleUrl);
        } catch (\Throwable $exception) {
            $postLogDAO->markReservationFailed($postLogId, $exception);

            return response()->json([
                'success' => false,
                'error' => PostLogDAO::sanitizeErrorMessage($exception->getMessage()),
            ], 500);
        }

        $postLogDAO->markReservationComplete($postLogId, $result);

        if (!empty($result['success'])) {
            return response()->json([
                'success' => true,
                'postId' => $result['postId'] ?? null,
                'message' => __('plugins.generic.publishToFacebook.post.success'),
            ]);
        }

        return response()->json([
            'success' => false,
            'error' => PostLogDAO::sanitizeErrorMessage($result['error'] ?? 'Unknown API error'),
            'code' => $result['code'] ?? null,
            'uncertain' => !empty($result['uncertain']),
        ], !empty($result['uncertain']) ? 202 : 500);
    }

    /**
     * GET handler — returns the latest post log for a submission.
     *
     * URL: /publishToFacebookPost/history/{submissionId}
     */
    public function history(Request $request, int $submissionId): JsonResponse
    {
        $contextId = $request->getContext()->getId();

        $postLogDAO = app(PostLogDAO::class);
        $log = $postLogDAO->getBySubmissionAndContext($submissionId, $contextId);

        if (!$log) {
            return response()->json(['exists' => false]);
        }

        return response()->json([
            'exists' => true,
            'status' => $log->getData('status'),
            'facebookPostId' => $log->getData('facebookPostId'),
            'errorMessage' => $log->getData('errorMessage'),
            'datePosted' => $log->getData('datePosted'),
        ]);
    }
}
