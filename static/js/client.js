/* function definitions */
function genPass() {
    /* Generate a cryptographically random passcode */

    // get 18 random numerical values
    let buf = new Uint8Array(18);
    window.crypto.getRandomValues(buf);

    // convert the values to base64 ([a-zA-Z0-9+/])
    return btoa(String.fromCharCode.apply(null,buf));
}

function displayPopup(popupId, cb) {
    /* Display the specified modal */
    
    const modal = document.getElementById(popupId); // get the modal
    let buttonList = Array.from(document.getElementsByClassName(modal.getAttribute('data-buttonclass'))); // get a list of buttons in the modal
    
    let handler = event => { // create an event handler for each button
        let trigger = event.currentTarget; // get the button that was clicked
        modal.classList.add('hide'); // hide the modal
        buttonList.forEach((i) => {i.removeEventListener('click', handler)}); // remove the handler from each button
        cb(null, trigger.getAttribute('data-return')); // pass the button's return value to the callback
    };
   
    buttonList.forEach((i) => {i.addEventListener('click', handler)});  // attach the handler to each button
    modal.classList.remove('hide'); // display the modal
}

const nop = ()=>{}; // do nothing (e.g. for callbacks)

/* error definitions */
class ServerError extends Error {
    /* for when the server returns any code except 2XX */
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

/* element references */

/* upload form */
const dropUpload = document.getElementById('drop-upload');
const frmUpload = document.getElementById('frm-upload');
const infoUpload = document.getElementById('upload-info');
const buttonUploadFile = document.getElementById('upload-file-btn');
const inputUploadFile = document.getElementById('upload-file');
const toggleUploadPriv = document.getElementById('upload-priv-tog');
const inputUploadPriv = document.getElementById('upload-priv');
const inputUploadEditPass = document.getElementById('upload-edit-pass');
const inputUploadViewPass = document.getElementById('upload-view-pass');
const refreshUploadEditPass = document.getElementById('upload-edit-pass-refresh');
const copyUploadEditPass = document.getElementById('upload-edit-pass-copy');
const refreshUploadViewPass = document.getElementById('upload-view-pass-refresh');
const copyUploadViewPass = document.getElementById('upload-view-pass-copy');
const buttonCollapsibleUpload = document.getElementById('clps-btn-upload');
const toggleUploadNsfw = document.getElementById('upload-nsfw-tog');
const inputUploadNsfw = document.getElementById('upload-nsfw');

/* successful upload modal */
const successDisplayID = document.getElementById('success-upload-id');
const successDisplayEdit = document.getElementById('success-upload-edit-pass');
const successDisplayView = document.getElementById('success-upload-view-pass');
const successCopyID = document.getElementById('success-upload-id-copy');
const successCopyEdit = document.getElementById('success-upload-edit-copy');
const successCopyView = document.getElementById('success-upload-view-copy');
const successDownload = document.getElementById('success-upload-download');

/* view form */
const dropView = document.getElementById('drop-view');
const frmView = document.getElementById('frm-view');
const infoView = document.getElementById('view-info');

/* unlock form */
const dropUnlock = document.getElementById('drop-unlock');
const frmUnlock = document.getElementById('frm-unlock');
const infoUnlock = document.getElementById('unlock-info');

/* define event handlers */
const dropClick = (e, formId) => {
    /* handles clicks on form header buttons */

    const trigger = e.currentTarget; // get the button
    const form = document.getElementById(formId); // and the form

    if (trigger.classList.contains('drop-btn-open')) { // if the form is open, close it
        form.classList.remove('drop-frm-open'); // remove the open classes
        trigger.classList.remove('drop-btn-open');
    } else { // otherwise, open it
        form.classList.add('drop-frm-open'); // add the open classes
        trigger.classList.add('drop-btn-open');
    }
};

const transferClick = (e, elemId) => {
    /* handles clicks on elements that should act like clicks on other elements */

    const elem = document.getElementById(elemId); // get the element
    elem.dispatchEvent(new MouseEvent('click')); // click on it
};

const fileChange = (e, prevId) => {
    /* handles change events on file inputs */

    const prev = document.getElementById(prevId); // get the preview area
    const pathArray = e.currentTarget.value.split('\\'); // get the path and split it by '/'
    prev.innerText = pathArray[pathArray.length - 1]; // display the end of the path (i.e. the filename)
};

const checkboxChangeMsg = (e, msgboxId, msgT, msgF) => {
    /* handles change events on a checkbox that is tied to a message box */

    const msgbox = document.getElementById(msgboxId); // get the message box
    msgbox.innerText = e.currentTarget.checked ? msgT : msgF; // change its contents
};

const checkboxChangeClps = (e, clpsId) => {
    /* handles change events on a checkbox that is tied to a collapsible */

    const clps = document.getElementById(clpsId); // get the collapsible
    e.currentTarget.checked ? clps.classList.remove('hide') : clps.classList.add('hide'); // show or hide it
};

const refreshGenPass = (e, fieldId) => {
    /* handles clicks of the 'refresh' button for auto-generated passcode fields */

    const field = document.getElementById(fieldId); // get the passcode field
    field.value = genPass(); // generate a new passcode
    field.dispatchEvent(new Event('change')); // trigger the change event
};

const copyField = (e, fieldId) => {
    /* copies the contents of an element to the clipboard */

    const field = document.getElementById(fieldId); // get the field

    if (field.tagName === 'INPUT') { // if the field is an input
        field.select(); // highlight the text in it
        field.setSelectionRange(0,999); // highlight the entire text (for mobile)
        document.execCommand('copy'); // copy it
    } else { // otherwise, the above won't work
        let range = document.createRange();
        range.selectNode(field); // create a new area to highlight
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range); // unhighlight everything else, and highlight this
        document.execCommand('copy'); // copy it
    }
};

