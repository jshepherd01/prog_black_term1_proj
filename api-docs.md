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

# <a name="image-get"></a> GET `/image/get`

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
    "title": "A title",
    "priv": true,
    "author": "Authy McAuthorface",
    "copyright": "A long, long string containing:\nCopyright Info",
    "nsfw": false,
    "timestamp": 1610619915325
}
```

## Response Fields

Name | Type | Description
--- | --- | ---
`status` | integer | The status code returned from the request. Returned with any request status, except possibly 500.
`title` | string | The title of the image
`priv` | boolean | Whether the image requires a `view-pass` to access
`author` | string | The name given as the creator of the image. Can be empty
`copyright` | string | The copyright information given for the image. Can be multiple lines. Can be empty
`nsfw` | boolean | Whether the image is marked as 'Not Safe For Work'
`timestamp` | integer | The timestamp in milliseconds that the image was posted or last updated, from JavaScript's `Date.now()`
`invalid` | array of string | Returned with a 400 request. A list of query parameters that were invalid

## Error Responses

Status Code | Name | Description
--- | --- | ---
400 | Not Valid | The required query parameter was missing, or a parameter had an invalid type or value
401 | Unauthorised | The request required a passcode, and one was not provided
403 | Forbidden | The passcode sent was invalid, or does not match the requested resource
404 | Not Found | The ID sent in this request does not match a resource
500 | Internal Server Error | Some other error occurred

# <a name="image-list"></a> GET `/image/list`

Gets information associated with all public images from the server.

## Query Parameters

Name | Type | Description
--- | --- | ---
`nsfw` (optional) | string | Whether to include NSFW results. If omitted, NSFW results are removed. If included, both NSFW and SFW results are returned. If set to `"true"`, only NSFW results are returned

## Example Response

```jsonc
{
    "status": 200,
    "images": [
        {
            "id": "03af5278-fb18-4aad-9dbf-5deebe40e5a3",
            "title": "A title",
            "author": "Authy McAuthorface",
            "copyright": "A possibly very long string containing:\nCopyright Info",
            "nsfw": false,
            "timestamp": 1610619915325
        },
        // ...
    ]
}
```

## Response Fields

Name | Type | Description
--- | --- | ---
`status` | integer | The status code returned from the request
`images` | list of object | A list of objects representing the images returned from the request
`images[i].id` | string | The Universally Unique ID of the ith image returned
`images[i].title` | string | The title of the image
`images[i].author` | string | The name given as the creator of the image. Can be empty
`images[i].copyright` | string | The copyright information given for the image. Can be multiple lines. Can be empty
`images[i].nsfw` | boolean | Whether the image is marked as 'Not Safe For Work'
`images[i].timestamp` | integer | The timestamp in milliseconds that the image was posted or last updated, from JavaScript's `Date.now()`
`invalid` | array of string | Returned with a 400 response. A list of query parameters that were invalid

## Error Responses

Status Code | Name | Description
--- | --- | ---
400 | Not Valid | The parameter had an invalid type or value
500 | Internal Server Error | Some other error occurred

# <a name="image-embed"></a> GET `/image/embed`

Gets an actual image file from the server, without metadata, such as could be embedded in a webpage.

## Query Parameters

Name | Type | Description
--- | --- | ---
`id` | string | The Universally Unique ID of the image
`view-pass` (optional) | string | The passcode for viewing the image (required if the image is private)

## Response type

`image/*` Depending on the mime type of the image as it was when uploaded. Error responses are `image/png`

## Error Responses

Status Code | Name | Description
--- | --- | ---
400 | Not Valid | The required query parameter was missing, or a parameter had an invalid type or value
401 | Unauthorised | The request required a passcode, and one was not provided
403 | Forbidden | The passcode sent was invalid, or does not match the requested resource
404 | Not Found | The ID sent in this request does not match a resource
500 | Internal Server Error | Some other error occurred

# <a name="image-upload"></a> POST `/image/upload`

Creates a new image record on the server, sets metadata of it, and uploads an image for it.

## Query Type

`multipart/form-data`

## Query Parameters

Name | Type | Description
--- | --- | ---
`title` | string | The title to give the image
`file` | image file | The image file to be uploaded
`edit-pass` | string | The passcode that will be needed to edit the image
`view-pass` (optional) | string | The passcode that will be needed to view the image. If missing or empty, the image will be made public
`nsfw` (optional) | string `"true"` or `"false"` | Whether to mark the image as Not Safe For Work. If missing, the image will not be marked
`author` (optional) | string | The name to be associated with the image as its author. Note that this can be any string, it does not need to be a real name
`copyright` (optional) | string | The copyright information to be associated with the image. Can be multiple lines

## Example Response

```json
{
    "status": 200,
    "id": "03af5278-fb18-4aad-9dbf-5deebe40e5a3"
}
```

## Response Fields

Name | Type | Description
--- | --- | ---
`status` | integer | The status code returned from the request
`id` | string | The Universally Unique ID that has been assigned to this image
`invalid` | array of string | Returned with a 400 response. A list of query parameters that were invalid

## Error Responses

Status Code | Name | Description
--- | --- | ---
400 | Not Valid | At least one required query parameter was missing, or a parameter had an invalid type or value
500 | Internal Server Error | Some other error occurred
