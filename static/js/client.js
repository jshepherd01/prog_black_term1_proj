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
        cb(trigger.getAttribute('data-return')); // pass the button's return value to the callback
    };
   
    buttonList.forEach((i) => {i.addEventListener('click', handler)});  // attach the handler to each button
    modal.classList.remove('hide'); // display the modal
}

const nop = ()=>{}; // do nothing (e.g. for callbacks)

/* error definitions */
class ValidationError extends Error {
    /* for when validation of any user input fails */
    /* allows this to be moved to the catch block(s) for readability */
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

class ServerError extends Error {
    /* for when the server returns any code except 2XX */
    constructor(message) {
        super(message);
        this.name = 'ServerError';
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

/* view form */
const dropView = document.getElementById('drop-view');
const frmView = document.getElementById('frm-view');
const infoView = document.getElementById('view-info');

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
    /* copies the contents of a text field to the clipboard */

    const field = document.getElementById(fieldId); // get the field
    field.select(); // highlight the text in it
    field.setSelectionRange(0,999); // highlight the entire text (for mobile)
    document.execCommand('copy'); // copy it
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

/* attach event handlers */

/* upload form */
dropUpload.addEventListener('click', (e) => {dropClick(e, 'frm-upload')});
infoUpload.addEventListener('click', (e) => displayPopup('info-upload', nop));
buttonUploadFile.addEventListener('click', (e) => {transferClick(e, 'upload-file')});
inputUploadFile.addEventListener('change', (e) => {fileChange(e, 'upload-file-name')});
toggleUploadPriv.addEventListener('click', (e) => {transferClick(e, 'upload-priv')});
inputUploadPriv.addEventListener('change', (e) => {
    checkboxChangeMsg(e, 'upload-priv-msg', 'check', 'close');
    checkboxChangeClps(e, 'upload-view-pass-container');
});
refreshUploadEditPass.addEventListener('click', (e) => {refreshGenPass(e, 'upload-edit-pass')});
inputUploadEditPass.addEventListener('click', (e) => {transferClick(e, 'upload-edit-pass-copy')});
copyUploadEditPass.addEventListener('click', (e) => {copyField(e, 'upload-edit-pass')});
refreshUploadViewPass.addEventListener('click', (e) => {refreshGenPass(e, 'upload-view-pass')});
inputUploadViewPass.addEventListener('click', (e) => {transferClick(e, 'upload-view-pass-copy')});
copyUploadViewPass.addEventListener('click', (e) => {copyField(e, 'upload-view-pass')});
buttonCollapsibleUpload.addEventListener('click', (e) => {
    checkboxChangeMsg(e, 'clps-upload-msg', 'Show Fewer Options', 'Show More Options');
    checkboxChangeClps(e, 'clps-frm-upload');
});
toggleUploadNsfw.addEventListener('click', (e) => {transferClick(e, 'upload-nsfw')});
inputUploadNsfw.addEventListener('click', (e) => {checkboxChangeMsg(e, 'upload-nsfw-msg', 'check', 'close')});

/* view form */
dropView.addEventListener('click', (e) => {dropClick(e, 'frm-view')});
infoView.addEventListener('click', (e) => displayPopup('info-view', nop));

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

    data.append('view-pass', elements['priv'].checked ? elements['view-pass'].value : '');
    data.append('edit-pass', elements['edit-pass'].value);
    data.append('author', elements['author'].value);
    data.append('copyright', elements['copyright'].value);
    data.append('nsfw', elements['nsfw'].checked);

    if (invalid.length !== 0) {
        changeButtonStatus('upload-submit', 'btn-red', 'Validation Error', true);
        markInvalid('upload', invalid, () => {
            changeButtonStatus('upload-submit','btn-grn','Upload', false);
        });
        return;
    }

    fetch('/image/upload', {
        method: 'POST',
        body: data
    }).catch(err => {
        throw new ConnectionError('The server did not respond.');
    }).then(resp => {
        switch (resp.status) {
            case 200:
            case 400:
                return resp.json();
            default:
                throw new ServerError('An unspecified error occurred.');
        }
    }).then (data => {
        if (data['error-type'] == 'ValidationError') {
            throw new ValidationError(data.invalid);
        }
        changeButtonStatus('upload-submit','btn-grn','Upload',false);
        // TODO
        console.log(data);
    }).catch(err => {
        switch (err.name) {
            case 'ConnectionError': {
                changeButtonStatus('upload-submit','btn-red','Connection Error',true);
                displayPopup('server-down', (ret) => {
                    changeButtonStatus('upload-submit','btn-grn','Upload',false);
                    if (ret === 'retry') {
                        // officially this should use SubmitEvent, but that isn't fully supported
                        // Event isn't fully supported either but that's just IE so it can do one
                        frmUpload.dispatchEvent(new Event('submit'));
                    }
                });
                break;
            }
            case 'ServerError': {
                changeButtonStatus('upload-submit','btn-red','Server Error',true);
                displayPopup('server-error', (ret) => {
                    changeButtonStatus('upload-submit','btn-grn','Upload',false);
                    if (ret === 'retry') {
                        // officially this should use SubmitEvent, but that isn't fully supported
                        // Event isn't fully supported either but that's just IE so it can do one
                        frmUpload.dispatchEvent(new Event('submit'));
                    }
                });
                break;
            }
            case 'ValidationError': {
                changeButtonStatus('upload-submit', 'btn-red', 'Validation Error', true);
                markInvalid('upload', [err.message], () => {
                    changeButtonStatus('upload-submit','btn-grn','Upload', false);
                });
                break;
            }
            default:
                break;
        }
    });
});

frmView.addEventListener('submit', (e) => {
    e.preventDefault();

    // TODO
});

/* load event */
window.addEventListener('load', (e) => {
    inputUploadEditPass.value = genPass();
    inputUploadViewPass.value = genPass();
});
