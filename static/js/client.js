/* function definitions */
function genPass() {
    /* Generate a cryptographically random passcode */

    // get 18 random numerical values
    let buf = new Uint8Array(18);
    window.crypto.getRandomValues(buf);

    // convert the values to base64 ([a-zA-Z0-9+/])
    return btoa(String.fromCharCode.apply(null,buf));
}

function displayPopup(element) {
    /* Display the specified modal */
    return new Promise ((resolve, reject) => {
        try {
            // get a list of buttons in the modal
            let buttonList = Array.from(document.getElementsByClassName(element.getAttribute('data-buttonclass')));
            
            // create an event handler for each button
            let handler = event => {
                let trigger = event.trigger;

                // hide the modal
                element.classList.add('hide');

                // remove these handlers from all buttons in the modal
                buttonList.forEach((i) => {i.removeEventListener('click', handler)});

                // resolve the promise, returning a value depending on which button was clicked
                resolve(trigger.getAttribute('data-return'));
            };
            // add the handlers to the buttons
            buttonList.forEach((i) => {i.addEventListener('click', handler)});

            // display the modal
            element.classList.remove('hide');
        } catch (err) {
            // if there were any errors, trigger the promise's .catch() block
            reject(err);
        }
    });
}

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
// this is an absolute mess. TODO: clean this shit up
const dropUpload = document.getElementById('drop-upload');
const dropView = document.getElementById('drop-view');
const frmUpload = document.getElementById('frm-upload');
const frmView = document.getElementById('frm-view');
const subUpload = document.getElementById('upload-submit');
const subView = document.getElementById('view-submit');
const buttonUploadFile = document.getElementById('upload-file-btn');
const inputUploadFile = document.getElementById('upload-file');
const toggleUploadPriv = document.getElementById('upload-priv-tog');
const checkUploadPriv = document.getElementById('upload-priv');
const inputUploadEditPass = document.getElementById('upload-edit-pass');
const inputUploadViewPass = document.getElementById('upload-view-pass');
const refreshUploadEditPass = document.getElementById('upload-edit-pass-refresh');
const copyUploadEditPass = document.getElementById('upload-edit-pass-copy');
const refreshUploadViewPass = document.getElementById('upload-view-pass-refresh');
const copyUploadViewPass = document.getElementById('upload-view-pass-copy');
const buttonCollapsibleUpload = document.getElementById('clps-btn-upload');
const toggleUploadNsfw = document.getElementById('upload-nsfw-tog');
const inputUploadNsfw = document.getElementById('upload-nsfw');
const popupServerDown = document.getElementById('server-down');

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

/* add event handlers */

dropUpload.addEventListener('click', (e) => {dropClick(e, 'frm-upload')});
dropView.addEventListener('click', (e) => {dropClick(e, 'frm-view')});

