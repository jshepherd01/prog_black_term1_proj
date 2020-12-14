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
    return new Promise ((resolve, reject) => {
        try {
            let buttonList = Array.from(document.getElementsByClassName(element.getAttribute('data-buttonclass')));
            let handler = event => {
                let trigger = event.trigger || event.srcElement;
                element.classList.add('hide');
                buttonList.forEach((i) => {i.removeEventListener('click', handler)});
                resolve(trigger.getAttribute('data-return'));
            }
            element.classList.remove('hide');
            buttonList.forEach((i) => {i.addEventListener('click', handler)});
        } catch (err) {
            reject(err);
        }
    });
}

/* element references */
const dropUpload = document.getElementById('drop-upload');
const dropView = document.getElementById('drop-view');
const frmUpload = document.getElementById('frm-upload');
const frmView = document.getElementById('frm-view');
const subUpload = document.getElementById('upload-submit');
const subView = document.getElementById('view-submit');
const buttonUploadFile = document.getElementById('upload-file-btn');
const inputUploadFile = document.getElementById('upload-file');
const previewUploadFile = document.getElementById('upload-file-name');
const toggleUploadPriv = document.getElementById('upload-priv-tog');
const checkUploadPriv = document.getElementById('upload-priv');
const containerUploadViewPass = document.getElementById('upload-view-pass-container');
const inputUploadEditPass = document.getElementById('upload-edit-pass');
const inputUploadViewPass = document.getElementById('upload-view-pass');
const refreshUploadEditPass = document.getElementById('upload-edit-pass-refresh');
const copyUploadEditPass = document.getElementById('upload-edit-pass-copy');
const refreshUploadViewPass = document.getElementById('upload-view-pass-refresh');
const copyUploadViewPass = document.getElementById('upload-view-pass-copy');
const buttonCollapsibleUpload = document.getElementById('clps-btn-upload');
const formCollapsibleUpload = document.getElementById('clps-frm-upload');
const toggleUploadNsfw = document.getElementById('upload-nsfw-tog');
const inputUploadNsfw = document.getElementById('upload-nsfw');

const popupServerDown = document.getElementById('server-down');

/* add e handlers */
dropUpload.addEventListener('click', (e) => {
    if (dropUpload.classList.contains("drop-btn-open")) {
        frmUpload.classList.remove("drop-frm-open");
        dropUpload.classList.remove("drop-btn-open");
    } else {
        frmUpload.classList.add("drop-frm-open");
        dropUpload.classList.add("drop-btn-open");
    }
})

dropView.addEventListener('click', (e) => {
    if (dropView.classList.contains("drop-btn-open")) {
        frmView.classList.remove("drop-frm-open");
        dropView.classList.remove("drop-btn-open");
    } else {
        frmView.classList.add("drop-frm-open");
        dropView.classList.add("drop-btn-open");
    }
})

frmUpload.addEventListener('submit', (e) => {
    e.preventDefault();

    subUpload.classList.remove('btn-grn');
    subUpload.classList.add('btn-amb');
    subUpload.value = 'Processing...';
    subUpload.disabled = true;

    const elements = frmUpload.elements;
    let data = {};
    let file;
    let invalid = [];

    /* some validation and value parsing */
    /* proper validation will happen server-side */

    if (elements['title'].value === "") {
        invalid.push('title');
    } else {
        data['title'] = elements['title'].value;
    }

    if (elements['file'].files.length !== 1) {
        invalid.push('file');
    } else if (!elements['file'].files[0].type.startsWith("image/")) {
        invalid.push('file');
    } else {
        file = elements['file'].files[0];
    }

    if (elements['priv'].checked) {
        if (elements['view-pass'].value === "") {
            invalid.push('view-pass');
        } else {
            data['view-pass'] = elements['view-pass'].value;
        }
    } else {
        data['view-pass'] = "";
    }

    data['edit-pass'] = elements['edit-pass'].value
    data['author'] = elements['author'].value
    data['copyright'] = elements['copyright'].value
    data['nsfw'] = elements['nsfw'].checked

    if (invalid.length === 0) {
        fetch('/image/upload-prep', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(resp => {
            subUpload.classList.remove('btn-amb');
            subUpload.classList.add('btn-grn');
            subUpload.value = 'Upload';
            subUpload.disabled = false;
            console.log(resp);
            return;
        }).catch(err => {
            subUpload.classList.remove('btn-amb');
            subUpload.classList.add('btn-red');
            subUpload.value = 'No Response';
            displayPopup(popupServerDown).then((ret) => {
                subUpload.classList.remove('btn-red');
                subUpload.classList.add('btn-grn');
                subUpload.value = 'Upload';
                subUpload.disabled = false;
                if (ret === "retry") {
                    frmUpload.dispatchEvent(new SubmitEvent('submit'));
                }
            });
        })
    } else {
        subUpload.classList.remove('btn-amb');
        subUpload.classList.add('btn-grn');
        subUpload.value = 'Upload';
        subUpload.disabled = false;
        console.log(invalid);
    }
})

buttonUploadFile.addEventListener('click', (e) => {
    inputUploadFile.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    }))
})

inputUploadFile.addEventListener('change', (e) => {
    let pathArray = inputUploadFile.value.split("\\")
    previewUploadFile.innerText = pathArray[pathArray.length - 1];
})

toggleUploadPriv.addEventListener('click', (e) => {
    checkUploadPriv.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    }))
})

checkUploadPriv.addEventListener('change', (e) => {
    if (!checkUploadPriv.checked) {
        toggleUploadPriv.firstElementChild.innerText = "close";
        containerUploadViewPass.classList.add('hide');
    } else {
        toggleUploadPriv.firstElementChild.innerText = "check";
        containerUploadViewPass.classList.remove('hide');
    }
})

refreshUploadEditPass.addEventListener('click', (e) => {
    inputUploadEditPass.value = genPass();
})

inputUploadEditPass.addEventListener('click', (e) => {
    copyUploadEditPass.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    }))
})

copyUploadEditPass.addEventListener('click', (e) => {
    inputUploadEditPass.select();
    inputUploadEditPass.setSelectionRange(0,24);
    document.execCommand('copy');
})

refreshUploadViewPass.addEventListener('click', (e) => {
    inputUploadViewPass.value = genPass();
})

inputUploadViewPass.addEventListener('click', (e) => {
    copyUploadViewPass.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    }))
})

copyUploadViewPass.addEventListener('click', (e) => {
    inputUploadViewPass.select();
    inputUploadViewPass.setSelectionRange(0,24);
    document.execCommand('copy');
})

buttonCollapsibleUpload.addEventListener('click', (e) => {
    if (!formCollapsibleUpload.classList.contains('hide')) {
        buttonCollapsibleUpload.innerText = "Show More Options";
        formCollapsibleUpload.classList.add('hide');
    } else {
        buttonCollapsibleUpload.innerText = "Show Fewer Options";
        formCollapsibleUpload.classList.remove('hide');
    }
})

toggleUploadNsfw.addEventListener('click', (e) => {
    inputUploadNsfw.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    }))
})

inputUploadNsfw.addEventListener('click', (e) => {
    if (!inputUploadNsfw.checked) {
        toggleUploadNsfw.firstElementChild.innerText = "close";
    } else {
        toggleUploadNsfw.firstElementChild.innerText = "check";
    }
})

/* load event */
window.addEventListener('load', (e) => {
    inputUploadEditPass.value = genPass();
    inputUploadViewPass.value = genPass();
})
