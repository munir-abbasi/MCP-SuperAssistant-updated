<?php

/**
 * @file tests/Integration/PostLogDAOTest.php
 *
 * @class PostLogDAOTest
 *
 * @brief Integration tests for PostLogDAO against a test database.
 *
 * These tests require:
 * 1. OJS installed with a test database configured
 * 2. Plugin migration has been run to create publish_to_facebook_post_logs
 * 3. PKP application bootstrap loaded
 *
 * Run from OJS root:
 *   php plugins/generic/publishToFacebook/vendor/bin/phpunit
 *     -c plugins/generic/publishToFacebook/phpunit.xml
 *     --filter PostLogDAOTest
 *
 * @todo Implement with OJS test helpers once available:
 *       - Set up test context
 *       - Run migration in setUp()
 *       - Test insert() returns valid ID
 *       - Test hasExistingPost() with and without submission_id
 *       - Test getBySubmissionAndContext() returns correct ordering
 */

namespace APP\plugins\generic\publishToFacebook\tests\Integration;

use PHPUnit\Framework\TestCase;

class PostLogDAOTest extends TestCase
{
    /**
     * Placeholder: teaches the testing pattern.
     * Implement once OJS test environment is configured.
     */
    public function test_dao_requires_ojs_bootstrap(): void
    {
        $this->markTestSkipped(
            'Requires OJS bootstrap with test database. '
            . 'See test docblock for setup instructions.'
        );
    }
}
