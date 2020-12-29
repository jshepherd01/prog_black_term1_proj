/*
    === error definitions ===
*/

class ServerError extends Error {
    /* for when the server returns any 4XX or 5XX code */
    constructor(message, status, details) {
        super(message);
        this.name = 'ServerError';
        this.status = status;
        this.details = details;
    }
}

class ConnectionError extends Error {
    /* for when the server doesn't return anything (connection times out) */
    constructor(message) {
        super(message);
        this.name = 'ConnectionError';
    }
}

/*
    === globals ===
*/

let currentImage = {};

/*
    === functions ===
*/

const genPass = () => {
    /* generate a cryptographically random passcode */

    let buf = new Uint8Array(18); // get 18 random numerical values
    window.crypto.getRandomValues(buf);
    return btoa(String.fromCharCode.apply(null,buf)); // convert the values to base64 ([a-zA-Z0-9+/])
};

/*
    === subroutines ===
*/

/* no operation - to differentiate 'nothing' from 'not written yet' */
const nop = ()=>{};

/* form actions */
const hideForm = (formName, hide=true) => {
    /* hides (default) or shows a form */

    const func = hide ? 'add' : 'remove';
    document.getElementById('frm-'+formName).classList[func]('hide');
    document.getElementById('drop-'+formName).classList[func]('hide');
};

const closeForm = (formName, close=true) => {
    /* closes (default) or opens a form */

    const func = close ? 'remove' : 'add';
    document.getElementById('frm-'+formName).classList[func]('drop-frm-open');
    document.getElementById('drop-'+formName).classList[func]('drop-btn-open');
};

const resetForm = (formName) => {
    /* resets a form to its default values, and closes it */

    const form = document.getElementById('frm-'+formName);
    const inputEvent = new Event('input');
    const changeEvent = new Event('change');
    form.reset();

    /* trigger the form's custom field population, if it has any */
    form.dispatchEvent(new Event('customReset'));

    for (let element of form.elements) {
        element.dispatchEvent(inputEvent);
        element.dispatchEvent(changeEvent);
    }
    closeForm(formName);
};

/* field actions */
const populateField = (fieldId, newVal) => {
    /* sets a fields value and triggers its input and change events */

    const field = document.getElementById(fieldId);
    field.value = newVal;
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('change'));
};

const copyField = (fieldId) => {
    /* copies the contents of a field to the clipboard */

    const field = document.getElementById(fieldId);
    if (field.tagName === 'INPUT') {
        if (field.value === '') field.value = field.placeholder; // copy placeholder if no value
        field.select(); // only works on <input>s
        field.setSelectionRange(0,999); // mobile compatibility
        document.execCommand('copy');
        if (field.value === field.placeholder) field.value = '';
    } else {
        let range = document.createRange();
        range.selectNode(field);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
    }
};

const changeButtonStatus = (buttonId, color, msg, disable) => {
    /* changes the state of a submit button (which is actually an <input> but who's counting) */

    const button = document.getElementById(buttonId);
    if (!button.classList.contains(color)) {
        button.classList.remove('btn-grn', 'btn-amb', 'btn-red');
        button.classList.add(color);
    }
    button.value = msg;
    button.disabled = disable;
};

/* error handling (and some other stuff) */
const displayPopup = (popupId, cb) => {
    /* displays the specified modal, executes cb with a return value when it closes */
    
    const modal = document.getElementById(popupId);
    let buttonList = Array.from(
        document.getElementsByClassName(modal.getAttribute('data-buttonclass'))
    );
    let handler = event => {
        /* when a button is clicked, hide the modal, remove all button handlers, callback */
        let trigger = event.currentTarget;
        modal.classList.add('hide');
        buttonList.forEach((i) => {i.removeEventListener('click', handler)});
        cb(null, trigger.getAttribute('data-return'));
    };
    buttonList.forEach((i) => {i.addEventListener('click', handler)});
    modal.classList.remove('hide');
};

