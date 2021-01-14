# API reference index

## Images
1. [GET /image/get](#image-get)
2. [GET /image/list](#image-list)
3. [GET /image/embed](#image-embed)
4. [POST /image/upload](#image-upload)
5. [POST /image/verify](#image-verify)
6. [POST /image/update](#image-update)
7. [POST /image/delete](#image-delete)

## Comments
1. [GET /comment/get](#comment-get)
2. [GET /comment/list](#comment-list)
3. [POST /comment/upload](#comment-upload)

# <a name="image-get"></a> GET /image/get

Gets all information associated with an image ID from the server.

## Query Parameters

Name | Type | Description
--- | --- | ---
`id` | string | The Universally Unique ID of the image
`view-pass` (optional) | string | The passcode for viewing the image (required if the image is private)

## Example Response

```json
{
    status: 200,
    title: 'A title',
    priv: true,
    author: 'Authy McAuthorface',
    copyright: 'A long, long string containing:\nCopyright Info',
    nsfw: false,
    timestamp: 1610619915325
}
```

## Response fields

Name | Type | Description
--- | --- | ---
`status` | integer | The status code returned from the request. Returned with any request status, except possibly 500.
`title` | string | The title of the image
`priv` | boolean | Whether the image requires a `view-pass` to access
`author` | string | The name given as the creator of the image
`copyright` | string | The copyright information given for the image
`nsfw` | boolean | Whether the image is marked as 'Not Safe For Work'
`timestamp` | integer | The timestamp in milliseconds that the image was posted or last updated, from JavaScript's `Date.now()`
`invalid` | array of string | Returned with a 400 request. A list of query parameters that were invalid
