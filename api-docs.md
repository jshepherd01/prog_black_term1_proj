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
    "status": 200,
    "return_1": "blah blah blah"
}
```

## Response fields

Name | Type | Description
--- | --- | ---
`status` | integer | The status code returned from the request
`return_1` | string | A one-line description of this field
`invalid` | array of string | Returned with a 400 request. A list of query parameters that were invalid