const markInvalid = (formName, inputs, cb) => {
    /* marks certain inputs of a form as invalid */

    /* error if any input isn't in the form */
    const elements = document.getElementById('frm-'+formName).elements;
    inputs.forEach((inputName) => {
        if (!(inputName in elements)) {
            throw new ReferenceError(`Input ${inputName} is not in the form`);
        }
    });

    if (inputs.length > 1) {
        inputs.forEach((inputName) => {
            let element = document.getElementById(`${formName}-${inputName}`);
            element.classList.add('invalid');
            let handler = (e) => {
                /* when each input is changed, remove its special styling and behaviour */
                element.removeEventListener('input', handler);
                element.classList.remove('invalid');

                /* once all inputs have been changed, callback */
                let index = inputs.indexOf(inputName);
                if (index > -1) inputs.splice(index, 1);
                if (inputs.length === 0) cb();
            };
            element.addEventListener('input', handler);
        });
    } else {
        let element = document.getElementById(`${formName}-${inputs[0]}`);
        element.classList.add('invalid');
        let handler = (e) => {
            /* only one problem input, so no need to check how many are left */
            element.removeEventListener('input', handler);
            element.classList.remove('invalid');
            cb();
        };
        element.addEventListener('input', handler);
    }
};

/* fetch actions */
const makeRequest = (url, params, cb, formName, buttonText, passName) => {
    fetch(url, params).catch(err => {
        throw new ConnectionError('The server did not respond.');
    }).then(resp => {
        if (resp.status === 500) {
            throw new ServerError('An unspecified error occurred.', 500, {});
        } else {
            return resp.json();
        }
    }).then (retdata => {
        if (retdata['status'] !== 200) { // catch other errors
            throw new ServerError('The server returned an error.', retdata['status'], retdata);
        }
        if (formName) changeButtonStatus(formName+'-submit','btn-grn',buttonText,false);
        cb(retdata);
    }).catch(err => {
        let displayError;
        let invalError;
        if (formName) {
            /* handlers for when the action has a form attached */
            displayError = (modalId, buttonMsg) => {
                /* by showing a popup */
                changeButtonStatus(formName+'-submit','btn-red',buttonMsg,true);
                displayPopup(modalId, (err, ret) => {
                    if (ret === 'retry') {
                        changeButtonStatus(formName+'-submit','btn-amb','Processing...',true);
                        makeRequest(url, params, cb, formName, buttonText, passName);
                    } else {
                        changeButtonStatus(formName+'-submit','btn-grn',buttonText,false);
                    }
                });
            };
            invalError = (invalid, buttonMsg) => {
                /* by making fields red */
                changeButtonStatus(formName+'-submit', 'btn-red', buttonMsg, true);
                markInvalid(formName, invalid, () => {
                    changeButtonStatus(formName+'-submit','btn-grn',buttonText, false);
                });
            };
        } else {
            /* handlers without a form attached */
            displayError = (modalId) => {
                displayPopup(modalId, (err, ret) => {
                    if (ret === 'retry') makeRequest(url, params, cb, formName, buttonText, passName);
                });
            };
            invalError = () => {throw new Error('No form')};
        }

        if (err.name === 'ConnectionError') {
            displayError('server-down', 'Connection Error');
        } else if (err.name === 'ServerError') {
            /* if the server returned an error code, check for common user errors */
            try {
                switch (err.status) {
                    case 400:
                        /* input(s) weren't valid */
                        invalError(err.details['invalid'], 'Validation Error');
                        break;
                    
                    case 401:
                    case 403:
                        /* passcode wasn't valid */
                        invalError([passName], 'Authentication Error');
                        break;
                    
                    case 404:
                        /* id wasn't found */
                        invalError(['id'], 'Not Found');
                        break;
                    
                    default:
                        displayError('server-error', 'Server Error');
                }
            } catch {
                displayError('server-error', 'Server Error');
            }
        } else {
            /* anything that hasn't already been handled gets a generic error message */
            displayError('server-error', 'Server Error');
        }
    });
};

/* image actions */
const getImage = (imageID, viewPass, cb, formName, buttonText, passName) => {
    /* get an image from the server, execute callback once it's there */

    let reqData = new URLSearchParams();
    reqData.append('id', imageID);
    viewPass === '' ? nop : reqData.append('view-pass', viewPass);

    let newImage = {
        'id': imageID,
        'view-pass': viewPass
    };

    makeRequest('/image/get?' + reqData.toString(), {method: 'GET'}, (resData) => {
        newImage['priv'] = resData['priv'];
        newImage['title'] = resData['title'];
        newImage['author'] = resData['author'];
        newImage['copyright'] = resData['copyright'];
        newImage['nsfw'] = resData['nsfw'];
        cb(null, newImage);
    }, formName, buttonText, passName);
};

