<?php

/**
 * @file tests/Unit/ConstantsTest.php
 *
 * @class ConstantsTest
 *
 * @brief Unit tests for the Constants class.
 *
 * The Constants class is self-contained with no OJS dependencies,
 * making it ideal for standalone unit testing.
 */

namespace APP\plugins\generic\publishToFacebook\tests\Unit;

use APP\plugins\generic\publishToFacebook\classes\Constants;
use PHPUnit\Framework\TestCase;

class ConstantsTest extends TestCase
{
    public function test_page_id_constant(): void
    {
        $this->assertSame('pageId', Constants::PAGE_ID);
    }

    public function test_access_token_constant(): void
    {
        $this->assertSame('accessToken', Constants::ACCESS_TOKEN);
    }

    public function test_message_format_article_constant(): void
    {
        $this->assertSame('messageFormatArticle', Constants::MESSAGE_FORMAT_ARTICLE);
    }

    public function test_message_format_issue_constant(): void
    {
        $this->assertSame('messageFormatIssue', Constants::MESSAGE_FORMAT_ISSUE);
    }

    public function test_auto_publish_articles_constant(): void
    {
        $this->assertSame('autoPublishArticles', Constants::AUTO_PUBLISH_ARTICLES);
    }

    public function test_auto_publish_issues_constant(): void
    {
        $this->assertSame('autoPublishIssues', Constants::AUTO_PUBLISH_ISSUES);
    }

    public function test_class_is_final(): void
    {
        $reflection = new \ReflectionClass(Constants::class);
        $this->assertTrue($reflection->isFinal());
    }

    public function test_all_constants_are_strings(): void
    {
        $reflection = new \ReflectionClass(Constants::class);
        foreach ($reflection->getReflectionConstants() as $constant) {
            $this->assertIsString($constant->getValue());
        }
    }
}
