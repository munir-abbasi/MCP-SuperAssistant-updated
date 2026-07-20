<?php

/**
 * @file plugins/generic/publishToFacebook/classes/FacebookService.php
 *
 * @class FacebookService
 *
 * @brief Service class for interacting with the Facebook Graph API.
 */

namespace APP\plugins\generic\publishToFacebook\classes;

class FacebookService
{
    private const API_VERSION = 'v22.0';
    private const API_BASE_URL = 'https://graph.facebook.com/';

    /**
     * Post a link to a Facebook Page's feed.
     *
     * @param string $pageId Facebook Page ID
     * @param string $accessToken Facebook Page Access Token
     * @param string $message The message text to publish
     * @param string $link The URL to share
     *
     * @return array ['success' => bool, 'postId' => ?string, 'error' => ?string, 'code' => ?int, 'uncertain' => bool]
     */
    public function postLink(
        string $pageId,
        string $accessToken,
        string $message,
        string $link
    ): array {
        $url = self::API_BASE_URL . self::API_VERSION . '/' . rawurlencode($pageId) . '/feed';

        $ch = curl_init();
        if ($ch === false) {
            return [
                'success' => false,
                'error' => 'Unable to initialize Facebook API request.',
                'code' => null,
                'postId' => null,
                'uncertain' => false,
            ];
        }

        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query([
                'access_token' => $accessToken,
                'message' => $message,
                'link' => $link,
            ]),
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $errno = curl_errno($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            return [
                'success' => false,
                'error' => $error,
                'code' => null,
                'postId' => null,
                'uncertain' => $this->isAmbiguousCurlError($errno),
            ];
        }

        $data = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return [
                'success' => false,
                'error' => 'Invalid response from Facebook API: ' . json_last_error_msg(),
                'code' => $httpCode,
                'postId' => null,
                'uncertain' => $httpCode >= 200 && $httpCode < 300,
            ];
        }

        if ($httpCode >= 200 && $httpCode < 300 && isset($data['id'])) {
            return [
                'success' => true,
                'postId' => $data['id'],
                'error' => null,
                'code' => null,
                'uncertain' => false,
            ];
        }

        if ($httpCode >= 200 && $httpCode < 300) {
            return [
                'success' => false,
                'error' => 'Facebook API returned a successful HTTP response without a post ID.',
                'code' => $httpCode,
                'postId' => null,
                'uncertain' => true,
            ];
        }

        return [
            'success' => false,
            'error' => $data['error']['message'] ?? 'Unknown API error',
            'code' => $data['error']['code'] ?? $httpCode,
            'postId' => null,
            'uncertain' => false,
        ];
    }

    private function isAmbiguousCurlError(int $errno): bool
    {
        return in_array($errno, [
            CURLE_OPERATION_TIMEDOUT,
            CURLE_SEND_ERROR,
            CURLE_RECV_ERROR,
            CURLE_GOT_NOTHING,
        ], true);
    }
}
