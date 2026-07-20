<?php

/**
 * @file plugins/generic/publishToFacebook/classes/PostLogDAO.php
 *
 * @class PostLogDAO
 *
 * @brief EntityDAO for the post_log entity using the OJS 3.5 schema service.
 */

namespace APP\plugins\generic\publishToFacebook\classes;

use APP\plugins\generic\publishToFacebook\classes\PostLog;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use PKP\core\EntityDAO;
use PKP\services\PKPSchemaService;

class PostLogDAO extends EntityDAO
{
    /** @copydoc EntityDAO::$schema */
    public $schema = 'postLog';

    /** @copydoc EntityDAO::$table */
    public $table = 'publish_to_facebook_post_logs';

    /** @copydoc EntityDAO::$primaryKeyColumn */
    public $primaryKeyColumn = 'post_log_id';

    /** @copydoc EntityDAO::$primaryTableColumns */
    public $primaryTableColumns = [
        'id' => 'post_log_id',
        'submissionId' => 'submission_id',
        'issueId' => 'issue_id',
        'contextId' => 'context_id',
        'status' => 'status',
        'facebookPostId' => 'facebook_post_id',
        'message' => 'message',
        'errorMessage' => 'error_message',
        'link' => 'link',
        'datePosted' => 'date_posted',
    ];

    public function __construct(PKPSchemaService $schemaService)
    {
        parent::__construct($schemaService);
    }

    /**
     * @copydoc EntityDAO::newDataObject()
     */
    public function newDataObject(): PostLog
    {
        return app(PostLog::class);
    }

    /**
     * Insert a new post log entry.
     */
    public function insert(PostLog $postLog): int
    {
        return $this->_insert($postLog);
    }

    public function reserveArticlePost(int $submissionId, int $contextId, string $message, string $link): ?int
    {
        $postLog = new PostLog();
        $postLog->setData('submissionId', $submissionId);
        $postLog->setData('issueId', null);
        $postLog->setData('contextId', $contextId);
        $postLog->setData('status', PostLog::STATUS_PENDING);
        $postLog->setData('message', $message);
        $postLog->setData('link', $link);
        $postLog->setData('datePosted', Carbon::now()->format('Y-m-d H:i:s'));

        return $this->insertReservation($postLog);
    }

    public function reserveIssuePost(int $issueId, int $contextId, string $message, string $link): ?int
    {
        $postLog = new PostLog();
        $postLog->setData('submissionId', null);
        $postLog->setData('issueId', $issueId);
        $postLog->setData('contextId', $contextId);
        $postLog->setData('status', PostLog::STATUS_PENDING);
        $postLog->setData('message', $message);
        $postLog->setData('link', $link);
        $postLog->setData('datePosted', Carbon::now()->format('Y-m-d H:i:s'));

        return $this->insertReservation($postLog);
    }

    public function markReservationComplete(int $postLogId, array $result): void
    {
        $status = PostLog::STATUS_ERROR;
        if (!empty($result['success'])) {
            $status = PostLog::STATUS_SUCCESS;
        } elseif (!empty($result['uncertain'])) {
            $status = PostLog::STATUS_UNCERTAIN;
        }

        DB::table($this->table)
            ->where($this->primaryKeyColumn, $postLogId)
            ->update([
                'status' => $status,
                'facebook_post_id' => !empty($result['success']) ? ($result['postId'] ?? null) : null,
                'error_message' => !empty($result['success']) ? null : self::sanitizeErrorMessage($result['error'] ?? 'Unknown API error'),
            ]);
    }

    public function markReservationFailed(int $postLogId, \Throwable $exception): void
    {
        DB::table($this->table)
            ->where($this->primaryKeyColumn, $postLogId)
            ->update([
                'status' => PostLog::STATUS_ERROR,
                'error_message' => self::sanitizeErrorMessage($exception->getMessage()),
            ]);
    }

    public static function sanitizeErrorMessage(?string $message): string
    {
        $message = (string) ($message ?? 'Unknown error');
        $message = preg_replace('/(access_token=)[^&\s]+/i', '$1[redacted]', $message) ?? $message;
        $message = preg_replace('/(access_token["\'\s:=]+)[^&\s"\']+/i', '$1[redacted]', $message) ?? $message;
        $message = preg_replace('/(Authorization:\s*Bearer\s+)[^\s]+/i', '$1[redacted]', $message) ?? $message;
        $message = preg_replace('/\b[A-Za-z0-9_\-]{80,}\b/', '[redacted]', $message) ?? $message;

        return substr($message, 0, 1000);
    }

    private function insertReservation(PostLog $postLog): ?int
    {
        try {
            return $this->insert($postLog);
        } catch (QueryException $exception) {
            if ($this->isUniqueConstraintViolation($exception)) {
                return null;
            }

            throw $exception;
        }
    }

    private function isUniqueConstraintViolation(QueryException $exception): bool
    {
        $sqlState = (string) $exception->getCode();
        $driverCode = isset($exception->errorInfo[1]) ? (string) $exception->errorInfo[1] : '';

        return in_array($sqlState, ['23000', '23505'], true)
            || in_array($driverCode, ['1062', '23505'], true);
    }

    /**
     * Check if a submission has already been successfully posted.
     *
     * @return bool True if a successful post log exists for this submission+context.
     */
    public function hasExistingPost(int $submissionId, int $contextId): bool
    {
        return DB::table($this->table)
            ->where('context_id', $contextId)
            ->where('status', PostLog::STATUS_SUCCESS)
            ->where('submission_id', $submissionId)
            ->exists();
    }

    /**
     * Check if an issue has already been successfully posted.
     */
    public function hasExistingIssuePost(int $issueId, int $contextId): bool
    {
        return DB::table($this->table)
            ->where('context_id', $contextId)
            ->where('status', PostLog::STATUS_SUCCESS)
            ->where('issue_id', $issueId)
            ->exists();
    }

    /**
     * Get the most recent post log for a submission in a context.
     *
     * @return PostLog|null
     */
    public function getBySubmissionAndContext(int $submissionId, int $contextId): ?PostLog
    {
        $row = DB::table($this->table)
            ->where('submission_id', $submissionId)
            ->where('context_id', $contextId)
            ->orderBy('date_posted', 'desc')
            ->first();

        if (!$row) {
            return null;
        }

        return $this->fromRow($row);
    }


}
