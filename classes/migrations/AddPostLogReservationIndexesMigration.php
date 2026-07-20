<?php

namespace APP\plugins\generic\publishToFacebook\classes\migrations;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AddPostLogReservationIndexesMigration extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('publish_to_facebook_post_logs')) {
            return;
        }

        $this->assertNoDuplicateReservations('submission_id');

        if (Schema::hasColumn('publish_to_facebook_post_logs', 'issue_id')) {
            $this->assertNoDuplicateReservations('issue_id');
        }

        Schema::table('publish_to_facebook_post_logs', function (Blueprint $table) {
            $table->unique(['context_id', 'submission_id'], 'ptf_article_unique');
        });

        if (Schema::hasColumn('publish_to_facebook_post_logs', 'issue_id')) {
            Schema::table('publish_to_facebook_post_logs', function (Blueprint $table) {
                $table->unique(['context_id', 'issue_id'], 'ptf_issue_unique');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('publish_to_facebook_post_logs')) {
            return;
        }

        Schema::table('publish_to_facebook_post_logs', function (Blueprint $table) {
            $table->dropUnique('ptf_article_unique');
        });

        if (Schema::hasColumn('publish_to_facebook_post_logs', 'issue_id')) {
            Schema::table('publish_to_facebook_post_logs', function (Blueprint $table) {
                $table->dropUnique('ptf_issue_unique');
            });
        }
    }

    private function assertNoDuplicateReservations(string $entityColumn): void
    {
        $duplicate = DB::table('publish_to_facebook_post_logs')
            ->select('context_id', $entityColumn)
            ->whereNotNull($entityColumn)
            ->groupBy('context_id', $entityColumn)
            ->havingRaw('COUNT(*) > 1')
            ->first();

        if ($duplicate) {
            throw new \RuntimeException(sprintf(
                'Cannot add Publish to Facebook reservation index: duplicate rows exist for context_id=%s and %s=%s. Back up the database and reconcile duplicates before rerunning the upgrade.',
                (string) $duplicate->context_id,
                $entityColumn,
                (string) $duplicate->{$entityColumn}
            ));
        }
    }
}