const changeButtonStatus = (buttonId, color, msg, disable) => {
    /* change the status of a submit button */

    const button = document.getElementById(buttonId); // get the button
    if (!button.classList.contains(color)) { // if the button is a different colour...
        button.classList.remove('btn-grn'); // remove all of the colour classes from it
        button.classList.remove('btn-amb');
        button.classList.remove('btn-red');
        button.classList.add(color); // add the one we actually want
    }
    button.value = msg; // change the message in the button
    button.disabled = disable; // enable or disable the button
};

const markInvalid = (formName, inputs, cb) => {
    /* mark certain inputs of a form as invalid */

    if (inputs.length > 1) { // if the issue is with multiple inputs
        inputs.forEach((input) => {
            let element = document.getElementById(`${formName}-${input}`); // get each one in turn
            element.classList.add('invalid'); // mark it as invalid
            let handler = (e) => { // create a handler for when it next changes
                let index = inputs.indexOf(input);
                if (index > -1) {
                    inputs.splice(index, 1); // remove this input from the list of invalid ones
                }
                element.removeEventListener('change', handler); // remove this handler
                element.classList.remove('invalid'); // and remove the 'invalid' mark
                if (inputs.length === 0) { // if this was the last input
                    cb(); // execute the callback function
                }
            };
            element.addEventListener('change', handler); // attach the handler
        });
    } else { // if there was only one problem, the handler is much simpler
        let element = document.getElementById(`${formName}-${inputs[0]}`); // get the problem input
        element.classList.add('invalid'); // mark it as invalid
        let handler = (e) => { // create the handler
            element.removeEventListener('change', handler); // remove this handler
            element.classList.remove('invalid'); // remove the invalid mark
            cb(); // execute the callback
        };
        element.addEventListener('change', handler); // add this handler
    }
};

const displayImage = (reqData, resData) => {
    /* changes the image display to show an image recieved from an /image/get request */

    const displayRow = document.getElementById('image-display-row');
    const displayImg = document.getElementById('display-image');

    displayRow.classList.remove('hide'); // show the display row
    displayImg.addEventListener('load', ()=> displayRow.scrollIntoView(true)); // once the image loads, scroll to the display row

    frmUnlock.setAttribute('data-id', reqData.get('id')); // set the image ID on the unlock form

    document.getElementById('display-title').innerText = resData['title']; // set title
    displayImg.setAttribute('src', '/image/embed?'+reqData.toString()); // set image

    if (resData['priv']) { // if the image is private, display the padlock
        document.getElementById('display-priv').classList.remove('hide');
    } else { // otherwise hide it
        document.getElementById('display-priv').classList.add('hide');
    }

    if (resData['author'] === '') { // if the image's author was set, display it
        document.getElementById('display-author').classList.add('hide');
    } else {
        const authorDisplay = document.getElementById('display-author');
        authorDisplay.classList.remove('hide');
        authorDisplay.firstElementChild.innerText = resData['author'];
    }

    if (resData['copyright'] === '') { // same for the image's copyright
        document.getElementById('display-copyright').classList.add('hide');
    } else {
        const authorDisplay = document.getElementById('display-copyright');
        authorDisplay.classList.remove('hide');
        authorDisplay.firstElementChild.innerText = resData['copyright'];
    }
};