const displayImage = () => {
    /* changes the image display to show the global currentImage */
    /* also resets the unlock and update forms, and the comments section */
    // TODO comments section

    resetForm('unlock');
    resetForm('update');
    hideForm('unlock', 'edit-pass' in currentImage); // hide 'unlock' if the image is unlocked
    hideForm('update', !('edit-pass' in currentImage)); // hide 'update' if the image is locked
    closeForm('update', false);

    const displayRow = document.getElementById('image-display-row');
    const displayImg = document.getElementById('display-image');
    let imageUrl = new URLSearchParams();

    displayRow.classList.remove('hide');
    /* don't scroll until the image is loaded */
    displayImg.addEventListener('load', () => displayRow.scrollIntoView(true));

    document.getElementById('display-title').innerText = currentImage['title'];

    imageUrl.append('id',currentImage['id']);
    if (currentImage['priv']) {
        /* for a private image, display a padlock and use a view pass */
        document.getElementById('display-priv').classList.remove('hide');
        imageUrl.append('view-pass',currentImage['view-pass']);
    } else {
        document.getElementById('display-priv').classList.add('hide');
    }

    displayImg.setAttribute('src', '/image/embed?'+imageUrl.toString());
    const location = window.location;
    document.getElementById('display-permalink').value =
        `${location.protocol}//${location.hostname}:${location.port}/image/embed?${imageUrl.toString()}`;

    const authorDisplay = document.getElementById('display-author');
    authorDisplay.classList[
        currentImage['author'] === '' ? 'add' : 'remove'
    ]('hide');
    authorDisplay.firstElementChild.innerText = currentImage['author'];

    document.getElementById('display-copyright').classList[
        currentImage['copyright'] === '' ? 'add' : 'remove'
    ]('hide');
    document.getElementById('info-copyright-text').innerText = currentImage['copyright'];
};

const unloadImage = () => {
    /* removes the image display and the current image */

    currentImage = {};
    resetForm('unlock');
    resetForm('update');
    document.getElementById('image-display-row').classList.add('hide');
    document.getElementById('display-image').setAttribute('src','data:,');
};

/*
    === event handlers ===
*/

/* clicks */
const dropClick = (e, formName) => {
    /* handles clicks on form header buttons to open or close the form */

    closeForm(formName, e.currentTarget.classList.contains('drop-btn-open'));
};

const transferClick = (e, elemId) => {
    /* handles clicks on elements that should act like clicks on other elements */

    document.getElementById(elemId).dispatchEvent(new MouseEvent('click'));
};

/* file inputs */
const fileChange = (e, prevId) => {
    /* handles change events on file inputs to display the file's name */

    const fileArray = e.currentTarget.files;
    document.getElementById(prevId).innerText = fileArray.length === 0 ? '' : fileArray[0].name;
};

/* checkboxes */
const checkboxChangeMsg = (e, msgboxId, msgT, msgF) => {
    /* handles change events on a checkbox that is tied to a message box */

    document.getElementById(msgboxId).innerText = e.currentTarget.checked ? msgT : msgF;
};

const checkboxChangeClps = (e, clpsId) => {
    /* handles change events on a checkbox that is tied to a collapsible */

    document.getElementById(clpsId).classList[
        e.currentTarget.checked ? 'remove' : 'add'
    ]('hide');
};

/*
    === element references ===
*/

/* upload form */
const frmUpload = document.getElementById('frm-upload');

/* update form */
const frmUpdate = document.getElementById('frm-update');

/*
    === attach event handlers ===
*/

/* upload form */
document.getElementById('drop-upload').addEventListener('click', (e) => dropClick(e, 'upload'));
document.getElementById('upload-info').addEventListener('click', (e) => displayPopup('info-upload', nop));
document.getElementById('upload-file-btn').addEventListener('click', (e) => transferClick(e, 'upload-file'));
document.getElementById('upload-file').addEventListener('change', (e) => fileChange(e, 'upload-file-name'));
document.getElementById('upload-priv-tog').addEventListener('click', (e) => transferClick(e, 'upload-priv'));
document.getElementById('upload-priv').addEventListener('change', (e) => {
    checkboxChangeMsg(e, 'upload-priv-msg', 'check', 'close');
    checkboxChangeClps(e, 'upload-view-pass-container');
});
document.getElementById('upload-edit-pass-refresh').addEventListener('click', (e) => populateField('upload-edit-pass', genPass()));
document.getElementById('upload-edit-pass').addEventListener('click', (e) => transferClick(e, 'upload-edit-pass-copy'));
document.getElementById('upload-edit-pass-copy').addEventListener('click', (e) => copyField('upload-edit-pass'));
document.getElementById('upload-view-pass-refresh').addEventListener('click', (e) => populateField('upload-view-pass', genPass()));
document.getElementById('upload-view-pass').addEventListener('click', (e) => transferClick(e, 'upload-view-pass-copy'));
document.getElementById('upload-view-pass-copy').addEventListener('click', (e) => copyField('upload-view-pass'));
document.getElementById('clps-btn-upload').addEventListener('change', (e) => {
    checkboxChangeMsg(e, 'clps-upload-msg', 'Show Fewer Options', 'Show More Options');
    checkboxChangeClps(e, 'clps-frm-upload');
});
document.getElementById('upload-nsfw-tog').addEventListener('click', (e) => transferClick(e, 'upload-nsfw'));
document.getElementById('upload-nsfw').addEventListener('change', (e) => checkboxChangeMsg(e, 'upload-nsfw-msg', 'check', 'close'));

