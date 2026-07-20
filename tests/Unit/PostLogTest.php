<?php

/**
 * @file tests/Unit/PostLogTest.php
 *
 * @class PostLogTest
 *
 * @brief Unit tests for the PostLog DataObject.
 *
 * PostLog extends PKP\core\DataObject and requires OJS bootstrap.
 * Run via phpunit.xml from the OJS root: php plugins/generic/publishToFacebook/vendor/bin/phpunit -c plugins/generic/publishToFacebook/phpunit.xml
 */

namespace APP\plugins\generic\publishToFacebook\tests\Unit;

use APP\plugins\generic\publishToFacebook\classes\PostLog;
use PHPUnit\Framework\TestCase;

class PostLogTest extends TestCase
{
    public function test_pending_constant(): void
    {
        $this->assertSame('pending', PostLog::STATUS_PENDING);
    }

    public function test_success_constant(): void
    {
        $this->assertSame('success', PostLog::STATUS_SUCCESS);
    }

    public function test_error_constant(): void
    {
        $this->assertSame('error', PostLog::STATUS_ERROR);
    }

    public function test_uncertain_constant(): void
    {
        $this->assertSame('uncertain', PostLog::STATUS_UNCERTAIN);
    }

    public function test_can_instantiate(): void
    {
        $log = app(PostLog::class);
        $this->assertInstanceOf(PostLog::class, $log);
    }

    public function test_default_status_is_null(): void
    {
        $log = app(PostLog::class);
        $this->assertNull($log->getData('status'));
    }

    public function test_can_set_and_get_status(): void
    {
        $log = app(PostLog::class);
        $log->setData('status', PostLog::STATUS_SUCCESS);
        $this->assertSame('success', $log->getData('status'));
    }

    public function test_can_set_and_get_submission_id(): void
    {
        $log = app(PostLog::class);
        $log->setData('submissionId', 42);
        $this->assertSame(42, $log->getData('submissionId'));
    }

    public function test_can_set_and_get_facebook_post_id(): void
    {
        $log = app(PostLog::class);
        $log->setData('facebookPostId', '123_456');
        $this->assertSame('123_456', $log->getData('facebookPostId'));
    }

    public function test_can_set_and_get_error_message(): void
    {
        $log = app(PostLog::class);
        $log->setData('errorMessage', 'Invalid token');
        $this->assertSame('Invalid token', $log->getData('errorMessage'));
    }

    public function test_can_set_and_get_date_posted(): void
    {
        $date = '2025-06-01 12:00:00';
        $log = app(PostLog::class);
        $log->setData('datePosted', $date);
        $this->assertSame($date, $log->getData('datePosted'));
    }
}
