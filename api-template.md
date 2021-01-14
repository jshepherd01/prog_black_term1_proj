# <a name="uri-path"></a> METHOD `/uri/path`

A short description of the purpose of the request

## Query Type

`multipart/form-data`

## Query Parameters

Name | Type | Description | Default
--- | --- | --- | ---
`param_1` | string | A one-line description of the parameter |
`param_2` (optional) | string `"true"` or `"false"` | A one-line description of this parameter | `"false"`
`param_3` | blob of type image/* | A one-line description of this parameter |

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
`invalid` | array of string | Returned with a 400 response. A list of query parameters that were invalid

## Error Responses

Status Code | Name | Description
--- | --- | ---
400 | Not Valid | At least one required query parameter was missing, or a parameter had an invalid type or value
401 | Unauthorised | The request required a passcode, and one was not provided
403 | Forbidden | The passcode sent was invalid, or does not match the requested resource
404 | Not Found | The ID sent in this request does not match a resource
500 | Internal Server Error | Some other error occurred