const getImage = (imageID, viewPass, cb) => {
    /* get an image from the server, execute callback once it's there */

    let reqData = new URLSearchParams(); // build the request (validation happens beforehand)
    reqData.append('id', imageID);
    viewPass === '' ? nop : reqData.append('view-pass', viewPass);

    fetch('/image/get?' + reqData.toString(), {method: 'GET'}).catch(err => { // make the request
        throw new ConnectionError('The server did not respond'); // catch connection errors
    }).then(resp => {
        if (resp.status === 500) {
            throw new ServerError('An unexpected error occurred', 500, {}); // catch 500 errors
        } else {
            return resp.json();
        }
    }).then(resData => {
        if (resData['status'] !== 200) { // catch any other error
            throw new ServerError('The server returned an error.', resData['status'], resData);
        }
        cb(null, reqData, resData); // execute callback without error if everything was fine
    }).catch(err => {
        cb(err, reqData, null); // if everything was not fine, execute callback with the error
    });
};

/* attach event handlers */

/* upload form */
dropUpload.addEventListener('click', (e) => dropClick(e, 'frm-upload'));
infoUpload.addEventListener('click', (e) => displayPopup('info-upload', nop));
buttonUploadFile.addEventListener('click', (e) => transferClick(e, 'upload-file'));
inputUploadFile.addEventListener('change', (e) => fileChange(e, 'upload-file-name'));
toggleUploadPriv.addEventListener('click', (e) => transferClick(e, 'upload-priv'));
inputUploadPriv.addEventListener('change', (e) => {
    checkboxChangeMsg(e, 'upload-priv-msg', 'check', 'close');
    checkboxChangeClps(e, 'upload-view-pass-container');
});
refreshUploadEditPass.addEventListener('click', (e) => refreshGenPass(e, 'upload-edit-pass'));
inputUploadEditPass.addEventListener('click', (e) => transferClick(e, 'upload-edit-pass-copy'));
copyUploadEditPass.addEventListener('click', (e) => copyField(e, 'upload-edit-pass'));
refreshUploadViewPass.addEventListener('click', (e) => refreshGenPass(e, 'upload-view-pass'));
inputUploadViewPass.addEventListener('click', (e) => transferClick(e, 'upload-view-pass-copy'));
copyUploadViewPass.addEventListener('click', (e) => copyField(e, 'upload-view-pass'));
buttonCollapsibleUpload.addEventListener('change', (e) => {
    checkboxChangeMsg(e, 'clps-upload-msg', 'Show Fewer Options', 'Show More Options');
    checkboxChangeClps(e, 'clps-frm-upload');
});
toggleUploadNsfw.addEventListener('click', (e) => transferClick(e, 'upload-nsfw'));
inputUploadNsfw.addEventListener('change', (e) => checkboxChangeMsg(e, 'upload-nsfw-msg', 'check', 'close'));

/* successful upload modal */
successDisplayID.addEventListener('click', (e) => transferClick(e, 'success-upload-id-copy'));
successDisplayEdit.addEventListener('click', (e) => transferClick(e, 'success-upload-edit-copy'));
successDisplayView.addEventListener('click', (e) => transferClick(e, 'success-upload-view-copy'));
successCopyID.addEventListener('click', (e) => copyField(e, 'success-upload-id'));
successCopyEdit.addEventListener('click', (e) => copyField(e, 'success-upload-edit-pass'));
successCopyView.addEventListener('click', (e) => copyField(e, 'success-upload-view-pass'));

/* view form */
dropView.addEventListener('click', (e) => dropClick(e, 'frm-view'));
infoView.addEventListener('click', (e) => displayPopup('info-view', nop));