/* successful upload modal */
document.getElementById('success-upload-id').addEventListener('click', (e) => transferClick(e, 'success-upload-id-copy'));
document.getElementById('success-upload-edit-pass').addEventListener('click', (e) => transferClick(e, 'success-upload-edit-copy'));
document.getElementById('success-upload-view-pass').addEventListener('click', (e) => transferClick(e, 'success-upload-view-copy'));
document.getElementById('success-upload-id-copy').addEventListener('click', (e) => copyField('success-upload-id'));
document.getElementById('success-upload-edit-copy').addEventListener('click', (e) => copyField('success-upload-edit-pass'));
document.getElementById('success-upload-view-copy').addEventListener('click', (e) => copyField('success-upload-view-pass'));

/* view form */
document.getElementById('drop-view').addEventListener('click', (e) => dropClick(e, 'view'));
document.getElementById('view-info').addEventListener('click', (e) => displayPopup('info-view', nop));

/* image display */
document.getElementById('display-permalink').addEventListener('click', (e) => transferClick(e, 'display-permalink-copy'));
document.getElementById('display-permalink-copy').addEventListener('click', (e) => copyField('display-permalink'));
document.getElementById('copyright-info').addEventListener('click', (e) => displayPopup('info-copyright', nop));

/* unlock form */
document.getElementById('drop-unlock').addEventListener('click', (e) => dropClick(e, 'unlock'));
document.getElementById('unlock-info').addEventListener('click', (e) => displayPopup('info-unlock', nop));

/* update form */
document.getElementById('drop-update').addEventListener('click', (e) => dropClick(e, 'update'));
document.getElementById('update-info').addEventListener('click', (e) => displayPopup('info-update', nop));
document.getElementById('update-file-btn').addEventListener('click', (e) => transferClick(e, 'update-file'));
document.getElementById('update-file').addEventListener('change', (e) => fileChange(e, 'update-file-name'));
document.getElementById('update-file-clear').addEventListener('click', (e) => populateField('update-file', ''));
document.getElementById('update-priv-tog').addEventListener('click', (e) => transferClick(e, 'update-priv'));
document.getElementById('update-priv').addEventListener('change', (e) => {
    checkboxChangeMsg(e, 'update-priv-msg', 'check', 'close');
    checkboxChangeClps(e, 'update-view-pass-container');
});
document.getElementById('update-view-pass-refresh').addEventListener('click', (e) => populateField('update-view-pass', genPass()));
document.getElementById('update-view-pass').addEventListener('click', (e) => transferClick(e, 'update-view-pass-copy'));
document.getElementById('update-view-pass-copy').addEventListener('click', (e) => copyField('update-view-pass'));
document.getElementById('update-view-pass-clear').addEventListener('click', (e) => populateField('update-view-pass', ''));
document.getElementById('clps-btn-update').addEventListener('change', (e) => {
    checkboxChangeMsg(e, 'clps-update-msg', 'Show Fewer Options', 'Show More Options');
    checkboxChangeClps(e, 'clps-frm-update');
});
document.getElementById('update-nsfw-tog').addEventListener('click', (e) => transferClick(e, 'update-nsfw'));
document.getElementById('update-nsfw').addEventListener('change', (e) => checkboxChangeMsg(e, 'update-nsfw-msg', 'check', 'close'));

/* comment form */
document.getElementById('drop-comment').addEventListener('click', (e) => dropClick(e, 'comment'));

/*
    === unique handlers ===
*/

/* customReset event */
frmUpload.addEventListener('customReset', (e) => {
    /* populate password fields */

    populateField('upload-edit-pass', genPass());
    populateField('upload-view-pass', genPass());
});

