<?php
namespace APP\plugins\generic\publishToFacebook\formRequests;
use APP\plugins\generic\publishToFacebook\classes\Constants;
use Illuminate\Foundation\Http\FormRequest;
class EditSettingsRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has(Constants::PAGE_ID)) {
            $this->merge([
                Constants::PAGE_ID => trim((string) $this->get(Constants::PAGE_ID)),
            ]);
        }
    }

    /**
     * Authorize: ensure a user is authenticated.
     * Additional role/permission checks are handled by the route middleware.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        return $user !== null;
    }
    public function rules(): array
    {
        return [
            Constants::PAGE_ID => 'required|string|regex:/^[0-9]{1,32}$/',
            Constants::ACCESS_TOKEN => 'nullable|string|max:2048',
            Constants::MESSAGE_FORMAT_ARTICLE => 'nullable|string|max:1000',
            Constants::AUTO_PUBLISH_ARTICLES => 'nullable|boolean',
        ];
    }
}