/* unlock form */
dropUnlock.addEventListener('click', (e) => dropClick(e, 'frm-unlock'));
infoUnlock.addEventListener('click', (e) => displayPopup('info-unlock', nop));

/* more complicated handlers */
frmUpload.addEventListener('submit', (e) => {
    e.preventDefault(); // stop regular submission

    changeButtonStatus('upload-submit', 'btn-amb', 'Processing...', true); // change the colour of the submit button

    const elements = frmUpload.elements; // get the elements in the form
    let data = new FormData(); // parse them into a FormData with some checks
    let invalid = []; // list of invalid entries, by name

    /* some validation and value parsing */
    /* proper validation will happen server-side */
    /* these are basically the things the user can do wrong without changing any HTML */

    if (elements['title'].value === '') {
        invalid.push('title');
    } else {
        data.append('title', elements['title'].value);
    }

    if (elements['file'].files.length !== 1) {
        invalid.push('file');
    } else if (!elements['file'].files[0].type.startsWith('image/')) {
        invalid.push('file');
    } else {
        data.append('file', elements['file'].files[0]);
    }

    // fill in the values for everything else
    data.append('view-pass', elements['priv'].checked ? elements['view-pass'].value : '');
    data.append('edit-pass', elements['edit-pass'].value);
    data.append('author', elements['author'].value);
    data.append('copyright', elements['copyright'].value);
    data.append('nsfw', elements['nsfw'].checked);

    // if anything was invalid, abort and tell the user
    if (invalid.length !== 0) {
        changeButtonStatus('upload-submit', 'btn-red', 'Validation Error', true);
        markInvalid('upload', invalid, () => {
            changeButtonStatus('upload-submit','btn-grn','Upload', false);
        });
        return;
    }

    fetch('/image/upload', { // send the form data
        method: 'POST',
        body: data
    }).catch(err => { // if it's already broken, throw a ConnectionError
        throw new ConnectionError('The server did not respond.');
    }).then(resp => {
        if (resp.status === 500) { // if there's a 500 error, we don't know anything about it so throw it directly
            throw new ServerError('An unspecified error occurred.', 500, {});
        } else { // otherwise, unpack the JSON before anything else
            return resp.json();
        }
    }).then (retdata => {
        if (retdata['status'] !== 200) { // if the status code isn't 200, throw an error about it
            throw new ServerError('The server returned an error.', retdata['status'], retdata);
        }
        changeButtonStatus('upload-submit','btn-grn','Upload',false); // make the button green again

        successDisplayID.innerText = retdata['id']; // populate the popup
        successDisplayEdit.innerText = data.get('edit-pass');
        if (data.get('view-pass') === '') { // if the image is public, don't display a view pass
            document.getElementById('success-upload-view-pass-container').classList.add('hide');
            successDisplayView.innerText = '';
        } else {
            document.getElementById('success-upload-view-pass-container').classList.remove('hide');
            successDisplayView.innerText = data.get('view-pass');
        }

        displayPopup('success-upload', (err, ret) => { // display the popup
            if (err) throw err;
            if (ret === 'display') { // if the user clicked 'show image'
                const callback = (err, reqData, resData) => { // create a callback function
                    if (err) { // if there was an error
                        if (err.name === 'ConnectionError') { // connection errors, tell the user to fix their internet
                            displayPopup('server-down', (err, ret) => {
                                if (ret === 'retry') {
                                    getImage(reqData.get('id'), reqData.get('view-pass'), callback);
                                }
                            });
                            return;
                        } else {
                            // any kind of 4XX error here is actually a symptom of a 5XX error
                            // so handle anything else like that
                            displayPopup('server-error', (err, ret) => {
                                if (ret === 'retry') {
                                    getImage(reqData.get('id'), reqData.get('view-pass'), callback);
                                }
                            });
                        }
                        return;
                    } else { // if there wasn't an error
                        displayImage(reqData, resData); // display the image
                        // if it's NSFW we don't need to tell the user because they already know
                    }
                };
                getImage(retdata['id'], data.get('view-pass'), callback);
            }
        });

        frmUpload.reset(); // reset the form
        inputUploadFile.dispatchEvent(new Event('change')); // dispatch change events
        refreshUploadEditPass.dispatchEvent(new MouseEvent('click')); // and refresh passcodes
        inputUploadPriv.dispatchEvent(new Event('change')); // as appropriate
        refreshUploadViewPass.dispatchEvent(new MouseEvent('click'));
        buttonCollapsibleUpload.dispatchEvent(new Event('change'));
        inputUploadNsfw.dispatchEvent(new Event('change'));

    }).catch(err => { // if any of the above made any errors, handle them here
        if (err.name === 'ConnectionError') { // connection errors, tell the user to fix their internet
            changeButtonStatus('upload-submit','btn-red','Connection Error',true);
            displayPopup('server-down', (err, ret) => {
                changeButtonStatus('upload-submit','btn-grn','Upload',false);
                if (ret === 'retry') {
                    // officially this should use SubmitEvent, but that isn't fully supported
                    // Event isn't fully supported either but that's just IE so it can do one
                    frmUpload.dispatchEvent(new Event('submit'));
                }
            });
            return; // close the thread once the error is handled

        } else if (err.name === 'ServerError') {
            switch (err.status) {
                case 400: // 400 means validation fail, so tell the user which fields they broke
                    // of course, if they get this error, it means they've been poking around with dev tools but w/e
                    changeButtonStatus('upload-submit', 'btn-red', 'Validation Error', true);
                    markInvalid('upload', err.details['invalid'], () => {
                        changeButtonStatus('upload-submit','btn-grn','Upload', false);
                    });
                    return;
            }
        }

        // generic response for anything else
        changeButtonStatus('upload-submit','btn-red','Server Error',true);
        displayPopup('server-error', (err, ret) => {
            changeButtonStatus('upload-submit','btn-grn','Upload',false);
            if (ret === 'retry') {
                frmUpload.dispatchEvent(new Event('submit'));
            }
        });
        return;
    });
});