frmUpdate.addEventListener('customReset', (e) => {
    /* populate fields from currentImage */

    const elements = e.currentTarget.elements;
    elements['title'].placeholder = currentImage['title'];
    elements['priv'].checked = currentImage['priv'];
    elements['view-pass'].placeholder = currentImage['view-pass'];
    if (!currentImage['priv']) elements['view-pass'].value = genPass();
    elements['author'].value = currentImage['author'];
    elements['copyright'].value = currentImage['copyright'];
    elements['nsfw'].checked = currentImage['nsfw'];
});

/* submit event */
frmUpload.addEventListener('submit', (e) => {
    e.preventDefault();

    changeButtonStatus('upload-submit', 'btn-amb', 'Processing...', true);

    const elements = e.currentTarget.elements;
    let data = new FormData();
    let invalid = [];

    /*
        value parsing with some validation, proper validation also happens server-side
        these are basically the things the user can do wrong without changing any HTML
    */

    /* if either is empty, or 'file' is wrong type, mark invalid, otherwise add to data */
    elements['title'].value === '' ?
        invalid.push('title') : data.append('title', elements['title'].value);
    elements['file'].files.length !== 1 || !elements['file'].files[0].type.startsWith('image/') ?
        invalid.push('file') : data.append('file', elements['file'].files[0]);

    data.append('view-pass', elements['priv'].checked ? elements['view-pass'].value : '');
    data.append('edit-pass', elements['edit-pass'].value);
    data.append('author', elements['author'].value);
    data.append('copyright', elements['copyright'].value);
    data.append('nsfw', elements['nsfw'].checked);

    /* if anything was invalid, handle it */
    if (invalid.length !== 0) {
        changeButtonStatus('upload-submit', 'btn-red', 'Validation Error', true);
        markInvalid('upload', invalid, () => {
            changeButtonStatus('upload-submit','btn-grn','Upload', false);
        });
        return; // end execution here, rather than trying the fetch request
    }

    makeRequest('/image/upload', { // make the request
        method: 'POST',
        body: data
    }, (retdata) => {
        /* prepare the success-upload popup */
        document.getElementById('success-upload-id').innerText = retdata['id'];
        document.getElementById('success-upload-edit-pass').innerText = data.get('edit-pass');
        document.getElementById('success-upload-view-pass').innerText = data.get('view-pass');
        document.getElementById('success-upload-view-pass-container').classList[
            data.get('view-pass') === '' ? 'add' : 'remove'
        ]('hide');

        displayPopup('success-upload', (err, ret) => {
            if (err) throw err;
            if (ret === 'display') { // corresponds to the 'show image' button
                getImage(retdata['id'], data.get('view-pass'), (err, imageData) => {
                    if (err) throw err;
                    currentImage = imageData;
                    displayImage();
                });
            }
        });

        resetForm('upload');
    }, 'upload', 'Upload');
});

document.getElementById('frm-view').addEventListener('submit', (e) => {
    e.preventDefault();

    changeButtonStatus('view-submit', 'btn-amb', 'Processing...', true);

    const elements = e.currentTarget.elements;
    if (elements['id'].value === '') {
        /* validation error iff there isn't an id */
        changeButtonStatus('view-submit', 'btn-red', 'Validation Error', true);
        markInvalid('view', ['id'], () => {
            changeButtonStatus('view-submit','btn-grn','View', false);
        });
        return;
    }

    getImage(elements['id'].value, elements['view-pass'].value, (err, imageData) => { // get the image data
        if (imageData['nsfw']) {
            /* confirm that the user wants to see an NSFW image */
            displayPopup('nsfw-view', (err, ret) => {
                if (ret === 'confirm') {
                    currentImage = imageData;
                    displayImage();
                }
            });
        } else {
            /* it the image is SFW, no warning */
            currentImage = imageData;
            displayImage();
        }
        resetForm('view');
    }, 'view', 'View', 'view-pass');
});

