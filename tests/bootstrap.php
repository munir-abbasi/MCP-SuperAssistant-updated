<?php

/**
 * @file tests/bootstrap.php
 *
 * @brief PHPUnit test bootstrap for the Publish to Facebook plugin.
 *
 * To run tests, the OJS application must be installed and this plugin
 * must be present in plugins/generic/publishToFacebook/.
 *
 * Usage:
 *   cd /path/to/ojs
 *   php plugins/generic/publishToFacebook/vendor/bin/phpunit
 *     -c plugins/generic/publishToFacebook/phpunit.xml
 *
 * This bootstrap assumes OJS's autoloader is already configured.
 */

// Define required PKP constants if not already defined.
if (!defined('BASE_SYS_DIR')) {
    // When running from OJS root, constants are loaded by the framework.
    // For standalone analysis, skip.
}