successDownload.addEventListener('click', (e) => {
    /* create and save a text file containing the ID and passcode(s) */

    let text = `ID: ${successDisplayID.innerText}\n`; // create the string
    text += `Edit Passcode: ${successDisplayEdit.innerText}\n`;
    if (successDisplayView.innerText !== '') { // only add the view pass if one exists
        text += `View Passcode: ${successDisplayView.innerText}\n`;
    }
    let dummyLink = document.createElement('a'); // create a dummy download link
    dummyLink.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text)); // put the data in it
    dummyLink.setAttribute('download', 'Image Passcodes.txt'); // make it a download link and set the file name
    dummyLink.classList.add('hide'); // make sure the user doesn't see it

    document.body.appendChild(dummyLink); // put the link in the DOM
    dummyLink.click(); // click on it
    document.body.removeChild(dummyLink); // clear it away
});

frmView.addEventListener('submit', (e) => {
    e.preventDefault();

    changeButtonStatus('view-submit', 'btn-amb', 'Processing...', true); // disable submit until done

    const elements = frmView.elements; // get a list of the elements

    if (elements['id'].value === '') { // if the ID is empty, tell the user to fill it in
        changeButtonStatus('view-submit', 'btn-red', 'Validation Error', true);
        markInvalid('view', ['id'], () => {
            changeButtonStatus('view-submit','btn-grn','View', false);
        });
        return;
    }

    getImage(elements['id'].value, elements['view-pass'].value, (err, reqData, resData) => { // get the image data
        if (err) { // if there was an error
            if (err.name === 'ConnectionError') { // connection errors, tell the user to fix their internet
                changeButtonStatus('view-submit','btn-red','Connection Error',true);
                displayPopup('server-down', (err, ret) => {
                    changeButtonStatus('view-submit','btn-grn','View',false);
                    if (ret === 'retry') {
                        // officially this should use SubmitEvent, but that isn't fully supported
                        // Event isn't fully supported either but that's just IE so it can do one
                        frmView.dispatchEvent(new Event('submit'));
                    }
                });
                return;
            } else if (err.name === 'ServerError') {
                switch (err.status) {
                    case 400: // handle validation fail
                        changeButtonStatus('view-submit', 'btn-red', 'Validation Error', true);
                        markInvalid('view', err.details['invalid'], () => {
                            changeButtonStatus('view-submit','btn-grn','View', false);
                        });
                        return;
                    
                    case 401: // handle authentication fail
                    case 403:
                        changeButtonStatus('view-submit', 'btn-red', 'Authentication Error', true);
                        markInvalid('view', ['view-pass'], () => {
                            changeButtonStatus('view-submit','btn-grn','View', false);
                        });
                        return;
                    
                    case 404: // handle not found
                        changeButtonStatus('view-submit', 'btn-red', 'Not Found', true);
                        markInvalid('view', ['id'], () => {
                            changeButtonStatus('view-submit','btn-grn','View', false);
                        });
                        return;
                }
            }
            // anything that hasn't been handled gets generic response
            changeButtonStatus('view-submit','btn-red','Server Error',true);
            displayPopup('server-error', (err, ret) => {
                changeButtonStatus('view-submit','btn-grn','View',false);
                if (ret === 'retry') {
                    frmView.dispatchEvent(new Event('submit'));
                }
            });
            return;
        } else { // if there wasn't an error
            changeButtonStatus('view-submit','btn-grn','View',false); // turn the button back to green

            if (resData['nsfw']) { // if the image was NSFW, confirm that the user wants to see it
                displayPopup('nsfw-view', (err, ret) => {
                    if (ret === 'confirm') { // if they do, show them it
                        displayImage(reqData, resData);
                    }
                });
            } else { // if it wasn't NSFW, display it without further warning
                displayImage(reqData, resData);
            }
    
            frmView.reset();
        }
    });
});