document.getElementById('frm-unlock').addEventListener('submit', (e) => {
    e.preventDefault();

    changeButtonStatus('unlock-submit', 'btn-amd', 'Processing...', true);

    if (e.currentTarget.elements['edit-pass'].value === '') {
        /* validation error if the only input is empty */
        changeButtonStatus('unlock-submit', 'btn-red', 'Validation Error', true);
        markInvalid('unlock', ['edit-pass'], () => {
            changeButtonStatus('unlock-submit','btn-grn','Unlock', false);
        });
        return;
    }
    
    const data = new FormData();
    data.append('id', currentImage['id']);
    data.append('edit-pass', e.currentTarget.elements['edit-pass'].value);

    makeRequest('/image/verify', {
        method: 'POST',
        body: data
    }, () => {

        /* get rid of the unlock form and display the update form */
        currentImage['edit-pass'] = data.get('edit-pass');
        hideForm('unlock');
        resetForm('unlock');
        hideForm('update', false);
        resetForm('update');
        closeForm('update', false);
    }, 'unlock', 'Unlock', 'edit-pass');
});

frmUpdate.addEventListener('submit', (e) => {
    e.preventDefault();

    changeButtonStatus('update-submit', 'btn-amb', 'Processing...', true);

    const elements = e.currentTarget.elements;
    let data = new FormData();
    data.append('id', currentImage['id']);
    data.append('edit-pass', currentImage['edit-pass']);

    if (elements['title'].value !== '') data.append('title', elements['title'].value);

    if (elements['file'].files.length === 1) {
        if (!elements['file'].files[0].type.startsWith('image/')) {
            /* validation error if the uploaded file, if it exists, is the wrong type */
            changeButtonStatus('update-submit', 'btn-red', 'Validation Error', true);
            markInvalid('update', ['file'], () => {
                changeButtonStatus('update-submit','btn-grn','Update', false);
            });
            return; // halt here instead of making fetch request
        }
        data.append('file', elements['file'].files[0]);
    }

    if (elements['priv'].checked) {
        if (elements['view-pass'].value !== '') data.append('view-pass', elements['view-pass'].value);
    } else {
        if (currentImage['priv']) data.append('view-pass', '');
    }

    if (elements['author'].value !== currentImage['author']) data.append('author', elements['author'].value);
    if (elements['copyright'].value !== currentImage['copyright'])
        data.append('copyright', elements['copyright'].value);
    if (elements['nsfw'].checked !== currentImage['nsfw']) data.append('nsfw', elements['nsfw'].checked);

    if (Array.from(data.entries()).length === 2) {
        /* if there is nothing to update, mark ALL inputs as invalid until ONE of them changes */
        changeButtonStatus('update-submit', 'btn-red', 'No Changes', true);
        for (let input of elements) {
            if (!input.name) continue; // because its a button or dropdown header or something
            input.classList.add('invalid');
            let handler = (e) => {
                for (let inputInner of elements) {
                    inputInner.classList.remove('invalid');
                    inputInner.removeEventListener('input', handler);
                }
                changeButtonStatus('update-submit', 'btn-grn', 'Update', false);
            };
            input.addEventListener('input', handler);
        }
        return;
    }

    makeRequest('/image/update', { // send the form data
        method: 'POST',
        body: data
    }, () => {
        getImage(data.get('id'), data.get('view-pass') || currentImage['view-pass'], (err, imageData) => {
            if (err) throw err;
            let pass = currentImage['edit-pass'];
            currentImage = imageData;
            currentImage['edit-pass'] = pass;
            displayImage();
        });
    }, 'update', 'Update');
});

/* misc */
document.getElementById('success-upload-download').addEventListener('click', (e) => {
    /* create and save a text file containing the ID and passcode(s) */

    let text = `ID: ${document.getElementById('success-upload-id').innerText}\n`;
    text += `Edit Passcode: ${document.getElementById('success-upload-edit-pass').innerText}\n`;

    const viewPass = document.getElementById('success-upload-view-pass').innerText;
    if (viewPass !== '') text += `View Passcode: ${viewPass}\n`;

    let dummyLink = document.createElement('a');
    dummyLink.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    dummyLink.setAttribute('download', 'Image Passcodes.txt');
    dummyLink.classList.add('hide');

    document.body.appendChild(dummyLink);
    dummyLink.click();
    document.body.removeChild(dummyLink);
});

document.getElementById('update-delete').addEventListener('click', (e) => {
    displayPopup('delete-confirm', (err, ret) => {
        if (err) throw err;
        if (ret === 'confirm') {
            let data = new FormData();
            data.append('id', currentImage['id']);
            data.append('edit-pass', currentImage['edit-pass']);

            makeRequest('/image/delete', {
                method: 'POST',
                body: data
            }, () => {
                unloadImage();
                displayPopup('delete-success', nop);
            });
        }
    });
});

/*
    === on page load ===
*/
populateField('upload-edit-pass', genPass());
populateField('upload-view-pass', genPass());
