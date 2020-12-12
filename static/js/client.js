/* function definitions */
function genPass() {
    /* Generate a cryptographically random passcode */

    // get 18 random numerical values
    let buf = new Uint8Array(18);
    window.crypto.getRandomValues(buf);

    // convert the values to base64 ([a-zA-Z0-9+/])
    return btoa(String.fromCharCode.apply(null,buf));
}


/* element references */
const dropUpload = document.getElementById('drop-upload');
const dropView = document.getElementById('drop-view');
const frmUpload = document.getElementById('frm-upload');
const frmView = document.getElementById('frm-view');
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

/* add event handlers */
dropUpload.addEventListener('click', (event) => {
    if (dropUpload.classList.contains("drop-btn-open")) {
        frmUpload.classList.remove("drop-frm-open");
        dropUpload.classList.remove("drop-btn-open");
    } else {
        frmUpload.classList.add("drop-frm-open");
        dropUpload.classList.add("drop-btn-open");
    }
})

dropView.addEventListener('click', (event) => {
    if (dropView.classList.contains("drop-btn-open")) {
        frmView.classList.remove("drop-frm-open");
        dropView.classList.remove("drop-btn-open");
    } else {
        frmView.classList.add("drop-frm-open");
        dropView.classList.add("drop-btn-open");
    }
})

buttonUploadFile.addEventListener('click', (event) => {
    inputUploadFile.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    }))
})

inputUploadFile.addEventListener('change', (event) => {
    let pathArray = inputUploadFile.value.split("\\")
    previewUploadFile.innerText = pathArray[pathArray.length - 1];
})

toggleUploadPriv.addEventListener('click', (event) => {
    checkUploadPriv.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    }))
})

checkUploadPriv.addEventListener('change', (event) => {
    if (!checkUploadPriv.checked) {
        toggleUploadPriv.firstElementChild.innerText = "close";
        containerUploadViewPass.classList.add('hide');
    } else {
        toggleUploadPriv.firstElementChild.innerText = "check";
        containerUploadViewPass.classList.remove('hide');
    }
})

refreshUploadEditPass.addEventListener('click', (event) => {
    inputUploadEditPass.value = genPass();
})

inputUploadEditPass.addEventListener('click', (event) => {
    copyUploadEditPass.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    }))
})

copyUploadEditPass.addEventListener('click', (event) => {
    inputUploadEditPass.select();
    inputUploadEditPass.setSelectionRange(0,24);
    document.execCommand('copy');
})

refreshUploadViewPass.addEventListener('click', (event) => {
    inputUploadViewPass.value = genPass();
})

inputUploadViewPass.addEventListener('click', (event) => {
    copyUploadViewPass.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    }))
})

copyUploadViewPass.addEventListener('click', (event) => {
    inputUploadViewPass.select();
    inputUploadViewPass.setSelectionRange(0,24);
    document.execCommand('copy');
})

buttonCollapsibleUpload.addEventListener('click', (event) => {
    if (!formCollapsibleUpload.classList.contains('hide')) {
        buttonCollapsibleUpload.innerText = "Show More Options";
        formCollapsibleUpload.classList.add('hide');
    } else {
        buttonCollapsibleUpload.innerText = "Show Fewer Options";
        formCollapsibleUpload.classList.remove('hide');
    }
})

toggleUploadNsfw.addEventListener('click', (event) => {
    inputUploadNsfw.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    }))
})

inputUploadNsfw.addEventListener('click', (event) => {
    if (!inputUploadNsfw.checked) {
        toggleUploadNsfw.firstElementChild.innerText = "close";
    } else {
        toggleUploadNsfw.firstElementChild.innerText = "check";
    }
})

/* load event */
window.addEventListener('load', (event) => {
    inputUploadEditPass.value = genPass();
    inputUploadViewPass.value = genPass();
})