frmUnlock.addEventListener('submit', (e) => {
    e.preventDefault();

    if (frmUnlock.elements['edit-pass'].value === '') {
        changeButtonStatus('unlock-submit', 'btn-red', 'Validation Error', true);
        markInvalid('unlock', ['edit-pass'], () => {
            changeButtonStatus('unlock-submit','btn-grn','Unlock', false);
        });
        return;
    }
    
    const data = new FormData();
    data.append('id', frmUnlock.getAttribute('data-id'));
    data.append('edit-pass', frmUnlock.elements['edit-pass'].value);

    fetch('/image/verify', { // send the form data
        method: 'POST',
        body: data
    }).catch(err => { // if it's already broken, throw a ConnectionError
        throw new ConnectionError('The server did not respond.');
    }).then(resp => {
        if (resp.status === 500) { // if there's a 500 error, we don't know anything about it so throw it directly
            throw new ServerError('An unspecified error occurred.', 500, {});
        } else { // otherwise, unpack the JSON before anything else
            return resp.json();
        }
    }).then(retdata => {
        if (retdata['status'] !== 200) { // if the status code isn't 200, throw an error about it
            throw new ServerError('The server returned an error.', retdata['status'], retdata);
        }
        changeButtonStatus('unlock-submit','btn-grn','Unlock',false); // make the button green again

        // TODO
        console.log('unlocked');
    }).catch(err => {
        if (err.name === 'ConnectionError') { // connection errors, tell the user to fix their internet
            changeButtonStatus('unlock-submit', 'btn-red', 'Connection Error', true);
            displayPopup('server-down', (err, ret) => {
                changeButtonStatus('unlock-submit','btn-grn','Unlock',false);
                if (ret === 'retry') {
                    frmUnlock.dispatchEvent(new Event('submit'));
                }
            });
            return;
        } else if (err.name === 'ServerError') {
            switch (err.status) {
                case 400: // validation or authentication fail both mean the edit pass was wrong                
                case 403:
                    changeButtonStatus('unlock-submit', 'btn-red', 'Authentication Error', true);
                    markInvalid('unlock', ['edit-pass'], () => {
                        changeButtonStatus('unlock-submit','btn-grn','Unlock', false);
                    });
                    return;
            }
        }
        changeButtonStatus('unlock-submit', 'btn-red', 'Server Error', true);
        displayPopup('server-error', (err, ret) => {
            changeButtonStatus('unlock-submit','btn-grn','Unlock',false);
            if (ret === 'retry') {
                frmUnlock.dispatchEvent(new Event('submit'));
            }
        });
        return;
    });

});

/* load event */
window.addEventListener('load', (e) => {
    inputUploadEditPass.value = genPass();
    inputUploadViewPass.value = genPass();
});