frmUpload.addEventListener('submit', (e) => {
    e.preventDefault(); // stop regular submission

    subUpload.classList.remove('btn-grn'); // disable the submit button
    subUpload.classList.add('btn-amb'); // while the code thinks about it
    subUpload.value = 'Processing...';
    subUpload.disabled = true;

    const elements = frmUpload.elements; // get the elements in the form
    let data = new FormData(); // parse them into a FormData with some checks
    let invalid = []; // list of invalid entries, by name

    /* some validation and value parsing */
    /* proper validation will happen server-side */

    if (elements['title'].value === '') {
        invalid.push('title');
    } else {
        data.append('title', elements['title'].value);
    }

    // if (elements['file'].files.length !== 1) {
    //     invalid.push('file');
    // } else if (!elements['file'].files[0].type.startsWith('image/')) {
    //     invalid.push('file');
    // } else {
        data.append('file', elements['file'].files[0]);
    // }

    data.append('view-pass', elements['priv'].checked ? elements['view-pass'].value : '');
    data.append('edit-pass', elements['edit-pass'].value);
    data.append('author', elements['author'].value);
    data.append('copyright', elements['copyright'].value);
    data.append('nsfw', elements['nsfw'].checked);

    if (invalid.length !== 0) {
        subUpload.classList.remove('btn-amb');
        subUpload.classList.add('btn-red');
        subUpload.value = 'Validation Error';

        invalid.forEach((input) => {
            elements[input].classList.add('invalid');
            let handler = (e) => {
                let index = invalid.indexOf(input);
                if (index > -1) {
                    invalid.splice(index,1);
                }
                elements[input].removeEventListener('change', handler);
                elements[input].classList.remove('invalid');
                if (invalid.length === 0) {
                    subUpload.classList.remove('btn-red');
                    subUpload.classList.add('btn-grn');
                    subUpload.value = 'Upload';
                    subUpload.disabled = false;
                }
            };
            elements[input].addEventListener('change', handler);
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
                return resp.json();
            case 400:
                throw new ValidationError('An input was invalid');
            default:
                throw new ServerError('An unspecified error occurred.');
        }
    }).then (data => {
        subUpload.classList.remove('btn-amb');
        subUpload.classList.add('btn-grn');
        subUpload.value = 'Upload';
        subUpload.disabled = false;
        console.log(data);
    }).catch(err => {
        switch (err.name) {
            case 'ConnectionError':
                subUpload.classList.remove('btn-amb');
                subUpload.classList.add('btn-red');
                subUpload.value = 'Connection Error';
                displayPopup(popupServerDown).then((ret) => {
                    subUpload.classList.remove('btn-red');
                    subUpload.classList.add('btn-grn');
                    subUpload.value = 'Upload';
                    subUpload.disabled = false;
                    if (ret === 'retry') {
                        // officially this should use SubmitEvent, but that isn't fully supported
                        // Event isn't fully supported either but that's just IE so it can do one
                        frmUpload.dispatchEvent(new Event('submit'));
                    }
                });
                break;
            case 'ValidationError':
                subUpload.classList.remove('btn-amb');
                subUpload.classList.add('btn-red');
                subUpload.value = 'Validation Error';

                invalid.forEach((input) => {
                    elements[input].classList.add('invalid');
                    let handler = (e) => {
                        let index = invalid.indexOf(input);
                        if (index > -1) {
                            invalid.splice(index,1);
                        }
                        elements[input].removeEventListener('change', handler);
                        elements[input].classList.remove('invalid');
                        if (invalid.length === 0) {
                            subUpload.classList.remove('btn-red');
                            subUpload.classList.add('btn-grn');
                            subUpload.value = 'Upload';
                            subUpload.disabled = false;
                        }
                    };
                    elements[input].addEventListener('change', handler);
                });
                break;
            default:
                break;
        }
    });
});

buttonUploadFile.addEventListener('click', (e) => {transferClick(e, 'upload-file')});

inputUploadFile.addEventListener('change', (e) => {fileChange(e, 'upload-file-name')});

toggleUploadPriv.addEventListener('click', (e) => {transferClick(e, 'upload-priv')});

checkUploadPriv.addEventListener('change', (e) => {
    checkboxChangeMsg(e, 'upload-priv-msg', 'check', 'close');
    checkboxChangeClps(e, 'upload-view-pass-container');
});

refreshUploadEditPass.addEventListener('click', (e) => {refreshGenPass(e, 'upload-edit-pass')});

inputUploadEditPass.addEventListener('click', (e) => {transferClick(e, 'upload-edit-pass-copy')});

copyUploadEditPass.addEventListener('click', (e) => {copyField(e, 'upload-edit-pass')});

refreshUploadViewPass.addEventListener('click', (e) => {refreshGenPass(e, 'upload-view-pass')});

inputUploadViewPass.addEventListener('click', (e) => {transferClick(e, 'upload-view-pass-copy')});

copyUploadViewPass.addEventListener('click', (e) => {copyField(e, 'upload-edit-pass')});

buttonCollapsibleUpload.addEventListener('click', (e) => {
    checkboxChangeMsg(e, 'clps-upload-msg', 'Show Fewer Options', 'Show More Options');
    checkboxChangeClps(e, 'clps-frm-upload');
});

toggleUploadNsfw.addEventListener('click', (e) => {transferClick(e, 'upload-nsfw')});

inputUploadNsfw.addEventListener('click', (e) => {checkboxChangeMsg(e, 'upload-nsfw-msg', 'check', 'close')});

/* load event */
window.addEventListener('load', (e) => {
    inputUploadEditPass.value = genPass();
    inputUploadViewPass.value = genPass();
});
